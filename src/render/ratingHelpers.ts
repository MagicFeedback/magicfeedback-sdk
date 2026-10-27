import {t} from "../services/i18n";
import {autoAdvanceOn} from "../utils/autoAdvance";

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

    // Fills the stars up to `value` (1-5); 0 empties them.
    const paintStars = (value: number) => {
        ratingContainer.querySelectorAll(".rating__star").forEach((star, starIdx) => {
            star.classList.toggle(selectedClass, starIdx < value);
        });
    };

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
            paintStars(Number(ratingInput.value));
            ratingContainer.dataset.originalSelection = ratingInput.value;
        });
        autoAdvanceOn(ratingInput, send);

        ratingOption.appendChild(ratingInput);

        const starElement = document.createElement("label");
        starElement.htmlFor = `rating-${ref}-${i}`;
        starElement.classList.add("rating__star");
        starElement.textContent = starFilled;
        starElement.style.fontSize = `${size}px`;
        starElement.style.color = "#CCCCCC";
        starElement.style.cursor = "pointer";

        starElement.addEventListener("mouseenter", () => paintStars(i));
        starElement.addEventListener("mouseleave", () =>
            paintStars(Number(ratingContainer.dataset.originalSelection || '0')));

        ratingOption.appendChild(starElement);
        ratingContainer.appendChild(ratingOption);
    }

    // A score prefilled from the URL (`?<ref>=4`) only checks the radio, which
    // the stars don't show: paint it and keep it as the selection, or the
    // visitor sees five empty stars and hovering out clears them.
    const prefilled = ratingContainer.querySelector<HTMLInputElement>("input:checked");
    if (prefilled) {
        ratingContainer.dataset.originalSelection = prefilled.value;
        paintStars(Number(prefilled.value));
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
    options: RatingNumberOptions = {},
): HTMLElement {
    const element = document.createElement("div");
    element.classList.add('magicfeedback-rating-number');

    // Legacy (the 2.2.5 rating, before the August redesign): on a phone the
    // scale is a full-width list and the min/max text sits inside its option
    // ("10 = Very likely") instead of in separate labels. Desktop keeps the
    // row with the caption. The phone decision is the window width at render
    // time, as it was then, and the row never stacks by container width.
    const legacy = !!options.legacy;
    const legacyPhone = legacy && !!options.isPhone;
    const legacyText = legacyPhone ? legacyInlineText(assets) : null;
    if (legacyPhone) {
        direction = 'column';
        assets = {...assets, minPlaceholder: undefined, maxPlaceholder: undefined, numberPlaceholders: undefined};
    }
    if (legacy) element.classList.add('magicfeedback-rating-number--legacy');

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

    // Row with a text per number: every option shows its own text above
    // its chip (or below, numberPlaceholdersPosition "bottom"), so the
    // min/max caption would only repeat the two ends. The legacy rating
    // keeps them as tooltips, as it always had.
    const rowCaptions = !isColumn && !legacy && !!numberPlaceholders
        && Object.values(numberPlaceholders).some((text) => !!text);
    const captionPosition = assets?.numberPlaceholdersPosition === 'bottom' ? 'bottom' : 'top';
    // Every option as tall as the tallest text, so the chips line up.
    if (rowCaptions) ratingNumberContainer.style.alignItems = 'stretch';

    // Row: min/max as one caption line, left/right — the row itself reads
    // left-to-right, so the caption bookends it the same way. It sits where
    // the integration's stylesheet puts it unless minMaxPlaceholderPosition
    // says "top" or "bottom".
    let rowScaleLabels: HTMLElement | null = null;
    if (!isColumn && !rowCaptions && (assets?.minPlaceholder || assets?.maxPlaceholder)) {
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
    if ((isColumn ? !hasNumberPlaceholders : !rowCaptions) && (assets?.minPlaceholder || assets?.maxPlaceholder)) {
        // order="rtl" flips the list itself (rendered column-reverse),
        // so the end each label sits next to flips with it.
        const topText = order === 'ltr' ? assets?.minPlaceholder : assets?.maxPlaceholder;
        const bottomText = order === 'ltr' ? assets?.maxPlaceholder : assets?.minPlaceholder;
        const createBlockLabel = (text: string) => {
            const label = document.createElement('div');
            label.classList.add('magicfeedback-rating-number-scale-label-block');
            if (!isColumn) {
                label.classList.add('magicfeedback-rating-number-scale-label-block--stacked');
                // Inline, not a stylesheet rule: integrations that ship their
                // own copy of the CSS (MagicSurvey) never get one.
                label.style.display = 'none';
            }
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
        const inlineText = legacyText?.(i);
        input.setAttribute('aria-label', ownPlaceholder ? `${i} — ${ownPlaceholder}` : inlineText ? `${i} — ${inlineText}` : `${i}`);

        autoAdvanceOn(input, send);

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
        ratingNumber.textContent = inlineText ? `${i} = ${inlineText}` : i.toString();
        ratingNumber.classList.add('magicfeedback-rating-number-value-num');
        // Inline, not a stylesheet rule: integrations that ship their own copy
        // of the CSS (MagicSurvey) bold the number.
        if (legacy) ratingNumber.style.fontWeight = 'normal';
        ratingValue.appendChild(ratingNumber);

        if ((isColumn || rowCaptions) && ownPlaceholder) {
            // Column rows have room to show the option's own text plainly —
            // capsule row, not squeezed into a bead the way row mode is.
            // A captioned row gets it too, hidden, for when it stacks.
            const ratingText = document.createElement('span');
            ratingText.textContent = ownPlaceholder;
            ratingText.classList.add('magicfeedback-rating-number-value-label');
            if (!isColumn) ratingText.style.display = 'none';
            ratingValue.appendChild(ratingText);
        } else if (!isColumn && !rowCaptions && numberPlaceholders && numberPlaceholders[i]) {
            // Legacy row: no text per option, only a hoverable tooltip.
            containerLabel.title = numberPlaceholders[i];
        }

        containerLabel.appendChild(ratingValue);

        if (rowCaptions) {
            // The option becomes a column: its text, then the chip (or the
            // other way round). The text is a label for the same input, so
            // clicking it answers too. Options without text keep an empty
            // caption, so every chip still lines up.
            const caption = document.createElement('label');
            caption.htmlFor = input.id;
            caption.classList.add('magicfeedback-rating-number-option-caption');
            caption.textContent = ownPlaceholder || '';
            ratingOption.classList.add('magicfeedback-rating-number-option--captioned');
            ratingOption.classList.add(`magicfeedback-rating-number-option--caption-${captionPosition}`);
            // Inline, not a stylesheet rule: integrations that ship their own
            // copy of the CSS (MagicSurvey) lay the option out as a row.
            ratingOption.style.flexDirection = captionPosition === 'top' ? 'column' : 'column-reverse';
            ratingOption.style.justifyContent = 'flex-end';
            ratingOption.appendChild(caption);
        }

        ratingOption.appendChild(containerLabel);
        ratingNumberContainer.appendChild(ratingOption);
    }

    element.appendChild(ratingNumberContainer);

    // The "after" label always sits right after the container, so the
    // container + label-block spacing rule holds in a stacked row too.
    if (columnAfterLabel) element.appendChild(columnAfterLabel);
    if (rowScaleLabels) {
        const position = assets?.minMaxPlaceholderPosition;
        if (position === 'top' || position === 'bottom') {
            rowScaleLabels.classList.add(`magicfeedback-rating-number-scale-labels--${position}`);
            // Inline order: MagicSurvey's own CSS moves the caption above
            // the row with order -1, so the DOM position alone isn't enough.
            rowScaleLabels.style.order = position === 'top' ? '-1' : '1';
        }
        if (position === 'top') element.insertBefore(rowScaleLabels, ratingNumberContainer);
        else element.appendChild(rowScaleLabels);
    }

    if (!isColumn && !legacy) {
        stackRowWhenNarrow(element, ratingNumberContainer, maxRatingNumber - minRatingNumber + 1, order,
            rowCaptions ? RATING_NUMBER_MIN_CAPTIONED_WIDTH : RATING_NUMBER_MIN_CHIP_WIDTH);
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
        autoAdvanceOn(input, send);

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

export type RatingNumberOptions = {
    /** Render the pre-August (2.2.5) rating: see createRatingNumberElement. */
    legacy?: boolean;
    /** Window narrower than a tablet, decided by the caller at render time. */
    isPhone?: boolean;
};

/**
 * Club Matas keeps the pre-August rating: its surveys are recognised by a
 * product id that contains "matas" (MATAS_DEMO_GENERAL, ...).
 */
export function usesLegacyRatingNumber(productId?: string | null): boolean {
    return !!productId && /matas/i.test(productId);
}

/** The text 2.2.5 appended to an option on a phone ("10 = Very likely"). */
function legacyInlineText(assets: any): (value: number) => string | undefined {
    const max = assets?.max ? Number(assets.max) : 10;
    const min = assets?.min ? Number(assets.min) : 0;
    return (value) => assets?.numberPlaceholders?.[value]
        || (value === min ? assets?.minPlaceholder : undefined)
        || (value === max ? assets?.maxPlaceholder : undefined)
        || undefined;
}

/** Narrowest a row chip may get before the row stacks into a column. */
export const RATING_NUMBER_MIN_CHIP_WIDTH = 44;

/** The same for a chip with its own text above or below it. */
export const RATING_NUMBER_MIN_CAPTIONED_WIDTH = 72;

/**
 * A row that can't give every chip RATING_NUMBER_MIN_CHIP_WIDTH (an 11-point
 * NPS on a phone, a narrow pop-in) turns into the bare column layout, and
 * back when there is room again. It follows the width of the question
 * itself, not the window. Only classes and the flex direction change, so
 * the inputs, their order and a checked answer stay as they are.
 */
function stackRowWhenNarrow(
    element: HTMLElement,
    container: HTMLElement,
    optionCount: number,
    order: string,
    minChipWidth = RATING_NUMBER_MIN_CHIP_WIDTH,
) {
    if (typeof ResizeObserver === 'undefined') return;

    const isDense = container.classList.contains('magicfeedback-rating-number-container-row--dense');
    const isCaptioned = !!container.querySelector('.magicfeedback-rating-number-option--captioned');
    let rowGap = 0;
    let stacked = false;

    const setStacked = (stack: boolean) => {
        if (stack === stacked) return;
        stacked = stack;

        element.classList.toggle('magicfeedback-rating-number--stacked', stack);
        // Only one set of min/max labels is ever visible: the one-line
        // caption in a row, the above/below blocks in a stacked column.
        element.querySelectorAll<HTMLElement>(':scope > .magicfeedback-rating-number-scale-labels')
            .forEach((caption) => { caption.style.display = stack ? 'none' : ''; });
        element.querySelectorAll<HTMLElement>(':scope > .magicfeedback-rating-number-scale-label-block--stacked')
            .forEach((block) => { block.style.display = stack ? '' : 'none'; });
        container.classList.toggle('magicfeedback-rating-number-container-row', !stack);
        container.classList.toggle('magicfeedback-rating-number-container-row--dense', !stack && isDense);
        container.classList.toggle('magicfeedback-rating-number-container-column', stack);
        container.classList.toggle('magicfeedback-rating-number-container-column--bare', stack && !isCaptioned);
        container.style.flexDirection = stack
            ? (order === 'ltr' ? 'column' : 'column-reverse')
            : (order === 'ltr' ? 'row' : 'row-reverse');

        container.querySelectorAll<HTMLElement>(':scope > .magicfeedback-rating-number-option').forEach((option) => {
            option.classList.toggle('magicfeedback-rating-number-option-row', !stack);
            option.classList.toggle('magicfeedback-rating-number-option-column', stack);

            // A captioned row stacks like a column with text per option:
            // the text moves from above/below the chip into it.
            if (!option.classList.contains('magicfeedback-rating-number-option--captioned')) return;
            const top = option.classList.contains('magicfeedback-rating-number-option--caption-top');
            option.style.flexDirection = stack ? '' : (top ? 'column' : 'column-reverse');
            option.querySelectorAll<HTMLElement>('.magicfeedback-rating-number-option-caption')
                .forEach((caption) => { caption.style.display = stack ? 'none' : ''; });
            option.querySelectorAll<HTMLElement>('.magicfeedback-rating-number-value-label')
                .forEach((label) => { label.style.display = stack ? '' : 'none'; });
        });
    };

    // Stacking changes the element's height, which re-triggers the observer.
    // Switching inside the callback made the browser report "ResizeObserver
    // loop completed with undelivered notifications", so the switch waits for
    // the next frame and only a width change counts.
    const nextFrame = typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (callback: FrameRequestCallback) => { callback(0); return 0; };
    let lastWidth = 0;
    let pending = false;

    new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width;
        if (!width || width === lastWidth) return;
        lastWidth = width;

        if (pending) return;
        pending = true;
        nextFrame(() => {
            pending = false;
            // Read the gap while it is still a row: the column has its own.
            if (!stacked) rowGap = parseFloat(getComputedStyle(container).columnGap) || 0;
            const needed = optionCount * minChipWidth + (optionCount - 1) * rowGap;
            setStacked(lastWidth < needed);
        });
    }).observe(element);
}
