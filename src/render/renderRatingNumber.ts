import {QuestionRenderer} from "./types";
import {createRatingNumberElement} from "./ratingHelpers";

export const renderRatingNumber: QuestionRenderer = ({
    question,
    order,
    direction,
    send,
    urlParamValue,
    language
}) => {
    const elementTypeClass = 'magicfeedback-rating-number';
    const element = createRatingNumberElement(
        question.ref,
        question.assets,
        order,
        direction,
        elementTypeClass,
        send,
        urlParamValue,
        language
    );

    return {element, elementTypeClass};
};
