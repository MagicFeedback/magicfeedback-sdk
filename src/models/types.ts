export type Key = string;

export type InitOptions = {
    env?: 'dev' | 'prod';
    debug?: boolean;
    dryRun?: boolean;
};

export type NativeFeedbackAnswer = {
    id: string;
    type?: FEEDBACKAPPANSWERTYPE;
    value: string[];
};

export type NativeFeedbackProfile = {
    [key: string]: string;
};

export enum FEEDBACKAPPANSWERTYPE {
    CONTACT = "CONTACT",
    MULTIPLECHOISE_IMAGE = "MULTIPLECHOISE_IMAGE",
    EMAIL = "EMAIL",
    RATING_STAR = "RATING_STAR",
    RADIO = "RADIO",
    MULTIPLECHOICE = "MULTIPLECHOICE",
    SELECT = "SELECT",
    TEXT = "TEXT",
    LONGTEXT = "LONGTEXT",
    NUMBER = "NUMBER",
    RATING_EMOJI = "RATING_EMOJI",
    RATING_NUMBER = "RATING_NUMBER",
    DATE = "DATE",
    BOOLEAN = "BOOLEAN",
    PASSWORD = "PASSWORD",
    CONSENT = "CONSENT",
    MULTI_QUESTION_MATRIX = "MULTI_QUESTION_MATRIX",
    POINT_SYSTEM= "POINT_SYSTEM",
    PRIORITY_LIST = "PRIORITY_LIST",
    INFO_PAGE = "INFO_PAGE",
    UPLOAD_FILE = "UPLOAD_FILE",
    UPLOAD_IMAGE = "UPLOAD_IMAGE",
}

export class QuestionType{
    conf: any;
}

export type QuestionAssetsBase = {
    [key: string]: any;
    placeholder?: string;
    subtitle?: string | Record<string, string>;
    subtitleStyle?: string | string[];
    titleSize?: string;
    titleAlign?: string;
    titleStyle?: string | string[];
    maxCharacters?: number;
    randomPosition?: boolean;
    direction?: "row" | "column" | string;
    order?: "ltr" | "rtl" | string;
    min?: number;
    max?: number;
    minPlaceholder?: string;
    maxPlaceholder?: string;
    extraOption?: boolean;
    extraOptionText?: string;
    extraOptionPlaceholder?: string;
};

export type QuestionAssetsByType = {
    [FEEDBACKAPPANSWERTYPE.TEXT]: QuestionAssetsBase;
    [FEEDBACKAPPANSWERTYPE.LONGTEXT]: QuestionAssetsBase & {
        maxCharacters?: number;
    };
    [FEEDBACKAPPANSWERTYPE.NUMBER]: QuestionAssetsBase;
    [FEEDBACKAPPANSWERTYPE.RADIO]: QuestionAssetsBase & {
        exclusiveAnswers?: string[];
        maxOptions?: number;
        extraOption?: boolean;
        extraOptionText?: string;
        extraOptionPlaceholder?: string;
    };
    [FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE]: QuestionAssetsByType[FEEDBACKAPPANSWERTYPE.RADIO];
    [FEEDBACKAPPANSWERTYPE.SELECT]: QuestionAssetsBase;
    [FEEDBACKAPPANSWERTYPE.DATE]: QuestionAssetsBase;
    [FEEDBACKAPPANSWERTYPE.EMAIL]: QuestionAssetsBase;
    [FEEDBACKAPPANSWERTYPE.PASSWORD]: QuestionAssetsBase;
    [FEEDBACKAPPANSWERTYPE.BOOLEAN]: QuestionAssetsBase & {
        addIcon?: boolean;
    };
    [FEEDBACKAPPANSWERTYPE.CONSENT]: QuestionAssetsBase;
    [FEEDBACKAPPANSWERTYPE.RATING_EMOJI]: QuestionAssetsBase & {
        min?: number;
        max?: number;
        minPlaceholder?: string;
        maxPlaceholder?: string;
        extraOption?: boolean;
        extraOptionText?: string;
    };
    [FEEDBACKAPPANSWERTYPE.RATING_NUMBER]: QuestionAssetsBase & {
        min?: number;
        max?: number;
        minPlaceholder?: string;
        maxPlaceholder?: string;
        numberPlaceholders?: Record<number, string>;
        extraOption?: boolean;
        extraOptionText?: string;
        ariaLabel?: string;
    };
    [FEEDBACKAPPANSWERTYPE.RATING_STAR]: QuestionAssetsBase & {
        minPlaceholder?: string;
        maxPlaceholder?: string;
    };
    [FEEDBACKAPPANSWERTYPE.MULTIPLECHOISE_IMAGE]: QuestionAssetsBase & {
        addTitle?: boolean;
        multiOption?: boolean;
        extraOption?: boolean;
        extraOptionValue?: any[];
    };
    [FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX]: QuestionAssetsBase & {
        options?: string[];
        exclusiveAnswers?: string[];
    };
    [FEEDBACKAPPANSWERTYPE.PRIORITY_LIST]: QuestionAssetsBase & {
        limitPriority?: boolean;
        maxPriority?: number;
    };
    [FEEDBACKAPPANSWERTYPE.POINT_SYSTEM]: QuestionAssetsBase;
    [FEEDBACKAPPANSWERTYPE.INFO_PAGE]: QuestionAssetsBase;
    [FEEDBACKAPPANSWERTYPE.UPLOAD_FILE]: QuestionAssetsBase & {
        multiple?: boolean;
        maxFiles?: number;
        /** Maximum size per file, in megabytes (MB). 0 / undefined = unlimited. */
        maxFileSize?: number;
    };
    [FEEDBACKAPPANSWERTYPE.UPLOAD_IMAGE]: QuestionAssetsByType[FEEDBACKAPPANSWERTYPE.UPLOAD_FILE];
    [FEEDBACKAPPANSWERTYPE.CONTACT]: QuestionAssetsBase;
};

export type QuestionAssetsFor<T extends FEEDBACKAPPANSWERTYPE | string> =
    T extends FEEDBACKAPPANSWERTYPE ? QuestionAssetsByType[T] & QuestionAssetsBase : QuestionAssetsBase;

export type NativeQuestion<T extends FEEDBACKAPPANSWERTYPE | string = FEEDBACKAPPANSWERTYPE | string> = {
    id: string;
    title: string;
    type: T;
    questionType: QuestionType;
    ref: string;
    require: boolean;
    external_id: string;
    value: string[];
    defaultValue: string;
    appId?: string;
    followup: boolean;
    position: number;
    assets: QuestionAssetsFor<T>;
    refMetric: string;
    integrationId: string;
    integrationPageId: string;
    generatedAt?: string | null;
    updatedAt?: string | null;
    status?: string;
    followupQuestion?: string[]; // Nueva propiedad opcional
};

export type NativeAnswer = {
    key: string;
    // value se amplía a any[] para soportar casos especiales como MULTI_QUESTION_MATRIX donde
    // se requiere una estructura anidada: [ [ { key: rowKey, value: [..] }, ... ] ]
    // Mantener string[] también funciona porque strings siguen siendo válidos dentro de any[]
    value: any[];
};

export type NativeFeedback = {
    text: string,
    answers: NativeAnswer[],
    profile: NativeAnswer[],
    metrics: NativeAnswer[],
    metadata: NativeAnswer[],
}

//===============================================
// Agent survey (dynamic, AI-driven surveys)
//===============================================

export type ConversationRole = "agent" | "user";

/**
 * One entry of the running transcript. The agent endpoints are stateless, so the
 * FULL conversation is resent on every /next call.
 */
export type ConversationTurn = {
    role: ConversationRole;
    content: string;
    questionType?: string;
    questionRef?: string;
};

/**
 * Question fields the agent endpoints return. `nextQuestion` is documented as a
 * plain string, but the backend may also ship a full NativeQuestion (here or
 * under `question`). The adapter normalizes both shapes.
 */
export type AgentQuestionPayload = {
    nextQuestion?: string | NativeQuestion | null;
    question?: NativeQuestion | null;
    questionType?: string;
    questionRef?: string;
    questionValues?: string[] | null;
    isFromBase?: boolean;
};

export type AgentStartRequest = {
    publicKey: string;
    privateKey?: string;
    integrationId: string;
};

export type AgentStartResponse = AgentQuestionPayload & {
    sessionId: string;
    coverageGaps?: string;
    maxTurns: number;
    currentTurn: number;
};

export type AgentNextRequest = AgentStartRequest & {
    sessionId: string;
    conversation: ConversationTurn[];
    currentTurn: number;
    lastAnswer: string;
    lastQuestionRef?: string;
    askedRefs?: string[];
};

export type AgentNextResponse = AgentStartResponse & {
    shouldEnd: boolean;
    answerType?: string;
    topic?: string;
    coverageSummary?: string;
};

/** `answerType` value that means the answer was blocked by content moderation. */
export const AGENT_ANSWER_TYPE_BLOCKED = "ABUSIVE_OR_OFFENSIVE";

export type AgentEndReason =
    | "SHOULD_END"   // shouldEnd === true
    | "NO_QUESTION"  // question text null/empty (moderation scrubbed it, or AI outage)
    | "TYPE_NONE"    // questionType === "NONE"
    | "BLOCKED"      // answerType === ABUSIVE_OR_OFFENSIVE
    | "MAX_TURNS";   // client-side hard stop

/**
 * The normalized result of one server response. Being a discriminated union is
 * the point: consumers must switch on `kind`, so there is no code path that can
 * read `nextQuestion` without going through the OR'd end detection.
 */
export type AgentStep =
    | {
        kind: "QUESTION";
        question: NativeQuestion;
        isFromBase: boolean;
        currentTurn: number;
        maxTurns: number;
        topic?: string;
        coverageGaps?: string;
        coverageSummary?: string;
    }
    | {
        kind: "END";
        reason: AgentEndReason;
        currentTurn: number;
        maxTurns: number;
        coverageSummary?: string;
    };

export type generateFormOptions = {
    addButton?: boolean;
    sendButtonText?: string;
    backButtonText?: string;
    nextButtonText?: string;
    startButtonText?: string;
    addSuccessScreen?: boolean;
    successMessage?: string;
    questionFormat?: "standard" | "slim";
    getMetaData?: boolean;
    customMetaData?: NativeAnswer[];
    tag?: generateFormOptionsTag;
    afterSubmitEvent?: Function;
    beforeSubmitEvent?: Function;
    onFinishEvent?: Function;
    onLoadedEvent?: Function;
    onBackEvent?: Function;
};

enum generateFormOptionsTag {
    FORM = "form",
    DIV = "div",
}

/**
 * Options for an agent (dynamic) survey. Superset of `generateFormOptions`, so
 * every existing lifecycle hook and button label keeps working.
 */
export type agentFormOptions = generateFormOptions & {
    /**
     * Language used for placeholders, Yes/No labels and localized titles.
     * Agent mode does not fetch the integration, so it cannot infer it.
     * Default "en".
     */
    lang?: string;
    /**
     * Brand color scoped to the survey container. Agent mode does not fetch the
     * integration, so `style.primaryColor` has to be supplied here (the
     * auto-detected path via `form()` picks it up from the payload instead).
     */
    primaryColor?: string;
    /** Delimiter used to join MULTIPLECHOICE selections into `lastAnswer`. Default ", ". */
    answerDelimiter?: string;
    /** Shown when the agent blocks the conversation (abusive/off-limits answer). */
    blockedMessage?: string;
    /** Error shown when a required question is submitted empty. */
    requiredMessage?: string;
    /** Message shown while backing off from a 429. `{seconds}` is interpolated. */
    rateLimitMessage?: string;
    /** Restore an in-flight session from localStorage on generate(). Default true. */
    resume?: boolean;
    /**
     * Enables a client-only back button. Off by default: answers persist server
     * side BEFORE the AI call and there is no endpoint to retract them, so going
     * back leaves a duplicate stored answer for the same ref.
     */
    allowBack?: boolean;
    /** Value sent as `lastAnswer` when an optional question is left empty. Default "". */
    emptyAnswerText?: string;
    /** Fired once per rendered agent turn, with the agent-specific metadata. */
    onAgentTurnEvent?: Function;
};

/**
 * Input for previewing a single page in the survey creator without persisting feedback.
 * The caller provides everything needed to render the page so no API call is made.
 */
export type PreviewPageInput = {
    /**
     * Page to render. Can be a Page instance or a plain object with at least integrationQuestions.
     */
    page: {
        id?: string;
        position?: number;
        integrationQuestions: NativeQuestion[];
        integrationPageRoutes?: any[];
    };
    /**
     * Survey identity. Affects buttons (MAGICSURVEY shows back/next, MAGICFORM shows submit).
     * Defaults to 'MAGICFORM'.
     */
    identity?: string;
    /**
     * Language code used to localize question titles. Defaults to 'en'.
     */
    lang?: string;
    /**
     * Product config (custom icons, ids, etc). Optional.
     */
    product?: any;
    /**
     * Style overrides. Optional.
     */
    style?: Record<string, any>;
    /**
     * Optional app id used as a label/identifier for the preview container. Defaults to 'preview'.
     */
    appId?: string;
};
