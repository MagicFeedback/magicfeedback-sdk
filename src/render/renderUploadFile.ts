import {QuestionRenderer} from "./types";
import {createUploadControl} from "./uploadHelpers";

export const renderUploadFile: QuestionRenderer = ({
    question,
    language
}) => createUploadControl(question, language, "file");
