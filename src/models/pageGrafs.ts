import {Page} from "./page";
import {PageNode} from "./pageNode";
import {NativeAnswer, FEEDBACKAPPANSWERTYPE} from "./types";
import {ConditionType, OperatorType, PageRoute, TransitionType} from "./pageRoute";

export class PageGraph {
    private nodes: Map<string, PageNode>;

    constructor(pages: Page[]) {
        this.nodes = new Map();
        this.buildGraph(pages);
    }

    /**
     * Build the graph from the list of pages
     * @param pages
     * @private
     * */
    private buildGraph(pages: Page[]) {
        pages.forEach((page) => {
            // Sort by created date and then by type of transition (logical first)
            if (page.integrationPageRoutes) page.integrationPageRoutes = page.integrationPageRoutes?.sort(
                (a, b) =>
                    (new Date(a?.generatedAt || '').getTime() - new Date(b?.generatedAt || '').getTime() || 0) &&
                    (a.typeCondition === 'DIRECT' ? 1 : -1)
            ) || [];

            const node: PageNode = new PageNode(
                page.id,
                page.position,

                page.integrationPageRoutes || [],
                page,
                page.integrationQuestions
            );
            this.nodes.set(node.id, node);
        });
    }

    getNodeById(id: string): PageNode | undefined {
        return this.nodes.get(id);
    }

    /**
     * Get the next page position of the graph given the current page and the answer
     * @param node
     */
    getNextEdgeByDefault(node: PageNode): string | undefined {
        if (!node) return undefined;

        const direct = node.edges.find((e) => e.typeCondition === ConditionType.DIRECT);
        if (direct && [TransitionType.FINISH, TransitionType.REDIRECT].includes(direct.transition as TransitionType)) return undefined;
        if (direct && direct.transitionDestiny) return direct.transitionDestiny;

        for (const n of this.nodes.values()) {
            if (n.position === (node.position + 1)) return n.id;
        }
        return undefined;
    }

    /**
     * Get the first page of the graph
     * @returns first page
     **/
    getFirstPage(): PageNode | undefined {
        // Find the page with the smallest position
        // TODO: Chek if the graph is completed and don't have break loops
        let firstPage: PageNode | undefined;
        let smallestPosition = Number.MAX_VALUE;
        for (const node of this.nodes.values()) {
            if (node.position < smallestPosition) {
                smallestPosition = node.position;
                firstPage = node;
            }
        }
        return firstPage;
    }

    /**
     * Get the next page of the graph given the current page and the answer
     * @param currentNode
     * @param answer - answer to the question in the current page
     * @returns page
     **/
    getNextPage(currentNode: PageNode, answer: NativeAnswer[]): PageNode | undefined {
        if (!currentNode) {
            return undefined;
        }

        // Ordenar edges: primero lógicos, luego directos
        currentNode.edges.sort((a, b) => {
            if (a.typeCondition === 'DIRECT') return 1;
            if (b.typeCondition === 'DIRECT') return -1;
            return 0;
        });

        // console.log(currentNode)

        // Buscar la primera ruta que cumpla la condición
        const route = currentNode.edges.find(edge => {
            // Chequear condición
            const question = currentNode.questions.find(q => q.ref === edge.questionRef);
            const answerValue = answer?.filter(ans => ans.key === edge.questionRef);
            if (edge.typeCondition === 'DIRECT') return true;
            if (!answerValue || answerValue.length === 0) return false;

            // Lógica especial para matrices
            if (question?.type === FEEDBACKAPPANSWERTYPE.MULTI_QUESTION_MATRIX) {
                return this.evaluateMatrixCondition(edge, answerValue);
            }

            // Normalizar edge.value a array
            const edgeVals = Array.isArray(edge.value) ? edge.value : [edge.value];

            switch (edge.typeOperator) {
                case OperatorType.EQUAL:
                    return answerValue.some(ans => {
                        const ansVals = Array.isArray(ans.value) ? ans.value : [ans.value];
                        return ansVals.some(val => edgeVals.includes(val));
                    });
                case OperatorType.NOEQUAL:
                    return answerValue.every(ans => {
                        const ansVals = Array.isArray(ans.value) ? ans.value : [ans.value];
                        return ansVals.every(val => !edgeVals.includes(val));
                    });
                case OperatorType.GREATER:
                    return answerValue.some(ans => {
                        const ansVals = Array.isArray(ans.value) ? ans.value : [ans.value];
                        return ansVals.some(val => edgeVals.some(edgeVal => Number(val) > Number(edgeVal)));
                    });
                case OperatorType.LESS:
                    return answerValue.some(ans => {
                        const ansVals = Array.isArray(ans.value) ? ans.value : [ans.value];
                        return ansVals.some(val => edgeVals.some(edgeVal => Number(val) < Number(edgeVal)));
                    });
                case OperatorType.GREATEREQUAL:
                    return answerValue.some(ans => {
                        const ansVals = Array.isArray(ans.value) ? ans.value : [ans.value];
                        return ansVals.some(val => edgeVals.some(edgeVal => Number(val) >= Number(edgeVal)));
                    });
                case OperatorType.LESSEQUAL:
                    return answerValue.some(ans => {
                        const ansVals = Array.isArray(ans.value) ? ans.value : [ans.value];
                        return ansVals.some(val => edgeVals.some(edgeVal => Number(val) <= Number(edgeVal)));
                    });
                case OperatorType.INQ:
                    return answerValue.some(ans => {
                        const ansVals = Array.isArray(ans.value) ? ans.value : [ans.value];
                        return ansVals.some(val => edgeVals.includes(val));
                    });
                case OperatorType.NINQ:
                    return answerValue.every(ans => {
                        const ansVals = Array.isArray(ans.value) ? ans.value : [ans.value];
                        return ansVals.every(val => !edgeVals.includes(val));
                    });
                default:
                    return false;
            }
        });

        // Si no hay ninguna ruta que cumpla, ir a la siguiente página por posición
        if (!route) {
            const nextPage = this.getNextEdgeByDefault(currentNode);
            if (!nextPage) return undefined;
            return this.getNodeById(nextPage);
        }

        switch (route.transition) {
            case TransitionType.PAGE:
                if (!route.transitionDestiny) return undefined;
                return this.getNodeById(route.transitionDestiny);
            case TransitionType.FINISH:
                return undefined;
            case TransitionType.REDIRECT:
                window.location.href = route.transitionDestiny?.includes('?') ? `${route.transitionDestiny}&${window.location.search.slice(1)}`
                    : `${route.transitionDestiny}${window.location.search}`
                return undefined;
            default:
                return undefined;
        }
    }


    /**
     * Get the number deep (DFS) of this node
     * @param id - node id
     * @returns DFS number
     */
    findDepth(id: string): number {
        const node = this.getNodeById(id);
        if (!node) {
            return 0;
        }
        const visited: Set<PageNode> = new Set();
        return this.DFSUtil(node, visited, 0);
    }

    /**
     * Get the max depth of the graph
     * @param n - node
     * @returns max depth
     */
    findMaxDepth(n?: PageNode): number {
        // Find first node
        if (!n) n = this.getFirstPage()
        if (!n) return 0

        // Start DFS from the first node
        const visited: Set<PageNode> = new Set()
        // const haveFollowup = !!n.questions.find(q => q.followup);

        //console.log(this.nodes);
        // If the first node have followup questions, the depth is 2
        let max_depth: number = 1; // haveFollowup ? 2 : 1;
        max_depth = Math.max(max_depth, this.DFSUtil(n, visited, max_depth))

        return max_depth
    }

    /**
     * A function used by DFS
     * @param v - node
     * @param visited - set of visited nodes
     * @param depth - current depth
     */
    DFSUtil(v: PageNode, visited: Set<PageNode>, depth: number): number {
        visited.add(v);
        let max_depth = depth;

        // Haz una copia local de los vecinos para evitar modificar el grafo original
        const neighbours = [...(v.edges.filter((e) => e.typeCondition !== ConditionType.PRECONDITIONAL) || [])];

        // Si no hay edges, ir a la siguiente página por posición
        const defaultEdge = this.getNextEdgeByDefault(v);
        if (defaultEdge) {
            const defaultNode = this.getNodeById(defaultEdge);
            if (defaultNode && !visited.has(defaultNode)) {
                neighbours.push(
                    new PageRoute(
                        defaultNode.id,
                        '',
                        OperatorType.DEFAULT,
                        [''],
                        TransitionType.PAGE,
                        defaultNode.id,
                        v.id
                    )
                )
            }
        }

        for (const neighbour of neighbours) {
            if (!neighbour.transitionDestiny) continue;
            const node = this.getNodeById(neighbour.transitionDestiny);

            if (node && !visited.has(node)) {
                const haveFollowup = !!node.questions.find(q => q.followup);
                const new_depth = haveFollowup ? depth + 2 : depth + 1;
                // Make a copy of the visited set to only for this branch
                const visitedBranch = new Set(visited);
                const dfs = this.DFSUtil(node, visitedBranch, new_depth);
                max_depth = Math.max(max_depth, dfs);
            }
        }

        return max_depth;
    }

    private parseMatrixAnswer(ans: NativeAnswer): { key: string; value: any[] }[] {
        // ans.value puede ser:
        // 1. Un array con un string JSON que representa la matriz
        // 2. Un array de objetos ya parseados
        // 3. Un array vacío
        if (!ans || !ans.value) return [];

        // Caso 1: primer elemento es string con JSON de la matriz
        if (ans.value.length === 1 && typeof ans.value[0] === 'string' && ans.value[0].trim().startsWith('[')) {
            try {
                const parsed = JSON.parse(ans.value[0]);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                // Ignorar errores de parseo
                return [];
            }
        }

        // Caso 2: el array ya contiene objetos { key, value }
        if (Array.isArray(ans.value) && ans.value.length > 0 && typeof ans.value[0] === 'object' && ans.value[0] !== null && 'key' in ans.value[0]) {
            return ans.value as { key: string; value: any[] }[];
        }

        return [];
    }

    private evaluateMatrixCondition(edge: PageRoute, answerValue: NativeAnswer[]): boolean {
        const edgeVals = Array.isArray(edge.value) ? edge.value : [edge.value];
        const optionFilter = new Set(edge.option || []); // eje X a filtrar
        const ans = answerValue[0]; // Se asume una respuesta por pregunta
        const rows = this.parseMatrixAnswer(ans);
        if (!rows.length) return false;

        const relevantRows = optionFilter.size > 0 ? rows.filter(r => optionFilter.has(r.key)) : rows;
        if (!relevantRows.length) return false;

        const intersects = (rowValues: any[]) => rowValues.some(v => edgeVals.includes(v));
        const notIntersects = (rowValues: any[]) => rowValues.every(v => !edgeVals.includes(v));

        switch (edge.typeOperator) {
            case OperatorType.EQUAL:
                // Todas las filas relevantes deben contener al menos un valor de edgeVals
                // return relevantRows.every(r => intersects(Array.isArray(r.value) ? r.value : [r.value]));
            case OperatorType.INQ:
                // Alguna fila relevante contiene al menos un valor de edgeVals (se mantiene comportamiento original para INQ)
                return relevantRows.some(r => intersects(Array.isArray(r.value) ? r.value : [r.value]));
            case OperatorType.NOEQUAL:
            case OperatorType.NINQ:
                // Todas las filas relevantes NO contienen valores de edgeVals
                return relevantRows.every(r => notIntersects(Array.isArray(r.value) ? r.value : [r.value]));
            case OperatorType.GREATER:
                return relevantRows.some(r => {
                    const vals = Array.isArray(r.value) ? r.value : [r.value];
                    return vals.some(val => edgeVals.some(edgeVal => Number(val) > Number(edgeVal)));
                });
            case OperatorType.LESS:
                return relevantRows.some(r => {
                    const vals = Array.isArray(r.value) ? r.value : [r.value];
                    return vals.some(val => edgeVals.some(edgeVal => Number(val) < Number(edgeVal)));
                });
            case OperatorType.GREATEREQUAL:
                return relevantRows.some(r => {
                    const vals = Array.isArray(r.value) ? r.value : [r.value];
                    return vals.some(val => edgeVals.some(edgeVal => Number(val) >= Number(edgeVal)));
                });
            case OperatorType.LESSEQUAL:
                return relevantRows.some(r => {
                    const vals = Array.isArray(r.value) ? r.value : [r.value];
                    return vals.some(val => edgeVals.some(edgeVal => Number(val) <= Number(edgeVal)));
                });
            default:
                return false;
        }
    }
}
