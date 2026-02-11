import {FEEDBACKAPPANSWERTYPE} from "../models/types";
import {placeholder} from "../services/placeholder";
import {QuestionRenderer} from "./types";

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
                input.addEventListener("change", () => {
                    send();
                });
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

    return {element, elementTypeClass};
};
