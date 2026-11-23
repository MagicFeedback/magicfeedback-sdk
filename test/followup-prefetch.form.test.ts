import {afterEach, beforeEach, describe, expect, jest, test} from "@jest/globals";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";
import {FOLLOWUP_PREFETCH_IDLE_MS, Form} from "../src/models/form";
import {Config} from "../src/models/config";
import {FormData} from "../src/models/formData";
import {Page} from "../src/models/page";
import * as requestService from "../src/services/request.service";

/**
 * DD-281: the follow up of an open question is asked for while the respondent
 * types (after FOLLOWUP_PREFETCH_IDLE_MS without a key, or on leaving the
 * field), so it is ready when they press Next.
 */

const question = (id: string, type: FEEDBACKAPPANSWERTYPE, position: number, followup: boolean): NativeQuestion => ({
    id, title: `Q${id}`, type, questionType: {conf: null} as any, ref: `q${id}`, require: false,
    external_id: "", value: [], defaultValue: "", appId: "app-id", followup, position, assets: {}, refMetric: "",
    integrationId: "integration-1", integrationPageId: `page-${position}`, generatedAt: null, updatedAt: null,
    status: "ACTIVE", followupQuestion: [],
});

const followUp = (title: string): NativeQuestion => ({...question("fu", FEEDBACKAPPANSWERTYPE.LONGTEXT, 1, false), ref: "q1-followup", title});

const setupForm = (type: FEEDBACKAPPANSWERTYPE = FEEDBACKAPPANSWERTYPE.LONGTEXT, followup = true): Form => {
    const questions = [question("1", type, 1, followup), question("2", FEEDBACKAPPANSWERTYPE.TEXT, 2, false)];
    const pages = questions.map((q, i) => new Page(`page-${i + 1}`, i + 1, "integration-1", [q], []));
    const form = new Form(new Config(), "app-id", "public-key");
    (form as any).config.set("url", "https://api.test");
    (form as any).formData = new FormData(
        "form-1", "Test Form", "", "MAGICFORM", "MAGICFORM", "ACTIVE", new Date(), new Date(), null,
        "company-1", "product-1", {customIcons: false, id: "product-1"}, "user-1", {}, {},
        questions, ["en"], {}, pages,
    );
    (form as any).selector = "form-container";
    (form as any).formOptionsConfig = {...(form as any).formOptionsConfig, addButton: false};
    return form;
};

const field = () => document.querySelector("#magicfeedback-questions-app-id textarea, #magicfeedback-questions-app-id input") as HTMLInputElement;
const type = (value: string) => {
    field().value = value;
    field().dispatchEvent(new Event("input", {bubbles: true}));
};
const leave = () => field().dispatchEvent(new FocusEvent("focusout", {bubbles: true}));
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };
const shownTitle = () => document.querySelector("#magicfeedback-questions-app-id")?.textContent ?? "";

describe("Follow up asked for while typing (DD-281)", () => {
    let followUpSpy: ReturnType<typeof jest.spyOn>;
    let sendSpy: ReturnType<typeof jest.spyOn>;
    let logSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML = '<div id="form-container"></div>';
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
        sendSpy = jest.spyOn(requestService, "sendFeedback").mockResolvedValue("session-1" as never);
        followUpSpy = jest.spyOn(requestService, "getFollowUpQuestion")
            .mockImplementation(async (_url: string, body: any) => followUp(`Why "${body.answer}"?`));
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test("asks once the respondent stops typing, and Next uses it without a new call", async () => {
        const form = setupForm();
        await (form as any).generateForm("open");

        type("Slow");
        type("Slow delivery");
        jest.advanceTimersByTime(FOLLOWUP_PREFETCH_IDLE_MS - 1);
        expect(followUpSpy).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(followUpSpy).toHaveBeenCalledTimes(1);

        const body = followUpSpy.mock.calls[0][1] as any;
        expect(body.answer).toBe("Slow delivery");
        expect(body.question.ref).toBe("q1");
        expect(body).toHaveProperty("previousAnswers");
        expect(body).toHaveProperty("upcomingQuestions");
        expect(body.publicKey).toBe("public-key");

        await form.send();
        expect(followUpSpy).toHaveBeenCalledTimes(1);
        expect(shownTitle()).toContain('Why "Slow delivery"?');
    });

    test("asks right away when the respondent leaves the field", async () => {
        const form = setupForm();
        await (form as any).generateForm("open");

        type("Great");
        leave();
        expect(followUpSpy).toHaveBeenCalledTimes(1);
        expect((followUpSpy.mock.calls[0][1] as any).answer).toBe("Great");
        // the pending idle timer does not ask again
        jest.advanceTimersByTime(FOLLOWUP_PREFETCH_IDLE_MS);
        await flush();
        expect(followUpSpy).toHaveBeenCalledTimes(1);
    });

    test("an answer changed after the request asks again, and Next shows the follow up of the final answer", async () => {
        const form = setupForm();
        await (form as any).generateForm("open");

        type("Good");
        leave();
        await flush();
        type("Bad");
        leave();
        await flush();
        expect(followUpSpy).toHaveBeenCalledTimes(2);

        await form.send();
        expect(followUpSpy).toHaveBeenCalledTimes(2);
        expect(shownTitle()).toContain('Why "Bad"?');
        expect(shownTitle()).not.toContain('Why "Good"?');
    });

    test("keeps at most one request in flight, then asks for the last answer only", async () => {
        const resolvers: Array<() => void> = [];
        followUpSpy.mockImplementation((_url: string, body: any) =>
            new Promise((resolve) => resolvers.push(() => resolve(followUp(`Why "${body.answer}"?`)))));
        const form = setupForm();
        await (form as any).generateForm("open");

        type("A");
        leave();
        type("AB");
        leave();
        type("ABC");
        leave();
        expect(followUpSpy).toHaveBeenCalledTimes(1);

        resolvers[0]();
        await flush();
        expect(followUpSpy).toHaveBeenCalledTimes(2);
        expect((followUpSpy.mock.calls[1][1] as any).answer).toBe("ABC");

        // Next while the last one is in flight waits for it instead of asking again
        const sending = form.send();
        await flush();
        expect(followUpSpy).toHaveBeenCalledTimes(2);
        resolvers[1]();
        await sending;
        expect(followUpSpy).toHaveBeenCalledTimes(2);
        expect(shownTitle()).toContain('Why "ABC"?');
    });

    test("does not ask for an empty answer", async () => {
        const form = setupForm();
        await (form as any).generateForm("open");

        type("   ");
        leave();
        jest.advanceTimersByTime(FOLLOWUP_PREFETCH_IDLE_MS);
        expect(followUpSpy).not.toHaveBeenCalled();
    });

    test("a question without follow up never asks", async () => {
        const form = setupForm(FEEDBACKAPPANSWERTYPE.LONGTEXT, false);
        await (form as any).generateForm("open");

        type("Anything");
        leave();
        jest.advanceTimersByTime(FOLLOWUP_PREFETCH_IDLE_MS);
        await form.send();
        expect(followUpSpy).not.toHaveBeenCalled();
    });

    test("Next without typing pauses still asks on Next, as before", async () => {
        const form = setupForm();
        await (form as any).generateForm("open");

        field().value = "Typed and sent";
        await form.send();
        expect(followUpSpy).toHaveBeenCalledTimes(1);
        expect((followUpSpy.mock.calls[0][1] as any).answer).toBe("Typed and sent");
        expect(sendSpy).toHaveBeenCalled();
        expect(shownTitle()).toContain('Why "Typed and sent"?');
    });

    test("the follow up page never asks for a follow up of the follow up", async () => {
        const form = setupForm();
        await (form as any).generateForm("open");
        type("Slow");
        leave();
        await form.send();
        expect(followUpSpy).toHaveBeenCalledTimes(1);

        type("Because");
        leave();
        jest.advanceTimersByTime(FOLLOWUP_PREFETCH_IDLE_MS);
        expect(followUpSpy).toHaveBeenCalledTimes(1);
        logSpy.mockRestore();
    });
});
