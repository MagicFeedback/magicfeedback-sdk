import {placeholder} from "../services/placeholder";
import {QuestionRenderer} from "./types";

export const renderDate: QuestionRenderer = ({
    language,
    placeholderText,
    urlParamValue
}) => {
    const element = document.createElement("input");
    (element as HTMLInputElement).type = "date";
    (element as HTMLInputElement).placeholder = placeholderText || placeholder.date(language || 'en');
    const elementTypeClass = "magicfeedback-date";

    if (urlParamValue) {
        (element as HTMLInputElement).value = urlParamValue;
    }

    return {element, elementTypeClass};
};
