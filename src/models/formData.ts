import {NativeQuestion} from "./types";
import {Page} from "./page";

export class FormData {
    id: string;

    name: string;

    description: string;

    type: string;

    identity: string;

    status: string;

    createdAt: Date;

    updatedAt: Date;

    savedAt?: Date;

    externalId?: string | null;

    companyId: string;

    productId: string;

    product?: any;

    userId: string;

    setting: Record<string, any>;

    conf: Record<string, any>;

    questions: NativeQuestion[];

    lang: string[];

    // Language the API actually served (`resolveSurveyLang`). Optional: older
    // API versions do not send it.
    servedLang?: string;

    style: Record<string, any>;

    pages: Page[];

    // --- Agent (dynamic) survey config. Optional and intentionally NOT in the
    // constructor: FormData is only ever used as a cast target for the JSON the
    // API returns, and its constructor already takes 19 positional args.
    mode?: "STATIC" | "AGENT";

    agentBrief?: string;

    agentMaxTurns?: number;

    constructor(
        id: string,
        name: string,
        description: string,
        type: string,
        identity: string,
        status: string,
        createdAt: Date,
        updatedAt: Date,
        externalId: string | null,
        companyId: string,
        productId: string,
        product: any,
        userId: string,
        setting: Record<string, any>,
        conf: Record<string, any>,
        questions: NativeQuestion[],
        lang: string[],
        style: Record<string, any>,
        pages: Page[]
    ) {
        this.id = id
        this.name = name
        this.description = description
        this.type = type
        this.identity = identity
        this.status = status
        this.createdAt = createdAt
        this.updatedAt = updatedAt
        this.externalId = externalId
        this.companyId = companyId
        this.productId = productId
        this.product = product
        this.userId = userId
        this.setting = setting
        this.conf = conf
        this.questions = questions
        this.lang = lang
        this.style = style
        this.pages = pages
    }
}
