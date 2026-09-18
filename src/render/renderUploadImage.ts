import {QuestionRenderer} from "./types";
import {createUploadControl} from "./uploadHelpers";

export const renderUploadImage: QuestionRenderer = ({
    question,
    language
}) => createUploadControl(question, language, "image");
