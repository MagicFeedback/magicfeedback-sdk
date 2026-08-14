import {QuestionRenderer} from "./types";
import {createRatingNumberElement} from "./ratingHelpers";

export const renderRatingNumber: QuestionRenderer = ({
    question,
    order,
    direction,
    send,
    urlParamValue
}) => {
    const elementTypeClass = 'magicfeedback-rating-number';
    const element = createRatingNumberElement(
        question.ref,
        question.assets,
        order,
        direction,
        elementTypeClass,
        send,
        urlParamValue
    );

    return {element, elementTypeClass};
};
