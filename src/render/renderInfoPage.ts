import {QuestionRenderer} from "./types";

export const renderInfoPage: QuestionRenderer = ({
    placeholderText
}) => {
    const element = document.createElement("div");
    const elementTypeClass = "magicfeedback-info-page";

    const infoMessageElement = document.createElement("div");
    infoMessageElement.classList.add("magicfeedback-info-message");
    infoMessageElement.innerHTML = placeholderText || '';

    element.appendChild(infoMessageElement);

    return {element, elementTypeClass};
};
