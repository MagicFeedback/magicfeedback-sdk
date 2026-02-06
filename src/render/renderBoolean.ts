import {getBooleanOptions} from "./helpers";
import {QuestionRenderer} from "./types";

export const renderBoolean: QuestionRenderer = ({
    question,
    language,
    urlParamValue,
    send
}) => {
    const {ref, assets} = question;

    const element = document.createElement("div");
    const elementTypeClass = 'magicfeedback-radio';

    const booleanContainer = document.createElement('div');
    booleanContainer.classList.add('magicfeedback-boolean-container');
    booleanContainer.style.display = "flex";
    booleanContainer.style.flexDirection = "row";
    booleanContainer.style.justifyContent = "space-between";
    booleanContainer.style.width = "70%";
    booleanContainer.style.margin = "auto";

    const booleanOptions = assets?.addIcon ? ['👍', '👎'] : getBooleanOptions(language);

    booleanOptions.forEach((option, index) => {
        const container = document.createElement("label");
        container.classList.add("magicfeedback-boolean-option");
        container.htmlFor = `rating-${ref}-${index}`;
        container.style.cursor = "pointer";
        container.style.display = "flex";
        container.style.justifyContent = "center";
        container.style.alignItems = "center";
        container.style.margin = "auto";
        container.style.padding = "0";
        container.style.width = "45%";
        container.style.height = "38px";

        const label = document.createElement("label");
        label.htmlFor = `rating-${ref}-${index}`;
        label.textContent = option;
        label.style.margin = "0";
        label.style.padding = "0";

        const input = document.createElement("input");
        input.id = `rating-${ref}-${index}`;
        input.type = "radio";
        input.name = ref;
        input.value = ['Yes', 'No'][index];
        input.classList.add(elementTypeClass);
        input.classList.add("magicfeedback-input");
        input.style.position = "absolute";
        input.style.opacity = "0";
        input.style.width = "0";
        input.style.height = "0";
        input.style.margin = "0";

        input.addEventListener("change", () => {
            if (send) send();
        });

        if (urlParamValue && urlParamValue.toLowerCase() === input.value.toLowerCase()) {
            input.checked = true;
        }

        container.appendChild(input);
        container.appendChild(label);
        booleanContainer.appendChild(container);
    });

    element.appendChild(booleanContainer);

    return {element, elementTypeClass};
};
