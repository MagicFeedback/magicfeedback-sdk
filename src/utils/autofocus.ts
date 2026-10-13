/**
 * Focus on the first question of a page when it is a text field.
 *
 * Only the FIRST question of the page counts: a page that starts with a rating
 * and has a text field after it is left alone, so the visitor starts at the
 * top. Within that question, the first control decides: a rating with an
 * "Other" text field after its options is not a text question.
 */

/**
 * `<input>` types that count as "typing" questions: TEXT, EMAIL, NUMBER and the
 * fields of CONTACT. `date` (opens a picker) and `password` are left out.
 */
export const AUTOFOCUS_INPUT_TYPES: readonly string[] = ["text", "email", "number", "tel", "url", "search"];

type TextField = HTMLInputElement | HTMLTextAreaElement;

/** Field to focus on the page inside `root`, or `null` when the first question is not a text one. */
export function findAutofocusTarget(root: ParentNode | null | undefined): TextField | null {
    if (!root) return null;
    const block = root.querySelector(".magicfeedback-div");
    if (!block) return null;
    const control = block.querySelector('input:not([type="hidden"]), textarea, select, button');
    if (!control) return null;
    const field = control as TextField;
    if (field.disabled || field.readOnly) return null;
    if (control.tagName === "TEXTAREA") return field;
    if (control.tagName === "INPUT" && AUTOFOCUS_INPUT_TYPES.includes((control as HTMLInputElement).type)) return field;
    return null;
}

function isEditable(el: Element): boolean {
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (el as HTMLElement).isContentEditable === true;
}

/**
 * Focus the first question of the page in `root` when it is a text field.
 * Returns whether the focus moved.
 *
 * Never takes the focus away from an editable field outside `root`: a survey
 * embedded in a page must not move the cursor of someone typing in the host
 * page's own form.
 */
export function focusFirstTextQuestion(root: HTMLElement | null | undefined): boolean {
    if (!root) return false;
    const target = findAutofocusTarget(root);
    if (!target) return false;
    const active = root.ownerDocument?.activeElement;
    if (active && !root.contains(active) && isEditable(active)) return false;
    // No scroll: the field is the first question, so it is already in view,
    // and scrolling here would move the host page around an embedded survey.
    try {
        target.focus({preventScroll: true});
    } catch {
        target.focus();
    }
    return root.ownerDocument?.activeElement === target;
}
