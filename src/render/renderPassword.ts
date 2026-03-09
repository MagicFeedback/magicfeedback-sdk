import {placeholder} from "../services/placeholder";
import {QuestionRenderer} from "./types";

export const renderPassword: QuestionRenderer = ({
    language,
    placeholderText,
    urlParamValue
}) => {
    const element = document.createElement("input");
    (element as HTMLInputElement).type = "password";
    (element as HTMLInputElement).placeholder = placeholderText || placeholder.password(language || 'en');
    const elementTypeClass = "magicfeedback-password";

    if (urlParamValue) {
        (element as HTMLInputElement).value = urlParamValue;
    }

    return {element, elementTypeClass};
};
