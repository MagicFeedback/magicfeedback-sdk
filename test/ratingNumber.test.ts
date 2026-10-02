import {afterEach, beforeEach, describe, expect, jest, test} from "@jest/globals";
import {createRatingNumberElement, usesLegacyRatingNumber} from "../src/render/ratingHelpers";
import {renderQuestions} from "../src/services/questions.service";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";

type Callback = (entries: { contentRect: { width: number } }[]) => void;
let observed: { target: Element, callback: Callback }[] = [];

class FakeResizeObserver {
    constructor(private callback: Callback) {}
    observe(target: Element) { observed.push({target, callback: this.callback}); }
    disconnect() {}
}

let frames: FrameRequestCallback[] = [];
const flushFrames = () => { const due = frames; frames = []; due.forEach((frame) => frame(0)); };

const notify = (element: Element, width: number) =>
    observed.filter((o) => o.target === element).forEach((o) => o.callback([{contentRect: {width}}]));

// A resize as the browser delivers it: the observer fires, then the next frame runs.
const resize = (element: Element, width: number) => { notify(element, width); flushFrames(); };

const nps = (order = "rtl") => createRatingNumberElement(
    "nps",
    {min: 0, max: 10, minPlaceholder: "Not likely", maxPlaceholder: "Very likely"},
    order,
    "row",
    "magicfeedback-rating-number",
);

const container = (element: HTMLElement) =>
    element.querySelector(".magicfeedback-rating-number-container") as HTMLElement;

describe("rating number row that is too narrow for its chips", () => {
    beforeEach(() => {
        observed = [];
        frames = [];
        (global as any).ResizeObserver = FakeResizeObserver;
        jest.spyOn(window, "requestAnimationFrame").mockImplementation((frame) => { frames.push(frame); return frames.length; });
    });

    afterEach(() => {
        delete (global as any).ResizeObserver;
        jest.restoreAllMocks();
    });

    test("stacks into a column when a chip can't get 44px (11 points under 484px)", () => {
        const element = nps();
        resize(element, 375);

        const list = container(element);
        expect(element.classList.contains("magicfeedback-rating-number--stacked")).toBe(true);
        expect(list.classList.contains("magicfeedback-rating-number-container-column")).toBe(true);
        expect(list.classList.contains("magicfeedback-rating-number-container-column--bare")).toBe(true);
        expect(list.classList.contains("magicfeedback-rating-number-container-row")).toBe(false);
        expect(list.classList.contains("magicfeedback-rating-number-container-row--dense")).toBe(false);
        expect(list.style.flexDirection).toBe("column-reverse");
        list.querySelectorAll(".magicfeedback-rating-number-option").forEach((option) => {
            expect(option.classList.contains("magicfeedback-rating-number-option-column")).toBe(true);
            expect(option.classList.contains("magicfeedback-rating-number-option-row")).toBe(false);
        });
    });

    test("keeps the order setting: rtl puts the max label above the stack", () => {
        const element = nps("rtl");
        const blocks = element.querySelectorAll(".magicfeedback-rating-number-scale-label-block--stacked");

        expect(blocks).toHaveLength(2);
        expect(element.firstElementChild?.textContent).toBe("Very likely");
        expect(container(element).nextElementSibling?.textContent).toBe("Not likely");
    });

    test("stays a row when there is room, and goes back to one after stacking", () => {
        const element = nps("ltr");
        resize(element, 800);
        expect(element.classList.contains("magicfeedback-rating-number--stacked")).toBe(false);

        resize(element, 320);
        resize(element, 800);

        const list = container(element);
        expect(element.classList.contains("magicfeedback-rating-number--stacked")).toBe(false);
        expect(list.classList.contains("magicfeedback-rating-number-container-row")).toBe(true);
        expect(list.classList.contains("magicfeedback-rating-number-container-row--dense")).toBe(true);
        expect(list.style.flexDirection).toBe("row");
    });

    test("keeps the inputs and a checked answer when it stacks", () => {
        const element = nps();
        const inputs = Array.from(element.querySelectorAll("input"));
        (inputs[7] as HTMLInputElement).checked = true;

        resize(element, 320);

        expect(Array.from(element.querySelectorAll("input"))).toEqual(inputs);
        expect((element.querySelector("input:checked") as HTMLInputElement).value).toBe("7");
    });

    test("shows exactly one set of min/max labels without any stylesheet", () => {
        const element = nps();
        const caption = element.querySelector(".magicfeedback-rating-number-scale-labels") as HTMLElement;
        const blocks = Array.from(element.querySelectorAll<HTMLElement>(".magicfeedback-rating-number-scale-label-block--stacked"));

        // Row: the one-line caption only.
        expect(caption.style.display).toBe("");
        blocks.forEach((block) => expect(block.style.display).toBe("none"));

        // Stacked: the above/below labels only.
        resize(element, 375);
        expect(caption.style.display).toBe("none");
        blocks.forEach((block) => expect(block.style.display).toBe(""));

        // Back to a row.
        resize(element, 800);
        expect(caption.style.display).toBe("");
        blocks.forEach((block) => expect(block.style.display).toBe("none"));
    });

    test("switches on the next frame, not inside the observer callback", () => {
        const element = nps();
        notify(element, 375);
        expect(element.classList.contains("magicfeedback-rating-number--stacked")).toBe(false);

        flushFrames();
        expect(element.classList.contains("magicfeedback-rating-number--stacked")).toBe(true);
    });

    test("doesn't schedule again when only the height changed (the stacking itself)", () => {
        const element = nps();
        resize(element, 375);

        notify(element, 375);
        expect(frames).toHaveLength(0);
    });

    test("uses the last width when several arrive in one frame", () => {
        const element = nps();
        notify(element, 375);
        notify(element, 800);
        expect(frames).toHaveLength(1);

        flushFrames();
        expect(element.classList.contains("magicfeedback-rating-number--stacked")).toBe(false);
    });

    test("ignores a zero width (not attached yet)", () => {
        const element = nps();
        resize(element, 0);
        expect(element.classList.contains("magicfeedback-rating-number--stacked")).toBe(false);
    });
});

test("renders a plain row where ResizeObserver doesn't exist", () => {
    const element = nps();
    expect(container(element).classList.contains("magicfeedback-rating-number-container-row")).toBe(true);
});

describe("legacy rating (Club Matas: productId contains \"matas\")", () => {
    const legacyNps = (isPhone: boolean, order = "rtl") => createRatingNumberElement(
        "nps",
        {min: 0, max: 10, minPlaceholder: "Not likely", maxPlaceholder: "Very likely"},
        order,
        "row",
        "magicfeedback-rating-number",
        undefined,
        null,
        "en",
        {legacy: true, isPhone},
    );
    const texts = (element: HTMLElement) =>
        Array.from(element.querySelectorAll(".magicfeedback-rating-number-value-num")).map((n) => n.textContent);

    afterEach(() => {
        delete (global as any).ResizeObserver;
    });

    test("recognises Matas products by their id, case-insensitive", () => {
        expect(usesLegacyRatingNumber("MATAS_DEMO_GENERAL")).toBe(true);
        expect(usesLegacyRatingNumber("TEST_MATAS_X")).toBe(true);
        expect(usesLegacyRatingNumber("matas")).toBe(true);
        expect(usesLegacyRatingNumber("ACME_GENERAL")).toBe(false);
        expect(usesLegacyRatingNumber(undefined)).toBe(false);
    });

    test("on a phone: a full-width list with the min/max text inside the option, no separate labels", () => {
        const element = legacyNps(true);
        const list = container(element);

        expect(element.classList.contains("magicfeedback-rating-number--legacy")).toBe(true);
        expect(list.classList.contains("magicfeedback-rating-number-container-column--bare")).toBe(true);
        expect(list.style.flexDirection).toBe("column-reverse");
        expect(texts(element)[0]).toBe("0 = Not likely");
        expect(texts(element)[10]).toBe("10 = Very likely");
        expect(texts(element)[5]).toBe("5");
        expect(element.querySelector(".magicfeedback-rating-number-scale-labels")).toBeNull();
        expect(element.querySelector(".magicfeedback-rating-number-scale-label-block")).toBeNull();
        expect((element.querySelector('input[value="10"]') as HTMLInputElement).getAttribute("aria-label")).toBe("10 — Very likely");
    });

    test("on desktop: the row with its caption and plain numbers", () => {
        const element = legacyNps(false);

        expect(container(element).classList.contains("magicfeedback-rating-number-container-row")).toBe(true);
        expect(element.querySelector(".magicfeedback-rating-number-scale-labels")?.textContent).toBe("Very likelyNot likely");
        expect(texts(element)[10]).toBe("10");
    });

    test("numbers are not bold, whatever stylesheet the integration ships", () => {
        const element = legacyNps(false);
        element.querySelectorAll<HTMLElement>(".magicfeedback-rating-number-value-num")
            .forEach((num) => expect(num.style.fontWeight).toBe("normal"));
    });

    test("never stacks by container width", () => {
        (global as any).ResizeObserver = jest.fn(() => ({observe: jest.fn(), disconnect: jest.fn()}));
        legacyNps(false);
        expect((global as any).ResizeObserver).not.toHaveBeenCalled();
    });
});

test("other products keep the current rating", () => {
    const element = nps();
    expect(element.classList.contains("magicfeedback-rating-number--legacy")).toBe(false);
    expect(element.querySelector(".magicfeedback-rating-number-value-num")?.getAttribute("style")).toBeNull();
});

test("renderQuestions turns on the legacy rating from the survey's product id", () => {
    const question = {
        id: "q-nps", ref: "nps", title: "Recommend?", type: FEEDBACKAPPANSWERTYPE.RATING_NUMBER,
        questionType: {conf: []}, assets: {min: 0, max: 10}, value: [],
    } as unknown as NativeQuestion;

    const [matas] = renderQuestions([question], "standard", "en", {customIcons: false, id: "MATAS_DEMO_GENERAL"});
    const [other] = renderQuestions([question], "standard", "en", {customIcons: false, id: "ACME_GENERAL"});

    expect(matas.querySelector(".magicfeedback-rating-number--legacy")).not.toBeNull();
    expect(other.querySelector(".magicfeedback-rating-number--legacy")).toBeNull();
});
