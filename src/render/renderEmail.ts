import {t} from "../services/i18n";
import {QuestionRenderer} from "./types";

export type AtButtonPlacement = "outside" | "inside";

const AT_BUTTON_WRAPPER: Record<AtButtonPlacement, string> = {
    outside: "magicfeedback-email-row",
    inside: "magicfeedback-email-inset",
};

/**
 * Inserts `text` at the caret of an email input. `type="email"` inputs expose
 * no `selectionStart` / `setRangeText` (they are null / throw), so the caret is
 * only reachable through `insertText`, which also fires `input` and keeps undo.
 * Returns how the text went in, for tests and debugging.
 */
export function insertAtCaret(input: HTMLInputElement, text: string): "insertText" | "setRangeText" | "append" {
    if (document.activeElement !== input) input.focus();
    const before = input.value;

    try {
        if (typeof document.execCommand === "function" &&
            document.execCommand("insertText", false, text) &&
            input.value !== before) {
            return "insertText";
        }
    } catch (e) {
        // fall through
    }

    try {
        if (typeof input.selectionStart === "number") {
            input.setRangeText(text, input.selectionStart, input.selectionEnd ?? input.selectionStart, "end");
            input.dispatchEvent(new Event("input", {bubbles: true}));
            return "setRangeText";
        }
    } catch (e) {
        // fall through
    }

    input.value = before + text;
    input.dispatchEvent(new Event("input", {bubbles: true}));
    return "append";
}

/**
 * Option/Alt + 2 types "@". On a Danish Mac/iPad layout @ is Option + ', so
 * visitors used to Windows (AltGr + 2) can't find it. `code` is the physical
 * key, whatever the layout. Ctrl and Meta are left alone: Windows reports AltGr
 * as Ctrl + Alt and already types @ there.
 */
export function isAtShortcut(event: KeyboardEvent): boolean {
    return event.code === "Digit2" && event.altKey && !event.ctrlKey && !event.metaKey && !event.isComposing;
}

function addAtShortcut(input: HTMLInputElement) {
    // Some browsers still type the Option + 2 glyph (™, €...) after the
    // keydown is cancelled; drop that one insertion.
    let guardUntil = 0;

    input.addEventListener("keydown", (event) => {
        if (!isAtShortcut(event)) return;
        event.preventDefault();
        insertAtCaret(input, "@");
        guardUntil = Date.now() + 150;
    });

    input.addEventListener("beforeinput", (event) => {
        if (Date.now() < guardUntil && event.inputType === "insertText" && event.data && event.data !== "@") {
            event.preventDefault();
        }
    });
}

function renderAtButton(input: HTMLInputElement, placement: AtButtonPlacement, language: string): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.classList.add(AT_BUTTON_WRAPPER[placement]);

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("magicfeedback-email-at");
    button.textContent = "@";
    button.setAttribute("aria-label", t(language, "email.atButton"));

    // Keep the focus (and the caret) in the field: on an iPad, losing it would
    // also move the caret to the end.
    const keepFocus = (event: Event) => event.preventDefault();
    button.addEventListener("pointerdown", keepFocus);
    button.addEventListener("mousedown", keepFocus);
    button.addEventListener("click", () => insertAtCaret(input, "@"));

    wrapper.appendChild(input);
    wrapper.appendChild(button);

    // The first "@" of the hint is shown bold, like the button.
    const hint = document.createElement("p");
    hint.classList.add("magicfeedback-email-hint");
    const text = t(language, "email.atHint");
    const at = text.indexOf("@");
    if (at >= 0) {
        const bold = document.createElement("b");
        bold.textContent = "@";
        hint.append(text.slice(0, at), bold, text.slice(at + 1));
    } else {
        hint.textContent = text;
    }

    const container = document.createElement("div");
    container.classList.add("magicfeedback-email-container");
    container.appendChild(wrapper);
    container.appendChild(hint);

    return container;
}

export const renderEmail: QuestionRenderer = ({
    question,
    language,
    placeholderText,
    urlParamValue
}) => {
    const element = document.createElement("input");
    (element as HTMLInputElement).type = "email";
    (element as HTMLInputElement).placeholder = placeholderText || "you@example.com";
    const elementTypeClass = "magicfeedback-email";

    if (urlParamValue) {
        (element as HTMLInputElement).value = urlParamValue;
    }

    addAtShortcut(element);

    // assets.atButton: "outside" | "inside" adds an @ button (and a hint) for
    // keyboards where @ is hard to find, e.g. event iPads. Off by default.
    const placement = question?.assets?.atButton;
    if (placement === "outside" || placement === "inside") {
        return {element, elementTypeClass, container: renderAtButton(element, placement, language)};
    }

    return {element, elementTypeClass};
};
