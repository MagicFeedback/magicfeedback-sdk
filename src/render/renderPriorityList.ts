import {QuestionRenderer} from "./types";
import {isRtlLanguage, t as translate, TranslationKey} from "../services/i18n";

function createPriorityListElement(params: {
    value: string[];
    ref: string;
    randomPosition?: boolean;
    limitPriority?: boolean;
    maxPriority?: number;
    placeholder?: string;
    language?: string;
}): HTMLElement {
    const {
        value,
        ref,
        randomPosition = false,
        limitPriority = false,
        maxPriority = 0,
        language = 'en',
        placeholder = ''
    } = params;

    // Priority-list copy lives in the shared translation table; the keys here
    // are the short names this renderer has always used.
    const t = (key: string) => translate(language, ('priority.' + key) as TranslationKey);

    const container = document.createElement("div");
    container.classList.add("magicfeedback-priority-list-container");

    if (limitPriority && maxPriority && maxPriority > 0) {
        const selected: string[] = [];

        const header = document.createElement("div");
        header.classList.add("magicfeedback-priority-list-header");

        const instruction = document.createElement("div");
        instruction.classList.add("magicfeedback-priority-list-instruction");
        instruction.textContent = placeholder !== '' ? placeholder : `${t('instruction')}`;
        instruction.style.display = "none";

        const openSelectorBtn = document.createElement("button");
        openSelectorBtn.type = "button";
        openSelectorBtn.textContent = t('selectOptions');
        openSelectorBtn.classList.add("magicfeedback-button");
        openSelectorBtn.classList.add("magicfeedback-priority-list-open-btn");

        header.appendChild(openSelectorBtn);
        header.appendChild(instruction);

        const reorderSection = document.createElement("div");
        reorderSection.classList.add("magicfeedback-priority-list-reorder");

        const reorderList = document.createElement("ul");
        reorderList.classList.add("magicfeedback-priority-list-list");
        reorderSection.appendChild(reorderList);

        const renderReorder = () => {
            reorderList.innerHTML = "";
            selected.forEach((option, index) => {
                const item = document.createElement("li");
                item.classList.add("magicfeedback-priority-list-item");

                const input = document.createElement("input");
                input.classList.add("magicfeedback-input-magicfeedback-priority-list");
                input.classList.add("magicfeedback-input");
                input.type = "hidden";
                input.id = `priority-list-${ref}`;
                input.name = ref;
                input.value = `${index + 1}. ${option}`;
                item.appendChild(input);

                const itemLabel = document.createElement("label");
                itemLabel.classList.add("magicfeedback-priority-list-item-label");
                itemLabel.textContent = `${index + 1}. ${option}`;
                item.appendChild(itemLabel);

                const arrowContainer = document.createElement("div");
                arrowContainer.classList.add("magicfeedback-priority-list-arrows");

                const upArrow = document.createElement("img");
                upArrow.classList.add("magicfeedback-priority-list-arrow-up");
                upArrow.src = "https://magicfeedback-c6458-dev.web.app/assets/arrow.svg";
                upArrow.style.visibility = index === 0 ? "hidden" : "visible";

                const downArrow = document.createElement("img");
                downArrow.classList.add("magicfeedback-priority-list-arrow-down");
                downArrow.src = "https://magicfeedback-c6458-dev.web.app/assets/arrow.svg";
                downArrow.style.transform = "rotate(180deg)";
                downArrow.style.visibility = index === selected.length - 1 ? "hidden" : "visible";

                upArrow.addEventListener("click", () => {
                    const previous = item.previousElementSibling;
                    if (previous) {
                        const position = Number(input.value?.split(".")[0]) - 1;
                        input.value = `${position}. ${option}`;
                        itemLabel.textContent = `${position}. ${option}`;
                        upArrow.style.visibility = position === 1 ? "hidden" : "visible";
                        downArrow.style.visibility = position === selected.length ? "hidden" : "visible";

                        const previousInput = previous.querySelector(".magicfeedback-input-magicfeedback-priority-list");
                        const previousLabel = previous.querySelector(".magicfeedback-priority-list-item-label");
                        const previousArrowUp = previous.querySelector(".magicfeedback-priority-list-arrow-up");
                        const previousArrowDown = previous.querySelector(".magicfeedback-priority-list-arrow-down");
                        if (previousInput && previousLabel && previousArrowUp && previousArrowDown) {
                            const newPosition = Number((previousInput as HTMLInputElement).value?.split(".")[0]) + 1;
                            (previousInput as HTMLInputElement).value = `${newPosition}.${previousLabel.textContent?.split(".")[1]}`;
                            previousLabel.textContent = `${newPosition}.${previousLabel.textContent?.split(".")[1]}`;
                            (previousArrowUp as HTMLInputElement).style.visibility = newPosition === 1 ? "hidden" : "visible";
                            (previousArrowDown as HTMLInputElement).style.visibility = newPosition === selected.length ? "hidden" : "visible";
                        }
                        reorderList.insertBefore(item, previous);
                    }
                });

                downArrow.addEventListener("click", () => {
                    const next = item.nextElementSibling;
                    if (next) {
                        const position = Number(input.value?.split(".")[0]) + 1;
                        input.value = `${position}. ${option}`;
                        itemLabel.textContent = `${position}. ${option}`;
                        upArrow.style.visibility = position === 1 ? "hidden" : "visible";
                        downArrow.style.visibility = position === selected.length ? "hidden" : "visible";

                        const nextInput = next.querySelector(".magicfeedback-input-magicfeedback-priority-list");
                        const nextLabel = next.querySelector(".magicfeedback-priority-list-item-label");
                        const nextArrowUp = next.querySelector(".magicfeedback-priority-list-arrow-up");
                        const nextArrowDown = next.querySelector(".magicfeedback-priority-list-arrow-down");
                        if (nextInput && nextLabel && nextArrowUp && nextArrowDown) {
                            const newPosition = Number((nextInput as HTMLInputElement).value.split(".")[0]) - 1;
                            (nextInput as HTMLInputElement).value = `${newPosition}.${nextLabel.textContent?.split(".")[1]}`;
                            nextLabel.textContent = `${newPosition}.${nextLabel.textContent?.split(".")[1]}`;
                            (nextArrowUp as HTMLInputElement).style.visibility = newPosition === 1 ? "hidden" : "visible";
                            (nextArrowDown as HTMLInputElement).style.visibility = newPosition === selected.length ? "hidden" : "visible";
                        }
                        reorderList.insertBefore(next, item);
                    }
                });

                arrowContainer.appendChild(upArrow);
                arrowContainer.appendChild(downArrow);
                item.appendChild(arrowContainer);
                reorderList.appendChild(item);
            });
        };

        const backdrop = document.createElement("div");
        backdrop.classList.add("magicfeedback-modal-backdrop");
        // The backdrop is portaled to <body> while open (see openModal), which
        // takes it out of the container's subtree and away from the dir the
        // container carries, so it has to state its own direction.
        backdrop.setAttribute("dir", isRtlLanguage(language) ? "rtl" : "ltr");
        backdrop.style.position = "fixed";
        backdrop.style.top = "0";
        backdrop.style.left = "0";
        backdrop.style.width = "100vw";
        backdrop.style.height = "100vh";
        backdrop.style.background = "rgba(0,0,0,0.4)";
        backdrop.style.display = "none";
        backdrop.style.alignItems = "center";
        backdrop.style.justifyContent = "center";
        backdrop.style.zIndex = "9999";

        const modal = document.createElement("div");
        modal.classList.add("magicfeedback-modal");
        modal.style.background = "#fff";
        modal.style.borderRadius = "8px";
        modal.style.boxShadow = "0 8px 24px rgba(0,0,0,0.2)";
        modal.style.maxWidth = "520px";
        modal.style.width = "90%";
        modal.style.maxHeight = "80vh";
        // Flex column: the options list scrolls, while the title and the
        // actions footer (counter + confirm button) stay pinned and always
        // visible. Previously the whole modal scrolled with overflow:auto,
        // which pushed the confirm button off-screen with long option lists.
        modal.style.display = "flex";
        modal.style.flexDirection = "column";
        modal.style.overflow = "hidden";
        modal.style.padding = "16px";
        modal.style.position = "relative";

        const modalTitle = document.createElement("h5");
        modalTitle.classList.add("magicfeedback-modal-title");
        modalTitle.style.flexShrink = "0";
        modalTitle.style.marginTop = "0";
        const getNextIndex = () => Math.min(selected.length + 1, maxPriority);
        const setTitleForSelection = () => {
            modalTitle.textContent = `${t('selectOptionNumber')}${getNextIndex()}`;
        };
        setTitleForSelection();

        const listWrapper = document.createElement("div");
        listWrapper.classList.add("magicfeedback-modal-list");
        // Only the options list scrolls; the footer stays visible.
        listWrapper.style.flex = "1 1 auto";
        listWrapper.style.overflowY = "auto";
        listWrapper.style.minHeight = "0";

        const optionsSource = randomPosition ? [...value].sort(() => Math.random() - 0.5) : [...value];

        optionsSource.forEach((option) => {
            const row = document.createElement("label");
            row.classList.add("magicfeedback-modal-row");

            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.classList.add("magicfeedback-input");
            cb.name = `${ref}-selection`;
            cb.value = option;

            const text = document.createElement("span");
            text.textContent = option;

            cb.addEventListener("change", () => {
                if (cb.checked) {
                    if (selected.length >= maxPriority) {
                        cb.checked = false;
                        row.classList.add("magicfeedback-warning");
                        setTimeout(() => {
                            row.classList.remove("magicfeedback-warning");
                        }, 800);
                        return;
                    }
                    selected.push(option);
                } else {
                    const idx = selected.indexOf(option);
                    if (idx !== -1) selected.splice(idx, 1);
                }
                setTitleForSelection();
                updateCounter();
            });

            row.appendChild(cb);
            row.appendChild(text);
            listWrapper.appendChild(row);
        });

        const actions = document.createElement("div");
        actions.classList.add("magicfeedback-modal-actions");
        actions.style.flexShrink = "0";

        const modalCounter = document.createElement("div");
        modalCounter.classList.add("magicfeedback-modal-counter");
        const updateCounter = () => {
            const ofToken = t('of');
            modalCounter.textContent = `${t('prioritized')} ${selected.length} ${ofToken} ${maxPriority}`;
            instruction.style.display = selected.length > 0 ? "block" : "none";
        };
        updateCounter();

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.classList.add("magicfeedback-modal-close");
        closeBtn.setAttribute("aria-label", t('cancel'));
        closeBtn.title = t('cancel');
        closeBtn.textContent = "×";
        closeBtn.style.position = "absolute";
        closeBtn.style.top = "8px";
        // Logical inset so the close button sits on the far side of the title
        // in both directions; an inline `right` would pin it to the left of an
        // RTL modal, on top of the text.
        closeBtn.style.setProperty("inset-inline-end", "8px");
        closeBtn.style.border = "none";
        closeBtn.style.background = "transparent";
        closeBtn.style.fontSize = "24px";
        closeBtn.style.cursor = "pointer";
        // The backdrop uses position:fixed to overlay the viewport. When the
        // host page applies a `transform` (or filter/perspective) to any
        // ancestor of the survey container, that ancestor becomes the
        // containing block for fixed descendants, so the backdrop is anchored
        // to the container instead of the viewport and gets clipped by any
        // `overflow:hidden` ancestor (the modal and its confirm button then
        // become unreachable). To stay robust regardless of the host's CSS we
        // portal the backdrop to <body> while it is open, and move it back
        // into the container when it closes so the SDK's re-render cleanup
        // (container.innerHTML = "") still disposes of it on navigation.
        const openModal = () => {
            document.body.appendChild(backdrop);
            backdrop.style.display = "flex";
            setTitleForSelection();
            updateCounter();
        };
        const closeModal = () => {
            backdrop.style.display = "none";
            container.appendChild(backdrop);
        };

        closeBtn.addEventListener("click", () => {
            closeModal();
        });

        const confirmBtn = document.createElement("button");
        confirmBtn.type = "button";
        confirmBtn.textContent = t('confirm');
        confirmBtn.classList.add("magicfeedback-button");
        confirmBtn.classList.add("magicfeedback-button-primary");
        confirmBtn.addEventListener("click", () => {
            closeModal();
            renderReorder();
        });

        actions.appendChild(modalCounter);
        actions.appendChild(confirmBtn);

        modal.appendChild(closeBtn);
        modal.appendChild(modalTitle);
        modal.appendChild(listWrapper);
        modal.appendChild(actions);
        backdrop.appendChild(modal);

        openSelectorBtn.addEventListener("click", () => {
            openModal();
        });
        backdrop.addEventListener("click", (ev) => {
            if (ev.target === backdrop) closeModal();
        });

        container.appendChild(header);
        container.appendChild(reorderSection);
        container.appendChild(backdrop);
        renderReorder();
        return container;
    }

    const list = document.createElement("ul");
    list.classList.add("magicfeedback-priority-list-list");

    const options = randomPosition ? [...value].sort(() => Math.random() - 0.5) : [...value];
    options.forEach((option, index) => {
        const item = document.createElement("li");
        item.classList.add("magicfeedback-priority-list-item");
        item.style.display = "flex";
        item.style.justifyContent = "space-between";
        item.style.alignItems = "center";
        item.style.margin = "5px";

        const input = document.createElement("input");
        input.classList.add("magicfeedback-input-magicfeedback-priority-list");
        input.classList.add("magicfeedback-input");
        input.type = "hidden";
        input.id = `priority-list-${ref}`;
        input.name = ref;
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
                downArrow.style.visibility = position === options.length ? "hidden" : "visible";

                const previousInput = previous.querySelector(".magicfeedback-input-magicfeedback-priority-list");
                const previousLabel = previous.querySelector(".magicfeedback-priority-list-item-label");
                const previousArrowUp = previous.querySelector(".magicfeedback-priority-list-arrow-up");
                const previousArrowDown = previous.querySelector(".magicfeedback-priority-list-arrow-down");

                if (previousInput && previousLabel && previousArrowUp && previousArrowDown) {
                    const newPosition = Number((previousInput as HTMLInputElement).value?.split(".")[0]) + 1;
                    (previousInput as HTMLInputElement).value = `${newPosition}.${previousLabel.textContent?.split(".")[1]}`;
                    previousLabel.textContent = `${newPosition}.${previousLabel.textContent?.split(".")[1]}`;
                    (previousArrowUp as HTMLInputElement).style.visibility = newPosition === 1 ? "hidden" : "visible";
                    (previousArrowDown as HTMLInputElement).style.visibility = newPosition === options.length ? "hidden" : "visible";
                }

                list.insertBefore(item, previous);
            }
        });

        const downArrow = document.createElement("img");
        downArrow.classList.add("magicfeedback-priority-list-arrow-down");
        downArrow.src = "https://magicfeedback-c6458-dev.web.app/assets/arrow.svg";
        downArrow.style.width = "20px";
        downArrow.style.height = "20px";
        downArrow.style.cursor = "pointer";
        downArrow.style.margin = "0 5px";
        downArrow.style.color = "#000";
        downArrow.style.transform = "rotate(180deg)";
        downArrow.style.visibility = index === options.length - 1 ? "hidden" : "visible";

        downArrow.addEventListener("click", () => {
            const next = item.nextElementSibling;
            if (next) {
                const position = Number(input.value?.split(".")[0]) + 1;
                input.value = `${position}. ${option}`;
                itemLabel.textContent = `${position}. ${option}`;
                upArrow.style.visibility = position === 1 ? "hidden" : "visible";
                downArrow.style.visibility = position === options.length ? "hidden" : "visible";

                const nextInput = next.querySelector(".magicfeedback-input-magicfeedback-priority-list");
                const nextLabel = next.querySelector(".magicfeedback-priority-list-item-label");
                const nextArrowUp = next.querySelector(".magicfeedback-priority-list-arrow-up");
                const nextArrowDown = next.querySelector(".magicfeedback-priority-list-arrow-down");

                if (nextInput && nextLabel && nextArrowUp && nextArrowDown) {
                    const newPosition = Number((nextInput as HTMLInputElement).value.split(".")[0]) - 1;
                    (nextInput as HTMLInputElement).value = `${newPosition}.${nextLabel.textContent?.split(".")[1]}`;
                    nextLabel.textContent = `${newPosition}.${nextLabel.textContent?.split(".")[1]}`;
                    (nextArrowUp as HTMLInputElement).style.visibility = newPosition === 1 ? "hidden" : "visible";
                    (nextArrowDown as HTMLInputElement).style.visibility = newPosition === options.length ? "hidden" : "visible";
                }

                list.insertBefore(next, item);
            }
        });

        arrowContainer.appendChild(upArrow);
        arrowContainer.appendChild(downArrow);
        item.appendChild(arrowContainer);
        list.appendChild(item);
    });

    container.appendChild(list);
    return container;
}

export const renderPriorityList: QuestionRenderer = ({
    question,
    randomPosition,
    language
}) => {
    const element = document.createElement("div");
    const elementTypeClass = "magicfeedback-priority-list";

    const priorityListElement = createPriorityListElement({
        value: question.value,
        ref: question.ref,
        randomPosition: randomPosition,
        limitPriority: question.assets?.limitPriority || false,
        maxPriority: question.assets?.maxPriority || 0,
        placeholder: question.assets?.placeholder || '',
        language: language || 'en',
    });

    element.appendChild(priorityListElement);

    return {element, elementTypeClass};
};
