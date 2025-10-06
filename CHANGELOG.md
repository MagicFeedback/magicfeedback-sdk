# MagicFeedbackAI SDK Changelog

This document outlines the changes and updates made to the [@magicfeedback/native](https://www.npmjs.com/package/@magicfeedback/native) JS SDK.

We recommend keeping your SDK up-to-date to benefit from the latest features, bug fixes, and security improvements.

Please refer to the specific version number for detailed information.

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
