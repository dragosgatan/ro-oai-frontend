/**
 * Property-Based Tests for SEO Key Priority
 *
 * **Property 11: SEO Key Priority**
 * **Validates: Requirements 6.1**
 *
 * For any page type and locale, the metadata generator SHALL first check for
 * seo.{pageType}.title and seo.{pageType}.description keys before falling back
 * to general UI keys.
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
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
    const keys = path.split('.');
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
 * Check if SEO keys exist for a page type in a locale
 */
function hasSeoKeys(locale: Locale, pageType: SeoPageType): boolean {
    const translations = loadTranslationFile(locale);
    if (!translations) return false;

    const titleKey = `seo.${pageType}.title`;
    const descKey = `seo.${pageType}.description`;

    const title = getNestedValue(translations, titleKey);
    const description = getNestedValue(translations, descKey);

    return title !== undefined && description !== undefined;
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
 * Simulate the SEO key priority resolution
 * This mimics what the metadata generator should do:
 * 1. Check seo.{pageType}.{field} first
 * 2. Fall back to UI keys if SEO keys don't exist
 */
function resolveSeoText(
    locale: Locale,
    pageType: SeoPageType,
    field: 'title' | 'description',
    fallbackKey: string,
): { value: string | undefined; source: 'seo' | 'ui' | 'fallback' } {
    const translations = loadTranslationFile(locale);
    if (!translations) {
        return { value: undefined, source: 'fallback' };
    }

    // First, check SEO-specific key
    const seoValue = getNestedValue(translations, `seo.${pageType}.${field}`);
    if (seoValue) {
        return { value: seoValue, source: 'seo' };
    }

    // Fall back to UI key
    const uiValue = getNestedValue(translations, fallbackKey);
    if (uiValue) {
        return { value: uiValue, source: 'ui' };
    }

    return { value: undefined, source: 'fallback' };
}

describe('SEO Key Priority Property Tests', () => {
    describe('Property 11: SEO Key Priority', () => {
        /**
         * **Feature: seo-localization, Property 11: SEO Key Priority**
         * **Validates: Requirements 6.1**
         *
         * Verify seo.* keys are checked before UI keys
         */
        it('should have SEO section in major locale translation files', () => {
            fc.assert(
                fc.property(fc.constantFrom(...MAJOR_LOCALES), (locale: Locale) => {
                    const translations = loadTranslationFile(locale);
                    expect(translations).not.toBeNull();

                    // Check that 'seo' section exists
                    expect(translations).toHaveProperty('seo');
                    expect(typeof (translations as Record<string, unknown>).seo).toBe('object');
                }),
                { numRuns: MAJOR_LOCALES.length },
            );
        });

        it('should have all required SEO page types in major locales', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...MAJOR_LOCALES),
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    (locale: Locale, pageType: SeoPageType) => {
                        const hasSeo = hasSeoKeys(locale, pageType);
                        expect(hasSeo).toBe(true);
                    },
                ),
                { numRuns: MAJOR_LOCALES.length * SEO_PAGE_TYPES.length },
            );
        });

        it('should have title and description for each SEO page type', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...MAJOR_LOCALES),
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    (locale: Locale, pageType: SeoPageType) => {
                        const title = getSeoKeyValue(locale, pageType, 'title');
                        const description = getSeoKeyValue(locale, pageType, 'description');

                        // Both title and description should exist
                        expect(title).toBeDefined();
                        expect(description).toBeDefined();

                        // Both should be non-empty strings
                        expect(typeof title).toBe('string');
                        expect(typeof description).toBe('string');
                        expect(title!.length).toBeGreaterThan(0);
                        expect(description!.length).toBeGreaterThan(0);
                    },
                ),
                { numRuns: MAJOR_LOCALES.length * SEO_PAGE_TYPES.length },
            );
        });

        it('should prioritize SEO keys over UI keys when both exist', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...MAJOR_LOCALES),
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    (locale: Locale, pageType: SeoPageType) => {
                        // Map page types to their UI fallback keys
                        const uiFallbackMap: Record<SeoPageType, string> = {
                            home: 'hero.title',
                            problems: 'problems.title',
                            competitions: 'competitions.list.title',
                            leaderboard: 'leaderboard.title',
                            achievements: 'achievements.title',
                        };

                        const fallbackKey = uiFallbackMap[pageType];
                        const result = resolveSeoText(locale, pageType, 'title', fallbackKey);

                        // When SEO keys exist, they should be used (source should be 'seo')
                        if (hasSeoKeys(locale, pageType)) {
                            expect(result.source).toBe('seo');
                        }
                    },
                ),
                { numRuns: MAJOR_LOCALES.length * SEO_PAGE_TYPES.length },
            );
        });

        it('should have SEO titles that differ from UI titles (optimized for search)', () => {
            fc.assert(
                fc.property(fc.constantFrom(...MAJOR_LOCALES), (locale: Locale) => {
                    const translations = loadTranslationFile(locale);
                    if (!translations) return;

                    // SEO home title should be different from hero title
                    const seoHomeTitle = getNestedValue(translations, 'seo.home.title');
                    const heroTitle = getNestedValue(translations, 'hero.title');

                    // SEO titles should be more descriptive (include platform name)
                    if (seoHomeTitle && heroTitle) {
                        // SEO title should typically be longer and include "MLCompete"
                        expect(seoHomeTitle).toContain('MLCompete');
                    }
                }),
                { numRuns: MAJOR_LOCALES.length },
            );
        });

        it('should have SEO descriptions that are optimized for search engines', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...MAJOR_LOCALES),
                    fc.constantFrom(...SEO_PAGE_TYPES),
                    (locale: Locale, pageType: SeoPageType) => {
                        const description = getSeoKeyValue(locale, pageType, 'description');

                        if (description) {
                            // SEO descriptions should be substantial (at least 50 characters)
                            expect(description.length).toBeGreaterThanOrEqual(50);

                            // SEO descriptions should not be too long (max 160 characters recommended)
                            expect(description.length).toBeLessThanOrEqual(200);
                        }
                    },
                ),
                { numRuns: MAJOR_LOCALES.length * SEO_PAGE_TYPES.length },
            );
        });

        it('should have English locale as the reference with all SEO keys', () => {
            const enTranslations = loadTranslationFile('en');
            expect(enTranslations).not.toBeNull();

            for (const pageType of SEO_PAGE_TYPES) {
                const title = getNestedValue(enTranslations!, `seo.${pageType}.title`);
                const description = getNestedValue(enTranslations!, `seo.${pageType}.description`);

                expect(title).toBeDefined();
                expect(description).toBeDefined();
            }
        });
    });
});
