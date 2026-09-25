import {describe, expect, test, beforeEach, afterEach, jest} from "@jest/globals";

jest.mock("../src/services/request.service", () => {
    const actual = jest.requireActual("../src/services/request.service") as any;
    return {
        ...actual,
        getForm: jest.fn(),
        getSessionForm: jest.fn(),
        sendFeedback: jest.fn(async () => "session-1"),
    };
});

import {Form} from "../src/models/form";
import {Config} from "../src/models/config";
import {FEEDBACKAPPANSWERTYPE} from "../src/models/types";
import {getForm, sendFeedback} from "../src/services/request.service";

const mockedGetForm = getForm as jest.MockedFunction<typeof getForm>;
const mockedSend = sendFeedback as jest.MockedFunction<typeof sendFeedback>;

const radio = {
    id: "q-1",
    ref: "q-1",
    title: "¿Qué tan satisfecho estás?",
    type: FEEDBACKAPPANSWERTYPE.RADIO,
    questionType: {conf: null},
    require: false,
    external_id: "",
    value: ["Muy satisfecho", "Satisfecho", "Insatisfecho"],
    baseValue: ["Meget tilfreds", "Tilfreds", "Utilfreds"],
    defaultValue: "",
    followup: false,
    position: 1,
    assets: {},
    refMetric: "",
    integrationId: "app-id",
    integrationPageId: "page-1",
    status: "ACTIVE",
};

const formData = (extra: Record<string, any> = {}) => ({
    id: "app-id",
    identity: "MAGICFORM",
    lang: ["da", "es", "en"],
    style: {},
    product: {customIcons: false},
    questions: [radio],
    pages: [{
        id: "page-1",
        position: 1,
        integrationId: "app-id",
        status: "ACTIVE",
        integrationQuestions: [radio],
        integrationPageRoutes: [],
    }],
    ...extra,
});

describe("Form multi-language", () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement("div");
        container.id = "mf";
        document.body.appendChild(container);
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
        mockedGetForm.mockReset();
        mockedSend.mockClear();
    });

    afterEach(() => {
        container.remove();
        jest.restoreAllMocks();
    });

    test("asks for the browser language and uses it as the active language", async () => {
        jest.spyOn(navigator, "languages", "get").mockReturnValue(["es-ES"]);
        mockedGetForm.mockResolvedValue(formData());

        const form = new Form(new Config(), "app-id", "public-key");
        await form.generate("mf", {getMetaData: false});

        expect(mockedGetForm.mock.calls[0][4]).toBe("es");
        expect(form.getLang()).toBe("es");
    });

    test("an explicit lang option wins over the browser", async () => {
        jest.spyOn(navigator, "languages", "get").mockReturnValue(["es-ES"]);
        mockedGetForm.mockResolvedValue(formData());

        const form = new Form(new Config(), "app-id", "public-key");
        await form.generate("mf", {getMetaData: false, lang: "en-GB"});

        expect(mockedGetForm.mock.calls[0][4]).toBe("en");
        expect(form.getLang()).toBe("en");
    });

    test("an unsupported language falls back to the survey default, servedLang wins", async () => {
        jest.spyOn(navigator, "languages", "get").mockReturnValue(["fr"]);

        mockedGetForm.mockResolvedValue(formData());
        const fallback = new Form(new Config(), "app-id", "public-key");
        await fallback.generate("mf", {getMetaData: false});
        expect(fallback.getLang()).toBe("da");

        mockedGetForm.mockResolvedValue(formData({servedLang: "en"}));
        const served = new Form(new Config(), "app-id", "public-key");
        await served.generate("mf", {getMetaData: false});
        expect(served.getLang()).toBe("en");
    });

    test("submits the base-language option and the active lang", async () => {
        jest.spyOn(navigator, "languages", "get").mockReturnValue(["es"]);
        mockedGetForm.mockResolvedValue(formData());

        const form = new Form(new Config(), "app-id", "public-key");
        await form.generate("mf", {getMetaData: false});

        const option = Array.from(container.querySelectorAll<HTMLInputElement>("input[type=radio]"))
            .find((input) => input.value === "Satisfecho");
        expect(option).toBeDefined();
        option!.checked = true;

        await form.send();

        const body = mockedSend.mock.calls[0][1];
        expect(body.lang).toBe("es");
        expect(body.feedback.answers).toEqual([{key: "q-1", value: ["Tilfreds"]}]);
    });
});
