import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getPublishedArticle: vi.fn(),
    notFound: vi.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
vi.mock('next-intl/server', () => ({
    getTranslations: vi.fn(async () => (key: string) => key),
    setRequestLocale: vi.fn(),
}));
vi.mock('@/i18n/routing', () => ({ Link: () => null }));
vi.mock('@/lib/platform-fonts', () => ({
    platformSans: { className: 'platform-sans', variable: '--font-platform-sans' },
    platformDisplay: { className: 'platform-display', variable: '--font-platform-display' },
}));
vi.mock('@/lib/articles', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/articles')>()),
    getPublishedArticle: mocks.getPublishedArticle,
}));

import { generateMetadata } from '@/app/[locale]/articles/[slug]/page';
import { ArticleApiError } from '@/lib/articles';

describe('published article route failures', () => {
    beforeEach(() => vi.clearAllMocks());

    it('resolves a missing or unpublished slug before rendering and returns a real 404', async () => {
        mocks.getPublishedArticle.mockRejectedValueOnce(
            new ArticleApiError(404, 'Article not found'),
        );

        await expect(
            generateMetadata({
                params: Promise.resolve({ locale: 'ro', slug: 'missing-article' }),
            }),
        ).rejects.toThrow('NEXT_NOT_FOUND');
        expect(mocks.notFound).toHaveBeenCalledOnce();
    });

    it('propagates upstream failures so crawlers receive a retryable server error', async () => {
        const upstreamFailure = new ArticleApiError(503, 'Article service unavailable');
        mocks.getPublishedArticle.mockRejectedValueOnce(upstreamFailure);

        await expect(
            generateMetadata({
                params: Promise.resolve({ locale: 'ro', slug: 'temporarily-unavailable' }),
            }),
        ).rejects.toBe(upstreamFailure);
        expect(mocks.notFound).not.toHaveBeenCalled();
    });
});
