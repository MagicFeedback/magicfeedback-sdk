import {QuestionRenderer} from "./types";

export const renderEmail: QuestionRenderer = ({
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

    return {element, elementTypeClass};
};
