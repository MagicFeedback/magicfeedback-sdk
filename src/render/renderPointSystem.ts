import {QuestionRenderer} from "./types";
import {placeholder} from "../services/placeholder";

export const renderPointSystem: QuestionRenderer = ({
    question,
    language
}) => {
    const {ref, value} = question;

    const element = document.createElement("div");
    const elementTypeClass = "magicfeedback-point-system";

    const pointSystemContainer = document.createElement("div");
    pointSystemContainer.classList.add("magicfeedback-point-system-container");

    const pointSystemList = document.createElement("ul");
    pointSystemList.classList.add("magicfeedback-point-system-list");
    pointSystemList.style.padding = "0";

    const totalPoints = 100;
    const pointsPerItem = totalPoints / value.length;

    const errorMessage = document.createElement("div");
    errorMessage.classList.add("magicfeedback-error");
    errorMessage.textContent = placeholder.pointsystemerror(language || 'en');
    errorMessage.style.color = "#C70039";
    errorMessage.style.fontSize = "14px";
    errorMessage.style.textAlign = "right";
    errorMessage.style.width = "100%";
    errorMessage.style.display = "none";

    const totalPointsContainer = document.createElement("div");
    totalPointsContainer.classList.add("magicfeedback-point-system-total");
    totalPointsContainer.textContent = `0 / 100 %`;
    totalPointsContainer.style.textAlign = "right";
    totalPointsContainer.style.fontSize = "15px";
    totalPointsContainer.style.marginTop = "5px";

    value.forEach((option, index) => {
        const item = document.createElement("li");
        item.classList.add("magicfeedback-point-system-item");
        item.style.display = "flex";
        item.style.justifyContent = "space-between";
        item.style.alignItems = "center";
        item.style.margin = "5px";

        const itemLabel = document.createElement("label");
        itemLabel.textContent = option;
        itemLabel.style.fontSize = "15px";
        item.appendChild(itemLabel);

        const inputContainer = document.createElement("span");
        inputContainer.classList.add("magicfeedback-point-system-input-container");

        const itemInput = document.createElement("input");
        itemInput.name = ref;
        itemInput.id = `${option}`;
        itemInput.type = "number";
        itemInput.min = "0";
        itemInput.max = `${totalPoints}`;
        itemInput.value = `0`;
        itemInput.classList.add("magicfeedback-input");
        itemInput.style.width = "40px";
        itemInput.style.border = "0";
        itemInput.style.textAlign = "center";
        itemInput.style.margin = "0 5px";
        itemInput.autofocus = index === 0;

        const percentSymbol = document.createElement("span");
        percentSymbol.textContent = "%";
        percentSymbol.style.color = "#000";

        itemInput.addEventListener("input", () => {
            const allInputs = pointSystemList.querySelectorAll("input");
            let total = 0;
            allInputs.forEach((input) => {
                total += Number((input as HTMLInputElement).value);
            });

            if (total > totalPoints) {
                itemInput.value = `${pointsPerItem}%`;
                total = total - Number((itemInput as HTMLInputElement).value);
            }

            const submitButton = document.getElementById("magicfeedback-submit");
            if (submitButton) {
                if (total < 100) {
                    totalPointsContainer.style.color = "orange";
                    submitButton.setAttribute("disabled", "true");
                } else {
                    errorMessage.style.display = "none";
                    totalPointsContainer.style.color = "green";
                    submitButton.removeAttribute("disabled");
                }
            }

            totalPointsContainer.textContent = `${total} / 100 %`;
        });

        itemInput.addEventListener("focus", () => {
            const submitButton = document.getElementById("magicfeedback-submit");
            if (submitButton) {
                submitButton.setAttribute("disabled", "true");
                submitButton.addEventListener("pointerover", () => {
                    const allInputs = pointSystemList.querySelectorAll("input");
                    let total = 0;
                    allInputs.forEach((input) => {
                        total += Number((input as HTMLInputElement).value);
                    });
                    if (total < 100) errorMessage.style.display = "block";
                })
            }
        });

        inputContainer.appendChild(itemInput);
        inputContainer.appendChild(percentSymbol);

        item.appendChild(inputContainer);
        pointSystemList.appendChild(item);
    });

    pointSystemContainer.appendChild(pointSystemList);
    pointSystemContainer.appendChild(totalPointsContainer);
    pointSystemContainer.appendChild(errorMessage);
    element.appendChild(pointSystemContainer);

    return {element, elementTypeClass};
};
