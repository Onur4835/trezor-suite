// @ts-nocheck

import type { AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor } from './types';

import { AbstractTransport } from './transports/abstract';
export default class FallbackTransport {
    name = `FallbackTransport`;
    activeName = ``;

    _availableTransports: Array<AbstractTransport>;
    transports: Array<AbstractTransport>;
    configured: boolean;
    version: string;
    debug = false;

    // note: activeTransport is actually "?AbstractTransport", but
    // everywhere I am using it is in `async`, so error gets returned as Promise.reject
    activeTransport: AbstractTransport;

    constructor(transports: Array<AbstractTransport>) {
        this.transports = transports;
    }

    // first one that inits successfuly is the final one; others won't even start initing
    async _tryInitTransports(): Promise<Array<AbstractTransport>> {
        const res: Array<AbstractTransport> = [];
        let lastError: Error = null;
        for (const transport of this.transports) {
            try {
                await transport.init(this.debug);
                res.push(transport);
            } catch (e) {
                lastError = e;
            }
        }
        if (res.length === 0) {
            throw lastError || new Error(`No transport could be initialized.`);
        }
        return res;
    }

    // first one that inits successfully is the final one; others won't even start initing
    async _tryConfigureTransports(data: JSON | string): Promise<AbstractTransport> {
        let lastError: Error = null;
        for (const transport of this._availableTransports) {
            try {
                await transport.configure(data);
                return transport;
            } catch (e) {
                lastError = e;
            }
        }
        throw lastError || new Error(`No transport could be initialized.`);
    }

    async init(debug?: boolean): Promise<void> {
        this.debug = !!debug;

        // init ALL OF THEM
        const transports = await this._tryInitTransports();
        this._availableTransports = transports;

        // a slight hack - configured is always false, so we force caller to call configure()
        // to find out the actual working transport (bridge falls on configure, not on info)
        this.version = transports[0].version;
        this.configured = false;
    }

    isOutdated: boolean;
    async configure(signedData: JSON | string): Promise<void> {
        const pt: Promise<AbstractTransport> = this._tryConfigureTransports(signedData);
        this.activeTransport = await pt;
        this.configured = this.activeTransport.configured;
        this.version = this.activeTransport.version;
        this.activeName = this.activeTransport.name;
        this.requestNeeded = this.activeTransport.requestNeeded;
        this.isOutdated = this.activeTransport.isOutdated;
    }

    enumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
        return this.activeTransport.enumerate();
    }

    listen(old?: Array<TrezorDeviceInfoWithSession>): Promise<Array<TrezorDeviceInfoWithSession>> {
        return this.activeTransport.listen(old);
    }

    acquire(input: AcquireInput, debugLink: boolean): Promise<string> {
        return this.activeTransport.acquire(input, debugLink);
    }

    release(session: string, onclose: boolean, debugLink: boolean): Promise<void> {
        return this.activeTransport.release(session, onclose, debugLink);
    }

    call(
        session: string,
        name: string,
        data: Record<string, any>,
        debugLink: boolean,
    ): Promise<MessageFromTrezor> {
        return this.activeTransport.call(session, name, data, debugLink);
    }

    post(
        session: string,
        name: string,
        data: Record<string, any>,
        debugLink: boolean,
    ): Promise<void> {
        return this.activeTransport.post(session, name, data, debugLink);
    }

    read(session: string, debugLink: boolean): Promise<MessageFromTrezor> {
        return this.activeTransport.read(session, debugLink);
    }

    requestDevice(): Promise<void> {
        return this.activeTransport.requestDevice();
    }

    requestNeeded = false;

    setBridgeLatestUrl(url: string): void {
        for (const transport of this.transports) {
            transport.setBridgeLatestUrl(url);
        }
    }

    setBridgeLatestVersion(version: string): void {
        for (const transport of this.transports) {
            transport.setBridgeLatestVersion(version);
        }
    }

    stop(): void {
        for (const transport of this.transports) {
            transport.stop();
        }
    }
}
