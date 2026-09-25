import {FEEDBACKAPPANSWERTYPE, NativeAnswer, NativeQuestion} from "../models/types";

/**
 * Multi-language surveys.
 *
 * One integration holds every language: `lang[0]` is the default (the language
 * of the base fields) and the API serves another one with `?lang=`. The served
 * questions carry their text in that language, plus `baseValue` /
 * `baseDefaultValue` with the default-language originals whenever the served
 * language is not the default. Answers must always be sent in the default
 * language, because routing, storage and reports match on it.
 */

// Norwegian reaches us as 'nb'/'nn' from browsers and devices, the API stores 'no'.
const ALIASES: Record<string, string> = {
    nb: "no",
    nn: "no",
    nob: "no",
    nno: "no",
};

/**
 * Two-letter lowercase code the API matches exactly ('es-ES' -> 'es',
 * 'pt_BR' -> 'pt', 'nb-NO' -> 'no'), or null when there is nothing usable.
 */
export function normalizeSurveyLang(language?: string | null): string | null {
    if (!language || typeof language !== "string") return null;
    const primary = language.trim().toLowerCase().replace(/_/g, "-").split("-")[0];
    if (!/^[a-z]{2,3}$/.test(primary)) return null;
    return ALIASES[primary] || primary;
}

/** Browser / webview language, or null outside a browser. */
function deviceLanguage(): string | null {
    if (typeof navigator === "undefined") return null;
    const candidates = [
        ...(Array.isArray(navigator.languages) ? navigator.languages : []),
        navigator.language,
    ];
    for (const candidate of candidates) {
        const code = normalizeSurveyLang(candidate);
        if (code) return code;
    }
    return null;
}

/**
 * Language to ask the API for: the one the integrator passed explicitly, else
 * the browser (or mobile webview) language. Null lets the API serve the
 * survey's default.
 */
export function detectSurveyLang(explicit?: string | null): string | null {
    return normalizeSurveyLang(explicit) || deviceLanguage();
}

/** `url` with `?lang=` (or `&lang=`) appended when a language is set. */
export function withLangParam(url: string, lang?: string | null): string {
    if (!lang) return url;
    return `${url}${url.includes("?") ? "&" : "?"}lang=${encodeURIComponent(lang)}`;
}

// MULTIPLECHOISE_IMAGE options are JSON strings of {position, url, value}
// (renderMultipleChoiceImage parses them) and the input holds `value`.
function optionLabel(option: any): string | null {
    if (option === null || option === undefined) return null;
    if (typeof option === "string" && option.trim().startsWith("{")) {
        try {
            option = JSON.parse(option);
        } catch {
            return option;
        }
    }
    if (typeof option === "object") return option.value !== undefined ? String(option.value) : null;
    return String(option);
}

/** Shown option label -> base-language option, by index. Empty when not localized. */
export function baseValueMap(question: NativeQuestion): Map<string, string> {
    const map = new Map<string, string>();
    const shown = question?.value;
    const base = question?.baseValue;
    if (!Array.isArray(shown) || !Array.isArray(base)) return map;

    shown.forEach((option, i) => {
        const label = optionLabel(option);
        const baseLabel = optionLabel(base[i]);
        if (label !== null && baseLabel !== null && !map.has(label)) map.set(label, baseLabel);
    });
    return map;
}

/** Base-language option -> shown label, for URL prefills written in the base language. */
export function shownValueFor(question: NativeQuestion, baseValue: string | null): string | null {
    if (baseValue === null || !Array.isArray(question?.baseValue)) return baseValue;
    const i = question.baseValue.findIndex((option) => optionLabel(option) === baseValue);
    if (i === -1) return baseValue;
    return optionLabel(question.value?.[i]) ?? baseValue;
}

const CHOICE_TYPES: string[] = [
    FEEDBACKAPPANSWERTYPE.RADIO,
    FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE,
    FEEDBACKAPPANSWERTYPE.MULTIPLECHOISE_IMAGE,
    FEEDBACKAPPANSWERTYPE.SELECT,
];

function mapPriority(value: string, map: Map<string, string>): string {
    // "N. label"
    const match = /^(\d+)\.\s?(.*)$/.exec(value);
    if (!match) return map.get(value) ?? value;
    const label = match[2];
    return `${match[1]}. ${map.get(label) ?? label}`;
}

function mapPointSystem(value: string, map: Map<string, string>): string {
    // "label:NN%"
    const i = value.lastIndexOf(":");
    if (i === -1) return value;
    const label = value.substring(0, i);
    return `${map.get(label) ?? label}${value.substring(i)}`;
}

function mapMatrix(value: string, map: Map<string, string>): string {
    // JSON of [{key: row, value: [column]}]; rows come from assets (not translated).
    try {
        const rows = JSON.parse(value);
        if (!Array.isArray(rows)) return value;
        return JSON.stringify(rows.map((row: any) => ({
            ...row,
            value: Array.isArray(row?.value) ? row.value.map((v: any) => map.get(v) ?? v) : row?.value,
        })));
    } catch {
        return value;
    }
}

/**
 * Rewrite collected answers from the shown language to the base language.
 * Values with no match (free text, "other" options, exclusive answers kept in
 * the base language) pass through untouched.
 */
export function toBaseAnswers(answers: NativeAnswer[], questions: NativeQuestion[]): NativeAnswer[] {
    return answers.map((answer) => {
        if (answer.key.startsWith("extra-option-")) return answer;

        // Same lookup answer() uses: input names contain the question ref.
        const question = questions.find((q) => q.ref === answer.key) ||
            questions.find((q) => answer.key.includes(q.ref));
        if (!question) return answer;

        const map = baseValueMap(question);
        if (map.size === 0) return answer;

        let mapValue: (value: any) => any;
        if (CHOICE_TYPES.includes(question.type)) {
            mapValue = (v) => (typeof v === "string" ? map.get(v) ?? v : v);
        } else if (question.type === FEEDBACKAPPANSWERTYPE.PRIORITY_LIST) {
            mapValue = (v) => (typeof v === "string" ? mapPriority(v, map) : v);
        } else if (question.type === FEEDBACKAPPANSWERTYPE.POINT_SYSTEM) {
            mapValue = (v) => (typeof v === "string" ? mapPointSystem(v, map) : v);
        } else if (question.type === FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX) {
            mapValue = (v) => (typeof v === "string" ? mapMatrix(v, map) : v);
        } else {
            return answer;
        }

        return {...answer, value: answer.value.map(mapValue)};
    });
}
