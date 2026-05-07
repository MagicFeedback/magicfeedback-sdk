import {
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";

import main from "../src/main";
import {Config} from "../src/models/config";
import {Form} from "../src/models/form";
import {FEEDBACKAPPANSWERTYPE, NativeFeedback, NativeQuestion} from "../src/models/types";

jest.mock("../src/services/request.service", () => ({
    sendFeedback: jest.fn(),
    getFollowUpQuestion: jest.fn(),
    getForm: jest.fn(),
    getSessionForm: jest.fn(),
    validateEmail: jest.fn(() => true),
}));

describe("Dry run mode", () => {
    let requestService: any;

    beforeEach(() => {
        jest.clearAllMocks();
        requestService = require("../src/services/request.service");
    });

    test("main.send skips API call when dryRun is enabled", async () => {
        const sdk = main();
        sdk.init({dryRun: true});

        const payload: NativeFeedback = {
            text: "",
            answers: [{key: "q1", value: ["a1"]}],
            profile: [],
            metrics: [],
            metadata: [],
        };

        const response = await sdk.send("app-id", "public-key", payload);

        expect(requestService.sendFeedback).not.toHaveBeenCalled();
        expect(response).toMatch(/^dry-run-/);
    });

    test("Form skips feedback API call but still calls followup API when dryRun is enabled", async () => {
        const config = new Config();
        config.set("url", "https://example.com");
        config.set("dryRun", true);

        const form = new Form(config, "app-id", "public-key");
        (form as any).feedback.answers = [{key: "q-2", value: ["a1"]}];

        const sessionId = await (form as any).pushAnswers(false);
        expect(sessionId).toMatch(/^dry-run-app-id-/);
        expect(requestService.sendFeedback).not.toHaveBeenCalled();

        const followupQuestion: NativeQuestion = {
            id: "q-2",
            title: "Followup",
            type: FEEDBACKAPPANSWERTYPE.TEXT,
            questionType: {conf: null},
            ref: "q-2",
            require: false,
            external_id: "",
            value: [],
            defaultValue: "",
            appId: "app-id",
            followup: true,
            position: 2,
            assets: {},
            refMetric: "",
            integrationId: "integration-id",
            integrationPageId: "page-id",
            generatedAt: null,
            updatedAt: null,
            status: "ACTIVE",
            followupQuestion: [],
        };

        const followupResponse: NativeQuestion = {...followupQuestion, id: "q-2-followup", ref: "q-2-followup"};
        requestService.getFollowUpQuestion.mockResolvedValueOnce(followupResponse);

        const followup = await (form as any).callFollowUpQuestion(followupQuestion);

        expect(requestService.getFollowUpQuestion).toHaveBeenCalledTimes(1);
        expect(followup).toEqual(followupResponse);
    });
});
