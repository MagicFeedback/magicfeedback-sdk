import {afterEach, beforeEach, describe, expect, test} from "@jest/globals";
import {createRatingNumberElement} from "../src/render/ratingHelpers";

type Callback = (entries: { contentRect: { width: number } }[]) => void;
let observed: { target: Element, callback: Callback }[] = [];

class FakeResizeObserver {
    constructor(private callback: Callback) {}
    observe(target: Element) { observed.push({target, callback: this.callback}); }
    disconnect() {}
}

const resize = (element: Element, width: number) =>
    observed.filter((o) => o.target === element).forEach((o) => o.callback([{contentRect: {width}}]));

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
        (global as any).ResizeObserver = FakeResizeObserver;
    });

    afterEach(() => {
        delete (global as any).ResizeObserver;
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
