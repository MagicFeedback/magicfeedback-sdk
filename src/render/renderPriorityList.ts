import {QuestionRenderer} from "./types";

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

    const t = (key: string) => {
        const dict: Record<string, Record<string, string>> = {
            en: {
                selectUpTo: 'Select up to',
                options: 'options',
                thenOrder: 'and then order them',
                selectOptions: 'Select options',
                cancel: 'Cancel',
                confirm: 'Confirm',
                selectOptionNumber: 'Select option #',
                prioritized: 'Prioritized',
                of: 'of',
                instruction: 'Your priority list can be seen below. If you wish, you can rearrange your choices using the arrows. Click \'Next\' to confirm your selection and proceed.'
            },
            es: {
                selectUpTo: 'Selecciona hasta',
                options: 'opciones',
                thenOrder: 'y luego ordénalas',
                selectOptions: 'Seleccionar opciones',
                cancel: 'Cancelar',
                confirm: 'Confirmar',
                selectOptionNumber: 'Selecciona la opción #',
                prioritized: 'Priorizadas',
                of: 'de',
                instruction: 'Tu lista priorizada se muestra abajo. Si deseas, puedes reordenar las opciones con las flechas. Haz clic en "Siguiente" para confirmar y continuar.'
            },
            pt: {
                selectUpTo: 'Selecione até',
                options: 'opções',
                thenOrder: 'e depois ordene-as',
                selectOptions: 'Selecionar opções',
                cancel: 'Cancelar',
                confirm: 'Confirmar',
                selectOptionNumber: 'Selecione a opção #',
                prioritized: 'Priorizadas',
                of: 'de',
                instruction: 'Sua lista de prioridades pode ser vista abaixo. Se quiser, você pode reorganizar suas escolhas usando as setas. Clique em "Próximo" para confirmar sua seleção e continuar.'
            },
            fr: {
                selectUpTo: 'Sélectionnez jusqu\'à',
                options: 'options',
                thenOrder: 'puis classez-les',
                selectOptions: 'Sélectionner des options',
                cancel: 'Annuler',
                confirm: 'Confirmer',
                selectOptionNumber: 'Sélectionnez l\'option #',
                prioritized: 'Priorisées',
                of: 'sur',
                instruction: 'Votre liste de priorités est affichée ci-dessous. Si vous le souhaitez, vous pouvez réorganiser vos choix à l\'aide des flèches. Cliquez sur "Suivant" pour confirmer votre sélection et continuer.'
            },
            de: {
                selectUpTo: 'Wählen Sie bis zu',
                options: 'Optionen',
                thenOrder: 'und ordnen Sie sie dann',
                selectOptions: 'Optionen auswählen',
                cancel: 'Abbrechen',
                confirm: 'Bestätigen',
                selectOptionNumber: 'Wählen Sie Option #',
                prioritized: 'Priorisiert',
                of: 'von',
                instruction: 'Ihre Prioritätenliste wird unten angezeigt. Wenn Sie möchten, können Sie Ihre Auswahl mit den Pfeilen neu anordnen. Klicken Sie auf "Weiter", um Ihre Auswahl zu bestätigen und fortzufahren.'
            },
            it: {
                selectUpTo: 'Seleziona fino a',
                options: 'opzioni',
                thenOrder: 'e poi ordinali',
                selectOptions: 'Seleziona opzioni',
                cancel: 'Annulla',
                confirm: 'Conferma',
                selectOptionNumber: 'Seleziona opzione #',
                prioritized: 'Prioritizzate',
                of: 'di',
                instruction: 'La tua lista di priorità è mostrata qui sotto. Se vuoi, puoi riordinare le tue scelte usando le frecce. Clicca su "Avanti" per confermare la selezione e continuare.'
            },
            nl: {
                selectUpTo: 'Selecteer tot',
                options: 'opties',
                thenOrder: 'en rangschik ze vervolgens',
                selectOptions: 'Selecteer opties',
                cancel: 'Annuleren',
                confirm: 'Bevestigen',
                selectOptionNumber: 'Selecteer optie #',
                prioritized: 'Geprioriteerd',
                of: 'van',
                instruction: 'Je prioriteitenlijst wordt hieronder weergegeven. Als je wilt, kun je je keuzes herschikken met behulp van de pijlen. Klik op "Volgende" om je selectie te bevestigen en door te gaan.'
            },
            pl: {
                selectUpTo: 'Wybierz do',
                options: 'opcje',
                thenOrder: 'a następnie je uporządkuj',
                selectOptions: 'Wybierz opcje',
                cancel: 'Anuluj',
                confirm: 'Potwierdź',
                selectOptionNumber: 'Wybierz opcję #',
                prioritized: 'Priorytetowe',
                of: 'z',
                instruction: 'Twoja lista priorytetów jest pokazana poniżej. Jeśli chcesz, możesz zmienić kolejność swoich wyborów za pomocą strzałek. Kliknij "Dalej", aby potwierdzić wybór i kontynuować.'
            },
            ru: {
                selectUpTo: 'Выберите до',
                options: 'вариантов',
                thenOrder: 'а затем упорядочьте их',
                selectOptions: 'Выбрать варианты',
                cancel: 'Отмена',
                confirm: 'Подтвердить',
                selectOptionNumber: 'Выберите вариант #',
                prioritized: 'Приоритеты',
                of: 'из',
                instruction: 'Ваш список приоритетов отображается ниже. Если хотите, вы можете изменить порядок вариантов с помощью стрелок. Нажмите "Далее", чтобы подтвердить выбор и продолжить.'
            },
            ja: {
                selectUpTo: '最大',
                options: '個のオプションを選択',
                thenOrder: 'その後並べ替えてください',
                selectOptions: 'オプションを選択',
                cancel: 'キャンセル',
                confirm: '確認',
                selectOptionNumber: 'オプション # を選択',
                prioritized: '優先順位',
                of: 'のうち',
                instruction: '優先順位リストは以下に表示されます。必要に応じて、矢印を使って選択肢を並べ替えることができます。「次へ」をクリックして選択を確定し、続行してください。'
            },
            zh: {
                selectUpTo: '最多选择',
                options: '个选项',
                thenOrder: '然后排序它们',
                selectOptions: '选择选项',
                cancel: '取消',
                confirm: '确认',
                selectOptionNumber: '选择选项 #',
                prioritized: '已优先',
                of: '共',
                instruction: '你的优先列表如下所示。如有需要，可以使用箭头重新排序选项。点击“下一步”确认选择并继续。'
            },
            ko: {
                selectUpTo: '최대',
                options: '개의 옵션 선택',
                thenOrder: '그런 다음 정렬하세요',
                selectOptions: '옵션 선택',
                cancel: '취소',
                confirm: '확인',
                selectOptionNumber: '옵션 # 선택',
                prioritized: '우선순위',
                of: '중',
                instruction: '우선순위 목록은 아래에 표시됩니다. 원한다면 화살표를 사용해 선택 항목을 재정렬할 수 있습니다. "다음"을 클릭하여 선택을 확인하고 계속하세요.'
            },
            ar: {
                selectUpTo: 'اختر حتى',
                options: 'خيارات',
                thenOrder: 'ثم رتبها',
                selectOptions: 'اختر الخيارات',
                cancel: 'إلغاء',
                confirm: 'تأكيد',
                selectOptionNumber: 'اختر الخيار #',
                prioritized: 'تم الترتيب',
                of: 'من',
                instruction: 'تظهر قائمة الأولويات الخاصة بك أدناه. إذا رغبت، يمكنك إعادة ترتيب اختياراتك باستخدام الأسهم. انقر على "التالي" لتأكيد اختيارك والمتابعة.'
            },
            bn: {
                selectUpTo: 'সর্বোচ্চ নির্বাচন করুন',
                options: 'টি বিকল্প',
                thenOrder: 'তারপর সেগুলো সাজান',
                selectOptions: 'বিকল্প নির্বাচন করুন',
                cancel: 'বাতিল',
                confirm: 'নিশ্চিত করুন',
                selectOptionNumber: 'বিকল্প # নির্বাচন করুন',
                prioritized: 'অগ্রাধিকারপ্রাপ্ত',
                of: 'এর মধ্যে',
                instruction: 'আপনার অগ্রাধিকার তালিকা নিচে দেখানো হয়েছে। চাইলে তীর চিহ্ন ব্যবহার করে আপনার পছন্দগুলো পুনরায় সাজাতে পারেন। “পরবর্তী” ক্লিক করে আপনার নির্বাচন নিশ্চিত করুন এবং এগিয়ে যান।'
            },
            da: {
                selectUpTo: 'Vælg op til',
                options: 'muligheder',
                thenOrder: 'og sorter dem derefter',
                selectOptions: 'Vælg muligheder',
                cancel: 'Annuller',
                confirm: 'Bekræft',
                selectOptionNumber: 'Vælg mulighed #',
                prioritized: 'Prioriteret',
                of: 'af',
                instruction: 'Din prioritetsliste vises nedenfor. Hvis du ønsker det, kan du omarrangere dine valg ved hjælp af pilene. Klik på "Næste" for at bekræfte dit valg og fortsætte.'
            },
            fi: {
                selectUpTo: 'Valitse enintään',
                options: 'vaihtoehtoa',
                thenOrder: 'ja järjestä ne sitten',
                selectOptions: 'Valitse vaihtoehdot',
                cancel: 'Peruuta',
                confirm: 'Vahvista',
                selectOptionNumber: 'Valitse vaihtoehto #',
                prioritized: 'Priorisoitu',
                of: ' / ',
                instruction: 'Prioriteettilistasi näkyy alla. Voit halutessasi järjestää valinnat uudelleen nuolien avulla. Napsauta "Seuraava" vahvistaaksesi valinnan ja jatkaaksesi.'
            },
            sv: {
                selectUpTo: 'Välj upp till',
                options: 'alternativ',
                thenOrder: 'och ordna dem sedan',
                selectOptions: 'Välj alternativ',
                cancel: 'Avbryt',
                confirm: 'Bekräfta',
                selectOptionNumber: 'Välj alternativ #',
                prioritized: 'Prioriterat',
                of: 'av',
                instruction: 'Din prioriteringslista visas nedan. Om du vill kan du ordna om dina val med hjälp av pilarna. Klicka på "Nästa" för att bekräfta ditt val och fortsätta.'
            },
            no: {
                selectUpTo: 'Velg opptil',
                options: 'alternativer',
                thenOrder: 'og ordne dem deretter',
                selectOptions: 'Velg alternativer',
                cancel: 'Avbryt',
                confirm: 'Bekreft',
                selectOptionNumber: 'Velg alternativ #',
                prioritized: 'Prioritert',
                of: 'av',
                instruction: 'Prioriteringslisten din vises nedenfor. Hvis du ønsker det, kan du ordne valgene dine ved hjelp av pilene. Klikk på "Neste" for å bekrefte valget ditt og fortsette.'
            },
        };
        const lang = dict[language] ? language : 'en';
        return dict[lang][key];
    };

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
        modal.style.overflow = "auto";
        modal.style.padding = "16px";
        modal.style.position = "relative";

        const modalTitle = document.createElement("h5");
        modalTitle.classList.add("magicfeedback-modal-title");
        const getNextIndex = () => Math.min(selected.length + 1, maxPriority);
        const setTitleForSelection = () => {
            modalTitle.textContent = `${t('selectOptionNumber')}${getNextIndex()}`;
        };
        setTitleForSelection();

        const listWrapper = document.createElement("div");
        listWrapper.classList.add("magicfeedback-modal-list");

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
        closeBtn.style.right = "8px";
        closeBtn.style.border = "none";
        closeBtn.style.background = "transparent";
        closeBtn.style.fontSize = "24px";
        closeBtn.style.cursor = "pointer";
        closeBtn.addEventListener("click", () => {
            backdrop.style.display = "none";
        });

        const confirmBtn = document.createElement("button");
        confirmBtn.type = "button";
        confirmBtn.textContent = t('confirm');
        confirmBtn.classList.add("magicfeedback-button");
        confirmBtn.classList.add("magicfeedback-button-primary");
        confirmBtn.addEventListener("click", () => {
            backdrop.style.display = "none";
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
            backdrop.style.display = "flex";
            setTitleForSelection();
            updateCounter();
        });
        backdrop.addEventListener("click", (ev) => {
            if (ev.target === backdrop) backdrop.style.display = "none";
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
