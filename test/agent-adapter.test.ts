import {beforeEach, describe, expect, jest, test} from "@jest/globals";

import {mapAgentType, ratingBounds, toAgentStep} from "../src/services/agentQuestion.adapter";
import {AgentNextResponse, AgentStartResponse, FEEDBACKAPPANSWERTYPE} from "../src/models/types";

const ctx = () => ({
    integrationId: "int-1",
    sessionId: "sess-1",
    language: "en",
    log: {log: jest.fn(), err: jest.fn()},
});

const startRes = (over: Partial<AgentStartResponse> = {}): AgentStartResponse => ({
    sessionId: "sess-1",
    nextQuestion: "How was onboarding?",
    questionType: "LONGTEXT",
    questionRef: "ref-1",
    questionValues: null,
    isFromBase: false,
    coverageGaps: "",
    maxTurns: 6,
    currentTurn: 1,
    ...over,
});

const nextRes = (over: Partial<AgentNextResponse> = {}): AgentNextResponse => ({
    ...startRes(),
    shouldEnd: false,
    answerType: "COMPLETE",
    topic: "OTHER",
    coverageSummary: "",
    ...over,
});

describe("agent adapter — type mapping", () => {
    let c: ReturnType<typeof ctx>;

    beforeEach(() => {
        c = ctx();
    });

    test.each([
        ["LONGTEXT", FEEDBACKAPPANSWERTYPE.LONGTEXT],
        ["TEXT", FEEDBACKAPPANSWERTYPE.TEXT],
        ["EMAIL", FEEDBACKAPPANSWERTYPE.EMAIL],
        ["NUMBER", FEEDBACKAPPANSWERTYPE.NUMBER],
        ["DATE", FEEDBACKAPPANSWERTYPE.DATE],
        ["RATING_STAR", FEEDBACKAPPANSWERTYPE.RATING_STAR],
        ["RATING_NUMBER", FEEDBACKAPPANSWERTYPE.RATING_NUMBER],
    ])("passes %s through untouched", (input, expected) => {
        expect(mapAgentType(input, [], c)).toBe(expected);
    });

    test("maps the bare RATING (not in the enum) to RATING_NUMBER", () => {
        expect(mapAgentType("RATING", [], c)).toBe(FEEDBACKAPPANSWERTYPE.RATING_NUMBER);
    });

    test("maps CONTACT to TEXT — it is in the enum but has NO registered renderer", () => {
        expect(mapAgentType("CONTACT", [], c)).toBe(FEEDBACKAPPANSWERTYPE.TEXT);
    });

    test("falls back to TEXT for an unknown type instead of throwing", () => {
        expect(mapAgentType("FOO_BAR", [], c)).toBe(FEEDBACKAPPANSWERTYPE.TEXT);
        expect(c.log.err).toHaveBeenCalled();
    });

    test("falls back to TEXT for an empty/missing type", () => {
        expect(mapAgentType(undefined, [], c)).toBe(FEEDBACKAPPANSWERTYPE.TEXT);
    });

    test.each(["RADIO", "MULTIPLECHOICE", "SELECT"])(
        "downgrades %s with no options to TEXT (it would render an empty div)",
        (type) => {
            expect(mapAgentType(type, [], c)).toBe(FEEDBACKAPPANSWERTYPE.TEXT);
        },
    );

    test("keeps a choice type when options are present", () => {
        expect(mapAgentType("RADIO", ["A", "B"], c)).toBe(FEEDBACKAPPANSWERTYPE.RADIO);
    });

    test("keeps BOOLEAN for a real Yes/No pair", () => {
        expect(mapAgentType("BOOLEAN", ["Yes", "No"], c)).toBe(FEEDBACKAPPANSWERTYPE.BOOLEAN);
        expect(mapAgentType("BOOLEAN", [], c)).toBe(FEEDBACKAPPANSWERTYPE.BOOLEAN);
    });

    test("maps BOOLEAN with custom options to RADIO (renderBoolean would drop them)", () => {
        expect(mapAgentType("BOOLEAN", ["Agree", "Disagree"], c)).toBe(FEEDBACKAPPANSWERTYPE.RADIO);
    });

    test("recognizes the localized Yes/No pair", () => {
        const es = {...c, language: "es"};
        expect(mapAgentType("BOOLEAN", ["Sí", "No"], es)).toBe(FEEDBACKAPPANSWERTYPE.BOOLEAN);
    });
});

describe("agent adapter — rating bounds", () => {
    test("derives the scale from numeric option values", () => {
        expect(ratingBounds(["1", "2", "3", "4", "5", "6", "7"])).toEqual({min: 1, max: 7});
    });

    test("falls back to 1-5, not the NPS 0-10 default of the renderer", () => {
        expect(ratingBounds([])).toEqual({min: 1, max: 5});
        expect(ratingBounds(["good"])).toEqual({min: 1, max: 5});
    });
});

describe("agent adapter — end detection", () => {
    test("ends on shouldEnd", () => {
        const step = toAgentStep(nextRes({shouldEnd: true}), ctx());
        expect(step.kind).toBe("END");
        expect(step.kind === "END" && step.reason).toBe("SHOULD_END");
    });

    test("ends on a null question even when shouldEnd is false", () => {
        const step = toAgentStep(nextRes({shouldEnd: false, nextQuestion: null}), ctx());
        expect(step.kind).toBe("END");
        expect(step.kind === "END" && step.reason).toBe("NO_QUESTION");
    });

    test("ends on questionType NONE even when shouldEnd is false", () => {
        const step = toAgentStep(nextRes({shouldEnd: false, questionType: "NONE"}), ctx());
        expect(step.kind).toBe("END");
        expect(step.kind === "END" && step.reason).toBe("TYPE_NONE");
    });

    test("ends as BLOCKED on an abusive answer even when shouldEnd is false", () => {
        const step = toAgentStep(
            nextRes({shouldEnd: false, answerType: "ABUSIVE_OR_OFFENSIVE"}),
            ctx(),
        );
        expect(step.kind).toBe("END");
        expect(step.kind === "END" && step.reason).toBe("BLOCKED");
    });

    test("BLOCKED wins over shouldEnd when both are set", () => {
        const step = toAgentStep(
            nextRes({shouldEnd: true, answerType: "ABUSIVE_OR_OFFENSIVE"}),
            ctx(),
        );
        expect(step.kind === "END" && step.reason).toBe("BLOCKED");
    });

    test("treats a whitespace-only question as no question", () => {
        const step = toAgentStep(nextRes({nextQuestion: "   "}), ctx());
        expect(step.kind === "END" && step.reason).toBe("NO_QUESTION");
    });

    test("continues on a normal turn", () => {
        const step = toAgentStep(nextRes(), ctx());
        expect(step.kind).toBe("QUESTION");
    });
});

describe("agent adapter — question building", () => {
    test("builds a renderable NativeQuestion from the flat payload", () => {
        const step = toAgentStep(
            startRes({questionType: "RADIO", questionValues: ["A", "B"], isFromBase: true}),
            ctx(),
        );

        if (step.kind !== "QUESTION") throw new Error("expected a question");

        expect(step.question.title).toBe("How was onboarding?");
        expect(step.question.type).toBe(FEEDBACKAPPANSWERTYPE.RADIO);
        expect(step.question.ref).toBe("ref-1");
        expect(step.question.value).toEqual(["A", "B"]);
        expect(step.question.require).toBe(true);
        expect(step.question.position).toBe(1);
        expect(step.question.integrationId).toBe("int-1");
        expect(step.isFromBase).toBe(true);
    });

    test("keeps questionType.conf falsy — a truthy conf makes renderQuestions recurse", () => {
        const step = toAgentStep(startRes(), ctx());
        if (step.kind !== "QUESTION") throw new Error("expected a question");
        expect(step.question.questionType?.conf).toBeFalsy();
    });

    test("copies questionValues instead of aliasing them (renderChoice mutates in place)", () => {
        const res = startRes({questionType: "RADIO", questionValues: ["A", "B"]});
        const step = toAgentStep(res, ctx());
        if (step.kind !== "QUESTION") throw new Error("expected a question");

        step.question.value.push("MUTATED");

        expect(res.questionValues).toEqual(["A", "B"]);
    });

    test("falls back to a synthesized ref when the server sends none", () => {
        const step = toAgentStep(startRes({questionRef: undefined, currentTurn: 3}), ctx());
        if (step.kind !== "QUESTION") throw new Error("expected a question");
        expect(step.question.ref).toBe("agent-q-3");
    });

    test("derives a rating scale rather than inheriting the renderer's NPS default", () => {
        const step = toAgentStep(
            startRes({questionType: "RATING", questionValues: ["1", "2", "3"]}),
            ctx(),
        );
        if (step.kind !== "QUESTION") throw new Error("expected a question");
        expect(step.question.assets.min).toBe(1);
        expect(step.question.assets.max).toBe(3);
    });

    test("produces the same result whether the payload is flat or a full NativeQuestion", () => {
        const flat = toAgentStep(
            startRes({questionType: "RADIO", questionValues: ["A", "B"]}),
            ctx(),
        );

        const full = toAgentStep(
            startRes({
                nextQuestion: null,
                question: {
                    title: "How was onboarding?",
                    type: "RADIO",
                    ref: "ref-1",
                    value: ["A", "B"],
                    require: true,
                } as any,
            }),
            ctx(),
        );

        if (flat.kind !== "QUESTION" || full.kind !== "QUESTION") throw new Error("expected questions");

        expect(full.question.title).toBe(flat.question.title);
        expect(full.question.type).toBe(flat.question.type);
        expect(full.question.ref).toBe(flat.question.ref);
        expect(full.question.value).toEqual(flat.question.value);
    });

    test("re-runs the type mapper over a full question object too", () => {
        const step = toAgentStep(
            startRes({
                nextQuestion: null,
                question: {title: "Rate it", type: "RATING", ref: "r", value: []} as any,
            }),
            ctx(),
        );
        if (step.kind !== "QUESTION") throw new Error("expected a question");
        expect(step.question.type).toBe(FEEDBACKAPPANSWERTYPE.RATING_NUMBER);
    });
});
