import {NativeAnswer} from "../models/types";
import {getUploadValues} from "../render/uploadHelpers";

/**
 * Collects answers straight from the rendered inputs, keyed by each input's
 * `name` (which is the question `ref`).
 *
 * This is the page-less scrape: it knows nothing about the question list, so it
 * works both for the static form's generic fallback (no page in history) and
 * for agent mode, where there is no PageGraph at all.
 *
 * Caveat worth knowing: checkbox groups produce ONE entry PER CHECKED BOX, all
 * sharing the same key. Callers that need a single value per question have to
 * group by key themselves.
 */
export function scrapeInputs(form: HTMLElement): NativeAnswer[] {
    const inputs = form.querySelectorAll(".magicfeedback-input");
    const surveyAnswers: NativeAnswer[] = [];
    const priorityMap: Record<string, string[]> = {};

    inputs.forEach((input) => {
        const htmlInput = input as HTMLInputElement;
        const key = htmlInput.name;
        if (!key) return;

        const type = htmlInput.type;
        // Para radio/checkbox sólo recogemos si están checkeados
        if ((type === 'radio' || type === 'checkbox') && !htmlInput.checked) return;

        const value = htmlInput.value;
        const elementTypeClass = htmlInput.classList[0];

        // Manejo especial para priority-list (inputs hidden)
        if (elementTypeClass?.includes('magicfeedback-priority-list') || htmlInput.id?.startsWith('priority-list-')) {
            if (!priorityMap[key]) priorityMap[key] = [];
            priorityMap[key].push(value);
            return;
        }

        // Manejo especial para uploads (valores base64 ya codificados)
        if (elementTypeClass?.includes('magicfeedback-upload')) {
            const uploadValues = getUploadValues(htmlInput);
            if (uploadValues.length) surveyAnswers.push({key, value: uploadValues});
            return;
        }

        const val = elementTypeClass === 'magicfeedback-consent' ? htmlInput.checked.toString() : value;
        if (val === undefined || val === null) return;

        surveyAnswers.push({key, value: [val]});
    });

    // Agregar PRIORITY_LIST agregados, ordenando por índice inicial
    Object.entries(priorityMap).forEach(([k, arr]) => {
        const sorted = arr.slice().sort((a, b) => Number(a.split('.')[0]) - Number(b.split('.')[0]));
        surveyAnswers.push({key: k, value: sorted});
    });

    return surveyAnswers;
}
