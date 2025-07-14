import fetch from "cross-fetch";
import modulePackage from "../../package.json";
import {Log} from "../utils/log";
import {endpoints} from "./paths";
import {NativeQuestion} from "../models/types";
import {FormData} from "../models/formData";

const header = {
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

export async function getForm(url: string, appId: string, publicKey: string, log: Log): Promise<FormData | any> {
    try {
        const response = await fetch(url + endpoints.sdk.app_info(appId, publicKey), {
            method: "GET",
            headers: header
        });

        // Handle success response
        return await response.json();
    } catch (e) {
        log.err(e);
    }
}

export async function getSessionForm(url: string, sessionId: string, log: Log): Promise<FormData | any> {
    try {
        const response = await fetch(url + endpoints.sdk.session(sessionId), {
            method: "GET",
            headers: header
        });

        // Handle success response
        return await response.json();
    } catch (e) {
        log.err(e);
    }
}

export async function getQuestions(url: string, appId: string, publicKey: string, log: Log): Promise<NativeQuestion[]> {
    try {
        const response = await fetch(url + endpoints.sdk.app(appId, publicKey), {
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
