import {QuestionRenderer} from "./types";
import {createRatingNumberElement, usesLegacyRatingNumber} from "./ratingHelpers";

export const renderRatingNumber: QuestionRenderer = ({
    question,
    order,
    direction,
    send,
    urlParamValue,
    language,
    isPhone,
    productId,
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
        language,
        {legacy: usesLegacyRatingNumber(productId), isPhone},
    );

    return {element, elementTypeClass};
};
