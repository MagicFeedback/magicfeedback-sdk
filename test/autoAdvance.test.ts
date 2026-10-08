import {afterEach, beforeEach, describe, expect, jest, test} from "@jest/globals";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";
import {renderQuestions} from "../src/services/questions.service";
import {AUTO_ADVANCE_DELAY_MS, cancelAutoAdvance, scheduleAutoAdvance} from "../src/utils/autoAdvance";

const question = (type: FEEDBACKAPPANSWERTYPE, overrides: Partial<NativeQuestion> = {}) => ({
    id: "q-1",
    title: "Question",
    type,
    questionType: {conf: null},
    ref: "q",
    require: false,
    value: [],
    defaultValue: "",
    assets: {},
    ...overrides,
} as unknown as NativeQuestion);

// One question on the page, so renderQuestions forwards `send`, as Form does.
const page = (q: NativeQuestion, send: () => unknown) => {
    const container = document.createElement("div");
    renderQuestions([q], "standard", "en", {customIcons: false}, send)
        .forEach((element) => container.appendChild(element));
    document.body.appendChild(container);
    return container;
};

const input = (container: HTMLElement, value: string) =>
    container.querySelector(`input[value="${value}"]`) as HTMLInputElement;

// A finger on the option's label, like on iOS
const tap = (el: HTMLInputElement) => (el.closest("label") ?? el)
    .dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, detail: 1}));

const checked = (container: HTMLElement) =>
    (container.querySelector("input:checked") as HTMLInputElement | null)?.value;

describe("auto-advance", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test("a BOOLEAN shows the pick checked and sends it AUTO_ADVANCE_DELAY_MS later", () => {
        const send = jest.fn();
        const container = page(question(FEEDBACKAPPANSWERTYPE.BOOLEAN), send);

        tap(input(container, "No"));

        expect(input(container, "No").checked).toBe(true);
        expect(send).not.toHaveBeenCalled();

        jest.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS - 1);
        expect(send).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        expect(send).toHaveBeenCalledTimes(1);
    });

    test("changing the pick within the window sends once, with the last pick", () => {
        const sentValues: (string | undefined)[] = [];
        const container = page(question(FEEDBACKAPPANSWERTYPE.BOOLEAN), () => sentValues.push(checked(container)));

        tap(input(container, "No"));
        jest.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS - 50);
        tap(input(container, "Yes"));

        // the window restarted on the second pick
        jest.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS - 1);
        expect(sentValues).toEqual([]);

        jest.advanceTimersByTime(1);
        expect(sentValues).toEqual(["Yes"]);

        jest.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS * 3);
        expect(sentValues).toEqual(["Yes"]);
    });

    test("doesn't send once the page has left the DOM", () => {
        const send = jest.fn();
        const container = page(question(FEEDBACKAPPANSWERTYPE.BOOLEAN), send);

        tap(input(container, "No"));
        container.remove();
        jest.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);

        expect(send).not.toHaveBeenCalled();
    });

    test("keyboard activation waits the same window", () => {
        const send = jest.fn();
        const container = page(question(FEEDBACKAPPANSWERTYPE.BOOLEAN), send);

        input(container, "Yes").click(); // detail 0, like Space on a focused radio

        expect(input(container, "Yes").checked).toBe(true);
        expect(send).not.toHaveBeenCalled();
        jest.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);
        expect(send).toHaveBeenCalledTimes(1);
    });

    test("cancelAutoAdvance drops only the pending sends inside the container", () => {
        const sendA = jest.fn();
        const sendB = jest.fn();
        const a = page(question(FEEDBACKAPPANSWERTYPE.BOOLEAN), sendA);
        const b = page(question(FEEDBACKAPPANSWERTYPE.BOOLEAN, {ref: "other"}), sendB);

        tap(input(a, "No"));
        tap(input(b, "No"));
        cancelAutoAdvance(a);
        cancelAutoAdvance(null);
        jest.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);

        expect(sendA).not.toHaveBeenCalled();
        expect(sendB).toHaveBeenCalledTimes(1);
    });

    test("scheduleAutoAdvance keeps one pending send per callback", () => {
        const send = jest.fn();
        const a = document.body.appendChild(document.createElement("input"));
        const b = document.body.appendChild(document.createElement("input"));

        scheduleAutoAdvance(a, send);
        scheduleAutoAdvance(b, send);
        a.remove(); // the latest source decides
        jest.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);

        expect(send).toHaveBeenCalledTimes(1);
    });

    test.each([
        ["RADIO", question(FEEDBACKAPPANSWERTYPE.RADIO, {value: ["Red", "Blue"]}), 'input[value="Blue"]'],
        ["RATING_NUMBER", question(FEEDBACKAPPANSWERTYPE.RATING_NUMBER, {assets: {min: 0, max: 10}}), 'input[value="7"]'],
        ["RATING_STAR", question(FEEDBACKAPPANSWERTYPE.RATING_STAR), 'input[value="4"]'],
        ["RATING_EMOJI", question(FEEDBACKAPPANSWERTYPE.RATING_EMOJI, {assets: {min: 1, max: 5}}), 'input[value="2"]'],
        ["MULTIPLECHOISE_IMAGE", question(FEEDBACKAPPANSWERTYPE.MULTIPLECHOISE_IMAGE, {
            value: [
                JSON.stringify({position: 1, url: "a.png", value: "A"}),
                JSON.stringify({position: 2, url: "b.png", value: "B"}),
            ],
        }), 'input[value="B"]'],
        ["CONSENT", question(FEEDBACKAPPANSWERTYPE.CONSENT), 'input[type="checkbox"]'],
    ])("%s waits the window before sending", (_type, q, selector) => {
        const send = jest.fn();
        const container = page(q, send);
        const option = container.querySelector(selector) as HTMLInputElement;

        option.click();

        expect(option.checked).toBe(true);
        expect(send).not.toHaveBeenCalled();
        jest.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);
        expect(send).toHaveBeenCalledTimes(1);
    });

    test("a RADIO's extra option still doesn't auto-advance", () => {
        const send = jest.fn();
        const container = page(question(FEEDBACKAPPANSWERTYPE.RADIO, {
            value: ["Red", "Other"],
            assets: {extraOption: true, extraOptionText: "Other"},
        }), send);

        input(container, "Other").click();
        jest.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS * 2);

        expect(send).not.toHaveBeenCalled();
    });
});
