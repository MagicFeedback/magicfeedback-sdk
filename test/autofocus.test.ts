import {beforeEach, describe, expect, test} from "@jest/globals";
import {findAutofocusTarget, focusFirstTextQuestion} from "../src/utils/autofocus";

/** A page with one `.magicfeedback-div` per `inner` (the control markup). */
const page = (...inners: string[]) => {
    const root = document.createElement("div");
    root.innerHTML = inners
        .map((inner) => `<div class="magicfeedback-div"><label class="magicfeedback-label">Q</label>${inner}</div>`)
        .join("");
    document.body.appendChild(root);
    return root;
};

describe("findAutofocusTarget", () => {
    beforeEach(() => { document.body.innerHTML = ""; });

    test.each([
        ["text", '<input type="text" class="magicfeedback-text">'],
        ["long text", '<textarea class="magicfeedback-longtext"></textarea>'],
        ["email", '<input type="email" class="magicfeedback-email">'],
        ["number", '<input type="number" class="magicfeedback-number">'],
    ])("picks the first question when it is %s", (_name, inner) => {
        const root = page(inner);
        expect(findAutofocusTarget(root)).toBe(root.querySelector("input, textarea"));
    });

    test("picks the first field of a CONTACT question (nested blocks)", () => {
        const root = document.createElement("div");
        root.innerHTML = `
          <div class="magicfeedback-div"><label>Contact</label>
            <div class="magicfeedback-div"><input type="text" id="name"></div>
            <div class="magicfeedback-div"><input type="email" id="mail"></div>
          </div>`;
        expect(findAutofocusTarget(root)?.id).toBe("name");
    });

    test.each([
        ["a rating", '<div class="magicfeedback-radio"><input type="radio" name="r"><input type="radio" name="r"></div>'],
        ["a date (opens a picker)", '<input type="date">'],
        ["a password", '<input type="password">'],
        ["a select", "<select><option>a</option></select>"],
        ["an info page", "<p>Text only</p>"],
    ])("picks nothing when the first question is %s, even with a text one after it", (_name, inner) => {
        expect(findAutofocusTarget(page(inner, '<input type="text">'))).toBeNull();
    });

    test("an 'Other' text field behind a rating's options does not count", () => {
        expect(findAutofocusTarget(page('<input type="radio" name="r"><input type="text">'))).toBeNull();
    });

    test("skips a disabled or read-only field", () => {
        expect(findAutofocusTarget(page('<input type="text" disabled>'))).toBeNull();
        expect(findAutofocusTarget(page("<textarea readonly></textarea>"))).toBeNull();
    });

    test("picks nothing without questions", () => {
        expect(findAutofocusTarget(page())).toBeNull();
        expect(findAutofocusTarget(null)).toBeNull();
    });
});

describe("focusFirstTextQuestion", () => {
    beforeEach(() => { document.body.innerHTML = ""; });

    test("focuses the first question when it is a text field", () => {
        const root = page("<textarea></textarea>");
        expect(focusFirstTextQuestion(root)).toBe(true);
        expect(document.activeElement).toBe(root.querySelector("textarea"));
    });

    test("does not take the focus away from a field of the host page", () => {
        const hostInput = document.createElement("input");
        document.body.appendChild(hostInput);
        hostInput.focus();
        const root = page('<input type="text">');

        expect(focusFirstTextQuestion(root)).toBe(false);
        expect(document.activeElement).toBe(hostInput);
    });

    test("does move it from a host button, or from a field of the survey itself", () => {
        const hostButton = document.createElement("button");
        document.body.appendChild(hostButton);
        hostButton.focus();
        const root = page('<input type="text">');
        expect(focusFirstTextQuestion(root)).toBe(true);

        root.innerHTML = '<div class="magicfeedback-div"><textarea></textarea></div>';
        const previous = document.createElement("input");
        root.appendChild(previous);
        previous.focus();
        expect(focusFirstTextQuestion(root)).toBe(true);
        expect(document.activeElement).toBe(root.querySelector("textarea"));
    });

    test("leaves the focus alone when the first question is not a text one", () => {
        const root = page('<input type="radio">', '<input type="text">');
        expect(focusFirstTextQuestion(root)).toBe(false);
        expect(document.activeElement).toBe(document.body);
    });
});
