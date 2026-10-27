import {FEEDBACKAPPANSWERTYPE} from "../models/types";
import {placeholder} from "../services/placeholder";
import {QuestionRenderer} from "./types";
import {autoAdvanceOn} from "../utils/autoAdvance";

export const renderChoice: QuestionRenderer = ({
    question,
    language,
    urlParamValue,
    randomPosition,
    send
}) => {
    const {type, ref, value, defaultValue, assets} = question;

    const element = document.createElement("div");
    const elementTypeClass = `magicfeedback-${(type === "MULTIPLECHOICE" ? "checkbox" : "radio")}`;

    let opt = value || [];

    if (randomPosition) {
        opt = opt.sort(() => Math.random() - 0.5);
    }

    let exclusiveAnswers: string[] = assets?.exclusiveAnswers || [];

    if (assets?.extraOption) {
        exclusiveAnswers = exclusiveAnswers.filter(a => a !== assets.extraOptionText);
    }

    if (exclusiveAnswers.length > 0) {
        exclusiveAnswers?.forEach((answer) => {
            if (!opt.includes(answer)) opt.push(answer);
        });
    }

    const extraOptionText = assets?.extraOptionText;

    if (assets?.extraOption && extraOptionText && !opt.includes(extraOptionText)) {
        opt.push(extraOptionText);
    }

    opt.forEach((option, index) => {
        const container = document.createElement("div");
        container.classList.add(
            `magicfeedback-${type === "MULTIPLECHOICE" ? "checkbox" : "radio"}-container`
        );
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.id = `rating-${ref}-${index}`;
        input.type = type === "MULTIPLECHOICE" ? "checkbox" : "radio";
        input.name = ref;
        input.value = option;
        input.classList.add(elementTypeClass);
        input.classList.add("magicfeedback-input");

        if (type === FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE && assets?.maxOptions && assets?.maxOptions > 0) {
            input.addEventListener("change", () => {
                const checkboxes = document.querySelectorAll(`input[name="${ref}"]:checked`);
                if (checkboxes.length > assets?.maxOptions) {
                    (input as HTMLInputElement).checked = false;
                }
            });
        }

        if (type === FEEDBACKAPPANSWERTYPE.RADIO && send) {
            if (!assets?.extraOptionText || assets?.extraOptionText && option !== assets?.extraOptionText)
                autoAdvanceOn(input, send);
        }

        if (option === defaultValue || option === urlParamValue) {
            input.checked = true;
        }

        label.textContent = option;
        label.htmlFor = `rating-${ref}-${index}`;

        input.addEventListener("change", (event) => {
            const extraOption = document.getElementById(`extra-option-${ref}`);
            if ((event.target as HTMLInputElement).checked && exclusiveAnswers.includes(option)) {
                opt.forEach((answer) => {
                    if (answer !== option) {
                        const input = document.querySelector(`input[value="${answer}"]`) as HTMLInputElement;
                        input.checked = false;
                    }
                });
                if (extraOption) extraOption.style.display = "none";
            } else {
                exclusiveAnswers.forEach((answer) => {
                    if (answer !== option) {
                        const input = document.querySelector(`input[value="${answer}"]`) as HTMLInputElement;
                        input.checked = false;
                    }
                });
            }
            if (assets?.extraOption && option === assets?.extraOptionText && extraOption)
                extraOption.style.display = (event.target as HTMLInputElement).checked ? "block" : "none";
        });

        container.appendChild(input);
        container.appendChild(label);
        element.appendChild(container);

        if (assets?.extraOption && option === assets?.extraOptionText) {
            const inputText = document.createElement("input");
            inputText.type = "text";
            inputText.placeholder = assets?.extraOptionPlaceholder || placeholder.answer(language || 'en');
            inputText.classList.add("magicfeedback-extra-option");
            inputText.classList.add("magicfeedback-input");
            inputText.id = `extra-option-${ref}`;
            inputText.name = `extra-option-${ref}`;
            inputText.style.display = "none";

            element.appendChild(inputText);
        }
    });

    // Single choice is a vertical list unless the question asks for a row.
    // Read from the assets, not the `direction` argument: that one falls
    // back to "row" for every type, and existing single choice questions
    // carry no direction at all.
    if (type === FEEDBACKAPPANSWERTYPE.RADIO && assets?.direction === 'row') {
        element.classList.add('magicfeedback-radio--row');
        stackChoiceRowWhenNarrow(element, opt.length);
    }

    return {element, elementTypeClass};
};

/** Narrowest a single choice box may get before the row stacks. */
export const CHOICE_ROW_MIN_OPTION_WIDTH = 120;

/** Below this the visitor is on a phone, where a row always stacks. */
const PHONE_MAX_WIDTH = 600;

/**
 * A single choice row turns into the usual vertical list on a phone, or
 * when the question is too narrow to give every option
 * CHOICE_ROW_MIN_OPTION_WIDTH, and back when there is room again. Only a
 * class changes, so the inputs and a checked answer stay as they are.
 */
function stackChoiceRowWhenNarrow(element: HTMLElement, optionCount: number) {
    const setStacked = (width: number) => {
        const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
        const needed = optionCount * CHOICE_ROW_MIN_OPTION_WIDTH + (optionCount - 1) * gap;
        element.classList.toggle('magicfeedback-radio--stacked', window.innerWidth < PHONE_MAX_WIDTH || width < needed);
    };

    // Before the first measurement a phone already gets the list.
    element.classList.toggle('magicfeedback-radio--stacked', window.innerWidth < PHONE_MAX_WIDTH);
    if (typeof ResizeObserver === 'undefined') return;

    // Same as the rating row: switch on the next frame, and only when the
    // width changed, so the height change doesn't loop the observer.
    const nextFrame = typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (callback: FrameRequestCallback) => { callback(0); return 0; };
    let lastWidth = 0;
    let pending = false;

    new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width;
        if (!width || width === lastWidth) return;
        lastWidth = width;

        if (pending) return;
        pending = true;
        nextFrame(() => {
            pending = false;
            setStacked(lastWidth);
        });
    }).observe(element);
}
