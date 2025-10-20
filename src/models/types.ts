export type Key = string;

export type InitOptions = {
    env?: 'dev' | 'prod';
    debug?: boolean;
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

export type NativeQuestion = {
    id: string;
    title: string;
    type: FEEDBACKAPPANSWERTYPE | string;
    questionType: QuestionType;
    ref: string;
    require: boolean;
    external_id: string;
    value: string[];
    defaultValue: string;
    appId?: string;
    followup: boolean;
    position: number;
    assets: any;
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
