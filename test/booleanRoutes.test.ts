/**
 * DD-117 (FCK): a Yes/No question whose options were machine-translated to
 * Danish ("Ja"/"Ingen"), with routes saved on those strings. renderBoolean
 * always submits "Yes"/"No", so the routes never matched and every respondent
 * went to the next page.
 */
import {describe, expect, test} from "@jest/globals";
import {PageGraph} from "../src/models/pageGraphs";
import {NativeQuestion} from "../src/models/types";
import {Page} from "../src/models/page";
import {OperatorType, PageRoute, TransitionType} from "../src/models/pageRoute";
import {routeValuesFor} from "../src/utils/booleanAnswer";

const question = (type: string, value: string[], baseValue?: string[]): NativeQuestion => ({
    id: "q-used",
    title: "Har du brugt det tidligere fck.dk?",
    type,
    questionType: {conf: {}},
    ref: "q-used",
    require: true,
    external_id: "",
    value,
    defaultValue: "",
    followup: false,
    position: 1,
    assets: {},
    refMetric: "",
    integrationId: "fck",
    integrationPageId: "p6",
    ...(baseValue ? {baseValue} : {}),
} as NativeQuestion);

describe("routeValuesFor", () => {
    const fck = question("BOOLEAN", ["Ja", "Ingen"]);

    test("maps translated options by position", () => {
        expect(routeValuesFor(["Ja"], fck)).toEqual(["Yes"]);
        expect(routeValuesFor(["Ingen"], fck)).toEqual(["No"]);
    });

    test("uses the default-language options when another language is served", () => {
        // Served in English: value is the translation, baseValue the Danish base.
        const served = question("BOOLEAN", ["Yes", "No"], ["Ja", "Ingen"]);
        expect(routeValuesFor(["Ja"], served)).toEqual(["Yes"]);
        expect(routeValuesFor(["Ingen"], served)).toEqual(["No"]);
    });

    test("keeps Yes/No and unknown values", () => {
        expect(routeValuesFor(["Yes", "no"], fck)).toEqual(["Yes", "No"]);
        expect(routeValuesFor(["Maybe"], fck)).toEqual(["Maybe"]);
    });

    test("leaves other question types alone", () => {
        const radio = question("RADIO", ["Ja", "Nej"]);
        expect(routeValuesFor(["Ja"], radio)).toEqual(["Ja"]);
    });
});

describe("findRoute on a Yes/No question with translated route values", () => {
    const build = (q: NativeQuestion) => {
        const routes = [
            new PageRoute("r-no", q.ref, OperatorType.EQUAL, ["Ingen"], TransitionType.PAGE, "p12", "p6"),
            new PageRoute("r-yes", q.ref, OperatorType.EQUAL, ["Ja"], TransitionType.PAGE, "p8", "p6"),
        ];
        const graph = new PageGraph([
            new Page("p6", 6, "fck", [q], routes),
            new Page("p7", 7, "fck", [], []),
            new Page("p8", 8, "fck", [], []),
            new Page("p12", 12, "fck", [], []),
        ]);
        return {graph, node: graph.getNodeById("p6")!};
    };

    test("Yes goes to page 8, No to page 12", () => {
        const {graph, node} = build(question("BOOLEAN", ["Ja", "Ingen"]));
        expect(graph.findRoute(node, [{key: "q-used", value: ["Yes"]}])?.transitionDestiny).toBe("p8");
        expect(graph.findRoute(node, [{key: "q-used", value: ["No"]}])?.transitionDestiny).toBe("p12");
    });

    test("routes saved as Yes/No keep working", () => {
        const q = question("BOOLEAN", ["Yes", "No"]);
        const graph = new PageGraph([
            new Page("p6", 6, "fck", [q], [
                new PageRoute("r-yes", q.ref, OperatorType.EQUAL, ["Yes"], TransitionType.PAGE, "p8", "p6"),
            ]),
            new Page("p8", 8, "fck", [], []),
        ]);
        const node = graph.getNodeById("p6")!;
        expect(graph.findRoute(node, [{key: "q-used", value: ["Yes"]}])?.transitionDestiny).toBe("p8");
        expect(graph.findRoute(node, [{key: "q-used", value: ["No"]}])).toBeUndefined();
    });
});
