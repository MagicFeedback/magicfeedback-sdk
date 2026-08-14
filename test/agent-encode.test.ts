import {describe, expect, test} from "@jest/globals";

import {encodeAnswer} from "../src/services/agentQuestion.adapter";
import {FEEDBACKAPPANSWERTYPE, NativeAnswer, NativeQuestion} from "../src/models/types";

const question = (type: FEEDBACKAPPANSWERTYPE, ref = "q1"): NativeQuestion => ({
    id: "id-1",
    title: "A question",
    type,
    questionType: {conf: null} as any,
    ref,
    require: true,
    external_id: "",
    value: [],
    defaultValue: "",
    followup: false,
    position: 1,
    assets: {},
    refMetric: "",
    integrationId: "int-1",
    integrationPageId: "",
});

describe("encodeAnswer", () => {
    test("returns the raw string for open text", () => {
        const answers: NativeAnswer[] = [{key: "q1", value: ["It was confusing at first"]}];
        expect(encodeAnswer(answers, question(FEEDBACKAPPANSWERTYPE.LONGTEXT)))
            .toBe("It was confusing at first");
    });

    test("joins MULTIPLECHOICE arriving as separate same-key entries", () => {
        // This is what the generic DOM scrape actually emits: one entry per
        // checked box, all sharing the question's ref as key.
        const answers: NativeAnswer[] = [
            {key: "q1", value: ["A"]},
            {key: "q1", value: ["B"]},
            {key: "q1", value: ["C"]},
        ];
        expect(encodeAnswer(answers, question(FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE)))
            .toBe("A, B, C");
    });

    test("honours a custom delimiter", () => {
        const answers: NativeAnswer[] = [
            {key: "q1", value: ["A"]},
            {key: "q1", value: ["B"]},
        ];
        expect(encodeAnswer(answers, question(FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE), " | "))
            .toBe("A | B");
    });

    test("dedupes repeated values while preserving order", () => {
        const answers: NativeAnswer[] = [
            {key: "q1", value: ["B"]},
            {key: "q1", value: ["A"]},
            {key: "q1", value: ["B"]},
        ];
        expect(encodeAnswer(answers, question(FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE)))
            .toBe("B, A");
    });

    test("returns the picked value for RADIO and RATING", () => {
        expect(encodeAnswer([{key: "q1", value: ["Weekly"]}], question(FEEDBACKAPPANSWERTYPE.RADIO)))
            .toBe("Weekly");
        expect(encodeAnswer([{key: "q1", value: ["7"]}], question(FEEDBACKAPPANSWERTYPE.RATING_NUMBER)))
            .toBe("7");
    });

    test("returns the boolean literal", () => {
        expect(encodeAnswer([{key: "q1", value: ["Yes"]}], question(FEEDBACKAPPANSWERTYPE.BOOLEAN)))
            .toBe("Yes");
    });

    test("joins an ordered PRIORITY_LIST", () => {
        const answers: NativeAnswer[] = [{key: "q1", value: ["1. First", "2. Second"]}];
        expect(encodeAnswer(answers, question(FEEDBACKAPPANSWERTYPE.PRIORITY_LIST)))
            .toBe("1. First, 2. Second");
    });

    test("stringifies non-string values such as a matrix payload", () => {
        const answers: NativeAnswer[] = [{key: "q1", value: [[{key: "row1", value: ["3"]}]]}];
        expect(encodeAnswer(answers, question(FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX)))
            .toBe(JSON.stringify([{key: "row1", value: ["3"]}]));
    });

    test("appends the extra-option text", () => {
        const answers: NativeAnswer[] = [
            {key: "q1", value: ["Other"]},
            {key: "extra-option-q1", value: ["Because of the pricing"]},
        ];
        expect(encodeAnswer(answers, question(FEEDBACKAPPANSWERTYPE.RADIO)))
            .toBe("Other, Because of the pricing");
    });

    test("ignores answers belonging to other questions", () => {
        const answers: NativeAnswer[] = [
            {key: "other", value: ["nope"]},
            {key: "q1", value: ["yes"]},
        ];
        expect(encodeAnswer(answers, question(FEEDBACKAPPANSWERTYPE.TEXT))).toBe("yes");
    });

    test("returns an empty string for no answer or whitespace only", () => {
        expect(encodeAnswer([], question(FEEDBACKAPPANSWERTYPE.TEXT))).toBe("");
        expect(encodeAnswer([{key: "q1", value: ["   "]}], question(FEEDBACKAPPANSWERTYPE.TEXT))).toBe("");
        expect(encodeAnswer([{key: "q1", value: []}], question(FEEDBACKAPPANSWERTYPE.TEXT))).toBe("");
    });
});
