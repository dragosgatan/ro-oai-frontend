/**
 * Property-Based Tests for Hreflang Completeness
 *
 * **Property 1: Hreflang Completeness**
 * **Validates: Requirements 1.1, 1.2, 1.4**
 *
 * For any valid URL path, the generated hreflang tags SHALL include exactly
 * SUPPORTED_LOCALES.length + 1 entries (one for each locale plus x-default),
 * with x-default pointing to the explicitly prefixed Romanian default version.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { getHreflangTags } from './canonical';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, BASE_URL } from './config';

// Custom arbitrary for generating valid URL paths
// Exclude segments that match locale codes to avoid false positives
const localeSet = new Set(SUPPORTED_LOCALES);
const urlPathArbitrary = fc
    .array(
        fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => /^[a-z0-9-_]+$/.test(s))
            .filter((s) => !localeSet.has(s as any)), // Exclude locale codes from path segments
        { minLength: 1, maxLength: 5 },
    )
    .map((segments) => '/' + segments.join('/'));

describe('Hreflang Completeness Property Tests', () => {
    describe('Property 1: Hreflang Completeness', () => {
        /**
         * **Feature: seo-localization, Property 1: Hreflang Completeness**
         * **Validates: Requirements 1.1, 1.2, 1.4**
         *
         * Verify tag count equals SUPPORTED_LOCALES.length + 1
         * Verify x-default is present and correct
         */
        it('should generate exactly SUPPORTED_LOCALES.length + 1 hreflang tags for any path', () => {
            fc.assert(
                fc.property(urlPathArbitrary, (path: string) => {
                    const tags = getHreflangTags(path);

                    // Should have one tag per locale plus x-default
                    expect(tags.length).toBe(SUPPORTED_LOCALES.length + 1);
                }),
                { numRuns: 100 },
            );
        });

        it('should always include x-default tag pointing to the default locale version', () => {
            fc.assert(
                fc.property(urlPathArbitrary, (path: string) => {
                    const tags = getHreflangTags(path);

                    // Find x-default tag
                    const xDefaultTag = tags.find((t) => t.hreflang === 'x-default');

                    // x-default should exist
                    expect(xDefaultTag).toBeDefined();

                    expect(xDefaultTag?.href).toBe(`${BASE_URL}/${DEFAULT_LOCALE}${path}`);
                }),
                { numRuns: 100 },
            );
        });

        it('should include a tag for every supported locale', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        '/problems',
                        '/competitions',
                        '/leaderboard',
                        '/achievements',
                        '/',
                    ),
                    (path: string) => {
                        const tags = getHreflangTags(path);

                        // Check that each supported locale has a corresponding tag
                        for (const locale of SUPPORTED_LOCALES) {
                            // zh-CN should be converted to zh-Hans
                            const expectedHreflang = locale === 'zh-CN' ? 'zh-Hans' : locale;
                            const localeTag = tags.find((t) => t.hreflang === expectedHreflang);

                            expect(localeTag).toBeDefined();
                            expect(localeTag?.href).toBeDefined();
                        }
                    },
                ),
                { numRuns: 5 },
            );
        });

        it('should convert zh-CN to zh-Hans in hreflang attribute', () => {
            const tags = getHreflangTags('/problems');

            // Should have zh-Hans, not zh-CN
            const zhHansTag = tags.find((t) => t.hreflang === 'zh-Hans');
            const zhCNTag = tags.find((t) => t.hreflang === 'zh-CN');

            expect(zhHansTag).toBeDefined();
            expect(zhCNTag).toBeUndefined();

            // The href should still use zh-CN in the URL path
            expect(zhHansTag?.href).toContain('/zh-CN/');
        });

        it('should generate valid ISO 639-1 language codes or BCP 47 tags', () => {
            const tags = getHreflangTags('/');

            for (const tag of tags) {
                if (tag.hreflang === 'x-default') {
                    continue; // x-default is a special case
                }

                // Should be either a 2-letter code or zh-Hans
                expect(tag.hreflang).toMatch(/^([a-z]{2}|zh-Hans)$/);
            }
        });

        it('should have correct URL format for default and non-default locales', () => {
            const path = '/problems/123';
            const tags = getHreflangTags(path);

            for (const tag of tags) {
                if (tag.hreflang === 'x-default') {
                    expect(tag.href).toBe(`${BASE_URL}/${DEFAULT_LOCALE}/problems/123`);
                } else {
                    // Find the original locale code
                    const locale = tag.hreflang === 'zh-Hans' ? 'zh-CN' : tag.hreflang;

                    expect(tag.href).toBe(`${BASE_URL}/${locale}/problems/123`);
                }
            }
        });
    });
});
