import { describe, expect, it } from 'vitest';

import {
    buildLocalePath,
    getProtectedRouteContext,
    isCompetitionRestrictedRoute,
    isProfileConfirmationRoute,
    isProtectedGateAllowlisted,
} from '@/lib/protected-routing';

describe('protected route parsing', () => {
    it('uses the locale-stripped pathname and ignores query text', () => {
        const context = getProtectedRouteContext(
            'https://platform.example/ro/problems?returnTo=%2Flogin',
        );

        expect(context.locale).toBe('ro');
        expect(context.routePath).toBe('/problems');
        expect(isProtectedGateAllowlisted(context.routePath)).toBe(false);
        expect(isCompetitionRestrictedRoute(context.routePath)).toBe(true);
    });

    it('does not mistake a query value for the profile confirmation route', () => {
        const { routePath } = getProtectedRouteContext(
            'https://platform.example/en/profile/alex?next=/profile/confirm',
        );

        expect(routePath).toBe('/profile/alex');
        expect(isProfileConfirmationRoute(routePath)).toBe(false);
    });

    it.each([
        '/login',
        '/logout',
        '/error',
        '/api',
        '/api/auth/session',
        '/admin-preview',
        '/admin-preview/articles/42',
        '/admin-preview/article-reviews/99',
    ])('allowlists only the intended route: %s', (routePath) => {
        expect(isProtectedGateAllowlisted(routePath)).toBe(true);
    });

    it.each([
        '/login-help',
        '/profile/login-history',
        '/problems?next=/logout',
        '/admin-previewer/articles/42',
    ])('does not allowlist lookalike text: %s', (routePath) => {
        expect(isProtectedGateAllowlisted(routePath)).toBe(false);
    });

    it('keeps every redirect explicitly locale-prefixed', () => {
        expect(buildLocalePath('/profile/confirm', 'ro')).toBe('/ro/profile/confirm');
        expect(buildLocalePath('/', 'en')).toBe('/en');
    });
});
