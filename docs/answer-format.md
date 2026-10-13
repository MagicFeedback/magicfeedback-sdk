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
| `MAX_DIFF` | `ref` | `[JSON.stringify([{ set: 1, shown: [...], best: "B", worst: "D" }, { set: 2, shown: ["A", "B", "C", "D"], best: "A", worst: "C" }])]` |
| `INFO_PAGE` | n/a | No entry is created |
| `UPLOAD_FILE` | n/a | No entry is created |
| `UPLOAD_IMAGE` | n/a | No entry is created |

## Notes

- `POINT_SYSTEM` values are formatted as `${optionLabel}:${value}%`, where `optionLabel` comes from the input `id`.
- `MULTI_QUESTION_MATRIX` rows are collected from inputs named `${ref}-${rowKey}` and grouped into a single JSON string.
- `MAX_DIFF` picks are collected from the radio groups `${ref}-best` and `${ref}-worst` and grouped into a single JSON string: an array of sets, each with its `set` (`assets.setIndex`, 1 when missing), the items `shown` (in the order they were shown) and the `best` / `worst` picks (`null` when that side was left empty).
  - The API serves each screen of a MAX_DIFF as its own page with the same `ref`, and keeps only the last answer row per key, so every push carries all the screens answered so far: those of the latest earlier page that answered the `ref`, with the current screen replacing an earlier answer to the same `set`, ordered by `set`.
  - A required MAX_DIFF needs both picks on the screen being answered.
- If an `EMAIL` value is invalid, `Form.answer()` logs an error and returns an empty answers array.
- `MULTIPLECHOICE` extra option text, if present, is captured as a separate input with `name` equal to `extra-option-${ref}`, so it appears as its own entry in `feedback.answers`.
