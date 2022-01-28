import { request as http, setFetch, HttpRequestOptions } from '../utils/http';
import * as check from '../utils/highlevel-checks';
import { semverCompare } from '../utils/semver-compare';
import { buildOne } from '../lowlevel/send';
import { receiveOne } from '../lowlevel/receive';
import { DEFAULT_URL, DEFAULT_VERSION_URL } from '../config';
import type { AcquireInput, TrezorDeviceInfoWithSession } from '../types';
import { AbstractTransport } from './abstract';
import { success, error } from '../utils/response';

class BridgeTransport extends AbstractTransport {
    name = 'BridgeTransport';
    version = '';
    isOutdated?: boolean;

    url: string;
    newestVersionUrl: string;
    bridgeVersion?: string;
    debug = false;

    // configured = false;

    stopped = false;

    constructor(url = DEFAULT_URL, newestVersionUrl = DEFAULT_VERSION_URL) {
        super();
        this.url = url;
        this.newestVersionUrl = newestVersionUrl;
    }

    private _post(options: HttpRequestOptions) {
        if (this.stopped) {
            return { success: false as const, error: 'Transport stopped.' };
        }
        return http({
            ...options,
            method: 'POST',
            url: this.url + options.url,
            skipContentTypeHeader: true,
        });
    }

    private _acquireMixed(input: AcquireInput, debugLink?: boolean) {
        const previousStr = input.previous == null ? 'null' : input.previous;
        const url = `${debugLink ? '/debug' : ''}/acquire/${input.path}/${previousStr}`;
        return this._post({ url });
    }

    private async _silentInit() {
        const infoS = await http({
            url: this.url,
            method: 'POST',
        });
        const info = check.info(infoS);
        this.version = info.version;

        let newVersion: string | undefined;

        if (this.bridgeVersion) {
            newVersion = this.bridgeVersion;
        } else {
            const res = await http({
                url: `${this.newestVersionUrl}?${Date.now()}`,
                method: 'GET',
            });
            if (!res.success) {
                return res;
                // return;
            }
            if (typeof res.payload !== 'string') {
                // todo:
                return { success: false as const, error: 'wrong response type' };
            }
            newVersion = res.payload;
        }

        this.isOutdated = semverCompare(this.version, newVersion) < 0;
        return { success: true as const, payload: 'initialized' };
    }

    async init(debug = false) {
        this.debug = debug;
        return this._silentInit();
    }

    // todo: required param
    async listen(old?: TrezorDeviceInfoWithSession[]) {
        if (!old) {
            return {
                success: false as const,
                error: 'Bridge v2 does not support listen without previous.',
            };
        }
        const devicesS = await this._post({
            url: '/listen',
            body: old,
        });
        return check.listen(devicesS);
    }

    async enumerate() {
        const response = await this._post({ url: '/enumerate' });
        if (!response.success) {
            return response;
        }
        return check.enumerate(response.payload);
    }

    async acquire(input: AcquireInput, debugLink?: boolean) {
        const response = await this._acquireMixed(input, debugLink);
        if (!response.success) {
            return response;
        }
        return check.acquire(response.payload);
    }

    async release(session: string, onclose: boolean, debugLink?: boolean) {
        const response = this._post({
            url: `${debugLink ? '/debug' : ''}/release/${session}`,
        });
        if (onclose) {
            // todo:
            // return;
            return { success: true as const, payload: 'what is this for?' };
        }
        const res = await response;
        if (!res.success) {
            return res;
        }
        if (typeof res.payload !== 'string') {
            throw new Error('eow');
        }
        return { success: res.success, payload: res.payload };
    }

    async call(session: string, name: string, data: Record<string, unknown>, debugLink?: boolean) {
        // todo: maybe move messages to constructor?
        if (!this.messages) {
            return { success: false as const, error: 'Transport not configured.' };
        }
        const o = buildOne(this.messages, name, data);
        const outData = o.toString('hex');
        const resData = await this._post({
            url: `${debugLink ? '/debug' : ''}/call/${session}`,
            body: outData,
        });
        if (typeof resData !== 'string') {
            return { success: false as const, error: 'Returning data is not string.' };
        }
        const jsonData = receiveOne(this.messages, resData);
        return check.call(jsonData);
    }

    async post(session: string, name: string, data: Record<string, unknown>, debugLink?: boolean) {
        if (!this.messages) {
            return { success: false as const, error: 'Transport not configured.' };
        }
        const outData = buildOne(this.messages, name, data).toString('hex');
        const response = await this._post({
            url: `${debugLink ? '/debug' : ''}/post/${session}`,
            body: outData,
        });

        if (!response.success) {
            return response;
        }

        if (typeof response.payload !== 'string') {
            throw new Error('eow');
        }
        return { success: response.success, payload: response.payload };
    }

    async read(session: string, debugLink?: boolean) {
        if (!this.messages) {
            // todo:
            return { success: false as const, error: 'Transport not configured.' };
        }
        const resData = await this._post({
            url: `${debugLink ? '/debug' : ''}/read/${session}`,
        });
        if (typeof resData !== 'string') {
            // todo:
            return { success: false as const, error: 'Response is not string.' };
        }
        const jsonData = receiveOne(this.messages, resData);
        const checked = check.call(jsonData);
        if (!checked.success) {
            return { success: false as const, error: checked.error };
        }
        return { success: true as const, payload: checked.payload };
    }

    static setFetch(fetch: any, isNode?: boolean) {
        setFetch(fetch, isNode);
    }

    // todo: not used?
    // requestDevice() {
    //     return Promise.reject();
    // }

    // requestNeeded = false;

    setBridgeLatestUrl(url: string) {
        this.newestVersionUrl = url;
    }

    setBridgeLatestVersion(version: string) {
        this.bridgeVersion = version;
    }
}

export { BridgeTransport };
