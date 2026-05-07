# Implementation Guide: dryRun followup fix + `previewPage` API

This guide describes two related changes to be applied to `magicfeedback-sdk`. A fresh session should be able to reproduce them end-to-end from this document.

- **Repo**: `magicfeedback-sdk` (TypeScript, jest, webpack)
- **Branch context**: based on `v2.2.1`
- **Scope**: SDK source under `src/`, tests under `test/`

---

## Context / Why

The SDK already has a `dryRun` mode (set via `sdk.init({ dryRun: true })`) that skips POST `/feedback` calls. Two gaps to address:

1. **dryRun was also short-circuiting followup questions.** In dry-run, `Form.callFollowUpQuestion` returned `null` immediately, so followup behavior diverged from production. The product requirement is: in dry-run the survey must behave **exactly like production**, only without persisting answers to `/feedback`.

2. **No public way to preview a single page.** The survey creator needs to render an exclusive page (a `Page` with its `NativeQuestion[]`) without making any API call to fetch the form, and without persisting answers. The render should be visually and behaviorally identical to production.

Both changes are user-facing additions. Backwards compatibility must be preserved.

---

## Change 1 — Keep followup behavior intact under `dryRun`

### File: `src/models/form.ts`

Locate `Form.callFollowUpQuestion` (around line 953 before changes). Remove the dryRun short-circuit so the followup API call always runs.

**Before:**

```ts
private async callFollowUpQuestion(question: NativeQuestion | null): Promise<NativeQuestion | null> {
    if (!question?.followup) return null;
    try {
        if (this.config.get<boolean>("dryRun")) {
            this.log.log(`Dry run enabled: skipping follow up API for question ${question.ref}`);
            return null;
        }

        if (this.feedback.answers.length === 0) throw new Error("No answers provided");
        // ...rest of method unchanged
```

**After:**

```ts
private async callFollowUpQuestion(question: NativeQuestion | null): Promise<NativeQuestion | null> {
    if (!question?.followup) return null;
    try {
        if (this.feedback.answers.length === 0) throw new Error("No answers provided");
        // ...rest of method unchanged
```

> Keep the existing `dryRun` checks in `Form.pushAnswers` and `main.send` — those *should* still skip POST `/feedback`. Only `callFollowUpQuestion` changes.

### File: `test/dry-run.test.ts`

Update the second test so it asserts that `getFollowUpQuestion` **is** called and the followup question is returned, even when `dryRun` is true.

Replace the test `"Form skips feedback/followup API calls when dryRun is enabled"` with:

```ts
test("Form skips feedback API call but still calls followup API when dryRun is enabled", async () => {
    const config = new Config();
    config.set("url", "https://example.com");
    config.set("dryRun", true);

    const form = new Form(config, "app-id", "public-key");
    (form as any).feedback.answers = [{key: "q-2", value: ["a1"]}];

    const sessionId = await (form as any).pushAnswers(false);
    expect(sessionId).toMatch(/^dry-run-app-id-/);
    expect(requestService.sendFeedback).not.toHaveBeenCalled();

    const followupQuestion: NativeQuestion = {
        id: "q-2",
        title: "Followup",
        type: FEEDBACKAPPANSWERTYPE.TEXT,
        questionType: {conf: null},
        ref: "q-2",
        require: false,
        external_id: "",
        value: [],
        defaultValue: "",
        appId: "app-id",
        followup: true,
        position: 2,
        assets: {},
        refMetric: "",
        integrationId: "integration-id",
        integrationPageId: "page-id",
        generatedAt: null,
        updatedAt: null,
        status: "ACTIVE",
        followupQuestion: [],
    };

    const followupResponse: NativeQuestion = {...followupQuestion, id: "q-2-followup", ref: "q-2-followup"};
    requestService.getFollowUpQuestion.mockResolvedValueOnce(followupResponse);

    const followup = await (form as any).callFollowUpQuestion(followupQuestion);

    expect(requestService.getFollowUpQuestion).toHaveBeenCalledTimes(1);
    expect(followup).toEqual(followupResponse);
});
```

The first test in the file (`main.send skips API call when dryRun is enabled`) stays as-is.

---

## Change 2 — Public `previewPage` API

Goal: let a caller render a single page locally given the page + its questions, with no API fetch and no answer persistence.

The implementation reuses the existing render pipeline (`Form.generateForm()`) by:

1. Forcing `dryRun = true` on the config.
2. Building a minimal `FormData` stub from the input.
3. Calling the existing `generateForm()`.

This keeps the rendering behavior identical to production (followups, validation, button styling, etc.) while skipping all network calls.

### File: `src/models/types.ts`

Append a new exported type at the end of the file (after the `enum generateFormOptionsTag` block).

```ts
/**
 * Input for previewing a single page in the survey creator without persisting feedback.
 * The caller provides everything needed to render the page so no API call is made.
 */
export type PreviewPageInput = {
    /**
     * Page to render. Can be a Page instance or a plain object with at least integrationQuestions.
     */
    page: {
        id?: string;
        position?: number;
        integrationQuestions: NativeQuestion[];
        integrationPageRoutes?: any[];
    };
    /**
     * Survey identity. Affects buttons (MAGICSURVEY shows back/next, MAGICFORM shows submit).
     * Defaults to 'MAGICFORM'.
     */
    identity?: string;
    /**
     * Language code used to localize question titles. Defaults to 'en'.
     */
    lang?: string;
    /**
     * Product config (custom icons, ids, etc). Optional.
     */
    product?: any;
    /**
     * Style overrides. Optional.
     */
    style?: Record<string, any>;
    /**
     * Optional app id used as a label/identifier for the preview container. Defaults to 'preview'.
     */
    appId?: string;
};
```

`NativeQuestion` is already exported from this file, no extra import needed.

### File: `src/models/form.ts`

**1) Update the import line at the top to include `PreviewPageInput`:**

```ts
import {FEEDBACKAPPANSWERTYPE, generateFormOptions, NativeAnswer, NativeFeedback, NativeQuestion, PreviewPageInput} from "./types";
```

**2) Add a new public method `previewPage` immediately *after* `Form.generate()` and immediately *before* the private `formatPages()` method.**

Insert this block before the `private formatPages()` JSDoc/method:

```ts
/**
 * Preview a single page in the survey creator without fetching from the API
 * and without persisting answers to /feedback. The caller provides the page
 * (with its questions) and minimal context (lang, product, identity). Followup
 * API calls and same UI behavior are preserved (dryRun is enabled internally),
 * so the page renders and behaves exactly as in production except no answers
 * are sent to /feedback.
 *
 * @param selector container element id where the preview will be rendered
 * @param input page + context to render
 * @param options form rendering options (buttons, callbacks, etc.)
 */
public async previewPage(
    selector: string,
    input: PreviewPageInput,
    options: generateFormOptions = {}
): Promise<void> {
    try {
        if (!input || !input.page) throw new Error("[MagicFeedback] No page provided for preview");
        if (!input.page.integrationQuestions || input.page.integrationQuestions.length === 0) {
            throw new Error("[MagicFeedback] No questions provided for preview");
        }

        // Force dryRun so any submit/followup persistence is skipped.
        this.config.set("dryRun", true);

        // Default options for preview: do not pull metadata from the page URL,
        // since this is a creator preview, not a real submission.
        this.formOptionsConfig = {
            ...this.formOptionsConfig,
            getMetaData: false,
            ...options,
        };
        this.selector = selector;

        // Normalize the page into a Page instance.
        const activeQuestions = (input.page.integrationQuestions || [])
            .filter((q: NativeQuestion) => !q.status || q.status === 'ACTIVE')
            .sort((a: NativeQuestion, b: NativeQuestion) => a.position - b.position);

        const previewPage = new Page(
            input.page.id ?? '1',
            input.page.position ?? 1,
            input.appId ?? this.appId,
            activeQuestions,
            (input.page.integrationPageRoutes as any) ?? []
        );

        // Build a minimal FormData stub. We cast because we only need a subset
        // of the FormData surface for rendering a single page.
        this.formData = {
            id: input.appId ?? this.appId,
            identity: input.identity ?? 'MAGICFORM',
            lang: [input.lang ?? 'en'],
            product: input.product ?? {customIcons: false},
            style: input.style ?? {},
            questions: activeQuestions,
            pages: [previewPage],
        } as unknown as FormData;

        // Reuse the existing render pipeline. Single-page graph + dryRun keep
        // the behavior identical to production minus the network calls.
        await this.generateForm();
    } catch (e) {
        this.log.err(e);

        if (this.formOptionsConfig.onLoadedEvent) {
            await this.formOptionsConfig.onLoadedEvent({
                loading: false,
                error: e,
            });
        }
        return;
    }
}
```

`Page` and `FormData` are already imported at the top of the file.

### File: `src/main.ts`

**1) Update the import line:**

```ts
import {InitOptions, NativeAnswer, NativeFeedback, PreviewPageInput, generateFormOptions} from "./models/types";
```

**2) Add a top-level `previewPage` function inside the `main()` factory, right before the `Return` block:**

```ts
/**
 * Render a single page from the survey creator without hitting the API
 * and without persisting answers. Useful for previewing an exclusive page
 * (with all of its questions) while building a survey.
 *
 * The preview enables dryRun internally, so:
 *  - POST /feedback is skipped on submit
 *  - Followup question API calls still run (same UI behavior)
 *
 * @param selector container id where the preview will be rendered
 * @param input page + context (questions, lang, product, identity, ...)
 * @param options form rendering options
 * @returns the underlying Form instance, in case the caller needs to interact
 */
async function previewPage(
    selector: string,
    input: PreviewPageInput,
    options?: generateFormOptions
): Promise<Form> {
    if (!selector) log.err("No selector provided");
    if (!input || !input.page) log.err("No page provided for preview");

    const previewAppId = input?.appId || `preview-${Date.now()}`;
    const form = new Form(config, previewAppId);
    await form.previewPage(selector, input, options);
    return form;
}
```

**3) Add `previewPage` to the returned object:**

```ts
return {
    // lifecycle
    init,
    // requests
    send,
    form,
    session,
    previewPage,
};
```

### File: `test/preview-page.test.ts` (new file)

Create this file with the contents below.

```ts
/**
 * @jest-environment jsdom
 */
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";

import main from "../src/main";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";

jest.mock("../src/services/request.service", () => ({
    sendFeedback: jest.fn(),
    getFollowUpQuestion: jest.fn(),
    getForm: jest.fn(),
    getSessionForm: jest.fn(),
    validateEmail: jest.fn(() => true),
}));

const buildQuestion = (overrides: Partial<NativeQuestion> = {}): NativeQuestion => ({
    id: overrides.id || "q-1",
    title: overrides.title || "Question",
    type: overrides.type || FEEDBACKAPPANSWERTYPE.TEXT,
    questionType: overrides.questionType || ({conf: null} as any),
    ref: overrides.ref || "q-1",
    require: overrides.require ?? false,
    external_id: overrides.external_id || "",
    value: overrides.value || [],
    defaultValue: overrides.defaultValue || "",
    appId: overrides.appId || "app-id",
    followup: overrides.followup ?? false,
    position: overrides.position ?? 1,
    assets: overrides.assets || {},
    refMetric: overrides.refMetric || "",
    integrationId: overrides.integrationId || "integration-1",
    integrationPageId: overrides.integrationPageId || "page-1",
    generatedAt: overrides.generatedAt ?? null,
    updatedAt: overrides.updatedAt ?? null,
    status: overrides.status || "ACTIVE",
    followupQuestion: overrides.followupQuestion || [],
});

describe("sdk.previewPage", () => {
    let container: HTMLElement;
    let requestService: any;
    let logSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        container = document.createElement("div");
        container.id = "preview-container";
        document.body.appendChild(container);
        jest.clearAllMocks();
        requestService = require("../src/services/request.service");
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        container.remove();
        logSpy.mockRestore();
    });

    test("renders a single page from the provided page input without calling getForm", async () => {
        const sdk = main();
        sdk.init();

        const questions = [
            buildQuestion({
                id: "1",
                ref: "name",
                title: "Name",
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                position: 1,
            }),
            buildQuestion({
                id: "2",
                ref: "email",
                title: "Email",
                type: FEEDBACKAPPANSWERTYPE.TEXT,
                position: 2,
            }),
        ];

        await sdk.previewPage("preview-container", {
            page: {
                id: "page-1",
                position: 1,
                integrationQuestions: questions,
            },
            identity: "MAGICFORM",
            lang: "en",
        });

        const formEl = container.querySelector("form");
        const inputs = container.querySelectorAll("input");

        expect(formEl).not.toBeNull();
        expect(inputs.length).toBeGreaterThanOrEqual(2);
        expect(requestService.getForm).not.toHaveBeenCalled();
        expect(requestService.getSessionForm).not.toHaveBeenCalled();
    });

    test("submitting the preview does not call POST /feedback (dryRun is forced)", async () => {
        const sdk = main();
        sdk.init();

        const questions = [
            buildQuestion({id: "1", ref: "name", title: "Name", position: 1}),
        ];

        const form = await sdk.previewPage("preview-container", {
            page: {integrationQuestions: questions},
        });

        // Simulate caller-driven submit on the rendered form.
        await (form as any).send();

        expect(requestService.sendFeedback).not.toHaveBeenCalled();
    });

    test("only renders the questions from the provided page (no API fetch)", async () => {
        const sdk = main();
        sdk.init();

        const provided = [
            buildQuestion({id: "10", ref: "only", title: "Only one", position: 1}),
        ];

        await sdk.previewPage("preview-container", {
            page: {integrationQuestions: provided},
            lang: "es",
        });

        const labels = container.querySelectorAll("label.magicfeedback-label");
        expect(labels.length).toBe(1);
        expect(requestService.getForm).not.toHaveBeenCalled();
    });
});
```

---

## Verification

Run from the repo root:

```bash
npx jest
```

Expected result:

- All previously existing test suites still pass.
- `test/dry-run.test.ts` passes with the updated assertion (`getFollowUpQuestion` is called once, returns the mocked followup).
- `test/preview-page.test.ts` passes (3 tests).

Total expected: **9 test suites, 129 tests passing**.

Optionally, type-check sources only:

```bash
npx tsc --noEmit
```

> Pre-existing TS errors inside `node_modules/@types/node` and `node_modules/webpack` are unrelated and can be ignored. Source files under `src/` and `test/` should produce zero errors.

---

## Public API surface added

```ts
// new type
export type PreviewPageInput = { /* ... */ };

// new public method on Form
form.previewPage(selector, input, options?): Promise<void>

// new top-level helper from main()
sdk.previewPage(selector, input, options?): Promise<Form>
```

### Example usage

```ts
import main from "@magicfeedback/sdk";

const sdk = main();
sdk.init({ debug: true });

await sdk.previewPage("preview-container", {
  page: {
    id: "page-1",
    position: 1,
    integrationQuestions: questions,    // NativeQuestion[]
    integrationPageRoutes: routes,      // optional
  },
  identity: "MAGICSURVEY",              // or "MAGICFORM"
  lang: "es",
  product: { customIcons: false },
});
```

---

## Implementation order (recommended)

1. Apply Change 1 in `src/models/form.ts` (followup fix).
2. Update `test/dry-run.test.ts` and run `npx jest test/dry-run.test.ts` — must pass.
3. Add `PreviewPageInput` to `src/models/types.ts`.
4. Add `previewPage` method to `src/models/form.ts`.
5. Add `previewPage` helper to `src/main.ts` and export it from the returned object.
6. Add `test/preview-page.test.ts` and run `npx jest test/preview-page.test.ts` — must pass.
7. Run full suite `npx jest` — 129 tests passing.

---

## Notes / Gotchas

- `previewPage` calls `this.config.set("dryRun", true)` which **mutates the SDK config**. After preview, subsequent real form usage from the same `sdk` instance will also be in dry-run unless explicitly reset. This is intentional for the survey-creator use case (a dedicated SDK instance per preview); document it for callers that mix preview and live forms.
- `getMetaData` defaults to `false` in preview to avoid polluting feedback with the creator page's URL/navigator data. Callers can override via the `options` param.
- `formData` is built as an `as unknown as FormData` cast because only a subset of fields (`id`, `identity`, `lang`, `product`, `style`, `questions`, `pages`) are needed for `generateForm()`. Do not introduce `originAllowed`/network-allowed-origins checks.
- The render pipeline relies on `generateForm()` → `PageGraph` → first page lookup. With a single page, navigation past it is a no-op (the graph has no further nodes), so the existing flow handles it without code changes.
