import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/sitemap/articles.xml/route';

describe('article sitemap route', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test';
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('serves canonical article URLs as refreshable XML', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(
                    JSON.stringify([
                        {
                            slug: 'published-editorial',
                            language: 'ro',
                            lastModified: '2026-07-15T09:00:00Z',
                        },
                    ]),
                    { status: 200 },
                ),
            ),
        );

        const response = await GET();
        const xml = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('application/xml');
        expect(response.headers.get('cache-control')).toContain('s-maxage=600');
        expect(xml).toContain('/ro/articles/published-editorial');
        expect(xml).toContain('<lastmod>2026-07-15</lastmod>');
    });

    it('returns an uncached retryable error instead of caching an empty sitemap', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(new Response('Unavailable', { status: 503 })),
        );

        const response = await GET();

        expect(response.status).toBe(503);
        expect(response.headers.get('cache-control')).toBe('no-store');
        expect(await response.text()).toBe('Error generating sitemap');
    });
});
