import {QuestionRenderer} from "./types";

export const renderInfoPage: QuestionRenderer = ({
    question,
    placeholderText
}) => {
    const element = document.createElement("div");
    const elementTypeClass = "magicfeedback-info-page";

    const hasInfoContent = typeof question.assets?.placeholder === "string"
        ? question.assets.placeholder.trim() !== ""
        : Boolean(question.assets?.placeholder);

    if (hasInfoContent) {
        const infoMessageElement = document.createElement("div");
        infoMessageElement.classList.add("magicfeedback-info-message");
        infoMessageElement.innerHTML = placeholderText || "";
        element.appendChild(infoMessageElement);
    }

    return {element, elementTypeClass};
};
