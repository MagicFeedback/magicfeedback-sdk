import {agentFormOptions, FEEDBACKAPPANSWERTYPE, generateFormOptions, NativeAnswer, NativeFeedback, NativeQuestion, PreviewPageInput} from "./types";
import {AgentForm} from "./agentForm";

import {Config} from "./config";
import {Log} from "../utils/log";
import {getFollowUpQuestion, getForm, getSessionForm, sendFeedback, validateEmail} from "../services/request.service";
import {FormData} from "./formData";
import {renderActions, renderQuestions, renderStartMessage, renderSuccess} from "../services/questions.service";
import {awaitUploadReady, getUploadValues} from "../render/uploadHelpers";
import {applyDirection, applyPrimaryColor, generateContainer} from "../render/containerHelpers";
import {scrapeInputs} from "../services/answerScrape";
import {PageGraph} from "./pageGraphs";
import {Page} from "./page";
import {OperatorType, PageRoute, TransitionType} from "./pageRoute";
import {History} from "./History";
import {PageNode} from "./pageNode";
import {t} from "../services/i18n";
import {detectSurveyLang, toBaseAnswers} from "../services/surveyLang";

export class Form {
    /**
     * Attributes
     */
        // SDK Config
    private config: Config;
    private readonly log: Log;

    // Form options
    private formOptionsConfig: generateFormOptions;
    private selector: string;

    // Integration attributes
    private readonly appId: string;
    private readonly publicKey: string;
    private readonly url: string;

    // Form completed data
    private formData: FormData | null;
    private id: string;

    // Language the survey is shown in (multi-language surveys). Unset until
    // the form data is loaded; lang() then falls back to the survey default.
    private activeLang: string | null;
    private readonly feedback: NativeFeedback;

    // Set when the integration turns out to be in AGENT mode and this Form is
    // acting as a thin delegator (see generate()).
    private agentForm: AgentForm | null;

    // Graph
    private graph: PageGraph

    // History of questions diccionary
    private history: History<PageNode>;

    // Count variables
    public progress: number;
    public total: number;
    public completed: boolean;
    public timeToCompleted: number;

    /**
     *
     * @param config
     * @param appId
     * @param publicKey
     * @param profile
     * @param metadata
     */
    constructor(config: Config, appId: string, publicKey?: string, profile?: NativeAnswer[], metadata?: NativeAnswer[]) {
        // SDK Config
        this.config = config;
        this.log = new Log(config);

        // Form options
        // Button texts and flow messages are deliberately left unset: when the
        // integrator does not override them they are resolved per render from
        // the integration language (see `lang()` / t()).
        this.formOptionsConfig = {
            addButton: true,
            addSuccessScreen: true,
            getMetaData: true,
            customMetaData: [],
            questionFormat: "standard",
        };

        this.selector = "";

        // Attributes
        this.appId = appId;
        this.publicKey = publicKey || '';
        this.url = config.get("url") as string;

        // Form completed data
        this.id = "";
        this.formData = null;
        this.activeLang = null;
        // if (this.publicKey !== '') this.getDataFromStorage();
        this.feedback = {
            text: "",
            answers: [],
            profile: profile ?? [],
            metrics: [],
            metadata: metadata ?? [],
        };

        this.history = new History<PageNode>();

        this.agentForm = null;

        this.graph = new PageGraph([]);

        // Count variables
        this.progress = 0;
        this.total = 0;
        this.completed = false;
        this.timeToCompleted = 0;
    }

    /**
     * Get data from the local storage, if the data is older than 24 hours, get the data from the server
     * @private

     private getDataFromStorage() {
     const localForm = localStorage.getItem(`magicfeedback-${this.appId}`);

     if (localForm && new Date(JSON.parse(localForm).savedAt) < new Date(new Date().getTime() + 60 * 60 * 24 * 1000)) {
     this.formData = JSON.parse(localForm);
     getForm(this.url, this.appId, this.publicKey, this.log).then((form: FormData | null) => {
     if (form?.updatedAt && this.formData?.savedAt && form?.updatedAt > this.formData?.savedAt) {
     // console.log("Form updated");
     this.formData = form;
     this.formData.savedAt = new Date();

     localStorage.setItem(`magicfeedback-${this.appId}`, JSON.stringify(this.formData));

     if (this.formData.questions === undefined || !this.formData.questions) throw new Error(`No questions for app ${this.appId}`);

     if (!this.formData.pages || this.formData.pages?.length === 0) this.formatPages();
     this.formData.questions?.sort((a, b) => a.position - b.position);
     // Clear pages without questions
     this.formData.pages = this.formData.pages.filter((page) => page.integrationQuestions?.length > 0);

     // Create the form from the JSON
     this.formData.style?.startMessage ?
     this.generateWelcomeMessage(this.formData.style.startMessage) :
     this.startForm();
     }
     });
     }
     }
     **/
    /**
     * Generate
     * @param selector
     * @param options
     */
    public async generate(selector: string, options: generateFormOptions) {
        // Check options, and set default values if this is not defined
        try {
            // Set the options
            this.formOptionsConfig = {...this.formOptionsConfig, ...options};
            this.selector = selector;
            let resData: any = this.formData;

            // Explicit option, then init({lang}), then the browser/device language.
            const requestedLang = detectSurveyLang(options?.lang || this.config.get<string>("lang"));

            if (this.formData === undefined || !this.formData)
                resData = this.publicKey !== '' ?
                    await getForm(this.url, this.appId, this.publicKey, this.log, requestedLang) :
                    await getSessionForm(this.url, this.appId, this.log, requestedLang);

            if (resData === undefined || !resData) throw new Error(`No data for app ${this.appId}`);

            if (resData.error?.message) throw new Error(resData.error.message);

            // AGENT integrations have no upfront question list and must never
            // POST to /sdk/feedback, so hand the flow over BEFORE the static
            // spine runs — the ACTIVE filtering, formatPages(), and above all
            // the localStorage write below, which would poison a later static
            // load of the same id.
            if (resData.mode === 'AGENT') {
                this.agentForm = new AgentForm(this.config, this.appId, this.publicKey);
                this.agentForm.applyIntegrationContext(resData);
                await this.agentForm.generate(selector, options as agentFormOptions);
                return;
            }

            // Clear questions without status ACTIVE
            resData.questions = resData.questions?.filter((q: NativeQuestion) => q.status === 'ACTIVE') || [];
            resData.pages = resData.pages?.filter((p: Page) => p.status === 'ACTIVE') || [];
            resData.pages?.forEach((p: Page) => p.integrationQuestions = p.integrationQuestions?.filter((q: NativeQuestion) => q.status === 'ACTIVE')) || [];


            this.formData = resData as FormData;
            this.activeLang = this.resolveActiveLang(requestedLang);

            if (!this.formData.savedAt) {
                // Save formData in the localstorage to use it in the future.
                // Guarded: Safari private mode and partitioned third-party
                // iframes throw on access, and a survey must not die because
                // the cache could not be written.
                this.formData.savedAt = new Date();
                try {
                    localStorage.setItem(`magicfeedback-${this.appId}-${this.lang()}`, JSON.stringify(this.formData));
                } catch (e) {
                    this.log.log("Could not cache the form data", e);
                }
            }

            if (this.formData.questions === undefined || !this.formData.questions) throw new Error(`No questions for app ${this.appId}`);

            if (!this.formData.pages || this.formData.pages?.length === 0) this.formatPages();
            this.formData.questions?.sort((a, b) => a.position - b.position);
            // Clear pages without questions
            this.formData.pages = this.formData.pages.filter((page) => page.integrationQuestions?.length > 0);

            if (this.formOptionsConfig.getMetaData) this.getMetaData();

            // If this.formData.product.originAllowed exists, check if the current domain is in the list
            // EJ originAllowed :["*", "survey.99thstudio.com"]
            // "*" means that: all domains from deepdots.com are allowed
            // if is development, dont check the origin


            /* if (this.config.get('env') !== 'dev' && this.formData.product.originAllowed && this.formData.product.originAllowed.length > 0) {
                const domain = window.location.hostname;
                const allowed = this.formData.product.originAllowed.find((d: string) => d === domain || (d === '*' && domain.endsWith('.deepdots.com') || d === '*' && domain.endsWith('.magicfeedback.io')));
                if (!allowed) throw new Error(`Domain not allowed`);
            } */

            this.formData.style?.startMessage ?
                await this.generateWelcomeMessage(this.formData.style.startMessage) :
                this.startForm();

        } catch (e) {
            this.log.err(e);

            if (this.formOptionsConfig.onLoadedEvent) {
                await this.formOptionsConfig.onLoadedEvent({
                    loading: false,
                    error: e,
                });
            }

            return;
        }
    }

    /**
     * Preview a single page in the survey creator without fetching from the API
     * and without persisting answers to /feedback. The caller provides the page
     * (with its questions) and minimal context (lang, product, identity). Followup
     * API calls and same UI behavior are preserved (dryRun is enabled internally),
     * so the page renders and behaves exactly as in production except no answers
     * are sent to /feedback.
     *
     * @param selector container element id where the preview will be rendered
     * @param input page + context to render
     * @param options form rendering options (buttons, callbacks, etc.)
     */
    public async previewPage(
        selector: string,
        input: PreviewPageInput,
        options: generateFormOptions = {}
    ): Promise<void> {
        try {
            if (!input || !input.page) throw new Error("[MagicFeedback] No page provided for preview");
            if (!input.page.integrationQuestions || input.page.integrationQuestions.length === 0) {
                throw new Error("[MagicFeedback] No questions provided for preview");
            }

            // Force dryRun so any submit/followup persistence is skipped.
            this.config.set("dryRun", true);

            // Default options for preview: do not pull metadata from the page URL,
            // since this is a creator preview, not a real submission.
            this.formOptionsConfig = {
                ...this.formOptionsConfig,
                getMetaData: false,
                ...options,
            };
            this.selector = selector;

            // Normalize the page into a Page instance.
            const activeQuestions = (input.page.integrationQuestions || [])
                .filter((q: NativeQuestion) => !q.status || q.status === 'ACTIVE')
                .sort((a: NativeQuestion, b: NativeQuestion) => a.position - b.position);

            const previewPage = new Page(
                input.page.id ?? '1',
                input.page.position ?? 1,
                input.appId ?? this.appId,
                activeQuestions,
                (input.page.integrationPageRoutes as any) ?? []
            );

            // Build a minimal FormData stub. We cast because we only need a subset
            // of the FormData surface for rendering a single page.
            this.formData = {
                id: input.appId ?? this.appId,
                identity: input.identity ?? 'MAGICFORM',
                lang: [input.lang ?? 'en'],
                product: input.product ?? {customIcons: false},
                style: input.style ?? {},
                questions: activeQuestions,
                pages: [previewPage],
            } as unknown as FormData;

            // Reuse the existing render pipeline. Single-page graph + dryRun keep
            // the behavior identical to production minus the network calls.
            await this.generateForm();
        } catch (e) {
            this.log.err(e);

            if (this.formOptionsConfig.onLoadedEvent) {
                await this.formOptionsConfig.onLoadedEvent({
                    loading: false,
                    error: e,
                });
            }
            return;
        }
    }

    /**
     * Format pages in case of the survey don't have pages
     * @private
     */
    private formatPages() {
        if (!this.formData) return;

        switch (this.formData.identity) {
            case 'MAGICSURVEY':
                // In this case we will create a page for each question
                this.formData.pages = [];
                this.formData.questions?.forEach((question) => {
                    const route: PageRoute = new PageRoute(
                        question.id,
                        question.ref,
                        OperatorType.NOEQUAL,
                        [],
                        TransitionType.PAGE,
                        (question.position + 1).toString(),
                        question.position.toString(),
                    )

                    const page = new Page(
                        question.position.toString(),
                        question.position,
                        this.appId,
                        [question],
                        [route]
                    );

                    this.formData?.pages?.push(page);
                });
                break;
            case 'MAGICFORM':
                // In this case we will create a page with all the questions
                const page = new Page(
                    '1',
                    1,
                    this.appId,
                    this.formData.questions,
                    []
                );
                this.formData.pages = [page];
                break;
        }

    }

    /**
     * Generate container
     * @returns
     */
    private generateContainer(): HTMLElement {
        const container = generateContainer(this.selector, this.appId);

        // Per-integration brand color: formData.style.primaryColor, same
        // config bucket as style.startMessage above. Setting it as a CSS
        // custom property on the container lets every child element that
        // already reads var(--mf-primary) pick it up with no per-component
        // changes. --mf-primary-hover/--mf-primary-light/--mf-primary-border
        // all reference var(--mf-primary) in the stylesheet, but a custom
        // property's var() references resolve once, where it's declared —
        // :root's copies stay locked to the default color and simply
        // inherit down as already-resolved values, ignoring this override,
        // unless they're redeclared here too using the same color-mix
        // formulas so they resolve fresh against the new color.
        const primaryColor = this.formData?.style?.primaryColor;
        if (primaryColor) applyPrimaryColor(container, primaryColor);

        // Arabic (and any future RTL language) renders mirrored; everything
        // else is explicitly marked ltr so a container is never left rtl from
        // a previous survey.
        applyDirection(container, this.lang());

        return container;
    }

    /**
     * Generate form
     * @private
     * @returns void
     */
    private async generateForm() {
        try {
            if (!this.formData || !this.formData.pages || this.formData.pages.length === 0) {
                throw new Error("No form data");
            }

            this.graph = new PageGraph(this.formData.pages.sort(
                (a, b) => a.position - b.position
            ));

            // Select and prepare the container
            let container: HTMLElement | null = this.generateContainer()

            // Create the form
            const form = document.createElement("form");
            form.classList.add("magicfeedback-form");
            form.id = "magicfeedback-" + this.appId;
            // Prevent reload on submit
            form.addEventListener("submit", (event) => event.preventDefault());

            // Create the questions container
            const questionContainer = document.createElement("div");
            questionContainer.classList.add("magicfeedback-questions");
            questionContainer.id = "magicfeedback-questions-" + this.appId;

            const page = this.graph.getFirstPage()

            if (!page) throw new Error("No page found");

            this.total = this.graph.findMaxDepth();

            // Process questions and create in the form
            page.elements = renderQuestions(
                page.questions,
                this.formOptionsConfig.questionFormat,
                this.lang(),
                this.formData?.product,
                () => this.send()
            );

            page.elements?.forEach((element) =>
                questionContainer.appendChild(element));
            form.appendChild(questionContainer);

            // Add the new page to the history
            this.history.enqueue(page);
            // Add the form to the specified container
            container.appendChild(form);
            // Update the progress
            this.progress = this.total - this.graph.findMaxDepth(page)

            // Submit button
            if (this.formOptionsConfig.addButton) {
                // Create a container for the buttons
                const actionContainer = renderActions(
                    this.formData?.identity,
                    () => this.back(),
                    this.formOptionsConfig.sendButtonText || t(this.lang(), "action.send"),
                    this.formOptionsConfig.backButtonText || t(this.lang(), "action.back"),
                    this.formOptionsConfig.nextButtonText || t(this.lang(), "action.next"),
                );

                form.appendChild(actionContainer);
            }

            if (this.formOptionsConfig.addButton) {
                // Submit event
                form.addEventListener("submit", (event) => {
                    event.preventDefault();
                    this.send()
                });
            }

            // init time to complete in milliseconds
            this.timeToCompleted = Date.now();

            // Send the data to manage loadings and progress
            if (this.formOptionsConfig.onLoadedEvent) {
                await this.formOptionsConfig.onLoadedEvent({
                    loading: false,
                    progress: this.progress,
                    total: this.total,
                    formData: this.formData,
                    lang: this.lang(),
                    formOptionsConfig: this.formOptionsConfig
                });
            }
        } catch (e) {
            this.log.err(e);

            if (this.formOptionsConfig.onLoadedEvent) {
                this.formOptionsConfig.onLoadedEvent({
                    loading: false,
                    error: e,
                });
            }
            return;
        }
    }

    /**
     * Start form after the welcome message, mainly used in the start message
     * @public
     **/
    public startForm() {
        this.generateForm()
    }

    /**
     * Language the survey is shown in: the SDK's own copy, RTL direction and
     * the `lang` sent with every answer. For a multi-language survey `lang[0]`
     * is only the default, so it is the fallback, not the answer.
     */
    private lang(): string {
        return this.activeLang || (this.formData?.lang && this.formData.lang[0]) || "en";
    }

    /** Public read of the language the survey is shown in. */
    public getLang(): string {
        return this.lang();
    }

    /**
     * Mirror of the API's resolveSurveyLang(): the served language when the API
     * reports it, else the requested one if the survey supports it, else the
     * survey's default.
     */
    private resolveActiveLang(requested: string | null): string | null {
        const supported = this.formData?.lang || [];
        if (this.formData?.servedLang) return this.formData.servedLang;
        if (requested && supported.includes(requested)) return requested;
        return supported[0] || null;
    }

    /**
     * Generate welcome message page if the form has a start message,with a button to start the form
     * @private
     */
    private async generateWelcomeMessage(startMessage: string) {
        try {
            // Select and prepare the container
            const container: HTMLElement | null = this.generateContainer()

            const initialMessage = renderStartMessage(
                startMessage,
                this.formOptionsConfig.addButton,
                this.formOptionsConfig.startButtonText || t(this.lang(), "action.start"),
                () => this.startForm()
            );

            container.appendChild(initialMessage)

            // Send the data to manage loadings and progress
            if (this.formOptionsConfig.onLoadedEvent) {
                await this.formOptionsConfig.onLoadedEvent({
                    loading: false,
                    formData: this.formData,
                    lang: this.lang(),
                });
            }
        } catch (e) {
            this.log.err(e);

            if (this.formOptionsConfig.onLoadedEvent) {
                this.formOptionsConfig.onLoadedEvent({
                    loading: false,
                    error: e,
                });
            }
            return;
        }
    }

    /**
     * Get the metadata from the URL, navigators and others
     * @private
     */

    private getMetaData() {
        if (this.formOptionsConfig.customMetaData) {
            this.feedback.metadata = [...this.feedback.metadata, ...this.formOptionsConfig.customMetaData];
        }
        // Add the navigator url and params from the URL to the metadata
        this.feedback.metadata.push({key: "navigator-url", value: [window.location.href]});
        this.feedback.metadata.push({key: "navigator-origin", value: [window.location.origin]});
        this.feedback.metadata.push({key: "navigator-pathname", value: [window.location.pathname]});
        this.feedback.metadata.push({key: "navigator-search", value: [window.location.search]});

        // Add query params as metadata entries
        const searchParams = new URLSearchParams(window.location.search);
        const queryKeys = Array.from(new Set(searchParams.keys()));
        queryKeys.forEach((key) => {
            const values = searchParams.getAll(key);
            if (values.length > 0) {
                this.feedback.metadata.push({key: `query-${key}`, value: values});
            }
        });

        // Add the navigator metadata
        this.feedback.metadata.push({key: "navigator-user", value: [navigator.userAgent]});
        this.feedback.metadata.push({key: "navigator-language", value: [navigator.language]});
        this.feedback.metadata.push({key: "navigator-platform", value: [navigator.platform]});
        this.feedback.metadata.push({key: "navigator-appVersion", value: [navigator.appVersion]});
        this.feedback.metadata.push({key: "navigator-appName", value: [navigator.appName]});
        this.feedback.metadata.push({key: "navigator-product", value: [navigator.product]});

        // Add the size of the screen
        this.feedback.metadata.push({key: "screen-width", value: [window.screen.width.toString()]});
        this.feedback.metadata.push({key: "screen-height", value: [window.screen.height.toString()]});

        if (this.appId && this.publicKey === '') {
            // Add the session id to the metadata
            this.feedback.metadata.push({key: "MAGICFEEDBACK_SESSION", value: [this.appId]});
        }

    }

    /**
     * Send current answer and verify if its necessary continue with a new question
     * @pubilc
     * @param profile
     * @param metrics
     * @param metadata
     * @param answers Optional answers payload. When provided the SDK skips the
     *                DOM scrape and required-question validation and submits
     *                the supplied answers directly. Use this to drive the
     *                survey from custom UI without rendering the SDK widgets.
     */
    public async send(
        metadata?: NativeAnswer[],
        metrics?: NativeAnswer[],
        profile?: NativeAnswer[],
        answers?: NativeAnswer[]
    ) {
        // Delegated AGENT survey: the agent form owns the turn loop.
        if (this.agentForm) return this.agentForm.next();

        const questionContainer = document.getElementById("magicfeedback-questions-" + this.appId) as HTMLElement;

        try {
            if (profile) this.feedback.profile = [...this.feedback.profile, ...profile];
            if (metrics) this.feedback.metrics = [...this.feedback.metrics, ...metrics];
            if (metadata) this.feedback.metadata = [...this.feedback.metadata, ...metadata];

            // Programmatic submission path: caller supplies answers, we skip
            // DOM scraping and required-question validation entirely.
            if (answers) {
                this.feedback.answers = [...this.feedback.answers, ...answers];

                if (this.formOptionsConfig.beforeSubmitEvent) {
                    await this.formOptionsConfig.beforeSubmitEvent({
                        loading: true,
                        progress: this.progress,
                        total: this.total
                    });
                }

                const programmaticResponse = await this.pushAnswers(false);
                if (!programmaticResponse) throw new Error("No response");
                this.id = programmaticResponse;

                if (this.formOptionsConfig.afterSubmitEvent) {
                    await this.formOptionsConfig.afterSubmitEvent({
                        loading: false,
                        progress: this.progress,
                        total: this.total
                    });
                }

                return;
            }

            // Wait for any in-flight file encoding before collecting answers so
            // upload questions include their (base64) contents.
            await awaitUploadReady(questionContainer);

            // Get the survey answers from the answer() function
            this.answer();

            // BEFORE
            if (this.formOptionsConfig.beforeSubmitEvent) {
                await this.formOptionsConfig.beforeSubmitEvent({
                    loading: true,
                    // answer: this.feedback.answers,
                    progress: this.progress,
                    total: this.total
                });
            }

            // Check if the required questions are answered
            const page = this.history.back();
            if (!page) throw new Error("No page found");

            for (const question of page.questions.filter(question => question.require &&
                ![FEEDBACKAPPANSWERTYPE.CONSENT, FEEDBACKAPPANSWERTYPE.INFO_PAGE].includes(question.type as FEEDBACKAPPANSWERTYPE)
            )) {
                const assets = question.assets;
                const ans = this.feedback.answers.filter((a) => a.key.includes(question.ref) && !a.key.includes('extra-option'));

                if (
                    ans.length === 0 ||
                    ans.find((a) => a.value.length === 0)
                ) {
                    this.log.err(`The question ${question.ref} is required`);
                    throw new Error(`No response`);
                }

                if (assets?.minOptions) {
                    let exclusiveAnswers: string[] = [];

                    if (assets?.exclusiveAnswers) {
                        exclusiveAnswers = assets?.exclusiveAnswers
                    }

                    // Check if the question has the minimum number of options selected and the exclusiveAnswers if it exists

                    if (
                        !ans[0].value.find((a) => exclusiveAnswers.includes(a)) &&
                        ans[0].value.length < assets?.minOptions
                    ) {
                        this.log.err(`The question ${question.ref} requires at least ${assets?.minOptions} options`);
                        throw new Error(`No response`);
                    }
                }

                // Validación específica para MULTI_QUESTION_MATRIX (todas las filas deben tener respuesta si es required)
                if (question.type === FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX) {
                    // La respuesta de matriz se guarda agrupada bajo la key exactamente igual a question.ref
                    const matrixAnswer = this.feedback.answers.find(a => a.key === question.ref);
                    if (!matrixAnswer) {
                        this.log.err(`The matrix question ${question.ref} is required`);
                        throw new Error(`No response`);
                    }

                    // Parsear estructura: [{ key: rowKey, value: [...] }, ...]
                    const rows = this.parseMatrixAnswerPre(matrixAnswer);

                    // Si hay definición de filas en assets.options, validar contra esa lista; si no, validar que todas las filas presentes tengan valor
                    const expectedRows: string[] = Array.isArray(assets?.options) ? assets.options : [];

                    if (expectedRows.length > 0) {
                        // Cada fila esperada debe existir y tener al menos un valor
                        const missingOrEmpty = expectedRows.find(rowKey => {
                            const row = rows.find(r => r.key === rowKey);
                            return !row || !Array.isArray(row.value) || row.value.length === 0;
                        });
                        if (missingOrEmpty) {
                            this.log.err(`The matrix question ${question.ref} requires an answer in every row`);
                            throw new Error(`No response`);
                        }
                    } else {
                        // Sin lista esperada, aseguramos que todas las filas presentes tengan valor
                        if (rows.length === 0 || rows.some(r => !Array.isArray(r.value) || r.value.length === 0)) {
                            this.log.err(`The matrix question ${question.ref} requires an answer in every row`);
                            throw new Error(`No response`);
                        }
                    }
                }

            }

            // SEND
            const response = await this.pushAnswers(false);

            if (!response) throw new Error("No response");

            this.id = response;
            await this.processNextQuestion(questionContainer);
        } catch (error) {
            // Handle error in beforeSubmitEvent, send(), or afterSubmitEvent
            this.log.err(
                `An error occurred while submitting the form ${this.appId}:`,
                error
            );

            if (this.formOptionsConfig.afterSubmitEvent) {
                await this.formOptionsConfig.afterSubmitEvent({
                    loading: false,
                    progress: this.progress,
                    total: this.total,
                    error
                });
            }
        }
    }

    /**
     * Update feedback -> answers with the answers of the form in a JSON format
     * @returns
     * @public
     */
    public answer(): NativeAnswer[] {
        const form: HTMLElement | null = document.getElementById(
            "magicfeedback-" + this.appId
        );

        if (!form) {
            this.log.err(`Form "${form}" not found.`);
            this.feedback.answers = [];
            return [];
        }

        // Check if the required questions are answered
        const page = this.history.back();
        // Modo genérico: si no hay página en el historial, recolectamos respuestas directamente de los inputs
        if (!page) {
            this.feedback.answers = scrapeInputs(form);
            return this.feedback.answers;
        }

        const surveyAnswers: NativeAnswer[] = [];
        let hasError = false; // Flag to track if an error has occurred

        const inputs = form.querySelectorAll(".magicfeedback-input");
        const priorityMap: Record<string, string[]> = {};
        const multipleChoiceMap: Record<string, string[]> = {};
        const pointSystemMap: Record<string, string[]> = {};

        inputs.forEach((input) => {
            const htmlInput = input as HTMLInputElement;
            const question = page.questions.find(q => htmlInput.name?.includes(q.ref));
            const inputType = htmlInput.type;
            const elementTypeClass = htmlInput.classList[0];

            const ans: NativeAnswer = {
                key: htmlInput.name,
                value: [],
            };

            const value = elementTypeClass === 'magicfeedback-consent' ?
                htmlInput.checked.toString() :
                htmlInput.value;

            if (!ans.key || ans.key === "") return;
            if (ans.key.startsWith("extra-option-")) {
                if (value !== "") {
                    ans.value.push(value);
                    surveyAnswers.push(ans);
                }
                return;
            }

            switch (question?.type) {
                case FEEDBACKAPPANSWERTYPE.EMAIL:
                case FEEDBACKAPPANSWERTYPE.TEXT:
                case FEEDBACKAPPANSWERTYPE.LONGTEXT:
                case FEEDBACKAPPANSWERTYPE.NUMBER:
                case FEEDBACKAPPANSWERTYPE.DATE:
                case FEEDBACKAPPANSWERTYPE.CONTACT:
                case FEEDBACKAPPANSWERTYPE.PASSWORD:
                    if (value !== "") {
                        if (inputType === "email") {
                            if (!validateEmail(value)) {
                                this.log.err("Invalid email");
                                hasError = true;
                            } else {
                                this.feedback.profile.push({
                                    key: "email",
                                    value: [value],
                                });
                                ans.value.push(value);
                                surveyAnswers.push(ans);
                            }
                        } else {
                            ans.value.push(value);
                            surveyAnswers.push(ans);
                        }
                    }
                    break;
                case FEEDBACKAPPANSWERTYPE.RADIO:
                    if (htmlInput.checked) {
                        ans.value.push(value);
                        surveyAnswers.push(ans);
                    }
                    break;
                case FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE:
                case FEEDBACKAPPANSWERTYPE.MULTIPLECHOISE_IMAGE:
                    if (htmlInput.checked) {
                        if (!multipleChoiceMap[ans.key]) multipleChoiceMap[ans.key] = [];
                        multipleChoiceMap[ans.key].push(value);
                    }
                    break;
                case FEEDBACKAPPANSWERTYPE.BOOLEAN:
                    if (htmlInput.checked) {
                        ans.value.push(value);
                        surveyAnswers.push(ans);
                    }
                    break;
                case FEEDBACKAPPANSWERTYPE.CONSENT:
                    ans.value.push(htmlInput.checked.toString());
                    surveyAnswers.push(ans);
                    break;
                case FEEDBACKAPPANSWERTYPE.RATING_EMOJI:
                case FEEDBACKAPPANSWERTYPE.RATING_NUMBER:
                case FEEDBACKAPPANSWERTYPE.RATING_STAR:
                    if (htmlInput.checked) {
                        ans.value.push(value);
                        surveyAnswers.push(ans);
                    }
                    break;
                case FEEDBACKAPPANSWERTYPE.SELECT:
                    if (value !== "") {
                        ans.value.push(value);
                        surveyAnswers.push(ans);
                    }
                    break;
                case FEEDBACKAPPANSWERTYPE.POINT_SYSTEM:
                    if (inputType === 'number' && htmlInput.id) {
                        if (!pointSystemMap[ans.key]) pointSystemMap[ans.key] = [];
                        if (value !== "") pointSystemMap[ans.key].push(`${htmlInput.id}:${value}%`);
                    }
                    break;
                case FEEDBACKAPPANSWERTYPE.PRIORITY_LIST:
                    // Agrupar los inputs hidden del priority list bajo la misma key
                    if (inputType === 'hidden') {
                        if (!priorityMap[ans.key]) priorityMap[ans.key] = [];
                        priorityMap[ans.key].push(value);
                    }
                    break;

                case FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX:
                    if ((input as HTMLInputElement).checked) {
                        ans.value.push(value);
                        surveyAnswers.push(ans);
                    }
                    break;
                case FEEDBACKAPPANSWERTYPE.UPLOAD_IMAGE:
                case FEEDBACKAPPANSWERTYPE.UPLOAD_FILE: {
                    const uploadValues = getUploadValues(htmlInput);
                    if (uploadValues.length) {
                        ans.value.push(...uploadValues);
                        surveyAnswers.push(ans);
                    }
                    break;
                }
                default:
                    break;
            }
        });

        if (hasError) return [];

        // Agregar MULTIPLECHOICE como un único NativeAnswer por pregunta
        Object.entries(multipleChoiceMap).forEach(([k, arr]) => {
            if (!arr || arr.length === 0) return;
            surveyAnswers.push({key: k, value: arr});
        });

        // Agregar POINT_SYSTEM como un único NativeAnswer
        Object.entries(pointSystemMap).forEach(([k, arr]) => {
            if (!arr || arr.length === 0) return;
            surveyAnswers.push({key: k, value: arr});
        });

        // Agregar PRIORITY_LIST como un único NativeAnswer ordenado por índice
        Object.entries(priorityMap).forEach(([k, arr]) => {
            if (!arr || arr.length === 0) return;
            const sorted = arr.slice().sort((a, b) => Number(a.split('.')[0]) - Number(b.split('.')[0]));
            surveyAnswers.push({key: k, value: sorted});
        });

        // --- Agrupación especial para MULTI_QUESTION_MATRIX ---
        try {
            const matrixQuestions = page.questions.filter(q => q.type === FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX);
            matrixQuestions.forEach(mq => {
                // Respuestas individuales capturadas como ref-rowName
                const rowPrefix = mq.ref + '-';
                const rowAnswers = surveyAnswers.filter(a => a.key.startsWith(rowPrefix));
                if (rowAnswers.length === 0) return; // nada que agrupar

                // Crear estructura: [{ key: rowName, value: [selected] }, ...]
                const groupedRows = rowAnswers.map(r => ({
                    key: r.key.substring(rowPrefix.length),
                    value: r.value
                }));

                // El formato requerido: valor debe ser un array que contiene (una sola posición) un array de objetos fila
                const matrixAnswer: NativeAnswer = {
                    key: mq.ref,
                    value: [JSON.stringify(groupedRows)]
                };

                // Eliminar las respuestas individuales
                for (const ra of rowAnswers) {
                    const idx = surveyAnswers.findIndex(s => s.key === ra.key);
                    if (idx !== -1) surveyAnswers.splice(idx, 1);
                }

                // Añadir (o reemplazar si ya existiera) la respuesta agrupada
                const existingIndex = surveyAnswers.findIndex(a => a.key === mq.ref);
                if (existingIndex !== -1) {
                    surveyAnswers[existingIndex] = matrixAnswer;
                } else {
                    surveyAnswers.push(matrixAnswer);
                }
            });
        } catch (e) {
            this.log.err('Error agrupando MULTI_QUESTION_MATRIX', e);
        }


        // Multi-language surveys: the inputs hold the shown labels, but routing,
        // validation and storage all match on the default-language options.
        const baseAnswers = toBaseAnswers(surveyAnswers, page.questions);

        this.feedback.answers = baseAnswers;
        page.setAnswer(baseAnswers);
        return baseAnswers;
    }

    /**
     * Finish the form
     * @public
     */

    public async finish() {
        this.completed = true;
        this.timeToCompleted = Date.now() - this.timeToCompleted;
        this.feedback.metadata.push({key: "time-to-complete", value: [this.timeToCompleted.toString()]});
        if (this.formOptionsConfig.addSuccessScreen) {
            const container = document.getElementById("magicfeedback-container-" + this.appId) as HTMLElement;
            // Remove the form
            if (container.childNodes.length > 0) container.removeChild(container.childNodes[0]);

            // Show the success message
            const successMessage = renderSuccess(
                this.formOptionsConfig.successMessage ||
                t(this.lang(), "message.success")
            );

            container.appendChild(successMessage);
        }

        this.answer();

        try {
            const response = await this.pushAnswers(true);

            if (!response) {
                if (this.formOptionsConfig.afterSubmitEvent) {
                    await this.formOptionsConfig.afterSubmitEvent({
                        loading: false,
                        progress: this.progress,
                        total: this.total,
                        completed: this.completed,
                        error: `An error occurred while submitting the form ${this.appId}:`
                    });
                }
                throw new Error("An error occurred while submitting the form ${this.appId}:");
            }

            this.id = response;

            // AFTER
            if (this.formOptionsConfig.afterSubmitEvent) {
                await this.formOptionsConfig.afterSubmitEvent({
                    response: this.id,
                    loading: false,
                    progress: this.progress,
                    total: this.total,
                    completed: this.completed,
                    error: null
                });
            }

        } catch (error) {
            // Handle error in beforeSubmitEvent, send(), or afterSubmitEvent
            this.log.err(
                `An error occurred while submitting the form ${this.appId}:`,
                error
            );

            if (this.formOptionsConfig.afterSubmitEvent) {
                await this.formOptionsConfig.afterSubmitEvent({
                    loading: false,
                    progress: this.progress,
                    total: this.total,
                    completed: this.completed,
                    error
                });
            }
        }
    }

    /**
     * Send
     * @param completed
     * @returns
     */
    private async pushAnswers(completed: boolean = false): Promise<string> {
        try {
            if (this.config.get<boolean>("dryRun")) {
                const dryRunSession = this.id || `dry-run-${this.appId}-${Date.now()}`;
                this.log.log(`Dry run enabled: skipping feedback submit for form ${this.appId}`);
                return dryRunSession;
            }

            // Define the URL and request payload
            const url = this.config.get("url");
            const body = {
                integration: this.appId,
                publicKey: this.publicKey,
                feedback: this.feedback,
                completed,
                // Sent on every call: the API stamps the `language` metric from the latest one.
                lang: this.lang(),
            }

            // Make the AJAX POST request
            return await sendFeedback(
                url as string,
                this.id ? {...body, sessionId: this.id} : body,
                this.log
            );

        } catch (error) {
            // Handle network or request error
            this.log.err(
                `An error occurred while submitting the form ${this.appId}:`,
                error
            );
            // You can perform error handling logic here if needed
            return '';
        }
    }

    /**
     * Call follow up question
     * @param question
     * @private
     */

    private async callFollowUpQuestion(question: NativeQuestion | null): Promise<NativeQuestion | null> {
        if (!question?.followup) return null;

        // There is nothing to follow up on when the question was left blank
        // (only possible when it is not required), so skip it instead of
        // blocking the survey: the user must always be able to move on.
        const answer = this.feedback.answers.find((a) => a.key === question.ref)
            ?? this.feedback.answers.find((a) => a.key.includes(question.ref) && !a.key.includes('extra-option'));
        const answerValue = answer?.value?.find((v) => v !== undefined && v !== null && v !== "");

        if (answerValue === undefined) {
            this.log.log(`The question ${question.ref} has no answer, skipping its follow up`);
            return null;
        }

        try {
            // Define the URL and request payload
            const url = this.config.get("url");

            const body = {
                answer: answerValue,
                ...(this.publicKey !== '' && {publicKey: this.publicKey}),
                ...(this.publicKey === '' && {campaignSessionId: this.appId}),
                sessionId: this.id,
                question
            }

            return await getFollowUpQuestion(
                url as string,
                body,
                this.log,
            );
        } catch (error) {
            // A follow up is an enrichment, never a gate: log the failure and
            // let the survey continue with the next page.
            this.log.err(
                `An error occurred while requesting the follow up of ${question.ref} in the form ${this.appId}:`,
                error
            );
            return null;
        }
    }

    /**
     * Process next question
     * @param form
     * @private
     */

    private async processNextQuestion(form: HTMLElement) {
        const page = this.history.back();

        if (!page) throw new Error("No page found");

        // A follow up page never chains another follow up: its questions come
        // back from the API flagged as `followup`, which would otherwise ask
        // for a follow up of the follow up on every submit.
        const followUpList = page.isFollowup ? [] : page.getFollowupQuestions();

        if (followUpList?.length === 0) {
            await this.renderNextQuestion(form, page);
            return;
        }

        const followUpQuestions = [];
        for (const followUp of followUpList) {
            const question = page.questions.find((q) => q.ref === followUp);
            if (question) {
                const followUpQuestion = await this.callFollowUpQuestion(question);
                if (followUpQuestion) followUpQuestions.push(followUpQuestion);
            }
        }

        if (followUpQuestions.length === 0) {
            await this.renderNextQuestion(form, page);
            return;
        }

        // Create a new page with the follow up questions
        const newPage = new Page(
            page.id,
            page.position,
            this.appId,
            followUpQuestions,
            page.edges
        );

        const n = new PageNode(
            page.id,
            page.position,
            page.edges,
            newPage,
            followUpQuestions,
            true
        );

        // Routing out of the follow up has to be resolved against the page that
        // produced it, not against the follow up itself.
        n.origin = page.isFollowup && page.origin ? page.origin : page;

        n.elements = renderQuestions(
            followUpQuestions,
            this.formOptionsConfig.questionFormat,
            this.lang(),
            this.formData?.product,
            () => this.send()
        );

        // Update the progress +0.5, because the follow up questions are
        // not included in the graph and one page with follow up questions is considered as 2
        this.history.enqueue(n);
        this.progress += 0.5;

        form.innerHTML = "";

        n.elements?.forEach((element) => form.appendChild(element));

        // AFTER
        if (this.formOptionsConfig.afterSubmitEvent) {
            await this.formOptionsConfig.afterSubmitEvent({
                response: this.id,
                loading: false,
                progress: this.progress,
                total: this.total,
                followup: n.isFollowup,
                completed: this.completed,
                error: null
            });
        }

    }

    /**
     * Render next question
     * @param form
     * @param page
     * @private
     */
    private async renderNextQuestion(form: HTMLElement, page: PageNode) {
        // A follow up page is not part of the graph: it only carries a copy of
        // the edges of the page that originated it, and `this.feedback.answers`
        // at this point holds the follow up answer alone. Routing with those
        // would never match a condition written against the original questions,
        // silently falling through to the next page by position. Resolve the
        // route with the origin node and with its answers instead.
        const routingNode = (page.isFollowup && page.origin) ? page.origin : page;
        const routingAnswers = routingNode === page
            ? this.feedback.answers
            : [...(routingNode.answers ?? []), ...this.feedback.answers];

        // Get next page from the graph
        let nextPage = this.graph.getNextPage(routingNode, routingAnswers);

        if (!nextPage) {
            this.finish();
            return;
        }

        // --- NEW: Check preconditional routes ---
        const preconditionalRoute: PageRoute[] = nextPage.edges.filter(edge => edge.typeCondition === 'PRECONDITIONAL').sort((a, b) => {
            // Sort by position
            if (a.position < b.position) return -1;
            if (a.position > b.position) return 1;
            return 0;
        });

        if (preconditionalRoute?.length > 0) {
            // Determine if there are ALLOW routes — if so, ALL must be satisfied (AND logic)
            const hasAllowRoutes = preconditionalRoute.some(route => route.transition === TransitionType.ALLOW);
            let allAllowMet = hasAllowRoutes; // starts true, will be set to false if any ALLOW fails

            for (const route of preconditionalRoute) {
                // FIX: Search the answer SPECIFIC to this route's questionRef, not a generic one
                let foundAnswer: NativeAnswer | undefined;
                for (let i = this.history.size() - 1; i >= 0; i--) {
                    const node = this.history.get(i);
                    if (!node) continue;
                    foundAnswer = node.answers?.find((ans: NativeAnswer) => ans.key === route.questionRef);
                    if (foundAnswer) break;
                }

                let conditionMet = false;
                if (foundAnswer) {
                    const question = this.formData?.questions.find(q => q.ref === route.questionRef);
                    const answerVals = Array.isArray(foundAnswer.value) ? foundAnswer.value : [foundAnswer.value];
                    const routeVals = Array.isArray(route.value) ? route.value : [route.value];

                    // Lógica especial para matrices
                    if (question?.type === FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX) {
                        conditionMet = this.evaluateMatrixPreconditional(route, foundAnswer);
                    } else {
                        switch (route.typeOperator) {
                            case 'EQUAL':
                                conditionMet = answerVals.some((v: any) => routeVals.includes(v));
                                break;
                            case 'NOEQUAL':
                                conditionMet = answerVals.every((v: any) => !routeVals.includes(v));
                                break;
                            case 'GREATER':
                                conditionMet = answerVals.some((v: any) => Number(v) > Number(routeVals[0]));
                                break;
                            case 'LESS':
                                conditionMet = answerVals.some((v: any) => Number(v) < Number(routeVals[0]));
                                break;
                            case 'GREATEREQUAL':
                                conditionMet = answerVals.some((v: any) => Number(v) >= Number(routeVals[0]));
                                break;
                            case 'LESSEQUAL':
                                conditionMet = answerVals.some((v: any) => Number(v) <= Number(routeVals[0]));
                                break;
                            case 'INQ':
                                conditionMet = answerVals.some((v: any) => routeVals.includes(v));
                                break;
                            case 'NINQ':
                                conditionMet = answerVals.every((v: any) => !routeVals.includes(v));
                                break;
                            default:
                                break;
                        }
                    }
                }

                // Apply transition logic per route
                if (route.transition === TransitionType.ALLOW) {
                    // FIX: AND logic — if ANY ALLOW condition fails, page is not allowed
                    if (!conditionMet) {
                        allAllowMet = false;
                    }
                } else if (route.transition === TransitionType.NEXT && conditionMet) {
                    this.feedback.answers = [];
                    if (nextPage) await this.renderNextQuestion(form, nextPage);
                    return;
                }
            }

            const allowToContinue = hasAllowRoutes ? allAllowMet : true;
            if (!allowToContinue) {
                this.feedback.answers = []
                if (nextPage) await this.renderNextQuestion(form, nextPage);
                return;
            }
        }
        // --- END NEW ---

        nextPage.elements = renderQuestions(
            nextPage.questions,
            this.formOptionsConfig.questionFormat,
            this.lang(),
            this.formData?.product,
            () => this.send()
        );

        form.innerHTML = "";

        nextPage.elements?.forEach((element) => form.appendChild(element));

        this.history.enqueue(nextPage);
        this.progress = this.total - this.graph.findMaxDepth(nextPage)

        // AFTER
        if (this.formOptionsConfig.afterSubmitEvent) {
            await this.formOptionsConfig.afterSubmitEvent({
                response: this.id,
                loading: false,
                progress: this.progress,
                total: this.total,
                followup: nextPage.isFollowup,
                completed: this.completed,
                error: null
            });
        }
    }


    /**
     * Render back question
     * @private
     */
    public async back() {
        if (this.history.size() === 0) return;

        const form = document.getElementById("magicfeedback-questions-" + this.appId) as HTMLElement;

        if (form && form.childNodes.length > 0) form.innerHTML = "";

        this.history.rollback();


        const page = this.history.back();

        if (page) {
            page.elements?.forEach((element) => form.appendChild(element));
            this.progress = this.total - this.graph.findMaxDepth(page)
        } else {
            this.progress = this.history.size();
        }

        // AFTER
        if (this.formOptionsConfig.onBackEvent) {
            await this.formOptionsConfig.onBackEvent({
                loading: false,
                progress: this.progress,
                followup: page?.isFollowup || false,
                error: !page ? "No page found" : null
            });
        }
    }

    /**
     * Render a single question as a preview/test.
     * It does not modify the internal state (history, graph, progress) of the form.
     * @param selector ID of the container where the question will be injected.
     * @param question Full question object (NativeQuestion[] expected here).
     * @param options Optional configuration to customize format/language/product.
     * @returns HTMLElement container used.
     */
    public previewQuestion(
        selector: string,
        question: NativeQuestion | NativeQuestion[],
        options?: {
            format?: "standard" | "slim";
            language?: string;
            product?: any;
            style?: Record<string, any>;
            clearContainer?: boolean; // default true
            wrap?: boolean; // whether to create a wrapper div with a class
        }
    ): HTMLElement {
        const questionsArray: NativeQuestion[] = Array.isArray(question) ? question : [question];
        if (!questionsArray || questionsArray.length === 0) throw new Error("[MagicFeedback] No question provided for preview");

        const container = document.getElementById(selector);
        if (!container) throw new Error(`[MagicFeedback] Element with ID '${selector}' not found.`);

        const {
            format = this.formOptionsConfig.questionFormat || "standard",
            language = this.lang(),
            product = this.formData?.product || {customIcons: false},
            style = this.formData?.style || {},
            clearContainer = true,
            wrap = true,
        } = options || {};

        if (clearContainer) container.innerHTML = "";

        // Same per-integration primary color as the full form flow — see
        // applyPrimaryColor() for why hover/light/border are recomputed too.
        if (style?.primaryColor) applyPrimaryColor(container, style.primaryColor);

        applyDirection(container, language);

        // Reuse existing renderQuestions logic passing the question array
        let elements: HTMLElement[] = [];
        try {
            elements = renderQuestions(questionsArray, format, language, product);
        } catch (e) {
            this.log.err(e);
            throw e;
        }

        // If wrap is true, create a wrapper container to isolate preview styles
        let target = container;
        if (wrap) {
            const wrapper = document.createElement("div");
            wrapper.classList.add("magicfeedback-preview-question");
            target.appendChild(wrapper);
            target = wrapper;
        }

        elements.forEach(el => target.appendChild(el));
        return container;
    }

    private parseMatrixAnswerPre(ans: NativeAnswer): { key: string; value: any[] }[] {
        if (!ans || !ans.value) return [];
        if (ans.value.length === 1 && typeof ans.value[0] === 'string' && ans.value[0].trim().startsWith('[')) {
            try {
                const parsed = JSON.parse(ans.value[0]);
                if (Array.isArray(parsed)) return parsed;
            } catch (_) {
                return [];
            }
        }
        if (Array.isArray(ans.value) && ans.value.length > 0 && typeof ans.value[0] === 'object' && ans.value[0] !== null && 'key' in ans.value[0]) {
            return ans.value as { key: string; value: any[] }[];
        }
        return [];
    }

    private evaluateMatrixPreconditional(route: PageRoute, answer: NativeAnswer): boolean {
        const edgeVals = Array.isArray(route.value) ? route.value : [route.value];
        const optionFilter = new Set(route.option || []);
        const rows = this.parseMatrixAnswerPre(answer);
        if (!rows.length) return false;
        const relevantRows = optionFilter.size > 0 ? rows.filter(r => optionFilter.has(r.key)) : rows;
        if (!relevantRows.length) return false;
        const intersects = (rowValues: any[]) => rowValues.some(v => edgeVals.includes(v));
        const notIntersects = (rowValues: any[]) => rowValues.every(v => !edgeVals.includes(v));
        switch (route.typeOperator) {
            case 'EQUAL':
            case 'INQ':
                return relevantRows.some(r => intersects(Array.isArray(r.value) ? r.value : [r.value]));
            case 'NOEQUAL':
            case 'NINQ':
                return relevantRows.every(r => notIntersects(Array.isArray(r.value) ? r.value : [r.value]));
            case 'GREATER':
                return relevantRows.some(r => {
                    const vals = Array.isArray(r.value) ? r.value : [r.value];
                    return vals.some(val => edgeVals.some(edgeVal => Number(val) > Number(edgeVal)));
                });
            case 'LESS':
                return relevantRows.some(r => {
                    const vals = Array.isArray(r.value) ? r.value : [r.value];
                    return vals.some(val => edgeVals.some(edgeVal => Number(val) < Number(edgeVal)));
                });
            case 'GREATEREQUAL':
                return relevantRows.some(r => {
                    const vals = Array.isArray(r.value) ? r.value : [r.value];
                    return vals.some(val => edgeVals.some(edgeVal => Number(val) >= Number(edgeVal)));
                });
            case 'LESSEQUAL':
                return relevantRows.some(r => {
                    const vals = Array.isArray(r.value) ? r.value : [r.value];
                    return vals.some(val => edgeVals.some(edgeVal => Number(val) <= Number(edgeVal)));
                });
            default:
                return false;
        }
    }
}
