import {parseTitle} from "./helpers";
import {t} from "../services/i18n";
import {QuestionRenderer} from "./types";

export const renderSelect: QuestionRenderer = ({
    question,
    format,
    language,
    urlParamValue
}) => {
    const {title, value, defaultValue} = question;
    const element = document.createElement("select");
    const elementTypeClass = "magicfeedback-select";

    const option = document.createElement("option");
    option.value = "";
    option.text = format === 'slim' ? parseTitle(title, language) : (defaultValue || t(language, "select.placeholder"));
    option.disabled = true;
    option.selected = true;
    (element as HTMLSelectElement).appendChild(option);

    value.forEach((optionValue) => {
        const opt = document.createElement("option");
        opt.value = optionValue;
        opt.text = optionValue;
        (element as HTMLSelectElement).appendChild(opt);
    });

    if (urlParamValue && value.includes(urlParamValue)) {
        (element as HTMLSelectElement).value = urlParamValue;
    }

    return {element, elementTypeClass};
};
