/**
 * Resolves the host container for a survey and prepares it for rendering.
 *
 * Falls back to the id the SDK stamps on first render, so re-generating into an
 * already-initialized container keeps working after the original selector is
 * gone from the DOM.
 *
 * @param selector id of the element the integrator provided
 * @param id survey/integration id used to build the canonical container id
 */
export function generateContainer(selector: string, id: string): HTMLElement {
    let container: HTMLElement | null = document.getElementById(selector);

    if (!container) {
        container = document.getElementById("magicfeedback-container-" + id);
        if (!container) throw new Error(`Element with ID '${selector}' not found.`);
    }

    container.classList.add("magicfeedback-container");
    container.id = "magicfeedback-container-" + id;
    container.innerHTML = "";

    return container;
}

/**
 * Applies a per-integration brand color by setting --mf-primary on the
 * container so every descendant that reads var(--mf-primary) picks it up.
 *
 * Scoped to accent surfaces only (buttons, selected chips, focus rings) —
 * general body/label text stays on its own neutral token, untouched by
 * this override, on purpose.
 *
 * --mf-primary-hover/-light/-border/--mf-border-focus all derive from
 * var(--mf-primary) in the default stylesheet, but a custom property's
 * var() references are resolved once, at the element where the property
 * is declared — :root's copies stay locked to the default color and
 * inherit down as already-resolved values, ignoring an override further
 * down the tree. Redeclaring them here, with the same formulas the
 * stylesheet uses, makes them resolve fresh against the new color
 * instead of silently keeping the old one.
 *
 * @param container element the color is scoped to (its subtree only)
 * @param primaryColor any valid CSS color (hex, rgb(), etc.)
 */
export function applyPrimaryColor(container: HTMLElement, primaryColor: string): void {
    container.style.setProperty('--mf-primary', primaryColor);
    container.style.setProperty('--mf-primary-hover', `color-mix(in srgb, ${primaryColor} 85%, black)`);
    container.style.setProperty('--mf-primary-light', `color-mix(in srgb, ${primaryColor} 15%, white)`);
    container.style.setProperty('--mf-primary-border', `color-mix(in srgb, ${primaryColor} 35%, transparent)`);
    container.style.setProperty('--mf-border-focus', primaryColor);
}
