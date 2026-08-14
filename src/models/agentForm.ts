import {
    AgentStep,
    ConversationTurn,
    NativeAnswer,
    NativeQuestion,
    agentFormOptions,
} from "./types";

import {Config} from "./config";
import {Log} from "../utils/log";
import {AgentApiError} from "../services/agentErrors";
import {nextAgentTurn, startAgentSurvey} from "../services/agent.service";
import {
    DEFAULT_ANSWER_DELIMITER,
    encodeAnswer,
    toAgentStep,
} from "../services/agentQuestion.adapter";
import {scrapeInputs} from "../services/answerScrape";
import {applyPrimaryColor, generateContainer} from "../render/containerHelpers";
import {awaitUploadReady} from "../render/uploadHelpers";
import {renderActions, renderError, renderQuestions, renderSuccess} from "../services/questions.service";

/** How long a persisted session stays resumable. */
const RESUME_TTL_MS = 30 * 60 * 1000;

/** One automatic retry when /start's AI call fails (documented as transient). */
const START_RETRY_DELAY_MS = 1500;

type PersistedSession = {
    sessionId: string;
    conversation: ConversationTurn[];
    currentTurn: number;
    maxTurns: number;
    askedRefs: string[];
    questionHistory: NativeQuestion[];
    savedAt: number;
};

/**
 * Drives a dynamic (AGENT mode) survey.
 *
 * Unlike `Form`, there is no question list to fetch, no page graph to walk and
 * — critically — no `POST /sdk/feedback` call: the API persists each answer
 * before the AI call and publishes the completion event itself, so the only
 * thing this class owes the server is a well-formed turn loop.
 */
export class AgentForm {
    // SDK config
    private config: Config;
    private readonly log: Log;
    private readonly url: string;

    // Integration
    private readonly integrationId: string;
    private readonly publicKey: string;
    private readonly privateKey?: string;

    // Rendering
    private formOptionsConfig: agentFormOptions;
    private selector: string;
    private language: string;
    private product: any;
    private primaryColor?: string;

    // Conversation state
    private sessionId: string;
    private conversation: ConversationTurn[];
    private askedRefs: string[];
    private currentTurn: number;
    private maxTurns: number;
    private currentQuestion: NativeQuestion | null;
    private questionHistory: NativeQuestion[];

    // Guards
    private busy: boolean;
    private rateLimitTimer: any;

    // Public surface (mirrors Form so host code feels familiar)
    public progress: number;
    public total: number;
    public completed: boolean;
    public timeToCompleted: number;

    constructor(
        config: Config,
        integrationId: string,
        publicKey: string,
        privateKey?: string,
    ) {
        this.config = config;
        this.log = new Log(config);
        this.url = config.get("url") as string;

        this.integrationId = integrationId;
        this.publicKey = publicKey;
        this.privateKey = privateKey;

        this.formOptionsConfig = {
            addButton: true,
            sendButtonText: "Send",
            backButtonText: "Back",
            nextButtonText: "Next",
            addSuccessScreen: true,
            questionFormat: "standard",
            answerDelimiter: DEFAULT_ANSWER_DELIMITER,
            resume: true,
            allowBack: false,
            emptyAnswerText: "",
        };

        this.selector = "";
        this.language = "en";
        this.product = {customIcons: false};

        this.sessionId = "";
        this.conversation = [];
        this.askedRefs = [];
        this.currentTurn = 1;
        this.maxTurns = 0;
        this.currentQuestion = null;
        this.questionHistory = [];

        this.busy = false;
        this.rateLimitTimer = null;

        this.progress = 0;
        this.total = 0;
        this.completed = false;
        this.timeToCompleted = 0;
    }

    //===============================================
    // Public API
    //===============================================

    /**
     * Opens the session, renders the first question and wires the turn loop.
     *
     * @param selector container element id
     * @param options rendering options and lifecycle hooks
     */
    public async generate(selector: string, options: agentFormOptions = {}): Promise<void> {
        this.formOptionsConfig = {...this.formOptionsConfig, ...options};
        this.selector = selector;
        if (options.lang) this.language = options.lang;
        if (options.primaryColor) this.primaryColor = options.primaryColor;

        if (this.config.get<boolean>("dryRun")) {
            this.log.log("dryRun has no effect in agent mode: the server drives the conversation");
        }

        try {
            const restored = this.formOptionsConfig.resume !== false ? this.restore() : null;

            if (restored) {
                this.log.log(`Resuming agent session ${restored.sessionId} at turn ${restored.currentTurn}`);
                this.mountForm();
                this.renderStep();
            } else {
                const res = await this.startWithRetry();

                this.sessionId = res.sessionId;
                this.maxTurns = res.maxTurns;
                this.currentTurn = res.currentTurn ?? 1;
                this.total = Math.max(this.maxTurns - 1, 0);

                const step = toAgentStep(res, this.adapterContext());

                this.mountForm();

                if (step.kind === "END") {
                    // Defensive: a base first question could in theory be scrubbed.
                    await this.renderEnd(step);
                    if (this.formOptionsConfig.onLoadedEvent) {
                        await this.formOptionsConfig.onLoadedEvent({
                            loading: false,
                            progress: this.progress,
                            total: this.total,
                            sessionId: this.sessionId,
                            completed: true,
                        });
                    }
                    return;
                }

                this.acceptQuestion(step);
                this.renderStep();
                this.persist();
            }

            this.timeToCompleted = Date.now();

            if (this.formOptionsConfig.onLoadedEvent) {
                await this.formOptionsConfig.onLoadedEvent({
                    loading: false,
                    progress: this.progress,
                    total: this.total,
                    sessionId: this.sessionId,
                    formOptionsConfig: this.formOptionsConfig,
                });
            }
        } catch (e) {
            this.log.err(`Could not start the agent survey ${this.integrationId}:`, e);
            this.renderFatal(e);

            if (this.formOptionsConfig.onLoadedEvent) {
                await this.formOptionsConfig.onLoadedEvent({loading: false, error: e});
            }
        }
    }

    /** Submits the current answer and advances the conversation. */
    public async next(): Promise<void> {
        return this.runTurn();
    }

    /** Current answers scraped from the DOM, in the SDK's native shape. */
    public answer(): NativeAnswer[] {
        const form = document.getElementById(this.formId());
        return form ? scrapeInputs(form) : [];
    }

    public getConversation(): ConversationTurn[] {
        return [...this.conversation];
    }

    public getSessionId(): string {
        return this.sessionId;
    }

    /** Drops all local state and the persisted snapshot. */
    public reset(): void {
        this.sessionId = "";
        this.conversation = [];
        this.askedRefs = [];
        this.currentTurn = 1;
        this.maxTurns = 0;
        this.currentQuestion = null;
        this.questionHistory = [];
        this.busy = false;
        this.completed = false;
        this.progress = 0;
        this.clearRateLimitTimer();
        this.clearPersisted();
    }

    //===============================================
    // Turn loop
    //===============================================

    /**
     * One full round: scrape -> encode -> POST /next -> evaluate -> re-render.
     *
     * State is committed only AFTER the request succeeds, so a 429 or a dropped
     * connection leaves everything byte-identical to before the attempt and a
     * retry re-sends the very same request. Incrementing first would desync
     * `currentTurn` from the server's view and truncate the survey early via
     * the "agent stops at currentTurn >= maxTurns" rule.
     */
    private async runTurn(): Promise<void> {
        // Auto-advance (change handlers on RADIO/BOOLEAN/RATING), the submit
        // button and Enter-on-text can all fire within the same tick.
        if (this.busy || this.completed || !this.currentQuestion) return;

        this.busy = true;
        this.setSubmitDisabled(true);
        this.clearError();

        const question = this.currentQuestion;

        try {
            const formEl = document.getElementById(this.formId());
            const questionContainer = document.getElementById(this.questionsId());
            if (!formEl) throw new Error("Agent form not found");

            await awaitUploadReady(questionContainer);

            const answers = scrapeInputs(formEl);
            let lastAnswer = encodeAnswer(answers, question, this.formOptionsConfig.answerDelimiter);

            if (lastAnswer === "") {
                if (question.require) {
                    this.showError(this.formOptionsConfig.requiredMessage || "Please answer before continuing.");
                    return;
                }
                lastAnswer = this.formOptionsConfig.emptyAnswerText || "";
            }

            if (this.formOptionsConfig.beforeSubmitEvent) {
                await this.formOptionsConfig.beforeSubmitEvent({
                    loading: true,
                    progress: this.progress,
                    total: this.total,
                });
            }

            // Not appended yet — see the commit-after-success note above. At the
            // moment of the POST the transcript ends with the agent's question,
            // and the answer to it travels in `lastAnswer`.
            const pendingUserTurn: ConversationTurn = {
                role: "user",
                content: lastAnswer,
                questionType: question.type,
                questionRef: question.ref,
            };
            const nextTurn = this.currentTurn + 1;

            const res = await nextAgentTurn(this.url, {
                publicKey: this.publicKey,
                privateKey: this.privateKey,
                integrationId: this.integrationId,
                sessionId: this.sessionId,
                conversation: [...this.conversation],
                currentTurn: nextTurn,
                lastAnswer,
                lastQuestionRef: question.ref,
                askedRefs: [...this.askedRefs],
            }, this.log);

            // --- commit ---
            this.conversation.push(pendingUserTurn);
            this.currentTurn = res.currentTurn ?? nextTurn;
            if (res.maxTurns) this.maxTurns = res.maxTurns;
            this.total = Math.max(this.maxTurns - 1, 0);

            const step = toAgentStep(res, this.adapterContext());

            if (step.kind === "END") {
                await this.renderEnd(step);
                return;
            }

            // Cheap insurance against an infinite loop from a server-side bug.
            if (this.maxTurns > 0 && this.currentTurn > this.maxTurns + 1) {
                await this.renderEnd({
                    kind: "END",
                    reason: "MAX_TURNS",
                    currentTurn: this.currentTurn,
                    maxTurns: this.maxTurns,
                });
                return;
            }

            this.acceptQuestion(step);
            this.renderStep();
            this.persist();

            if (this.formOptionsConfig.onAgentTurnEvent) {
                await this.formOptionsConfig.onAgentTurnEvent({
                    turn: this.currentTurn,
                    maxTurns: this.maxTurns,
                    question: step.question,
                    isFromBase: step.isFromBase,
                    topic: step.topic,
                    coverageGaps: step.coverageGaps,
                    coverageSummary: step.coverageSummary,
                    conversation: this.getConversation(),
                });
            }

            if (this.formOptionsConfig.afterSubmitEvent) {
                await this.formOptionsConfig.afterSubmitEvent({
                    response: this.sessionId,
                    loading: false,
                    progress: this.progress,
                    total: this.total,
                    completed: false,
                    error: null,
                });
            }
        } catch (error) {
            await this.handleTurnError(error);
        } finally {
            if (!this.completed) {
                this.busy = false;
                if (!this.rateLimitTimer) this.setSubmitDisabled(false);
            }
        }
    }

    /**
     * A 429 keeps the current question on screen and counts down: thanks to
     * commit-after-success, retrying re-sends an identical request.
     */
    private async handleTurnError(error: any): Promise<void> {
        this.log.err(`An error occurred during the agent turn ${this.integrationId}:`, error);

        if (error instanceof AgentApiError && error.kind === "RATE_LIMITED") {
            this.startRateLimitCountdown(error.retryAfterMs || 60_000);
        } else {
            this.showError(this.errorMessageFor(error));
        }

        if (this.formOptionsConfig.afterSubmitEvent) {
            await this.formOptionsConfig.afterSubmitEvent({
                loading: false,
                progress: this.progress,
                total: this.total,
                completed: false,
                error,
            });
        }
    }

    /** Records a question into the transcript, refs and history. */
    private acceptQuestion(step: Extract<AgentStep, {kind: "QUESTION"}>): void {
        const question = step.question;

        // Base (admin-configured) refs must accumulate, or the agent re-asks them.
        if (step.isFromBase && question.ref && !this.askedRefs.includes(question.ref)) {
            this.askedRefs.push(question.ref);
        }

        this.conversation.push({
            role: "agent",
            content: question.title,
            questionType: question.type,
            questionRef: question.ref,
        });

        this.currentQuestion = question;
        this.questionHistory.push(question);
        this.progress = Math.max(this.currentTurn - 1, 0);
    }

    //===============================================
    // Rendering
    //===============================================

    private formId(): string {
        return "magicfeedback-agent-" + this.integrationId;
    }

    private questionsId(): string {
        return "magicfeedback-agent-questions-" + this.integrationId;
    }

    /** Builds the form shell once; each turn only swaps the questions container. */
    private mountForm(): void {
        const container = generateContainer(this.selector, this.integrationId);
        if (this.primaryColor) applyPrimaryColor(container, this.primaryColor);

        const form = document.createElement("form");
        form.classList.add("magicfeedback-form");
        form.classList.add("magicfeedback-agent-form");
        form.id = this.formId();
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            this.runTurn();
        });

        const questionContainer = document.createElement("div");
        questionContainer.classList.add("magicfeedback-questions");
        questionContainer.id = this.questionsId();
        form.appendChild(questionContainer);

        if (this.formOptionsConfig.addButton) {
            // 'MAGICSURVEY' is what makes renderActions append a Back button, so
            // the default ('MAGICFORM') gives us no dead back UI for free.
            form.appendChild(renderActions(
                this.formOptionsConfig.allowBack ? 'MAGICSURVEY' : 'MAGICFORM',
                () => this.back(),
                this.formOptionsConfig.sendButtonText,
                this.formOptionsConfig.backButtonText,
                this.formOptionsConfig.nextButtonText,
            ));
        }

        container.appendChild(form);
    }

    private renderStep(): void {
        const questionContainer = document.getElementById(this.questionsId());
        if (!questionContainer || !this.currentQuestion) return;

        questionContainer.innerHTML = "";

        // Exactly one question per turn, which means renderQuestions forwards the
        // `send` callback (it only does so when the list has length 1) and
        // auto-advance-on-select is live. Hence the `busy` lock in runTurn.
        const elements = renderQuestions(
            [this.currentQuestion],
            this.formOptionsConfig.questionFormat,
            this.language,
            this.product,
            () => this.runTurn(),
        );

        elements.forEach((element) => questionContainer.appendChild(element));
    }

    private async renderEnd(step: Extract<AgentStep, {kind: "END"}>): Promise<void> {
        this.completed = true;
        this.currentQuestion = null;
        this.busy = false;
        this.timeToCompleted = this.timeToCompleted ? Date.now() - this.timeToCompleted : 0;
        this.clearRateLimitTimer();
        this.clearPersisted();

        const container = document.getElementById("magicfeedback-container-" + this.integrationId);

        if (container && this.formOptionsConfig.addSuccessScreen !== false) {
            container.innerHTML = "";

            const message = step.reason === "BLOCKED"
                ? (this.formOptionsConfig.blockedMessage
                    || "Thanks for your time — we'll end the conversation here.")
                : (this.formOptionsConfig.successMessage
                    || "Thank you for your feedback!");

            const node = renderSuccess(message);
            // renderSuccess only sets `magicfeedback-success`, which no stylesheet
            // targets; `-success-message` is the class that is actually styled.
            node.classList.add("magicfeedback-success-message");
            node.classList.add("magicfeedback-agent-end");
            if (step.reason === "BLOCKED") node.classList.add("magicfeedback-agent-end--blocked");

            container.appendChild(node);
        }

        if (this.formOptionsConfig.onFinishEvent) {
            await this.formOptionsConfig.onFinishEvent({
                sessionId: this.sessionId,
                reason: step.reason,
                turns: this.currentTurn,
                maxTurns: this.maxTurns,
                conversation: this.getConversation(),
                coverageSummary: step.coverageSummary,
                timeToCompleted: this.timeToCompleted,
            });
        }

        if (this.formOptionsConfig.afterSubmitEvent) {
            await this.formOptionsConfig.afterSubmitEvent({
                response: this.sessionId,
                loading: false,
                progress: this.progress,
                total: this.total,
                completed: true,
                error: null,
            });
        }
    }

    /**
     * Client-only rewind. Opt-in (`allowBack`) because answers persist server
     * side BEFORE the AI call and there is no endpoint to retract them: going
     * back and re-answering leaves a duplicate stored answer for the same ref.
     */
    private async back(): Promise<void> {
        if (this.busy || this.completed) return;
        if (!this.formOptionsConfig.allowBack) return;
        if (this.questionHistory.length < 2) return;

        this.questionHistory.pop();                 // the question on screen
        this.conversation.pop();                    // its agent turn
        this.conversation.pop();                    // the answer that produced it

        this.currentQuestion = this.questionHistory[this.questionHistory.length - 1];
        this.currentTurn = Math.max(this.currentTurn - 1, 1);
        this.progress = Math.max(this.currentTurn - 1, 0);

        this.clearError();
        this.renderStep();
        this.persist();

        if (this.formOptionsConfig.onBackEvent) {
            await this.formOptionsConfig.onBackEvent({
                progress: this.progress,
                total: this.total,
            });
        }
    }

    private renderFatal(error: any): void {
        try {
            const container = generateContainer(this.selector, this.integrationId);
            container.appendChild(renderError(this.errorMessageFor(error)));
        } catch (e) {
            // The container itself is missing; the thrown error is already logged.
        }
    }

    private errorMessageFor(error: any): string {
        if (!(error instanceof AgentApiError)) return "Something went wrong. Please try again.";

        switch (error.kind) {
            case "AUTH":
                return "This survey is not available right now.";
            case "NOT_FOUND":
            case "BAD_CONFIG":
                return "This survey is not available right now.";
            case "AI_UNAVAILABLE":
                return "We couldn't start the survey. Please try again in a moment.";
            default:
                return "Something went wrong. Please try again.";
        }
    }

    //===============================================
    // Helpers
    //===============================================

    private adapterContext() {
        return {
            integrationId: this.integrationId,
            sessionId: this.sessionId,
            language: this.language,
            log: this.log,
        };
    }

    /** /start's AI failure is documented as transient, so retry it once. */
    private async startWithRetry() {
        const body = {
            publicKey: this.publicKey,
            privateKey: this.privateKey,
            integrationId: this.integrationId,
        };

        try {
            return await startAgentSurvey(this.url, body, this.log);
        } catch (e) {
            if (e instanceof AgentApiError && e.kind === "AI_UNAVAILABLE") {
                this.log.log("Retrying /start after a transient AI failure");
                await new Promise((resolve) => setTimeout(resolve, START_RETRY_DELAY_MS));
                return await startAgentSurvey(this.url, body, this.log);
            }
            throw e;
        }
    }

    private setSubmitDisabled(disabled: boolean): void {
        const button = document.getElementById("magicfeedback-submit") as HTMLButtonElement | null;
        if (button) button.disabled = disabled;
    }

    private clearError(): void {
        const container = document.getElementById(this.questionsId());
        container?.querySelectorAll(".magicfeedback-error").forEach((node) => node.remove());
    }

    private showError(message: string): void {
        const container = document.getElementById(this.questionsId());
        if (!container) return;
        this.clearError();
        container.insertBefore(renderError(message), container.firstChild);
    }

    private startRateLimitCountdown(waitMs: number): void {
        this.clearRateLimitTimer();
        this.setSubmitDisabled(true);

        let remaining = Math.ceil(waitMs / 1000);
        const template = this.formOptionsConfig.rateLimitMessage
            || "Too many requests. Retrying in {seconds}s…";

        const tick = () => {
            if (remaining <= 0) {
                this.clearRateLimitTimer();
                this.clearError();
                this.setSubmitDisabled(false);
                return;
            }
            this.showError(template.replace("{seconds}", String(remaining)));
            remaining -= 1;
        };

        tick();
        this.rateLimitTimer = setInterval(tick, 1000);
    }

    private clearRateLimitTimer(): void {
        if (this.rateLimitTimer) {
            clearInterval(this.rateLimitTimer);
            this.rateLimitTimer = null;
        }
    }

    //===============================================
    // Persistence (resume across a page reload)
    //===============================================

    private storageKey(): string {
        return `magicfeedback-agent-${this.integrationId}`;
    }

    /**
     * Every localStorage access is guarded: Safari private mode throws on
     * access, and a survey must not die because a snapshot could not be written.
     */
    private persist(): void {
        if (this.formOptionsConfig.resume === false) return;

        try {
            const snapshot: PersistedSession = {
                sessionId: this.sessionId,
                conversation: this.conversation,
                currentTurn: this.currentTurn,
                maxTurns: this.maxTurns,
                askedRefs: this.askedRefs,
                questionHistory: this.questionHistory,
                savedAt: Date.now(),
            };
            localStorage.setItem(this.storageKey(), JSON.stringify(snapshot));
        } catch (e) {
            this.log.log("Could not persist the agent session", e);
        }
    }

    private restore(): PersistedSession | null {
        try {
            const raw = localStorage.getItem(this.storageKey());
            if (!raw) return null;

            const snapshot = JSON.parse(raw) as PersistedSession;
            if (!snapshot?.sessionId || !snapshot.questionHistory?.length) return null;
            if (Date.now() - (snapshot.savedAt || 0) > RESUME_TTL_MS) {
                this.clearPersisted();
                return null;
            }

            this.sessionId = snapshot.sessionId;
            this.conversation = snapshot.conversation || [];
            this.currentTurn = snapshot.currentTurn || 1;
            this.maxTurns = snapshot.maxTurns || 0;
            this.askedRefs = snapshot.askedRefs || [];
            this.questionHistory = snapshot.questionHistory;
            this.currentQuestion = this.questionHistory[this.questionHistory.length - 1];
            this.total = Math.max(this.maxTurns - 1, 0);
            this.progress = Math.max(this.currentTurn - 1, 0);

            return snapshot;
        } catch (e) {
            this.log.log("Could not restore the agent session", e);
            return null;
        }
    }

    private clearPersisted(): void {
        try {
            localStorage.removeItem(this.storageKey());
        } catch (e) {
            // Nothing to do; the snapshot simply outlives the session.
        }
    }

    //===============================================
    // Used by Form's AGENT-mode delegation
    //===============================================

    /** Seeds the render context from an integration payload fetched by `Form`. */
    public applyIntegrationContext(
        formData: {lang?: string[]; product?: any; style?: Record<string, any>},
    ): void {
        if (formData?.lang?.length) this.language = formData.lang[0];
        if (formData?.product) this.product = formData.product;
        if (formData?.style?.primaryColor) this.primaryColor = formData.style.primaryColor;
    }
}
