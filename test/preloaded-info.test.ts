import {afterEach, beforeEach, describe, expect, jest, test} from "@jest/globals";

import fetch from "cross-fetch";
import {Log} from "../src/utils/log";
import {getForm, getSessionForm, header} from "../src/services/request.service";

jest.mock("cross-fetch");

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;
const API = "https://api-dev.deepdots.com/";
const log = {log: jest.fn(), err: jest.fn()} as unknown as Log;
const holder = window as unknown as {__MAGICFEEDBACK_PRELOADED_INFO__?: {url: string; parameters: string; body: string}};

const preload = (url: string, body: unknown, parameters = header["x-magicfeedback-parameters"]) => {
    holder.__MAGICFEEDBACK_PRELOADED_INFO__ = {url, parameters, body: JSON.stringify(body)};
};

describe("Get Survey handed over by the MagicSurvey bootstrap", () => {
    beforeEach(() => {
        mockedFetch.mockReset();
        mockedFetch.mockResolvedValue({json: async () => ({from: "network"})} as Response);
    });
    afterEach(() => {
        delete holder.__MAGICFEEDBACK_PRELOADED_INFO__;
    });

    test("the same request is answered from it, once", async () => {
        preload(`${API}sdk/app/app/pk/info?lang=es`, {from: "bootstrap"});

        expect(await getForm(API, "app", "pk", log, "es")).toEqual({from: "bootstrap"});
        expect(mockedFetch).not.toHaveBeenCalled();
        expect(holder.__MAGICFEEDBACK_PRELOADED_INFO__).toBeUndefined();

        expect(await getForm(API, "app", "pk", log, "es")).toEqual({from: "network"});
        expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    test("sessions too", async () => {
        preload(`${API}sdk/app/session/s1/info`, {from: "bootstrap"});
        expect(await getSessionForm(API, "s1", log)).toEqual({from: "bootstrap"});
        expect(mockedFetch).not.toHaveBeenCalled();
    });

    test("another language goes to the network and leaves it alone", async () => {
        preload(`${API}sdk/app/app/pk/info?lang=es`, {from: "bootstrap"});
        expect(await getForm(API, "app", "pk", log, "da")).toEqual({from: "network"});
        expect(mockedFetch).toHaveBeenCalledWith(`${API}sdk/app/app/pk/info?lang=da`, expect.anything());
        expect(holder.__MAGICFEEDBACK_PRELOADED_INFO__).toBeDefined();
    });

    test("other link parameters go to the network", async () => {
        preload(`${API}sdk/app/app/pk/info`, {from: "bootstrap"}, "?ref=other");
        expect(await getForm(API, "app", "pk", log)).toEqual({from: "network"});
    });

    test("an unreadable body goes to the network", async () => {
        holder.__MAGICFEEDBACK_PRELOADED_INFO__ = {url: `${API}sdk/app/app/pk/info`, parameters: header["x-magicfeedback-parameters"], body: "<html>"};
        expect(await getForm(API, "app", "pk", log)).toEqual({from: "network"});
    });

    test("without a bootstrap nothing changes", async () => {
        expect(await getForm(API, "app", "pk", log)).toEqual({from: "network"});
        expect(mockedFetch).toHaveBeenCalledTimes(1);
    });
});
