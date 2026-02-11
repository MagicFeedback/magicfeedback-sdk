import {QuestionRenderer} from "./types";
import {createRatingPlaceholder} from "./ratingHelpers";

const defaultEmojiUrl = `https://survey-dev.magicfeedback.io/assets/emojis`;

export const renderRatingEmoji: QuestionRenderer = ({
    question,
    url,
    send,
    urlParamValue
}) => {
    const {ref, assets} = question;

    const element = document.createElement("div");
    const elementTypeClass = 'magicfeedback-rating';

    const ratingContainer = document.createElement('div');
    ratingContainer.classList.add('magicfeedback-rating-container');

    const maxRating = assets?.max ? Number(assets?.max) : 5;
    const minRating = assets?.min ? Number(assets?.min) : 1;

    const ratingPlaceholder = createRatingPlaceholder(
        minRating,
        maxRating,
        assets?.minPlaceholder,
        assets?.maxPlaceholder,
        assets?.extraOption ?? false,
    );

    for (let i = minRating; i <= maxRating; i++) {
        const ratingOption = document.createElement('div');
        ratingOption.classList.add('magicfeedback-rating-option');

        const containerLabel = document.createElement('label');
        containerLabel.htmlFor = `rating-${ref}-${i}`;
        containerLabel.classList.add('magicfeedback-rating-option-label-container');

        const ratingLabel = document.createElement('label');
        ratingLabel.htmlFor = `rating-${ref}-${i}`;
        ratingLabel.textContent = i.toString();

        const ratingImage = document.createElement('img');
        ratingImage.alt = `face-${ref}-${i}`;
        ratingImage.className = `rating-image${i}`;

        if (minRating === 0 && maxRating === 10) {
            ratingImage.src = `${url}/${i}.svg`;
            ratingImage.onerror = () => ratingImage.src = `${defaultEmojiUrl}/${i}.svg`;
        } else if (minRating === 1 && maxRating === 5) {
            switch (i) {
                case 1:
                    ratingImage.src = `${url}/1.svg`;
                    ratingImage.onerror = () => ratingImage.src = `${defaultEmojiUrl}/1.svg`;
                    break;
                case 2:
                    ratingImage.src = `${url}/2.svg`;
                    ratingImage.onerror = () => ratingImage.src = `${defaultEmojiUrl}/2.svg`;
                    break;
                case 3:
                    ratingImage.src = `${url}/6.svg`;
                    ratingImage.onerror = () => ratingImage.src = `${defaultEmojiUrl}/6.svg`;
                    break;
                case 4:
                    ratingImage.src = `${url}/9.svg`;
                    ratingImage.onerror = () => ratingImage.src = `${defaultEmojiUrl}/9.svg`;
                    break;
                case 5:
                    ratingImage.src = `${url}/10.svg`;
                    ratingImage.onerror = () => ratingImage.src = `${defaultEmojiUrl}/10.svg`;
                    break;
            }
        } else {
            const ratingNum = Math.round((i - minRating) * (10 / (maxRating - minRating)));
            ratingImage.src = `${url}/${ratingNum}.svg`;
            ratingImage.onerror = () => ratingImage.src = `${defaultEmojiUrl}/${ratingNum}.svg`;
        }

        const input = document.createElement("input");
        input.id = `rating-${ref}-${i}`;
        input.type = "radio";
        input.name = ref;
        input.value = i.toString();
        input.classList.add(elementTypeClass);
        input.classList.add("magicfeedback-input");

        if (send) {
            input.addEventListener("change", () => {
                send();
            });
        }

        if (urlParamValue && urlParamValue === input.value) {
            input.checked = true;
        }

        containerLabel.appendChild(input);
        containerLabel.appendChild(ratingImage);
        containerLabel.appendChild(ratingLabel);

        ratingOption.appendChild(containerLabel);
        ratingContainer.appendChild(ratingOption);
    }

    if (assets?.extraOption && assets?.extraOptionText) {
        const extraOption = document.createElement('div');
        extraOption.classList.add('magicfeedback-rating-option');

        const containerLabel = document.createElement('label');
        containerLabel.htmlFor = `rating-${ref}-extra`;
        containerLabel.classList.add('magicfeedback-rating-option-label-container');

        const ratingLabel = document.createElement('label');
        ratingLabel.htmlFor = `rating-${ref}-extra`;
        ratingLabel.textContent = assets?.extraOptionText;

        const ratingImage = document.createElement('img');
        ratingImage.src = "https://magicfeedback-c6458-dev.web.app/assets/question.svg";
        ratingImage.alt = `face-${ref}-extra`;
        ratingImage.className = `magicfeedback-rating-image-extra`;

        const input = document.createElement("input");
        input.id = `rating-${ref}-extra`;
        input.type = "radio";
        input.name = ref;
        input.value = '-';
        input.classList.add(elementTypeClass);
        input.classList.add("magicfeedback-input");

        if (send) {
            input.addEventListener("change", () => {
                send();
            });
        }

        containerLabel.appendChild(input);
        containerLabel.appendChild(ratingImage);
        containerLabel.appendChild(ratingLabel);

        extraOption.appendChild(containerLabel);
        ratingContainer.appendChild(extraOption);
    }

    element.appendChild(ratingPlaceholder);
    element.appendChild(ratingContainer);

    return {element, elementTypeClass};
};
