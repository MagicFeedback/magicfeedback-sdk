import {afterEach, beforeEach, describe, expect, jest, test} from "@jest/globals";
import {armGhostTapGuard, GHOST_TAP_GUARD_MS} from "../src/utils/ghostTapGuard";

const page = () => {
    const container = document.createElement("div");
    container.innerHTML = `<label for="r0"><input id="r0" type="radio" name="nps" value="0"> 0</label>`;
    document.body.appendChild(container);
    return container;
};

const tap = (el: Element) => el.dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, detail: 1}));
const radio = (c: HTMLElement) => c.querySelector("input") as HTMLInputElement;

describe("armGhostTapGuard", () => {
    let clock = 0;

    beforeEach(() => {
        clock = 1000;
        jest.spyOn(performance, "now").mockImplementation(() => clock);
        document.body.innerHTML = "";
    });

    afterEach(() => { jest.restoreAllMocks(); });

    test("swallows a tap right after the page is shown", () => {
        const container = page();
        armGhostTapGuard(container);

        clock += 120;
        tap(container.querySelector("label")!);

        expect(radio(container).checked).toBe(false);
    });

    test("lets taps through once the guard has passed", () => {
        const container = page();
        armGhostTapGuard(container);

        clock += GHOST_TAP_GUARD_MS;
        tap(container.querySelector("label")!);

        expect(radio(container).checked).toBe(true);
    });

    test("never blocks keyboard activation", () => {
        const container = page();
        armGhostTapGuard(container);

        clock += 10;
        radio(container).click(); // detail 0, like Space on a focused radio

        expect(radio(container).checked).toBe(true);
    });

    test("re-arms on every page change with a single listener", () => {
        const container = page();
        const add = jest.spyOn(container, "addEventListener");
        armGhostTapGuard(container);

        clock += 1000;
        armGhostTapGuard(container);
        clock += 50;
        tap(container.querySelector("label")!);

        expect(radio(container).checked).toBe(false);
        expect(add).toHaveBeenCalledTimes(1);
    });

    test("ignores a missing container", () => {
        expect(() => armGhostTapGuard(null)).not.toThrow();
    });
});
