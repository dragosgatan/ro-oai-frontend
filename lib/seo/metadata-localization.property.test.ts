/**
 * Property-Based Tests for Metadata Localization
 *
 * **Property 3: Metadata Localization**
 * **Validates: Requirements 2.1, 2.2, 2.4, 3.3**
 *
 * For any page type and locale with available translations, the generated metadata
 * title and description SHALL match the values from the locale's translation file
 * (either from seo.* keys or fallback UI keys).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

import { SUPPORTED_LOCALES } from './config';
import { Locale } from '@/lib/types';

// Path to locales directory
const localesDir = path.join(__dirname, '../../locales');

// Page types that should have SEO keys
const SEO_PAGE_TYPES = ['home', 'problems', 'competitions', 'leaderboard', 'achievements'] as const;
type SeoPageType = (typeof SEO_PAGE_TYPES)[number];

// Major locales that should have SEO translations
const MAJOR_LOCALES: Locale[] = ['en', 'es', 'de', 'fr', 'pt', 'it', 'ro'];

/**
 * Load a translation file for a given locale
 */
function loadTranslationFile(locale: Locale): Record<string, unknown> | null {
    const filePath = path.join(localesDir, `${locale}.json`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, keyPath: string): string | undefined {
    const keys = keyPath.split('.');
    let current: unknown = obj;

    for (const key of keys) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return undefined;
        }
        current = (current as Record<string, unknown>)[key];
    }

    return typeof current === 'string' ? current : undefined;
}

/**
 * Get SEO key value for a page type in a locale
 */
function getSeoKeyValue(
    locale: Locale,
    pageType: SeoPageType,
    field: 'title' | 'description',
): string | undefined {
    const translations = loadTranslationFile(locale);
    if (!translations) return undefined;

    return getNestedValue(translations, `seo.${pageType}.${field}`);
}

/**
 * Get UI fallback key value for a page type in a locale
 */
function getUiFallbackValue(
    locale: Locale,
    pageType: SeoPageType,
    field: 'title' | 'description',
): string | undefined {
    const translations = loadTranslationFile(locale);
    if (!translations) return undefined;

    // Map page types to their UI fallback keys
    const uiFallbackMap: Record<SeoPageType, { title: string; description: string }> = {
        home: { title: 'hero.title', description: 'hero.subtitle' },
        problems: { title: 'problems.title', description: 'problems.subtitle' },
        competitions: {
            title: 'competitions.list.title',
            description: 'competitions.list.subtitle',
        },
        leaderboard: { title: 'leaderboard.title', description: 'leaderboard.subtitle' },
        achievements: {
            title: 'achievements.pageTitle',
            description: 'achievements.pageDescription',
        },
    };

    const fallbackKey = uiFallbackMap[pageType][field];
    return getNestedValue(translations, fallbackKey);
}

/**
 * Simulate the metadata resolution with fallback chain
 */
function resolveMetadataText(
    locale: Locale,
    pageType: SeoPageType,
    field: 'title' | 'description',
): { value: string | undefined; source: 'seo' | 'ui' | 'english-seo' | 'english-ui' | 'default' } {
    // 1. Try SEO key in current locale
    const seoValue = getSeoKeyValue(locale, pageType, field);
    if (seoValue) {
        return { value: seoValue, source: 'seo' };
    }

    // 2. Try UI fallback in current locale
    const uiValue = getUiFallbackValue(locale, pageType, field);
    if (uiValue) {
        return { value: uiValue, source: 'ui' };
    }

    // 3. Try English SEO key
    if (locale !== 'en') {
        const enSeoValue = getSeoKeyValue('en', pageType, field);
        if (enSeoValue) {
            return { value: enSeoValue, source: 'english-seo' };
        }

        // 4. Try English UI fallback
        const enUiValue = getUiFallbackValue('en', pageType, field);
        if (enUiValue) {
            return { value: enUiValue, source: 'english-ui' };
        }
    }

    return { value: undefined, source: 'default' };
}

describe('Metadata Localization Property Tests', () => {
    describe('Property 3: Metadata Localization', () => {
        /**
         * **Feature: seo-localization, Property 3: Metadata Localization**
         * **Validates: Requirements 2.1, 2.2, 2.4, 3.3**
         *
         * Verify metadata uses locale-specific translations
         */
        it('should resolve metadata from SEO keys for major locales', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...MAJOR_LOCALES),
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    (locale: Locale, pageType: SeoPageType) => {
                        const titleResult = resolveMetadataText(locale, pageType, 'title');
                        const descResult = resolveMetadataText(locale, pageType, 'description');

                        // For major locales, SEO keys should exist and be used
                        expect(titleResult.value).toBeDefined();
                        expect(descResult.value).toBeDefined();

                        // SEO keys should be the primary source for major locales
                        expect(titleResult.source).toBe('seo');
                        expect(descResult.source).toBe('seo');
                    },
                ),
                { numRuns: MAJOR_LOCALES.length * SEO_PAGE_TYPES.length },
            );
        });

        it('should have locale-specific SEO titles that include MLCompete branding', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...MAJOR_LOCALES),
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    (locale: Locale, pageType: SeoPageType) => {
                        const title = getSeoKeyValue(locale, pageType, 'title');

                        if (title) {
                            // SEO titles should include the platform name for branding
                            expect(title).toContain('MLCompete');
                        }
                    },
                ),
                { numRuns: MAJOR_LOCALES.length * SEO_PAGE_TYPES.length },
            );
        });

        it('should have locale-specific SEO descriptions within SEO length limits', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...MAJOR_LOCALES),
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    (locale: Locale, pageType: SeoPageType) => {
                        const description = getSeoKeyValue(locale, pageType, 'description');

                        if (description) {
                            // SEO descriptions should be substantial but not too long
                            expect(description.length).toBeGreaterThanOrEqual(50);
                            expect(description.length).toBeLessThanOrEqual(200);
                        }
                    },
                ),
                { numRuns: MAJOR_LOCALES.length * SEO_PAGE_TYPES.length },
            );
        });

        it('should always resolve to a non-empty value for any locale and page type', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...SUPPORTED_LOCALES),
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    (locale: Locale, pageType: SeoPageType) => {
                        const titleResult = resolveMetadataText(locale, pageType, 'title');
                        const descResult = resolveMetadataText(locale, pageType, 'description');

                        // Should always resolve to some value (either from locale or English fallback)
                        expect(titleResult.value).toBeDefined();
                        expect(descResult.value).toBeDefined();

                        // Values should be non-empty strings
                        expect(titleResult.value!.length).toBeGreaterThan(0);
                        expect(descResult.value!.length).toBeGreaterThan(0);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should have different SEO content for different page types', () => {
            fc.assert(
                fc.property(fc.constantFrom(...MAJOR_LOCALES), (locale: Locale) => {
                    const titles = SEO_PAGE_TYPES.map((pt) => getSeoKeyValue(locale, pt, 'title'));
                    const descriptions = SEO_PAGE_TYPES.map((pt) =>
                        getSeoKeyValue(locale, pt, 'description'),
                    );

                    // All titles should be unique (different pages have different titles)
                    const uniqueTitles = new Set(titles.filter(Boolean));
                    expect(uniqueTitles.size).toBe(SEO_PAGE_TYPES.length);

                    // All descriptions should be unique
                    const uniqueDescriptions = new Set(descriptions.filter(Boolean));
                    expect(uniqueDescriptions.size).toBe(SEO_PAGE_TYPES.length);
                }),
                { numRuns: MAJOR_LOCALES.length },
            );
        });

        it('should have consistent SEO structure across all major locales', () => {
            fc.assert(
                fc.property(fc.constantFrom(...SEO_PAGE_TYPES), (pageType: SeoPageType) => {
                    // All major locales should have the same SEO keys
                    for (const locale of MAJOR_LOCALES) {
                        const title = getSeoKeyValue(locale, pageType, 'title');
                        const description = getSeoKeyValue(locale, pageType, 'description');

                        expect(title).toBeDefined();
                        expect(description).toBeDefined();
                    }
                }),
                { numRuns: SEO_PAGE_TYPES.length },
            );
        });
    });
});
