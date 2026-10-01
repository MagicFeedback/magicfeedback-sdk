import {t} from "../services/i18n";

/**
 * A caption line for min/max labels — one line, min on one side and max on
 * the other (swapped for order: "rtl"), same simple pattern rating-number
 * uses for its own row caption. No viewport-width branching: the caller
 * decides where this sits (rating-star and rating-emoji place it below
 * their options), and it always reads the same way regardless of screen
 * size.
 */
export function createRatingPlaceholder(
    minPlaceholder?: string,
    maxPlaceholder?: string,
    order = 'ltr',
) {
    const ratingPlaceholder = document.createElement('div');
    ratingPlaceholder.classList.add('magicfeedback-rating-placeholder');

    const ratingPlaceholderMin = document.createElement('span');
    ratingPlaceholderMin.textContent = minPlaceholder ?? '';
    ratingPlaceholderMin.classList.add('magicfeedback-rating-placeholder-value');

    const ratingPlaceholderMax = document.createElement('span');
    ratingPlaceholderMax.textContent = maxPlaceholder ?? '';
    ratingPlaceholderMax.classList.add('magicfeedback-rating-placeholder-value');

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

    const ratingPlaceholder = createRatingPlaceholder(minPlaceholder, maxPlaceholder);
    if (ratingPlaceholder.childElementCount > 0) ratingContainer.appendChild(ratingPlaceholder);

    return ratingContainer;
}

export function createRatingNumberElement(
    ref: string,
    assets: any,
    order: string,
    direction: string,
    elementTypeClass: string,
    send?: () => void,
    urlParamValue?: string | null,
    language?: string,
): HTMLElement {
    const element = document.createElement("div");
    element.classList.add('magicfeedback-rating-number');

    const isColumn = direction === 'column';
    const numberContainerDirection = order === 'ltr' ? direction : `${direction}-reverse`;
    const ratingNumberContainer = document.createElement('div');
    ratingNumberContainer.classList.add('magicfeedback-rating-number-container');
    ratingNumberContainer.classList.add(`magicfeedback-rating-number-container-${order}`);
    ratingNumberContainer.classList.add(`magicfeedback-rating-number-container-${direction}`);
    ratingNumberContainer.style.display = "flex";
    ratingNumberContainer.style.flexDirection = numberContainerDirection;
    ratingNumberContainer.setAttribute('role', 'radiogroup');
    ratingNumberContainer.setAttribute('aria-label', assets?.ariaLabel || t(language, 'rating.ariaLabel'));

    const maxRatingNumber = assets?.max ? Number(assets?.max) : 10;
    const minRatingNumber = assets?.min ? Number(assets?.min) : 0;

    // A short scale's chips stay roomy; a long one (0-10 NPS, say) would
    // otherwise be forced into the same width and shrink past comfortable —
    // this scales them down on purpose instead of stretching thin.
    if (!isColumn && (maxRatingNumber - minRatingNumber + 1) > 6) {
        ratingNumberContainer.classList.add('magicfeedback-rating-number-container-row--dense');
    }

    const numberPlaceholders = assets?.numberPlaceholders || null;
    const hasNumberPlaceholders = !!(numberPlaceholders && Object.keys(numberPlaceholders).length);

    // Row: min/max as one caption line below, left/right — the row itself
    // reads left-to-right, so the caption bookends it the same way.
    let rowScaleLabels: HTMLElement | null = null;
    if (!isColumn && (assets?.minPlaceholder || assets?.maxPlaceholder)) {
        rowScaleLabels = document.createElement('div');
        rowScaleLabels.classList.add('magicfeedback-rating-number-scale-labels');

        const minLabel = document.createElement('span');
        minLabel.classList.add('magicfeedback-rating-number-scale-label');
        minLabel.textContent = assets?.minPlaceholder ?? '';

        const maxLabel = document.createElement('span');
        maxLabel.classList.add('magicfeedback-rating-number-scale-label');
        maxLabel.textContent = assets?.maxPlaceholder ?? '';

        if (order === 'ltr') {
            rowScaleLabels.appendChild(minLabel);
            rowScaleLabels.appendChild(maxLabel);
        } else {
            rowScaleLabels.appendChild(maxLabel);
            rowScaleLabels.appendChild(minLabel);
        }
    }

    // Column with no per-option text: each row is now its own separated
    // chip, not one shared box — so the caption bookends the whole stack
    // from outside it (above the first chip, below the last) rather than
    // living inside a box that no longer exists.
    // A row also gets these, hidden, for when it is too narrow and stacks
    // (see stackRowWhenNarrow) — then it reads exactly like a bare column.
    let columnAfterLabel: HTMLElement | null = null;
    if (isColumn && !hasNumberPlaceholders) {
        ratingNumberContainer.classList.add('magicfeedback-rating-number-container-column--bare');
    }
    if ((!isColumn || !hasNumberPlaceholders) && (assets?.minPlaceholder || assets?.maxPlaceholder)) {
        // order="rtl" flips the list itself (rendered column-reverse),
        // so the end each label sits next to flips with it.
        const topText = order === 'ltr' ? assets?.minPlaceholder : assets?.maxPlaceholder;
        const bottomText = order === 'ltr' ? assets?.maxPlaceholder : assets?.minPlaceholder;
        const createBlockLabel = (text: string) => {
            const label = document.createElement('div');
            label.classList.add('magicfeedback-rating-number-scale-label-block');
            if (!isColumn) label.classList.add('magicfeedback-rating-number-scale-label-block--stacked');
            label.textContent = text;
            return label;
        };

        if (topText) element.appendChild(createBlockLabel(topText));
        if (bottomText) columnAfterLabel = createBlockLabel(bottomText);
    }

    for (let i = minRatingNumber; i <= maxRatingNumber; i++) {
        const ratingOption = document.createElement('div');
        ratingOption.classList.add('magicfeedback-rating-number-option');
        ratingOption.classList.add(`magicfeedback-rating-number-option-${direction}`);

        const containerLabel = document.createElement('label');
        containerLabel.htmlFor = `rating-${ref}-${i}`;
        containerLabel.classList.add('magicfeedback-rating-number-option-label-container');

        const ownPlaceholder = hasNumberPlaceholders && (
            numberPlaceholders[i]
            || (i === minRatingNumber ? assets?.minPlaceholder : undefined)
            || (i === maxRatingNumber ? assets?.maxPlaceholder : undefined)
        );

        const input = document.createElement("input");
        input.id = `rating-${ref}-${i}`;
        input.type = "radio";
        input.name = ref;
        input.value = i.toString();
        input.classList.add(elementTypeClass);
        input.classList.add("magicfeedback-input");
        input.setAttribute('aria-label', ownPlaceholder ? `${i} — ${ownPlaceholder}` : `${i}`);

        if (send) input.addEventListener("change", () => send());

        if (urlParamValue && urlParamValue === input.value) {
            input.checked = true;
        }

        containerLabel.appendChild(input);

        // Everything after the input lives in one wrapping span, so the
        // ":checked + .value" sibling rule can flip the whole segment's
        // look (fill, radius, color) in one place — children inherit color.
        const ratingValue = document.createElement('span');
        ratingValue.classList.add('magicfeedback-rating-number-value');

        const ratingNumber = document.createElement('span');
        ratingNumber.textContent = i.toString();
        ratingNumber.classList.add('magicfeedback-rating-number-value-num');
        ratingValue.appendChild(ratingNumber);

        if (isColumn) {
            // Column rows have room to show the option's own text plainly —
            // capsule row, not squeezed into a bead the way row mode is.
            if (ownPlaceholder) {
                const ratingText = document.createElement('span');
                ratingText.textContent = ownPlaceholder;
                ratingText.classList.add('magicfeedback-rating-number-value-label');
                ratingValue.appendChild(ratingText);
            }
        } else if (numberPlaceholders && numberPlaceholders[i]) {
            // Row mode has no room for text per option — surface it as a
            // hoverable tooltip instead.
            containerLabel.title = numberPlaceholders[i];
        }

        containerLabel.appendChild(ratingValue);
        ratingOption.appendChild(containerLabel);
        ratingNumberContainer.appendChild(ratingOption);
    }

    element.appendChild(ratingNumberContainer);

    // The "after" label always sits right after the container, so the
    // container + label-block spacing rule holds in a stacked row too.
    if (columnAfterLabel) element.appendChild(columnAfterLabel);
    if (rowScaleLabels) element.appendChild(rowScaleLabels);

    if (!isColumn) {
        stackRowWhenNarrow(element, ratingNumberContainer, maxRatingNumber - minRatingNumber + 1, order);
    }

    if (assets?.extraOption && assets?.extraOptionText) {
        // Always its own row below the scale — the extra option means
        // "doesn't apply", it isn't a point on the 1..N continuum.
        const extraRow = document.createElement('div');
        extraRow.classList.add('magicfeedback-rating-number-extra-row');

        const extraOption = document.createElement('div');
        extraOption.classList.add('magicfeedback-rating-number-option');
        extraOption.classList.add('magicfeedback-rating-number-option--extra');

        const containerLabel = document.createElement('label');
        containerLabel.htmlFor = `rating-${ref}-extra`;
        containerLabel.classList.add('magicfeedback-rating-number-option-label-container');

        const input = document.createElement("input");
        input.id = `rating-${ref}-extra`;
        input.type = "radio";
        input.name = ref;
        input.value = '-';
        input.classList.add(elementTypeClass);
        input.classList.add("magicfeedback-input");
        input.setAttribute('aria-label', assets?.extraOptionText);
        if (send) input.addEventListener("change", () => send());

        const ratingValue = document.createElement('span');
        ratingValue.classList.add('magicfeedback-rating-number-value');

        const ratingLabel = document.createElement('span');
        ratingLabel.textContent = assets?.extraOptionText;
        ratingLabel.classList.add('magicfeedback-rating-number-value-label');
        ratingValue.appendChild(ratingLabel);

        containerLabel.appendChild(input);
        containerLabel.appendChild(ratingValue);
        extraOption.appendChild(containerLabel);
        extraRow.appendChild(extraOption);
        element.appendChild(extraRow);
    }

    return element;
}

/** Narrowest a row chip may get before the row stacks into a column. */
export const RATING_NUMBER_MIN_CHIP_WIDTH = 44;

/**
 * A row that can't give every chip RATING_NUMBER_MIN_CHIP_WIDTH (an 11-point
 * NPS on a phone, a narrow pop-in) turns into the bare column layout, and
 * back when there is room again. It follows the width of the question
 * itself, not the window. Only classes and the flex direction change, so
 * the inputs, their order and a checked answer stay as they are.
 */
function stackRowWhenNarrow(element: HTMLElement, container: HTMLElement, optionCount: number, order: string) {
    if (typeof ResizeObserver === 'undefined') return;

    const isDense = container.classList.contains('magicfeedback-rating-number-container-row--dense');
    let rowGap = 0;
    let stacked = false;

    const setStacked = (stack: boolean) => {
        if (stack === stacked) return;
        stacked = stack;

        element.classList.toggle('magicfeedback-rating-number--stacked', stack);
        container.classList.toggle('magicfeedback-rating-number-container-row', !stack);
        container.classList.toggle('magicfeedback-rating-number-container-row--dense', !stack && isDense);
        container.classList.toggle('magicfeedback-rating-number-container-column', stack);
        container.classList.toggle('magicfeedback-rating-number-container-column--bare', stack);
        container.style.flexDirection = stack
            ? (order === 'ltr' ? 'column' : 'column-reverse')
            : (order === 'ltr' ? 'row' : 'row-reverse');

        container.querySelectorAll(':scope > .magicfeedback-rating-number-option').forEach((option) => {
            option.classList.toggle('magicfeedback-rating-number-option-row', !stack);
            option.classList.toggle('magicfeedback-rating-number-option-column', stack);
        });
    };

    new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width;
        if (!width) return;

        // Read the gap while it is still a row: the column has its own.
        if (!stacked) rowGap = parseFloat(getComputedStyle(container).columnGap) || 0;
        const needed = optionCount * RATING_NUMBER_MIN_CHIP_WIDTH + (optionCount - 1) * rowGap;
        setStacked(width < needed);
    }).observe(element);
}
