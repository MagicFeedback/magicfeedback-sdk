import {isRtlLanguage} from "../services/i18n";

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
    container.style.setProperty('--mf-primary-light', `color-mix(in srgb, ${primaryColor} var(--mf-primary-light-mix, 15%), var(--mf-tint-base, white))`);
    container.style.setProperty('--mf-primary-border', `color-mix(in srgb, ${primaryColor} var(--mf-primary-border-mix, 35%), transparent)`);
    container.style.setProperty('--mf-border-focus', primaryColor);
}

/**
 * Sets the writing direction of a survey from its language.
 *
 * Only the container is marked: the stylesheet uses logical properties
 * (text-align: start, padding-inline-start, ...) so every descendant mirrors
 * from this one attribute, and a host page in the opposite direction is not
 * affected because the attribute is scoped to our subtree.
 *
 * `dir` is always written, never only added for RTL — a container reused for a
 * second survey in another language has to be able to go back to ltr.
 *
 * @param container element the survey renders into
 * @param language integration language (any BCP-47-ish tag)
 */
export function applyDirection(container: HTMLElement, language?: string): void {
    const rtl = isRtlLanguage(language);

    container.setAttribute("dir", rtl ? "rtl" : "ltr");
    container.classList.toggle("magicfeedback-rtl", rtl);
}

/** Light or dark palette for the survey (DD-238). */
export type ColorMode = "light" | "dark";

/**
 * Below this relative luminance (WCAG, 0 = black, 1 = white) a background is
 * treated as dark. 0.2 is about where light text (#F1F5F9) starts to contrast
 * better than the default dark text (#1E293B): mid grey #808080 is 0.216 and
 * stays light, Danske Spil-like navies and #333 are well below.
 */
export const DARK_LUMINANCE_THRESHOLD = 0.2;

const isColorValue = (value: unknown): value is string =>
    typeof value === "string" && value.trim() !== "" && !/[;{}]/.test(value);

/**
 * Parses a CSS color into [r, g, b, a] (0-255, alpha 0-1). Handles hex and
 * rgb()/rgba() directly; anything else (names, hsl()) goes through the
 * browser when there is one. Returns null for values it cannot read.
 */
export function parseColor(value: unknown): [number, number, number, number] | null {
    if (!isColorValue(value)) return null;
    const v = value.trim().toLowerCase();

    const hex = v.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
    if (hex) {
        let h = hex[1];
        if (h.length <= 4) h = h.split("").map((c) => c + c).join("");
        const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
        return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
    }

    const rgb = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
    if (rgb) {
        const a = rgb[4] === undefined ? 1 :
            rgb[4].endsWith("%") ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
        return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), a];
    }

    if (v === "transparent") return [0, 0, 0, 0];
    if (v === "white") return [255, 255, 255, 1];
    if (v === "black") return [0, 0, 0, 1];

    // Other syntaxes: let the browser normalise it to rgb().
    if (typeof document === "undefined" || !document.body || typeof getComputedStyle !== "function") return null;
    const probe = document.createElement("span");
    probe.style.color = v;
    if (!probe.style.color) return null;
    probe.style.display = "none";
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    return computed && computed.toLowerCase() !== v ? parseColor(computed) : null;
}

/** WCAG relative luminance of an opaque color, or null if it cannot be read. */
export function relativeLuminance(value: unknown): number | null {
    const c = parseColor(value);
    if (!c) return null;
    const lin = (x: number) => {
        const s = x / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
}

/** True for a readable, mostly opaque color darker than the threshold. */
export function isDarkColor(value: unknown): boolean {
    const c = parseColor(value);
    if (!c || c[3] < 0.5) return false; // see-through: the host page decides
    const l = relativeLuminance(value);
    return l !== null && l < DARK_LUMINANCE_THRESHOLD;
}

/**
 * Picks the palette for a survey. A forced mode from the host wins; otherwise
 * the background the questions actually sit on decides: the Style's
 * boxBackgroundColor (answer card), or backgroundColor when there is no box.
 */
export function resolveColorMode(style?: Record<string, any> | null, forced?: ColorMode | "auto"): ColorMode {
    if (forced === "light" || forced === "dark") return forced;
    const box = style?.boxBackgroundColor;
    const usable = (c: unknown) => { const p = parseColor(c); return !!p && p[3] >= 0.5; };
    const background = usable(box) ? box : style?.backgroundColor;
    return isDarkColor(background) ? "dark" : "light";
}

// Style keys copied onto the dark tokens so the Style's own dark colors stay
// exactly as designed (the [data-mf-mode="dark"] defaults are only a fallback).
const DARK_STYLE_VARS: { key: string; vars: string[] }[] = [
    {key: "boxBackgroundColor", vars: ["--mf-surface", "--mf-bg-secondary"]},
    {key: "backgroundColor", vars: ["--mf-bg-primary"]},
];

// Primary keys the Style's `dark` block may carry, in order: the survey's own
// primaryColor, then the popup's buttonPrimaryColor (same fallback as the popups).
const DARK_PRIMARY_KEYS = ["primaryColor", "buttonPrimaryColor"];

// Marks a container whose --mf-primary came from the `dark` block, so going
// back to light can drop it.
const DARK_PRIMARY_ATTR = "data-mf-dark-primary";

/** The Style's optional `dark` block (DD-239): same keys as the Style, for dark mode. */
function darkBlock(style?: Record<string, any> | null): Record<string, any> | null {
    const d = style?.dark;
    return d && typeof d === "object" && !Array.isArray(d) ? d : null;
}

/**
 * Marks the container with data-mf-mode so the stylesheet swaps palettes.
 * In dark mode the Style's dark background colors are written inline on the
 * container too, so answer boxes and inputs match the card instead of the
 * default dark surface. The Style's optional `dark` block (DD-239) comes
 * first: its background colors (when dark) and its primary color. Always
 * written (never only added) so a container reused for another survey can go
 * back to light.
 */
export function applyColorMode(
    container: HTMLElement,
    style?: Record<string, any> | null,
    forced?: ColorMode | "auto",
): ColorMode {
    const mode = resolveColorMode(style, forced);
    container.setAttribute("data-mf-mode", mode);
    const dark = mode === "dark" ? darkBlock(style) : null;

    DARK_STYLE_VARS.forEach(({key, vars}) => {
        let value: unknown = null;
        if (mode === "dark") {
            // A light color in either place would put light text on a light box.
            if (isDarkColor(dark?.[key])) value = dark![key];
            else if (isDarkColor(style?.[key])) value = style![key];
        }
        vars.forEach((cssVar) => {
            if (value !== null) container.style.setProperty(cssVar, String(value).trim());
            else container.style.removeProperty(cssVar);
        });
    });

    const darkPrimary = DARK_PRIMARY_KEYS.map((k) => dark?.[k]).find((c) => {
        const p = parseColor(c);
        return !!p && p[3] >= 0.5;
    });
    if (darkPrimary) {
        applyPrimaryColor(container, String(darkPrimary).trim());
        container.setAttribute(DARK_PRIMARY_ATTR, "");
    } else if (container.hasAttribute(DARK_PRIMARY_ATTR)) {
        container.removeAttribute(DARK_PRIMARY_ATTR);
        // The caller sets the light primaryColor right before this; without one,
        // drop the dark block's so the stylesheet default comes back.
        if (!style?.primaryColor) {
            ["--mf-primary", "--mf-primary-hover", "--mf-primary-light", "--mf-primary-border", "--mf-border-focus"]
                .forEach((v) => container.style.removeProperty(v));
        }
    }
    return mode;
}

/**
 * Copies the container's palette (data-mf-mode and inline --mf-* vars) onto
 * an element that is portaled out of it, such as a modal moved to <body>.
 */
export function copyTheme(from: Element | null, to: HTMLElement): void {
    if (!from) return;
    const mode = from.getAttribute("data-mf-mode");
    if (mode) to.setAttribute("data-mf-mode", mode);
    else to.removeAttribute("data-mf-mode");
    const style = (from as HTMLElement).style;
    if (!style) return;
    for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        if (prop.startsWith("--mf-")) to.style.setProperty(prop, style.getPropertyValue(prop));
    }
}
