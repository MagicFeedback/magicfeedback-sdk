import {NativeQuestion} from "../models/types";
import {placeholder} from "./placeholder";

// Function to get the query params
const params = (a: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(a);
}

export function renderQuestions(
    appQuestions: NativeQuestion[],
    format: string = "standard",
    language: string = "en"
): HTMLElement[] {
    if (!appQuestions) throw new Error("[MagicFeedback] No questions provided");
    const questions: HTMLElement[] = [];

    appQuestions.forEach((question) => {

        if (question?.questionType?.conf?.length > 0) {
            let elementContainer: HTMLElement = document.createElement("div");
            elementContainer.classList.add("magicfeedback-div");
            question.questionType.conf.forEach((conf: any) => {
                conf.ref = question.ref
                if (typeof question.assets?.placeholder !== 'string' && question.assets?.placeholder[conf.id]) {
                    conf.assets = {
                        placeholder: question.assets?.placeholder[conf.id],
                    }
                }
            });
            const elements = renderQuestions(question.questionType.conf, format, language);
            elements.forEach((element) => {
                elementContainer.appendChild(element);
            });
            questions.push(elementContainer);
        } else {
            // Create a container for each question
            const elementContainer = renderContainer(question, format, language);
            questions.push(elementContainer);
        }
    });

    return questions;
}

function parseTitle(title: string, lang: string): string {
    return typeof title === "object" ? (title[lang] || title['en']) : title;
}

// Make a function to return a array with yes and no in every language
function getBooleanOptions(lang: string): string[] {
    switch (lang) {
        case "es":
            return ['Sí', 'No'];
        case "fr":
            return ['Oui', 'Non'];
        case "de":
            return ['Ja', 'Nein'];
        case "it":
            return ['Sì', 'No'];
        case "pt":
            return ['Sim', 'Não'];
        case "nl":
            return ['Ja', 'Nee'];
        case "pl":
            return ['Tak', 'Nie'];
        case "ru":
            return ['Да', 'Нет'];
        case "ja":
            return ['はい', 'いいえ'];
        case "zh":
            return ['是', '不'];
        case "ko":
            return ['예', '아니'];
        case 'da':
            return ['Ja', 'Nej'];
        case 'fi':
            return ['Kyllä', 'Ei'];
        case 'sv':
            return ['Ja', 'Nej'];
        case 'no':
            return ['Ja', 'Nei'];
        case 'ar':
            return ['نعم', 'لا'];
        default:
            return ['Yes', 'No'];

    }
}

function renderContainer(
    question: NativeQuestion,
    format: string,
    language: string
): HTMLElement {
    const {
        id,
        title,
        type,
        ref,
        require,
        //external_id,
        value,
        defaultValue,
        // questionType,
        assets
    } = question;

    let element: HTMLElement;
    let elementTypeClass: string;

    let elementContainer: HTMLElement = document.createElement("div");
    elementContainer.classList.add("magicfeedback-div");

    const placeholderText = format === 'slim' ? parseTitle(title, language) : assets?.placeholder

    // Look if exist the value in a query param with the ref like a key
    const urlParamValue = params(id);

    switch (type) {
        case "TEXT":
            // Create a text input field
            element = document.createElement("input");
            (element as HTMLInputElement).type = "text";
            (element as HTMLInputElement).placeholder = placeholderText || placeholder.answer(language || 'en')

            ;
            elementTypeClass = "magicfeedback-text";
            break;
        case "LONGTEXT":
            // Create a textarea element for TEXT and LONGTEXT types
            element = document.createElement("textarea");
            (element as HTMLTextAreaElement).rows = 3; // Set the number of rows based on the type
            (element as HTMLInputElement).placeholder = placeholderText || placeholder.answer(language || 'en');
            elementTypeClass = "magicfeedback-longtext";
            break;
        case "NUMBER":
            // Create an input element with type "number" for NUMBER type
            element = document.createElement("input");
            (element as HTMLInputElement).type = "number";
            (element as HTMLInputElement).placeholder = placeholderText || placeholder.number(language || 'en');
            elementTypeClass = "magicfeedback-number";

            if (value.length) {
                value.sort((a: string, b: string) => Number(a) - Number(b));
                (element as HTMLInputElement).max = value[value.length - 1];
                (element as HTMLInputElement).min = value[0];
                (element as HTMLInputElement).value = value[0];
            }
            break;
        case "RADIO":
        case "MULTIPLECHOICE":
            element = document.createElement("div");

            elementTypeClass =
                `magicfeedback-${(type === "MULTIPLECHOICE" ? "checkbox" : "radio")}`;

            value.forEach((option, index) => {
                const container = document.createElement("div");
                container.classList.add(
                    `magicfeedback-${type === "MULTIPLECHOICE" ? "checkbox" : "radio"}-container`
                );
                const label = document.createElement("label");
                const input = document.createElement("input");
                input.id = `rating-${ref}-${index}`;
                input.type = type === "MULTIPLECHOICE" ? "checkbox" : "radio";
                input.name = ref;
                input.value = option;
                input.classList.add(elementTypeClass);
                input.classList.add("magicfeedback-input");

                if (option === defaultValue || option === urlParamValue) {
                    input.checked = true;
                }

                label.textContent = option;
                label.htmlFor = `rating-${ref}-${index}`;

                container.appendChild(input);
                container.appendChild(label);
                element.appendChild(container);
            });
            break;
        case "BOOLEAN":
            // Create an input element with type "checkbox" for BOOLEAN type with option yes or no
            element = document.createElement("div");
            elementTypeClass = 'magicfeedback-radio';

            const booleanContainer = document.createElement('div');
            booleanContainer.classList.add('magicfeedback-boolean-container');
            booleanContainer.style.display = "flex";
            booleanContainer.style.flexDirection = "row";
            booleanContainer.style.justifyContent = "space-between";
            booleanContainer.style.width = "70%";
            booleanContainer.style.margin = "auto";

            const booleanOptions = assets.addIcon ? ['✓', '✗'] : getBooleanOptions(language);

            // Create a input button element for each value in the question's value array
            booleanOptions.forEach((option, index) => {
                const container = document.createElement("label");
                container.classList.add("magicfeedback-boolean-option");
                container.htmlFor = `rating-${ref}-${index}`;
                container.style.cursor = "pointer";
                container.style.border = "1px solid #000";
                container.style.display = "flex";
                container.style.justifyContent = "center";
                container.style.alignItems = "center";
                container.style.margin = "auto";
                container.style.padding = "0";
                container.style.width = "45%";
                container.style.height = "38px";


                const label = document.createElement("label");
                label.htmlFor = `rating-${ref}-${index}`;
                label.textContent = option;
                label.style.margin = "0";
                label.style.padding = "0";

                const input = document.createElement("input");
                input.id = `rating-${ref}-${index}`;
                input.type = "radio";
                input.name = ref;
                input.value = option;
                input.classList.add(elementTypeClass);
                input.classList.add("magicfeedback-input");
                input.style.position = "absolute";
                input.style.opacity = "0";
                input.style.width = "0";
                input.style.height = "0";
                input.style.margin = "0";

                container.appendChild(input);
                container.appendChild(label);
                booleanContainer.appendChild(container);
            });

            element.appendChild(booleanContainer);
            break;
        case 'RATING_EMOJI':
            element = document.createElement("div");
            elementTypeClass = 'magicfeedback-rating';

            const ratingContainer = document.createElement('div');
            ratingContainer.classList.add('magicfeedback-rating-container');

            const maxRating = value.length ? Number(value[value.length - 1]) : 5;
            const minRating = value.length ? Number(value[0]) : 1;

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
                if (maxRating === 5) {
                    switch (i) {
                        case 1:
                            ratingImage.src = "https://magicfeedback-c6458-dev.web.app/assets/1.svg";
                            break;
                        case 2:
                            ratingImage.src = "https://magicfeedback-c6458-dev.web.app/assets/2.svg";
                            break;
                        case 3:
                            ratingImage.src = "https://magicfeedback-c6458-dev.web.app/assets/6.svg";
                            break;
                        case 4:
                            ratingImage.src = "https://magicfeedback-c6458-dev.web.app/assets/9.svg";
                            break;
                        case 5:
                            ratingImage.src = "https://magicfeedback-c6458-dev.web.app/assets/10.svg";
                            break;
                    }
                } else {
                    ratingImage.src = `https://magicfeedback-c6458-dev.web.app/assets/${i}.svg`;
                }

                ratingImage.alt = `face-${ref}-${i}`;
                // ratingImage is used to set the form value
                // ... add the code to set the value here

                ratingImage.className = `rating-image${i}`;

                const input = document.createElement("input");
                input.id = `rating-${ref}-${i}`;
                input.type = "radio";
                input.name = ref;
                input.value = i.toString();
                input.classList.add(elementTypeClass);
                input.classList.add("magicfeedback-input");

                containerLabel.appendChild(input);
                containerLabel.appendChild(ratingImage);
                containerLabel.appendChild(ratingLabel);

                ratingOption.appendChild(containerLabel);
                ratingContainer.appendChild(ratingOption);
            }

            element.appendChild(ratingContainer);
            break;
        case 'RATING_NUMBER':
            element = document.createElement("div");
            elementTypeClass = 'magicfeedback-rating-number';

            const ratingNumberContainer = document.createElement('div');
            ratingNumberContainer.classList.add('magicfeedback-rating-number-container');

            const maxRatingNumber = value.length ? Number(value[value.length - 1]) : 5;
            const minRatingNumber = value.length ? Number(value[0]) : 1;

            for (let i = minRatingNumber; i <= maxRatingNumber; i++) {
                // Create a input button element for each value in the question's value array
                const ratingOption = document.createElement('div');
                ratingOption.classList.add('magicfeedback-rating-number-option');

                const containerLabel = document.createElement('label');
                containerLabel.htmlFor = `rating-${ref}-${i}`;
                containerLabel.classList.add('magicfeedback-rating-number-option-label-container');

                const ratingLabel = document.createElement('label');
                ratingLabel.htmlFor = `rating-${ref}-${i}`;
                ratingLabel.textContent = i.toString();

                const input = document.createElement("input");
                input.id = `rating-${ref}-${i}`;
                input.type = "radio";
                input.name = ref;
                input.value = i.toString();
                input.classList.add(elementTypeClass);
                input.classList.add("magicfeedback-input");

                containerLabel.appendChild(input);
                containerLabel.appendChild(ratingLabel);
                ratingOption.appendChild(containerLabel);
                ratingNumberContainer.appendChild(ratingOption);
            }

            element.appendChild(ratingNumberContainer);

            break;
        case 'RATING_STAR':
            element = document.createElement("div");
            elementTypeClass = 'magicfeedback-rating-star';

            const ratingStarContainer = createStarRating(ref);

            element.appendChild(ratingStarContainer);
            break;

        case 'MULTIPLECHOISE_IMAGE':
            element = document.createElement("div");
            elementTypeClass = 'magicfeedback-multiple-choice-image';

            // Display de items inside a flex container if only have one item display it as a single image in the center, if have 2 items display them as a row, if have more than 2 items display them as a grid, if have 4 items display them as a 2x2 grid and if have 6 items display them as a 3x2 grid
            const multipleChoiceImageContainer = document.createElement("div");
            multipleChoiceImageContainer.classList.add("magicfeedback-multiple-choice-image-container");
            multipleChoiceImageContainer.style.display = "flex";
            multipleChoiceImageContainer.style.flexDirection = "row";
            multipleChoiceImageContainer.style.flexWrap = "wrap";
            multipleChoiceImageContainer.style.justifyContent = "center";


            const maxItems = value.length;
            let itemsPerRow = 1;
            let itemsPerColumn = 1;

            switch (maxItems) {
                case 1:
                case 2:
                case 3:
                    itemsPerRow = maxItems;
                    itemsPerColumn = 1;
                    break;
                case 4:
                case 5:
                case 6:
                    itemsPerColumn = 2;
                    itemsPerRow = Math.ceil(maxItems / 2);
                    break;
                default:
                    itemsPerColumn = 3;
                    itemsPerRow = Math.ceil(maxItems / 3);
                    break;
            }

            const useLabel = assets?.addTitle === undefined ? false : assets.addTitle;
            const multiOptions = assets?.multiOption === undefined ? false : assets.multiOption;

            // The image is the only input but can have a title
            value.forEach((option) => {
                try {
                    const {position, url, value} = JSON.parse(option);

                    const container = document.createElement("label");
                    container.classList.add("magicfeedback-multiple-choice-image-option");
                    container.style.width = `calc( ${100 / itemsPerRow}% - 10px)`;
                    container.style.height = `calc( ${100 / itemsPerColumn}% - 10px)`;
                    container.style.margin = "5px";

                    const containerLabel = document.createElement('label');
                    containerLabel.htmlFor = `rating-${ref}-${position}`;
                    containerLabel.classList.add('magicfeedback-image-option-label-container');
                    containerLabel.style.display = "flex";
                    containerLabel.style.flexDirection = "column";

                    // Add a effect on hover and on select
                    containerLabel.addEventListener("mouseover", () => {
                        containerLabel.style.border = "2px solid #000";
                    });
                    containerLabel.addEventListener("mouseout", () => {
                        containerLabel.style.border = "none";
                    });
                    containerLabel.addEventListener("click", () => {
                        containerLabel.style.border = "2px solid #000";
                    });


                    const label = document.createElement("label");
                    label.textContent = value;
                    label.classList.add("magicfeedback-multiple-choice-image-label");

                    const input = document.createElement("input");
                    input.id = `rating-${ref}-${position}`;
                    input.type = multiOptions ? "checkbox" : "radio";
                    input.name = ref;
                    input.value = value;
                    input.style.position = "absolute";
                    input.style.opacity = "0";
                    input.style.width = "0";
                    input.style.height = "0";
                    input.classList.add("magicfeedback-input");

                    // Add max size to the image
                    const image = document.createElement("img");
                    image.classList.add("magicfeedback-multiple-choice-image-image");
                    image.src = url;
                    image.style.cursor = "pointer";
                    image.style.backgroundSize = "cover";
                    image.style.width = "100%";
                    image.style.height = "100%";
                    image.style.margin = "auto";

                    containerLabel.appendChild(input);
                    containerLabel.appendChild(image);
                    if (useLabel) containerLabel.appendChild(label);
                    container.appendChild(containerLabel);
                    multipleChoiceImageContainer.appendChild(container);

                } catch (e) {
                    console.error(e);
                }
            });

            element.appendChild(multipleChoiceImageContainer);
            break;
        case "SELECT":
            // Create a select element for RADIO and MULTIPLECHOICE types
            element = document.createElement("select");
            elementTypeClass = "magicfeedback-select";

            // Create an option <option value="" disabled selected hidden>Please Choose...</option>
            const option = document.createElement("option");
            option.value = "";
            option.text = format === 'slim' ? parseTitle(title, language) : (defaultValue || "Select an option");
            option.disabled = true;
            option.selected = true;
            (element as HTMLSelectElement).appendChild(option);

            value.forEach((optionValue) => {
                // Create an option element for each value in the question's value array
                const option = document.createElement("option");
                option.value = optionValue;
                option.text = optionValue;
                (element as HTMLSelectElement).appendChild(option);
            });
            break;
        case "DATE":
            // Create an input element with type "date" for DATE type
            element = document.createElement("input");
            (element as HTMLInputElement).type = "date";
            (element as HTMLInputElement).required = require;
            (element as HTMLInputElement).placeholder = placeholderText || placeholder.date(language || 'en');
            elementTypeClass = "magicfeedback-date";
            break;
        case "CONSENT":
            // Create an input element with type "checkbox" for BOOLEAN type
            element = document.createElement("input");
            elementTypeClass = "magicfeedback-consent";

            (element as HTMLInputElement).type = "checkbox";
            element.id = `magicfeedback-${id}`;
            (element as HTMLInputElement).name = ref;
            (element as HTMLInputElement).value = "true";
            (element as HTMLInputElement).required = require;
            element.classList.add("magicfeedback-consent");
            element.classList.add("magicfeedback-input");
            break;
        case "EMAIL":
            // Create an input element with type "email" for EMAIL type
            element = document.createElement("input");
            (element as HTMLInputElement).type = "email";
            (element as HTMLInputElement).required = require;
            (element as HTMLInputElement).placeholder = placeholderText || "you@example.com";
            elementTypeClass = "magicfeedback-email";
            break;
        case "PASSWORD":
            // Create an input element with type "password" for PASSWORD type
            element = document.createElement("input");
            (element as HTMLInputElement).type = "password";
            (element as HTMLInputElement).required = require;
            (element as HTMLInputElement).placeholder = placeholderText || placeholder.password(language || 'en');
            elementTypeClass = "magicfeedback-password";
            break;
        default:
            return elementContainer;
    }


    element.id = `magicfeedback-${id}`;
    element.setAttribute("name", ref);
    element.classList.add(elementTypeClass);

    if (defaultValue !== undefined || urlParamValue !== null) {
        (element as HTMLInputElement).value = urlParamValue || defaultValue;
    }

    if (!["RADIO", "MULTIPLECHOICE"].includes(type)) {
        element.classList.add("magicfeedback-input");
        (element as HTMLInputElement).required = require;
    }

    // Add the label and input element to the form
    const label = document.createElement("label");
    label.setAttribute("for", `magicfeedback-${id}`);
    label.textContent = parseTitle(title, language);
    label.classList.add("magicfeedback-label");

    if (["CONSENT"].includes(type)) {
        elementContainer.classList.add("magicfeedback-consent-container");
        elementContainer.appendChild(element);
        elementContainer.appendChild(label);
    } else {
        if (format !== 'slim') {
            elementContainer.appendChild(label);
            if (assets?.general !== undefined && assets?.general !== "") {
                // Add a image to the form
                const image = document.createElement("img");
                image.src = assets.general;
                image.classList.add("magicfeedback-image");
                // Add a max default width to the image
                image.style.maxWidth = "auto";
                image.style.height = "400px";
                image.style.margin = "10px 0";

                elementContainer.appendChild(image);
            }
        }
        elementContainer.appendChild(element);
    }

    return elementContainer;
}

export function renderActions(identity: string = '',
                              backAction: () => void,
                              sendButtonText: string = "Submit",
                              backButtonText: string = "Back",
                              nextButtonText: string = "Next"
): HTMLElement {
    const actionContainer = document.createElement("div");
    actionContainer.classList.add("magicfeedback-action-container");

    // Create a submit button if specified in options
    const submitButton = document.createElement("button");
    submitButton.id = "magicfeedback-submit";
    submitButton.type = "submit";
    submitButton.classList.add("magicfeedback-submit");
    submitButton.textContent = identity === 'MAGICSURVEY' ? (nextButtonText || "Next") : (sendButtonText || "Submit")

    // Create a back button
    const backButton = document.createElement("button");
    backButton.id = "magicfeedback-back";
    backButton.type = "button";
    backButton.classList.add("magicfeedback-back");
    backButton.textContent = backButtonText || "Back";
    backButton.addEventListener("click", backAction);

    if (identity === 'MAGICSURVEY') {
        actionContainer.appendChild(backButton);
    }

    actionContainer.appendChild(submitButton);

    return actionContainer;
}

function createStarRating(ref: string) {
    const size = 40;
    const selectedClass = "magicfeedback-rating-star-selected";
    const starFilled = "★";

    const ratingContainer = document.createElement("div");
    ratingContainer.classList.add("magicfeedback-rating-star-container");

    for (let i = 1; i <= 5; i++) {
        const ratingOption = document.createElement("label");
        ratingOption.classList.add("magicfeedback-rating-star-option");

        // Create hidden radio input
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

        // Update filled stars on radio input change
        ratingInput.addEventListener("change", () => {
            const allStars = ratingContainer.querySelectorAll(".rating__star");

            for (let j = 0; j < allStars.length; j++) {
                // String to number
                if (j + 1 <= Number(ratingInput.value)) {
                    if (!allStars[j].classList.contains(selectedClass)) allStars[j].classList.add(selectedClass);
                } else {
                    if (allStars[j].classList.contains(selectedClass)) allStars[j].classList.remove(selectedClass);
                }
            }
        });

        ratingOption.appendChild(ratingInput);

        // Create star element (after for better positioning)
        const starElement = document.createElement("label");
        starElement.htmlFor = `rating-${ref}-${i}`;
        starElement.classList.add("rating__star");
        starElement.textContent = starFilled;
        starElement.style.fontSize = `${size}px`; // Set star size
        starElement.style.color = "#CCCCCC"; // Set star color
        starElement.style.cursor = "pointer";
        // Add hover effect
        ratingOption.appendChild(starElement);


        ratingContainer.appendChild(ratingOption);
    }

    return ratingContainer;
}

export function renderError(error: string): HTMLElement {
    const errorElement = document.createElement("div");
    errorElement.classList.add("magicfeedback-error");
    errorElement.textContent = error;
    return errorElement;
}

export function renderSuccess(success: string): HTMLElement {
    const successElement = document.createElement("div");
    successElement.classList.add("magicfeedback-success");
    successElement.textContent = success;
    return successElement;
}
