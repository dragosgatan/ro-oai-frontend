/**
 * Property-Based Tests for Canonical URL Correctness
 *
 * **Property 2: Canonical URL Correctness**
 * **Validates: Requirements 1.3**
 *
 * For any locale and path combination, the canonical URL SHALL be correctly formatted as
 * {BASE_URL}/{locale}{path}. The routing configuration uses `localePrefix: 'always'`,
 * so the Romanian default locale is explicit too.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { getCanonicalUrl, generateAlternateLanguages } from './canonical';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, BASE_URL } from './config';
import type { Locale } from '@/lib/types';

// Custom arbitrary for generating valid URL paths
// Filter out paths that start with locale prefixes to avoid false positives
const urlPathArbitrary = fc
    .array(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9-_]+$/.test(s)),
        { minLength: 1, maxLength: 5 },
    )
    .map((segments) => '/' + segments.join('/'))
    .filter((path) => {
        // Ensure path doesn't start with a locale prefix
        const firstSegment = path.split('/')[1];
        return !SUPPORTED_LOCALES.includes(firstSegment as any);
    });

// Arbitrary for supported locales
const localeArbitrary = fc.constantFrom(...SUPPORTED_LOCALES);

describe('Canonical URL Correctness Property Tests', () => {
    describe('Property 2: Canonical URL Correctness', () => {
        /**
         * **Feature: seo-localization, Property 2: Canonical URL Correctness**
         * **Validates: Requirements 1.3**
         *
         * Verify URL format for default and non-default locales
         */
        it('should format canonical URL with the default locale prefix', () => {
            fc.assert(
                fc.property(urlPathArbitrary, (path: string) => {
                    const canonicalUrl = getCanonicalUrl(path, DEFAULT_LOCALE);

                    expect(canonicalUrl).toBe(`${BASE_URL}/${DEFAULT_LOCALE}${path}`);
                }),
                { numRuns: 100 },
            );
        });

        it('should format canonical URL with locale prefix for non-default locales', () => {
            fc.assert(
                fc.property(
                    urlPathArbitrary,
                    localeArbitrary.filter((l) => l !== DEFAULT_LOCALE),
                    (path: string, locale: Locale) => {
                        const canonicalUrl = getCanonicalUrl(path, locale);

                        // Non-default locales should have locale prefix
                        expect(canonicalUrl).toBe(`${BASE_URL}/${locale}${path}`);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should generate alternate languages with correct URL format for all locales', () => {
            fc.assert(
                fc.property(urlPathArbitrary, (path: string) => {
                    const alternates = generateAlternateLanguages(path);

                    // Check each locale has correct URL format
                    for (const locale of SUPPORTED_LOCALES) {
                        const url = alternates[locale];
                        expect(url).toBeDefined();

                        expect(url).toBe(`${BASE_URL}/${locale}${path}`);
                    }

                    // x-default follows the routing default: Romanian.
                    expect(alternates['x-default']).toBe(`${BASE_URL}/${DEFAULT_LOCALE}${path}`);
                }),
                { numRuns: 100 },
            );
        });

        it('should include all supported locales in alternate languages', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('/problems', '/competitions', '/leaderboard', '/'),
                    (path: string) => {
                        const alternates = generateAlternateLanguages(path);

                        // Should have entry for each locale plus x-default
                        const keys = Object.keys(alternates);
                        expect(keys.length).toBe(SUPPORTED_LOCALES.length + 1);

                        // All locales should be present
                        for (const locale of SUPPORTED_LOCALES) {
                            expect(alternates[locale]).toBeDefined();
                        }

                        // x-default should be present
                        expect(alternates['x-default']).toBeDefined();
                    },
                ),
                { numRuns: 5 },
            );
        });

        it('should normalize paths correctly in canonical URLs', () => {
            // Test various path formats
            const testCases = [
                { input: '/problems/', expected: '/problems' },
                { input: 'problems', expected: '/problems' },
                { input: '/problems?page=1', expected: '/problems' },
                { input: '/problems#section', expected: '/problems' },
                { input: '/problems?page=1#section', expected: '/problems' },
            ];

            for (const { input, expected } of testCases) {
                const canonicalUrl = getCanonicalUrl(input, DEFAULT_LOCALE);
                expect(canonicalUrl).toBe(`${BASE_URL}/${DEFAULT_LOCALE}${expected}`);
            }
        });

        it('should handle root path correctly', () => {
            const canonicalUrl = getCanonicalUrl('/', DEFAULT_LOCALE);
            expect(canonicalUrl).toBe(`${BASE_URL}/${DEFAULT_LOCALE}`);

            const alternates = generateAlternateLanguages('/');
            expect(alternates[DEFAULT_LOCALE]).toBe(`${BASE_URL}/${DEFAULT_LOCALE}`);
            expect(alternates['x-default']).toBe(`${BASE_URL}/${DEFAULT_LOCALE}`);
        });

        it('should produce valid URLs for all locale and path combinations', () => {
            fc.assert(
                fc.property(urlPathArbitrary, localeArbitrary, (path: string, locale: Locale) => {
                    const canonicalUrl = getCanonicalUrl(path, locale);

                    // URL should be valid
                    expect(() => new URL(canonicalUrl)).not.toThrow();

                    // URL should start with BASE_URL
                    expect(canonicalUrl.startsWith(BASE_URL)).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });
});
