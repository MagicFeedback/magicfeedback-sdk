# Answer Format by Question Type

`Form.answer()` collects the current page inputs and writes them into `feedback.answers`. Email is also copied into `feedback.profile` when valid.

General rules:
1. Each entry has `{ key, value }`, where `key` is the input `name`.
2. If multiple inputs share the same `name`, their values are merged into one entry.
3. `INFO_PAGE` and `UPLOAD_*` types do not send values yet, so no answer entry is created.

## Type Mapping

| Type | Key | Value format |
| --- | --- | --- |
| `TEXT` | `ref` | `["text value"]` |
| `LONGTEXT` | `ref` | `["text value"]` |
| `NUMBER` | `ref` | `["42"]` |
| `DATE` | `ref` | `["2026-02-01"]` |
| `CONTACT` | `ref` | `["contact value"]` |
| `PASSWORD` | `ref` | `["secret"]` |
| `EMAIL` | `ref` | `["user@example.com"]` and `feedback.profile += { key: "email", value: ["user@example.com"] }` |
| `CONSENT` | `ref` | `["true"]` or `["false"]` |
| `POINT_SYSTEM` | `ref` | `["OptionA:60%", "OptionB:40%"]` |
| `MULTIPLECHOICE` | `ref` | `["A", "C"]` for checked options |
| `MULTIPLECHOISE_IMAGE` | `ref` | `["img-1"]` for checked options |
| `RADIO` | `ref` | `["selected value"]` |
| `RATING_STAR` | `ref` | `["4"]` |
| `RATING_EMOJI` | `ref` | `["2"]` |
| `RATING_NUMBER` | `ref` | `["9"]` |
| `SELECT` | `ref` | `["selected value"]` |
| `BOOLEAN` | `ref` | `["Yes"]` or `["No"]` |
| `MULTI_QUESTION_MATRIX` | `ref` | `[JSON.stringify([{ key: "Row1", value: ["A"] }, { key: "Row2", value: ["B"] }])]` |
| `PRIORITY_LIST` | `ref` | `["1. First", "2. Second"]` |
| `INFO_PAGE` | n/a | No entry is created |
| `UPLOAD_FILE` | n/a | No entry is created |
| `UPLOAD_IMAGE` | n/a | No entry is created |

## Notes

`MULTIPLECHOICE` extra option text, if present, is captured as a separate input with `name` equal to `extra-option-${ref}`, so it appears as its own entry in `feedback.answers`.
