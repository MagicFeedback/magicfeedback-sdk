import {afterEach, describe, expect, jest, test} from "@jest/globals";
import {insertAtCaret, isAtShortcut, renderEmail} from "../src/render/renderEmail";
import {renderQuestions} from "../src/services/questions.service";
import {NativeQuestion} from "../src/models/types";

const emailQuestion = (assets: Record<string, any> = {}) => ({
    id: "q-email", ref: "email", type: "EMAIL", title: "E-mailadresse", require: false, assets,
} as unknown as NativeQuestion);

const render = (assets: Record<string, any> = {}, language = "da") => {
    const result = renderEmail({question: emailQuestion(assets), language} as any);
    document.body.appendChild(result.container || result.element);
    return result;
};

const key = (input: HTMLElement, init: KeyboardEventInit) => {
    const event = new KeyboardEvent("keydown", {bubbles: true, cancelable: true, ...init});
    input.dispatchEvent(event);
    return event;
};

// jsdom has no execCommand; this one inserts at the selection like a browser does.
const fakeInsertText = (input: HTMLInputElement, caret: number) => {
    (document as any).execCommand = jest.fn((command: string, _ui: boolean, text: string) => {
        if (command !== "insertText") return false;
        input.value = input.value.slice(0, caret) + text + input.value.slice(caret);
        return true;
    });
};

afterEach(() => {
    document.body.innerHTML = "";
    delete (document as any).execCommand;
});

describe("email @ shortcut", () => {
    test("Alt + 2 inserts @ and cancels the key", () => {
        const {element} = render();
        const input = element as HTMLInputElement;
        input.value = "soeren";
        input.focus();

        const event = key(input, {code: "Digit2", key: "™", altKey: true});

        expect(event.defaultPrevented).toBe(true);
        expect(input.value).toBe("soeren@");
    });

    test("inserts at the caret through insertText", () => {
        const {element} = render();
        const input = element as HTMLInputElement;
        input.value = "soerenexample.dk";
        input.focus();
        fakeInsertText(input, 6);

        key(input, {code: "Digit2", altKey: true});

        expect((document as any).execCommand).toHaveBeenCalledWith("insertText", false, "@");
        expect(input.value).toBe("soeren@example.dk");
    });

    test.each([
        ["AltGr on Windows (Ctrl + Alt)", {code: "Digit2", altKey: true, ctrlKey: true}],
        ["Cmd + Alt", {code: "Digit2", altKey: true, metaKey: true}],
        ["2 without Alt", {code: "Digit2"}],
        ["Alt + another key", {code: "Digit3", altKey: true}],
    ])("leaves %s alone", (_name, init) => {
        const {element} = render();
        const input = element as HTMLInputElement;
        input.value = "soeren";

        const event = key(input, init);

        expect(event.defaultPrevented).toBe(false);
        expect(input.value).toBe("soeren");
    });

    test("ignores the key while composing", () => {
        expect(isAtShortcut(new KeyboardEvent("keydown", {code: "Digit2", altKey: true, isComposing: true}))).toBe(false);
    });

    test("drops the glyph a browser types after the cancelled key", () => {
        const {element} = render();
        const input = element as HTMLInputElement;
        input.focus();
        key(input, {code: "Digit2", altKey: true});

        const stray = new InputEvent("beforeinput", {inputType: "insertText", data: "™", cancelable: true});
        input.dispatchEvent(stray);
        const at = new InputEvent("beforeinput", {inputType: "insertText", data: "@", cancelable: true});
        input.dispatchEvent(at);

        expect(stray.defaultPrevented).toBe(true);
        expect(at.defaultPrevented).toBe(false);
    });
});

describe("email @ button (assets.atButton)", () => {
    test("is off by default", () => {
        const result = render();
        expect(result.container).toBeUndefined();
        expect(document.querySelector(".magicfeedback-email-at")).toBeNull();
    });

    test("ignores unknown values", () => {
        expect(render({atButton: "left"}).container).toBeUndefined();
    });

    test.each([
        ["outside", "magicfeedback-email-row"],
        ["inside", "magicfeedback-email-inset"],
    ])("%s wraps the input with the button and a hint", (atButton, wrapperClass) => {
        const {element, container} = render({atButton});

        const wrapper = container!.querySelector(`.${wrapperClass}`)!;
        expect(wrapper).not.toBeNull();
        expect(wrapper.firstElementChild).toBe(element);

        const button = wrapper.querySelector("button.magicfeedback-email-at") as HTMLButtonElement;
        expect(button.type).toBe("button");
        expect(button.textContent).toBe("@");
        expect(button.getAttribute("aria-label")).toBe("Indsæt @");

        const hint = container!.querySelector(".magicfeedback-email-hint")!;
        expect(hint.textContent).toBe("Tryk på @ for at indsætte symbolet i din e-mailadresse");
        expect(hint.querySelector("b")!.textContent).toBe("@");
    });

    test("hint and label follow the survey language", () => {
        const {container} = render({atButton: "outside"}, "es");
        expect(container!.querySelector(".magicfeedback-email-hint")!.textContent)
            .toBe("Pulsa @ para insertar el símbolo en tu correo electrónico");
        expect(container!.querySelector("button")!.getAttribute("aria-label")).toBe("Insertar @");
    });

    test("tapping it inserts @ at the caret and keeps the focus in the field", () => {
        const {element, container} = render({atButton: "inside"});
        const input = element as HTMLInputElement;
        input.value = "soerenexample.dk";
        input.focus();
        fakeInsertText(input, 6);
        const button = container!.querySelector("button")!;

        const down = new MouseEvent("mousedown", {bubbles: true, cancelable: true});
        button.dispatchEvent(down);
        button.click();

        expect(down.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(input);
        expect(input.value).toBe("soeren@example.dk");
    });

    test("the shortcut works with the button too", () => {
        const {element} = render({atButton: "outside"});
        const input = element as HTMLInputElement;
        input.value = "soeren";
        key(input, {code: "Digit2", altKey: true});
        expect(input.value).toBe("soeren@");
    });
});

describe("insertAtCaret", () => {
    test("appends when the caret can't be reached, and fires input", () => {
        const input = document.createElement("input");
        input.type = "email";
        input.value = "soeren";
        document.body.appendChild(input);
        const onInput = jest.fn();
        input.addEventListener("input", onInput);

        expect(insertAtCaret(input, "@")).toBe("append");
        expect(input.value).toBe("soeren@");
        expect(onInput).toHaveBeenCalled();
    });

    test("uses setRangeText on inputs that expose the selection", () => {
        const input = document.createElement("input");
        input.type = "text";
        input.value = "soerenexample.dk";
        document.body.appendChild(input);
        input.setSelectionRange(6, 6);

        expect(insertAtCaret(input, "@")).toBe("setRangeText");
        expect(input.value).toBe("soeren@example.dk");
    });
});

describe("in a rendered page", () => {
    test("the input keeps the id, name and required, inside the @ wrapper", () => {
        const q = {...emailQuestion({atButton: "outside"}), require: true} as NativeQuestion;
        const [question] = renderQuestions([q], "standard", "da", {customIcons: false} as any);
        document.body.appendChild(question);

        const input = question.querySelector("#magicfeedback-q-email") as HTMLInputElement;
        expect(input.type).toBe("email");
        expect(input.name).toBe("email");
        expect(input.required).toBe(true);
        expect(input.classList.contains("magicfeedback-input")).toBe(true);
        expect(input.parentElement!.classList.contains("magicfeedback-email-row")).toBe(true);
        expect(question.querySelector(".magicfeedback-email-hint")).not.toBeNull();
    });

    test("without the asset the input is a direct child, as before", () => {
        const [question] = renderQuestions([emailQuestion()], "standard", "da", {customIcons: false} as any);
        const input = question.querySelector("#magicfeedback-q-email")!;
        expect(input.parentElement).toBe(question);
        expect(question.querySelector(".magicfeedback-email-at")).toBeNull();
    });
});
