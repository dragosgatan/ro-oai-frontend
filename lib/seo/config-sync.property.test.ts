/**
 * Property-Based Tests for SEO Configuration Synchronization
 *
 * **Property 9: Config Synchronization**
 * **Validates: Requirements 5.2**
 *
 * For all locales in the i18n SUPPORTED_LOCALES array, the SEO system's
 * SUPPORTED_LOCALES SHALL contain the same locales (the arrays should be identical).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Import from both sources to verify synchronization
import {
    SUPPORTED_LOCALES as SEO_SUPPORTED_LOCALES,
    LOCALE_REGION_MAP,
    getOgLocale,
} from './config';
import { SUPPORTED_LOCALES as I18N_SUPPORTED_LOCALES, Locale } from '@/lib/types';

describe('SEO Config Synchronization Property Tests', () => {
    describe('Property 9: Config Synchronization', () => {
        /**
         * **Feature: seo-localization, Property 9: Config Synchronization**
         * **Validates: Requirements 5.2**
         *
         * Verify SEO SUPPORTED_LOCALES matches i18n SUPPORTED_LOCALES
         */
        it('should have SEO SUPPORTED_LOCALES identical to i18n SUPPORTED_LOCALES', () => {
            // Arrays should have the same length
            expect(SEO_SUPPORTED_LOCALES.length).toBe(I18N_SUPPORTED_LOCALES.length);

            // Every locale in i18n should be in SEO
            for (const locale of I18N_SUPPORTED_LOCALES) {
                expect(SEO_SUPPORTED_LOCALES).toContain(locale);
            }

            // Every locale in SEO should be in i18n
            for (const locale of SEO_SUPPORTED_LOCALES) {
                expect(I18N_SUPPORTED_LOCALES).toContain(locale);
            }
        });

        it('should have LOCALE_REGION_MAP entry for every supported locale', () => {
            fc.assert(
                fc.property(fc.constantFrom(...I18N_SUPPORTED_LOCALES), (locale: Locale) => {
                    // Every supported locale should have a region mapping
                    expect(LOCALE_REGION_MAP[locale]).toBeDefined();
                    expect(typeof LOCALE_REGION_MAP[locale]).toBe('string');
                }),
                { numRuns: I18N_SUPPORTED_LOCALES.length },
            );
        });

        it('should return valid og:locale format for any supported locale', () => {
            fc.assert(
                fc.property(fc.constantFrom(...I18N_SUPPORTED_LOCALES), (locale: Locale) => {
                    const ogLocale = getOgLocale(locale);

                    // og:locale should be in {language}_{REGION} format
                    expect(ogLocale).toMatch(/^[a-z]{2,3}_[A-Z]{2}$/);

                    // Should match the LOCALE_REGION_MAP entry
                    expect(ogLocale).toBe(LOCALE_REGION_MAP[locale]);
                }),
                { numRuns: I18N_SUPPORTED_LOCALES.length },
            );
        });

        it('should have all 30 supported locales synchronized', () => {
            // Verify the expected count of locales
            expect(I18N_SUPPORTED_LOCALES.length).toBe(30);
            expect(SEO_SUPPORTED_LOCALES.length).toBe(30);

            // Verify specific locales are present
            const expectedLocales: Locale[] = [
                'en',
                'ro',
                'de',
                'bg',
                'sr',
                'uk',
                'hu',
                'ru',
                'kk',
                'ka',
                'fr',
                'nl',
                'et',
                'fi',
                'sv',
                'lv',
                'lt',
                'hr',
                'sk',
                'sl',
                'cs',
                'da',
                'it',
                'es',
                'pt',
                'pl',
                'no',
                'zh-CN',
                'ar',
                'he',
            ];

            for (const locale of expectedLocales) {
                expect(SEO_SUPPORTED_LOCALES).toContain(locale);
                expect(I18N_SUPPORTED_LOCALES).toContain(locale);
            }
        });
    });
});
