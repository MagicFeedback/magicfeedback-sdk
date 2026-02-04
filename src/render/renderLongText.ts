import {placeholder} from "../services/placeholder";
import {QuestionRenderer} from "./types";

export const renderLongText: QuestionRenderer = ({
    language,
    placeholderText,
    urlParamValue,
    maxCharacters
}) => {
    const element = document.createElement("textarea");
    (element as HTMLTextAreaElement).rows = 3;
    if (maxCharacters > 0) (element as HTMLTextAreaElement).maxLength = maxCharacters;
    (element as HTMLInputElement).placeholder = placeholderText || placeholder.answer(language || 'en');

    if (urlParamValue) {
        (element as HTMLInputElement).value = urlParamValue;
    }

    const elementTypeClass = "magicfeedback-longtext";

    return {element, elementTypeClass};
};
