import { request as http, setFetch as rSetFetch, HttpRequestOptions } from '../utils/http';
import * as check from '../utils/highlevel-checks';
import { semverCompare } from '../utils/semver-compare';
import { buildOne } from '../lowlevel/send';
import { receiveOne } from '../lowlevel/receive';
import { DEFAULT_URL, DEFAULT_VERSION_URL } from '../config';
import type { AcquireInput, TrezorDeviceInfoWithSession } from '../types';
import { AbstractTransport } from './abstract';

class BridgeTransport extends AbstractTransport {
    name = 'BridgeTransport';
    version = '';
    isOutdated?: boolean;

    url: string;
    newestVersionUrl: string;
    bridgeVersion?: string;
    debug = false;

    configured = false;

    stopped = false;

    constructor(url = DEFAULT_URL, newestVersionUrl = DEFAULT_VERSION_URL) {
        super();
        this.url = url;
        this.newestVersionUrl = newestVersionUrl;
    }

    _post(options: HttpRequestOptions) {
        if (this.stopped) {
            // eslint-disable-next-line prefer-promise-reject-errors
            return Promise.reject('Transport stopped.');
        }
        return http({
            ...options,
            method: 'POST',
            url: this.url + options.url,
            skipContentTypeHeader: true,
        });
    }

    async init(debug = false): Promise<void> {
        this.debug = debug;
        await this._silentInit();
    }

    async _silentInit(): Promise<void> {
        const infoS = await http({
            url: this.url,
            method: 'POST',
        });
        const info = check.info(infoS);
        this.version = info.version;
        const newVersion =
            typeof this.bridgeVersion === 'string'
                ? this.bridgeVersion
                : check.version(
                      await http({
                          url: `${this.newestVersionUrl}?${Date.now()}`,
                          method: 'GET',
                      }),
                  );
        this.isOutdated = semverCompare(this.version, newVersion) < 0;
    }

    async listen(old?: TrezorDeviceInfoWithSession[]): Promise<TrezorDeviceInfoWithSession[]> {
        if (!old) {
            throw new Error('Bridge v2 does not support listen without previous.');
        }
        const devicesS = await this._post({
            url: '/listen',
            body: old,
        });
        const devices = check.devices(devicesS);
        return devices;
    }

    async enumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
        const devicesS = await this._post({ url: '/enumerate' });
        const devices = check.devices(devicesS);
        return devices;
    }

    _acquireMixed(input: AcquireInput, debugLink?: boolean) {
        const previousStr = input.previous == null ? 'null' : input.previous;
        const url = `${debugLink ? '/debug' : ''}/acquire/${input.path}/${previousStr}`;
        return this._post({ url });
    }

    async acquire(input: AcquireInput, debugLink?: boolean) {
        const acquireS = await this._acquireMixed(input, debugLink);
        return check.acquire(acquireS);
    }

    async release(session: string, onclose: boolean, debugLink?: boolean) {
        const res = this._post({
            url: `${debugLink ? '/debug' : ''}/release/${session}`,
        });
        if (onclose) {
            return;
        }
        await res;
    }

    async call(session: string, name: string, data: Record<string, unknown>, debugLink?: boolean) {
        // todo: maybe move messages to constructor?
        if (!this.messages) {
            throw new Error('Transport not configured.');
        }
        const o = buildOne(this.messages, name, data);
        const outData = o.toString('hex');
        const resData = await this._post({
            url: `${debugLink ? '/debug' : ''}/call/${session}`,
            body: outData,
        });
        if (typeof resData !== 'string') {
            throw new Error('Returning data is not string.');
        }
        const jsonData = receiveOne(this.messages, resData);
        return check.call(jsonData);
    }

    async post(session: string, name: string, data: Record<string, unknown>, debugLink?: boolean) {
        if (!this.messages) {
            throw new Error('Transport not configured.');
        }
        const outData = buildOne(this.messages, name, data).toString('hex');
        await this._post({
            url: `${debugLink ? '/debug' : ''}/post/${session}`,
            body: outData,
        });
    }

    async read(session: string, debugLink?: boolean) {
        if (!this.messages) {
            throw new Error('Transport not configured.');
        }
        const resData = await this._post({
            url: `${debugLink ? '/debug' : ''}/read/${session}`,
        });
        if (typeof resData !== 'string') {
            throw new Error('Returning data is not string.');
        }
        const jsonData = receiveOne(this.messages, resData);
        return check.call(jsonData);
    }

    static setFetch(fetch: any, isNode?: boolean) {
        rSetFetch(fetch, isNode);
    }

    // todo: not used?
    requestDevice() {
        return Promise.reject();
    }

    requestNeeded = false;

    setBridgeLatestUrl(url: string) {
        this.newestVersionUrl = url;
    }

    setBridgeLatestVersion(version: string) {
        this.bridgeVersion = version;
    }
}

export { BridgeTransport };
