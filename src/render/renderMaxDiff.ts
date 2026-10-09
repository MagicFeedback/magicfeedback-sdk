import {QuestionRenderer} from "./types";
import {parseTitle} from "./helpers";
import {t} from "../services/i18n";

const SVG_NS = "http://www.w3.org/2000/svg";

type Side = "best" | "worst";

function arrowIcon(side: Side): SVGSVGElement {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2.6");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", side === "best" ? "M12 19V5M5 12l7-7 7 7" : "M12 5v14M19 12l-7 7-7-7");
    svg.appendChild(path);

    return svg;
}

/** "Block {k} of {n}" with a thin bar, for a question the API split into screens. */
function setProgress(setIndex: number, setCount: number, language: string): HTMLElement {
    const progress = document.createElement("div");
    progress.classList.add("magicfeedback-max-diff-progress");

    const label = document.createElement("span");
    label.classList.add("magicfeedback-max-diff-progress-label");
    label.textContent = t(language, "maxDiff.setProgress", {k: setIndex, n: setCount});

    const track = document.createElement("span");
    track.classList.add("magicfeedback-max-diff-progress-track");
    track.setAttribute("aria-hidden", "true");

    const fill = document.createElement("span");
    fill.classList.add("magicfeedback-max-diff-progress-fill");
    fill.style.width = `${Math.min(100, (setIndex / setCount) * 100)}%`;

    track.appendChild(fill);
    progress.appendChild(label);
    progress.appendChild(track);
    return progress;
}

/**
 * MaxDiff (best–worst scaling): the respondent sees one set of items and marks
 * the most and the least important.
 *
 * Each column is its own radio group (`${ref}-best`, `${ref}-worst`), so the
 * browser already allows a single pick per side; the change handler only has
 * to stop one item from being both, by clearing the other side of its row.
 *
 * The items of the set come from `value`, like the options of a RADIO. The API
 * serves each screen of a multi-screen design as its own page, with
 * `assets.setIndex` / `assets.setCount`; without them this is screen 1 of 1.
 */
export const renderMaxDiff: QuestionRenderer = ({
    question,
    language,
    randomPosition
}) => {
    const {ref, value, assets} = question;

    const element = document.createElement("div");
    const elementTypeClass = "magicfeedback-max-diff";

    let items = [...(value || [])];
    if (randomPosition) items = items.sort(() => Math.random() - 0.5);

    const labels: Record<Side, string> = {
        best: parseTitle(assets?.bestLabel, language) || t(language, "maxDiff.best"),
        worst: parseTitle(assets?.worstLabel, language) || t(language, "maxDiff.worst"),
    };

    const container = document.createElement("div");
    container.classList.add("magicfeedback-max-diff-container");

    const setIndex = Number(assets?.setIndex) || 1;
    const setCount = Number(assets?.setCount) || 1;
    if (assets?.showSetProgress && setCount > 1) {
        container.appendChild(setProgress(setIndex, setCount, language));
    }

    const table = document.createElement("table");
    table.classList.add("magicfeedback-max-diff-table");

    const headerCell = (side: Side) => {
        const th = document.createElement("th");
        th.scope = "col";
        th.classList.add("magicfeedback-max-diff-head", `magicfeedback-max-diff-head-${side}`);

        const content = document.createElement("span");
        content.classList.add("magicfeedback-max-diff-head-label");
        content.appendChild(arrowIcon(side));
        content.appendChild(document.createTextNode(labels[side]));

        th.appendChild(content);
        return th;
    };

    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    const spacer = document.createElement("td");
    spacer.classList.add("magicfeedback-max-diff-head-spacer");
    headRow.appendChild(headerCell("best"));
    headRow.appendChild(spacer);
    headRow.appendChild(headerCell("worst"));
    head.appendChild(headRow);
    table.appendChild(head);

    const pickCell = (side: Side, item: string, index: number) => {
        const td = document.createElement("td");
        td.classList.add("magicfeedback-max-diff-cell");

        // The label is the click target for the whole cell; the input carries
        // the accessible name, since the cell itself shows no text.
        const pick = document.createElement("label");
        pick.classList.add("magicfeedback-max-diff-pick");

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `${ref}-${side}`;
        input.value = item;
        input.id = `${ref}-${side}-${index}`;
        input.classList.add("magicfeedback-input", "magicfeedback-max-diff-input", `magicfeedback-max-diff-${side}`);
        input.setAttribute("aria-label", `${item}: ${labels[side]}`);

        pick.appendChild(input);
        td.appendChild(pick);
        return td;
    };

    const body = document.createElement("tbody");

    items.forEach((item: string, index: number) => {
        const row = document.createElement("tr");
        row.classList.add("magicfeedback-max-diff-row");

        const itemCell = document.createElement("th");
        itemCell.scope = "row";
        itemCell.classList.add("magicfeedback-max-diff-item");
        itemCell.textContent = item;

        row.appendChild(pickCell("best", item, index));
        row.appendChild(itemCell);
        row.appendChild(pickCell("worst", item, index));
        body.appendChild(row);
    });

    table.appendChild(body);

    table.addEventListener("change", (event) => {
        const input = event.target as HTMLInputElement;
        if (!input.classList.contains("magicfeedback-max-diff-input")) return;

        input.closest("tr")?.querySelectorAll<HTMLInputElement>(".magicfeedback-max-diff-input").forEach((other) => {
            if (other !== input) other.checked = false;
        });
    });

    container.appendChild(table);
    element.appendChild(container);

    return {element, elementTypeClass};
};
