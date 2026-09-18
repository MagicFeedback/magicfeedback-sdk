/**
 * Typed errors for the agent survey endpoints.
 *
 * This lives apart from request.service.ts on purpose: the functions there all
 * swallow failures (`catch (e) { log.err(e); return '' }`), which collapses
 * "rate limited", "your publicKey is wrong" and "the survey ended normally"
 * into the same empty string. In agent mode those three demand three different
 * UIs, so the agent request layer throws instead.
 */

export type AgentErrorKind =
    | "RATE_LIMITED"   // 429
    | "AUTH"           // 406 (the API uses 406, not 401/403, for bad keys)
    | "NOT_FOUND"      // 404 integration not found
    | "BAD_CONFIG"     // 400/422: not in AGENT mode, empty agentBrief, or a malformed request body
    | "AI_UNAVAILABLE" // 5xx on /start: AI failed to produce the first question (transient)
    | "NETWORK"        // fetch itself threw
    | "MALFORMED";     // 200 with an unreadable body

export class AgentApiError extends Error {
    constructor(
        public readonly kind: AgentErrorKind,
        message: string,
        public readonly status?: number,
        public readonly retryAfterMs?: number,
        public readonly body?: any,
    ) {
        super(message);
        this.name = "AgentApiError";
        // Cheap insurance in case the TS target is ever downleveled to ES5,
        // where extending Error breaks `instanceof`.
        Object.setPrototypeOf(this, AgentApiError.prototype);
    }

    get retryable(): boolean {
        return this.kind === "RATE_LIMITED"
            || this.kind === "AI_UNAVAILABLE"
            || this.kind === "NETWORK";
    }
}

/**
 * Maps an HTTP status to an error kind.
 *
 * 401/403 are folded into AUTH defensively: the spec pins 406 today, but a
 * proxy or gateway in front of the API can rewrite it, and reporting a key
 * problem as a network blip is the worst failure mode for an integrator.
 */
export function mapAgentStatus(status: number, phase: "start" | "next"): AgentErrorKind {
    if (status === 429) return "RATE_LIMITED";
    if (status === 406 || status === 401 || status === 403) return "AUTH";
    if (status === 404) return "NOT_FOUND";
    // 400 is the documented "integration is not in AGENT mode / empty agentBrief".
    // 422 is what the API actually returns for a request that fails schema
    // validation (verified against api-dev and api). Both are non-retryable
    // "fix the request or the config" failures, so they share a bucket.
    if (status === 400 || status === 422) return "BAD_CONFIG";
    if (status >= 500) return phase === "start" ? "AI_UNAVAILABLE" : "NETWORK";
    return "MALFORMED";
}
