import {t} from "../services/i18n";

export function parseTitle(title: string | Record<string, string> | undefined, lang: string): string {
    if (!title) return '';
    return typeof title === "object" ? (title[lang] || title['en']) : title;
}

export function getBooleanOptions(lang: string): string[] {
    return [t(lang, 'boolean.yes'), t(lang, 'boolean.no')];
}

export function getUrlParam(key: string): string | null {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(key);
}
