// input checks for high-level transports

// import type { TrezorDeviceInfoWithSession, MessageFromTrezor } from '../types';
// import * as typeforce from 'typeforce';
import {
    Boolean,
    Number,
    String,
    // Literal,
    // Tuple,
    Record,
    // Union,
    // Partial,
    // Static,
    // Undefined,
    // Null,    
    Optional,
} from 'runtypes';

import { success, error } from './response';

const ERROR = 'Wrong result type.';

export const init = (res: any) => {
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
};

export function enumerate(res: any) {
    try {
        return success(
            (res as any[]).map(r => {
                console.log('r', r);
                return Record({
                    path: String,
                    vendor: Number,
                    product: Number,
                    debug: Boolean,
                    // todo: really optional?
                    session: Optional(String), //.Or(Null),
                    debugSession: Optional(String), //.Or(Null),
                    // session: Union(Optional(String).Or(Null), Undefined),
                    // debugSession: Union(Optional(String).Or(Null), Undefined),
                }).check(r);
            }),
        );
    } catch (_err) {
        // @ts-ignore
        console.log(_err.message);

        return error(ERROR);
    }
}

export const listen = (res: any) => enumerate(res);

export function acquire(res: any) {
    try {
        return success(
            Record({
                // todo: really optional?
                session: Optional(String),
            }).check(res),
        );
    } catch (_err) {
        return error(ERROR);
    }
}

export const call = (res: any) => {
    try {
        return success(
            Record({
                type: String,
                // todo:
                message: Record({}),
            }).check(res),
        );
    } catch (_err) {
        return error(ERROR);
    }
};

export const read = (res: any) => {
    try {
        return success(
            Record({
                type: String,
                // todo:
                message: Record({}),
            }).check(res),
        );
    } catch (_err) {
        return error(ERROR);
    }
};

export const post = (res: any) => {
    try {
        return success(Number.check(res));
    } catch (_err) {
        return error(ERROR);
    }
};

export const release = (res: any) => {
    try {
        return success(Number.check(res));
    } catch (_err) {
        return error(ERROR);
    }
};
