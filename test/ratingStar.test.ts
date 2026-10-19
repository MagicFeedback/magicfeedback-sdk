import {afterEach, describe, expect, test} from "@jest/globals";
import {createStarRating} from "../src/render/ratingHelpers";

const selected = (container: HTMLElement) =>
    container.querySelectorAll(".rating__star.magicfeedback-rating-star-selected").length;
const star = (container: HTMLElement, n: number) =>
    container.querySelectorAll<HTMLElement>(".rating__star")[n - 1];

describe("star rating", () => {
    afterEach(() => { document.body.innerHTML = ""; });

    // The URL only checked the radio: the visitor saw five empty stars.
    test("a score prefilled from the URL shows as filled stars", () => {
        const container = createStarRating("q", "", "", () => {}, "4");

        expect((container.querySelector("input:checked") as HTMLInputElement).value).toBe("4");
        expect(selected(container)).toBe(4);
    });

    test("hovering out of the stars goes back to the prefilled score", () => {
        const container = createStarRating("q", "", "", () => {}, "4");

        star(container, 2).dispatchEvent(new MouseEvent("mouseenter"));
        expect(selected(container)).toBe(2);
        star(container, 2).dispatchEvent(new MouseEvent("mouseleave"));

        expect(selected(container)).toBe(4);
    });

    test("without a prefill the stars start empty and a pick fills them", () => {
        const container = createStarRating("q", "", "", () => {}, null);
        expect(selected(container)).toBe(0);

        const three = container.querySelector<HTMLInputElement>('input[value="3"]')!;
        three.checked = true;
        three.dispatchEvent(new Event("change"));

        expect(selected(container)).toBe(3);
    });
});
