import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl/server', () => ({
    getTranslations: vi.fn(async () => (key: string) => key),
    setRequestLocale: vi.fn(),
}));
vi.mock('@/i18n/routing', () => ({ Link: () => null }));
vi.mock('@/lib/platform-fonts', () => ({
    platformSans: { className: 'platform-sans', variable: '--font-platform-sans' },
    platformDisplay: { className: 'platform-display', variable: '--font-platform-display' },
}));

import { generateMetadata } from '@/app/[locale]/articles/page';
import { BASE_URL } from '@/lib/seo/config';

describe('article index metadata', () => {
    it('gives crawlable pagination pages their own canonical URL', async () => {
        const metadata = await generateMetadata({
            params: Promise.resolve({ locale: 'ro' }),
            searchParams: Promise.resolve({ page: '2' }),
        });

        expect(metadata.alternates?.canonical).toBe(`${BASE_URL}/ro/articles?page=2`);
        expect(metadata.alternates?.languages).toMatchObject({
            ro: `${BASE_URL}/ro/articles?page=2`,
            en: `${BASE_URL}/en/articles?page=2`,
            'x-default': `${BASE_URL}/ro/articles?page=2`,
        });
        expect(metadata.robots).toMatchObject({ index: true, follow: true });
    });

    it('keeps filtered views followable but out of the search index', async () => {
        const metadata = await generateMetadata({
            params: Promise.resolve({ locale: 'ro' }),
            searchParams: Promise.resolve({ page: '3', authorId: 'user-1' }),
        });

        expect(metadata.alternates?.canonical).toBe(`${BASE_URL}/ro/articles`);
        expect(metadata.robots).toMatchObject({
            index: false,
            follow: true,
            googleBot: { index: false, follow: true },
        });
    });
});
