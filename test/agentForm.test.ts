import {beforeEach, describe, expect, jest, test} from "@jest/globals";

import {AgentForm} from "../src/models/agentForm";
import {Config} from "../src/models/config";
import {AgentApiError} from "../src/services/agentErrors";
import {nextAgentTurn, startAgentSurvey} from "../src/services/agent.service";
import {sendFeedback} from "../src/services/request.service";
import {AgentNextRequest} from "../src/models/types";

jest.mock("../src/services/agent.service");
jest.mock("../src/services/request.service", () => ({
    header: {},
    sendFeedback: jest.fn(),
    getForm: jest.fn(),
    getSessionForm: jest.fn(),
    getQuestions: jest.fn(),
    getFollowUpQuestion: jest.fn(),
    validateEmail: jest.fn(),
}));

const mockedStart = startAgentSurvey as jest.MockedFunction<typeof startAgentSurvey>;
const mockedNext = nextAgentTurn as jest.MockedFunction<typeof nextAgentTurn>;
const mockedSendFeedback = sendFeedback as jest.MockedFunction<typeof sendFeedback>;

const INTEGRATION = "int-1";
const PUBLIC_KEY = "pk_test";

const turn = (n: number, ref: string, isFromBase = false) => ({
    sessionId: "sess-1",
    nextQuestion: `Question ${n}?`,
    questionType: "LONGTEXT",
    questionRef: ref,
    questionValues: null,
    isFromBase,
    coverageGaps: "",
    maxTurns: 6,
    currentTurn: n,
    shouldEnd: false,
    answerType: "COMPLETE",
    topic: "OTHER",
    coverageSummary: "",
});

function makeForm(): AgentForm {
    const config = new Config();
    config.set("url", "http://example.com/");
    return new AgentForm(config, INTEGRATION, PUBLIC_KEY);
}

function answerCurrentQuestion(text: string): void {
    const input = document.querySelector(".magicfeedback-input") as HTMLTextAreaElement;
    input.value = text;
}

function lastNextRequest(): AgentNextRequest {
    const calls = mockedNext.mock.calls;
    return calls[calls.length - 1][1];
}

describe("AgentForm", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        document.body.innerHTML = '<div id="demo"></div>';
    });

    test("renders the first question and never calls POST /sdk/feedback", async () => {
        mockedStart.mockResolvedValue(turn(1, "ref-1") as any);

        const form = makeForm();
        await form.generate("demo", {resume: false});

        expect(document.querySelectorAll(".magicfeedback-div")).toHaveLength(1);
        expect(document.body.textContent).toContain("Question 1?");
        expect(form.getSessionId()).toBe("sess-1");
        expect(form.getConversation()).toHaveLength(1);
        expect(mockedSendFeedback).not.toHaveBeenCalled();
    });

    test("walks a three-turn conversation, owning the turn counter", async () => {
        mockedStart.mockResolvedValue(turn(1, "ref-1", true) as any);
        mockedNext
            .mockResolvedValueOnce(turn(2, "ref-2") as any)
            .mockResolvedValueOnce(turn(3, "ref-3", true) as any);

        const form = makeForm();
        await form.generate("demo", {resume: false});
        expect(form.getConversation()).toHaveLength(1);

        answerCurrentQuestion("First answer");
        await form.next();

        // agent + user + agent
        expect(form.getConversation()).toHaveLength(3);
        expect(lastNextRequest().currentTurn).toBe(2);
        expect(lastNextRequest().lastAnswer).toBe("First answer");
        expect(lastNextRequest().lastQuestionRef).toBe("ref-1");
        expect(document.body.textContent).toContain("Question 2?");

        answerCurrentQuestion("Second answer");
        await form.next();

        expect(form.getConversation()).toHaveLength(5);
        // The server echoes currentTurn back; the frontend must not re-increment it.
        expect(lastNextRequest().currentTurn).toBe(3);
        expect(document.querySelectorAll(".magicfeedback-div")).toHaveLength(1);
        expect(mockedSendFeedback).not.toHaveBeenCalled();
    });

    test("always resends the full transcript, ending on an agent turn", async () => {
        mockedStart.mockResolvedValue(turn(1, "ref-1") as any);
        mockedNext.mockResolvedValue(turn(2, "ref-2") as any);

        const form = makeForm();
        await form.generate("demo", {resume: false});

        answerCurrentQuestion("An answer");
        await form.next();

        const sent = lastNextRequest().conversation;
        expect(sent).toHaveLength(1);
        expect(sent[sent.length - 1].role).toBe("agent");
    });

    test("accumulates only base-question refs in askedRefs", async () => {
        mockedStart.mockResolvedValue(turn(1, "ref-1", true) as any);
        mockedNext
            .mockResolvedValueOnce(turn(2, "ref-2", false) as any)
            .mockResolvedValueOnce(turn(3, "ref-3", true) as any);

        const form = makeForm();
        await form.generate("demo", {resume: false});

        answerCurrentQuestion("a");
        await form.next();
        expect(lastNextRequest().askedRefs).toEqual(["ref-1"]);

        answerCurrentQuestion("b");
        await form.next();
        // ref-2 was AI-generated, so it must not be there.
        expect(lastNextRequest().askedRefs).toEqual(["ref-1"]);

        answerCurrentQuestion("c");
        mockedNext.mockResolvedValueOnce(turn(4, "ref-4") as any);
        await form.next();
        expect(lastNextRequest().askedRefs).toEqual(["ref-1", "ref-3"]);
    });

    test("ends on shouldEnd, showing a thank-you and firing onFinishEvent once", async () => {
        mockedStart.mockResolvedValue(turn(1, "ref-1") as any);
        mockedNext.mockResolvedValue({
            ...turn(2, "ref-2"),
            shouldEnd: true,
            nextQuestion: null,
            coverageSummary: "Covered onboarding.",
        } as any);

        const onFinishEvent = jest.fn();
        const form = makeForm();
        await form.generate("demo", {resume: false, onFinishEvent});

        answerCurrentQuestion("Done");
        await form.next();

        expect(form.completed).toBe(true);
        expect(document.querySelector(".magicfeedback-agent-end")).not.toBeNull();
        expect(onFinishEvent).toHaveBeenCalledTimes(1);
        expect(onFinishEvent).toHaveBeenCalledWith(expect.objectContaining({reason: "SHOULD_END"}));
        expect(mockedSendFeedback).not.toHaveBeenCalled();
    });

    test("ends politely when the answer is blocked, even without shouldEnd", async () => {
        mockedStart.mockResolvedValue(turn(1, "ref-1") as any);
        mockedNext.mockResolvedValue({
            ...turn(2, "ref-2"),
            shouldEnd: false,
            nextQuestion: null,
            answerType: "ABUSIVE_OR_OFFENSIVE",
        } as any);

        const onFinishEvent = jest.fn();
        const form = makeForm();
        await form.generate("demo", {resume: false, onFinishEvent, blockedMessage: "Let's stop here."});

        answerCurrentQuestion("something offensive");
        await form.next();

        expect(form.completed).toBe(true);
        expect(document.querySelector(".magicfeedback-agent-end--blocked")).not.toBeNull();
        expect(document.body.textContent).toContain("Let's stop here.");
        expect(onFinishEvent).toHaveBeenCalledWith(expect.objectContaining({reason: "BLOCKED"}));
    });

    test("a rate limit leaves the state untouched and keeps the question on screen", async () => {
        mockedStart.mockResolvedValue(turn(1, "ref-1") as any);
        mockedNext.mockRejectedValue(new AgentApiError("RATE_LIMITED", "slow down", 429, 30_000));

        const form = makeForm();
        await form.generate("demo", {resume: false});

        answerCurrentQuestion("An answer");
        await form.next();

        // Commit-after-success: a retry must resend an identical request.
        expect(form.getConversation()).toHaveLength(1);
        expect(form.completed).toBe(false);
        expect(document.body.textContent).toContain("Question 1?");
        expect(document.querySelector(".magicfeedback-error")).not.toBeNull();

        form.reset();
    });

    test("blocks an empty answer on a required question without advancing", async () => {
        mockedStart.mockResolvedValue(turn(1, "ref-1") as any);

        const form = makeForm();
        await form.generate("demo", {resume: false, requiredMessage: "Answer first"});

        answerCurrentQuestion("");
        await form.next();

        expect(mockedNext).not.toHaveBeenCalled();
        expect(form.getConversation()).toHaveLength(1);
        expect(document.body.textContent).toContain("Answer first");
    });

    test("ignores re-entrant submits while a turn is in flight", async () => {
        mockedStart.mockResolvedValue(turn(1, "ref-1") as any);
        mockedNext.mockImplementation(() => new Promise((resolve) =>
            setTimeout(() => resolve(turn(2, "ref-2") as any), 10)));

        const form = makeForm();
        await form.generate("demo", {resume: false});

        answerCurrentQuestion("An answer");
        // Auto-advance-on-select plus the submit button can fire in the same tick.
        await Promise.all([form.next(), form.next(), form.next()]);

        expect(mockedNext).toHaveBeenCalledTimes(1);
    });

    test("surfaces a start failure instead of rendering a broken form", async () => {
        mockedStart.mockRejectedValue(new AgentApiError("AUTH", "bad key", 406));

        const onLoadedEvent = jest.fn();
        const form = makeForm();
        await form.generate("demo", {resume: false, onLoadedEvent});

        expect(document.querySelector(".magicfeedback-error")).not.toBeNull();
        expect(onLoadedEvent).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.any(AgentApiError),
        }));
    });

    test("resumes an in-flight session after a reload without calling /start again", async () => {
        mockedStart.mockResolvedValue(turn(1, "ref-1", true) as any);
        mockedNext.mockResolvedValue(turn(2, "ref-2") as any);

        const first = makeForm();
        await first.generate("demo", {});
        answerCurrentQuestion("An answer");
        await first.next();

        // Simulate a page reload: fresh DOM, fresh instance, same localStorage.
        document.body.innerHTML = '<div id="demo"></div>';
        mockedStart.mockClear();

        const resumed = makeForm();
        await resumed.generate("demo", {});

        expect(mockedStart).not.toHaveBeenCalled();
        expect(resumed.getSessionId()).toBe("sess-1");
        expect(resumed.getConversation()).toHaveLength(3);
        expect(document.body.textContent).toContain("Question 2?");
    });

    test("reset clears the persisted snapshot", async () => {
        mockedStart.mockResolvedValue(turn(1, "ref-1") as any);

        const form = makeForm();
        await form.generate("demo", {});
        expect(localStorage.getItem(`magicfeedback-agent-${INTEGRATION}`)).not.toBeNull();

        form.reset();
        expect(localStorage.getItem(`magicfeedback-agent-${INTEGRATION}`)).toBeNull();
    });
});
