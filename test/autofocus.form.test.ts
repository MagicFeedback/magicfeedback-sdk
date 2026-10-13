import {afterEach, beforeEach, describe, expect, jest, test} from "@jest/globals";
import {FEEDBACKAPPANSWERTYPE, generateFormOptions, NativeQuestion} from "../src/models/types";
import {Form} from "../src/models/form";
import {Config} from "../src/models/config";
import {FormData} from "../src/models/formData";
import {Page} from "../src/models/page";
import * as requestService from "../src/services/request.service";

/**
 * The `autofocus` option: the cursor goes to the first question of a page when
 * it is a text field, on the first page ("always") or only after "Start",
 * "Next" and "Back" ("navigation").
 */

const question = (id: string, type: FEEDBACKAPPANSWERTYPE, position: number): NativeQuestion => ({
    id, title: `Q${id}`, type, questionType: {conf: null} as any, ref: `q${id}`, require: false,
    external_id: "", value: type === FEEDBACKAPPANSWERTYPE.RADIO ? ["a", "b"] : [], defaultValue: "",
    appId: "app-id", followup: false, position, assets: {}, refMetric: "", integrationId: "integration-1",
    integrationPageId: `page-${position}`, generatedAt: null, updatedAt: null, status: "ACTIVE", followupQuestion: [],
});

/** One page per question, in order. */
const setupForm = (types: FEEDBACKAPPANSWERTYPE[], options: generateFormOptions): Form => {
    const questions = types.map((type, i) => question(String(i + 1), type, i + 1));
    const pages = questions.map((q, i) => new Page(`page-${i + 1}`, i + 1, "integration-1", [q], []));
    const form = new Form(new Config(), "app-id", "public-key");
    (form as any).config.set("url", "https://api.test");
    (form as any).formData = new FormData(
        "form-1", "Test Form", "", "MAGICFORM", "MAGICFORM", "ACTIVE", new Date(), new Date(), null,
        "company-1", "product-1", {customIcons: false, id: "product-1"}, "user-1", {}, {},
        questions, ["en"], {}, pages,
    );
    (form as any).selector = "form-container";
    (form as any).formOptionsConfig = {...(form as any).formOptionsConfig, addButton: false, ...options};
    return form;
};

const field = () => document.querySelector("#magicfeedback-questions-app-id input, #magicfeedback-questions-app-id textarea") as HTMLElement;
const focused = () => document.activeElement;
const answer = (value: string) => { (field() as HTMLInputElement).value = value; };

describe("Form autofocus", () => {
    let sendSpy: ReturnType<typeof jest.spyOn>;
    let logSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        document.body.innerHTML = '<div id="form-container"></div>';
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        sendSpy = jest.spyOn(requestService, "sendFeedback").mockResolvedValue("session-1" as never);
    });

    afterEach(() => {
        sendSpy.mockRestore();
        logSpy.mockRestore();
    });

    test("without the option nothing is focused (the behaviour so far)", async () => {
        const form = setupForm([FEEDBACKAPPANSWERTYPE.TEXT], {});
        await (form as any).generateForm("open");

        expect(focused()).toBe(document.body);
    });

    test("\"always\" focuses the first page as soon as it is rendered", async () => {
        const form = setupForm([FEEDBACKAPPANSWERTYPE.LONGTEXT], {autofocus: "always"});
        await (form as any).generateForm("open");

        expect(focused()).toBe(field());
        expect(field().tagName).toBe("TEXTAREA");
    });

    test("\"navigation\" leaves the first page alone", async () => {
        const form = setupForm([FEEDBACKAPPANSWERTYPE.TEXT], {autofocus: "navigation"});
        await (form as any).generateForm("open");

        expect(focused()).toBe(document.body);
    });

    test("\"navigation\" focuses the first page reached with \"Start\"", async () => {
        const form = setupForm([FEEDBACKAPPANSWERTYPE.TEXT], {autofocus: "navigation"});
        form.startForm();
        await new Promise((r) => setTimeout(r, 0));

        expect(focused()).toBe(field());
    });

    test("\"navigation\" focuses the next page after \"Next\", once the hook has run", async () => {
        let focusedInHook: Element | null = null;
        const form = setupForm([FEEDBACKAPPANSWERTYPE.TEXT, FEEDBACKAPPANSWERTYPE.EMAIL], {
            autofocus: "navigation",
            // An integration that keeps the questions inert while a page loads
            // releases them here: the focus must come after this hook.
            afterSubmitEvent: () => { focusedInHook = document.activeElement; },
        });
        await (form as any).generateForm("open");
        answer("first answer");

        await form.send();

        expect((field() as HTMLInputElement).type).toBe("email");
        expect(focusedInHook).not.toBe(field());
        expect(focused()).toBe(field());
    });

    test("\"navigation\" focuses the page \"Back\" returns to", async () => {
        const form = setupForm([FEEDBACKAPPANSWERTYPE.TEXT, FEEDBACKAPPANSWERTYPE.RADIO], {autofocus: "navigation"});
        await (form as any).generateForm("open");
        answer("first answer");
        await form.send();
        (document.activeElement as HTMLElement | null)?.blur();

        await form.back();

        expect((field() as HTMLInputElement).value).toBe("first answer");
        expect(focused()).toBe(field());
    });

    test("a next page that starts with a choice question is left alone", async () => {
        const form = setupForm([FEEDBACKAPPANSWERTYPE.TEXT, FEEDBACKAPPANSWERTYPE.RADIO], {autofocus: "navigation"});
        await (form as any).generateForm("open");
        answer("first answer");
        (document.activeElement as HTMLElement | null)?.blur();

        await form.send();

        expect(focused()).toBe(document.body);
    });

    test("focusFirstQuestion() focuses on demand, for integrations that show the survey later", async () => {
        const form = setupForm([FEEDBACKAPPANSWERTYPE.NUMBER], {autofocus: "navigation"});
        await (form as any).generateForm("open");
        expect(focused()).toBe(document.body);

        expect(form.focusFirstQuestion()).toBe(true);
        expect(focused()).toBe(field());
    });
});
