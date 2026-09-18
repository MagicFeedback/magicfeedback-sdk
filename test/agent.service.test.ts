import {beforeEach, describe, expect, jest, test} from "@jest/globals";

import fetch from "cross-fetch";
import {Log} from "../src/utils/log";
import {endpoints} from "../src/services/paths";
import {nextAgentTurn, startAgentSurvey} from "../src/services/agent.service";
import {AgentApiError} from "../src/services/agentErrors";
import {AgentNextRequest, AgentStartRequest} from "../src/models/types";

jest.mock("cross-fetch");

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

const okResponse = (json: any) => Promise.resolve({
    ok: true,
    status: 200,
    json: async () => json,
} as Response);

const errorResponse = (status: number, body: any = {}, headers: Record<string, string> = {}) =>
    Promise.resolve({
        ok: false,
        status,
        statusText: `HTTP ${status}`,
        headers: {get: (k: string) => headers[k] ?? null},
        json: async () => body,
    } as unknown as Response);

const url = "http://example.com/";

const startBody: AgentStartRequest = {
    publicKey: "pk_test",
    integrationId: "int-1",
};

const nextBody: AgentNextRequest = {
    ...startBody,
    sessionId: "sess-1",
    conversation: [],
    currentTurn: 2,
    lastAnswer: "It was fine",
};

describe("agent.service", () => {
    let logMock: Log;

    beforeEach(() => {
        jest.clearAllMocks();
        logMock = {log: jest.fn(), err: jest.fn()} as unknown as Log;
    });

    test("POSTs to the start endpoint with the SDK version header", async () => {
        mockedFetch.mockResolvedValue(await okResponse({sessionId: "sess-1"}));

        const result = await startAgentSurvey(url, startBody, logMock);

        expect(mockedFetch).toHaveBeenCalledWith(
            `${url}${endpoints.sdk.agentSurveyStart}`,
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "Content-Type": "application/json",
                    "Magicfeedback-Sdk-Version": expect.any(String),
                }),
                body: JSON.stringify(startBody),
            }),
        );
        expect(result).toEqual({sessionId: "sess-1"});
    });

    test("POSTs to the next endpoint", async () => {
        mockedFetch.mockResolvedValue(await okResponse({shouldEnd: false}));

        await nextAgentTurn(url, nextBody, logMock);

        expect(mockedFetch).toHaveBeenCalledWith(
            `${url}${endpoints.sdk.agentSurveyNext}`,
            expect.objectContaining({method: "POST"}),
        );
    });

    test("429 becomes RATE_LIMITED and reads Retry-After (seconds)", async () => {
        mockedFetch.mockResolvedValue(await errorResponse(429, {}, {"Retry-After": "30"}));

        await expect(startAgentSurvey(url, startBody, logMock)).rejects.toMatchObject({
            kind: "RATE_LIMITED",
            retryAfterMs: 30_000,
        });
    });

    test("429 without Retry-After falls back to ~60s", async () => {
        mockedFetch.mockResolvedValue(await errorResponse(429));

        await expect(nextAgentTurn(url, nextBody, logMock)).rejects.toMatchObject({
            kind: "RATE_LIMITED",
            retryAfterMs: 60_000,
        });
    });

    test("406 becomes AUTH — the API uses 406, not 401/403, for bad keys", async () => {
        mockedFetch.mockResolvedValue(await errorResponse(406));

        await expect(startAgentSurvey(url, startBody, logMock)).rejects.toMatchObject({kind: "AUTH"});
    });

    test("404 becomes NOT_FOUND", async () => {
        mockedFetch.mockResolvedValue(await errorResponse(404));
        await expect(startAgentSurvey(url, startBody, logMock)).rejects.toMatchObject({kind: "NOT_FOUND"});
    });

    test("400 becomes BAD_CONFIG (not AGENT mode, or empty agentBrief)", async () => {
        mockedFetch.mockResolvedValue(await errorResponse(400, {message: "Integration is not in AGENT mode"}));

        await expect(startAgentSurvey(url, startBody, logMock)).rejects.toMatchObject({
            kind: "BAD_CONFIG",
            message: "Integration is not in AGENT mode",
        });
    });

    test("422 becomes BAD_CONFIG — what the API really returns for schema failures", async () => {
        // Verified against api-dev.deepdots.com and api.deepdots.com: a missing
        // required field yields 422, not the 400 the spec documents.
        mockedFetch.mockResolvedValue(await errorResponse(422, {
            error: {message: "The request body is invalid"},
        }));

        await expect(startAgentSurvey(url, startBody, logMock)).rejects.toMatchObject({
            kind: "BAD_CONFIG",
            message: "The request body is invalid",
        });
    });

    test("reads the API's nested error.message envelope", async () => {
        mockedFetch.mockResolvedValue(await errorResponse(406, {
            error: {statusCode: 406, name: "NotAcceptableError", message: "Public key not found"},
        }));

        await expect(startAgentSurvey(url, startBody, logMock)).rejects.toMatchObject({
            kind: "AUTH",
            message: "Public key not found",
        });
    });

    test("500 on /start becomes AI_UNAVAILABLE and is retryable", async () => {
        mockedFetch.mockResolvedValue(await errorResponse(500));

        try {
            await startAgentSurvey(url, startBody, logMock);
            throw new Error("should have thrown");
        } catch (e) {
            expect(e).toBeInstanceOf(AgentApiError);
            expect((e as AgentApiError).kind).toBe("AI_UNAVAILABLE");
            expect((e as AgentApiError).retryable).toBe(true);
        }
    });

    test("a rejected fetch becomes NETWORK", async () => {
        mockedFetch.mockRejectedValue(new Error("connection refused"));

        await expect(nextAgentTurn(url, nextBody, logMock)).rejects.toMatchObject({kind: "NETWORK"});
    });

    test("THE ASYMMETRY: an AI outage on /next is a 200 with shouldEnd, never an error", async () => {
        mockedFetch.mockResolvedValue(await okResponse({
            shouldEnd: true,
            answerType: "COMPLETE",
            nextQuestion: null,
            currentTurn: 2,
            maxTurns: 6,
        }));

        const result = await nextAgentTurn(url, nextBody, logMock);

        expect(result.shouldEnd).toBe(true);
    });
});
