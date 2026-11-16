import {describe, expect, test} from "@jest/globals";
import * as fs from "fs";
import * as path from "path";
import {Form} from "../src/models/form";
import {Config} from "../src/models/config";

// magicfeedback-default.css is loaded on the host page, so a bare `p`, `h2`
// or `input` rule restyles the host app too (ATP Selvbetjening, DD-180).
// Every rule has to stay inside the survey container, or the priority-list
// modal, which is portaled to <body>.
const CSS_PATH = path.join(__dirname, "../src/styles/magicfeedback-default.css");
const SCOPED = /\.magicfeedback-|^:root$/;

/** Selectors of every style rule (top level and inside @media), keyframes left out. */
function selectors(css: string): string[] {
    const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const out: string[] = [];
    const stack: string[] = []; // prelude of each open block
    let buffer = "";
    for (const ch of src) {
        if (ch === "{") {
            const prelude = buffer.trim();
            const inKeyframes = stack.some(p => /^@(-\w+-)?keyframes/.test(p));
            if (!prelude.startsWith("@") && !inKeyframes) {
                out.push(...prelude.split(",").map(s => s.trim()).filter(Boolean));
            }
            stack.push(prelude);
            buffer = "";
        } else if (ch === "}") {
            stack.pop();
            buffer = "";
        } else if (ch === ";") {
            buffer = ""; // declarations and @import
        } else {
            buffer += ch;
        }
    }
    return out;
}

describe("magicfeedback-default.css scope", () => {
    test("the parser finds the stylesheet's rules", () => {
        const all = selectors(fs.readFileSync(CSS_PATH, "utf8"));
        expect(all.length).toBeGreaterThan(200);
        expect(all).toContain(".magicfeedback-container");
    });

    test("every selector is scoped to the survey", () => {
        const unscoped = selectors(fs.readFileSync(CSS_PATH, "utf8")).filter(s => !SCOPED.test(s));
        expect(unscoped).toEqual([]);
    });

    test("the check catches a bare element rule", () => {
        expect(selectors("p { margin: 0 }\n@media (x) { input, .magicfeedback-a { color: red } }")
            .filter(s => !SCOPED.test(s))).toEqual(["p", "input"]);
    });

    test("previewQuestion marks its host so the scoped rules still apply", () => {
        document.body.innerHTML = `<div id="preview-host"></div>`;
        const form = new Form(new Config(), "app-id", "public-key");
        form.previewQuestion("preview-host", {
            id: "q", title: "Name?", type: "TEXT", questionType: {conf: []}, ref: "name", require: false,
            external_id: "", value: [], defaultValue: "", followup: false, position: 1, assets: {},
            refMetric: "", integrationId: "app-id", integrationPageId: "p"
        } as any, {language: "en"});

        const host = document.getElementById("preview-host") as HTMLElement;
        expect(host.classList.contains("magicfeedback-preview")).toBe(true);
        expect(host.querySelector("input")).not.toBeNull();
    });
});
