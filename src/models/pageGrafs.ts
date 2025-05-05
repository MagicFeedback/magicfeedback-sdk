import {Page} from "./page";
import {PageNode} from "./pageNode";
import {NativeAnswer} from "./types";
import {OperatorType, PageRoute, TransitionType} from "./pageRoute";

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
        pages.forEach((page, index) => {
            if (!page.integrationPageRoutes && pages[index + 1]) {
                const defaultEdge = new PageRoute(
                    `${page.id}-default`,
                    page.integrationQuestions[0]?.ref || '',
                    OperatorType.DEFAULT,
                    '',
                    TransitionType.PAGE,
                    pages[index + 1]?.id || '',
                    page.id
                );
                page.integrationPageRoutes = [defaultEdge];
            }

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

        // Order the edges by the type of condition. logical first and direct
        currentNode.edges.sort((a, b) => {
            if (a.typeCondition === 'DIRECT') return 1;
            if (b.typeCondition === 'DIRECT') return -1;
            return 0;
        });

        // Find the first route that matches the condition
        const route = currentNode.edges.find(edge => {
            // Check if the condition is met
            const answerValue = answer?.filter(ans => ans.key === edge.questionRef);
            if (!answerValue) return false;

            if (edge.typeCondition === 'DIRECT') return true;

            switch (edge.typeOperator) {
                case OperatorType.EQUAL:
                    return answerValue.find(ans => ans.value?.includes(edge.value));
                case OperatorType.NOEQUAL:
                    return !answerValue.find(ans => ans.value?.includes(edge.value));
                case OperatorType.GREATER:
                    return answerValue.find(ans => ans.value.find(val => Number(val) > Number(edge.value)));
                case OperatorType.LESS:
                    return answerValue.find(ans => ans.value.find(val => Number(val) < Number(edge.value)));
                case OperatorType.GREATEREQUAL:
                    return answerValue.find(ans => ans.value.find(val => Number(val) >= Number(edge.value)));
                case OperatorType.LESSEQUAL:
                    return answerValue.find(ans => ans.value.find(val => Number(val) <= Number(edge.value)));
                case OperatorType.INQ:
                    return answerValue.find(ans => edge.value.includes(ans.value));
                case OperatorType.NINQ:
                    return !answerValue.find(ans => edge.value.includes(ans.value));
                default:
                    return false;
            }

        });

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
        const haveFollowup = !!n.questions.find(q => q.followup);

        // If the first node have followup questions, the depth is 2
        let max_depth: number = haveFollowup ? 2 : 1;
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

        const neighbours = v.edges || [];

        // Add the default edge to the neighbours
        const defaultEdge = this.getNextEdgeByDefault(v);
        if (neighbours.length === 0 && defaultEdge) {
            const defaultNode = this.getNodeById(defaultEdge);
            if (defaultNode && !visited.has(defaultNode)) {
                neighbours.push(
                    new PageRoute(
                        defaultNode.id,
                        '',
                        OperatorType.DEFAULT,
                        '',
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
}
