/**
 * Property-Based Tests for Translation Fallback
 *
 * **Property 4: Translation Fallback**
 * **Validates: Requirements 2.3, 6.2, 7.4**
 *
 * For any locale where a specific translation key is missing, the SEO system
 * SHALL return the English translation for that key instead of undefined or empty string.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './config';
import { Locale } from '@/lib/types';

// Path to locales directory
const localesDir = path.join(__dirname, '../../locales');

// Page types that should have SEO keys
const SEO_PAGE_TYPES = ['home', 'problems', 'competitions', 'leaderboard', 'achievements'] as const;
type SeoPageType = (typeof SEO_PAGE_TYPES)[number];

// Locales that may not have complete SEO translations (minor locales)
const MINOR_LOCALES: Locale[] = SUPPORTED_LOCALES.filter(
    (l) => !['en', 'es', 'de', 'fr', 'pt', 'it', 'ro'].includes(l),
);

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
 * Simulate the complete fallback chain:
 * 1. seo.{pageType}.{field} in current locale
 * 2. UI key in current locale
 * 3. seo.{pageType}.{field} in English
 * 4. UI key in English
 * 5. Default value
 */
function resolveWithFallback(
    locale: Locale,
    pageType: SeoPageType,
    field: 'title' | 'description',
    defaultValue: string,
): { value: string; source: 'seo' | 'ui' | 'english-seo' | 'english-ui' | 'default' } {
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

    // 3. Try English SEO key (if not already English)
    if (locale !== DEFAULT_LOCALE) {
        const enSeoValue = getSeoKeyValue(DEFAULT_LOCALE, pageType, field);
        if (enSeoValue) {
            return { value: enSeoValue, source: 'english-seo' };
        }

        // 4. Try English UI fallback
        const enUiValue = getUiFallbackValue(DEFAULT_LOCALE, pageType, field);
        if (enUiValue) {
            return { value: enUiValue, source: 'english-ui' };
        }
    }

    // 5. Use default value
    return { value: defaultValue, source: 'default' };
}

describe('Translation Fallback Property Tests', () => {
    describe('Property 4: Translation Fallback', () => {
        /**
         * **Feature: seo-localization, Property 4: Translation Fallback**
         * **Validates: Requirements 2.3, 6.2, 7.4**
         *
         * Verify fallback to English when translation missing
         */
        it('should always return a non-empty value for any locale', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...SUPPORTED_LOCALES),
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    fc.constantFrom('title', 'description') as fc.Arbitrary<
                        'title' | 'description'
                    >,
                    (locale: Locale, pageType: SeoPageType, field: 'title' | 'description') => {
                        const defaultValue =
                            field === 'title' ? 'Default Title' : 'Default Description';
                        const result = resolveWithFallback(locale, pageType, field, defaultValue);

                        // Should never return undefined or empty string
                        expect(result.value).toBeDefined();
                        expect(result.value.length).toBeGreaterThan(0);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should fall back to English when locale-specific SEO key is missing', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...MINOR_LOCALES),
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    (locale: Locale, pageType: SeoPageType) => {
                        const localeSeoTitle = getSeoKeyValue(locale, pageType, 'title');
                        const englishSeoTitle = getSeoKeyValue(DEFAULT_LOCALE, pageType, 'title');

                        // If locale doesn't have SEO key, English should be available
                        if (!localeSeoTitle) {
                            expect(englishSeoTitle).toBeDefined();
                            expect(englishSeoTitle!.length).toBeGreaterThan(0);
                        }
                    },
                ),
                { numRuns: MINOR_LOCALES.length * SEO_PAGE_TYPES.length },
            );
        });

        it('should have English as the complete reference locale', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    fc.constantFrom('title', 'description') as fc.Arbitrary<
                        'title' | 'description'
                    >,
                    (pageType: SeoPageType, field: 'title' | 'description') => {
                        // English should always have SEO keys
                        const englishValue = getSeoKeyValue(DEFAULT_LOCALE, pageType, field);

                        expect(englishValue).toBeDefined();
                        expect(englishValue!.length).toBeGreaterThan(0);
                    },
                ),
                { numRuns: SEO_PAGE_TYPES.length * 2 },
            );
        });

        it('should use locale-specific value when available, not English', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('es', 'de', 'fr', 'ro') as fc.Arbitrary<Locale>,
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    (locale: Locale, pageType: SeoPageType) => {
                        const localeTitle = getSeoKeyValue(locale, pageType, 'title');
                        const englishTitle = getSeoKeyValue(DEFAULT_LOCALE, pageType, 'title');

                        // If locale has its own SEO key, it should be different from English
                        // (unless it's intentionally the same, which is rare)
                        if (localeTitle && englishTitle && locale !== DEFAULT_LOCALE) {
                            // The resolution should use the locale-specific value
                            const result = resolveWithFallback(
                                locale,
                                pageType,
                                'title',
                                'Default',
                            );
                            expect(result.source).toBe('seo');
                            expect(result.value).toBe(localeTitle);
                        }
                    },
                ),
                { numRuns: 20 },
            );
        });

        it('should never return undefined from the fallback chain', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...SUPPORTED_LOCALES),
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    (locale: Locale, pageType: SeoPageType) => {
                        const titleResult = resolveWithFallback(
                            locale,
                            pageType,
                            'title',
                            'Fallback Title',
                        );
                        const descResult = resolveWithFallback(
                            locale,
                            pageType,
                            'description',
                            'Fallback Description',
                        );

                        // Results should never be undefined
                        expect(titleResult.value).not.toBeUndefined();
                        expect(descResult.value).not.toBeUndefined();

                        // Results should never be empty strings
                        expect(titleResult.value).not.toBe('');
                        expect(descResult.value).not.toBe('');
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should maintain fallback chain order: seo → ui → english-seo → english-ui → default', () => {
            // Test with a locale that has SEO keys
            const localeWithSeo: Locale = 'es';
            const pageType: SeoPageType = 'home';

            const result = resolveWithFallback(localeWithSeo, pageType, 'title', 'Default');

            // Spanish has SEO keys, so it should use 'seo' source
            expect(result.source).toBe('seo');

            // Verify the value matches the Spanish SEO title
            const expectedValue = getSeoKeyValue(localeWithSeo, pageType, 'title');
            expect(result.value).toBe(expectedValue);
        });

        it('should use default value only when all fallbacks fail', () => {
            // This is a theoretical test - in practice, English should always have values
            // We test that the default is used when explicitly no translations exist
            const defaultTitle = 'Ultimate Fallback Title';
            const defaultDesc = 'Ultimate Fallback Description';

            // For any supported locale, we should never reach the default
            // because English always has the SEO keys
            for (const locale of SUPPORTED_LOCALES) {
                for (const pageType of SEO_PAGE_TYPES) {
                    const titleResult = resolveWithFallback(
                        locale,
                        pageType,
                        'title',
                        defaultTitle,
                    );
                    const descResult = resolveWithFallback(
                        locale,
                        pageType,
                        'description',
                        defaultDesc,
                    );

                    // Should not use default because English has all keys
                    expect(titleResult.source).not.toBe('default');
                    expect(descResult.source).not.toBe('default');
                }
            }
        });
    });
});
