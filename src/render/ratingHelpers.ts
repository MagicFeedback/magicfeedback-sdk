export function createRatingPlaceholder(
    min: number,
    max: number,
    minPlaceholder?: string,
    maxPlaceholder?: string,
    extraOption: boolean = false,
    mobile: boolean = true,
    order = 'ltr',
    direction = 'row'
) {
    const ratingPlaceholder = document.createElement('div');
    ratingPlaceholder.classList.add('magicfeedback-rating-placeholder');
    ratingPlaceholder.style.display = "flex";
    ratingPlaceholder.style.flexDirection = direction;
    ratingPlaceholder.style.alignItems = "center";
    ratingPlaceholder.style.justifyContent = "space-between";
    ratingPlaceholder.style.width = extraOption ? `calc(100% - (100% / ${max + 1}))` : "100%";

    ratingPlaceholder.style.marginRight = "auto";

    if (mobile && window.innerWidth < 600) ratingPlaceholder.style.flexDirection = "column";

    const ratingPlaceholderMin = document.createElement('span');
    ratingPlaceholderMin.textContent = minPlaceholder ?? null;
    ratingPlaceholderMin.classList.add('magicfeedback-rating-placeholder-value');
    ratingPlaceholderMin.style.fontSize = "15px";
    ratingPlaceholderMin.style.textAlign = order === 'ltr' ? "left" : "right";
    ratingPlaceholderMin.style.width = `50%`;

    if (mobile && window.innerWidth < 600 || direction === 'column') {
        ratingPlaceholderMin.textContent = `${min} = ${minPlaceholder}`;
        ratingPlaceholderMin.style.width = '100%';
        ratingPlaceholderMin.style.textAlign = "left";
        ratingPlaceholderMin.style.marginBottom = "5px";
    }


    const ratingPlaceholderMax = document.createElement('span');
    ratingPlaceholderMax.textContent = maxPlaceholder ?? null;
    ratingPlaceholderMax.classList.add('magicfeedback-rating-placeholder-value');
    ratingPlaceholderMax.style.fontSize = "15px";
    ratingPlaceholderMax.style.textAlign = order === 'ltr' ? "right" : "left";
    ratingPlaceholderMax.style.width = `50%`;

    if (mobile && window.innerWidth < 600 || direction === 'column') {
        ratingPlaceholderMax.textContent = `${max} = ${maxPlaceholder}`;
        ratingPlaceholderMax.style.width = '100%';
        ratingPlaceholderMax.style.textAlign = "left";
        ratingPlaceholderMax.style.marginBottom = "5px";
    }

    if (order === 'ltr') {
        if (minPlaceholder) ratingPlaceholder.appendChild(ratingPlaceholderMin);
        if (maxPlaceholder) ratingPlaceholder.appendChild(ratingPlaceholderMax);
    } else {
        if (maxPlaceholder) ratingPlaceholder.appendChild(ratingPlaceholderMax);
        if (minPlaceholder) ratingPlaceholder.appendChild(ratingPlaceholderMin);
    }

    return ratingPlaceholder;
}

export function createStarRating(
    ref: string,
    minPlaceholder?: string,
    maxPlaceholder?: string,
    send: () => void = () => {
    },
    urlParamValue?: string | null
) {
    const size = 40;
    const selectedClass = "magicfeedback-rating-star-selected";
    const starFilled = "★";

    const ratingContainer = document.createElement("div");
    ratingContainer.classList.add("magicfeedback-rating-star-container");
    ratingContainer.style.maxWidth = "300px";
    ratingContainer.style.margin = "auto";
    ratingContainer.dataset.originalSelection = '0';

    for (let i = 1; i <= 5; i++) {
        const ratingOption = document.createElement("label");
        ratingOption.classList.add("magicfeedback-rating-star-option");

        const ratingInput = document.createElement("input");
        ratingInput.id = `rating-${ref}-${i}`;
        ratingInput.type = "radio";
        ratingInput.name = ref;
        ratingInput.value = i.toString();
        ratingInput.style.position = "absolute";
        ratingInput.style.opacity = "0";
        ratingInput.style.width = "0";
        ratingInput.style.height = "0";
        ratingInput.classList.add("magicfeedback-input");

        if (urlParamValue && urlParamValue === ratingInput.value) {
            ratingInput.checked = true;
        }

        ratingInput.addEventListener("change", () => {
            const allStars = ratingContainer.querySelectorAll(".rating__star");
            for (let j = 0; j < allStars.length; j++) {
                if (j + 1 <= Number(ratingInput.value)) {
                    if (!allStars[j].classList.contains(selectedClass)) allStars[j].classList.add(selectedClass);
                } else {
                    if (allStars[j].classList.contains(selectedClass)) allStars[j].classList.remove(selectedClass);
                }
            }
            ratingContainer.dataset.originalSelection = ratingInput.value;
            if (send) send();
        });

        ratingOption.appendChild(ratingInput);

        const starElement = document.createElement("label");
        starElement.htmlFor = `rating-${ref}-${i}`;
        starElement.classList.add("rating__star");
        starElement.textContent = starFilled;
        starElement.style.fontSize = `${size}px`;
        starElement.style.color = "#CCCCCC";
        starElement.style.cursor = "pointer";

        starElement.addEventListener("mouseenter", () => {
            const allStars = ratingContainer.querySelectorAll(".rating__star");
            const idx = i - 1;
            allStars.forEach((star, starIdx) => {
                if (starIdx <= idx) {
                    if (!star.classList.contains(selectedClass)) star.classList.add(selectedClass);
                } else {
                    if (star.classList.contains(selectedClass)) star.classList.remove(selectedClass);
                }
            });
        });
        starElement.addEventListener("mouseleave", () => {
            const original = Number(ratingContainer.dataset.originalSelection || '0');
            const allStars = ratingContainer.querySelectorAll(".rating__star");
            allStars.forEach((star, starIdx) => {
                if (starIdx < original) {
                    if (!star.classList.contains(selectedClass)) star.classList.add(selectedClass);
                } else {
                    if (star.classList.contains(selectedClass)) star.classList.remove(selectedClass);
                }
            });
        });

        ratingOption.appendChild(starElement);
        ratingContainer.appendChild(ratingOption);
    }

    ratingContainer.appendChild(createRatingPlaceholder(1, 5, minPlaceholder, maxPlaceholder, false, false));

    return ratingContainer;
}

export function createRatingNumberElement(
    ref: string,
    assets: any,
    order: string,
    direction: string,
    isPhone: boolean,
    elementTypeClass: string,
    send?: () => void,
    urlParamValue?: string | null,
): HTMLElement {
    const element = document.createElement("div");
    element.classList.add('magicfeedback-rating-number');

    const numberContainerDirection = order === 'ltr' ? direction : `${direction}-reverse`;
    const ratingNumberContainer = document.createElement('div');
    ratingNumberContainer.classList.add('magicfeedback-rating-number-container');
    ratingNumberContainer.classList.add(`magicfeedback-rating-number-container-${order}`);
    ratingNumberContainer.classList.add(`magicfeedback-rating-number-container-${direction}`);
    ratingNumberContainer.style.display = "flex";
    ratingNumberContainer.style.flexDirection = numberContainerDirection;
    ratingNumberContainer.setAttribute('role', 'radiogroup');
    ratingNumberContainer.setAttribute('aria-label', assets?.ariaLabel || 'Rating');

    const maxRatingNumber = assets?.max ? Number(assets?.max) : 10;
    const minRatingNumber = assets?.min ? Number(assets?.min) : 0;

    const numberPlaceholders = assets?.numberPlaceholders || null;

    const integratePlaceholders = !(isPhone || direction === 'column');

    for (let i = minRatingNumber; i <= maxRatingNumber; i++) {
        const ratingOption = document.createElement('div');
        ratingOption.classList.add('magicfeedback-rating-number-option');
        ratingOption.classList.add(`magicfeedback-rating-number-option-${direction}`);

        const containerLabel = document.createElement('label');
        containerLabel.htmlFor = `rating-${ref}-${i}`;
        containerLabel.classList.add('magicfeedback-rating-number-option-label-container');

        if (integratePlaceholders) {
            const cap = document.createElement('span');
            cap.classList.add('magicfeedback-rating-number-cap');
            cap.classList.add('magicfeedback-rating-placeholder-value');
            cap.style.fontSize = "14px";
            cap.style.whiteSpace = 'nowrap';
            cap.style.wordBreak = 'normal';
            if (i === minRatingNumber && assets?.minPlaceholder) {
                cap.textContent = assets.minPlaceholder;
                cap.dataset.capType = 'min';
            } else if (i === maxRatingNumber && assets?.maxPlaceholder) {
                cap.textContent = assets.maxPlaceholder;
                cap.dataset.capType = 'max';
            } else cap.dataset.capType = 'mid';
            containerLabel.appendChild(cap);
        }

        let inputText = i.toString();

        if (!integratePlaceholders) {
            if (numberPlaceholders && numberPlaceholders[i]) inputText += ` = ${numberPlaceholders[i]}`;
            else if (i === minRatingNumber && assets?.minPlaceholder) inputText += ` = ${assets?.minPlaceholder}`;
            else if (i === maxRatingNumber && assets?.maxPlaceholder) inputText += ` = ${assets?.maxPlaceholder}`;
        } else {
            if (numberPlaceholders && numberPlaceholders[i] && !isPhone) containerLabel.title = numberPlaceholders[i];
        }

        const input = document.createElement("input");
        input.id = `rating-${ref}-${i}`;
        input.type = "radio";
        input.name = ref;
        input.value = i.toString();
        input.classList.add(elementTypeClass);
        input.classList.add("magicfeedback-input");
        input.setAttribute('aria-label', `${i}`);

        if (send) input.addEventListener("change", () => send());

        if (urlParamValue && urlParamValue === input.value) {
            input.checked = true;
        }

        const ratingLabel = document.createElement('label');
        ratingLabel.htmlFor = `rating-${ref}-${i}`;
        ratingLabel.textContent = inputText;
        ratingLabel.classList.add('magicfeedback-rating-number-value');

        containerLabel.appendChild(input);
        containerLabel.appendChild(ratingLabel);
        ratingOption.appendChild(containerLabel);
        ratingNumberContainer.appendChild(ratingOption);
    }

    if (assets?.extraOption && assets?.extraOptionText) {
        const extraOption = document.createElement('div');
        extraOption.classList.add('magicfeedback-rating-number-option');

        const containerLabel = document.createElement('label');
        containerLabel.htmlFor = `rating-${ref}-extra`;
        containerLabel.classList.add('magicfeedback-rating-number-option-label-container');

        if (integratePlaceholders) {
            const cap = document.createElement('span');
            cap.classList.add('magicfeedback-rating-number-cap');
            cap.dataset.capType = 'extra';
            cap.style.fontSize = '12px';
            cap.style.whiteSpace = 'nowrap';
            cap.style.wordBreak = 'normal';
            containerLabel.appendChild(cap);
        }

        const input = document.createElement("input");
        input.id = `rating-${ref}-extra`;
        input.type = "radio";
        input.name = ref;
        input.value = '-';
        input.classList.add(elementTypeClass);
        input.classList.add("magicfeedback-input");
        input.setAttribute('aria-label', assets?.extraOptionText);
        if (send) input.addEventListener("change", () => send());

        const ratingLabel = document.createElement('label');
        ratingLabel.htmlFor = `rating-${ref}-extra`;
        ratingLabel.textContent = assets?.extraOptionText;
        ratingLabel.classList.add('magicfeedback-rating-number-value');

        containerLabel.appendChild(input);
        containerLabel.appendChild(ratingLabel);
        extraOption.appendChild(containerLabel);

        if (order === 'ltr') ratingNumberContainer.appendChild(extraOption);
        else ratingNumberContainer.insertBefore(extraOption, ratingNumberContainer.firstChild);
    }

    element.appendChild(ratingNumberContainer);

    return element;
}
