import {afterEach, beforeEach, describe, expect, jest, test} from "@jest/globals";
import {FEEDBACKAPPANSWERTYPE, generateFormOptions, NativeQuestion} from "../src/models/types";
import {Form} from "../src/models/form";
import {Config} from "../src/models/config";
import {FormData} from "../src/models/formData";
import {Page} from "../src/models/page";
import * as requestService from "../src/services/request.service";
import {SubmitError} from "../src/services/submitErrors";

/**
 * `afterSubmitEvent({error})` carries a `code` so a host can tell "a required
 * question is empty" from "the API didn't save the answers". Both used to be a
 * bare "No response", and the message stays that for hosts that match on it.
 */

const question = (id: string, type: FEEDBACKAPPANSWERTYPE, position: number, require = false): NativeQuestion => ({
    id, title: `Q${id}`, type, questionType: {conf: null} as any, ref: `q${id}`, require,
    external_id: "", value: [], defaultValue: "",
    appId: "app-id", followup: false, position, assets: {}, refMetric: "", integrationId: "integration-1",
    integrationPageId: `page-${position}`, generatedAt: null, updatedAt: null, status: "ACTIVE", followupQuestion: [],
});

const setupForm = (pagesOf: NativeQuestion[][], options: generateFormOptions = {}): Form => {
    const questions = pagesOf.flat();
    const pages = pagesOf.map((qs, i) => new Page(`page-${i + 1}`, i + 1, "integration-1", qs, []));
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

const typeInto = (ref: string, value: string) => {
    const input = document.querySelector<HTMLInputElement>(`#magicfeedback-questions-app-id [name="${ref}"]`)!;
    input.value = value;
};

describe("submit errors", () => {
    let sendSpy: ReturnType<typeof jest.spyOn>;
    let logSpy: ReturnType<typeof jest.spyOn>;
    let errSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        document.body.innerHTML = '<div id="form-container"></div>';
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        sendSpy = jest.spyOn(requestService, "sendFeedback");
    });

    afterEach(() => {
        sendSpy.mockRestore();
        logSpy.mockRestore();
        errSpy.mockRestore();
    });

    test("an empty required question is REQUIRED, with the old message", async () => {
        const seen: any[] = [];
        const form = setupForm(
            [[question("1", FEEDBACKAPPANSWERTYPE.TEXT, 1, true)], [question("2", FEEDBACKAPPANSWERTYPE.TEXT, 2)]],
            {afterSubmitEvent: (res: any) => seen.push(res)},
        );
        await (form as any).generateForm("open");

        await form.send();

        expect(sendSpy).not.toHaveBeenCalled();
        expect(seen).toHaveLength(1);
        expect(seen[0].error).toBeInstanceOf(SubmitError);
        expect(seen[0].error).toMatchObject({code: "REQUIRED", message: "No response"});
    });

    test("a send the API doesn't save is SEND_FAILED, not REQUIRED", async () => {
        sendSpy.mockResolvedValue("" as never);
        const seen: any[] = [];
        const form = setupForm(
            [[question("1", FEEDBACKAPPANSWERTYPE.TEXT, 1, true)], [question("2", FEEDBACKAPPANSWERTYPE.TEXT, 2)]],
            {afterSubmitEvent: (res: any) => seen.push(res)},
        );
        await (form as any).generateForm("open");
        typeInto("q1", "hello");

        await form.send();

        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(seen).toHaveLength(1);
        expect(seen[0].error).toMatchObject({code: "SEND_FAILED", message: "No response"});
    });

    test("an empty optional question moves on with no error", async () => {
        sendSpy.mockResolvedValue("session-1" as never);
        const seen: any[] = [];
        const form = setupForm(
            [[question("1", FEEDBACKAPPANSWERTYPE.LONGTEXT, 1)], [question("2", FEEDBACKAPPANSWERTYPE.TEXT, 2)]],
            {afterSubmitEvent: (res: any) => seen.push(res)},
        );
        await (form as any).generateForm("open");

        await form.send();

        expect(seen).toHaveLength(1);
        expect(seen[0].error).toBeNull();
    });

    test("a completion push the API doesn't save reports one SEND_FAILED error object", async () => {
        sendSpy.mockResolvedValue("" as never);
        const seen: any[] = [];
        const form = setupForm(
            [[question("1", FEEDBACKAPPANSWERTYPE.TEXT, 1)]],
            {afterSubmitEvent: (res: any) => seen.push(res)},
        );
        await (form as any).generateForm("open");

        await form.finish();

        // Two callbacks (before the throw and from the catch), the same object in both.
        expect(seen).toHaveLength(2);
        expect(seen[0].error).toMatchObject({code: "SEND_FAILED"});
        expect(seen[1].error).toBe(seen[0].error);
        expect(seen[0].error.message).toBe("An error occurred while submitting the form app-id:");
    });
});
