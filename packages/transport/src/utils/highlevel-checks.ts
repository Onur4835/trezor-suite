// input checks for high-level transports

import type { TrezorDeviceInfoWithSession, MessageFromTrezor } from '../types';
// import * as typeforce from 'typeforce';
import {
    Boolean,
    Number,
    String,
    Literal,
    Tuple,
    Record,
    Union,
    Partial,
    Static,
    Null,
    Optional,
    Unknown,
} from 'runtypes';

import { success, error } from './response';

const ERROR = 'Wrong result type.';

export function info(res: any) {
    try {
        const response = Record({
            version: String,
            configured: Boolean,
            githash: Optional(String),
        }).check(res);

        return success(response);
        // return success({ version, configured });
    } catch (_err) {
        return error(ERROR);
    }
}

export function enumerate(res: any[]) {
    try {
        return success(
            res.map(r =>
                Record({
                    path: String,
                    vendor: Number,
                    product: Number,
                    debug: Boolean,
                    session: String,
                    debugSession: String.Or(Null),
                }).check(r),
            ),
        );
    } catch (_err) {
        return error(ERROR);
    }
}

export const listen = (res: any[]) => enumerate(res);

export function acquire(res: any) {
    try {
        return success(
            Record({
                session: String,
            }).check(r),
        );
    } catch (_err) {
        return error(ERROR);
    }
}

export const call = (res: any) => {
    try {
        return success(
            Record({
                type: Number,
                // todo: 
                message: Unknown,
            }).check(res),
        );
    } catch (_err) {
        return error(ERROR);
    }
};
