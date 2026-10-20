import fetch from "cross-fetch";
import modulePackage from "../../package.json";
import {Log} from "../utils/log";
import {endpoints} from "./paths";
import {NativeQuestion} from "../models/types";
import {FormData} from "../models/formData";
import {withLangParam} from "./surveyLang";

export const header = {
    Accept: "application/json",
    "Magicfeedback-Sdk-Version": modulePackage.version,
    "x-magicfeedback-parameters": window.location.search || "",
}

// @ts-ignore
const serializedParams = (params: any) => Object.entries(params).map(
    ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
).join("&");

export function validateEmail(email: string): boolean {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
}

/**
 * Get Survey already made by MagicSurvey's bootstrap (MF-3177): it reads the
 * response to pick the frontend version, then leaves it here so the survey
 * does not ask twice. Used once, and only for the very request this SDK would
 * make (same URL, language included, and same link parameters); anything else
 * goes to the network as before.
 */
interface PreloadedInfo {
    url: string;
    parameters: string;
    body: string;
}

export function takePreloadedInfo(requestUrl: string): any | undefined {
    if (typeof window === "undefined") return undefined;
    const holder = window as unknown as {__MAGICFEEDBACK_PRELOADED_INFO__?: PreloadedInfo};
    const preloaded = holder.__MAGICFEEDBACK_PRELOADED_INFO__;
    if (!preloaded || preloaded.url !== requestUrl || preloaded.parameters !== header["x-magicfeedback-parameters"]) {
        return undefined;
    }
    delete holder.__MAGICFEEDBACK_PRELOADED_INFO__;
    try {
        return JSON.parse(preloaded.body);
    } catch {
        return undefined;
    }
}

export async function getForm(url: string, appId: string, publicKey: string, log: Log, lang?: string | null): Promise<FormData | any> {
    try {
        const requestUrl = withLangParam(url + endpoints.sdk.app_info(appId, publicKey), lang);
        const preloaded = takePreloadedInfo(requestUrl);
        if (preloaded !== undefined) return preloaded;
        const response = await fetch(requestUrl, {
            method: "GET",
            headers: header
        });

        // Handle success response
        return await response.json();
    } catch (e) {
        log.err(e);
    }
}

export async function getSessionForm(url: string, sessionId: string, log: Log, lang?: string | null): Promise<FormData | any> {
    try {
        const requestUrl = withLangParam(url + endpoints.sdk.session(sessionId), lang);
        const preloaded = takePreloadedInfo(requestUrl);
        if (preloaded !== undefined) return preloaded;
        const response = await fetch(requestUrl, {
            method: "GET",
            headers: header
        });

        // Handle success response
        return await response.json();
    } catch (e) {
        log.err(e);
    }
}

export async function getQuestions(url: string, appId: string, publicKey: string, log: Log, lang?: string | null): Promise<NativeQuestion[]> {
    try {
        const response = await fetch(withLangParam(url + endpoints.sdk.app(appId, publicKey), lang), {
            method: "GET",
            headers: header
        });

        if (response.ok) {
            // Handle success response
            const json = await response.json();
            log.log(`Received questions for app ${appId}`, json);
            return json;
        } else {
            // Handle error response
            log.err(
                `Failed to get questions for app ${appId}:`,
                response.status,
                response.statusText
            );
            throw new Error("[MagicFeedback] Bad response from server");
        }
    } catch (e) {
        log.err(e);
        return [];
    }
}

export async function sendFeedback(url: string, body: any, log: Log): Promise<string> {
    try {
        const response = await fetch(url + endpoints.sdk.feedback, {
            method: "POST",
            headers: {...{"Content-Type": "application/json"}, ...header},
            body: JSON.stringify(body),
        });

        if (response.ok) {
            // Handle success response
            log.log(`Form ${body.integration} submitted successfully!`);
            // You can perform additional actions here if needed
            const responseJson = await response.json();
            return responseJson.sessionId;
        } else {
            // Handle error response
            log.err(
                `Failed to submit form ${body.integration}:`,
                response.status,
                response.statusText
            );
            throw new Error(response.statusText);
        }
    } catch (e) {
        log.err(e);
        return '';
    }
}

export async function getFollowUpQuestion(url: string, body: any, log: Log): Promise<any> {
    try {
        const response = await fetch(url + endpoints.sdk.followUpQuestion, {
            method: "POST",
            headers: {...{"Content-Type": "application/json"}, ...header},
            body: JSON.stringify(body),
        });

        if (response.ok) {
            // Handle success response
            log.log(`Received follow up question for form ${body.integration}`);
            // You can perform additional actions here if needed
            const responseJson = await response.json();
            return responseJson || '';
        } else {
            // Handle error response
            log.err(
                `Failed to get follow up question for form ${body.integration}:`,
                response.status,
                response.statusText
            );
            throw new Error(response.statusText);
        }
    } catch (e) {
        log.err(e);
        return '';
    }
}
