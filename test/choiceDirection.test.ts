import {afterEach, beforeEach, describe, expect, jest, test} from "@jest/globals";
import {renderChoice} from "../src/render/renderChoice";
import {createRatingNumberElement} from "../src/render/ratingHelpers";
import {NativeQuestion} from "../src/models/types";

type Callback = (entries: { contentRect: { width: number } }[]) => void;
let observed: { target: Element, callback: Callback }[] = [];

class FakeResizeObserver {
    constructor(private callback: Callback) {}
    observe(target: Element) { observed.push({target, callback: this.callback}); }
    disconnect() {}
}

let frames: FrameRequestCallback[] = [];
const flushFrames = () => { const due = frames; frames = []; due.forEach((frame) => frame(0)); };

// A resize as the browser delivers it: the observer fires, then the next frame runs.
const resize = (element: Element, width: number) => {
    observed.filter((o) => o.target === element).forEach((o) => o.callback([{contentRect: {width}}]));
    flushFrames();
};

const setWindowWidth = (width: number) =>
    Object.defineProperty(window, "innerWidth", {configurable: true, writable: true, value: width});

const LABELS = ["Meget svært", "Svært", "Hverken nemt eller svært", "Nemt", "Meget nemt"];

const singleChoice = (assets: Record<string, any> = {}) => renderChoice({
    question: {
        id: "q1", ref: "q1", type: "RADIO", title: "Hvor nemt?", value: [...LABELS], assets,
    } as unknown as NativeQuestion,
    direction: "row",
} as any).element;

describe("single choice direction", () => {
    beforeEach(() => {
        observed = [];
        frames = [];
        setWindowWidth(1280);
        (global as any).ResizeObserver = FakeResizeObserver;
        jest.spyOn(window, "requestAnimationFrame").mockImplementation((frame) => { frames.push(frame); return frames.length; });
    });

    afterEach(() => {
        delete (global as any).ResizeObserver;
        jest.restoreAllMocks();
    });

    test("stays a vertical list without assets.direction, even though the renderer gets 'row'", () => {
        const element = singleChoice();
        expect(element.classList.contains("magicfeedback-radio--row")).toBe(false);
        expect(observed).toHaveLength(0);
    });

    test("stays a vertical list with direction 'column'", () => {
        expect(singleChoice({direction: "column"}).classList.contains("magicfeedback-radio--row")).toBe(false);
    });

    test("is a row with direction 'row' when there is room", () => {
        const element = singleChoice({direction: "row"});
        resize(element, 1100);
        expect(element.classList.contains("magicfeedback-radio--row")).toBe(true);
        expect(element.classList.contains("magicfeedback-radio--stacked")).toBe(false);
    });

    test("stacks when the options can't get 120px each, and goes back", () => {
        const element = singleChoice({direction: "row"});
        resize(element, 500);
        expect(element.classList.contains("magicfeedback-radio--stacked")).toBe(true);

        resize(element, 1100);
        expect(element.classList.contains("magicfeedback-radio--stacked")).toBe(false);
    });

    test("is always a list on a phone, even with room for a row", () => {
        setWindowWidth(390);
        const element = singleChoice({direction: "row"});
        expect(element.classList.contains("magicfeedback-radio--stacked")).toBe(true);

        resize(element, 700);
        expect(element.classList.contains("magicfeedback-radio--stacked")).toBe(true);
    });

    test("keeps the options, their order and the inputs", () => {
        const element = singleChoice({direction: "row"});
        const values = Array.from(element.querySelectorAll<HTMLInputElement>("input[type=radio]")).map((i) => i.value);
        expect(values).toEqual(LABELS);
    });
});

const labelled = (assets: Record<string, any> = {}, order = "ltr") => createRatingNumberElement(
    "ease",
    {
        min: 1, max: 5, minPlaceholder: "Meget svært", maxPlaceholder: "Meget nemt",
        numberPlaceholders: {1: "Meget svært", 2: "Svært", 3: "Hverken nemt eller svært", 4: "Nemt", 5: "Meget nemt"},
        ...assets,
    },
    order,
    "row",
    "magicfeedback-rating-number",
);

const options = (element: HTMLElement) =>
    Array.from(element.querySelectorAll<HTMLElement>(".magicfeedback-rating-number-option"));

describe("rating number row with a text per number", () => {
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

    test("shows each text above its chip by default, and no min/max caption", () => {
        const element = labelled();
        expect(element.querySelector(".magicfeedback-rating-number-scale-labels")).toBeNull();
        expect(element.querySelector(".magicfeedback-rating-number-scale-label-block")).toBeNull();

        options(element).forEach((option, index) => {
            const caption = option.querySelector(".magicfeedback-rating-number-option-caption") as HTMLLabelElement;
            expect(caption.textContent).toBe(Object.values({1: "Meget svært", 2: "Svært", 3: "Hverken nemt eller svært", 4: "Nemt", 5: "Meget nemt"})[index]);
            expect(caption.htmlFor).toBe(`rating-ease-${index + 1}`);
            expect(option.firstElementChild).toBe(caption);
            expect(option.style.flexDirection).toBe("column");
            expect(option.querySelector("label.magicfeedback-rating-number-option-label-container")?.getAttribute("title")).toBeNull();
        });
    });

    test("puts the text below with numberPlaceholdersPosition 'bottom'", () => {
        const element = labelled({numberPlaceholdersPosition: "bottom"});
        options(element).forEach((option) => {
            expect(option.classList.contains("magicfeedback-rating-number-option--caption-bottom")).toBe(true);
            expect(option.style.flexDirection).toBe("column-reverse");
        });
    });

    test("moves the text into the chip when the row stacks, and back", () => {
        const element = labelled();
        resize(element, 300);

        const [first] = options(element);
        const caption = first.querySelector(".magicfeedback-rating-number-option-caption") as HTMLElement;
        const inline = first.querySelector(".magicfeedback-rating-number-value-label") as HTMLElement;
        expect(caption.style.display).toBe("none");
        expect(inline.style.display).toBe("");
        expect(inline.textContent).toBe("Meget svært");
        expect(element.querySelector(".magicfeedback-rating-number-container-column--bare")).toBeNull();

        resize(element, 900);
        expect(caption.style.display).toBe("");
        expect(inline.style.display).toBe("none");
        expect(first.style.flexDirection).toBe("column");
    });

    test("stacks earlier than a bare row: 5 texts need 72px each", () => {
        const element = labelled();
        resize(element, 340);
        expect(element.classList.contains("magicfeedback-rating-number--stacked")).toBe(true);
    });

    test("ignores empty texts: a row with none keeps the min/max caption", () => {
        const element = labelled({numberPlaceholders: {1: "", 2: ""}});
        expect(element.querySelector(".magicfeedback-rating-number-option-caption")).toBeNull();
        expect(element.querySelector(".magicfeedback-rating-number-scale-labels")).not.toBeNull();
    });
});

describe("rating number min/max caption position", () => {
    const plain = (assets: Record<string, any> = {}) => labelled({numberPlaceholders: {}, ...assets});
    const caption = (element: HTMLElement) =>
        element.querySelector(".magicfeedback-rating-number-scale-labels") as HTMLElement;
    const container = (element: HTMLElement) =>
        element.querySelector(".magicfeedback-rating-number-container") as HTMLElement;

    test("unset: after the row, no order, so the stylesheet decides", () => {
        const element = plain();
        expect(element.lastElementChild).toBe(caption(element));
        expect(caption(element).style.order).toBe("");
    });

    test("top: before the row, ordered first", () => {
        const element = plain({minMaxPlaceholderPosition: "top"});
        expect(caption(element).nextElementSibling).toBe(container(element));
        expect(caption(element).style.order).toBe("-1");
        expect(caption(element).classList.contains("magicfeedback-rating-number-scale-labels--top")).toBe(true);
    });

    test("bottom: after the row, ordered last", () => {
        const element = plain({minMaxPlaceholderPosition: "bottom"});
        expect(element.lastElementChild).toBe(caption(element));
        expect(caption(element).style.order).toBe("1");
    });
});
