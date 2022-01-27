import type {
    // TrezorDeviceInfo,
    TrezorDeviceInfoWithSession,
    AcquireInput,
    MessageFromTrezor,
} from '../types';

import type { INamespace } from 'protobufjs/light';

import { parseConfigure } from '../lowlevel/protobuf/messages';

export abstract class AbstractTransport {
    configured = false;
    stopped = false;
    messages?: ReturnType<typeof parseConfigure>;

    // version: string;
    // name: string;
    // requestNeeded: boolean;
    // isOutdated: boolean;
    // activeName?: string;

    abstract enumerate(): Promise<TrezorDeviceInfoWithSession[]>;
    abstract listen(old?: TrezorDeviceInfoWithSession[]): Promise<TrezorDeviceInfoWithSession[]>;
    abstract acquire(input: AcquireInput, debugLink?: boolean): Promise<string>;
    abstract release(session: string, onclose: boolean, debugLink?: boolean): Promise<void>;
    abstract call(
        session: string,
        name: string,
        data: Object,
        debugLink?: boolean,
    ): Promise<MessageFromTrezor>;
    abstract post(session: string, name: string, data: Object, debugLink?: boolean): Promise<void>;
    abstract read(session: string, debugLink?: boolean): Promise<MessageFromTrezor>;
    // resolves when the transport can be used; rejects when it cannot

    abstract init(debug?: boolean): Promise<void>;

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
