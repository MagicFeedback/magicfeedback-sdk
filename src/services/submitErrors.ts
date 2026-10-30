/**
 * Typed errors for the submit flow of a static survey (`Form.send` / `Form.finish`).
 *
 * The messages are the ones the SDK always threw ("No response", "No page found"),
 * so integrations that match on the text keep working. The `code` is what tells
 * the causes apart: "No response" used to mean both "a required question is
 * empty" and "the API didn't save the answers", and a host showing "this
 * question is required" for a failed request is the worst outcome of the two.
 */

export type SubmitErrorCode =
    | "REQUIRED"     // a required question (or matrix row, min options, MaxDiff pick) is unanswered
    | "SEND_FAILED"  // sdk/feedback did not return a session (HTTP error or network)
    | "NO_PAGE";     // the history has no current page (state bug, never user input)

export class SubmitError extends Error {
    constructor(
        public readonly code: SubmitErrorCode,
        message: string,
    ) {
        super(message);
        this.name = "SubmitError";
        // Same insurance as AgentApiError: `instanceof` survives an ES5 downlevel.
        Object.setPrototypeOf(this, SubmitError.prototype);
    }
}
