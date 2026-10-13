import {QuestionRenderer} from "./types";
import {autoAdvanceOn} from "../utils/autoAdvance";

export const renderConsent: QuestionRenderer = ({
    question,
    urlParamValue,
    send
}) => {
    const {id, ref, value, require} = question;

    const element = document.createElement("input");
    const elementTypeClass = "magicfeedback-consent";

    (element as HTMLInputElement).type = "checkbox";
    element.id = `magicfeedback-${id}`;
    (element as HTMLInputElement).name = ref;
    (element as HTMLInputElement).value = "true";
    (element as HTMLInputElement).required = require;
    element.classList.add("magicfeedback-consent");
    element.classList.add("magicfeedback-input");

    if (urlParamValue && value.includes(urlParamValue)) {
        (element as HTMLInputElement).checked = true;
    }

    autoAdvanceOn(element, send);

    return {element, elementTypeClass};
};
