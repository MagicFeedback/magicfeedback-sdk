import {QuestionRenderer} from "./types";
import {createStarRating} from "./ratingHelpers";

export const renderRatingStar: QuestionRenderer = ({
    question,
    send,
    urlParamValue
}) => {
    const element = document.createElement("div");
    const elementTypeClass = 'magicfeedback-rating-star';

    const ratingStarContainer = createStarRating(
        question.ref,
        question.assets?.minPlaceholder,
        question.assets?.maxPlaceholder,
        send,
        urlParamValue
    );

    element.appendChild(ratingStarContainer);

    return {element, elementTypeClass};
};
