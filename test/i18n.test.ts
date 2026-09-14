import {afterEach, beforeEach, describe, expect, test} from "@jest/globals";
import {
    AVAILABLE_LANGUAGES,
    SUPPORTED_LANGUAGES,
    hasOwnTranslation,
    isLanguageSupported,
    isRtlLanguage,
    normalizeLanguage,
    t,
    TRANSLATION_KEYS,
    TranslationKey,
} from "../src/services/i18n";
import {placeholder} from "../src/services/placeholder";
import {getBooleanOptions} from "../src/render/helpers";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";
import {Form} from "../src/models/form";
import {Config} from "../src/models/config";
import {FormData} from "../src/models/formData";
import {Page} from "../src/models/page";

// The full key list, spelled out so removing or renaming one is a visible diff.
const KEYS: TranslationKey[] = [
    "placeholder.answer",
    "placeholder.number",
    "placeholder.email",
    "placeholder.date",
    "placeholder.password",
    "pointSystem.error",
    "boolean.yes",
    "boolean.no",
    "upload.cta",
    "upload.imagesOnly",
    "upload.anyFileType",
    "upload.maxFiles",
    "upload.maxSize",
    "upload.tooLarge",
    "upload.remove",
    "select.placeholder",
    "rating.ariaLabel",
    "priority.selectUpTo",
    "priority.options",
    "priority.thenOrder",
    "priority.selectOptions",
    "priority.cancel",
    "priority.confirm",
    "priority.selectOptionNumber",
    "priority.prioritized",
    "priority.of",
    "priority.instruction",
    "action.send",
    "action.back",
    "action.next",
    "action.start",
    "message.success",
    "message.blocked",
    "message.required",
    "message.rateLimit",
];

describe("i18n", () => {
    test("the product's language list is fully covered", () => {
        expect(SUPPORTED_LANGUAGES.sort()).toEqual(
            ["ar", "bn", "da", "de", "en", "es", "fi", "fr", "no", "pt", "sv"].sort()
        );
    });

    test("the key list is the one the renderers expect", () => {
        expect(TRANSLATION_KEYS.slice().sort()).toEqual(KEYS.slice().sort());
    });

    test("every supported language translates every key itself", () => {
        const missing: string[] = [];

        SUPPORTED_LANGUAGES.forEach((lang) => {
            KEYS.forEach((key) => {
                if (!hasOwnTranslation(lang, key)) missing.push(`${lang}:${key}`);
                expect(t(lang, key)).toBeTruthy();
            });
        });

        expect(missing).toEqual([]);
    });

    test("partially translated languages fall back to English per key", () => {
        expect(t("it", "boolean.yes")).toBe("Sì");
        expect(t("it", "placeholder.answer")).toBe(t("en", "placeholder.answer"));
        expect(AVAILABLE_LANGUAGES).toEqual(expect.arrayContaining(["it", "nl", "pl", "ru", "ja", "zh", "ko"]));
    });

    test("regional and aliased tags resolve to their base locale", () => {
        expect(normalizeLanguage("es-ES")).toBe("es");
        expect(normalizeLanguage("pt_BR")).toBe("pt");
        expect(normalizeLanguage("nb-NO")).toBe("no");
        expect(normalizeLanguage("ZH-Hans")).toBe("zh");
        expect(normalizeLanguage("  fr  ")).toBe("fr");
    });

    test("unknown and empty languages fall back to English", () => {
        expect(normalizeLanguage(undefined)).toBe("en");
        expect(normalizeLanguage("")).toBe("en");
        expect(normalizeLanguage("xx")).toBe("en");
        expect(t("xx", "action.next")).toBe("Next");
        expect(isLanguageSupported("xx")).toBe(false);
        expect(isLanguageSupported("de")).toBe(true);
        expect(isLanguageSupported("it")).toBe(false);
    });

    test("only Arabic is right to left", () => {
        expect(isRtlLanguage("ar")).toBe(true);
        expect(isRtlLanguage("ar-EG")).toBe(true);
        expect(isRtlLanguage("en")).toBe(false);
        expect(isRtlLanguage("bn")).toBe(false);
        expect(isRtlLanguage(undefined)).toBe(false);
        expect(isRtlLanguage("xx")).toBe(false);
    });

    test("params are interpolated, including repeated tokens", () => {
        expect(t("en", "upload.maxFiles", {n: 3})).toBe("Max 3 files");
        expect(t("de", "upload.tooLarge", {mb: 10})).toBe("Datei ist zu groß (max. 10 MB)");
        expect(t("en", "message.rateLimit", {seconds: 5})).toBe("Too many requests. Retrying in 5s...");
    });

    test("placeholder facade and boolean options read from the table", () => {
        expect(placeholder.answer("de")).toBe(t("de", "placeholder.answer"));
        expect(placeholder.upload.formats("fr", "image")).toBe("Images uniquement");
        expect(placeholder.upload.formats("fr", "file")).toBe("Tout type de fichier");
        expect(placeholder.upload.maxSize("pt", 5)).toBe("Máx. 5 MB");
        expect(getBooleanOptions("de")).toEqual(["Ja", "Nein"]);
        expect(getBooleanOptions("bn")).toEqual(["হ্যাঁ", "না"]);
        expect(getBooleanOptions("xx")).toEqual(["Yes", "No"]);
    });
});

//===============================================
// End-to-end: a rendered form speaks the integration language
//===============================================

const buildQuestion = (overrides: Partial<NativeQuestion> = {}): NativeQuestion => ({
    id: "1",
    title: "Frage",
    type: FEEDBACKAPPANSWERTYPE.TEXT,
    questionType: {conf: null} as any,
    ref: "q-1",
    require: false,
    external_id: "",
    value: [],
    defaultValue: "",
    appId: "app-id",
    followup: false,
    position: 1,
    assets: {},
    refMetric: "",
    integrationId: "integration-1",
    integrationPageId: "page-1",
    generatedAt: null,
    updatedAt: null,
    status: "ACTIVE",
    followupQuestion: [],
    ...overrides,
} as NativeQuestion);

const setupForm = (lang: string, questions: NativeQuestion[]): Form => {
    const form = new Form(new Config(), "app-id", "public-key");
    const pages = [new Page("page-1", 1, "integration-1", questions, [])];

    (form as any).formData = new FormData(
        "form-1", "Test Form", "", "MAGICFORM", "MAGICFORM", "ACTIVE",
        new Date(), new Date(), null, "company-1", "product-1",
        {customIcons: false, id: "product-1"}, "user-1", {}, {},
        questions, [lang], {}, pages
    );
    (form as any).selector = "form-container";

    return form;
};

describe("i18n in a rendered form", () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement("div");
        container.id = "form-container";
        document.body.appendChild(container);
    });

    afterEach(() => container.remove());

    test("placeholders and buttons follow the integration language", async () => {
        const form = setupForm("de", [buildQuestion()]);
        await (form as any).generateForm();

        const input = container.querySelector("input") as HTMLInputElement;
        expect(input.placeholder).toBe(t("de", "placeholder.answer"));
        expect((container.querySelector("#magicfeedback-submit") as HTMLElement).textContent)
            .toBe(t("de", "action.send"));
    });

    test("a regional tag resolves to its base locale", async () => {
        const form = setupForm("pt-BR", [buildQuestion()]);
        await (form as any).generateForm();

        const input = container.querySelector("input") as HTMLInputElement;
        expect(input.placeholder).toBe(t("pt", "placeholder.answer"));
    });

    test("an Arabic survey renders right to left", async () => {
        const form = setupForm("ar", [buildQuestion()]);
        await (form as any).generateForm();

        expect(container.getAttribute("dir")).toBe("rtl");
        expect(container.classList.contains("magicfeedback-rtl")).toBe(true);
    });

    test("a container reused by an LTR survey goes back to ltr", async () => {
        const arabic = setupForm("ar", [buildQuestion()]);
        await (arabic as any).generateForm();
        expect(container.getAttribute("dir")).toBe("rtl");

        const german = setupForm("de", [buildQuestion()]);
        await (german as any).generateForm();

        expect(container.getAttribute("dir")).toBe("ltr");
        expect(container.classList.contains("magicfeedback-rtl")).toBe(false);
    });

    test("an explicit button label still wins over the translation", async () => {
        const form = setupForm("de", [buildQuestion()]);
        (form as any).formOptionsConfig.sendButtonText = "Abschicken";
        await (form as any).generateForm();

        expect((container.querySelector("#magicfeedback-submit") as HTMLElement).textContent)
            .toBe("Abschicken");
    });
});
