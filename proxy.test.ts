import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    intlMiddleware: vi.fn(() => new Response(null, { status: 200 })),
}));

vi.mock('next-intl/middleware', () => ({
    default: () => mocks.intlMiddleware,
}));
vi.mock('@/i18n/routing', () => ({ routing: { locales: ['ro', 'en'] } }));

import proxy from '@/proxy';

describe('article invitation fragment bootstrap routing', () => {
    beforeEach(() => vi.clearAllMocks());

    it('routes the token-free accept path normally and never creates bearer cookies', () => {
        const response = proxy(
            new NextRequest(
                'https://platform.olimpiada-ai.ro/ro/writing/invitations/accept#token=a-secret-token',
            ),
        );

        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
        expect(response.headers.get('set-cookie')).toBeNull();
        expect(mocks.intlMiddleware).toHaveBeenCalledOnce();
    });

    it('removes generic locale alternates from content-language article details', () => {
        mocks.intlMiddleware.mockReturnValueOnce(
            new Response(null, {
                status: 200,
                headers: {
                    Link: '<https://platform.olimpiada-ai.ro/en/articles/test>; rel="alternate"',
                },
            }),
        );

        const response = proxy(
            new NextRequest('https://platform.olimpiada-ai.ro/ro/articles/test'),
        );

        expect(response.headers.get('link')).toBeNull();
    });

    it('keeps generic locale alternates on the localized article index', () => {
        mocks.intlMiddleware.mockReturnValueOnce(
            new Response(null, {
                status: 200,
                headers: {
                    Link: '<https://platform.olimpiada-ai.ro/en/articles>; rel="alternate"',
                },
            }),
        );

        const response = proxy(new NextRequest('https://platform.olimpiada-ai.ro/ro/articles'));

        expect(response.headers.get('link')).toContain('/en/articles');
    });
});
