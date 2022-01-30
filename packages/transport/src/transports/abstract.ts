import type {
    // TrezorDeviceInfo,
    TrezorDeviceInfoWithSession,
    AcquireInput,
} from '../types';

import type { INamespace } from 'protobufjs/light';
import * as check from '../utils/highlevel-checks';
import { parseConfigure } from '../lowlevel/protobuf/messages';

type Success<Payload> = { success: true; payload: Payload };
type Error = { success: false; error: string };
export type Response<Payload> = Promise<Success<Extract<Payload, { success: true }>>['payload'] | Error>;

export abstract class AbstractTransport {
    configured = false;
    stopped = false;
    messages?: ReturnType<typeof parseConfigure>;

    // version: string;
    // name: string;
    // requestNeeded: boolean;
    // isOutdated: boolean;
    // activeName?: string;

    abstract enumerate(): Response<ReturnType<typeof check['enumerate']>>;
    abstract listen(
        old?: TrezorDeviceInfoWithSession[],
    ): Response<ReturnType<typeof check['listen']>>;
    abstract acquire(
        input: AcquireInput,
        debugLink?: boolean,
    ): Response<ReturnType<typeof check['acquire']>>;
    abstract release(
        session: string,
        onclose: boolean,
        debugLink?: boolean,
    ): Response<ReturnType<typeof check['release']>>;
    abstract call(
        session: string,
        name: string,
        data: Record<string, any>,
        debugLink?: boolean,
    ): Response<ReturnType<typeof check['call']>>;
    abstract post(
        session: string,
        name: string,
        data: Record<string, any>,
        debugLink?: boolean,
    ): Response<ReturnType<typeof check['post']>>;

    abstract read(session: string, debugLink?: boolean): Response<ReturnType<typeof check['read']>>;
    // resolves when the transport can be used; rejects when it cannot

    abstract init(debug?: boolean): Response<ReturnType<typeof check['init']>>;

    stop() {
        this.stopped = true;
    }

    configure(signedData: INamespace) {
        this.messages = parseConfigure(signedData);
        this.configured = true;
    }
}
