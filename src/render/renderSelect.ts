import {parseTitle} from "./helpers";
import {QuestionRenderer} from "./types";

export const renderSelect: QuestionRenderer = ({
    question,
    format,
    language,
    urlParamValue,
    send
}) => {
    const {title, value, defaultValue} = question;
    const element = document.createElement("select");
    const elementTypeClass = "magicfeedback-select";

    const option = document.createElement("option");
    option.value = "";
    option.text = format === 'slim' ? parseTitle(title, language) : (defaultValue || "Select an option");
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

    if (send) {
        element.addEventListener("change", () => {
            send();
        });
    }

    return {element, elementTypeClass};
};
