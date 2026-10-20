import {afterEach, beforeEach, describe, expect, jest, test} from "@jest/globals";
import {FEEDBACKAPPANSWERTYPE, generateFormOptions, NativeQuestion} from "../src/models/types";
import {Form} from "../src/models/form";
import {Config} from "../src/models/config";
import {FormData} from "../src/models/formData";
import {Page} from "../src/models/page";
import * as requestService from "../src/services/request.service";
import {AUTO_ADVANCE_DELAY_MS} from "../src/utils/autoAdvance";

/**
 * `?<ref>=<value>&autoadvance=true`: the Quick answer links in emails open the
 * survey with the first question prefilled and send that page on their own.
 */

const question = (id: string, type: FEEDBACKAPPANSWERTYPE, position: number, page = position): NativeQuestion => ({
    id, title: `Q${id}`, type, questionType: {conf: null} as any, ref: `q${id}`, require: false,
    external_id: "", value: type === FEEDBACKAPPANSWERTYPE.RADIO ? ["a", "b"] : [], defaultValue: "",
    appId: "app-id", followup: false, position, assets: {}, refMetric: "", integrationId: "integration-1",
    integrationPageId: `page-${page}`, generatedAt: null, updatedAt: null, status: "ACTIVE", followupQuestion: [],
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

const star = question("1", FEEDBACKAPPANSWERTYPE.RATING_STAR, 1);
const text = question("2", FEEDBACKAPPANSWERTYPE.TEXT, 2);

// The questions on the page shown, by ref.
const shownRefs = () => Array.from(new Set(
    Array.from(document.querySelectorAll<HTMLInputElement>("#magicfeedback-questions-app-id .magicfeedback-input"))
        .map((input) => input.name)
        .filter(Boolean)
));
const afterDelay = () => new Promise((r) => setTimeout(r, AUTO_ADVANCE_DELAY_MS + 50));
const openWith = (search: string) => window.history.replaceState({}, "", `/${search}`);

describe("autoadvance query param", () => {
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
        openWith("");
    });

    test("sends the prefilled first page and stores its answer", async () => {
        openWith("?q1=4&autoadvance=true");
        const form = setupForm([[star], [text]]);
        await (form as any).generateForm("open");

        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(sendSpy.mock.calls[0])).toContain('"key":"q1","value":["4"]');
        expect(shownRefs()).toEqual(["q2"]);
    });

    test("the prefilled page is never shown: hidden and reported as loading", async () => {
        openWith("?q1=4&autoadvance=true");
        const container = () => document.getElementById("magicfeedback-questions-app-id") as HTMLElement;
        const seen: any[] = [];
        const form = setupForm([[star], [text]], {
            onLoadedEvent: (res: any) => seen.push({...res, visibility: container().style.visibility}),
        });
        await (form as any).generateForm("open");

        expect(seen[0]).toMatchObject({loading: true, autoAdvancing: true, visibility: "hidden"});
        expect(container().style.visibility).toBe("");
        expect(shownRefs()).toEqual(["q2"]);
    });

    test("a failed send shows the prefilled page so the visitor can retry", async () => {
        openWith("?q1=4&autoadvance=true");
        sendSpy.mockRejectedValue(new Error("down") as never);
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        await (setupForm([[star], [text]]) as any).generateForm("open");
        errorSpy.mockRestore();

        expect(document.getElementById("magicfeedback-questions-app-id")!.style.visibility).toBe("");
        expect(shownRefs()).toEqual(["q1"]);
    });

    test("without autoadvance the first page loads as usual", async () => {
        openWith("?q1=4");
        const seen: any[] = [];
        await (setupForm([[star], [text]], {onLoadedEvent: (res: any) => seen.push(res)}) as any).generateForm("open");

        expect(seen[0]).toMatchObject({loading: false, autoAdvancing: false});
    });

    test("accepts autoadvance=1 too", async () => {
        openWith("?q1=4&autoadvance=1");
        await (setupForm([[star], [text]]) as any).generateForm("open");
        await afterDelay();

        expect(sendSpy).toHaveBeenCalledTimes(1);
    });

    test("without the param the visitor still presses Next (the behaviour so far)", async () => {
        openWith("?q1=4");
        await (setupForm([[star], [text]]) as any).generateForm("open");
        await afterDelay();

        expect(sendSpy).not.toHaveBeenCalled();
        expect(shownRefs()).toEqual(["q1"]);
    });

    test("a value that matches no option is left for the visitor", async () => {
        openWith("?q1=9&autoadvance=true");
        await (setupForm([[star], [text]]) as any).generateForm("open");
        await afterDelay();

        expect(sendSpy).not.toHaveBeenCalled();
    });

    test("a first page with more questions is left for the visitor", async () => {
        openWith("?q1=4&autoadvance=true");
        const sameDayText = question("2", FEEDBACKAPPANSWERTYPE.TEXT, 2, 1);
        await (setupForm([[star, sameDayText]]) as any).generateForm("open");
        await afterDelay();

        expect(sendSpy).not.toHaveBeenCalled();
    });

    test("with a welcome message it advances once Start is pressed", async () => {
        openWith("?q1=4&autoadvance=true");
        const form = setupForm([[star], [text]]);
        await (form as any).generateWelcomeMessage("Welcome");
        await afterDelay();
        expect(sendSpy).not.toHaveBeenCalled();

        form.startForm();
        await afterDelay();

        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(shownRefs()).toEqual(["q2"]);
    });

    test("going back to the first page does not send it again", async () => {
        openWith("?q1=4&autoadvance=true");
        const form = setupForm([[star], [text]]);
        await (form as any).generateForm("open");
        await afterDelay();

        await form.back();
        await afterDelay();

        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(shownRefs()).toEqual(["q1"]);
    });
});
