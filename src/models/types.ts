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
