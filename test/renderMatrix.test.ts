import {describe, expect, test} from "@jest/globals";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";
import {renderMatrix} from "../src/render/renderMatrix";

const matrixQuestion = {
    id: "q-matrix",
    title: "How much do you agree?",
    type: FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX,
    ref: "q_matrix",
    value: ["Agree", "Disagree"],
    assets: {options: ["Row 1", "Row 2"]},
} as unknown as NativeQuestion;

const render = () => renderMatrix({
    question: matrixQuestion,
    format: "standard",
    language: "en",
    url: "",
    isPhone: false,
    urlParamValue: null,
    maxCharacters: 0,
    randomPosition: false,
    direction: "row",
    order: "ltr",
}).element;

describe("renderMatrix (table)", () => {
    test("labels every radio with its option, so the rows can stack in a narrow container", () => {
        const element = render();
        const cells = element.querySelectorAll("td.magicfeedback-multi-question-matrix-option");

        expect(cells).toHaveLength(4);
        cells.forEach((cell) => {
            const input = cell.querySelector("input") as HTMLInputElement;
            const label = cell.querySelector(".magicfeedback-multi-question-matrix-option-label") as HTMLLabelElement;
            expect(label.htmlFor).toBe(input.id);
            expect(label.textContent).toBe(input.value);
        });
    });

    test("keeps the question cell free of inline styles the container query has to override", () => {
        const element = render();
        const questionCell = element.querySelector("td.magicfeedback-multi-question-matrix-question") as HTMLElement;

        expect(questionCell.getAttribute("style")).toBeNull();
    });

    test("keeps the radio names the answer scraper groups by row", () => {
        const element = render();
        const names = Array.from(element.querySelectorAll("input")).map((i) => i.name);

        expect(new Set(names)).toEqual(new Set(["q_matrix-Row 1", "q_matrix-Row 2"]));
    });
});
