import {NativeAnswer, NativeQuestion} from "./types";
import {Page} from "./page";
import {PageRoute} from "./pageRoute";

export class PageNode {
    id: string;
    position: number;
    edges: PageRoute[];
    data: Page;
    questions: NativeQuestion[];
    elements: HTMLElement[];
    isFollowup: boolean;
    answers: NativeAnswer[] = [];
    /**
     * Page that originated this node, only set on follow up pages. A follow up
     * is not part of the graph, so its routing (conditional edges, answers the
     * conditions are written against) belongs to the page it came from.
     */
    origin?: PageNode;

    constructor(id: string,
                position: number,
                edges: PageRoute[],
                data: Page,
                questions: NativeQuestion[],
                isFollowup: boolean = false
    ) {
        this.id = id;
        this.position = position;
        this.edges = edges;
        this.data = data;
        this.questions = questions.sort((a, b) => a.position - b.position);
        this.elements = [];
        this.isFollowup = isFollowup;
    }

    /**
     * Get a list of followup questions ref
     * @returns list of followup questions ref
     **/
    getFollowupQuestions(): string[] {
        return this.questions.filter(question => question.followup).map(question => question.ref);
    }

    /**
     * Get a list of ref of the questions that are required in the page
     * @returns ref of the required questions ref
     **/
    getRequiredQuestions() {
        return this.questions.filter(question => question.require).map(question => question.ref);
    }

    /**
     * Set the answer for a question
     * @param questionRef
     * @param answer
     */
    setAnswer(answer: NativeAnswer[]) {
        this.answers = answer;
    }
}