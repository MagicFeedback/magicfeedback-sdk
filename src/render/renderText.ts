import {placeholder} from "../services/placeholder";
import {QuestionRenderer} from "./types";

export const renderText: QuestionRenderer = ({
    language,
    placeholderText,
    urlParamValue,
    send
}) => {
    const element = document.createElement("input");
    (element as HTMLInputElement).type = "text";
    (element as HTMLInputElement).placeholder = placeholderText || placeholder.answer(language || 'en');

    if (urlParamValue) {
        (element as HTMLInputElement).value = urlParamValue;
    }

    (element as HTMLInputElement).addEventListener("keyup", (event) => {
        event.preventDefault();
        if (event.key === "Enter") {
            if (send) send();
        }
    });

    const elementTypeClass = "magicfeedback-text";

    return {element, elementTypeClass};
};
