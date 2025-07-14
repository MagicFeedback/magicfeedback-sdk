import {FEEDBACKAPPANSWERTYPE, generateFormOptions, NativeAnswer, NativeFeedback, NativeQuestion} from "./types";

import {Config} from "./config";
import {Log} from "../utils/log";
import {getFollowUpQuestion, getForm, getSessionForm, sendFeedback, validateEmail} from "../services/request.service";
import {FormData} from "./formData";
import {renderActions, renderQuestions, renderStartMessage, renderSuccess} from "../services/questions.service";
import {PageGraph} from "./pageGrafs";
import {Page} from "./page";
import {OperatorType, PageRoute, TransitionType} from "./pageRoute";
import {History} from "./History";
import {PageNode} from "./pageNode";

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
    private readonly feedback: NativeFeedback;

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
     */
    constructor(config: Config, appId: string, publicKey?: string) {
        // SDK Config
        this.config = config;
        this.log = new Log(config);

        // Form options
        this.formOptionsConfig = {
            addButton: true,
            sendButtonText: "Send",
            backButtonText: "Back",
            nextButtonText: "Next",
            addSuccessScreen: true,
            getMetaData: true,
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
        // if (this.publicKey !== '') this.getDataFromStorage();
        this.feedback = {
            text: "",
            answers: [],
            profile: [],
            metrics: [],
            metadata: [],
        };

        this.history = new History<PageNode>();

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

            if (this.formData === undefined || !this.formData)
                resData = this.publicKey !== '' ?
                    await getForm(this.url, this.appId, this.publicKey, this.log) :
                    await getSessionForm(this.url, this.appId, this.log);

            if (resData === undefined || !resData) throw new Error(`No data for app ${this.appId}`);

            if (resData.error?.message) throw new Error(resData.error.message);

            // Clear questions without status ACTIVE
            resData.questions = resData.questions?.filter((q: NativeQuestion) => q.status === 'ACTIVE') || [];
            resData.pages = resData.pages?.filter((p: Page) => p.status === 'ACTIVE') || [];
            resData.pages?.forEach((p: Page) => p.integrationQuestions = p.integrationQuestions?.filter((q: NativeQuestion) => q.status === 'ACTIVE')) || [];


            this.formData = resData as FormData;

            if (!this.formData.savedAt) {
                // Save formData in the localstorage to use it in the future
                this.formData.savedAt = new Date();
                localStorage.setItem(`magicfeedback-${this.appId}`, JSON.stringify(this.formData));
            }

            if (this.formData.questions === undefined || !this.formData.questions) throw new Error(`No questions for app ${this.appId}`);

            if (!this.formData.pages || this.formData.pages?.length === 0) this.formatPages();
            this.formData.questions?.sort((a, b) => a.position - b.position);
            // Clear pages without questions
            this.formData.pages = this.formData.pages.filter((page) => page.integrationQuestions?.length > 0);

            if (this.formOptionsConfig.getMetaData) this.getMetaData();

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
                        null,
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
        // Select and prepare the container
        let container: HTMLElement | null = document.getElementById(this.selector);
        if (!container) {
            container = document.getElementById("magicfeedback-container-" + this.appId);
            if (!container) throw new Error(`Element with ID '${this.selector}' not found.`);
        }
        container.classList.add("magicfeedback-container");
        container.id = "magicfeedback-container-" + this.appId;
        container.innerHTML = "";

        return container;
    }

    /**
     * Generate form
     * @private
     * @returns void
     */
    private async generateForm() {
        try {
            console.log('Generating form for appId:', this.appId);
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
                this.formData?.lang[0],
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
                    this.formOptionsConfig.sendButtonText,
                    this.formOptionsConfig.backButtonText,
                    this.formOptionsConfig.nextButtonText,
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

            // init time to complete in seconds
            this.timeToCompleted = new Date().getTime() / 1000;

            // Send the data to manage loadings and progress
            if (this.formOptionsConfig.onLoadedEvent) {
                await this.formOptionsConfig.onLoadedEvent({
                    loading: false,
                    progress: this.progress,
                    total: this.total,
                    formData: this.formData,
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
     * Generate welcome message page if the form has a start message,with a button to start the form
     * @private
     */
    private async generateWelcomeMessage(startMessage: string) {
        try {
            // Select and prepare the container
            const container: HTMLElement | null = this.generateContainer()

            const initialMessage = renderStartMessage(startMessage, this.formOptionsConfig.addButton, this.formOptionsConfig.startButtonText, () => this.startForm());

            container.appendChild(initialMessage)

            // Send the data to manage loadings and progress
            if (this.formOptionsConfig.onLoadedEvent) {
                await this.formOptionsConfig.onLoadedEvent({
                    loading: false,
                    formData: this.formData,
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
        // Add the navigator url and params from the URL to the metadata
        this.feedback.metadata.push({key: "navigator-url", value: [window.location.href]});
        this.feedback.metadata.push({key: "navigator-origin", value: [window.location.origin]});
        this.feedback.metadata.push({key: "navigator-pathname", value: [window.location.pathname]});
        this.feedback.metadata.push({key: "navigator-search", value: [window.location.search]});

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
     */
    public async send(
        metadata?: NativeAnswer[],
        metrics?: NativeAnswer[],
        profile?: NativeAnswer[]
    ) {
        const questionContainer = document.getElementById("magicfeedback-questions-" + this.appId) as HTMLElement;

        try {
            if (profile) this.feedback.profile = [...this.feedback.profile, ...profile];
            if (metrics) this.feedback.metrics = [...this.feedback.metrics, ...metrics];
            if (metadata) this.feedback.metadata = [...this.feedback.metadata, ...metadata];

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

            for (const question of page.questions.filter(question => question.require)) {
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

                    if (assets?.extraOption) {
                        exclusiveAnswers.push(assets?.extraOptionText);
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
    public answer() {
        const form: HTMLElement | null = document.getElementById(
            "magicfeedback-" + this.appId
        );

        if (!form) {
            this.log.err(`Form "${form}" not found.`);
            this.feedback.answers = [];
            return;
        }

        // Check if the required questions are answered
        const page = this.history.back();
        if (!page) throw new Error("No page found");

        const surveyAnswers: NativeAnswer[] = [];
        let hasError = false; // Flag to track if an error has occurred

        const inputs = form.querySelectorAll(".magicfeedback-input");

        inputs.forEach((input) => {
            const question = page.questions.find(q => (input as HTMLInputElement).name?.includes(q.ref));
            const inputType = (input as HTMLInputElement).type;
            const elementTypeClass = (input as HTMLInputElement).classList[0];

            const ans: NativeAnswer = {
                key: (input as HTMLInputElement).name,
                value: [],
            };

            const value = elementTypeClass === 'magicfeedback-consent' ?
                (input as HTMLInputElement).checked.toString() :
                (input as HTMLInputElement).value;

            if (!ans.key || ans.key === "") return;

            switch (question?.type) {
                case FEEDBACKAPPANSWERTYPE.EMAIL:
                case FEEDBACKAPPANSWERTYPE.TEXT:
                case FEEDBACKAPPANSWERTYPE.LONGTEXT:
                case FEEDBACKAPPANSWERTYPE.NUMBER:
                case FEEDBACKAPPANSWERTYPE.DATE:
                case FEEDBACKAPPANSWERTYPE.CONTACT:
                    if (value !== "") {
                        if (inputType === "email") {
                            if (!validateEmail(value)) {
                                this.log.err("Invalid email");
                                hasError = true;
                                break;
                            } else {
                                this.feedback.profile.push({
                                    key: "email",
                                    value: [value],
                                });
                            }
                        }
                        ans.value.push(value);
                    }
                    break;
                case FEEDBACKAPPANSWERTYPE.CONSENT:
                    ans.value.push(String((input as HTMLInputElement).checked));
                    break;
                case FEEDBACKAPPANSWERTYPE.POINT_SYSTEM:
                    const key = (input as HTMLInputElement).id;
                    ans.value.push(`${key}:${value}%`);
                    break;

                case FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE:
                case FEEDBACKAPPANSWERTYPE.MULTIPLECHOISE_IMAGE:
                case FEEDBACKAPPANSWERTYPE.RATING_STAR:
                case FEEDBACKAPPANSWERTYPE.RADIO:
                case FEEDBACKAPPANSWERTYPE.RATING_EMOJI:
                case FEEDBACKAPPANSWERTYPE.RATING_NUMBER:
                    if ((input as HTMLInputElement).checked || (input as HTMLInputElement).id.includes("extra-option-")) {
                        ans.value.push(value);
                    }
                    break;
                case FEEDBACKAPPANSWERTYPE.SELECT:
                    ans.value.push(value);
                    break;
                case FEEDBACKAPPANSWERTYPE.BOOLEAN:
                    if ((input as HTMLInputElement).checked) {
                        ans.value.push(value);
                    }
                    break;
                case FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX:
                    if ((input as HTMLInputElement).checked) {
                        ans.value.push(value);
                    }
                    break;
                case FEEDBACKAPPANSWERTYPE.PRIORITY_LIST:
                    ans.value.push(value);
                    break;
                default:
                    break;


            }

            if (surveyAnswers?.length > 0 && surveyAnswers?.find(a => a.key === ans.key)) {
                const index = surveyAnswers.findIndex(a => a.key === ans.key);
                surveyAnswers[index].value = [...surveyAnswers[index].value, ...ans.value];
            } else {
                surveyAnswers.push(ans);
            }
        });

        if (hasError) {
            this.feedback.answers = []; // Stop the process if there's an error
            return;
        }

        this.feedback.answers = surveyAnswers;
    }

    /**
     * Finish the form
     * @public
     */

    public async finish() {
        this.completed = true;
        this.timeToCompleted = new Date().getTime() - this.timeToCompleted;
        this.feedback.metadata.push({key: "time-to-complete", value: [this.timeToCompleted.toString()]});
        if (this.formOptionsConfig.addSuccessScreen) {
            const container = document.getElementById("magicfeedback-container-" + this.appId) as HTMLElement;
            // Remove the form
            if (container.childNodes.length > 0) container.removeChild(container.childNodes[0]);

            // Show the success message
            const successMessage = renderSuccess(
                this.formOptionsConfig.successMessage ||
                "Thank you for your feedback!"
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
            // Define the URL and request payload
            const url = this.config.get("url");
            const body = {
                integration: this.appId,
                publicKey: this.publicKey,
                feedback: this.feedback,
                completed,
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
        try {
            if (this.feedback.answers.length === 0) throw new Error("No answers provided");

            // Define the URL and request payload
            const url = this.config.get("url");

            const body = {
                answer: this.feedback.answers.find((a) => a.key === question.ref)?.value[0],
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
            // Handle network or request error
            this.log.err(
                `An error occurred while submitting the form ${this.appId}:`,
                error
            );
            // You can perform error handling logic here if needed
            throw error;
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

        const followUpList = page.getFollowupQuestions()

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

        n.elements = renderQuestions(
            followUpQuestions,
            this.formOptionsConfig.questionFormat,
            this.formData?.lang[0],
            this.formData?.product,
            () => this.send()
        );

        // Update the progress +1, because the follow up questions are
        // not included in the graph and one page with follow up questions is considered as 2
        this.history.enqueue(n);
        this.progress++;

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
        // Get next page from the graph
        //console.log(page, this.feedback.answers);
        const nextPage = this.graph.getNextPage(page, this.feedback.answers);

        //console.log(nextPage);
        if (!nextPage) {
            this.finish();
            return;
        }

        nextPage.elements = renderQuestions(
            nextPage.questions,
            this.formOptionsConfig.questionFormat,
            this.formData?.lang[0],
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
}
