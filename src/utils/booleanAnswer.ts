import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../models/types";

const YES_NO = ["Yes", "No"];

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

/**
 * The values of a route on a Yes/No (BOOLEAN) question, as the answer stores
 * them. renderBoolean always submits "Yes"/"No", whatever language it shows.
 *
 * A route saved with a translated option ("Ja"/"Ingen" after a machine
 * translation or a default-language swap in the Admin, DD-117) never matched.
 * Such a value is mapped by its position in the question's options (served or
 * default-language ones): first = "Yes", second = "No". Other questions and
 * values that match nothing are returned unchanged.
 */
export function routeValuesFor(
    values: any[],
    question?: Pick<NativeQuestion, "type" | "value" | "baseValue"> | null,
): any[] {
    if (question?.type !== FEEDBACKAPPANSWERTYPE.BOOLEAN) return values;
    const lists = [question.value, question.baseValue].filter(Array.isArray) as any[][];
    return values.map((v) => {
        const n = norm(v);
        if (n === "yes" || n === "true") return "Yes";
        if (n === "no" || n === "false") return "No";
        const index = lists
            .map((list) => list.findIndex((o) => norm(o) === n))
            .find((i) => i === 0 || i === 1);
        return index === undefined ? v : YES_NO[index];
    });
}
