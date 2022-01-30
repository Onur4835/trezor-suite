import { success, error } from './response';

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
        return error('fetch not set');
    }

    console.log('options.url', options.url);
    console.log('fetchOptions', fetchOptions);
    try {
        const res = await localFetch(options.url, fetchOptions);
        console.log('res', res);

        if (!res.ok) {
            console.log('res', res);
            return error('todo: error');
        }

        const resText = await res.text();
        console.log('resText', resText);

        try {
            const json = await JSON.parse(resText);

            return success(json as Record<string, any>);
        } catch (err) {
            return success(resText as string);
        }
    } catch (err) {
        console.log('erreeeerrr', err);
        return error('meow');
    }
}
