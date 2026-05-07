/**
 * @jest-environment jsdom
 */
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";

import main from "../src/main";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";

jest.mock("../src/services/request.service", () => ({
    sendFeedback: jest.fn(),
    getFollowUpQuestion: jest.fn(),
    getForm: jest.fn(),
    getSessionForm: jest.fn(),
    validateEmail: jest.fn(() => true),
}));

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

describe("sdk.previewPage", () => {
    let container: HTMLElement;
    let requestService: any;
    let logSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        container = document.createElement("div");
        container.id = "preview-container";
        document.body.appendChild(container);
        jest.clearAllMocks();
        requestService = require("../src/services/request.service");
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        container.remove();
        logSpy.mockRestore();
    });

    test("renders a single page from the provided page input without calling getForm", async () => {
        const sdk = main();
        sdk.init();

        const questions = [
            buildQuestion({
                id: "1",
                ref: "name",
                title: "Name",
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                position: 1,
            }),
            buildQuestion({
                id: "2",
                ref: "email",
                title: "Email",
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                position: 2,
            }),
        ];

        await sdk.previewPage("preview-container", {
            page: {
                id: "page-1",
                position: 1,
                integrationQuestions: questions,
            },
            identity: "MAGICFORM",
            lang: "en",
        });

        const formEl = container.querySelector("form");
        const inputs = container.querySelectorAll("input");

        expect(formEl).not.toBeNull();
        expect(inputs.length).toBeGreaterThanOrEqual(2);
        expect(requestService.getForm).not.toHaveBeenCalled();
        expect(requestService.getSessionForm).not.toHaveBeenCalled();
    });

    test("submitting the preview does not call POST /feedback (dryRun is forced)", async () => {
        const sdk = main();
        sdk.init();

        const questions = [
            buildQuestion({id: "1", ref: "name", title: "Name", position: 1}),
        ];

        const form = await sdk.previewPage("preview-container", {
            page: {integrationQuestions: questions},
        });

        // Simulate caller-driven submit on the rendered form.
        await (form as any).send();

        expect(requestService.sendFeedback).not.toHaveBeenCalled();
    });

    test("only renders the questions from the provided page (no API fetch)", async () => {
        const sdk = main();
        sdk.init();

        const provided = [
            buildQuestion({id: "10", ref: "only", title: "Only one", position: 1}),
        ];

        await sdk.previewPage("preview-container", {
            page: {integrationQuestions: provided},
            lang: "es",
        });

        const labels = container.querySelectorAll("label.magicfeedback-label");
        // Exactly one rendered question in this preview.
        expect(labels.length).toBe(1);
        expect(requestService.getForm).not.toHaveBeenCalled();
    });
});
