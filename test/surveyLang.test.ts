import {describe, expect, test, afterEach, jest} from "@jest/globals";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";
import {
    baseValueMap,
    detectSurveyLang,
    normalizeSurveyLang,
    shownValueFor,
    toBaseAnswers,
    withLangParam,
} from "../src/services/surveyLang";

const question = (overrides: Partial<NativeQuestion>): NativeQuestion => ({
    id: "q",
    title: "",
    type: FEEDBACKAPPANSWERTYPE.RADIO,
    questionType: {conf: null} as any,
    ref: "q",
    require: false,
    external_id: "",
    value: [],
    defaultValue: "",
    followup: false,
    position: 1,
    assets: {},
    refMetric: "",
    integrationId: "i",
    integrationPageId: "p",
    ...overrides,
});

const shownEs = ["Muy satisfecho", "Satisfecho", "Insatisfecho"];
const baseDa = ["Meget tilfreds", "Tilfreds", "Utilfreds"];

describe("normalizeSurveyLang", () => {
    test.each([
        ["es", "es"],
        ["ES", "es"],
        ["es-ES", "es"],
        ["pt_BR", "pt"],
        ["nb-NO", "no"],
        ["nn", "no"],
        [" da ", "da"],
    ])("%s -> %s", (input, expected) => {
        expect(normalizeSurveyLang(input)).toBe(expected);
    });

    test.each([[undefined], [null], [""], ["*"], ["123"]])("%s -> null", (input) => {
        expect(normalizeSurveyLang(input as any)).toBeNull();
    });
});

describe("detectSurveyLang", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("an explicit language wins over the browser", () => {
        jest.spyOn(navigator, "language", "get").mockReturnValue("fr-FR");
        expect(detectSurveyLang("es-ES")).toBe("es");
    });

    test("falls back to the browser language", () => {
        jest.spyOn(navigator, "languages", "get").mockReturnValue(["sv-SE", "en"]);
        expect(detectSurveyLang()).toBe("sv");
    });
});

describe("withLangParam", () => {
    test("appends ?lang= or &lang=", () => {
        expect(withLangParam("https://api/x/info", "es")).toBe("https://api/x/info?lang=es");
        expect(withLangParam("https://api/x?a=1", "es")).toBe("https://api/x?a=1&lang=es");
        expect(withLangParam("https://api/x", null)).toBe("https://api/x");
    });
});

describe("baseValueMap", () => {
    test("is empty when the API sent no baseValue (default language)", () => {
        expect(baseValueMap(question({value: baseDa})).size).toBe(0);
    });

    test("maps by index, also for image options", () => {
        const q = question({
            value: [{position: 1, url: "a", value: "Rojo"}] as any,
            baseValue: [{position: 1, url: "a", value: "Rød"}],
        });
        expect(baseValueMap(q).get("Rojo")).toBe("Rød");
    });

    test("image options arrive as JSON strings", () => {
        const q = question({
            type: FEEDBACKAPPANSWERTYPE.MULTIPLECHOISE_IMAGE,
            value: [JSON.stringify({position: 1, url: "a", value: "Rojo"})],
            baseValue: [JSON.stringify({position: 1, url: "a", value: "Rød"})],
        });
        expect(toBaseAnswers([{key: "q", value: ["Rojo"]}], [q])).toEqual([{key: "q", value: ["Rød"]}]);
        expect(shownValueFor(q, "Rød")).toBe("Rojo");
    });
});

describe("toBaseAnswers", () => {
    test("RADIO, SELECT and MULTIPLECHOICE map to the base option", () => {
        const questions = [
            question({ref: "r", type: FEEDBACKAPPANSWERTYPE.RADIO, value: shownEs, baseValue: baseDa}),
            question({ref: "s", type: FEEDBACKAPPANSWERTYPE.SELECT, value: shownEs, baseValue: baseDa}),
            question({ref: "m", type: FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE, value: shownEs, baseValue: baseDa}),
        ];
        expect(toBaseAnswers([
            {key: "r", value: ["Satisfecho"]},
            {key: "s", value: ["Insatisfecho"]},
            {key: "m", value: ["Muy satisfecho", "Insatisfecho"]},
        ], questions)).toEqual([
            {key: "r", value: ["Tilfreds"]},
            {key: "s", value: ["Utilfreds"]},
            {key: "m", value: ["Meget tilfreds", "Utilfreds"]},
        ]);
    });

    test("unknown values (exclusive answers, other) pass through", () => {
        const q = question({ref: "m", type: FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE, value: shownEs, baseValue: baseDa});
        expect(toBaseAnswers([{key: "m", value: ["Ingen"]}], [q])).toEqual([{key: "m", value: ["Ingen"]}]);
    });

    test("extra-option free text is never mapped", () => {
        const q = question({ref: "m", value: shownEs, baseValue: baseDa});
        const answers = [{key: "extra-option-m", value: ["Satisfecho"]}];
        expect(toBaseAnswers(answers, [q])).toEqual(answers);
    });

    test("PRIORITY_LIST keeps the position prefix", () => {
        const q = question({ref: "p", type: FEEDBACKAPPANSWERTYPE.PRIORITY_LIST, value: shownEs, baseValue: baseDa});
        expect(toBaseAnswers([{key: "p", value: ["1. Insatisfecho", "2. Satisfecho"]}], [q]))
            .toEqual([{key: "p", value: ["1. Utilfreds", "2. Tilfreds"]}]);
    });

    test("POINT_SYSTEM keeps the points", () => {
        const q = question({ref: "ps", type: FEEDBACKAPPANSWERTYPE.POINT_SYSTEM, value: shownEs, baseValue: baseDa});
        expect(toBaseAnswers([{key: "ps", value: ["Satisfecho:40%"]}], [q]))
            .toEqual([{key: "ps", value: ["Tilfreds:40%"]}]);
    });

    test("MULTI_QUESTION_MATRIX maps the columns, keeps the rows", () => {
        const q = question({ref: "mx", type: FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX, value: shownEs, baseValue: baseDa});
        const [answer] = toBaseAnswers(
            [{key: "mx", value: [JSON.stringify([{key: "Row A", value: ["Satisfecho"]}])]}],
            [q],
        );
        expect(JSON.parse(answer.value[0])).toEqual([{key: "Row A", value: ["Tilfreds"]}]);
    });

    test("open text is untouched", () => {
        const q = question({ref: "t", type: FEEDBACKAPPANSWERTYPE.TEXT, value: shownEs, baseValue: baseDa});
        expect(toBaseAnswers([{key: "t", value: ["Satisfecho"]}], [q])).toEqual([{key: "t", value: ["Satisfecho"]}]);
    });
});

describe("shownValueFor", () => {
    test("turns a base-language URL prefill into the shown label", () => {
        const q = question({value: shownEs, baseValue: baseDa});
        expect(shownValueFor(q, "Tilfreds")).toBe("Satisfecho");
        expect(shownValueFor(q, "Nope")).toBe("Nope");
        expect(shownValueFor(q, null)).toBeNull();
        expect(shownValueFor(question({value: baseDa}), "Tilfreds")).toBe("Tilfreds");
    });
});
