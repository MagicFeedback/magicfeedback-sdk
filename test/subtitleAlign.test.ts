import {describe, expect, test} from "@jest/globals";
import {renderQuestions, resolveSubtitleAlign} from "../src/services/questions.service";
import {NativeQuestion} from "../src/models/types";

const question = (type: string, assets: Record<string, any>) => ({
    id: `q-${type}`, ref: type.toLowerCase(), type, title: "How many employees does your company have?",
    require: false, assets,
} as unknown as NativeQuestion);

const subtitle = (type: string, assets: Record<string, any>) => {
    const [el] = renderQuestions([question(type, assets)], "standard", "en", {customIcons: false} as any);
    return el.querySelector(".magicfeedback-sublabel") as HTMLElement;
};

describe("assets.subtitleAlign", () => {
    // Before, the subtitle had no alignment and took the host's (MagicSurvey centers everything).
    test("without the asset the subtitle is left-aligned", () => {
        expect(subtitle("TEXT", {subtitle: "Count everyone on payroll"}).style.textAlign).toBe("left");
    });

    test.each(["left", "center", "right"])("%s is applied", (align) => {
        expect(subtitle("TEXT", {subtitle: "Count everyone", subtitleAlign: align}).style.textAlign).toBe(align);
    });

    test("works on other question types and keeps B/I/U", () => {
        const el = subtitle("RADIO", {subtitle: "Pick one", subtitleAlign: "right", subtitleStyle: ["bold", "italic"]});
        expect(el.style.textAlign).toBe("right");
        expect(el.style.fontWeight).toBe("bold");
        expect(el.style.fontStyle).toBe("italic");
    });

    test("an unknown value falls back to left", () => {
        expect(resolveSubtitleAlign("justify")).toBe("left");
        expect(resolveSubtitleAlign(undefined)).toBe("left");
    });
});
