/**
 * Property-Based Tests for Sitemap Locale Coverage
 *
 * **Property 13: Sitemap Locale Coverage**
 * **Validates: Requirements 8.1, 8.2**
 *
 * For any sitemap entry, the xhtml:link alternates SHALL include exactly
 * SUPPORTED_LOCALES.length + 1 entries (one for each locale plus x-default).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { generateSitemapEntry, generateSitemapXml } from './sitemap';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, BASE_URL } from './config';

// Custom arbitrary for generating valid URL paths
const urlPathArbitrary = fc
    .array(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9-_]+$/.test(s)),
        { minLength: 1, maxLength: 5 },
    )
    .map((segments) => '/' + segments.join('/'));

// Arbitrary for sitemap entry options
const sitemapOptionsArbitrary = fc.record({
    lastmod: fc.option(
        fc
            .date({
                min: new Date('2020-01-01'),
                max: new Date('2030-12-31'),
                noInvalidDate: true,
            })
            .map((d) => d.toISOString()),
        { nil: undefined },
    ),
    changefreq: fc.option(
        fc.constantFrom(
            'always' as const,
            'hourly' as const,
            'daily' as const,
            'weekly' as const,
            'monthly' as const,
            'yearly' as const,
            'never' as const,
        ),
        { nil: undefined },
    ),
    priority: fc.option(fc.float({ min: 0, max: 1, noNaN: true }), { nil: undefined }),
});

describe('Sitemap Locale Coverage Property Tests', () => {
    describe('Property 13: Sitemap Locale Coverage', () => {
        /**
         * **Feature: seo-localization, Property 13: Sitemap Locale Coverage**
         * **Validates: Requirements 8.1, 8.2**
         *
         * Verify sitemap entries have correct alternate count
         */
        it('should generate exactly SUPPORTED_LOCALES.length + 1 alternates for any path', () => {
            fc.assert(
                fc.property(urlPathArbitrary, (path: string) => {
                    const entry = generateSitemapEntry(path);

                    // Should have one alternate per locale plus x-default
                    expect(entry.alternateRefs).toBeDefined();
                    expect(entry.alternateRefs?.length).toBe(SUPPORTED_LOCALES.length + 1);
                }),
                { numRuns: 100 },
            );
        });

        it('should always include x-default alternate pointing to default locale version', () => {
            fc.assert(
                fc.property(urlPathArbitrary, (path: string) => {
                    const entry = generateSitemapEntry(path);

                    // Find x-default alternate
                    const xDefaultAlt = entry.alternateRefs?.find(
                        (a) => a.hreflang === 'x-default',
                    );

                    // x-default should exist
                    expect(xDefaultAlt).toBeDefined();

                    expect(xDefaultAlt?.href).toBe(`${BASE_URL}/${DEFAULT_LOCALE}${path}`);
                }),
                { numRuns: 100 },
            );
        });

        it('should include an alternate for every supported locale', () => {
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
                        const entry = generateSitemapEntry(path);

                        // Check that each supported locale has a corresponding alternate
                        for (const locale of SUPPORTED_LOCALES) {
                            // zh-CN should be converted to zh-Hans
                            const expectedHreflang = locale === 'zh-CN' ? 'zh-Hans' : locale;
                            const localeAlt = entry.alternateRefs?.find(
                                (a) => a.hreflang === expectedHreflang,
                            );

                            expect(localeAlt).toBeDefined();
                            expect(localeAlt?.href).toBeDefined();
                        }
                    },
                ),
                { numRuns: 5 },
            );
        });

        it('should convert zh-CN to zh-Hans in hreflang attribute', () => {
            const entry = generateSitemapEntry('/problems');

            // Should have zh-Hans, not zh-CN
            const zhHansAlt = entry.alternateRefs?.find((a) => a.hreflang === 'zh-Hans');
            const zhCNAlt = entry.alternateRefs?.find((a) => a.hreflang === 'zh-CN');

            expect(zhHansAlt).toBeDefined();
            expect(zhCNAlt).toBeUndefined();

            // The href should still use zh-CN in the URL path
            expect(zhHansAlt?.href).toContain('/zh-CN/');
        });

        it('should have correct URL format for default and non-default locales', () => {
            const path = '/problems/123';
            const entry = generateSitemapEntry(path);

            for (const alt of entry.alternateRefs || []) {
                if (alt.hreflang === 'x-default') {
                    expect(alt.href).toBe(`${BASE_URL}/${DEFAULT_LOCALE}/problems/123`);
                } else {
                    // Find the original locale code
                    const locale = alt.hreflang === 'zh-Hans' ? 'zh-CN' : alt.hreflang;

                    expect(alt.href).toBe(`${BASE_URL}/${locale}/problems/123`);
                }
            }
        });

        it('should preserve sitemap entry options when generating entries', () => {
            fc.assert(
                fc.property(urlPathArbitrary, sitemapOptionsArbitrary, (path, options) => {
                    const entry = generateSitemapEntry(path, options);

                    // Check that options are preserved
                    if (options.changefreq !== undefined) {
                        expect(entry.changeFrequency).toBe(options.changefreq);
                    }
                    if (options.priority !== undefined) {
                        expect(entry.priority).toBe(options.priority);
                    }
                    if (options.lastmod !== undefined) {
                        expect(entry.lastModified).toBeDefined();
                        expect(entry.lastModified?.toISOString()).toBe(options.lastmod);
                    }
                }),
                { numRuns: 50 },
            );
        });
    });

    describe('Sitemap XML Generation', () => {
        it('should include xhtml namespace in generated XML', () => {
            const entry = generateSitemapEntry('/problems');
            const xml = generateSitemapXml([entry]);

            // Should include xhtml namespace declaration
            expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
        });

        it('should generate xhtml:link elements for all alternates', () => {
            const entry = generateSitemapEntry('/problems');
            const xml = generateSitemapXml([entry]);

            // Should have xhtml:link elements for each alternate
            for (const alt of entry.alternateRefs || []) {
                expect(xml).toContain(
                    `<xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}"/>`,
                );
            }
        });

        it('should generate valid XML structure for any path', () => {
            fc.assert(
                fc.property(urlPathArbitrary, (path: string) => {
                    const entry = generateSitemapEntry(path);
                    const xml = generateSitemapXml([entry]);

                    // Should have proper XML declaration
                    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');

                    // Should have urlset with proper namespaces
                    expect(xml).toContain(
                        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
                    );
                    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');

                    // Should have url element with loc
                    expect(xml).toContain('<url>');
                    expect(xml).toContain('<loc>');
                    expect(xml).toContain('</url>');
                    expect(xml).toContain('</urlset>');
                }),
                { numRuns: 50 },
            );
        });

        it('should include all SUPPORTED_LOCALES.length + 1 xhtml:link elements per entry', () => {
            const entry = generateSitemapEntry('/problems');
            const xml = generateSitemapXml([entry]);

            // Count xhtml:link elements
            const linkMatches = xml.match(/<xhtml:link/g);
            expect(linkMatches?.length).toBe(SUPPORTED_LOCALES.length + 1);
        });
    });
});
