/**
 * Property-Based Tests for OG Locale Format
 *
 * **Property 5: OG Locale Format**
 * **Validates: Requirements 3.1**
 *
 * For any supported locale, the generated og:locale value SHALL be in the
 * format {language}_{REGION} (e.g., es_ES for Spanish, zh_CN for Chinese).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { getOgLocale, SUPPORTED_LOCALES, LOCALE_REGION_MAP } from './config';
import type { Locale } from '@/lib/types';

describe('OG Locale Format Property Tests', () => {
    describe('Property 5: OG Locale Format', () => {
        /**
         * **Feature: seo-localization, Property 5: OG Locale Format**
         * **Validates: Requirements 3.1**
         *
         * Verify og:locale is in {language}_{REGION} format
         */
        it('should return og:locale in {language}_{REGION} format for all supported locales', () => {
            fc.assert(
                fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale: Locale) => {
                    const ogLocale = getOgLocale(locale);

                    // Should match the pattern {language}_{REGION}
                    // Language is 2-3 lowercase letters, region is 2 uppercase letters
                    expect(ogLocale).toMatch(/^[a-z]{2,3}_[A-Z]{2}$/);
                }),
                { numRuns: 100 },
            );
        });

        it('should have a mapping for every supported locale', () => {
            for (const locale of SUPPORTED_LOCALES) {
                const ogLocale = getOgLocale(locale);

                // Should be defined and non-empty
                expect(ogLocale).toBeDefined();
                expect(ogLocale.length).toBeGreaterThan(0);

                // Should be in the LOCALE_REGION_MAP
                expect(LOCALE_REGION_MAP[locale]).toBeDefined();
            }
        });

        it('should return consistent results for the same locale', () => {
            fc.assert(
                fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale: Locale) => {
                    const result1 = getOgLocale(locale);
                    const result2 = getOgLocale(locale);

                    expect(result1).toBe(result2);
                }),
                { numRuns: 100 },
            );
        });

        it('should handle zh-CN correctly as zh_CN', () => {
            const ogLocale = getOgLocale('zh-CN');
            expect(ogLocale).toBe('zh_CN');
        });

        it('should handle common locales with expected values', () => {
            // Test specific expected mappings
            expect(getOgLocale('en')).toBe('en_US');
            expect(getOgLocale('es')).toBe('es_ES');
            expect(getOgLocale('fr')).toBe('fr_FR');
            expect(getOgLocale('de')).toBe('de_DE');
            expect(getOgLocale('ro')).toBe('ro_RO');
            expect(getOgLocale('ar')).toBe('ar_SA');
            expect(getOgLocale('he')).toBe('he_IL');
        });

        it('should produce unique og:locale values for different locales', () => {
            const ogLocales = SUPPORTED_LOCALES.map((locale) => getOgLocale(locale));
            const uniqueOgLocales = new Set(ogLocales);

            // Each locale should map to a unique og:locale
            expect(uniqueOgLocales.size).toBe(SUPPORTED_LOCALES.length);
        });
    });
});
