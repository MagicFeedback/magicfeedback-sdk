import {QuestionRenderer} from "./types";

export const renderMatrix: QuestionRenderer = ({
    question,
    isPhone,
    randomPosition
}) => {
    const {ref, value, assets} = question;

    const element = document.createElement("div");
    const elementTypeClass = "magicfeedback-multi-question-matrix";

    const matrixContainer = document.createElement("div");
    matrixContainer.classList.add("magicfeedback-multi-question-matrix-container");

    let options = assets?.options || [];
    let values = [...value];
    let exclusiveValues: string[] = [];

    if (randomPosition) {
        options = options?.sort(() => Math.random() - 0.5);
        values = [...values].sort(() => Math.random() - 0.5);
    }

    if (assets?.exclusiveAnswers) {
        exclusiveValues = assets?.exclusiveAnswers;
        exclusiveValues?.forEach((answer) => {
            if (!values.includes(answer)) values.push(answer);
        });
    }

    if (isPhone) {
        const list = document.createElement("div");
        list.classList.add("magicfeedback-multi-question-matrix-list");

        options?.forEach((questionText: string) => {
            const row = document.createElement("div");
            row.classList.add("magicfeedback-multi-question-matrix-list-item");
            row.style.display = "flex";
            row.style.flexDirection = "column";
            row.style.alignItems = "flex-start";
            row.style.marginBottom = "10px";

            const label = document.createElement("label");
            label.classList.add("magicfeedback-multi-question-matrix-label");
            label.style.paddingBottom = "10px";
            label.textContent = questionText;
            row.appendChild(label);

            values.forEach((option) => {
                const container = document.createElement("div");
                container.classList.add(`magicfeedback-radio-container`);
                container.style.display = "flex";
                container.style.alignItems = "center";
                container.style.justifyContent = "flex-start";
                container.style.width = "99%";
                container.style.margin = "5px auto";

                const optionLabel = document.createElement("label");
                const input = document.createElement("input");
                input.id = `${ref}-${questionText}-${option}`;
                input.type = "radio";
                input.name = `${ref}-${questionText}`;
                input.value = option;
                input.classList.add("magicfeedback-input");

                optionLabel.textContent = option;
                optionLabel.htmlFor = `${ref}-${questionText}-${option}`;
                container.appendChild(input);
                container.appendChild(optionLabel);
                row.appendChild(container);
            });

            list.appendChild(row);
        });

        matrixContainer.appendChild(list);
    } else {
        const table = document.createElement("table");
        table.classList.add("magicfeedback-multi-question-matrix-table");

        const header = document.createElement("thead");
        header.classList.add("magicfeedback-multi-question-matrix-header");
        header.style.paddingBottom = "15px";
        const headerRow = document.createElement("tr");

        const emptyHeaderCell = document.createElement("th");
        headerRow.appendChild(emptyHeaderCell);

        values.forEach((option) => {
            const headerCell = document.createElement("th");
            headerCell.textContent = option;
            headerRow.appendChild(headerCell);
        });

        header.appendChild(headerRow);
        table.appendChild(header);

        const body = document.createElement("tbody");

        options?.forEach((questionText: string) => {
            const row = document.createElement("tr");
            row.classList.add("magicfeedback-multi-question-matrix-row-tr");

            const questionCell = document.createElement("td");
            questionCell.style.minWidth = "200px";
            questionCell.style.padding = "10px";
            const label = document.createElement("label");
            label.classList.add("magicfeedback-multi-question-matrix-label");
            label.textContent = questionText;

            questionCell.appendChild(label);
            row.appendChild(questionCell);

            values.forEach((option) => {
                const optionCell = document.createElement("td");
                const input = document.createElement("input");
                input.type = "radio";
                input.name = `${ref}-${questionText}`;
                input.value = option;
                input.id = `${ref}-${questionText}-${option}`;
                input.classList.add("magicfeedback-input");

                optionCell.appendChild(input);
                row.appendChild(optionCell);
            });

            body.appendChild(row);
        });

        table.appendChild(body);
        matrixContainer.appendChild(table);
    }

    element.appendChild(matrixContainer);

    return {element, elementTypeClass};
};
