import type {
    // TrezorDeviceInfo,
    TrezorDeviceInfoWithSession,
    AcquireInput,
    MessageFromTrezor,
} from '../types';

import type { INamespace } from 'protobufjs/light';

import { parseConfigure } from '../lowlevel/protobuf/messages';

type Success<Payload> = { success: true; payload: Payload };
type Error = { success: false; error: string };
type Response<Payload> = Promise<Success<Payload> | Error>;
export abstract class AbstractTransport {
    configured = false;
    stopped = false;
    messages?: ReturnType<typeof parseConfigure>;

    // version: string;
    // name: string;
    // requestNeeded: boolean;
    // isOutdated: boolean;
    // activeName?: string;

    abstract enumerate(): Response<TrezorDeviceInfoWithSession[]>;
    abstract listen(old?: TrezorDeviceInfoWithSession[]): Response<TrezorDeviceInfoWithSession[]>;
    abstract acquire(input: AcquireInput, debugLink?: boolean): Response<string>;
    abstract release(session: string, onclose: boolean, debugLink?: boolean): Response<string>;
    abstract call(
        session: string,
        name: string,
        data: Object,
        debugLink?: boolean,
    ): Response<MessageFromTrezor>;
    abstract post(session: string, name: string, data: Object, debugLink?: boolean): Response<string>;
    abstract read(session: string, debugLink?: boolean): Response<MessageFromTrezor>;
    // resolves when the transport can be used; rejects when it cannot

    abstract init(debug?: boolean): Response<string>;

    // setBridgeLatestUrl(url: string): void;
    // setBridgeLatestVersion(version: string): void;

    stop() {
        this.stopped = true;
    }

    configure(signedData: INamespace) {
        this.messages = parseConfigure(signedData);
        this.configured = true;
    }
}
