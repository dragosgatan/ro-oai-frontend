import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { generateArticlesSitemap, generateSitemapXml } from '@/lib/seo/sitemap';

describe('published article sitemap', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test';
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('emits one canonical URL per article in its authored language', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify([
                    {
                        slug: 'first-editorial',
                        language: 'ro',
                        lastModified: '2026-07-11T09:30:00Z',
                    },
                    {
                        slug: 'english-article',
                        language: 'en',
                        lastModified: '2026-07-12T08:00:00Z',
                    },
                ]),
                { status: 200 },
            ),
        );
        vi.stubGlobal('fetch', fetchMock);

        const entries = await generateArticlesSitemap();

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
            'https://api.example.test/sitemap/articles',
        );
        expect(entries).toHaveLength(2);
        expect(entries[0]).toMatchObject({
            url: 'http://localhost:3000/ro/articles/first-editorial',
            lastModified: new Date('2026-07-11T09:30:00Z'),
            alternateRefs: [
                {
                    href: 'http://localhost:3000/ro/articles/first-editorial',
                    hreflang: 'ro',
                },
                {
                    href: 'http://localhost:3000/ro/articles/first-editorial',
                    hreflang: 'x-default',
                },
            ],
        });
        expect(entries[1]?.url).toBe('http://localhost:3000/en/articles/english-article');
    });

    it.each([
        [{ slug: '', language: 'ro', lastModified: null }, 'invalid row'],
        [{ slug: 'wrong-language', language: 'xx', lastModified: null }, 'invalid row'],
        [
            { slug: 'invalid-date', language: 'ro', lastModified: 'not-a-date' },
            'invalid lastModified',
        ],
    ])('fails atomically for an invalid source row', async (row, message) => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(new Response(JSON.stringify([row]), { status: 200 })),
        );

        await expect(generateArticlesSitemap()).rejects.toThrow(message);
    });

    it('rejects duplicate canonical article rows instead of caching a partial sitemap', async () => {
        const row = { slug: 'duplicate', language: 'ro', lastModified: null };
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(new Response(JSON.stringify([row, row]), { status: 200 })),
        );

        await expect(generateArticlesSitemap()).rejects.toThrow('duplicate article');
    });

    it('uses the stored BCP-47 content language consistently', async () => {
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValue(
                    new Response(
                        JSON.stringify([
                            { slug: 'zh-article', language: 'zh-CN', lastModified: null },
                        ]),
                        { status: 200 },
                    ),
                ),
        );

        const entries = await generateArticlesSitemap();

        expect(entries).toHaveLength(1);
        expect(entries[0]?.url).toContain('/zh-CN/articles/zh-article');
        expect(entries[0]?.alternateRefs).toContainEqual({
            href: entries[0]?.url,
            hreflang: 'zh-CN',
        });
        expect(() => generateSitemapXml(entries)).not.toThrow();
    });

    it('fails atomically when the sitemap source is unavailable', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(new Response('Unavailable', { status: 503 })),
        );

        await expect(generateArticlesSitemap()).rejects.toThrow(
            'Published article sitemap source returned 503',
        );
    });

    it('fails atomically when the sitemap source contract is malformed', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [] }), { status: 200 })),
        );

        await expect(generateArticlesSitemap()).rejects.toThrow('invalid payload');
    });
});
