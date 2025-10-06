import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../models/types";
import {placeholder} from "./placeholder";

// Function to get the query params
const params = (a: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(a);
}

const defaultUrl = `https://survey-dev.magicfeedback.io/assets/emojis`;

export function renderQuestions(
    appQuestions: NativeQuestion[],
    format: string = "standard",
    language: string = "en",
    product: any = {customIcons: false},
    send?: () => void
): HTMLElement[] {
    if (!appQuestions) throw new Error("[MagicFeedback] No questions provided");
    const questions: HTMLElement[] = [];
    const {customIcons, id} = product;

    appQuestions.forEach((question) => {

        if (question?.questionType?.conf?.length > 0) {
            let elementContainer: HTMLElement = document.createElement("div");
            elementContainer.classList.add("magicfeedback-div");

            const label = document.createElement("label");
            label.setAttribute("for", `magicfeedback-${question.id}`);
            label.textContent = parseTitle(question.title, language);
            label.classList.add("magicfeedback-label");
            elementContainer.appendChild(label);

            question.questionType.conf.forEach((conf: any) => {
                conf.ref = question.ref
                if (question.assets[conf.id]) {
                    conf.assets = {
                        placeholder: question.assets[conf.id],
                    }
                }
            });
            const elements = renderQuestions(question.questionType.conf, format, language, product, send);
            elements.forEach((element) => {
                elementContainer.appendChild(element);
            });
            questions.push(elementContainer);
        } else {
            // Create a container for each question
            const url = `${defaultUrl}${customIcons ? `/${id}` : ''}`;
            const elementContainer = renderContainer(question, format, language, url, appQuestions.length === 1 ? send : undefined);
            questions.push(elementContainer);
        }
    });

    return questions;
}

function parseTitle(title: string, lang: string): string {
    if (!title) return '';
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
        case 'bn':
            return ['হ্যাঁ', 'না'];
        default:
            return ['Yes', 'No'];

    }
}

function renderContainer(
    question: NativeQuestion,
    format: string,
    language: string,
    url: string,
    send?: () => void
): HTMLElement {
    let {
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

    const isPhone = window.innerWidth < 600;

    const placeholderText = format === 'slim' ? parseTitle(title, language) : assets?.placeholder

    // Look if exist the value in a query param with the ref like a key
    const urlParamValue = params(id);

    const maxCharacters = assets?.maxCharacters || 0
    const randomPosition = assets?.randomPosition === undefined ? false : assets?.randomPosition;
    const direction = assets?.direction || "row";
    const order = assets?.order || "ltr";

    switch (type) {
        case FEEDBACKAPPANSWERTYPE.TEXT:
            // Create a text input field
            element = document.createElement("input");
            (element as HTMLInputElement).type = "text";
            (element as HTMLInputElement).placeholder = placeholderText || placeholder.answer(language || 'en');
            // Control on press enter
            (element as HTMLInputElement).addEventListener("keyup", (event) => {
                event.preventDefault();
                console.log(event.key, event)
                if (event.key === "Enter") {
                    if (send) send();
                }
            });
            elementTypeClass = "magicfeedback-text";
            break;
        case FEEDBACKAPPANSWERTYPE.LONGTEXT:
            // Create a textarea element for TEXT and LONGTEXT types
            element = document.createElement("textarea");
            (element as HTMLTextAreaElement).rows = 3; // Set the number of rows based on the type
            if (maxCharacters > 0) (element as HTMLTextAreaElement).maxLength = maxCharacters; // Set the max length of the text area
            (element as HTMLInputElement).placeholder = placeholderText || placeholder.answer(language || 'en');
            elementTypeClass = "magicfeedback-longtext";
            break;
        case FEEDBACKAPPANSWERTYPE.NUMBER:
            // Create an input element with type "number" for NUMBER type
            element = document.createElement("input");
            (element as HTMLInputElement).type = "number";
            (element as HTMLInputElement).placeholder = format === 'slim' ? parseTitle(title, language) : placeholder.number(language || 'en');
            elementTypeClass = "magicfeedback-number";

            if (value.length) {
                value.sort((a: string, b: string) => Number(a) - Number(b));
                (element as HTMLInputElement).max = value[value.length - 1];
                (element as HTMLInputElement).min = value[0];
                (element as HTMLInputElement).value = value[0];
            }
            break;
        case FEEDBACKAPPANSWERTYPE.RADIO:
        case FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE:
            element = document.createElement("div");

            elementTypeClass =
                `magicfeedback-${(type === "MULTIPLECHOICE" ? "checkbox" : "radio")}`;

            let opt = value || [];

            // reorder the options if randomPosition is true
            if (randomPosition) {
                opt = opt.sort(() => Math.random() - 0.5);
            }

            let exclusiveAnswers: string[] = assets?.exclusiveAnswers || [];

            // Fix: excluir la opción extraOptionText de la lista de exclusivas si por error viene incluida desde backend/state
            if (assets?.extraOption) {
                exclusiveAnswers = exclusiveAnswers.filter(a => a !== assets.extraOptionText);
            }

            if (exclusiveAnswers.length > 0) {
                exclusiveAnswers?.forEach((answer) => {
                    if (!opt.includes(answer)) opt.push(answer);
                });
            }

            if (assets?.extraOption && !opt.includes(assets?.extraOptionText)) {
                opt.push(assets?.extraOptionText);
            }

            opt.forEach((option, index) => {
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

                if (type === FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE && assets?.maxOptions && assets?.maxOptions > 0) {
                    input.addEventListener("change", () => {
                        const checkboxes = document.querySelectorAll(`input[name="${ref}"]:checked`);
                        if (checkboxes.length > assets?.maxOptions) {
                            (input as HTMLInputElement).checked = false;
                        }

                        //TODO: Enable in the future with a setting variable to send the answer when reach the max options selected
                        /**
                         if (send && checkboxes.length === assets?.maxOptions && !(assets?.extraOptionText && option === assets?.extraOptionText)) {
                         send()
                         }
                         **/
                    });
                }

                if (type === FEEDBACKAPPANSWERTYPE.RADIO && send) {
                    if (!assets?.extraOptionText || assets?.extraOptionText && option !== assets?.extraOptionText)
                        input.addEventListener("change", () => {
                            send()
                        });
                }


                if (option === defaultValue || option === urlParamValue) {
                    input.checked = true;
                }

                label.textContent = option;
                label.htmlFor = `rating-${ref}-${index}`;


                input.addEventListener("change", (event) => {
                    const extraOption = document.getElementById(`extra-option-${ref}`);
                    if ((event.target as HTMLInputElement).checked && exclusiveAnswers.includes(option)) {
                        console.log('exclusiveAnswers', exclusiveAnswers, option)
                        opt.forEach((answer) => {
                            if (answer !== option) {
                                const input = document.querySelector(`input[value="${answer}"]`) as HTMLInputElement;
                                input.checked = false;
                            }
                        });
                        if (extraOption) extraOption.style.display = "none";
                    } else {
                        // Remove the checke of the exclusiveAnswers
                        exclusiveAnswers.forEach((answer) => {
                            if (answer !== option) {
                                const input = document.querySelector(`input[value="${answer}"]`) as HTMLInputElement;
                                input.checked = false;
                            }
                        });
                        // if (extraOption) extraOption.style.display = assets?.extraOption && option === assets?.extraOptionText ? "block" : "none";
                    }
                    if (assets?.extraOption && option === assets?.extraOptionText && extraOption)
                        // SI al opcion con value assets?.extraOptionText esta seleccionada mostrar el input text si no ocultarlo
                        extraOption.style.display = (event.target as HTMLInputElement).checked ? "block" : "none";
                });


                container.appendChild(input);
                container.appendChild(label);
                element.appendChild(container);

                // If is assets.extraOptionText add a input text after the label to add a custom value available only if is selected
                if (assets?.extraOption && option === assets?.extraOptionText) {
                    const inputText = document.createElement("input");
                    inputText.type = "text";
                    inputText.placeholder = assets?.extraOptionPlaceholder || placeholder.answer(language || 'en')
                    inputText.classList.add("magicfeedback-extra-option");
                    inputText.classList.add("magicfeedback-input");
                    inputText.id = `extra-option-${ref}`;
                    inputText.name = `extra-option-${ref}`;
                    inputText.style.display = "none";

                    element.appendChild(inputText);
                }
            });
            break;
        case FEEDBACKAPPANSWERTYPE.BOOLEAN:
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

            const booleanOptions = assets?.addIcon ? ['👍', '👎'] : getBooleanOptions(language);

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
                input.value = ['Yes', 'No'][index];
                input.classList.add(elementTypeClass);
                input.classList.add("magicfeedback-input");
                input.style.position = "absolute";
                input.style.opacity = "0";
                input.style.width = "0";
                input.style.height = "0";
                input.style.margin = "0";

                input.addEventListener("change", () => {
                    if (send) send();
                });

                container.appendChild(input);
                container.appendChild(label);
                booleanContainer.appendChild(container);
            });

            element.appendChild(booleanContainer);
            break;
        case FEEDBACKAPPANSWERTYPE.RATING_EMOJI:
            element = document.createElement("div");
            elementTypeClass = 'magicfeedback-rating';

            const ratingContainer = document.createElement('div');
            ratingContainer.classList.add('magicfeedback-rating-container');

            const maxRating = assets?.max ? Number(assets?.max) : 5;
            const minRating = assets?.min ? Number(assets?.min) : 1;

            const ratingPlaceholder = createRatingPlaceholder(
                minRating,
                maxRating,
                assets?.minPlaceholder,
                assets?.maxPlaceholder,
                assets?.extraOption,
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
                    ratingImage.onerror = () => ratingImage.src = `${defaultUrl}/${i}.svg`;
                } else if (minRating === 1 && maxRating === 5) {
                    switch (i) {
                        case 1:
                            ratingImage.src = `${url}/1.svg`;

                            ratingImage.onerror = () => ratingImage.src = `${defaultUrl}/1.svg`;
                            break;
                        case 2:
                            ratingImage.src = `${url}/2.svg`;
                            ratingImage.onerror = () => ratingImage.src = `${defaultUrl}/2.svg`;
                            break;
                        case 3:
                            ratingImage.src = `${url}/6.svg`;
                            ratingImage.onerror = () => ratingImage.src = `${defaultUrl}/6.svg`;
                            break;
                        case 4:
                            ratingImage.src = `${url}/9.svg`;
                            ratingImage.onerror = () => ratingImage.src = `${defaultUrl}/9.svg`;
                            break;
                        case 5:
                            ratingImage.src = `${url}/10.svg`;
                            ratingImage.onerror = () => ratingImage.src = `${defaultUrl}/10.svg`;
                            break;
                    }
                } else {
                    const ratingNum = Math.round((i - minRating) * (10 / (maxRating - minRating)));
                    ratingImage.src = `${url}/${ratingNum}.svg`;
                    ratingImage.onerror = () => ratingImage.src = `${defaultUrl}/${ratingNum}.svg`;
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

                // Add a question mark icon to the extra option
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
            break;
        case FEEDBACKAPPANSWERTYPE.RATING_NUMBER:
            elementTypeClass = 'magicfeedback-rating-number';
            element = createRatingNumberElement(ref, assets, order, direction, isPhone, elementTypeClass, send);
            break;
        case FEEDBACKAPPANSWERTYPE.RATING_STAR:
            element = document.createElement("div");
            elementTypeClass = 'magicfeedback-rating-star';

            const ratingStarContainer = createStarRating(ref, assets?.minPlaceholder, assets?.maxPlaceholder, send);

            element.appendChild(ratingStarContainer);
            break;
        case FEEDBACKAPPANSWERTYPE.MULTIPLECHOISE_IMAGE:
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

            if (window.innerWidth < 600) {
                itemsPerRow = 1;
                itemsPerColumn = maxItems;
            } else {
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
                        itemsPerRow = Math.ceil(maxItems / itemsPerColumn);
                        break;
                    case 7:
                    case 8:
                    case 9:
                        itemsPerColumn = 3;
                        itemsPerRow = Math.ceil(maxItems / itemsPerColumn);
                        break;
                    default:
                        itemsPerColumn = 4;
                        itemsPerRow = Math.ceil(maxItems / itemsPerColumn);
                        break;
                }
            }

            const useLabel = assets?.addTitle === undefined ? false : assets?.addTitle;
            const multiOptions = assets?.multiOption === undefined ? false : assets?.multiOption;
            const extraOption = assets?.extraOption === undefined ? false : assets?.extraOption;


            // reorder the options if randomPosition is true
            if (randomPosition) {
                value = value.sort(() => Math.random() - 0.5);
            }

        function generateOption(option: any) {
            try {
                const {position, url, value} = option;

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

                console.log('send', send)
                console.log('multiOptions', multiOptions)
                if (!multiOptions && send) {
                    input.addEventListener("change", () => {
                        console.log('send')
                        send();
                    });
                }

                // Add max size to the image
                const image = document.createElement("img");
                image.classList.add("magicfeedback-multiple-choice-image-image");
                image.src = url;
                image.style.cursor = "pointer";
                image.style.backgroundSize = "cover";
                image.style.backgroundPosition = "center";
                image.style.width = "100%";
                image.style.height = "100%";
                image.style.objectFit = "cover";
                image.style.margin = "auto";

                containerLabel.appendChild(input);
                containerLabel.appendChild(image);
                if (useLabel) containerLabel.appendChild(label);
                container.appendChild(containerLabel);
                multipleChoiceImageContainer.appendChild(container);

            } catch (e) {
                console.error(e);
            }
        }

            // The image is the only input but can have a title
            value.forEach((option) => generateOption(JSON.parse(option)));

            if (extraOption && assets?.extraOptionValue && assets?.extraOptionValue.length > 0) {
                generateOption(assets?.extraOptionValue[0])
            }

            element.appendChild(multipleChoiceImageContainer);
            break;
        case FEEDBACKAPPANSWERTYPE.SELECT:
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

            if (send) {
                element.addEventListener("change", () => {
                    send();
                });
            }
            break;
        case FEEDBACKAPPANSWERTYPE.DATE:
            // Create an input element with type "date" for DATE type
            element = document.createElement("input");
            (element as HTMLInputElement).type = "date";
            (element as HTMLInputElement).required = require;
            (element as HTMLInputElement).placeholder = placeholderText || placeholder.date(language || 'en');
            elementTypeClass = "magicfeedback-date";
            break;
        case FEEDBACKAPPANSWERTYPE.CONSENT:
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

            if (send) {
                element.addEventListener("change", () => {
                    send();
                });
            }
            break;
        case FEEDBACKAPPANSWERTYPE.EMAIL:
            // Create an input element with type "email" for EMAIL type
            element = document.createElement("input");
            (element as HTMLInputElement).type = "email";
            (element as HTMLInputElement).required = require;
            (element as HTMLInputElement).placeholder = placeholderText || "you@example.com";
            elementTypeClass = "magicfeedback-email";
            break;
        case FEEDBACKAPPANSWERTYPE.PASSWORD:
            // Create an input element with type "password" for PASSWORD type
            element = document.createElement("input");
            (element as HTMLInputElement).type = "password";
            (element as HTMLInputElement).required = require;
            (element as HTMLInputElement).placeholder = placeholderText || placeholder.password(language || 'en');
            elementTypeClass = "magicfeedback-password";
            break;
        case FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX:
            element = document.createElement("div");
            elementTypeClass = "magicfeedback-multi-question-matrix";

            const matrixContainer = document.createElement("div");
            matrixContainer.classList.add("magicfeedback-multi-question-matrix-container");

            let options = assets?.options || [];
            let values = [...value];
            let exclusiveValues: string[] = [];

            if (randomPosition) {
                options = options?.sort(() => Math.random() - 0.5);
                values = [...values].sort(() => Math.random() - 0.5);
            }

            if (assets?.exclusiveAnswers) {
                exclusiveValues = assets?.exclusiveAnswers
                exclusiveValues?.forEach((answer) => {
                    if (!values.includes(answer)) values.push(answer);
                });
            }

            if (window.innerWidth < 600) {
                const list = document.createElement("div");
                list.classList.add("magicfeedback-multi-question-matrix-list");

                // Add the questions as rows
                options?.forEach((question: string) => {
                    const row = document.createElement("div");
                    row.classList.add("magicfeedback-multi-question-matrix-list-item");
                    row.style.display = "flex";
                    row.style.flexDirection = "column";
                    row.style.alignItems = "flex-start";
                    row.style.marginBottom = "10px";
                    // Add the question label as the first cell
                    const label = document.createElement("label");
                    label.classList.add("magicfeedback-multi-question-matrix-label");
                    label.style.paddingBottom = "10px";
                    label.textContent = question;
                    row.appendChild(label);

                    // Add the options as radio buttons, one by line
                    values.forEach((option) => {
                        const container = document.createElement("div");
                        container.classList.add(`magicfeedback-radio-container`);
                        container.style.display = "flex";
                        container.style.alignItems = "center";
                        container.style.justifyContent = "flex-start";
                        container.style.width = "99%";
                        container.style.margin = "5px auto";


                        const label = document.createElement("label");
                        const input = document.createElement("input");
                        input.id = `${ref}-${question}-${option}`;
                        input.type = "radio";
                        input.name = `${ref}-${question}`;
                        input.value = option;
                        input.classList.add("magicfeedback-input");

                        label.textContent = option;
                        label.htmlFor = `${ref}-${question}-${option}`;
                        container.appendChild(input);
                        container.appendChild(label);
                        row.appendChild(container);
                    });

                    list.appendChild(row);

                });

                matrixContainer.appendChild(list);
            } else {
                //The matrix have a table format with the questions in the rows and the options in the columns, all the options have a title in the header of the column and is posssioble select moere than one option per question
                const table = document.createElement("table");
                table.classList.add("magicfeedback-multi-question-matrix-table");

                // Create the header of the table
                const header = document.createElement("thead");
                header.classList.add("magicfeedback-multi-question-matrix-header");
                header.style.paddingBottom = "15px";
                const headerRow = document.createElement("tr");

                // Add an empty cell for the question column
                const emptyHeaderCell = document.createElement("th");
                headerRow.appendChild(emptyHeaderCell);

                // Add the options as column headers
                values.forEach((option) => {
                    const headerCell = document.createElement("th");
                    headerCell.textContent = option;
                    headerRow.appendChild(headerCell);
                });

                header.appendChild(headerRow);
                table.appendChild(header);


                // Create the body of the table
                const body = document.createElement("tbody");

                // Add the questions as rows
                options?.forEach((question: string) => {
                    const row = document.createElement("tr");
                    row.classList.add("magicfeedback-multi-question-matrix-row-tr");
                    // Add the question label as the first cell
                    const questionCell = document.createElement("td");
                    questionCell.style.minWidth = "200px";
                    const label = document.createElement("label");
                    label.classList.add("magicfeedback-multi-question-matrix-label");
                    label.style.paddingRight = "20px";
                    label.textContent = question;

                    questionCell.appendChild(label);
                    row.appendChild(questionCell);

                    // Add the options as radio buttons or checkboxes
                    values.forEach((option) => {
                        const optionCell = document.createElement("td");
                        const input = document.createElement("input");
                        input.type = "radio";
                        input.name = `${ref}-${question}`;
                        input.value = option;
                        input.id = `${ref}-${question}-${option}`;
                        input.classList.add("magicfeedback-input");

                        optionCell.appendChild(input);
                        row.appendChild(optionCell);
                    });

                    body.appendChild(row);
                });

                table.appendChild(body);
                matrixContainer.appendChild(table);
            }

            element.appendChild(matrixContainer);
            break;
        case FEEDBACKAPPANSWERTYPE.PRIORITY_LIST:
            element = document.createElement("div");
            elementTypeClass = "magicfeedback-priority-list";

            const priorityListContainer = document.createElement("div");
            priorityListContainer.classList.add("magicfeedback-priority-list-container");

            // The priority list have a list of items that the user can order by priority,
            // the item is a card with the number of the position and title in the left and a
            // arrow up and down to change the position of the item
            const list = document.createElement("ul");
            list.classList.add("magicfeedback-priority-list-list");

            if (randomPosition) {
                value = value.sort(() => Math.random() - 0.5);
            }

            value.forEach((option, index) => {
                const item = document.createElement("li");
                item.classList.add("magicfeedback-priority-list-item");
                item.style.display = "flex";
                item.style.justifyContent = "space-between";
                item.style.alignItems = "center";
                item.style.margin = "5px";

                // Add input position
                const input = document.createElement("input");
                input.classList.add("magicfeedback-input-magicfeedback-priority-list");
                input.classList.add("magicfeedback-input");
                input.type = "hidden";
                input.id = `priority-list-${ref}`;
                input.name = ref
                input.value = `${index + 1}. ${option}`;
                item.appendChild(input);

                const itemLabel = document.createElement("label");
                itemLabel.classList.add("magicfeedback-priority-list-item-label");
                itemLabel.textContent = `${index + 1}. ${option}`;
                item.appendChild(itemLabel);

                const arrowContainer = document.createElement("div");
                arrowContainer.style.display = "flex";
                arrowContainer.style.alignItems = "center";
                arrowContainer.style.justifyContent = "space-between";

                const upArrow = document.createElement("img");
                upArrow.classList.add("magicfeedback-priority-list-arrow-up");
                // Add a up arrow svg icon
                upArrow.src = "https://magicfeedback-c6458-dev.web.app/assets/arrow.svg";
                upArrow.style.width = "20px";
                upArrow.style.height = "20px";
                upArrow.style.cursor = "pointer";
                upArrow.style.margin = "0 5px";
                upArrow.style.color = "#000";
                upArrow.style.visibility = index === 0 ? "hidden" : "visible";

                upArrow.addEventListener("click", () => {
                    const previous = item.previousElementSibling;
                    if (previous) {
                        const position = Number(input.value?.split(".")[0]) - 1;
                        input.value = `${position}. ${option}`;
                        itemLabel.textContent = `${position}. ${option}`;
                        upArrow.style.visibility = position === 1 ? "hidden" : "visible";
                        downArrow.style.visibility = position === value.length ? "hidden" : "visible";

                        // Update the value of the item that had the new value to update the order
                        const previousInput = previous.querySelector(".magicfeedback-input-magicfeedback-priority-list");
                        const previousLabel = previous.querySelector(".magicfeedback-priority-list-item-label");
                        const previousArrowUp = previous.querySelector(".magicfeedback-priority-list-arrow-up");
                        const previousArrowDown = previous.querySelector(".magicfeedback-priority-list-arrow-down");

                        if (previousInput && previousLabel && previousArrowUp && previousArrowDown) {
                            const newPosition = Number((previousInput as HTMLInputElement).value?.split(".")[0]) + 1;
                            (previousInput as HTMLInputElement).value = `${newPosition}.${previousLabel.textContent?.split(".")[1]}`;
                            previousLabel.textContent = `${newPosition}.${previousLabel.textContent?.split(".")[1]}`;
                            (previousArrowUp as HTMLInputElement).style.visibility = newPosition === 1 ? "hidden" : "visible";
                            (previousArrowDown as HTMLInputElement).style.visibility = newPosition === value.length ? "hidden" : "visible";
                        }

                        list.insertBefore(item, previous);
                    }
                })

                arrowContainer.appendChild(upArrow);

                const downArrow = document.createElement("img");
                downArrow.classList.add("magicfeedback-priority-list-arrow-down");
                // Add a down arrow svg icon
                downArrow.src = "https://magicfeedback-c6458-dev.web.app/assets/arrow.svg";
                downArrow.style.width = "20px";
                downArrow.style.height = "20px";
                downArrow.style.cursor = "pointer";
                downArrow.style.margin = "0 5px";
                downArrow.style.color = "#000";
                downArrow.style.transform = "rotate(180deg)";
                // Hidden if is the bottom
                downArrow.style.visibility = index === value.length - 1 ? "hidden" : "visible";


                downArrow.addEventListener("click", () => {
                    const next = item.nextElementSibling;
                    if (next) {
                        const position = Number(input.value?.split(".")[0]) + 1;
                        input.value = position.toString();
                        itemLabel.textContent = `${position.toString()}. ${option}`;
                        upArrow.style.visibility = position === 1 ? "hidden" : "visible";
                        downArrow.style.visibility = position === value.length ? "hidden" : "visible";

                        // Update the value of the item that had the new value to update the order
                        const nextInput = next.querySelector(".magicfeedback-input-magicfeedback-priority-list");
                        const nextLabel = next.querySelector(".magicfeedback-priority-list-item-label");
                        const nextArrowUp = next.querySelector(".magicfeedback-priority-list-arrow-up");
                        const nextArrowDown = next.querySelector(".magicfeedback-priority-list-arrow-down");

                        if (nextInput && nextLabel && nextArrowUp && nextArrowDown) {
                            const newPosition = Number((nextInput as HTMLInputElement).value.split(".")[0]) - 1;
                            (nextInput as HTMLInputElement).value = `${newPosition}.${nextLabel.textContent?.split(".")[1]}`;
                            nextLabel.textContent = `${newPosition}.${nextLabel.textContent?.split(".")[1]}`;
                            (nextArrowUp as HTMLInputElement).style.visibility = newPosition === 1 ? "hidden" : "visible";
                            (nextArrowDown as HTMLInputElement).style.visibility = newPosition === value.length ? "hidden" : "visible";
                        }

                        list.insertBefore(next, item);
                    }
                })

                arrowContainer.appendChild(downArrow);
                item.appendChild(arrowContainer);

                list.appendChild(item);
            });

            priorityListContainer.appendChild(list);
            element.appendChild(priorityListContainer);
            break;
        case FEEDBACKAPPANSWERTYPE.POINT_SYSTEM:
            element = document.createElement("div");
            elementTypeClass = "magicfeedback-point-system";

            const pointSystemContainer = document.createElement("div");
            pointSystemContainer.classList.add("magicfeedback-point-system-container");

            // The point system have a list of items that the user can assign a value, the user can assign a value to each item in % of the total points but the total points can't be more than 100
            const pointSystemList = document.createElement("ul");
            pointSystemList.classList.add("magicfeedback-point-system-list");
            pointSystemList.style.padding = "0";

            const totalPoints = 100;
            const pointsPerItem = totalPoints / value.length;

            // Add error message to say that the 100 % is mandatory
            const errorMessage = document.createElement("div");
            errorMessage.classList.add("magicfeedback-error");
            errorMessage.textContent = placeholder.pointsystemerror(language || 'en');
            errorMessage.style.color = "#C70039";
            errorMessage.style.fontSize = "14px";
            errorMessage.style.textAlign = "right";
            errorMessage.style.width = "100%";
            errorMessage.style.display = "none";


            //Add a total points counter
            const totalPointsContainer = document.createElement("div");
            totalPointsContainer.classList.add("magicfeedback-point-system-total");
            totalPointsContainer.textContent = `0 / 100 %`;
            totalPointsContainer.style.textAlign = "right";
            totalPointsContainer.style.fontSize = "15px";
            totalPointsContainer.style.marginTop = "5px";

            value.forEach((option, index) => {
                const item = document.createElement("li");
                item.classList.add("magicfeedback-point-system-item");
                item.style.display = "flex";
                item.style.justifyContent = "space-between";
                item.style.alignItems = "center";
                item.style.margin = "5px";

                const itemLabel = document.createElement("label");
                itemLabel.textContent = option;
                itemLabel.style.fontSize = "15px";
                item.appendChild(itemLabel);

                const inputContainer = document.createElement("span");
                inputContainer.classList.add("magicfeedback-point-system-input-container");

                const itemInput = document.createElement("input");
                itemInput.name = ref;
                itemInput.id = `${option}`;
                itemInput.type = "number";
                itemInput.min = "0";
                itemInput.max = `${totalPoints}`;
                itemInput.value = `0`;
                itemInput.classList.add("magicfeedback-input");
                itemInput.style.width = "40px";
                itemInput.style.border = "0";
                itemInput.style.textAlign = "center";
                itemInput.style.margin = "0 5px";
                itemInput.autofocus = index === 0;
                // Add the % symbol to the input
                const percentSymbol = document.createElement("span");
                percentSymbol.textContent = "%";
                percentSymbol.style.color = "#000";

                // Control the total points assigned to the items
                itemInput.addEventListener("input", () => {
                    const allInputs = pointSystemList.querySelectorAll("input");
                    let total = 0;
                    allInputs.forEach((input) => {
                        total += Number((input as HTMLInputElement).value);
                    });

                    if (total > totalPoints) {
                        itemInput.value = `${pointsPerItem}%`;
                        total = total - Number((itemInput as HTMLInputElement).value);
                    }

                    const submitButton = document.getElementById("magicfeedback-submit");
                    if (submitButton) {
                        if (total < 100) {
                            // Disable the submit button if the total points are less than 100
                            totalPointsContainer.style.color = "orange";
                            submitButton.setAttribute("disabled", "true");
                        } else {
                            errorMessage.style.display = "none";
                            totalPointsContainer.style.color = "green";
                            submitButton.removeAttribute("disabled");
                        }
                    }

                    totalPointsContainer.textContent = `${total} / 100 %`;
                });

                itemInput.addEventListener("focus", () => {
                    const submitButton = document.getElementById("magicfeedback-submit");
                    if (submitButton) {
                        submitButton.setAttribute("disabled", "true");
                        submitButton.addEventListener("pointerover", () => {
                            const allInputs = pointSystemList.querySelectorAll("input");
                            let total = 0;
                            allInputs.forEach((input) => {
                                total += Number((input as HTMLInputElement).value);
                            });
                            if (total < 100) errorMessage.style.display = "block";
                        })
                    }
                });

                inputContainer.appendChild(itemInput);
                inputContainer.appendChild(percentSymbol);

                item.appendChild(inputContainer);
                pointSystemList.appendChild(item);
            });

            pointSystemContainer.appendChild(pointSystemList);
            pointSystemContainer.appendChild(totalPointsContainer);
            pointSystemContainer.appendChild(errorMessage);
            element.appendChild(pointSystemContainer);
            break;
        case FEEDBACKAPPANSWERTYPE.INFO_PAGE:
            element = document.createElement("div");
            elementTypeClass = "magicfeedback-info-page";

            const infoMessageElement = document.createElement("div");
            infoMessageElement.classList.add("magicfeedback-info-message");
            infoMessageElement.innerHTML = placeholderText;

            element.appendChild(infoMessageElement);
            break;
        case FEEDBACKAPPANSWERTYPE.UPLOAD_IMAGE:
            element = document.createElement("input");
            (element as HTMLInputElement).type = "file";
            (element as HTMLInputElement).accept = "image/*";
            (element as HTMLInputElement).required = require;
            (element as HTMLInputElement).multiple = assets?.multiple || false;
            (element as HTMLInputElement).maxLength = assets?.maxFiles || 1;
            elementTypeClass = "magicfeedback-upload-image";
            break;
        case FEEDBACKAPPANSWERTYPE.UPLOAD_FILE:
            element = document.createElement("input");
            (element as HTMLInputElement).type = "file";
            (element as HTMLInputElement).required = require;
            (element as HTMLInputElement).multiple = assets?.multiple || false;
            (element as HTMLInputElement).maxLength = assets?.maxFiles || 1;
            elementTypeClass = "magicfeedback-upload-file";
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

    const subLabel = document.createElement("label");
    subLabel.textContent = parseTitle(assets?.subtitle, language);
    subLabel.classList.add("magicfeedback-sublabel");


    if (["CONSENT"].includes(type)) {
        elementContainer.classList.add("magicfeedback-consent-container");
        elementContainer.appendChild(element);
        elementContainer.appendChild(label);
        elementContainer.appendChild(subLabel);
    } else {
        if (format !== 'slim') {

            elementContainer.appendChild(label);
            elementContainer.appendChild(subLabel);

            if (assets?.general !== undefined && assets?.general !== "") {
                // Add a image to the form
                const image = document.createElement("img");
                image.src = assets?.general;
                image.classList.add("magicfeedback-image");
                // Add a max default width to the image
                image.style.maxWidth = "auto";
                image.style.height = "400px";
                image.style.margin = "10px 0";

                elementContainer.appendChild(image);
            }
        }

        if (type === "LONGTEXT" && maxCharacters > 0) {
            const counter = document.createElement("div");
            counter.classList.add("magicfeedback-counter");
            counter.textContent = `${(element as HTMLTextAreaElement).value.length}/${maxCharacters}`
            counter.style.textAlign = "right";
            counter.style.fontSize = "15px";
            counter.style.marginTop = "5px";
            element.addEventListener("input", () => {
                counter.textContent = `${(element as HTMLTextAreaElement).value.length}/${maxCharacters}`;
            });

            elementContainer.appendChild(element);
            elementContainer.appendChild(counter);

            if (assets?.extraOption && assets?.extraOptionText) {
                const skipContainer = document.createElement("div");
                skipContainer.classList.add("magicfeedback-skip-container");
                skipContainer.classList.add(`magicfeedback-checkbox-container`);
                skipContainer.style.display = "flex";
                skipContainer.style.justifyContent = "flex-start";
                // Option to skip the question checkbox
                const skipButton = document.createElement("input");
                skipButton.classList.add("magicfeedback-skip");
                skipButton.type = "checkbox";
                skipButton.id = `skip-${ref}`;
                skipButton.name = ref;
                skipButton.value = '-';
                skipButton.style.cursor = "pointer";

                const skipLabel = document.createElement("label");
                skipLabel.htmlFor = `skip-${ref}`;
                skipLabel.textContent = assets?.extraOptionText;
                skipLabel.style.fontSize = "15px";
                skipLabel.style.cursor = "pointer";
                skipLabel.style.margin = "0 5px";

                skipButton.addEventListener("click", () => {
                    (element as HTMLTextAreaElement).value = '-'
                    if (send) send();
                });

                skipContainer.appendChild(skipButton);
                skipContainer.appendChild(skipLabel);

                elementContainer.appendChild(skipContainer);
            }

        } else {
            elementContainer.appendChild(element);
        }
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

    backButton.addEventListener("click", () => {
        submitButton.removeAttribute("disabled");
    })

    if (identity === 'MAGICSURVEY') {
        actionContainer.appendChild(backButton);
    }

    actionContainer.appendChild(submitButton);

    return actionContainer;
}

function createStarRating(
    ref: string,
    minPlaceholder: string,
    maxPlaceholder: string,
    send: () => void = () => {
    }
) {
    const size = 40;
    const selectedClass = "magicfeedback-rating-star-selected";
    const starFilled = "★";

    const ratingContainer = document.createElement("div");
    ratingContainer.classList.add("magicfeedback-rating-star-container");
    ratingContainer.style.maxWidth = "300px";
    ratingContainer.style.margin = "auto";
    // Mantiene el valor seleccionado original para restaurar tras hover
    ratingContainer.dataset.originalSelection = '0';

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
                if (j + 1 <= Number(ratingInput.value)) {
                    if (!allStars[j].classList.contains(selectedClass)) allStars[j].classList.add(selectedClass);
                } else {
                    if (allStars[j].classList.contains(selectedClass)) allStars[j].classList.remove(selectedClass);
                }
            }
            // Actualizamos el valor original para futuros hover
            ratingContainer.dataset.originalSelection = ratingInput.value;
            if (send) send();
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

        // Hover para previsualizar selección (amarillear todas las anteriores)
        starElement.addEventListener("mouseenter", () => {
            const allStars = ratingContainer.querySelectorAll(".rating__star");
            const idx = i - 1; // índice de la estrella sobre la que se hace hover
            allStars.forEach((star, starIdx) => {
                if (starIdx <= idx) {
                    if (!star.classList.contains(selectedClass)) star.classList.add(selectedClass);
                } else {
                    if (star.classList.contains(selectedClass)) star.classList.remove(selectedClass);
                }
            });
        });
        // Al salir se restaura la selección original
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

function createRatingPlaceholder(
    min: number,
    max: number,
    minPlaceholder: string,
    maxPlaceholder: string,
    extraOption: boolean,
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
    ratingPlaceholderMin.textContent = minPlaceholder;
    ratingPlaceholderMin.classList.add('magicfeedback-rating-placeholder-value');
    ratingPlaceholderMin.style.fontSize = "15px";
    ratingPlaceholderMin.style.textAlign = order === 'ltr' ? "left" : "right";
    ratingPlaceholderMin.style.width = `50%`;

    if (mobile && window.innerWidth < 600 || direction === 'column') {
        ratingPlaceholderMin.textContent = `${min} = ${minPlaceholder}`;
        ratingPlaceholderMin.style.width = '100%'
        ratingPlaceholderMin.style.textAlign = "left";
        ratingPlaceholderMin.style.marginBottom = "5px";
    }


    const ratingPlaceholderMax = document.createElement('span');
    ratingPlaceholderMax.textContent = maxPlaceholder;
    ratingPlaceholderMax.classList.add('magicfeedback-rating-placeholder-value');
    ratingPlaceholderMax.style.fontSize = "15px";
    ratingPlaceholderMax.style.textAlign = order === 'ltr' ? "right" : "left";
    ratingPlaceholderMax.style.width = `50%`;

    if (mobile && window.innerWidth < 600 || direction === 'column') {
        ratingPlaceholderMax.textContent = `${max} = ${maxPlaceholder}`;
        ratingPlaceholderMax.style.width = '100%'
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

    return ratingPlaceholder
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

export function renderStartMessage(
    startMessage: string,
    addButton: boolean = false,
    startButtonText: string = "Go!",
    startEvent: () => void = () => {
    },
): HTMLElement {
    const startMessageContainer = document.createElement("div");
    startMessageContainer.classList.add("magicfeedback-start-message-container");

    const startMessageElement = document.createElement("div");
    startMessageElement.classList.add("magicfeedback-start-message");
    startMessageElement.innerHTML = startMessage;

    startMessageContainer.appendChild(startMessageElement);

    if (addButton) {
        const startMessageButton = document.createElement("button");
        startMessageButton.id = "magicfeedback-start-message-button";
        startMessageButton.classList.add("magicfeedback-start-message-button");
        startMessageButton.textContent = startButtonText;

        startMessageButton.addEventListener("click", () => startEvent());
        startMessageContainer.appendChild(startMessageButton);
    }

    return startMessageContainer;
}

function createRatingNumberElement(
    ref: string,
    assets: any,
    order: string,
    direction: string,
    isPhone: boolean,
    elementTypeClass: string,
    send?: () => void
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
    ratingNumberContainer.setAttribute('role','radiogroup');
    ratingNumberContainer.setAttribute('aria-label', assets?.ariaLabel || 'Rating');

    const maxRatingNumber = assets?.max ? Number(assets?.max) : 10;
    const minRatingNumber = assets?.min ? Number(assets?.min) : 0;

    const integratePlaceholders = !(isPhone || direction === 'column');

    for (let i = minRatingNumber; i <= maxRatingNumber; i++) {
        const ratingOption = document.createElement('div');
        ratingOption.classList.add('magicfeedback-rating-number-option');
        ratingOption.classList.add(`magicfeedback-rating-number-option-${direction}`);

        const containerLabel = document.createElement('label');
        containerLabel.htmlFor = `rating-${ref}-${i}`;
        containerLabel.classList.add('magicfeedback-rating-number-option-label-container');
        if (integratePlaceholders) {
            containerLabel.style.position = 'relative';
            containerLabel.style.overflow = 'visible';
        }

        // Cap span (placeholder visual) para todas las opciones para mantener altura uniforme
        if (integratePlaceholders) {
            const cap = document.createElement('span');
            cap.classList.add('magicfeedback-rating-number-cap');
            cap.classList.add('magicfeedback-rating-placeholder-value');
            cap.style.fontSize = "14px";
            cap.style.whiteSpace = 'nowrap';
            cap.style.wordBreak = 'normal';
            if (i === minRatingNumber && assets?.minPlaceholder) { cap.textContent = assets.minPlaceholder; cap.dataset.capType = 'min'; }
            else if (i === maxRatingNumber && assets?.maxPlaceholder) { cap.textContent = assets.maxPlaceholder; cap.dataset.capType = 'max'; }
            else cap.dataset.capType = 'mid';
            containerLabel.appendChild(cap);
        }

        let inputText = i.toString();
        if (!integratePlaceholders) {
            if (i === minRatingNumber && assets?.minPlaceholder) inputText += ` = ${assets?.minPlaceholder}`;
            if (i === maxRatingNumber && assets?.maxPlaceholder) inputText += ` = ${assets?.maxPlaceholder}`;
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
            containerLabel.style.position = 'relative';
            containerLabel.style.overflow = 'visible';
        }

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

    // Normalizar alturas de los caps sólo en desktop/row
    if (integratePlaceholders) {
        requestAnimationFrame(() => {
            const caps = Array.from(ratingNumberContainer.querySelectorAll('.magicfeedback-rating-number-cap')) as HTMLElement[];
            if (caps.length === 0) return;
            const gap = 6;
            let maxH = 0;
            caps.forEach(c => { if (c.textContent?.trim()) { const h = c.getBoundingClientRect().height || 0; if (h > maxH) maxH = h; } });
            ratingNumberContainer.style.position = 'relative';
            ratingNumberContainer.style.paddingTop = `${maxH + gap}px`;
            caps.forEach(c => {
                const h = c.getBoundingClientRect().height || 0;
                c.style.position = 'absolute';
                c.style.top = `-${(maxH + h)}px`;
                c.style.zIndex = '1';
                c.style.pointerEvents = 'none';
                c.style.padding = '0 4px';
                c.style.boxSizing = 'border-box';
                c.style.whiteSpace = 'nowrap';
                c.style.wordBreak = 'normal';
                c.style.maxWidth = 'none';
                c.style.width = 'max-content';
                // Posicionamiento según tipo
                const type = c.dataset.capType;
                if (type === 'min') {
                    c.style.left = 'auto';
                    c.style.right = '10px';
                    c.style.transform = 'none';
                    c.style.textAlign = 'left';
                } else if (type === 'max') {
                    c.style.right = 'auto';
                    c.style.left = '10px';
                    c.style.transform = 'none';
                    c.style.textAlign = 'right';
                } else {
                    // mid / extra (vacíos) centrados sobre su botón pero invisibles en práctica
                    c.style.left = '50%';
                    c.style.transform = 'translateX(-50%)';
                    c.style.textAlign = 'center';
                }
            });
            ratingNumberContainer.style.overflow = 'visible';
        });
    }

    return element;
}
