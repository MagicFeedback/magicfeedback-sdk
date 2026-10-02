/** How long a freshly shown page ignores taps and clicks. */
export const GHOST_TAP_GUARD_MS = 400;

const shownAt = new WeakMap<HTMLElement, number>();

/**
 * Call right after a page's questions are put in `container`. For the next
 * GHOST_TAP_GUARD_MS a pointer click inside it is swallowed, so the second
 * tap of a double tap on "Start" or "Next" — or on an option that
 * auto-advances — doesn't answer whatever the new page shows under the
 * finger (an NPS 0, say). Keyboard activation (detail 0) is never blocked.
 */
export function armGhostTapGuard(container: HTMLElement | null | undefined) {
    if (!container) return;

    if (!shownAt.has(container)) {
        container.addEventListener('click', (event) => {
            if ((event as MouseEvent).detail === 0) return;
            if (now() - (shownAt.get(container) ?? -Infinity) >= GHOST_TAP_GUARD_MS) return;
            event.preventDefault();
            event.stopPropagation();
        }, true);
    }

    shownAt.set(container, now());
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
