/**
 * Test para reproducir el bug reportado en el survey "Club Matas Behovsidentifikation":
 *
 * BUG: Cuando una página tiene MÚLTIPLES precondiciones ALLOW (por ejemplo,
 * "ubicación de compra" + "categoría de producto"), el código actual:
 *
 * 1. Busca UNA SOLA respuesta (foundAnswer) que coincida con CUALQUIERA de los
 *    refs de las precondiciones, y luego evalúa TODAS las rutas contra esa
 *    misma respuesta. Esto hace que las rutas que apuntan a un ref diferente
 *    no se evalúen contra la respuesta correcta.
 *
 * 2. Usa lógica OR para las rutas ALLOW: basta que UNA se cumpla para que
 *    allowToContinue sea true. Lo correcto es AND: TODAS deben cumplirse.
 *
 * Escenario concreto del reporte:
 * - Posición 29: Helsekost + Matas.dk (con 2 precondiciones ALLOW)
 * - Posición 36: Helsekost + Club Matas appen (con 2 precondiciones ALLOW)
 * - El usuario reporta que la pregunta 29 también aparece en la 36.
 *
 * Causa raíz: La búsqueda de foundAnswer encuentra la respuesta de la categoría
 * (que es la misma para ambas páginas), y dado que la primera precondición
 * (ubicación) no se evalúa contra SU respuesta, se comporta incorrectamente.
 */

import { describe, expect, test } from "@jest/globals";
import { NativeAnswer, NativeQuestion } from "../src/models/types";
import { Page } from "../src/models/page";
import { ConditionType, OperatorType, PageRoute, TransitionType } from "../src/models/pageRoute";
import { PageNode } from "../src/models/pageNode";
import { History } from "../src/models/History";

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

function makeQuestion(ref: string, title: string, type: string = 'RADIO', values: string[] = []): NativeQuestion {
    return {
        id: ref,
        title,
        ref,
        refMetric: '',
        require: true,
        external_id: '',
        value: values,
        defaultValue: '',
        position: 1,
        followup: false,
        assets: {},
        integrationId: 'test',
        integrationPageId: ref,
        type: type as any,
        questionType: { conf: null },
    } as NativeQuestion;
}

function makePreconditionalRoute(
    id: string,
    questionRef: string,
    value: string[],
    pageId: string,
    position: number = 0,
    operator: OperatorType = OperatorType.EQUAL
): PageRoute {
    return new PageRoute(
        id, questionRef, operator, value,
        TransitionType.ALLOW, '', pageId,
        ConditionType.PRECONDITIONAL, position
    );
}

/**
 * Construye un historial donde cada respuesta está en un nodo separado
 * (simula que cada pregunta está en una página diferente, como en el survey real).
 */
function buildHistory(answers: { ref: string; values: string[] }[]): History<PageNode> {
    const history = new History<PageNode>();
    for (const ans of answers) {
        const q = makeQuestion(ans.ref, 'dummy');
        const p = new Page('hist-' + ans.ref, 0, 'test', [q], []);
        const node = new PageNode(p.id, p.position, [], p, [q]);
        node.setAnswer([{ key: ans.ref, value: ans.values }]);
        history.enqueue(node);
    }
    return history;
}

/**
 * Construye un historial donde todas las respuestas están en UN SOLO nodo
 * (simula que las respuestas están acumuladas en this.feedback.answers y el
 * nodo del historial tiene todas).
 */
function buildHistorySingleNode(answers: { ref: string; values: string[] }[]): History<PageNode> {
    const history = new History<PageNode>();
    const questions = answers.map(a => makeQuestion(a.ref, 'dummy'));
    const p = new Page('hist-combined', 0, 'test', questions, []);
    const node = new PageNode(p.id, p.position, [], p, questions);
    node.setAnswer(answers.map(a => ({ key: a.ref, value: a.values })));
    history.enqueue(node);
    return history;
}

// ───────────────────────────────────────────────
// Implementación ACTUAL (buggy) - réplica exacta
// de form.ts líneas 1094-1170
// ───────────────────────────────────────────────

function evaluatePreconditionalsCurrent(
    nextPage: PageNode,
    history: History<PageNode>,
): boolean {
    const preconditionalRoute: PageRoute[] = nextPage.edges
        .filter(edge => edge.typeCondition === 'PRECONDITIONAL')
        .sort((a, b) => a.position - b.position);

    if (preconditionalRoute.length === 0) return true;

    let foundAnswer: any = null;
    const allRefs = preconditionalRoute.map(route => route.questionRef);
    for (let i = history.size() - 1; i >= 0; i--) {
        const node = history.get(i);
        if (!node) continue;
        foundAnswer = node.answers?.find((ans: NativeAnswer) => allRefs.includes(ans.key));
        if (foundAnswer) break;
    }

    let allowToContinue = !preconditionalRoute.some(route => route.transition === TransitionType.ALLOW);

    if (foundAnswer) {
        for (const route of preconditionalRoute) {
            let conditionMet = false;
            const answerVals = Array.isArray(foundAnswer.value) ? foundAnswer.value : [foundAnswer.value];
            const routeVals = Array.isArray(route.value) ? route.value : [route.value];

            switch (route.typeOperator) {
                case 'EQUAL':
                    conditionMet = answerVals.some((v: any) => routeVals.includes(v));
                    break;
                case 'NOEQUAL':
                    conditionMet = answerVals.every((v: any) => !routeVals.includes(v));
                    break;
                case 'INQ':
                    conditionMet = answerVals.some((v: any) => routeVals.includes(v));
                    break;
                case 'NINQ':
                    conditionMet = answerVals.every((v: any) => !routeVals.includes(v));
                    break;
                default:
                    break;
            }

            if (conditionMet) {
                switch (route.transition) {
                    case TransitionType.NEXT:
                        return false;
                    case TransitionType.ALLOW:
                        allowToContinue = true; // BUG: OR en vez de AND
                        break;
                }
            }
        }
    }

    return allowToContinue;
}

// ───────────────────────────────────────────────
// Implementación CORREGIDA
// ───────────────────────────────────────────────

function evaluatePreconditionalsFixed(
    nextPage: PageNode,
    history: History<PageNode>,
): boolean {
    const preconditionalRoute: PageRoute[] = nextPage.edges
        .filter(edge => edge.typeCondition === 'PRECONDITIONAL')
        .sort((a, b) => a.position - b.position);

    if (preconditionalRoute.length === 0) return true;

    const allowRoutes = preconditionalRoute.filter(r => r.transition === TransitionType.ALLOW);
    const hasAllowRoutes = allowRoutes.length > 0;

    // Para rutas ALLOW: TODAS deben cumplirse (AND)
    let allAllowMet = hasAllowRoutes;

    for (const route of preconditionalRoute) {
        // FIX #1: Buscar la respuesta ESPECÍFICA para ESTE ref, no una genérica
        let foundAnswer: NativeAnswer | undefined;
        for (let i = history.size() - 1; i >= 0; i--) {
            const node = history.get(i);
            if (!node) continue;
            foundAnswer = node.answers?.find((ans: NativeAnswer) => ans.key === route.questionRef);
            if (foundAnswer) break;
        }

        let conditionMet = false;
        if (foundAnswer) {
            const answerVals = Array.isArray(foundAnswer.value) ? foundAnswer.value : [foundAnswer.value];
            const routeVals = Array.isArray(route.value) ? route.value : [route.value];

            switch (route.typeOperator) {
                case 'EQUAL':
                    conditionMet = answerVals.some((v: any) => routeVals.includes(v));
                    break;
                case 'NOEQUAL':
                    conditionMet = answerVals.every((v: any) => !routeVals.includes(v));
                    break;
                case 'INQ':
                    conditionMet = answerVals.some((v: any) => routeVals.includes(v));
                    break;
                case 'NINQ':
                    conditionMet = answerVals.every((v: any) => !routeVals.includes(v));
                    break;
                default:
                    break;
            }
        }

        if (route.transition === TransitionType.ALLOW) {
            // FIX #2: AND en vez de OR — si alguna ALLOW falla, no se permite
            if (!conditionMet) {
                allAllowMet = false;
            }
        } else if (route.transition === TransitionType.NEXT && conditionMet) {
            return false; // skip
        }
    }

    return hasAllowRoutes ? allAllowMet : true;
}

// ───────────────────────────────────────────────
// Test data del survey real (Matas)
// ───────────────────────────────────────────────

// Preguntas base del survey (usadas como referencia en los comentarios de los tests)
const _qPurchaseLocation = makeQuestion(
    'q--s39pj',
    'Hvor foregik dit seneste køb hos Matas?',
    'RADIO',
    ['På Matas.dk', 'På Club Matas appen', 'I en Matas-butik']
);

const _qCategory = makeQuestion(
    'q--r69kaf',
    'Fra hvilke(n) kategori(er) shoppede du ved dit seneste køb hos Matas?',
    'MULTIPLECHOICE',
    [
        'Hudpleje (F.eks. creme, serum, bodylotion, m.m.)',
        'Makeup (F.eks. concealer, bronzer, lip gloss, m.m.)',
        'Hårpleje og styling (F.eks. shampoo, balsam, hårspray, m.m.)',
        'Dufte (F.eks. parfume, deodorant, m.m.)',
        'Helsekost (F.eks. vitaminer, mineraler, kosttilskud, m.m.)',
    ]
);
void _qPurchaseLocation;
void _qCategory;

// Página posición 25: Matas.dk + Hudpleje
const page25Routes = [
    makePreconditionalRoute('r25-0', 'q--s39pj', ['På Matas.dk'], 'page-25', 0),
    makePreconditionalRoute('r25-1', 'q--r69kaf', ['Hudpleje (F.eks. creme, serum, bodylotion, m.m.)'], 'page-25', 1),
];
const page25 = new Page('page-25', 25, 'test', [makeQuestion('q--jbsoth', 'Hudpleje Matas.dk', 'MULTIPLECHOICE')], page25Routes);

// Página posición 29: Matas.dk + Helsekost
const page29Routes = [
    makePreconditionalRoute('r29-0', 'q--s39pj', ['På Matas.dk'], 'page-29', 0),
    makePreconditionalRoute('r29-1', 'q--r69kaf', ['Helsekost (F.eks. vitaminer, mineraler, kosttilskud, m.m.)'], 'page-29', 1),
];
const page29 = new Page('page-29', 29, 'test', [makeQuestion('undefined-hs62zq', 'Helsekost Matas.dk', 'MULTIPLECHOICE')], page29Routes);

// Página posición 36: Club Matas appen + Helsekost
const page36Routes = [
    makePreconditionalRoute('r36-0', 'q--s39pj', ['På Club Matas appen'], 'page-36', 0),
    makePreconditionalRoute('r36-1', 'q--r69kaf', ['Helsekost (F.eks. vitaminer, mineraler, kosttilskud, m.m.)'], 'page-36', 1),
];
const page36 = new Page('page-36', 36, 'test', [makeQuestion('undefined-86mkhp', 'Helsekost Club Matas appen', 'MULTIPLECHOICE')], page36Routes);

// Página posición 39: Butik + Hudpleje
const page39Routes = [
    makePreconditionalRoute('r39-0', 'q--s39pj', ['I en Matas-butik'], 'page-39', 0),
    makePreconditionalRoute('r39-1', 'q--r69kaf', ['Hudpleje (F.eks. creme, serum, bodylotion, m.m.)'], 'page-39', 1),
];
const page39 = new Page('page-39', 39, 'test', [makeQuestion('undefined-thvtbh', 'Hudpleje Butik', 'MULTIPLECHOICE')], page39Routes);

function makeNode(page: Page): PageNode {
    return new PageNode(page.id, page.position, page.integrationPageRoutes!, page, page.integrationQuestions);
}

// ───────────────────────────────────────────────
// Tests
// ───────────────────────────────────────────────

describe('Bug: Preconditional ALLOW con múltiples condiciones (survey Matas)', () => {

    describe('Escenario con respuestas en nodos separados (como en producción)', () => {

        describe('Implementación ACTUAL - demuestra el bug', () => {

            test('Matas.dk + Helsekost → p29 (Matas.dk+Helsekost) debería mostrarse', () => {
                const history = buildHistory([
                    { ref: 'q--s39pj', values: ['På Matas.dk'] },
                    { ref: 'q--r69kaf', values: ['Helsekost (F.eks. vitaminer, mineraler, kosttilskud, m.m.)'] },
                ]);

                // Con la implementación actual, foundAnswer encuentra q--r69kaf (último nodo)
                // Ruta 0 (q--s39pj EQUAL "På Matas.dk"): answerVals=["Helsekost..."] → NO
                // Ruta 1 (q--r69kaf EQUAL "Helsekost..."): answerVals=["Helsekost..."] → SÍ → allowToContinue=true
                // RESULTADO: true (¡parece correcto por casualidad!)
                // Pero es un falso positivo: la ruta 0 se evaluó contra la respuesta EQUIVOCADA
                const result = evaluatePreconditionalsCurrent(makeNode(page29), history);
                expect(result).toBe(true);
            });

            test('BUG: Club Matas appen + Helsekost → p29 (Matas.dk+Helsekost) debería NO mostrarse', () => {
                const history = buildHistory([
                    { ref: 'q--s39pj', values: ['På Club Matas appen'] },
                    { ref: 'q--r69kaf', values: ['Helsekost (F.eks. vitaminer, mineraler, kosttilskud, m.m.)'] },
                ]);

                // Con la implementación actual:
                // foundAnswer encuentra q--r69kaf (último nodo) → value: ["Helsekost..."]
                // Ruta 0 (q--s39pj EQUAL "På Matas.dk"): answerVals=["Helsekost..."] → NO
                // Ruta 1 (q--r69kaf EQUAL "Helsekost..."): answerVals=["Helsekost..."] → SÍ → allowToContinue=true
                // RESULTADO: true ← ¡BUG! El usuario eligió "Club Matas appen", NO "Matas.dk"
                const result = evaluatePreconditionalsCurrent(makeNode(page29), history);
                // Esto confirma el bug: devuelve true cuando debería devolver false
                expect(result).toBe(true); // ← BUG CONFIRMADO
            });

            test('BUG: Matas.dk + Hudpleje → p39 (Butik+Hudpleje) debería NO mostrarse', () => {
                const history = buildHistory([
                    { ref: 'q--s39pj', values: ['På Matas.dk'] },
                    { ref: 'q--r69kaf', values: ['Hudpleje (F.eks. creme, serum, bodylotion, m.m.)'] },
                ]);

                // foundAnswer encuentra q--r69kaf → "Hudpleje..."
                // Ruta 0 (q--s39pj EQUAL "I en Matas-butik"): answerVals=["Hudpleje..."] → NO
                // Ruta 1 (q--r69kaf EQUAL "Hudpleje..."): SÍ → allowToContinue=true
                // RESULTADO: true ← ¡BUG! El usuario eligió "Matas.dk", NO "Butik"
                const result = evaluatePreconditionalsCurrent(makeNode(page39), history);
                expect(result).toBe(true); // ← BUG CONFIRMADO
            });
        });

        describe('Implementación CORREGIDA', () => {

            test('Matas.dk + Helsekost → p29 (Matas.dk+Helsekost) se muestra ✓', () => {
                const history = buildHistory([
                    { ref: 'q--s39pj', values: ['På Matas.dk'] },
                    { ref: 'q--r69kaf', values: ['Helsekost (F.eks. vitaminer, mineraler, kosttilskud, m.m.)'] },
                ]);
                expect(evaluatePreconditionalsFixed(makeNode(page29), history)).toBe(true);
            });

            test('Club Matas appen + Helsekost → p29 (Matas.dk+Helsekost) NO se muestra ✓', () => {
                const history = buildHistory([
                    { ref: 'q--s39pj', values: ['På Club Matas appen'] },
                    { ref: 'q--r69kaf', values: ['Helsekost (F.eks. vitaminer, mineraler, kosttilskud, m.m.)'] },
                ]);
                expect(evaluatePreconditionalsFixed(makeNode(page29), history)).toBe(false);
            });

            test('Club Matas appen + Helsekost → p36 (Appen+Helsekost) se muestra ✓', () => {
                const history = buildHistory([
                    { ref: 'q--s39pj', values: ['På Club Matas appen'] },
                    { ref: 'q--r69kaf', values: ['Helsekost (F.eks. vitaminer, mineraler, kosttilskud, m.m.)'] },
                ]);
                expect(evaluatePreconditionalsFixed(makeNode(page36), history)).toBe(true);
            });

            test('Matas.dk + Hudpleje → p39 (Butik+Hudpleje) NO se muestra ✓', () => {
                const history = buildHistory([
                    { ref: 'q--s39pj', values: ['På Matas.dk'] },
                    { ref: 'q--r69kaf', values: ['Hudpleje (F.eks. creme, serum, bodylotion, m.m.)'] },
                ]);
                expect(evaluatePreconditionalsFixed(makeNode(page39), history)).toBe(false);
            });

            test('Butik + Hudpleje → p39 (Butik+Hudpleje) se muestra ✓', () => {
                const history = buildHistory([
                    { ref: 'q--s39pj', values: ['I en Matas-butik'] },
                    { ref: 'q--r69kaf', values: ['Hudpleje (F.eks. creme, serum, bodylotion, m.m.)'] },
                ]);
                expect(evaluatePreconditionalsFixed(makeNode(page39), history)).toBe(true);
            });

            test('Matas.dk + Hudpleje → p25 (Matas.dk+Hudpleje) se muestra ✓', () => {
                const history = buildHistory([
                    { ref: 'q--s39pj', values: ['På Matas.dk'] },
                    { ref: 'q--r69kaf', values: ['Hudpleje (F.eks. creme, serum, bodylotion, m.m.)'] },
                ]);
                expect(evaluatePreconditionalsFixed(makeNode(page25), history)).toBe(true);
            });

            test('Matas.dk + Hudpleje → p29 (Matas.dk+Helsekost) NO se muestra ✓', () => {
                const history = buildHistory([
                    { ref: 'q--s39pj', values: ['På Matas.dk'] },
                    { ref: 'q--r69kaf', values: ['Hudpleje (F.eks. creme, serum, bodylotion, m.m.)'] },
                ]);
                expect(evaluatePreconditionalsFixed(makeNode(page29), history)).toBe(false);
            });

            test('Sin respuesta para categoría → NO se muestra ✓', () => {
                const history = buildHistory([
                    { ref: 'q--s39pj', values: ['På Matas.dk'] },
                ]);
                expect(evaluatePreconditionalsFixed(makeNode(page25), history)).toBe(false);
            });
        });
    });

    describe('Escenario con respuestas en un solo nodo (acumuladas)', () => {

        test('ACTUAL BUG: Matas.dk + Hudpleje → p29 (Matas.dk+Helsekost) se muestra incorrectamente', () => {
            const history = buildHistorySingleNode([
                { ref: 'q--s39pj', values: ['På Matas.dk'] },
                { ref: 'q--r69kaf', values: ['Hudpleje (F.eks. creme, serum, bodylotion, m.m.)'] },
            ]);

            // En un solo nodo, find encuentra q--s39pj primero (es el primer match en allRefs)
            // foundAnswer = {key: "q--s39pj", value: ["På Matas.dk"]}
            // Ruta 0 (q--s39pj EQUAL "På Matas.dk"): answerVals=["På Matas.dk"] → SÍ → allowToContinue=true
            // Ruta 1 (q--r69kaf EQUAL "Helsekost..."): answerVals=["På Matas.dk"] → NO
            // RESULTADO: true ← BUG! Solo la primera precondición se evaluó correctamente
            const result = evaluatePreconditionalsCurrent(makeNode(page29), history);
            expect(result).toBe(true); // ← BUG
        });

        test('CORREGIDO: Matas.dk + Hudpleje → p29 (Matas.dk+Helsekost) NO se muestra', () => {
            const history = buildHistorySingleNode([
                { ref: 'q--s39pj', values: ['På Matas.dk'] },
                { ref: 'q--r69kaf', values: ['Hudpleje (F.eks. creme, serum, bodylotion, m.m.)'] },
            ]);
            expect(evaluatePreconditionalsFixed(makeNode(page29), history)).toBe(false);
        });

        test('CORREGIDO: Matas.dk + Helsekost → p29 se muestra', () => {
            const history = buildHistorySingleNode([
                { ref: 'q--s39pj', values: ['På Matas.dk'] },
                { ref: 'q--r69kaf', values: ['Helsekost (F.eks. vitaminer, mineraler, kosttilskud, m.m.)'] },
            ]);
            expect(evaluatePreconditionalsFixed(makeNode(page29), history)).toBe(true);
        });
    });

    describe('Retrocompatibilidad: página con UNA sola precondición', () => {
        const pageSingleRoutes = [
            makePreconditionalRoute('rs-0', 'q--s39pj', ['På Matas.dk'], 'page-single', 0),
        ];
        const pageSingle = new Page('page-single', 50, 'test',
            [makeQuestion('q-single', 'Single precondition')], pageSingleRoutes);

        test('Precondición cumplida → se muestra (actual)', () => {
            const history = buildHistory([{ ref: 'q--s39pj', values: ['På Matas.dk'] }]);
            expect(evaluatePreconditionalsCurrent(makeNode(pageSingle), history)).toBe(true);
        });

        test('Precondición cumplida → se muestra (corregido)', () => {
            const history = buildHistory([{ ref: 'q--s39pj', values: ['På Matas.dk'] }]);
            expect(evaluatePreconditionalsFixed(makeNode(pageSingle), history)).toBe(true);
        });

        test('Precondición NO cumplida → NO se muestra (actual)', () => {
            const history = buildHistory([{ ref: 'q--s39pj', values: ['I en Matas-butik'] }]);
            expect(evaluatePreconditionalsCurrent(makeNode(pageSingle), history)).toBe(false);
        });

        test('Precondición NO cumplida → NO se muestra (corregido)', () => {
            const history = buildHistory([{ ref: 'q--s39pj', values: ['I en Matas-butik'] }]);
            expect(evaluatePreconditionalsFixed(makeNode(pageSingle), history)).toBe(false);
        });
    });

    describe('MULTIPLECHOICE: múltiples categorías seleccionadas', () => {

        test('CORREGIDO: Matas.dk + [Hudpleje, Helsekost] → p25 y p29 se muestran, p39 no', () => {
            const history = buildHistory([
                { ref: 'q--s39pj', values: ['På Matas.dk'] },
                { ref: 'q--r69kaf', values: [
                    'Hudpleje (F.eks. creme, serum, bodylotion, m.m.)',
                    'Helsekost (F.eks. vitaminer, mineraler, kosttilskud, m.m.)'
                ]},
            ]);

            expect(evaluatePreconditionalsFixed(makeNode(page25), history)).toBe(true);
            expect(evaluatePreconditionalsFixed(makeNode(page29), history)).toBe(true);
            expect(evaluatePreconditionalsFixed(makeNode(page39), history)).toBe(false);
            expect(evaluatePreconditionalsFixed(makeNode(page36), history)).toBe(false);
        });
    });
});


