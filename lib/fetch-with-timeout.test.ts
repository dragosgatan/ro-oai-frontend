import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchWithTimeout } from './fetch-with-timeout';

describe('fetchWithTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('aborts a request once its deadline is reached', async () => {
        const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
            return new Promise<Response>((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => {
                    reject(new DOMException('The operation was aborted', 'AbortError'));
                });
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const request = fetchWithTimeout('/slow', {}, 1_000);
        const assertion = expect(request).rejects.toMatchObject({ name: 'AbortError' });

        await vi.advanceTimersByTimeAsync(1_000);
        await assertion;
        expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    });

    it('propagates a caller abort and clears its deadline', async () => {
        const caller = new AbortController();
        const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
            return new Promise<Response>((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => {
                    reject(new DOMException('The operation was aborted', 'AbortError'));
                });
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const request = fetchWithTimeout('/cancelled', { signal: caller.signal }, 5_000);
        const assertion = expect(request).rejects.toMatchObject({ name: 'AbortError' });

        caller.abort();
        await assertion;
        expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('clears its deadline after a successful response', async () => {
        const response = new Response(null, { status: 204 });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

        await expect(fetchWithTimeout('/ready', {}, 5_000)).resolves.toBe(response);
        expect(vi.getTimerCount()).toBe(0);
    });
});
