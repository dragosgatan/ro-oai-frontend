import { describe, expect, it } from 'vitest';

import { getLocaleFromPathname, getLocaleHomePath, getSafeReturnPath } from '@/lib/safe-navigation';

describe('safe navigation', () => {
    it('keeps supported locale prefixes', () => {
        expect(getLocaleFromPathname('/it/problems/42')).toBe('it');
        expect(getLocaleHomePath('/zh-CN/competitions')).toBe('/zh-CN');
    });

    it('falls back to Romanian when the locale is missing or unsupported', () => {
        expect(getLocaleHomePath('/problems')).toBe('/ro');
        expect(getLocaleHomePath('/xx/problems')).toBe('/ro');
    });

    it('preserves same-origin paths, queries, and hashes', () => {
        expect(
            getSafeReturnPath(
                'https://platform.olimpiada-ai.ro/ro/problems?page=2#results',
                '/ro',
                'https://platform.olimpiada-ai.ro',
            ),
        ).toBe('/ro/problems?page=2#results');
    });

    it('rejects external, protocol-relative, and malformed return URLs', () => {
        const fallback = '/ro';

        expect(
            getSafeReturnPath(
                'https://example.com/steal-session',
                fallback,
                'https://platform.olimpiada-ai.ro',
            ),
        ).toBe(fallback);
        expect(
            getSafeReturnPath(
                '//example.com/steal-session',
                fallback,
                'https://platform.olimpiada-ai.ro',
            ),
        ).toBe(fallback);
        expect(getSafeReturnPath('https://%', fallback)).toBe(fallback);
    });
});
