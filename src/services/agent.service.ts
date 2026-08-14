import fetch from "cross-fetch";
import {header} from "./request.service";
import {endpoints} from "./paths";
import {Log} from "../utils/log";
import {AgentApiError, mapAgentStatus} from "./agentErrors";
import {
    AgentNextRequest,
    AgentNextResponse,
    AgentStartRequest,
    AgentStartResponse,
} from "../models/types";

const DEFAULT_RETRY_AFTER_MS = 60_000;

/** Reads `Retry-After` (seconds). Falls back to the documented ~60s window. */
function parseRetryAfter(response: any): number {
    const raw = response?.headers?.get?.("Retry-After");
    const seconds = raw ? Number(raw) : NaN;
    return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : DEFAULT_RETRY_AFTER_MS;
}

async function postAgent<T>(
    url: string,
    path: string,
    body: unknown,
    log: Log,
    phase: "start" | "next",
): Promise<T> {
    let response: Response;

    try {
        response = await fetch(url + path, {
            method: "POST",
            headers: {...{"Content-Type": "application/json"}, ...header},
            body: JSON.stringify(body),
        });
    } catch (e: any) {
        log.err(`[agentSurvey/${phase}] network error`, e);
        throw new AgentApiError("NETWORK", e?.message || "Network error");
    }

    if (!response.ok) {
        let errBody: any = null;
        try {
            errBody = await response.json();
        } catch (e) {
            // The error body may be empty or not JSON; the status is what matters.
        }

        const kind = mapAgentStatus(response.status, phase);
        log.err(`[agentSurvey/${phase}] ${response.status}`, errBody);

        throw new AgentApiError(
            kind,
            errBody?.error?.message || errBody?.message || response.statusText,
            response.status,
            kind === "RATE_LIMITED" ? parseRetryAfter(response) : undefined,
            errBody,
        );
    }

    try {
        const json = await response.json();
        log.log(`[agentSurvey/${phase}] ok`, json);
        return json as T;
    } catch (e) {
        throw new AgentApiError("MALFORMED", "Unreadable response body", response.status);
    }
}

/**
 * Opens an agent survey session and returns the first question.
 *
 * Throws AI_UNAVAILABLE on 5xx — the AI failed to produce the first question,
 * which is transient and worth retrying.
 */
export function startAgentSurvey(
    url: string,
    body: AgentStartRequest,
    log: Log,
): Promise<AgentStartResponse> {
    return postAgent<AgentStartResponse>(url, endpoints.sdk.agentSurveyStart, body, log, "start");
}

/**
 * Submits the answer to the current question and returns the next one.
 *
 * NOTE ON THE ERROR ASYMMETRY — do not "fix" this into a bug:
 * /start throws AI_UNAVAILABLE on 5xx, but /next has NO equivalent. An AI
 * outage mid-survey comes back as HTTP 200 with `shouldEnd: true`. That is a
 * NORMAL graceful end, handled by the adapter's end detection, and it must
 * never surface as an error to the host page.
 */
export function nextAgentTurn(
    url: string,
    body: AgentNextRequest,
    log: Log,
): Promise<AgentNextResponse> {
    return postAgent<AgentNextResponse>(url, endpoints.sdk.agentSurveyNext, body, log, "next");
}
