import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPublicApi } from '@/lib/public-api';

describe('fetchPublicApi', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('uses normal HTTP cache semantics and requests JSON by default', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
        vi.stubGlobal('fetch', fetchMock);

        await fetchPublicApi('https://api.example/leaderboard');

        const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
        expect(init.cache).toBeUndefined();
        expect(new Headers(init.headers).get('accept')).toBe('application/json');
    });

    it('preserves an explicit Next.js revalidation policy', async () => {
        const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
        vi.stubGlobal('fetch', fetchMock);

        await fetchPublicApi('https://api.example/leaderboard', {
            next: { revalidate: 30 },
        });

        const init = fetchMock.mock.calls[0]?.[1] as RequestInit & {
            next?: { revalidate?: number };
        };
        expect(init.cache).toBeUndefined();
        expect(init.next?.revalidate).toBe(30);
    });
});
