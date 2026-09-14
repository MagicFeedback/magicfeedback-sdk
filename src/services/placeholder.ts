import {t} from "./i18n";

/**
 * Thin, backwards-compatible facade over the translation table in `i18n.ts`.
 * The copy itself lives there so every language stays in one place; this shape
 * is kept because the renderers already call `placeholder.answer(lang)` etc.
 */
export const placeholder = {
    answer: (language: string) => t(language, "placeholder.answer"),
    number: (language: string) => t(language, "placeholder.number"),
    email: (language: string) => t(language, "placeholder.email"),
    date: (language: string) => t(language, "placeholder.date"),
    password: (language: string) => t(language, "placeholder.password"),
    pointsystemerror: (language: string) => t(language, "pointSystem.error"),
    upload: {
        cta: (language: string) => t(language, "upload.cta"),
        formats: (language: string, kind: "image" | "file") =>
            t(language, kind === "image" ? "upload.imagesOnly" : "upload.anyFileType"),
        maxFiles: (language: string, n: number) => t(language, "upload.maxFiles", {n}),
        maxSize: (language: string, mb: number) => t(language, "upload.maxSize", {mb}),
        tooLarge: (language: string, mb: number) => t(language, "upload.tooLarge", {mb}),
        remove: (language: string) => t(language, "upload.remove")
    }
};
