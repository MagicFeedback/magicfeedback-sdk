# MagicFeedback SDK

Browser SDK for rendering MagicFeedback surveys/forms, resuming sessions, previewing question definitions, and sending feedback directly from your app.

## What this SDK covers

- Render a hosted MagicFeedback form with `appId` + `publicKey`
- Resume an existing survey flow with `sessionId`
- Submit feedback directly when you already own the UI
- Preview one or more question objects locally
- Use the bundled default theme or override CSS variables

## Important before you start

- This is a browser-oriented SDK. It relies on `window`, `document`, `navigator`, and `localStorage`.
- Use it on the client side only. Server-side rendering and Node-only execution are not supported.
- Call `magicfeedback.init()` before `form()`, `session()`, or `send()`. `init()` sets the API base URL.
- `form.generate()` expects a DOM element id such as `"survey-root"`, not a CSS selector such as `"#survey-root"`.

## Install

Install from [npm](https://www.npmjs.com/package/@magicfeedback/native):

```sh
npm install @magicfeedback/native
```

## Quick start

### Plain HTML

```html
<link
  rel="stylesheet"
  href="./node_modules/@magicfeedback/native/dist/styles/magicfeedback-default.css"
/>

<div id="survey-root"></div>

<script src="./node_modules/@magicfeedback/native/dist/magicfeedback-sdk.browser.js"></script>
<script>
  window.magicfeedback.init({
    env: "prod",
    debug: false
  });

  const form = window.magicfeedback.form("APP_ID", "PUBLIC_KEY");

  form.generate("survey-root", {
    addButton: true,
    addSuccessScreen: true
  });
</script>
```

### Vite / Webpack / SPA

```ts
import magicfeedback from "@magicfeedback/native";
import "@magicfeedback/native/dist/styles/magicfeedback-default.css";

magicfeedback.init({
  env: "prod"
});

const form = magicfeedback.form("APP_ID", "PUBLIC_KEY");

await form.generate("survey-root", {
  addButton: true,
  addSuccessScreen: true
});
```

```html
<div id="survey-root"></div>
```

## Initialization

`init()` should be called once before any networked usage.

```ts
magicfeedback.init({
  env: "prod",
  debug: false,
  dryRun: false
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `env` | `"prod" \| "dev"` | `"prod"` | Selects the production or development API host. |
| `debug` | `boolean` | `false` | Enables console logging. |
| `dryRun` | `boolean` | `false` | Loads and navigates forms without sending feedback or requesting follow-up questions. |

`dryRun` is the safest way to QA a survey before giving it to a client.

## Render a form

Create a form instance with an app id and public key:

```ts
const form = magicfeedback.form("APP_ID", "PUBLIC_KEY");
```

Then render it into a container:

```ts
await form.generate("survey-root", {
  addButton: true,
  sendButtonText: "Send",
  backButtonText: "Back",
  nextButtonText: "Next",
  startButtonText: "Start",
  addSuccessScreen: true,
  successMessage: "Thank you for your feedback!",
  questionFormat: "standard",
  getMetaData: true,
  customMetaData: [
    { key: "customer-id", value: ["acme-42"] },
    { key: "plan", value: ["enterprise"] }
  ],
  onLoadedEvent: ({ formData, progress, total, error }) => {
    console.log("loaded", { formData, progress, total, error });
  },
  beforeSubmitEvent: ({ progress, total }) => {
    console.log("before submit", { progress, total });
  },
  afterSubmitEvent: ({ response, progress, total, completed, followup, error }) => {
    console.log("after submit", {
      response,
      progress,
      total,
      completed,
      followup,
      error
    });
  },
  onBackEvent: ({ progress, followup, error }) => {
    console.log("back", { progress, followup, error });
  }
});
```

### `generate()` options used by the current runtime

| Option | Default | Description |
| --- | --- | --- |
| `addButton` | `true` | Renders the built-in action buttons. |
| `sendButtonText` | `"Send"` | Label for the final submit button. |
| `backButtonText` | `"Back"` | Label for the back button. |
| `nextButtonText` | `"Next"` | Label for the next button in multi-step flows. |
| `startButtonText` | `"Go!"` | Label for the start button when the form has a backend start message. |
| `addSuccessScreen` | `true` | Shows the built-in success view when the flow finishes. |
| `successMessage` | `"Thank you for your feedback!"` | Custom success text. |
| `questionFormat` | `"standard"` | `"standard"` or `"slim"`. |
| `getMetaData` | `true` | Appends browser and page metadata automatically. |
| `customMetaData` | `[]` | Extra metadata merged into `feedback.metadata` when `getMetaData` is enabled. |
| `onLoadedEvent` | `undefined` | Called after the form or start screen is ready. |
| `beforeSubmitEvent` | `undefined` | Called before a page is submitted. |
| `afterSubmitEvent` | `undefined` | Called after a page submit, follow-up render, or final completion. |
| `onBackEvent` | `undefined` | Called after navigating back. |

When `getMetaData` is enabled, the SDK includes the current URL, origin, pathname, query string, user agent, browser language, platform, app metadata, screen size, and the session id when rendering from `session()`. Query params are also expanded into metadata entries as `query-<param>` with all values for that param.

## Resume an existing session

If you already have a MagicFeedback session id, render it directly:

```ts
magicfeedback.init({ env: "prod" });

const form = magicfeedback.session("SESSION_ID");
await form.generate("survey-root", {
  addButton: true
});
```

## Manual navigation

If you want to control your own buttons, disable the built-in actions and call `send()` / `back()` yourself.

```ts
const form = magicfeedback.form("APP_ID", "PUBLIC_KEY");

await form.generate("survey-root", {
  addButton: false
});

document.getElementById("next-btn")?.addEventListener("click", () => {
  form.send(
    [{ key: "source", value: ["pricing-page"] }],
    [{ key: "account-score", value: ["92"] }],
    [{ key: "customer-email", value: ["user@example.com"] }]
  );
});

document.getElementById("back-btn")?.addEventListener("click", () => {
  form.back();
});
```

`form.send()` accepts arguments in this order:

1. `metadata`
2. `metrics`
3. `profile`

Each item should follow the same shape:

```ts
{ key: "some-key", value: ["some-value"] }
```

## Send feedback directly

Use `magicfeedback.send()` when you do not want the SDK to render any UI.

```ts
await magicfeedback.send(
  "APP_ID",
  "PUBLIC_KEY",
  {
    text: "",
    answers: [
      { key: "nps", value: ["9"] },
      { key: "favorite-feature", value: ["Conditional logic"] }
    ],
    metadata: [
      { key: "source", value: ["pricing-page"] }
    ],
    metrics: [
      { key: "plan", value: ["pro"] }
    ],
    profile: [
      { key: "email", value: ["user@example.com"] }
    ]
  },
  true
);
```

Signature:

```ts
magicfeedback.send(
  appId,
  publicKey,
  feedback,
  completed = true,
  id?,
  privateKey?
);
```

## Preview a question locally

`previewQuestion()` renders one question or an array of questions without changing the internal flow state.

```ts
const previewForm = magicfeedback.form("demo", "demo");

previewForm.previewQuestion("preview-root", {
  id: "q_text",
  title: "What is your name?",
  type: "TEXT",
  questionType: { conf: [] },
  ref: "name",
  require: true,
  external_id: "",
  value: [],
  defaultValue: "",
  followup: false,
  position: 1,
  assets: {
    placeholder: "Type your name",
    subtitle: "Used only for preview"
  },
  refMetric: "",
  integrationId: "demo",
  integrationPageId: "demo"
}, {
  format: "standard",
  language: "en",
  product: { customIcons: false },
  clearContainer: true,
  wrap: true
});
```

This is useful for QA, local demos, and visual regression checks.

## Supported rendered question types

The renderer currently supports these question types:

- `TEXT`
- `LONGTEXT`
- `NUMBER`
- `RADIO`
- `MULTIPLECHOICE`
- `SELECT`
- `DATE`
- `EMAIL`
- `PASSWORD`
- `BOOLEAN`
- `CONSENT`
- `RATING_STAR`
- `RATING_EMOJI`
- `RATING_NUMBER`
- `MULTIPLECHOISE_IMAGE`
- `MULTI_QUESTION_MATRIX`
- `POINT_SYSTEM`
- `PRIORITY_LIST`
- `INFO_PAGE`
- `UPLOAD_FILE`
- `UPLOAD_IMAGE`

For the output payload generated by `Form.answer()`, see [docs/answer-format.md](docs/answer-format.md). That document describes payload serialization, while the list above reflects the question types currently rendered by the browser UI.

Important payload notes:

- `EMAIL` answers are also copied into `feedback.profile` as `email`.
- `POINT_SYSTEM` answers are serialized as values such as `"Quality:60%"`.
- `MULTI_QUESTION_MATRIX` answers are grouped into a single JSON string entry.
- Required `MULTI_QUESTION_MATRIX` questions must have an answer in every row before the SDK allows submission.
- `INFO_PAGE`, `UPLOAD_FILE`, and `UPLOAD_IMAGE` render in the UI but do not currently create answer entries.

## Styling

Import the bundled stylesheet:

```ts
import "@magicfeedback/native/dist/styles/magicfeedback-default.css";
```

Or with plain HTML:

```html
<link
  rel="stylesheet"
  href="./node_modules/@magicfeedback/native/dist/styles/magicfeedback-default.css"
/>
```

You can override the main CSS variables without modifying the distributed file:

```css
:root {
  --mf-primary: #0f766e;
  --mf-primary-hover: #115e59;
  --mf-primary-light: #ccfbf1;

  --mf-text-primary: #0f172a;
  --mf-text-secondary: #475569;

  --mf-bg-primary: #ffffff;
  --mf-bg-secondary: #f8fafc;

  --mf-border: #cbd5e1;
  --mf-border-focus: #0f766e;

  --mf-radius-md: 0.5rem;
  --mf-shadow-md: 0 10px 20px rgba(15, 23, 42, 0.08);
}
```

For deeper customization, inspect `dist/styles/magicfeedback-default.css` and override the generated classes from your own stylesheet.

## QA and staging

Recommended setup for client review:

```ts
magicfeedback.init({
  env: "dev",
  debug: true,
  dryRun: true
});
```

This combination lets you load the survey, navigate questions, and inspect callbacks without creating real feedback records.

## Examples in this repository

- `examples/frontend/browser.html` - minimal browser integration
- `examples/frontend/browser_static.html` - live form plus local previews for all supported question types
- `examples/frontend/form.html` - embed the SDK inside an existing page layout
- `examples/frontend/embedded_in_form.html` - combine static inputs with SDK-managed questions
- `docs/answer-format.md` - exact payload format produced by `Form.answer()`

## Troubleshooting

If the form does not load:

- Confirm that `magicfeedback.init()` has been called.
- Confirm that the container id passed to `generate()` exists in the DOM.
- Check that you are using the correct `APP_ID`, `PUBLIC_KEY`, or `SESSION_ID`.
- Turn on `debug: true` to inspect SDK logs.
- Use `dryRun: true` when validating the flow before production rollout.
