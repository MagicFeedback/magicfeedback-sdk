import {InitOptions, NativeAnswer, NativeFeedback} from "./models/types";
import {Form} from "./models/form";
import {Config} from "./models/config";
import {Log} from "./utils/log";
import {sendFeedback} from "./services/request.service";
import {HOST_API_URL, HOST_API_URL_DEV} from "./config-globals";

/**
 *
 * @returns
 */
export default function main() {
    //===============================================
    // Attributes
    //===============================================

    const config: Config = new Config();
    let log: Log = new Log(config);

    /**
     *
     * @param options
     */
    function init(options?: InitOptions) {
        if (typeof options?.debug === "boolean") config.set("debug", options.debug);
        if (typeof options?.dryRun === "boolean") config.set("dryRun", options.dryRun);

        config.set("url", options?.env && options?.env === "dev" ? HOST_API_URL_DEV : HOST_API_URL);
        config.set("env", options?.env);

        log.log("Initialized Magicfeedback", config);
    }

    /**
     *
     * @param appId
     * @param publicKey
     * @param feedback
     * @param id
     * @param completed
     * @param privateKey
     * @returns
     */
    async function send(
        appId: string,
        publicKey: string,
        feedback: NativeFeedback,
        completed: boolean = true,
        id?: string,
        privateKey?: string
    ) {
        if (!appId) log.err("No appID provided");
        if (!publicKey) log.err("No publicKey provided");
        if (!feedback) log.err("No feedback provided");

        if (!feedback.answers &&
            !feedback.profile &&
            !feedback.metrics &&
            !feedback.metadata
        ) log.err("No feedback data provided");

        const url = config.get("url");
        const body = {
            integration: appId,
            publicKey: publicKey,
            privateKey: privateKey,
            completed: completed,
            id: id,
            feedback: feedback,
        }

        try {
            if (config.get<boolean>("dryRun")) {
                log.log("Dry run enabled: skipping native feedback submit");
                return `dry-run-${Date.now()}`;
            }

            const res = await sendFeedback(url as string, body, log);
            log.log(`sent native feedback`);
            return res;
        } catch (e: any) {
            log.err(`error native feedback`, e);
            return false;
        }
    }

    /**
     *
     * @param appId
     * @param publicKey
     * @param profile
     * @param metadata
     * @returns
     */
    function form(appId: string, publicKey: string, profile?: NativeAnswer[], metadata?: NativeAnswer[]) {
        if (!appId) log.err("No appID provided");
        if (!publicKey) log.err("No publicKey provided");
        return new Form(config, appId, publicKey, profile, metadata);
    }

    /**
     *
     * @param sessionId
     * @returns
     */
    function session(sessionId: string) {
        if (!sessionId) log.err("No sessionId provided");
        return new Form(config, sessionId);
    }

    //===============================================
    // Return
    //===============================================

    return {
        // lifecycle
        init,
        // requests
        send,
        form,
        session,
    };
}
