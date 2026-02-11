export function parseTitle(title: string | Record<string, string> | undefined, lang: string): string {
    if (!title) return '';
    return typeof title === "object" ? (title[lang] || title['en']) : title;
}

export function getBooleanOptions(lang: string): string[] {
    switch (lang) {
        case "es":
            return ['Sí', 'No'];
        case "fr":
            return ['Oui', 'Non'];
        case "de":
            return ['Ja', 'Nein'];
        case "it":
            return ['Sì', 'No'];
        case "pt":
            return ['Sim', 'Não'];
        case "nl":
            return ['Ja', 'Nee'];
        case "pl":
            return ['Tak', 'Nie'];
        case "ru":
            return ['Да', 'Нет'];
        case "ja":
            return ['はい', 'いいえ'];
        case "zh":
            return ['是', '不'];
        case "ko":
            return ['예', '아니'];
        case 'da':
            return ['Ja', 'Nej'];
        case 'fi':
            return ['Kyllä', 'Ei'];
        case 'sv':
            return ['Ja', 'Nej'];
        case 'no':
            return ['Ja', 'Nei'];
        case 'ar':
            return ['نعم', 'لا'];
        case 'bn':
            return ['হ্যাঁ', 'না'];
        default:
            return ['Yes', 'No'];
    }
}

export function getUrlParam(key: string): string | null {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(key);
}
