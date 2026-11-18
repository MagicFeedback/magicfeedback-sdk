/**
 * @jest-environment jsdom
 */
import {describe, expect, test} from "@jest/globals";
import * as fs from "fs";
import * as path from "path";
import {
    applyColorMode,
    applyPrimaryColor,
    copyTheme,
    isDarkColor,
    parseColor,
    relativeLuminance,
    resolveColorMode,
} from "../src/render/containerHelpers";
import {Form} from "../src/models/form";
import {Config} from "../src/models/config";
import {FEEDBACKAPPANSWERTYPE, NativeQuestion} from "../src/models/types";

// DD-238: dark Styles get the dark palette instead of black text and white
// answer boxes on a dark background.

const CSS = fs.readFileSync(path.join(__dirname, "../src/styles/magicfeedback-default.css"), "utf8");

describe("parseColor / luminance", () => {
    test("reads hex, short hex, alpha hex and rgb()", () => {
        expect(parseColor("#fff")).toEqual([255, 255, 255, 1]);
        expect(parseColor("#1E293B")).toEqual([30, 41, 59, 1]);
        expect(parseColor("#00000080")?.[3]).toBeCloseTo(0.5, 2);
        expect(parseColor("rgb(10, 20, 30)")).toEqual([10, 20, 30, 1]);
        expect(parseColor("rgba(10,20,30,0.25)")).toEqual([10, 20, 30, 0.25]);
        expect(parseColor("rgb(10 20 30 / 50%)")).toEqual([10, 20, 30, 0.5]);
    });

    test("rejects junk", () => {
        expect(parseColor(undefined)).toBeNull();
        expect(parseColor("")).toBeNull();
        expect(parseColor("red; background: url(x)")).toBeNull();
        expect(parseColor(42)).toBeNull();
    });

    test("WCAG luminance of black and white", () => {
        expect(relativeLuminance("#000")).toBe(0);
        expect(relativeLuminance("#fff")).toBeCloseTo(1, 5);
    });

    test.each([
        // light Styles we ship today
        ["#FFFFFF", false], ["#FAFAFA", false], ["#F3F3F4", false], ["#FFF", false],
        ["#808080", false], ["#F5E6C8", false], ["#9CB3D9", false],
        // dark Styles
        ["#000000", true], ["#121212", true], ["#1E1E1E", true], ["#2B2B2B", true],
        ["#0F172A", true], ["#00263E", true], ["#333333", true], ["#4B5563", true], ["#5d7bad", true],
        // see-through never counts as dark: the host page shows through
        ["rgba(0,0,0,0.2)", false], ["transparent", false],
    ])("%s dark=%s", (color, dark) => {
        expect(isDarkColor(color)).toBe(dark);
    });
});

describe("resolveColorMode", () => {
    test("no Style is light", () => {
        expect(resolveColorMode(undefined)).toBe("light");
        expect(resolveColorMode({})).toBe("light");
    });

    test("the answer box decides first", () => {
        expect(resolveColorMode({boxBackgroundColor: "#1E1E1E", backgroundColor: "#FFFFFF"})).toBe("dark");
        expect(resolveColorMode({boxBackgroundColor: "#FFFFFF", backgroundColor: "#000000"})).toBe("light");
    });

    test("page background when there is no box", () => {
        expect(resolveColorMode({backgroundColor: "#121212"})).toBe("dark");
        expect(resolveColorMode({boxBackgroundColor: "transparent", backgroundColor: "#121212"})).toBe("dark");
    });

    test("a forced mode wins", () => {
        expect(resolveColorMode({boxBackgroundColor: "#FFFFFF"}, "dark")).toBe("dark");
        expect(resolveColorMode({boxBackgroundColor: "#000000"}, "light")).toBe("light");
        expect(resolveColorMode({boxBackgroundColor: "#000000"}, "auto")).toBe("dark");
    });
});

describe("applyColorMode", () => {
    test("dark Style marks the container and keeps the Style's own colors", () => {
        const el = document.createElement("div");
        expect(applyColorMode(el, {boxBackgroundColor: "#1E1E1E", backgroundColor: "#121212"})).toBe("dark");
        expect(el.getAttribute("data-mf-mode")).toBe("dark");
        expect(el.style.getPropertyValue("--mf-surface")).toBe("#1E1E1E");
        expect(el.style.getPropertyValue("--mf-bg-secondary")).toBe("#1E1E1E");
        expect(el.style.getPropertyValue("--mf-bg-primary")).toBe("#121212");
    });

    test("light Style writes light and leaves the bg vars alone", () => {
        const el = document.createElement("div");
        applyColorMode(el, {boxBackgroundColor: "#FFFFFF", backgroundColor: "#FAFAFA"});
        expect(el.getAttribute("data-mf-mode")).toBe("light");
        expect(el.style.getPropertyValue("--mf-surface")).toBe("");
        expect(el.style.getPropertyValue("--mf-bg-primary")).toBe("");
    });

    test("forced dark over a light Style uses the default dark surface", () => {
        const el = document.createElement("div");
        applyColorMode(el, {boxBackgroundColor: "#FFFFFF"}, "dark");
        expect(el.getAttribute("data-mf-mode")).toBe("dark");
        expect(el.style.getPropertyValue("--mf-surface")).toBe("");
    });

    test("a reused container goes back to light", () => {
        const el = document.createElement("div");
        applyColorMode(el, {boxBackgroundColor: "#000"});
        applyColorMode(el, {boxBackgroundColor: "#fff"});
        expect(el.getAttribute("data-mf-mode")).toBe("light");
        expect(el.style.getPropertyValue("--mf-surface")).toBe("");
    });

    test("forced dark uses the Style's dark block first (DD-239)", () => {
        const el = document.createElement("div");
        applyPrimaryColor(el, "#3D5FA8");
        applyColorMode(el, {
            boxBackgroundColor: "#FFFFFF",
            backgroundColor: "#FAFAFA",
            primaryColor: "#3D5FA8",
            dark: {boxBackgroundColor: "#1C1F26", backgroundColor: "#14161B", primaryColor: "#8EAAF0"},
        }, "dark");
        expect(el.getAttribute("data-mf-mode")).toBe("dark");
        expect(el.style.getPropertyValue("--mf-surface")).toBe("#1C1F26");
        expect(el.style.getPropertyValue("--mf-bg-primary")).toBe("#14161B");
        expect(el.style.getPropertyValue("--mf-primary")).toBe("#8EAAF0");
    });

    test("dark block: buttonPrimaryColor is the primary fallback, light boxes are ignored", () => {
        const el = document.createElement("div");
        applyColorMode(el, {dark: {boxBackgroundColor: "#FFFFFF", buttonPrimaryColor: "#FDA4AF"}}, "dark");
        expect(el.style.getPropertyValue("--mf-surface")).toBe("");
        expect(el.style.getPropertyValue("--mf-primary")).toBe("#FDA4AF");
    });

    test("dark block falls back to a Style color that is already dark", () => {
        const el = document.createElement("div");
        applyColorMode(el, {boxBackgroundColor: "#111111", dark: {primaryColor: "#8EAAF0"}});
        expect(el.getAttribute("data-mf-mode")).toBe("dark");
        expect(el.style.getPropertyValue("--mf-surface")).toBe("#111111");
        expect(el.style.getPropertyValue("--mf-primary")).toBe("#8EAAF0");
    });

    test("light mode ignores the dark block", () => {
        const el = document.createElement("div");
        applyColorMode(el, {boxBackgroundColor: "#FFFFFF", dark: {boxBackgroundColor: "#1C1F26", primaryColor: "#8EAAF0"}});
        expect(el.getAttribute("data-mf-mode")).toBe("light");
        expect(el.style.getPropertyValue("--mf-surface")).toBe("");
        expect(el.style.getPropertyValue("--mf-primary")).toBe("");
    });

    test("going back to light drops the dark block primary, keeps the light one", () => {
        const style = {primaryColor: "#3D5FA8", dark: {primaryColor: "#8EAAF0"}};
        const el = document.createElement("div");
        applyColorMode(el, style, "dark");
        expect(el.style.getPropertyValue("--mf-primary")).toBe("#8EAAF0");
        applyPrimaryColor(el, style.primaryColor); // what the form does before applyColorMode
        applyColorMode(el, style, "light");
        expect(el.style.getPropertyValue("--mf-primary")).toBe("#3D5FA8");

        const bare = document.createElement("div");
        applyColorMode(bare, {dark: {primaryColor: "#8EAAF0"}}, "dark");
        applyColorMode(bare, {dark: {primaryColor: "#8EAAF0"}}, "light");
        expect(bare.style.getPropertyValue("--mf-primary")).toBe("");
        expect(bare.hasAttribute("data-mf-dark-primary")).toBe(false);
    });

    test("a dark block that is not an object is ignored", () => {
        const el = document.createElement("div");
        applyColorMode(el, {dark: "#000" as any}, "dark");
        expect(el.style.getPropertyValue("--mf-surface")).toBe("");
        expect(el.style.getPropertyValue("--mf-primary")).toBe("");
    });

    test("copyTheme carries mode and brand color to a portaled element", () => {
        const from = document.createElement("div");
        applyPrimaryColor(from, "#ff0066");
        applyColorMode(from, {boxBackgroundColor: "#111111"});
        const to = document.createElement("div");
        copyTheme(from, to);
        expect(to.getAttribute("data-mf-mode")).toBe("dark");
        expect(to.style.getPropertyValue("--mf-primary")).toBe("#ff0066");
        expect(to.style.getPropertyValue("--mf-surface")).toBe("#111111");
    });
});

describe("stylesheet", () => {
    const darkBlock = CSS.slice(CSS.indexOf('.magicfeedback-container[data-mf-mode="dark"]'));
    const darkVars = darkBlock.slice(0, darkBlock.indexOf("}"));

    test("dark block overrides every light color token", () => {
        const root = CSS.slice(CSS.indexOf(":root {"), CSS.indexOf("}", CSS.indexOf(":root {")));
        const colorTokens = ["--mf-text-primary", "--mf-text-secondary", "--mf-text-muted", "--mf-text-strong",
            "--mf-bg-primary", "--mf-bg-secondary", "--mf-bg-hover", "--mf-border", "--mf-surface",
            "--mf-surface-alt", "--mf-primary-light", "--mf-primary-border", "--mf-success", "--mf-error",
            "--mf-warning", "--mf-danger-text", "--mf-star-empty", "--mf-overlay", "--mf-tint-base"];
        colorTokens.forEach((token) => {
            expect(root).toContain(`${token}:`);
            expect(darkVars).toContain(`${token}:`);
        });
        expect(darkVars).toContain("color-scheme: dark");
    });

    test("no hard-coded colors left in rules (only in token declarations)", () => {
        const noComments = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
        const offenders = noComments.split("\n")
            .filter((line) => /#[0-9a-fA-F]{3,8}\b|rgba?\(|\b(white|black)\b(?!-)/.test(line))
            .filter((line) => !/^\s*--mf-[\w-]+\s*:/.test(line)) // token declarations
            .filter((line) => !/var\(--mf-secondary, #2E2E2E\)/.test(line)) // MagicSurvey token fallback
            .filter((line) => !/white-space/.test(line));
        expect(offenders).toEqual([]);
    });
});

describe("Form applies the mode from the Style", () => {
    const question: NativeQuestion = {
        id: "q-1", title: "Q", type: FEEDBACKAPPANSWERTYPE.TEXT, questionType: {conf: null} as any,
        ref: "q-1", require: false, external_id: "", value: [], defaultValue: "", appId: "app-id",
        followup: false, position: 1, assets: {}, refMetric: "", integrationId: "i", integrationPageId: "p",
    } as any;

    test("previewQuestion with a dark Style", () => {
        document.body.innerHTML = `<div id="host"></div>`;
        const form = new Form(new Config(), "app-id", "public-key");
        const host = form.previewQuestion("host", question, {style: {boxBackgroundColor: "#1B1B1B"}});
        expect(host.getAttribute("data-mf-mode")).toBe("dark");
    });

    test("previewQuestion forced light", () => {
        document.body.innerHTML = `<div id="host"></div>`;
        const form = new Form(new Config(), "app-id", "public-key");
        const host = form.previewQuestion("host", question, {style: {boxBackgroundColor: "#1B1B1B"}, mode: "light"});
        expect(host.getAttribute("data-mf-mode")).toBe("light");
    });
});
