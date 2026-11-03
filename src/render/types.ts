import {NativeQuestion} from "../models/types";

export type RenderContext = {
    question: NativeQuestion;
    format: string;
    language: string;
    url: string;
    send?: () => void;
    isPhone: boolean;
    urlParamValue: string | null;
    placeholderText?: string;
    maxCharacters: number;
    randomPosition: boolean;
    direction: string;
    order: string;
    /** The survey's product, e.g. MATAS_DEMO_GENERAL. */
    productId?: string;
};

export type RenderResult = {
    element: HTMLElement;
    elementTypeClass: string;
    /**
     * What goes into the question in place of `element`, when the renderer
     * wraps it (e.g. the email @ button). `element` stays the input that gets
     * the id, name, value and `.magicfeedback-input`.
     */
    container?: HTMLElement;
};

export type QuestionRenderer = (ctx: RenderContext) => RenderResult;
