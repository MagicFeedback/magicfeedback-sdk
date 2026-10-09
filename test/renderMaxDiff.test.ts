import {describe, expect, test} from "@jest/globals";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";
import {renderMaxDiff} from "../src/render/renderMaxDiff";

const question = (assets: Record<string, any> = {}) => ({
    id: "q-maxdiff",
    title: "What matters most?",
    type: FEEDBACKAPPANSWERTYPE.MAX_DIFF,
    ref: "q_maxdiff",
    value: ["Price", "Delivery", "Support", "Range"],
    assets,
} as unknown as NativeQuestion);

const render = (assets?: Record<string, any>, language = "en") => renderMaxDiff({
    question: question(assets),
    format: "standard",
    language,
    url: "",
    isPhone: false,
    urlParamValue: null,
    maxCharacters: 0,
    randomPosition: false,
    direction: "row",
    order: "ltr",
}).element;

const pick = (element: HTMLElement, side: "best" | "worst", index: number) => {
    const input = element.querySelector(`#q_maxdiff-${side}-${index}`) as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event("change", {bubbles: true}));
};

const checked = (element: HTMLElement) =>
    Array.from(element.querySelectorAll<HTMLInputElement>("input:checked")).map((i) => `${i.name}=${i.value}`);

describe("renderMaxDiff", () => {
    test("one row per item, with a radio per side in its own group", () => {
        const element = render();

        expect(element.querySelectorAll(".magicfeedback-max-diff-row")).toHaveLength(4);
        expect(new Set(Array.from(element.querySelectorAll("input")).map((i) => i.name)))
            .toEqual(new Set(["q_maxdiff-best", "q_maxdiff-worst"]));
    });

    test("an item cannot be both the most and the least important", () => {
        const element = render();

        pick(element, "best", 1);
        pick(element, "worst", 2);
        expect(checked(element)).toEqual(["q_maxdiff-best=Delivery", "q_maxdiff-worst=Support"]);

        pick(element, "worst", 1);
        expect(checked(element)).toEqual(["q_maxdiff-worst=Delivery"]);
    });

    test("shows the set progress only when asked and there is more than one screen", () => {
        const progress = (assets: Record<string, any>, language = "en") =>
            render(assets, language).querySelector(".magicfeedback-max-diff-progress")?.textContent ?? null;

        expect(progress({setIndex: 3, setCount: 8})).toBeNull();
        expect(progress({showSetProgress: true, setIndex: 3, setCount: 8}, "es")).toBe("Bloque 3 de 8");
        expect(progress({showSetProgress: true})).toBeNull();
    });

    test("headers default to the translated labels and accept per-language overrides", () => {
        const heads = (element: HTMLElement) =>
            Array.from(element.querySelectorAll("th.magicfeedback-max-diff-head")).map((th) => th.textContent);

        expect(heads(render(undefined, "es"))).toEqual(["Más importante", "Menos importante"]);
        expect(heads(render({bestLabel: {en: "Best"}, worstLabel: "Worst"}))).toEqual(["Best", "Worst"]);
    });
});
