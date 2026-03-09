import {QuestionRenderer} from "./types";

export const renderUploadFile: QuestionRenderer = ({
    question
}) => {
    const element = document.createElement("input");
    const elementTypeClass = "magicfeedback-upload-file";

    (element as HTMLInputElement).type = "file";
    (element as HTMLInputElement).required = question.require;
    (element as HTMLInputElement).multiple = question.assets?.multiple || false;
    (element as HTMLInputElement).maxLength = question.assets?.maxFiles || 1;

    return {element, elementTypeClass};
};
