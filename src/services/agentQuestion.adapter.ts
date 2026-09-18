import {
    AGENT_ANSWER_TYPE_BLOCKED,
    AgentEndReason,
    AgentNextResponse,
    AgentStartResponse,
    AgentStep,
    FEEDBACKAPPANSWERTYPE,
    NativeAnswer,
    NativeQuestion,
    QuestionType,
} from "../models/types";
import {getBooleanOptions} from "../render/helpers";

export const DEFAULT_ANSWER_DELIMITER = ", ";

/** Choice widgets that render nothing at all when their option list is empty. */
const CHOICE_TYPES: string[] = [
    FEEDBACKAPPANSWERTYPE.RADIO,
    FEEDBACKAPPANSWERTYPE.MULTIPLECHOICE,
    FEEDBACKAPPANSWERTYPE.SELECT,
    FEEDBACKAPPANSWERTYPE.MULTIPLECHOISE_IMAGE,
];

const KNOWN_TYPES: string[] = Object.values(FEEDBACKAPPANSWERTYPE);

/** Fallback rating scale when the agent gives no numeric hints (no `conf` in agent mode). */
const DEFAULT_RATING_MIN = 1;
const DEFAULT_RATING_MAX = 5;

export type AgentAdapterContext = {
    integrationId: string;
    sessionId: string;
    language: string;
    log?: {log: (...a: any[]) => void; err: (...a: any[]) => void};
};

type ResolvedPayload = {
    full: Partial<NativeQuestion> | null;
    title: string | null;
};

/**
 * Resolves the two shapes the backend may ship: a full NativeQuestion (under
 * `question`, or inlined in `nextQuestion`), or the flat string + sibling
 * fields documented in the spec.
 */
function pickPayload(res: AgentStartResponse): ResolvedPayload {
    const candidate = (res.question && typeof res.question === "object")
        ? res.question
        : (res.nextQuestion && typeof res.nextQuestion === "object" ? res.nextQuestion : null);

    if (candidate) {
        const full = candidate as Partial<NativeQuestion>;
        const rawTitle = full.title;
        // A full question's title may itself be a localized record; leave that to
        // parseTitle downstream and only use it here to decide "is there a question".
        const title = typeof rawTitle === "string"
            ? rawTitle
            : (rawTitle ? JSON.stringify(rawTitle) : null);
        return {full, title};
    }

    return {
        full: null,
        title: typeof res.nextQuestion === "string" ? res.nextQuestion : null,
    };
}

function isYesNoPair(values: string[], language: string): boolean {
    if (values.length !== 2) return false;
    const lowered = values.map((v) => String(v).trim().toLowerCase());
    const localized = getBooleanOptions(language).map((v) => v.toLowerCase());
    const english = ["yes", "no"];
    return (lowered[0] === english[0] && lowered[1] === english[1])
        || (lowered[0] === localized[0] && lowered[1] === localized[1]);
}

/**
 * Maps a server question type onto a type the render registry actually knows.
 *
 * This has to be exhaustive, because an unmapped type is not a cosmetic bug:
 * `renderContainer` returns an EMPTY div when `getQuestionRenderer` finds
 * nothing (questions.service.ts:153-155), so the respondent sees a label with
 * no input, cannot answer, and required-validation traps them on that turn
 * forever.
 */
export function mapAgentType(
    rawType: string | undefined,
    values: string[],
    ctx: Pick<AgentAdapterContext, "language" | "log">,
): FEEDBACKAPPANSWERTYPE {
    const type = String(rawType || "").trim().toUpperCase();

    // The enum has RATING_NUMBER/RATING_EMOJI/RATING_STAR but no bare RATING.
    if (type === "RATING") return FEEDBACKAPPANSWERTYPE.RATING_NUMBER;

    // CONTACT is a legal enum value with NO registered renderer — the empty-div
    // trap in its purest form.
    if (type === FEEDBACKAPPANSWERTYPE.CONTACT) {
        ctx.log?.log(`[agentSurvey] CONTACT has no renderer, falling back to TEXT`);
        return FEEDBACKAPPANSWERTYPE.TEXT;
    }

    if (!KNOWN_TYPES.includes(type)) {
        ctx.log?.err(`[agentSurvey] unknown question type "${rawType}", falling back to TEXT`);
        return FEEDBACKAPPANSWERTYPE.TEXT;
    }

    // A choice widget with no options renders an empty div too (renderChoice
    // iterates `value || []`). Same trap, different cause.
    if (CHOICE_TYPES.includes(type) && values.length === 0) {
        ctx.log?.err(`[agentSurvey] ${type} arrived with no options, falling back to TEXT`);
        return FEEDBACKAPPANSWERTYPE.TEXT;
    }

    // renderBoolean ignores question.value entirely: it paints localized Yes/No
    // and always submits the English literals "Yes"/"No". If the agent supplied
    // its own two options, both the labels shown and the string sent to the AI
    // would lose their meaning — so render those as a RADIO instead.
    if (type === FEEDBACKAPPANSWERTYPE.BOOLEAN
        && values.length === 2
        && !isYesNoPair(values, ctx.language)) {
        return FEEDBACKAPPANSWERTYPE.RADIO;
    }

    return type as FEEDBACKAPPANSWERTYPE;
}

/**
 * Derives a rating scale from the supplied option values.
 *
 * Agent mode ships no `conf` object, and createRatingNumberElement defaults to
 * 0-10 (an NPS scale) when assets are missing — almost certainly wrong for an
 * AI-generated "rate this" question.
 */
export function ratingBounds(values: string[]): {min: number; max: number} {
    const nums = values.map(Number).filter((n) => Number.isFinite(n));
    if (nums.length >= 2) return {min: Math.min(...nums), max: Math.max(...nums)};
    return {min: DEFAULT_RATING_MIN, max: DEFAULT_RATING_MAX};
}

function buildAssets(
    type: FEEDBACKAPPANSWERTYPE,
    values: string[],
    full: Partial<NativeQuestion> | null,
): Record<string, any> {
    const base: Record<string, any> = {
        randomPosition: false,
        direction: "row",
        order: "ltr",
    };

    if (type === FEEDBACKAPPANSWERTYPE.RATING_NUMBER || type === FEEDBACKAPPANSWERTYPE.RATING_EMOJI) {
        Object.assign(base, ratingBounds(values));
    }

    if (type === FEEDBACKAPPANSWERTYPE.LONGTEXT) {
        // 0 suppresses the character counter in renderContainer.
        base.maxCharacters = 0;
    }

    // A full question's own assets win. We never set `placeholder`: the text
    // renderers fall back to the localized placeholder.answer(lang), which is
    // better UX than echoing the question title into the field.
    return {...base, ...(full?.assets || {})};
}

function buildNativeQuestion(
    res: AgentStartResponse,
    resolved: ResolvedPayload,
    ctx: AgentAdapterContext,
): NativeQuestion {
    const {full, title} = resolved;

    // COPY, never alias: renderChoice mutates question.value in place (it pushes
    // exclusiveAnswers/extraOptionText and sorts it when randomPosition is on),
    // and the response object also lives inside conversation[].
    const values: string[] = [...(res.questionValues ?? (full?.value as string[]) ?? [])];

    const type = mapAgentType(full?.type ?? res.questionType, values, ctx);
    const ref = res.questionRef || full?.ref || `agent-q-${res.currentTurn}`;

    return {
        id: full?.id || `agent-${ctx.sessionId}-${res.currentTurn}`,
        title: title || "",
        type,
        // CRITICAL: renderQuestions checks `questionType?.conf?.length > 0` FIRST
        // and would recurse into the sub-question renderer. Must stay falsy.
        questionType: {conf: null} as unknown as QuestionType,
        ref,
        require: full?.require ?? true,
        external_id: full?.external_id || "",
        value: values,
        defaultValue: full?.defaultValue || "",
        followup: false,
        position: res.currentTurn,
        assets: buildAssets(type, values, full),
        refMetric: full?.refMetric || "",
        integrationId: ctx.integrationId,
        integrationPageId: "",
        status: "ACTIVE",
    };
}

/**
 * Normalizes one server response into a renderable step or a terminal state.
 *
 * The end conditions are OR'd, in this order:
 *   BLOCKED -> SHOULD_END -> TYPE_NONE -> empty title (NO_QUESTION)
 *
 * `blocked` goes first so the decline UI wins when both flags are set, and the
 * empty-title check goes last so a `shouldEnd: true` carrying a farewell string
 * still ends. Never check `shouldEnd` alone: content moderation nulls the
 * question without setting it, which would hang the survey.
 */
export function toAgentStep(
    res: AgentStartResponse | AgentNextResponse,
    ctx: AgentAdapterContext,
): AgentStep {
    const next = res as AgentNextResponse;
    const currentTurn = res.currentTurn;
    const maxTurns = res.maxTurns;
    const coverageSummary = next.coverageSummary;

    const end = (reason: AgentEndReason): AgentStep =>
        ({kind: "END", reason, currentTurn, maxTurns, coverageSummary});

    if (next.answerType === AGENT_ANSWER_TYPE_BLOCKED) return end("BLOCKED");
    if (next.shouldEnd === true) return end("SHOULD_END");

    const resolved = pickPayload(res);
    const rawType = String(resolved.full?.type ?? res.questionType ?? "").trim().toUpperCase();

    if (rawType === "NONE") return end("TYPE_NONE");
    if (!resolved.title || !resolved.title.trim()) return end("NO_QUESTION");

    return {
        kind: "QUESTION",
        question: buildNativeQuestion(res, resolved, ctx),
        isFromBase: res.isFromBase === true,
        currentTurn,
        maxTurns,
        topic: next.topic,
        coverageGaps: res.coverageGaps,
        coverageSummary,
    };
}

/**
 * Flattens the scraped answers for one question into the single string the API
 * expects in `lastAnswer`.
 *
 * The generic DOM scrape emits one NativeAnswer PER CHECKED CHECKBOX, all
 * sharing the same key (the PageGraph path groups them via multipleChoiceMap,
 * the generic path does not), so grouping has to happen here.
 */
export function encodeAnswer(
    answers: NativeAnswer[],
    question: NativeQuestion,
    delimiter: string = DEFAULT_ANSWER_DELIMITER,
): string {
    const ref = question.ref;

    const flatten = (entries: NativeAnswer[]): string[] => entries
        .flatMap((a) => (Array.isArray(a.value) ? a.value : [a.value]))
        .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
        .map((s) => (s || "").trim())
        .filter((s) => s !== "");

    const main = flatten(answers.filter((a) => a.key === ref));
    const extra = flatten(answers.filter((a) => a.key === `extra-option-${ref}`));

    // Dedupe while preserving order (a checkbox group can repeat a value).
    const unique = main.filter((v, i) => main.indexOf(v) === i);

    return [unique.join(delimiter), extra.join(delimiter)]
        .filter((s) => s !== "")
        .join(delimiter);
}
