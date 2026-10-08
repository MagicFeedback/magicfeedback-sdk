import {
    describe,
    test,
    expect,
    beforeEach,
    afterEach,
    jest,
} from "@jest/globals";
import {
    NativeAnswer,
    NativeQuestion,
    FEEDBACKAPPANSWERTYPE,
    generateFormOptions,
} from "../src/models/types";

import {Form} from "../src/models/form";
import {Config} from "../src/models/config";
import {FormData} from "../src/models/formData";
import {Page} from "../src/models/page";
import {PageNode} from "../src/models/pageNode";
import * as requestService from "../src/services/request.service";
import {renderMaxDiff} from "../src/render/renderMaxDiff";

const buildQuestion = (overrides: Partial<NativeQuestion> = {}): NativeQuestion => ({
    id: overrides.id || "q-1",
    title: overrides.title || "Question",
    type: overrides.type || FEEDBACKAPPANSWERTYPE.TEXT,
    questionType: overrides.questionType || ({conf: null} as any),
    ref: overrides.ref || "q-1",
    require: overrides.require ?? false,
    external_id: overrides.external_id || "",
    value: overrides.value || [],
    defaultValue: overrides.defaultValue || "",
    appId: overrides.appId || "app-id",
    followup: overrides.followup ?? false,
    position: overrides.position ?? 1,
    assets: overrides.assets || {},
    refMetric: overrides.refMetric || "",
    integrationId: overrides.integrationId || "integration-1",
    integrationPageId: overrides.integrationPageId || "page-1",
    generatedAt: overrides.generatedAt ?? null,
    updatedAt: overrides.updatedAt ?? null,
    status: overrides.status || "ACTIVE",
    followupQuestion: overrides.followupQuestion || [],
});

const buildFormData = (questions: NativeQuestion[], pages?: Page[]): FormData => {
    return new FormData(
        "form-1",
        "Test Form",
        "",
        "MAGICFORM",
        "MAGICFORM",
        "ACTIVE",
        new Date(),
        new Date(),
        null,
        "company-1",
        "product-1",
        {customIcons: false, id: "product-1"},
        "user-1",
        {},
        {},
        questions,
        ["en"],
        {},
        pages || [new Page("page-1", 1, "integration-1", questions, [])]
    );
};

const setupForm = (
    questions: NativeQuestion[],
    options: generateFormOptions = {}
): Form => {
    const form = new Form(new Config(), "app-id", "public-key");
    const pages = [new Page("page-1", 1, "integration-1", questions, [])];
    (form as any).formData = buildFormData(questions, pages);
    (form as any).selector = "form-container";
    (form as any).formOptionsConfig = {
        ...(form as any).formOptionsConfig,
        ...options,
    };
    return form;
};

/**
 * Form.generate
 */
describe("Form.generate", () => {
    let container: HTMLElement;
    let logSpy: ReturnType<typeof jest.spyOn>;

    /**
     * @jest-environment jsdom
     */
    beforeEach(() => {
        // Create a container element for the form
        container = document.createElement("div");
        container.id = "form-container";
        document.body.appendChild(container);
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    /**
     *
     */
    afterEach(() => {
        // Clean up the container element after each test
        container.remove();
        logSpy.mockRestore();
    });

    /**
     *
     */
    test("should generate a form with text input fields", async () => {
        const questions = [
            buildQuestion({
                id: "1",
                title: "Name",
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                ref: "name",
                position: 1,
            }),
            buildQuestion({
                id: "2",
                title: "Email",
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                ref: "email",
                position: 2,
            }),
        ];

        const form = setupForm(questions);
        await (form as any).generateForm();

        const formSelect = container.querySelector("form");
        const nameInput = container.querySelector('input[name="name"]');
        const emailInput = container.querySelector('input[name="email"]');

        expect(formSelect).not.toBeNull();
        expect(nameInput).not.toBeNull();
        expect(emailInput).not.toBeNull();
        expect(nameInput?.getAttribute("type")).toBe("text");
        expect(emailInput?.getAttribute("type")).toBe("text");
    });

    test("should generate a form with a submit button", async () => {
        const form = setupForm([]);
        await (form as any).generateForm();

        const formSelect = container.querySelector("form");
        const submitButton = container.querySelector('button[type="submit"]');

        expect(formSelect).not.toBeNull();
        expect(submitButton).not.toBeNull();
        expect(submitButton?.textContent).toBe("Send");
    });

    test("should generate a form with a textarea for LONGTEXT type", async () => {
        const questions = [
            buildQuestion({
                id: "3",
                title: "Feedback",
                type: FEEDBACKAPPANSWERTYPE.LONGTEXT,
                ref: "feedback",
                position: 1,
            }),
        ];

        const form = setupForm(questions);
        await (form as any).generateForm();

        const textarea = container.querySelector('textarea[name="feedback"]');

        expect(textarea).not.toBeNull();
        expect(textarea?.getAttribute("rows")).toBe("3");
    });

    test("should generate a form with a number input field for NUMBER type", async () => {
        const questions = [
            buildQuestion({
                id: "4",
                title: "Age",
                type: FEEDBACKAPPANSWERTYPE.NUMBER,
                ref: "age",
                value: ["18", "25", "30"],
                defaultValue: "18",
                position: 1,
            }),
        ];

        const form = setupForm(questions);
        await (form as any).generateForm();

        const numberInput = container.querySelector('input[name="age"]');

        expect(numberInput).not.toBeNull();
        expect(numberInput?.getAttribute("type")).toBe("number");
        expect(numberInput?.getAttribute("min")).toBe("18");
        expect(numberInput?.getAttribute("max")).toBe("30");
        expect((numberInput as HTMLInputElement)?.value).toBe("18");
    });

    test("should generate a form with radio buttons for RADIO type", async () => {
        const questions = [
            buildQuestion({
                id: "5",
                title: "Gender",
                type: FEEDBACKAPPANSWERTYPE.RADIO,
                ref: "gender",
                value: ["Male", "Female"],
                defaultValue: "Male",
                position: 1,
            }),
        ];

        const form = setupForm(questions);
        await (form as any).generateForm();

        const radioButtons = container.querySelectorAll('input[name="gender"]');
        const maleRadioButton = container.querySelector(
            'input[name="gender"][value="Male"]'
        );
        const femaleRadioButton = container.querySelector(
            'input[name="gender"][value="Female"]'
        );

        expect(radioButtons.length).toBe(2);
        expect(maleRadioButton).not.toBeNull();
        expect(femaleRadioButton).not.toBeNull();
        expect(maleRadioButton?.getAttribute("type")).toBe("radio");
        expect(femaleRadioButton?.getAttribute("type")).toBe("radio");
    });

    test("should generate a form with checkboxes for MULTIPLECHOICE type", async () => {
        const questions = [
            buildQuestion({
                id: "6",
                title: "Hobbies",
                type: FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE,
                ref: "hobbies",
                value: ["Reading", "Gaming", "Sports"],
                position: 1,
            }),
        ];

        const form = setupForm(questions);
        await (form as any).generateForm();

        const checkboxes = container.querySelectorAll('input[name="hobbies"]');
        const readingCheckbox = container.querySelector(
            'input[name="hobbies"][value="Reading"]'
        );
        const gamingCheckbox = container.querySelector(
            'input[name="hobbies"][value="Gaming"]'
        );
        const sportsCheckbox = container.querySelector(
            'input[name="hobbies"][value="Sports"]'
        );

        expect(checkboxes.length).toBe(3);
        expect(readingCheckbox).not.toBeNull();
        expect(gamingCheckbox).not.toBeNull();
        expect(sportsCheckbox).not.toBeNull();
        expect(readingCheckbox?.getAttribute("type")).toBe("checkbox");
        expect(gamingCheckbox?.getAttribute("type")).toBe("checkbox");
        expect(sportsCheckbox?.getAttribute("type")).toBe("checkbox");
    });

    test("should generate a form with a select dropdown for SELECT type", async () => {
        const questions = [
            buildQuestion({
                id: "7",
                title: "Country",
                type: FEEDBACKAPPANSWERTYPE.SELECT,
                ref: "country",
                value: ["USA", "Canada", "UK"],
                defaultValue: "Canada",
                position: 1,
            }),
        ];

        const form = setupForm(questions);
        await (form as any).generateForm();

        const select = container.querySelector('select[name="country"]');
        const options = container.querySelectorAll('select[name="country"] option');

        expect(select).not.toBeNull();
        expect(options.length).toBe(4);
        expect((options[1] as HTMLOptionElement).value).toBe("USA");
        expect((options[2] as HTMLOptionElement).value).toBe("Canada");
        expect((options[3] as HTMLOptionElement).value).toBe("UK");
    });

    test("should generate a form with a date input field for DATE type", async () => {
        const questions = [
            buildQuestion({
                id: "8",
                title: "Date of Birth",
                type: FEEDBACKAPPANSWERTYPE.DATE,
                ref: "dob",
                position: 1,
            }),
        ];

        const form = setupForm(questions);
        await (form as any).generateForm();

        const dateInput = container.querySelector('input[name="dob"]');

        expect(dateInput).not.toBeNull();
        expect(dateInput?.getAttribute("type")).toBe("date");
    });

    test("should generate a form with a checkbox for BOOLEAN type", async () => {
        const questions = [
            buildQuestion({
                id: "9",
                title: "Agree to Terms",
                type: FEEDBACKAPPANSWERTYPE.BOOLEAN,
                ref: "agree",
                position: 1,
            }),
        ];

        const form = setupForm(questions);
        await (form as any).generateForm();

        const checkbox = container.querySelector('input[name="agree"]');

        expect(checkbox).not.toBeNull();
        expect(checkbox?.getAttribute("type")).toBe("radio");
    });

    test("should generate a form without a submit button when `addButton` option is false", async () => {
        const form = setupForm([], {addButton: false});
        await (form as any).generateForm();

        const submitButton = container.querySelector(".magicfeedback-submit");

        expect(submitButton).toBeNull();
    });

    test("should hide the back button and ignore back() on the first page", async () => {
        const form = setupForm([
            buildQuestion({id: "11", title: "Name", ref: "name", position: 1}),
        ], {addButton: true});
        (form as any).formData.identity = "MAGICSURVEY";
        await (form as any).generateForm();

        const backButton = container.querySelector(".magicfeedback-back") as HTMLButtonElement;
        expect(backButton).not.toBeNull();
        expect(backButton.hidden).toBe(true);

        await form.back();

        expect(container.querySelector('input[name="name"]')).not.toBeNull();
        expect((form as any).history.size()).toBe(1);
    });

    test("ignores a tap on the new page for 400ms, so a double tap on Start doesn't answer an NPS 0", async () => {
        let clock = 1000;
        const nowSpy = jest.spyOn(performance, "now").mockImplementation(() => clock);
        const form = setupForm([
            buildQuestion({id: "nps", title: "Recommend?", ref: "nps", type: FEEDBACKAPPANSWERTYPE.RATING_NUMBER, assets: {min: 0, max: 10}}),
        ], {addButton: true});
        await (form as any).generateForm();

        const zero = container.querySelector('input[name="nps"][value="0"]') as HTMLInputElement;
        const tap = () => (zero.closest("label") as HTMLLabelElement)
            .dispatchEvent(new MouseEvent("click", {bubbles: true, cancelable: true, detail: 1}));

        clock += 150;
        tap();
        expect(zero.checked).toBe(false);

        clock += 400;
        tap();
        expect(zero.checked).toBe(true);

        nowSpy.mockRestore();
    });

    test("should log an error message when the specified selector is not found", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const form = setupForm([
            buildQuestion({
                id: "10",
                title: "Name",
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                ref: "name",
                position: 1,
            }),
        ]);
        (form as any).selector = "nonexistent-container";
        await (form as any).generateForm();

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    test("should not render an empty content block for INFO_PAGE with only title", async () => {
        const questions = [
            buildQuestion({
                id: "11",
                title: "Information only",
                type: FEEDBACKAPPANSWERTYPE.INFO_PAGE,
                ref: "info-only",
                assets: {},
                position: 1,
            }),
        ];

        const form = setupForm(questions);
        await (form as any).generateForm();

        const label = container.querySelector(".magicfeedback-label");
        const infoMessage = container.querySelector(".magicfeedback-info-message");

        expect(label?.textContent).toBe("Information only");
        expect(infoMessage).toBeNull();
    });

    test("should apply INFO_PAGE title styles from assets", async () => {
        const questions = [
            buildQuestion({
                id: "12",
                title: "Styled info title",
                type: FEEDBACKAPPANSWERTYPE.INFO_PAGE,
                ref: "styled-info",
                assets: {
                    placeholder: "<strong>Tip:</strong> Styled content",
                    titleSize: "medium",
                    titleAlign: "center",
                    titleStyle: ["bold", "italic", "underline"],
                },
                position: 1,
            }),
        ];

        const form = setupForm(questions);
        await (form as any).generateForm();

        const label = container.querySelector(".magicfeedback-label") as HTMLElement;

        expect(label.style.getPropertyValue("font-size")).toBe("1.2rem");
        expect(label.style.getPropertyPriority("font-size")).toBe("important");
        expect(label.style.getPropertyValue("text-align")).toBe("center");
        expect(label.style.getPropertyPriority("text-align")).toBe("important");
        expect(label.style.getPropertyValue("font-style")).toBe("italic");
        expect(label.style.getPropertyValue("font-weight")).toBe("bold");
        expect(label.style.getPropertyValue("text-decoration")).toBe("underline");
    });
});

/**
 * Form.answer
 */
describe("Form.answer", () => {
    const appId = "app-id";
    let logSpy: ReturnType<typeof jest.spyOn>;
    let errorSpy: ReturnType<typeof jest.spyOn>;

    type AnswerCase = {
        name: string;
        type: FEEDBACKAPPANSWERTYPE;
        ref: string;
        setup: (formEl: HTMLFormElement) => void;
        expectedAnswers: NativeAnswer[];
        expectedProfile?: NativeAnswer[];
    };

    const seedHistory = (form: Form, questions: NativeQuestion[]) => {
        const page = new Page("page-1", 0, "integration-1", questions, []);
        const node = new PageNode("page-1", 0, [], page, questions, false);
        (form as any).history.enqueue(node);
        return node;
    };

    const createFormRoot = () => {
        const formEl = document.createElement("form");
        formEl.id = `magicfeedback-${appId}`;
        document.body.appendChild(formEl);
        return formEl;
    };

    const addInput = (
        formEl: HTMLFormElement,
        attrs: {
            type?: string;
            name?: string;
            id?: string;
            value?: string;
            checked?: boolean;
            classes?: string[];
        }
    ) => {
        const input = document.createElement("input");
        if (attrs.type) input.type = attrs.type;
        if (attrs.name) input.name = attrs.name;
        if (attrs.id) input.id = attrs.id;
        if (attrs.value !== undefined) input.value = attrs.value;
        if (attrs.checked !== undefined) input.checked = attrs.checked;
        (attrs.classes || ["magicfeedback-input"]).forEach((cls) =>
            input.classList.add(cls)
        );
        formEl.appendChild(input);
        return input;
    };

    // The real renderer, wrapped the way renderQuestion() does it (the wrapper
    // itself is a ".magicfeedback-input" named after the ref).
    const addMaxDiff = (formEl: HTMLFormElement, ref: string) => {
        const {element} = renderMaxDiff({
            question: buildQuestion({type: FEEDBACKAPPANSWERTYPE.MAX_DIFF, ref, value: ["Price", "Delivery", "Support"]}),
            format: "standard",
            language: "en",
            url: "",
            isPhone: false,
            urlParamValue: null,
            maxCharacters: 0,
            randomPosition: false,
            direction: "row",
            order: "ltr",
        });
        element.setAttribute("name", ref);
        element.classList.add("magicfeedback-input");
        formEl.appendChild(element);
    };

    beforeEach(() => {
        document.body.innerHTML = "";
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(() => {
        logSpy.mockRestore();
        errorSpy.mockRestore();
    });

    test("returns empty answers if the form with the specified ID is not found", () => {
        const form = new Form(new Config(), "nonexistent-app-id", "public-key");
        form.answer();
        const feedback = (form as any).feedback;
        expect(feedback.answers).toEqual([]);
        expect(errorSpy).toHaveBeenCalled();
    });

    test("returns empty answers if no inputs are present in the form", () => {
        createFormRoot();
        const form = new Form(new Config(), appId, "public-key");
        seedHistory(form, []);
        form.answer();
        const feedback = (form as any).feedback;
        expect(feedback.answers).toEqual([]);
    });

    const cases: AnswerCase[] = [
        {
            name: "TEXT",
            type: FEEDBACKAPPANSWERTYPE.TEXT,
            ref: "q_text",
            setup: (formEl) => {
                addInput(formEl, {type: "text", name: "q_text", value: "Hola"});
            },
            expectedAnswers: [{key: "q_text", value: ["Hola"]}],
        },
        {
            name: "LONGTEXT",
            type: FEEDBACKAPPANSWERTYPE.LONGTEXT,
            ref: "q_long",
            setup: (formEl) => {
                const textarea = document.createElement("textarea");
                textarea.name = "q_long";
                textarea.value = "Texto largo";
                textarea.classList.add("magicfeedback-input");
                formEl.appendChild(textarea);
            },
            expectedAnswers: [{key: "q_long", value: ["Texto largo"]}],
        },
        {
            name: "NUMBER",
            type: FEEDBACKAPPANSWERTYPE.NUMBER,
            ref: "q_number",
            setup: (formEl) => {
                addInput(formEl, {type: "number", name: "q_number", value: "42"});
            },
            expectedAnswers: [{key: "q_number", value: ["42"]}],
        },
        {
            name: "DATE",
            type: FEEDBACKAPPANSWERTYPE.DATE,
            ref: "q_date",
            setup: (formEl) => {
                addInput(formEl, {type: "date", name: "q_date", value: "2026-02-01"});
            },
            expectedAnswers: [{key: "q_date", value: ["2026-02-01"]}],
        },
        {
            name: "CONTACT",
            type: FEEDBACKAPPANSWERTYPE.CONTACT,
            ref: "q_contact",
            setup: (formEl) => {
                addInput(formEl, {type: "text", name: "q_contact", value: "Ada Lovelace"});
            },
            expectedAnswers: [{key: "q_contact", value: ["Ada Lovelace"]}],
        },
        {
            name: "EMAIL",
            type: FEEDBACKAPPANSWERTYPE.EMAIL,
            ref: "q_email",
            setup: (formEl) => {
                addInput(formEl, {type: "email", name: "q_email", value: "user@example.com"});
            },
            expectedAnswers: [{key: "q_email", value: ["user@example.com"]}],
            expectedProfile: [{key: "email", value: ["user@example.com"]}],
        },
        {
            name: "PASSWORD",
            type: FEEDBACKAPPANSWERTYPE.PASSWORD,
            ref: "q_password",
            setup: (formEl) => {
                addInput(formEl, {type: "password", name: "q_password", value: "secret"});
            },
            expectedAnswers: [{key: "q_password", value: ["secret"]}],
        },
        {
            name: "CONSENT",
            type: FEEDBACKAPPANSWERTYPE.CONSENT,
            ref: "q_consent",
            setup: (formEl) => {
                addInput(formEl, {
                    type: "checkbox",
                    name: "q_consent",
                    checked: true,
                    classes: ["magicfeedback-consent", "magicfeedback-input"],
                });
            },
            expectedAnswers: [{key: "q_consent", value: ["true"]}],
        },
        {
            name: "POINT_SYSTEM",
            type: FEEDBACKAPPANSWERTYPE.POINT_SYSTEM,
            ref: "q_points",
            setup: (formEl) => {
                addInput(formEl, {
                    type: "number",
                    name: "q_points",
                    id: "Quality",
                    value: "60",
                });
                addInput(formEl, {
                    type: "number",
                    name: "q_points",
                    id: "Price",
                    value: "40",
                });
            },
            expectedAnswers: [
                {key: "q_points", value: ["Quality:60%", "Price:40%"]},
            ],
        },
        {
            name: "MULTIPLECHOICE",
            type: FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE,
            ref: "q_multi",
            setup: (formEl) => {
                addInput(formEl, {
                    type: "checkbox",
                    name: "q_multi",
                    value: "A",
                    checked: true,
                });
                addInput(formEl, {
                    type: "checkbox",
                    name: "q_multi",
                    value: "B",
                    checked: false,
                });
                addInput(formEl, {
                    type: "checkbox",
                    name: "q_multi",
                    value: "C",
                    checked: true,
                });
            },
            expectedAnswers: [{key: "q_multi", value: ["A", "C"]}],
        },
        {
            name: "MULTIPLECHOISE_IMAGE",
            type: FEEDBACKAPPANSWERTYPE.MULTIPLECHOISE_IMAGE,
            ref: "q_multi_image",
            setup: (formEl) => {
                addInput(formEl, {
                    type: "checkbox",
                    name: "q_multi_image",
                    value: "img-1",
                    checked: true,
                });
                addInput(formEl, {
                    type: "checkbox",
                    name: "q_multi_image",
                    value: "img-2",
                    checked: false,
                });
            },
            expectedAnswers: [{key: "q_multi_image", value: ["img-1"]}],
        },
        {
            name: "RADIO",
            type: FEEDBACKAPPANSWERTYPE.RADIO,
            ref: "q_radio",
            setup: (formEl) => {
                addInput(formEl, {
                    type: "radio",
                    name: "q_radio",
                    value: "Yes",
                    checked: true,
                });
            },
            expectedAnswers: [{key: "q_radio", value: ["Yes"]}],
        },
        {
            name: "RATING_STAR",
            type: FEEDBACKAPPANSWERTYPE.RATING_STAR,
            ref: "q_star",
            setup: (formEl) => {
                addInput(formEl, {
                    type: "radio",
                    name: "q_star",
                    value: "4",
                    checked: true,
                });
            },
            expectedAnswers: [{key: "q_star", value: ["4"]}],
        },
        {
            name: "RATING_EMOJI",
            type: FEEDBACKAPPANSWERTYPE.RATING_EMOJI,
            ref: "q_emoji",
            setup: (formEl) => {
                addInput(formEl, {
                    type: "radio",
                    name: "q_emoji",
                    value: "2",
                    checked: true,
                });
            },
            expectedAnswers: [{key: "q_emoji", value: ["2"]}],
        },
        {
            name: "RATING_NUMBER",
            type: FEEDBACKAPPANSWERTYPE.RATING_NUMBER,
            ref: "q_rating",
            setup: (formEl) => {
                addInput(formEl, {
                    type: "radio",
                    name: "q_rating",
                    value: "9",
                    checked: true,
                });
            },
            expectedAnswers: [{key: "q_rating", value: ["9"]}],
        },
        {
            name: "SELECT",
            type: FEEDBACKAPPANSWERTYPE.SELECT,
            ref: "q_select",
            setup: (formEl) => {
                const select = document.createElement("select");
                select.name = "q_select";
                select.classList.add("magicfeedback-input");
                const option = document.createElement("option");
                option.value = "option-1";
                option.textContent = "Option 1";
                select.appendChild(option);
                select.value = "option-1";
                formEl.appendChild(select);
            },
            expectedAnswers: [{key: "q_select", value: ["option-1"]}],
        },
        {
            name: "BOOLEAN",
            type: FEEDBACKAPPANSWERTYPE.BOOLEAN,
            ref: "q_bool",
            setup: (formEl) => {
                addInput(formEl, {
                    type: "radio",
                    name: "q_bool",
                    value: "Yes",
                    checked: true,
                });
            },
            expectedAnswers: [{key: "q_bool", value: ["Yes"]}],
        },
        {
            name: "MULTI_QUESTION_MATRIX",
            type: FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX,
            ref: "q_matrix",
            setup: (formEl) => {
                addInput(formEl, {
                    type: "radio",
                    name: "q_matrix-Row1",
                    value: "A",
                    checked: true,
                });
                addInput(formEl, {
                    type: "radio",
                    name: "q_matrix-Row2",
                    value: "B",
                    checked: true,
                });
            },
            expectedAnswers: [
                {
                    key: "q_matrix",
                    value: [
                        JSON.stringify([
                            {key: "Row1", value: ["A"]},
                            {key: "Row2", value: ["B"]},
                        ]),
                    ],
                },
            ],
        },
        {
            name: "MAX_DIFF",
            type: FEEDBACKAPPANSWERTYPE.MAX_DIFF,
            ref: "q_maxdiff",
            setup: (formEl) => {
                addMaxDiff(formEl, "q_maxdiff");
                (formEl.querySelector("#q_maxdiff-best-1") as HTMLInputElement).checked = true;
                (formEl.querySelector("#q_maxdiff-worst-2") as HTMLInputElement).checked = true;
            },
            expectedAnswers: [
                {
                    key: "q_maxdiff",
                    value: [
                        JSON.stringify([
                            {set: 1, shown: ["Price", "Delivery", "Support"], best: "Delivery", worst: "Support"},
                        ]),
                    ],
                },
            ],
        },
        {
            name: "MAX_DIFF with one pick only",
            type: FEEDBACKAPPANSWERTYPE.MAX_DIFF,
            ref: "q_maxdiff",
            setup: (formEl) => {
                addMaxDiff(formEl, "q_maxdiff");
                (formEl.querySelector("#q_maxdiff-worst-0") as HTMLInputElement).checked = true;
            },
            expectedAnswers: [
                {
                    key: "q_maxdiff",
                    value: [JSON.stringify([{set: 1, shown: ["Price", "Delivery", "Support"], best: null, worst: "Price"}])],
                },
            ],
        },
        {
            name: "MAX_DIFF with nothing picked",
            type: FEEDBACKAPPANSWERTYPE.MAX_DIFF,
            ref: "q_maxdiff",
            setup: (formEl) => addMaxDiff(formEl, "q_maxdiff"),
            expectedAnswers: [],
        },
        {
            name: "PRIORITY_LIST",
            type: FEEDBACKAPPANSWERTYPE.PRIORITY_LIST,
            ref: "q_priority",
            setup: (formEl) => {
                addInput(formEl, {
                    type: "hidden",
                    name: "q_priority",
                    value: "1. First",
                });
            },
            expectedAnswers: [{key: "q_priority", value: ["1. First"]}],
        },
        {
            name: "INFO_PAGE",
            type: FEEDBACKAPPANSWERTYPE.INFO_PAGE,
            ref: "q_info",
            setup: (formEl) => {
                const info = document.createElement("div");
                (info as any).name = "q_info";
                info.classList.add("magicfeedback-input");
                formEl.appendChild(info);
            },
            expectedAnswers: [],
        },
        {
            name: "UPLOAD_FILE",
            type: FEEDBACKAPPANSWERTYPE.UPLOAD_FILE,
            ref: "q_file",
            setup: (formEl) => {
                addInput(formEl, {type: "file", name: "q_file"});
            },
            expectedAnswers: [],
        },
        {
            name: "UPLOAD_IMAGE",
            type: FEEDBACKAPPANSWERTYPE.UPLOAD_IMAGE,
            ref: "q_image",
            setup: (formEl) => {
                addInput(formEl, {type: "file", name: "q_image"});
            },
            expectedAnswers: [],
        },
    ];

    test.each(cases)("$name", ({type, ref, setup, expectedAnswers, expectedProfile}) => {
        const formEl = createFormRoot();
        setup(formEl);
        const form = new Form(new Config(), appId, "public-key");
        const question = buildQuestion({type, ref});
        seedHistory(form, [question]);
        form.answer();
        const feedback = (form as any).feedback;
        expect(feedback.answers).toEqual(expectedAnswers);
        if (expectedProfile) {
            expect(feedback.profile).toEqual(expectedProfile);
        } else {
            expect(feedback.profile).toEqual([]);
        }
    });

    describe("MAX_DIFF screens served as separate pages", () => {
        const screen = (setIndex: number) => buildQuestion({
            type: FEEDBACKAPPANSWERTYPE.MAX_DIFF,
            ref: "q_maxdiff",
            value: ["Price", "Delivery", "Support"],
            assets: {setIndex, setCount: 3} as any,
        });
        const earlierPage = (form: Form, answers: NativeAnswer[]) => {
            const node = seedHistory(form, [screen(1)]);
            node.setAnswer(answers);
        };
        const sets = (form: Form) => JSON.parse((form as any).feedback.answers[0].value[0]);

        test("each push carries every screen answered so far, ordered by set", () => {
            const formEl = createFormRoot();
            addMaxDiff(formEl, "q_maxdiff");
            (formEl.querySelector("#q_maxdiff-best-0") as HTMLInputElement).checked = true;
            (formEl.querySelector("#q_maxdiff-worst-1") as HTMLInputElement).checked = true;
            const form = new Form(new Config(), appId, "public-key");
            earlierPage(form, [{
                key: "q_maxdiff",
                value: [JSON.stringify([{set: 2, shown: ["A", "B"], best: "A", worst: "B"}, {set: 1, shown: ["C", "D"], best: "D", worst: "C"}])],
            }]);
            seedHistory(form, [screen(3)]);

            form.answer();

            expect(sets(form).map((set: any) => set.set)).toEqual([1, 2, 3]);
            expect(sets(form)[2]).toEqual({set: 3, shown: ["Price", "Delivery", "Support"], best: "Price", worst: "Delivery"});
        });

        test("answering a screen again replaces its earlier set", () => {
            const formEl = createFormRoot();
            addMaxDiff(formEl, "q_maxdiff");
            (formEl.querySelector("#q_maxdiff-best-2") as HTMLInputElement).checked = true;
            (formEl.querySelector("#q_maxdiff-worst-0") as HTMLInputElement).checked = true;
            const form = new Form(new Config(), appId, "public-key");
            earlierPage(form, [{
                key: "q_maxdiff",
                value: [JSON.stringify([{set: 1, shown: ["Price", "Delivery", "Support"], best: "Price", worst: "Support"}])],
            }]);
            seedHistory(form, [screen(1)]);

            form.answer();

            expect(sets(form)).toEqual([{set: 1, shown: ["Price", "Delivery", "Support"], best: "Support", worst: "Price"}]);
        });

        test("a page that skipped the question does not hide earlier screens", () => {
            const formEl = createFormRoot();
            addMaxDiff(formEl, "q_maxdiff");
            (formEl.querySelector("#q_maxdiff-best-0") as HTMLInputElement).checked = true;
            const form = new Form(new Config(), appId, "public-key");
            earlierPage(form, [{key: "q_maxdiff", value: [JSON.stringify([{set: 1, shown: ["A"], best: "A", worst: null}])]}]);
            earlierPage(form, []);
            seedHistory(form, [screen(3)]);

            form.answer();

            expect(sets(form).map((set: any) => set.set)).toEqual([1, 3]);
        });
    });

    test("clears answers when email is invalid", () => {
        const formEl = createFormRoot();
        addInput(formEl, {type: "email", name: "q_email", value: "invalid"});
        const form = new Form(new Config(), appId, "public-key");
        const question = buildQuestion({type: FEEDBACKAPPANSWERTYPE.EMAIL, ref: "q_email"});
        seedHistory(form, [question]);
        form.answer();
        const feedback = (form as any).feedback;
        expect(feedback.answers).toEqual([]);
        expect(feedback.profile).toEqual([]);
    });
});

/**
 * Form.finish
 */
describe("Form.finish", () => {
    let container: HTMLElement;
    let logSpy: ReturnType<typeof jest.spyOn>;
    let errorSpy: ReturnType<typeof jest.spyOn>;
    let sendSpy: ReturnType<typeof jest.spyOn>;
    let sent: any[];

    // Answer the only page of a one-question survey and submit it: send()
    // pushes the page, finds no next page and finish() pushes the completion.
    const completeSurvey = async (addSuccessScreen: boolean) => {
        const form = setupForm([
            buildQuestion({id: "1", title: "Name", ref: "name", position: 1}),
        ], {addSuccessScreen});
        (form as any).config.set("url", "https://api.test");
        await (form as any).generateForm();

        (container.querySelector('input[name="name"]') as HTMLInputElement).value = "Ada";
        await form.send();
        // finish() is not awaited by the routing, let its push settle.
        for (let i = 0; i < 10; i++) await Promise.resolve();
        return form;
    };

    beforeEach(() => {
        document.body.innerHTML = "";
        container = document.createElement("div");
        container.id = "form-container";
        document.body.appendChild(container);
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        // Snapshot each body when it is sent, as the real request serializes it
        // on the spot while `feedback` keeps being mutated afterwards.
        sent = [];
        sendSpy = jest.spyOn(requestService, "sendFeedback").mockImplementation(async (_url, body) => {
            sent.push(JSON.parse(JSON.stringify(body)));
            return "session-1";
        });
    });

    afterEach(() => {
        container.remove();
        logSpy.mockRestore();
        errorSpy.mockRestore();
        sendSpy.mockRestore();
    });

    test.each([true, false])(
        "with addSuccessScreen %s, completes without errors and without re-sending the answers",
        async (addSuccessScreen) => {
            const form = await completeSurvey(addSuccessScreen);

            expect(errorSpy).not.toHaveBeenCalled();
            expect(form.completed).toBe(true);

            expect(sent).toHaveLength(2);
            const [pagePush, completionPush] = sent;

            // The page push carries the answers and opens the session.
            expect(pagePush.completed).toBe(false);
            expect(pagePush.sessionId).toBeUndefined();
            expect(pagePush.feedback.answers).toEqual([{key: "name", value: ["Ada"]}]);

            // The completion push closes that session with its metadata only.
            expect(completionPush.completed).toBe(true);
            expect(completionPush.sessionId).toBe("session-1");
            expect(completionPush.integration).toBe("app-id");
            expect(completionPush.feedback.answers).toEqual([]);
            expect(completionPush.feedback.metadata).toEqual(
                expect.arrayContaining([
                    {key: "time-to-complete", value: [expect.stringMatching(/^\d+$/)]},
                ])
            );
        }
    );

    test("with addSuccessScreen true, replaces the form with the success message", async () => {
        await completeSurvey(true);

        expect(document.getElementById("magicfeedback-app-id")).toBeNull();
        expect(container.querySelector(".magicfeedback-success")).not.toBeNull();
    });

    test("with addSuccessScreen false, leaves the form in place", async () => {
        await completeSurvey(false);

        expect(document.getElementById("magicfeedback-app-id")).not.toBeNull();
    });
});

describe("Form.answer missing form", () => {
    test("names the missing form id in the error", () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        document.body.innerHTML = "";
        new Form(new Config(), "missing-app", "public-key").answer();

        expect(errorSpy).toHaveBeenCalledWith("[MagicFeedback]:", 'Form "magicfeedback-missing-app" not found.');
        errorSpy.mockRestore();
    });
});

describe("Form.send with a required MAX_DIFF", () => {
    let container: HTMLElement;
    let logSpy: ReturnType<typeof jest.spyOn>;
    let errorSpy: ReturnType<typeof jest.spyOn>;
    let sendSpy: ReturnType<typeof jest.spyOn>;
    let sent: any[];

    const renderSurvey = async (setIndex?: number) => {
        const form = setupForm([
            buildQuestion({
                id: "1",
                ref: "md",
                type: FEEDBACKAPPANSWERTYPE.MAX_DIFF,
                require: true,
                value: ["Price", "Delivery", "Support"],
                position: 1,
                assets: (setIndex ? {setIndex, setCount: 3} : {}) as any,
            }),
        ]);
        (form as any).config.set("url", "https://api.test");
        await (form as any).generateForm();
        return form;
    };

    const pick = (side: "best" | "worst", index: number) => {
        (container.querySelector(`#md-${side}-${index}`) as HTMLInputElement).click();
    };

    beforeEach(() => {
        document.body.innerHTML = "";
        container = document.createElement("div");
        container.id = "form-container";
        document.body.appendChild(container);
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        sent = [];
        sendSpy = jest.spyOn(requestService, "sendFeedback").mockImplementation(async (_url, body) => {
            sent.push(JSON.parse(JSON.stringify(body)));
            return "session-1";
        });
    });

    afterEach(() => {
        container.remove();
        logSpy.mockRestore();
        errorSpy.mockRestore();
        sendSpy.mockRestore();
    });

    test("does not send with only one of the two picks", async () => {
        const form = await renderSurvey();
        pick("best", 0);

        await form.send();

        expect(sent).toHaveLength(0);
        expect(errorSpy).toHaveBeenCalledWith(
            "[MagicFeedback]:",
            "The MaxDiff question md requires the most and the least important"
        );
    });

    test("only the screen being answered needs both picks", async () => {
        const form = await renderSurvey(2);
        // an earlier screen with one side empty, as an optional skip would leave it
        const node = new PageNode("earlier", 0, [], new Page("earlier", 0, "integration-1", [], []), [], false);
        node.setAnswer([{key: "md", value: [JSON.stringify([{set: 1, shown: ["A"], best: "A", worst: null}])]}]);
        (form as any).history.items.unshift(node);
        pick("best", 0);
        pick("worst", 1);

        await form.send();

        // the page push went out (a completion push follows, as this is the last page)
        expect(sent[0].completed).toBe(false);
        expect(JSON.parse(sent[0].feedback.answers[0].value[0]).map((set: any) => set.set)).toEqual([1, 2]);
    });

    test("sends the set with both picks", async () => {
        const form = await renderSurvey();
        pick("best", 0);
        pick("worst", 2);

        await form.send();

        expect(sent[0].feedback.answers).toEqual([
            {
                key: "md",
                value: [JSON.stringify([{set: 1, shown: ["Price", "Delivery", "Support"], best: "Price", worst: "Support"}])],
            },
        ]);
    });
});
