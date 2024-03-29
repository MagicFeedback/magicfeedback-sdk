# MagicFeedbackAI SDK Changelog

This document outlines the changes and updates made to the [@magicfeedback/native](https://www.npmjs.com/package/@magicfeedback/native) JS SDK.

We recommend keeping your SDK up-to-date to benefit from the latest features, bug fixes, and security improvements.

Please refer to the specific version number for detailed information.


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
