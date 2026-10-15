import {beforeEach, describe, expect, jest, test} from "@jest/globals";

import {Config} from "../src/models/config";
import {Form} from "../src/models/form";
import {Page} from "../src/models/page";
import {PageGraph} from "../src/models/pageGraphs";
import {PageNode} from "../src/models/pageNode";
import {ConditionType, OperatorType, PageRoute, TransitionType} from "../src/models/pageRoute";
import {FEEDBACKAPPANSWERTYPE, NativeAnswer, NativeQuestion} from "../src/models/types";

jest.mock("../src/services/request.service", () => ({
    sendFeedback: jest.fn(),
    getFollowUpQuestion: jest.fn(),
    getForm: jest.fn(),
    getSessionForm: jest.fn(),
    validateEmail: jest.fn(() => true),
}));

const question = (ref: string, title: string, type: FEEDBACKAPPANSWERTYPE = FEEDBACKAPPANSWERTYPE.TEXT, followup = false): NativeQuestion => ({
    id: ref, title, type, questionType: {conf: null}, ref, require: false, external_id: "", value: [],
    defaultValue: "", appId: "app-id", followup, position: 1, assets: {}, refMetric: "",
    integrationId: "integration-1", integrationPageId: ref, generatedAt: null, updatedAt: null,
    status: "ACTIVE", followupQuestion: [],
});

const logical = (id: string, questionRef: string, value: string[], destiny: string, pageId: string) =>
    new PageRoute(id, questionRef, OperatorType.EQUAL, value, TransitionType.PAGE, destiny, pageId, ConditionType.LOGICAL);

const allow = (id: string, questionRef: string, value: string[], pageId: string) =>
    new PageRoute(id, questionRef, OperatorType.EQUAL, value, TransitionType.ALLOW, "", pageId, ConditionType.PRECONDITIONAL);

const finish = (id: string, pageId: string) =>
    new PageRoute(id, "", OperatorType.DEFAULT, [], TransitionType.FINISH, "", pageId, ConditionType.DIRECT);

/**
 * A form over `pages`, with the respondent having gone through `path` (page
 * ids, the last one being the page being answered) with `answers` per page.
 */
const setup = (pages: Page[], path: string[], answers: Record<string, NativeAnswer[]>): Form => {
    const config = new Config();
    config.set("url", "https://example.com");
    const form = new Form(config, "app-id", "public-key");
    const graph = new PageGraph(pages);
    (form as any).graph = graph;
    for (const id of path) {
        const node = graph.getNodeById(id) as PageNode;
        node.setAnswer(answers[id] ?? []);
        (form as any).history.enqueue(node);
    }
    return form;
};

describe("Follow up context", () => {
    let requestService: any;

    beforeEach(() => {
        jest.clearAllMocks();
        requestService = require("../src/services/request.service");
    });

    describe("previousAnswers", () => {
        test("lists what was answered, earliest first, without the question being followed up", () => {
            const current = question("q3", "Uddyb gerne", FEEDBACKAPPANSWERTYPE.LONGTEXT, true);
            const pages = [
                new Page("p1", 1, "integration-1", [question("q1", "Hvad gjorde vi godt?"), question("mail", "Email", FEEDBACKAPPANSWERTYPE.EMAIL)], []),
                new Page("p2", 2, "integration-1", [question("q2", "Fik du den service du forventede?", FEEDBACKAPPANSWERTYPE.BOOLEAN), current], []),
            ];
            const form = setup(pages, ["p1", "p2"], {
                p1: [{key: "q1", value: ["Personalet var venlige"]}, {key: "mail", value: ["a@b.c"]}],
                p2: [{key: "q2", value: ["Yes"]}, {key: "q3", value: ["Godt"]}],
            });

            expect((form as any).previousAnswers(current)).toEqual([
                {title: "Hvad gjorde vi godt?", answer: "Personalet var venlige"},
                {title: "Fik du den service du forventede?", answer: true},
            ]);
        });

        test("leaves out blank answers and keeps a multiple choice as a list", () => {
            const current = question("q3", "Current", FEEDBACKAPPANSWERTYPE.TEXT, true);
            const pages = [
                new Page("p1", 1, "integration-1", [question("q1", "Optional"), question("q2", "Which?", FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE), current], []),
            ];
            const form = setup(pages, ["p1"], {
                p1: [{key: "q1", value: [""]}, {key: "q2", value: ["A", "B"]}, {key: "q3", value: ["x"]}],
            });

            expect((form as any).previousAnswers(current)).toEqual([{title: "Which?", answer: ["A", "B"]}]);
        });

        test("includes the answers given to earlier follow ups", () => {
            const current = question("q2", "Second", FEEDBACKAPPANSWERTYPE.TEXT, true);
            const pages = [
                new Page("p1", 1, "integration-1", [question("q1", "First", FEEDBACKAPPANSWERTYPE.TEXT, true)], []),
                new Page("p2", 2, "integration-1", [current], []),
            ];
            const form = setup(pages, ["p1"], {p1: [{key: "q1", value: ["Good"]}]});
            const followUp = question("q1-followup", "Why good?");
            const followUpNode = new PageNode("p1", 1, [], new Page("p1", 1, "integration-1", [followUp], []), [followUp], true);
            followUpNode.setAnswer([{key: "q1-followup", value: ["Fast"]}]);
            (form as any).history.enqueue(followUpNode);
            const p2 = (form as any).graph.getNodeById("p2") as PageNode;
            p2.setAnswer([{key: "q2", value: ["x"]}]);
            (form as any).history.enqueue(p2);

            expect((form as any).previousAnswers(current)).toEqual([
                {title: "First", answer: "Good"},
                {title: "Why good?", answer: "Fast"},
            ]);
        });
    });

    describe("upcomingQuestions", () => {
        test("lists the questions of the pages ahead, soonest first, without info pages", () => {
            const pages = [
                new Page("p1", 1, "integration-1", [question("q1", "Q1", FEEDBACKAPPANSWERTYPE.TEXT, true)], []),
                new Page("p2", 2, "integration-1", [question("info", "Thanks so far", FEEDBACKAPPANSWERTYPE.INFO_PAGE), question("q2", "Q2")], []),
                new Page("p3", 3, "integration-1", [question("q3", "Q3"), question("q4", "Q4")], []),
            ];
            const form = setup(pages, ["p1"], {p1: [{key: "q1", value: ["a"]}]});

            expect((form as any).upcomingQuestions()).toEqual([{title: "Q2"}, {title: "Q3"}, {title: "Q4"}]);
        });

        test("follows the route the current answer takes", () => {
            const pages = [
                new Page("p1", 1, "integration-1", [question("q1", "Q1", FEEDBACKAPPANSWERTYPE.RADIO, true)], [logical("r1", "q1", ["No"], "p3", "p1")]),
                new Page("p2", 2, "integration-1", [question("q2", "Q2")], []),
                new Page("p3", 3, "integration-1", [question("q3", "Q3")], []),
            ];
            const form = setup(pages, ["p1"], {p1: [{key: "q1", value: ["No"]}]});

            expect((form as any).upcomingQuestions()).toEqual([{title: "Q3"}]);
        });

        test("stops after a page whose way out depends on its own answer", () => {
            const pages = [
                new Page("p1", 1, "integration-1", [question("q1", "Q1", FEEDBACKAPPANSWERTYPE.TEXT, true)], []),
                new Page("p2", 2, "integration-1", [question("q2", "Q2", FEEDBACKAPPANSWERTYPE.RADIO)], [logical("r2", "q2", ["No"], "p4", "p2")]),
                new Page("p3", 3, "integration-1", [question("q3", "Q3")], []),
                new Page("p4", 4, "integration-1", [question("q4", "Q4")], []),
            ];
            const form = setup(pages, ["p1"], {p1: [{key: "q1", value: ["a"]}]});

            expect((form as any).upcomingQuestions()).toEqual([{title: "Q2"}]);
        });

        test("skips a page whose preconditions are not met, and stops at one that depends on an unanswered question", () => {
            const pages = [
                new Page("p1", 1, "integration-1", [question("q1", "Q1", FEEDBACKAPPANSWERTYPE.RADIO, true)], []),
                new Page("p2", 2, "integration-1", [question("q2", "Q2")], [allow("a2", "q1", ["Yes"], "p2")]),
                new Page("p3", 3, "integration-1", [question("q3", "Q3")], [allow("a3", "q1", ["No"], "p3")]),
                new Page("p4", 4, "integration-1", [question("q4", "Q4")], [allow("a4", "q3", ["x"], "p4")]),
                new Page("p5", 5, "integration-1", [question("q5", "Q5")], []),
            ];
            const form = setup(pages, ["p1"], {p1: [{key: "q1", value: ["No"]}]});

            expect((form as any).upcomingQuestions()).toEqual([{title: "Q3"}]);
        });

        test("lists a question served over several pages once", () => {
            const maxDiff = question("md", "Most and least important?", FEEDBACKAPPANSWERTYPE.MAX_DIFF);
            const pages = [
                new Page("p1", 1, "integration-1", [question("q1", "Q1", FEEDBACKAPPANSWERTYPE.TEXT, true)], []),
                new Page("p2", 2, "integration-1", [maxDiff], []),
                new Page("p3", 3, "integration-1", [maxDiff], []),
                new Page("p4", 4, "integration-1", [question("q4", "Q4")], []),
            ];
            const form = setup(pages, ["p1"], {p1: [{key: "q1", value: ["a"]}]});

            expect((form as any).upcomingQuestions()).toEqual([{title: "Most and least important?"}, {title: "Q4"}]);
        });

        test("is empty when the survey finishes after the current page", () => {
            const pages = [
                new Page("p1", 1, "integration-1", [question("q1", "Q1", FEEDBACKAPPANSWERTYPE.TEXT, true)], [finish("f1", "p1")]),
                new Page("p2", 2, "integration-1", [question("q2", "Q2")], []),
            ];
            const form = setup(pages, ["p1"], {p1: [{key: "q1", value: ["a"]}]});

            expect((form as any).upcomingQuestions()).toEqual([]);
        });

        test("on a follow up page, routes from the page that produced it", () => {
            const pages = [
                new Page("p1", 1, "integration-1", [question("q1", "Q1", FEEDBACKAPPANSWERTYPE.RADIO, true)], [logical("r1", "q1", ["No"], "p3", "p1")]),
                new Page("p2", 2, "integration-1", [question("q2", "Q2")], []),
                new Page("p3", 3, "integration-1", [question("q3", "Q3")], []),
            ];
            const form = setup(pages, ["p1"], {p1: [{key: "q1", value: ["No"]}]});
            const origin = (form as any).graph.getNodeById("p1") as PageNode;
            const followUp = question("q1-followup", "Why?");
            const followUpNode = new PageNode("p1", 1, origin.edges, new Page("p1", 1, "integration-1", [followUp], []), [followUp], true);
            followUpNode.origin = origin;
            (form as any).history.enqueue(followUpNode);

            expect((form as any).upcomingQuestions()).toEqual([{title: "Q3"}]);
        });
    });

    test("the follow up request carries both lists", async () => {
        const current = question("q2", "Q2", FEEDBACKAPPANSWERTYPE.TEXT, true);
        const pages = [
            new Page("p1", 1, "integration-1", [question("q1", "Q1")], []),
            new Page("p2", 2, "integration-1", [current], []),
            new Page("p3", 3, "integration-1", [question("q3", "Q3")], []),
        ];
        const form = setup(pages, ["p1", "p2"], {
            p1: [{key: "q1", value: ["first"]}],
            p2: [{key: "q2", value: ["Godt"]}],
        });
        (form as any).feedback.answers = [{key: "q2", value: ["Godt"]}];
        requestService.getFollowUpQuestion.mockResolvedValueOnce(null);

        await (form as any).callFollowUpQuestion(current);

        const body = requestService.getFollowUpQuestion.mock.calls[0][1];
        expect(body.answer).toBe("Godt");
        expect(body.previousAnswers).toEqual([{title: "Q1", answer: "first"}]);
        expect(body.upcomingQuestions).toEqual([{title: "Q3"}]);
    });
});
