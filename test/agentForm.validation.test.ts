import {beforeEach, describe, expect, jest, test} from "@jest/globals";

import {AgentForm, keepExclusiveAnswer, withBaseAssets} from "../src/models/agentForm";
import {Config} from "../src/models/config";
import {nextAgentTurn, startAgentSurvey} from "../src/services/agent.service";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";

jest.mock("../src/services/agent.service");

const mockedStart = startAgentSurvey as jest.MockedFunction<typeof startAgentSurvey>;
const mockedNext = nextAgentTurn as jest.MockedFunction<typeof nextAgentTurn>;

const INTEGRATION = "int-1";

const turn = (n: number, ref: string, type: string, values: string[] | null = null, isFromBase = true) => ({
    sessionId: "sess-1",
    nextQuestion: `Question ${n}?`,
    questionType: type,
    questionRef: ref,
    questionValues: values,
    isFromBase,
    coverageGaps: "",
    maxTurns: 12,
    currentTurn: n,
    shouldEnd: false,
    answerType: "COMPLETE",
    topic: "OTHER",
    coverageSummary: "",
});

const CONTACT_OPTIONS = ["Yes, via e-mail", "Yes, via SMS", "No, thanks"];

// The survey's own questions, as Get Survey returns them for an AGENT survey.
const baseQuestions = [
    {ref: "nps", type: "RATING_NUMBER", assets: {min: "0", max: "10", minPlaceholder: "Not likely", maxPlaceholder: "Very likely"}},
    {ref: "contact", type: "MULTIPLECHOICE", value: CONTACT_OPTIONS, assets: {exclusiveAnswers: ["No, thanks"], minOptions: 1}},
    {ref: "email", type: "EMAIL", assets: {}},
] as unknown as NativeQuestion[];

function makeForm(): AgentForm {
    const config = new Config();
    config.set("url", "http://example.com/");
    const form = new AgentForm(config, INTEGRATION, "pk_test");
    form.applyIntegrationContext({lang: ["en"], questions: baseQuestions});
    return form;
}

const errorNode = () => document.querySelector(".magicfeedback-error") as HTMLElement | null;
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("AgentForm: email validation (INVALID_EMAIL)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        document.body.innerHTML = '<div id="demo"></div>';
    });

    test("refuses an email without a domain, under the field, and sends nothing", async () => {
        mockedStart.mockResolvedValue(turn(1, "email", "EMAIL") as any);
        const form = makeForm();
        await form.generate("demo", {resume: false});

        const input = document.querySelector('input[type="email"]') as HTMLInputElement;
        input.value = "test@invalid";
        await form.next();

        expect(mockedNext).not.toHaveBeenCalled();
        expect(errorNode()?.textContent).toBe("Please enter a valid email address.");
        expect(errorNode()?.dataset.code).toBe("INVALID_EMAIL");
        expect(errorNode()?.classList.contains("magicfeedback-error--field")).toBe(true);
        expect(errorNode()?.getAttribute("role")).toBe("alert");
        expect(input.getAttribute("aria-invalid")).toBe("true");
        // Under the field, not above the question.
        const questions = document.getElementById(`magicfeedback-agent-questions-${INTEGRATION}`)!;
        expect(questions.lastElementChild).toBe(errorNode());

        // Typing again clears it.
        input.dispatchEvent(new Event("input"));
        expect(errorNode()).toBeNull();
        expect(input.hasAttribute("aria-invalid")).toBe(false);
    });

    test("sends a valid email", async () => {
        mockedStart.mockResolvedValue(turn(1, "email", "EMAIL") as any);
        mockedNext.mockResolvedValue({...turn(2, "x", "NONE"), shouldEnd: true} as any);
        const form = makeForm();
        await form.generate("demo", {resume: false});

        (document.querySelector('input[type="email"]') as HTMLInputElement).value = "fan@fck.dk";
        await form.next();

        expect(mockedNext).toHaveBeenCalledTimes(1);
        expect(mockedNext.mock.calls[0][1].lastAnswer).toBe("fan@fck.dk");
    });

    test("invalidEmailMessage overrides the text, in the survey language", async () => {
        mockedStart.mockResolvedValue(turn(1, "email", "EMAIL") as any);
        const form = makeForm();
        await form.generate("demo", {resume: false, invalidEmailMessage: "Ugyldig e-mail"});

        (document.querySelector('input[type="email"]') as HTMLInputElement).value = "nope";
        await form.next();

        expect(errorNode()?.textContent).toBe("Ugyldig e-mail");
    });

    test("an empty required question shows the required text under the field", async () => {
        mockedStart.mockResolvedValue(turn(1, "email", "EMAIL") as any);
        const form = makeForm();
        await form.generate("demo", {resume: false, requiredMessage: "Answer please"});

        await form.next();

        expect(mockedNext).not.toHaveBeenCalled();
        expect(errorNode()?.textContent).toBe("Answer please");
        expect(errorNode()?.dataset.code).toBe("REQUIRED");
    });
});

describe("AgentForm: base question assets and exclusive answers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        document.body.innerHTML = '<div id="demo"></div>';
    });

    test("a base scale gets the end labels the admin set", async () => {
        const values = Array.from({length: 11}, (_, i) => String(i));
        mockedStart.mockResolvedValue(turn(1, "nps", "RATING_NUMBER", values) as any);
        const form = makeForm();
        await form.generate("demo", {resume: false});

        expect(document.body.textContent).toContain("Not likely");
        expect(document.body.textContent).toContain("Very likely");
    });

    test("picking the exclusive answer unchecks the others and sends it alone", async () => {
        mockedStart.mockResolvedValue(turn(1, "contact", "MULTIPLECHOICE", CONTACT_OPTIONS) as any);
        mockedNext.mockResolvedValue({...turn(2, "x", "NONE"), shouldEnd: true} as any);
        const form = makeForm();
        await form.generate("demo", {resume: false});

        const box = (v: string) => document.querySelector(`input[value="${v}"]`) as HTMLInputElement;
        box("Yes, via e-mail").checked = true;
        box("Yes, via e-mail").dispatchEvent(new Event("change"));
        box("No, thanks").checked = true;
        box("No, thanks").dispatchEvent(new Event("change"));

        expect(box("Yes, via e-mail").checked).toBe(false);

        await form.next();
        expect(mockedNext.mock.calls[0][1].lastAnswer).toBe("No, thanks");
    });

    test("an exclusive answer checked with others (by a script) is still sent alone", async () => {
        mockedStart.mockResolvedValue(turn(1, "contact", "MULTIPLECHOICE", CONTACT_OPTIONS) as any);
        mockedNext.mockResolvedValue({...turn(2, "x", "NONE"), shouldEnd: true} as any);
        const form = makeForm();
        await form.generate("demo", {resume: false});

        CONTACT_OPTIONS.forEach((v) => {
            (document.querySelector(`input[value="${v}"]`) as HTMLInputElement).checked = true;
        });
        await form.next();

        expect(mockedNext.mock.calls[0][1].lastAnswer).toBe("No, thanks");
    });

    test("other options still go together", async () => {
        mockedStart.mockResolvedValue(turn(1, "contact", "MULTIPLECHOICE", CONTACT_OPTIONS) as any);
        mockedNext.mockResolvedValue({...turn(2, "x", "NONE"), shouldEnd: true} as any);
        const form = makeForm();
        await form.generate("demo", {resume: false});

        ["Yes, via e-mail", "Yes, via SMS"].forEach((v) => {
            (document.querySelector(`input[value="${v}"]`) as HTMLInputElement).checked = true;
        });
        await form.next();

        expect(mockedNext.mock.calls[0][1].lastAnswer).toBe("Yes, via e-mail, Yes, via SMS");
    });

    test("minOptions is enforced unless the exclusive answer is picked", async () => {
        const base = [{...baseQuestions[1], assets: {exclusiveAnswers: ["No, thanks"], minOptions: 2}}] as NativeQuestion[];
        mockedStart.mockResolvedValue(turn(1, "contact", "MULTIPLECHOICE", CONTACT_OPTIONS) as any);
        mockedNext.mockResolvedValue({...turn(2, "x", "NONE"), shouldEnd: true} as any);
        const config = new Config();
        config.set("url", "http://example.com/");
        const form = new AgentForm(config, INTEGRATION, "pk_test");
        form.applyIntegrationContext({lang: ["en"], questions: base});
        await form.generate("demo", {resume: false});

        const box = (v: string) => document.querySelector(`input[value="${v}"]`) as HTMLInputElement;
        box("Yes, via SMS").checked = true;
        await form.next();
        expect(mockedNext).not.toHaveBeenCalled();
        expect(errorNode()?.dataset.code).toBe("REQUIRED");

        box("Yes, via SMS").checked = false;
        box("No, thanks").checked = true;
        await form.next();
        expect(mockedNext).toHaveBeenCalledTimes(1);
    });

    test("withBaseAssets keeps the agent's question when the type differs or there is no base", () => {
        const q = {ref: "a", type: FEEDBACKAPPANSWERTYPE.RADIO, assets: {direction: "row"}} as unknown as NativeQuestion;
        expect(withBaseAssets(q, undefined)).toBe(q);
        expect(withBaseAssets(q, {ref: "a", type: "BOOLEAN", assets: {x: 1}} as unknown as NativeQuestion)).toBe(q);
        expect(withBaseAssets(q, {ref: "a", type: "RADIO", assets: {x: 1}} as unknown as NativeQuestion).assets)
            .toEqual({direction: "row", x: 1});
    });

    test("keepExclusiveAnswer leaves answers without an exclusive pick untouched", () => {
        const q = {ref: "c", type: FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE, assets: {exclusiveAnswers: ["None"]}} as unknown as NativeQuestion;
        const answers = [{key: "c", value: ["A"]}, {key: "c", value: ["B"]}];
        expect(keepExclusiveAnswer(answers, q)).toBe(answers);
        expect(keepExclusiveAnswer([...answers, {key: "c", value: ["None"]}, {key: "extra-option-c", value: ["x"]}], q))
            .toEqual([{key: "c", value: ["None"]}]);
    });
});

describe("AgentForm: the total is an upper bound", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        document.body.innerHTML = '<div id="demo"></div>';
    });

    test("every event with a total says it is an estimate; total itself is unchanged", async () => {
        mockedStart.mockResolvedValue(turn(1, "nps", "LONGTEXT") as any);
        mockedNext
            .mockResolvedValueOnce(turn(2, "q2", "LONGTEXT", null, false) as any)
            .mockResolvedValueOnce({...turn(3, "x", "NONE"), shouldEnd: true} as any);

        const onLoadedEvent = jest.fn();
        const beforeSubmitEvent = jest.fn();
        const afterSubmitEvent = jest.fn();
        const form = makeForm();
        await form.generate("demo", {resume: false, onLoadedEvent, beforeSubmitEvent, afterSubmitEvent});

        expect(form.totalIsEstimate).toBe(true);
        expect(form.isDynamic).toBe(true);
        // Backwards compatible: still maxTurns - 1.
        expect(form.total).toBe(11);
        expect(onLoadedEvent).toHaveBeenCalledWith(expect.objectContaining({total: 11, totalIsEstimate: true, isDynamic: true}));

        (document.querySelector(".magicfeedback-input") as HTMLTextAreaElement).value = "a";
        await form.next();
        (document.querySelector(".magicfeedback-input") as HTMLTextAreaElement).value = "b";
        await form.next();
        await tick();

        expect(beforeSubmitEvent).toHaveBeenCalledWith(expect.objectContaining({totalIsEstimate: true}));
        afterSubmitEvent.mock.calls.forEach(([payload]) => {
            expect(payload).toEqual(expect.objectContaining({total: 11, totalIsEstimate: true, isDynamic: true}));
        });
        // It ended at the 2nd question, well before 11.
        expect(afterSubmitEvent).toHaveBeenLastCalledWith(expect.objectContaining({completed: true, progress: 1}));
    });
});
