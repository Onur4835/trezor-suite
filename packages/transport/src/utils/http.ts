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
const isNode = false;

export function setFetch(fetch: any, isNode?: boolean) {
    localFetch = fetch;
    isNode = !!isNode;
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

function parseResult(text: string) {
    try {
        return JSON.parse(text);
    } catch (e) {
        return text;
    }
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
    if (options.skipContentTypeHeader == null || options.skipContentTypeHeader === false) {
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
        throw new Error('fetch not set');
    }
    const res = await localFetch(options.url, fetchOptions);
    console.log('res', res);
    const resText = await res.text();
    if (res.ok) {
        return parseResult(resText);
    }
    const resJson = parseResult(resText);
    if (typeof resJson === 'object' && resJson != null && resJson.error != null) {
        throw new Error(resJson.error);
    } else {
        console.log('res ', resText);
        throw new Error(resText);
    }
}
