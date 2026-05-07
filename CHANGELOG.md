# MagicFeedbackAI SDK Changelog

This document outlines the changes and updates made to the [@magicfeedback/native](https://www.npmjs.com/package/@magicfeedback/native) JS SDK.

We recommend keeping your SDK up-to-date to benefit from the latest features, bug fixes, and security improvements.

Please refer to the specific version number for detailed information.

## 🚀 [2.2.2] - 2026-05-07
- **New feature:** Added `sdk.previewPage(selector, input, options?)` and `Form.previewPage(...)` to render a single page from the survey creator without fetching the form from the API and without persisting answers to `/feedback`. The render reuses the production pipeline so behavior (validation, buttons, followups, styling) is identical.
- **New type:** Exported `PreviewPageInput` (`page`, `identity`, `lang`, `product`, `style`, `appId`) for typed preview payloads.
- **Improvement (`form()` constructor):** Accepts optional `profile` and `metadata` parameters to pre-seed the feedback payload at construction time.
- **Fix (`dryRun`):** Followup questions now keep their production behavior under `dryRun`. Previously `Form.callFollowUpQuestion` short-circuited and returned `null` in dry-run, which made followup branches disappear in test/preview flows. POST `/feedback` is still skipped under `dryRun`; only the followup API call was restored.
- **Tests:** Added `test/preview-page.test.ts` covering single-page render, no API fetch, and no `/feedback` POST on submit. Updated `test/dry-run.test.ts` to assert the followup API is called under `dryRun`.
- **Docs:** Added `docs/preview-page-implementation.md` as a self-contained implementation guide for the preview API and the followup fix.

## 🚀 [2.1.12] - 2026-03-20
- **Fix:** Preconditional ALLOW routes now use AND logic — all conditions must be satisfied for a page to be shown. Previously, a single matching condition was enough (OR logic), causing pages to appear when they shouldn't (e.g. Matas survey: page 29 was incorrectly shown for users on "Club Matas appen").
- **Fix:** Each preconditional route now looks up the answer specific to its own `questionRef` instead of reusing a single shared answer across all routes. This prevents incorrect evaluation when multiple preconditions reference different questions.
- **Improvement:** URL query parameters are now captured individually as metadata entries (`query-<key>`), enabling better attribution and segmentation of feedback responses.
- **Improvement:** Removed stray `console.log` statements from `form.ts` and `pageGraphs.ts` that leaked debug output into production builds.
- **Tests:** Added comprehensive test suite for `PageGraph` methods: `getFirstPage`, `getNodeById`, `getNextEdgeByDefault`, `getNextPage` (all operators, DIRECT/LOGICAL/PRECONDITIONAL routes, branching, FINISH transitions, multiplechoice answers, edge cases).
- **Tests:** Added `findDepth` tests and preconditional-aware depth calculation tests (Matas-like surveys).
- **Tests:** Added dedicated `preconditional.test.ts` that reproduces the multi-ALLOW bug and validates the AND-logic fix against the old OR-logic behavior.

## 🚀 [2.1.11] - 2026-03-09
- New feature: Added `dryRun` mode to validate and navigate feedback flows without sending submissions or follow-up requests.
- New feature: Expanded answer processing for `MULTI_QUESTION_MATRIX`, `POINT_SYSTEM`, and multiple choice questions, including stricter validation for required matrix rows.
- Improvement: Added support for custom metadata and improved `INFO_PAGE` rendering with styled titles and conditional content handling.
- Improvement: Refactored renderers and default styles to improve modal consistency, rating placeholders, and mobile responsiveness.
- Fix: Switched time-to-complete tracking from seconds to milliseconds for more accurate analytics.

## 🚀 [2.1.5] - 2026-01-09
- Validation: Required Multi Question Matrix now enforces an answer for every row before allowing submission.
- UX/DX: Clearer error messages when required questions are incomplete, preventing accidental submissions.
- Internal: Hardened matrix answer parsing/serialization used by conditional routing and validation.

## 🚀 [2.1.1] - 2025-10-20
- Added logic to manage conditional in matrix questions: now you can set conditions based on matrix question responses.

## 🚀 [2.1.0] - 2025-10-06
- New feature: Added support for custom CSS classes to the feedback widget, allowing users to apply their own styles.
- Improvement: Enhanced the performance of the feedback widget by optimizing the loading of assets.
- Improvement: Implement domain restriction based on originAllowed and enhance rating hover effects.

## 🚀 [2.0.4] - 2025-09-08
- Preconditional logic:
  - Allow to enter: Allow users to enter a question based on a pre-condition.
  - Skip to question: Allow users to skip to a specific question based on a pre-condition.v.2.0.4

## 🚀 [2.0.3] - 2025-08-25
- Preconditional logic: Added a new preconditional logic feature that allows users to set conditions before displaying a question.
- Improvement: Enhanced the performance of the feedback widget on mobile devices.
- Fix: Resolved an issue that caused the feedback widget to crash on certain browsers.
- Fix: Fixed a bug that caused the progress bar to display incorrectly in some scenarios.

## 🚀 [1.4.9] - 2025-07-14
- New feature: Support for custom themes in the feedback widget.
- Improvement: Performance optimization when loading conditional questions.
- Improvement: Better error handling in integration with external APIs.
- Fix: Resolved an issue that prevented saving responses in matrix widgets under certain conditions.
- Fix: Adjusted progress bar display on mobile devices.
- Fix: Fixed a bug causing duplicate sessions in some browsers.

## 🚀 [1.4.2] - 2025-03-18
- Click and next question: Added a new feature that allows users to click on the question to go to the next question.
- Rating: Option Vertical & Order: Added a new feature that allows users to change the order of the rating options.
- Fixed bugs:
    - Fixed bug in rating placeholders
    - Fixed error on load and get time to completed
    - Fixed multi question bug performance

## 🚀 [1.3.5] - 2024-12-09
- Updated progress count in the progress bar by conditional logic.
- Fixed bugs:
    - Radio extra options widget: Fixed a bug that caused the widget to don't save correctly.

## 🚀 [1.3.4] - 2024-11-25
- Fixed bugs:
    - Increased the deepness of the conditional logic.
    - Fixed a bug.

## 🚀 [1.3.3] - 2024-11-04
- Increase the deepness of the conditional logic.
- Added randomize option to seme widget.
- More personalization options for the extra options widget.
## 🚀 [1.3.2] - 2024-10-22
- Implemented new question types:
    - Multiple matrix: Option to add image to the matrix.
    - Information: A widget that displays information to the user.

## 🚀 [1.3.1] - 2024-10-21
- New conditional logic: Added a new conditional logic feature that allows users to create complex feedback flows based on user responses.
- New conditional types: Added a external redirect and finish conditional logic.
- Fixed bugs:
    - Increased the deepness of the conditional logic.

## 🚀 [1.2.9] - 2024-07-19
- Conditional logic: Added a new conditional logic feature that allows users to create complex feedback flows based on user responses.
- Sessions: Added a new session feature that allows users to save and resume feedback sessions.

## 🚀 [1.2.5] - 2024-05-26
- New widgets: Added a new widget type:
    - Matrix selected: A widget that allows users to select multiple options from a matrix.
    - Priority list: A widget that allows users to rank a list of items by priority.
    - Percentage list values: A widget that allows users to assign percentage values to a list of items.
- Increased the number of options in the multiple choice widget to form 0 or 1 to 2 to 10
- Added a new option to the boolean widget to allow users to select "N/A" as an option.
- Added a new option to the multiple choice widget to allow users to select "Other" as an option.
- Added a new option to the longtext widget to allow users to select "Skip" as an option.
- Init and end page with a new design, include the option to render a custom html.

## 🚀 [1.2.4] - 2024-06-11
### New Features
- Added dynamic conditional options:
  - Finish conditional: A new option that allows users to finish the feedback flow based on a condition.
  - Skip conditional: A new option that allows users to skip a question based on a condition.
  - Redirect conditional: A new option that allows users to redirect to a specific question based on a condition.
- Get default values by params: new possibility to get the default values of the feedback by params.

## 🚀 [1.1.16] - 2024-04-26
- Added image in inputs, now you can add images in the feedback inputs to make it more interactive.
- Added new widget logic to increase the flexibility of the feedback flow
- New widgets: Added a new widget type:
    - Multiple choice image: A widget that allows users to select multiple image options from a list.
    - Contact form: A widget that allows users to submit their contact information.
    - Yes/No: A widget that allows users to answer a yes/no question.
- Fixed bugs:
    - Resolved a bug with stars rating widget on save data 


## 🚀 [1.1.15] - 2024-03-26

### New Features
- Users can now customize the text of various UI elements within the feedback widget:
  - Metadata: Added the ability to pass metadata to the feedback widget. This metadata will be included in the feedback submission.
- New widgets: Added a new widget type:
    - Rating emoji 0-10: A widget that allows users to rate their experience using emojis.
    - Rating emoji 1-5: A widget that allows users to rate their experience using emojis.
    - Rating stars 1-5: A widget that allows users to rate their experience using stars.
    - Rating numbers 0-10: A widget that allows users to rate their experience using numbers.
    - Rating numbers 1-5: A widget that allows users to rate their experience using numbers.

## 🚀 [1.1.13] - 2024-03-08

### New Features
- Users can now customize the text of various UI elements within the feedback widget:
    - Send button
    - Back button
    - Next button
    - Success message
- Additionally, the success screen can be disabled entirely, allowing for more flexibility in the feedback flow.
- Question Format: Introduced a "slim" question format where the label is displayed as a placeholder within the input field.
- Boolean Option Styling: A new special class can be applied to boolean options to position the label on the right side.

### Bug Fixes:
- Resolved several bugs that were identified during initial development. (For detailed information on specific bug fixes, consider adding a link to an issue tracker if applicable)
