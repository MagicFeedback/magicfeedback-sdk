import {QuestionRenderer} from "./types";

export const renderMultipleChoiceImage: QuestionRenderer = ({
    question,
    randomPosition,
    urlParamValue,
    send
}) => {
    const element = document.createElement("div");
    const elementTypeClass = 'magicfeedback-multiple-choice-image';

    const {ref, assets} = question;
    let values = [...question.value];

    const multipleChoiceImageContainer = document.createElement("div");
    multipleChoiceImageContainer.classList.add("magicfeedback-multiple-choice-image-container");
    multipleChoiceImageContainer.style.display = "flex";
    multipleChoiceImageContainer.style.flexDirection = "row";
    multipleChoiceImageContainer.style.flexWrap = "wrap";
    multipleChoiceImageContainer.style.justifyContent = "center";

    const maxItems = values.length;
    let itemsPerRow = 1;
    let itemsPerColumn = 1;

    if (window.innerWidth < 600) {
        itemsPerRow = 1;
        itemsPerColumn = maxItems;
    } else {
        switch (maxItems) {
            case 1:
            case 2:
            case 3:
                itemsPerRow = maxItems;
                itemsPerColumn = 1;
                break;
            case 4:
            case 5:
            case 6:
                itemsPerColumn = 2;
                itemsPerRow = Math.ceil(maxItems / itemsPerColumn);
                break;
            case 7:
            case 8:
            case 9:
                itemsPerColumn = 3;
                itemsPerRow = Math.ceil(maxItems / itemsPerColumn);
                break;
            default:
                itemsPerColumn = 4;
                itemsPerRow = Math.ceil(maxItems / itemsPerColumn);
                break;
        }
    }

    const useLabel = assets?.addTitle === undefined ? false : assets?.addTitle;
    const multiOptions = assets?.multiOption === undefined ? false : assets?.multiOption;
    const extraOption = assets?.extraOption === undefined ? false : assets?.extraOption;

    if (randomPosition) {
        values = values.sort(() => Math.random() - 0.5);
    }

    function generateOption(option: any) {
        try {
            const {position, url, value} = option;

            const container = document.createElement("div");
            container.classList.add("magicfeedback-multiple-choice-image-option");
            container.style.width = `calc(100% / ${itemsPerRow} - 2px)`;
            container.style.height = `calc(100% / ${itemsPerColumn} - 2px)`;
            container.style.padding = "8px";
            container.style.margin = "0";

            const containerLabel = document.createElement("label");
            containerLabel.classList.add("magicfeedback-image-option-label-container");
            containerLabel.htmlFor = `rating-${ref}-${position}`;
            containerLabel.style.cursor = "pointer";

            containerLabel.addEventListener("click", () => {
                containerLabel.style.border = "2px solid #000";
            });

            const label = document.createElement("label");
            label.textContent = value;
            label.classList.add("magicfeedback-multiple-choice-image-label");

            const input = document.createElement("input");
            input.id = `rating-${ref}-${position}`;
            input.type = multiOptions ? "checkbox" : "radio";
            input.name = ref;
            input.value = value;
            input.style.position = "absolute";
            input.style.opacity = "0";
            input.style.width = "0";
            input.style.height = "0";
            input.classList.add("magicfeedback-input");

            if (urlParamValue && urlParamValue === input.value) {
                input.checked = true;
            }

            if (!multiOptions && send) {
                input.addEventListener("change", () => {
                    send();
                });
            }

            const image = document.createElement("img");
            image.classList.add("magicfeedback-multiple-choice-image-image");
            image.src = url;
            image.style.cursor = "pointer";
            image.style.backgroundSize = "cover";
            image.style.backgroundPosition = "center";
            image.style.width = "100%";
            image.style.height = "100%";
            image.style.objectFit = "cover";
            image.style.margin = "auto";

            containerLabel.appendChild(input);
            containerLabel.appendChild(image);
            if (useLabel) containerLabel.appendChild(label);
            container.appendChild(containerLabel);
            multipleChoiceImageContainer.appendChild(container);
        } catch (e) {
            console.error(e);
        }
    }

    values.forEach((option) => generateOption(JSON.parse(option)));

    if (extraOption && assets?.extraOptionValue && assets?.extraOptionValue.length > 0) {
        generateOption(assets?.extraOptionValue[0]);
    }

    element.appendChild(multipleChoiceImageContainer);

    return {element, elementTypeClass};
};
