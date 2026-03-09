import {placeholder} from "../services/placeholder";
import {parseTitle} from "./helpers";
import {QuestionRenderer} from "./types";

export const renderNumber: QuestionRenderer = ({
    question,
    format,
    language,
    urlParamValue
}) => {
    const element = document.createElement("input");
    (element as HTMLInputElement).type = "number";
    (element as HTMLInputElement).placeholder = format === 'slim'
        ? parseTitle(question.title, language)
        : placeholder.number(language || 'en');

    const {value} = question;
    if (value.length) {
        value.sort((a: string, b: string) => Number(a) - Number(b));
        (element as HTMLInputElement).max = value[value.length - 1];
        (element as HTMLInputElement).min = value[0];
        (element as HTMLInputElement).value = value[0];
    }

    if (urlParamValue && !isNaN(Number(urlParamValue))) {
        (element as HTMLInputElement).value = urlParamValue;
    }

    const elementTypeClass = "magicfeedback-number";

    return {element, elementTypeClass};
};
