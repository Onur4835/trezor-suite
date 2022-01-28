import { MessageFromTrezor } from "..";

export type HttpRequestOptions = {
    url: string;
    // todo: method should be required
    method?: 'POST' | 'GET';
    skipContentTypeHeader?: boolean;
    // todo: narrow
    body?: null | Record<string, unknown> | Record<string, unknown>[] | string;
};

// todo: maybe better
let localFetch = typeof window !== 'undefined' ? window.fetch : undefined;
let isNode = false;

export function setFetch(fetch: typeof window.fetch, node = false) {
    localFetch = fetch;
    isNode = node;
}

function contentType(body: any): string {
    if (typeof body === 'string') {
        if (body === '') {
            return 'text/plain';
        }
        return 'application/octet-stream';
    }
    return 'application/json';
}

function wrapBody(body: any) {
    if (typeof body === 'string') {
        return body;
    }
    return JSON.stringify(body);
}

export async function request(options: HttpRequestOptions) {
    const fetchOptions = {
        method: options.method,
        body: wrapBody(options.body),
        // todo: consider 'omit' ?
        credentials: 'same-origin' as const,
        headers: {},
    };

    // this is just for flowtype
    if (!options.skipContentTypeHeader) {
        fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': contentType(options.body == null ? '' : options.body),
        };
    }

    // Node applications must spoof origin for bridge CORS
    if (isNode) {
        fetchOptions.headers = {
            ...fetchOptions.headers,
            Origin: 'https://node.trezor.io',
        };
    }

    if (!localFetch) {
        return { success: false as const, error: 'fetch not set' };
    }

    const res = await localFetch(options.url, fetchOptions);

    if (!res.ok) {
        return { success: false as const, error: 'todo: error' };
    }

    const resText = await res.text();

    try {
        const json = await JSON.parse(resText);

        return { success: true as const, payload: json as MessageFromTrezor };
    } catch (err) {

        return { success: true as const, payload: resText };
    }
}
