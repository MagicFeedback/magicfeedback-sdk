import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../models/types";
import {placeholder} from "./placeholder";
import {getQuestionRenderer} from "../render/registry";
import {getUrlParam, parseTitle} from "../render/helpers";

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
    const urlParamValue = getUrlParam(ref);

    const maxCharacters = assets?.maxCharacters || 0
    const randomPosition = assets?.randomPosition === undefined ? false : assets?.randomPosition;
    const direction = assets?.direction || "row";
    const order = assets?.order || "ltr";

    const renderer = getQuestionRenderer(type);
    if (renderer) {
        const result = renderer({
            question,
            format,
            language,
            url,
            send,
            isPhone,
            urlParamValue,
            placeholderText,
            maxCharacters,
            randomPosition,
            direction,
            order
        });
        element = result.element;
        elementTypeClass = result.elementTypeClass;
    } else {
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

    if (assets?.subtitleStyle?.includes('italic')) {
        subLabel.style.fontStyle = "italic";
    }
    if (assets?.subtitleStyle?.includes('bold')) {
        subLabel.style.fontWeight = "bold";
    }
    if (assets?.subtitleStyle?.includes('underline')) {
        subLabel.style.textDecoration = "underline";
    }


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
