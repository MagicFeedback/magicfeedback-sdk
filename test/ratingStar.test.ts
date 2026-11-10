import {afterEach, beforeEach, describe, expect, jest, test} from "@jest/globals";
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

    describe("assets.starColor", () => {
        // jsdom drops var() in `color`, so record what the SDK asks for.
        let primary: WeakMap<CSSStyleDeclaration, boolean>;
        const original = CSSStyleDeclaration.prototype.setProperty;
        beforeEach(() => {
            primary = new WeakMap();
            jest.spyOn(CSSStyleDeclaration.prototype, "setProperty").mockImplementation(function (
                this: CSSStyleDeclaration, name: string, value: string | null, priority?: string) {
                if (name === "color") primary.set(this, value === "var(--mf-primary)" && priority === "important");
                return original.call(this, name, value, priority);
            });
        });
        afterEach(() => { jest.restoreAllMocks(); });
        const primaryStars = (container: HTMLElement) =>
            Array.from(container.querySelectorAll<HTMLElement>(".rating__star"))
                .map((el) => primary.get(el.style) === true);

        test("default keeps the classic look (no inline primary)", () => {
            const container = createStarRating("q", "", "", () => {}, "3");

            expect(container.classList.contains("magicfeedback-rating-star-primary")).toBe(false);
            expect(primaryStars(container)).toEqual([false, false, false, false, false]);
        });

        test('"yellow" is the same as the default', () => {
            const container = createStarRating("q", "", "", () => {}, "3", "yellow");

            expect(container.classList.contains("magicfeedback-rating-star-primary")).toBe(false);
            expect(primaryStars(container)).toEqual([false, false, false, false, false]);
        });

        test('"primary" paints filled stars with the survey primary colour', () => {
            const container = createStarRating("q", "", "", () => {}, "3", "primary");

            expect(container.classList.contains("magicfeedback-rating-star-primary")).toBe(true);
            expect(primaryStars(container)).toEqual([true, true, true, false, false]);
        });

        test('"primary" follows hover and goes back on leave', () => {
            const container = createStarRating("q", "", "", () => {}, "2", "primary");

            star(container, 5).dispatchEvent(new MouseEvent("mouseenter"));
            expect(primaryStars(container)).toEqual([true, true, true, true, true]);
            star(container, 5).dispatchEvent(new MouseEvent("mouseleave"));

            expect(primaryStars(container)).toEqual([true, true, false, false, false]);
        });
    });
});
