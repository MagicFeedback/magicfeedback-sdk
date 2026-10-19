/** How long a picked option stays on screen, checked, before the page advances. */
export const AUTO_ADVANCE_DELAY_MS = 300;

type Pending = { timer: ReturnType<typeof setTimeout>; source: Element };

// One pending advance per `send` callback. Each page gets its own callback
// from renderQuestions, so this is one per page.
const pending = new Map<() => unknown, Pending>();

/**
 * Calls `send` AUTO_ADVANCE_DELAY_MS after the visitor picks an option, so
 * the choice is seen checked before the page moves on. Picking again within
 * the window restarts it and only the last pick is sent (send reads the DOM
 * when it runs). Nothing is sent if `source` has left the DOM by then (the
 * page was replaced, "Back" was pressed). Clicks and keyboard both go
 * through here, so they behave the same.
 */
export function scheduleAutoAdvance(source: Element, send: () => unknown) {
    const previous = pending.get(send);
    if (previous) clearTimeout(previous.timer);

    const timer = setTimeout(() => {
        pending.delete(send);
        if (!source.isConnected) return;
        send();
    }, AUTO_ADVANCE_DELAY_MS);

    pending.set(send, {timer, source});
}

/** Auto-advances when `input` fires `event` ("change" by default). No-op without `send`. */
export function autoAdvanceOn(input: HTMLElement, send?: () => unknown, event: string = "change") {
    if (!send) return;
    input.addEventListener(event, () => scheduleAutoAdvance(input, send));
}

/**
 * Drops the pending advances started from inside `container`. Call when the
 * page is sent another way, e.g. "Next" was pressed inside the window, so it
 * isn't sent twice.
 */
export function cancelAutoAdvance(container: Element | null | undefined) {
    if (!container) return;
    pending.forEach(({timer, source}, send) => {
        if (!container.contains(source)) return;
        clearTimeout(timer);
        pending.delete(send);
    });
}

/**
 * Query param that sends the first page on its own when its question comes
 * prefilled from the URL (`?<ref>=4&autoadvance=true`). The Quick answer
 * links in emails use it so the score is stored on the click, even if the
 * visitor closes the survey right after.
 */
export const AUTO_ADVANCE_PARAM = "autoadvance";

export function autoAdvanceRequested(search: string = window.location.search): boolean {
    const value = new URLSearchParams(search).get(AUTO_ADVANCE_PARAM);
    return value === "true" || value === "1";
}

/**
 * The input of question `ref` that holds a value, if any: a checked option or
 * a filled field. A URL value that matches no option leaves nothing checked.
 */
export function answeredInput(container: Element, ref: string): HTMLInputElement | null {
    const inputs = Array.from(container.querySelectorAll<HTMLInputElement>(".magicfeedback-input"))
        .filter((input) => input.name === ref);
    return inputs.find((input) =>
        input.type === "radio" || input.type === "checkbox" ? input.checked : input.value !== ""
    ) || null;
}
