/**
 * Locale Types Property-Based Tests
 *
 * Property test for task 1.2: Locale Type Completeness
 *
 * **Feature: multi-language-expansion, Property 6: Language Names Completeness**
 *
 * This test verifies:
 * - SUPPORTED_LOCALES has exactly 30 entries
 * - LOCALE_NATIVE_NAMES has entries for all supported locales
 * - RTL_LOCALES contains ar and he
 * - All locale configurations are complete and consistent
 *
 * **Validates: Requirements 5.1, 5.3, 10.3**
 */

import { describe, expect, it } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import {
    SUPPORTED_LOCALES,
    LOCALE_NATIVE_NAMES,
    LOCALES,
    DEFAULT_LOCALE,
    RTL_LOCALES,
    type Locale,
} from '../types';
import { isRTLLocale, getLocaleDirection } from '../i18n-config';

// Expected number of supported locales
const EXPECTED_LOCALE_COUNT = 30;

// All expected locale codes
const EXPECTED_LOCALES: Locale[] = [
    // Existing locales (7)
    'en',
    'ro',
    'de',
    'bg',
    'sr',
    'uk',
    'hu',
    // New locales (20)
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
    // Additional new locales (3)
    'zh-CN',
    'ar',
    'he',
];

// Expected RTL locales
const EXPECTED_RTL_LOCALES: Locale[] = ['ar', 'he'];

// Arbitrary for generating supported locale codes
const localeArbitrary = fc.constantFrom(...SUPPORTED_LOCALES);

// Arbitrary for generating RTL locale codes
const rtlLocaleArbitrary = fc.constantFrom(...RTL_LOCALES);

// Arbitrary for generating LTR locale codes (all except RTL)
const ltrLocaleArbitrary = fc.constantFrom(
    ...SUPPORTED_LOCALES.filter((l) => !RTL_LOCALES.includes(l)),
);

describe('Locale Types Property-Based Tests', () => {
    describe('Property 6: Language Names Completeness', () => {
        it('SUPPORTED_LOCALES should have exactly 30 entries', () => {
            expect(SUPPORTED_LOCALES.length).toBe(EXPECTED_LOCALE_COUNT);
        });

        it('SUPPORTED_LOCALES should contain all expected locale codes', () => {
            EXPECTED_LOCALES.forEach((locale) => {
                expect(SUPPORTED_LOCALES).toContain(locale);
            });
        });

        it('LOCALE_NATIVE_NAMES should have entries for all 30 supported locales', () => {
            expect(Object.keys(LOCALE_NATIVE_NAMES).length).toBe(EXPECTED_LOCALE_COUNT);
        });

        it('RTL_LOCALES should contain ar and he', () => {
            expect(RTL_LOCALES).toContain('ar');
            expect(RTL_LOCALES).toContain('he');
            expect(RTL_LOCALES.length).toBe(2);
        });

        test.prop([localeArbitrary], { numRuns: 100 })(
            'every supported locale should have a native name in LOCALE_NATIVE_NAMES',
            (locale) => {
                expect(LOCALE_NATIVE_NAMES[locale]).toBeDefined();
                expect(typeof LOCALE_NATIVE_NAMES[locale]).toBe('string');
                expect(LOCALE_NATIVE_NAMES[locale].length).toBeGreaterThan(0);
            },
        );

        test.prop([localeArbitrary], { numRuns: 100 })(
            'every supported locale should have a complete configuration in LOCALES',
            (locale) => {
                const config = LOCALES[locale];
                expect(config).toBeDefined();
                expect(config.code).toBe(locale);
                expect(typeof config.name).toBe('string');
                expect(config.name.length).toBeGreaterThan(0);
                expect(typeof config.nativeName).toBe('string');
                expect(config.nativeName.length).toBeGreaterThan(0);
                expect(typeof config.flag).toBe('string');
                expect(config.flag.length).toBeGreaterThan(0);
                expect(['ltr', 'rtl']).toContain(config.direction);
            },
        );

        test.prop([localeArbitrary], { numRuns: 100 })(
            'LOCALE_NATIVE_NAMES should match LOCALES nativeName for each locale',
            (locale) => {
                expect(LOCALE_NATIVE_NAMES[locale]).toBe(LOCALES[locale].nativeName);
            },
        );

        it('DEFAULT_LOCALE should be a supported locale', () => {
            expect(SUPPORTED_LOCALES).toContain(DEFAULT_LOCALE);
        });

        it('LOCALES should have entries for all 30 supported locales', () => {
            expect(Object.keys(LOCALES).length).toBe(EXPECTED_LOCALE_COUNT);
        });

        it('all LOCALES entries should be in SUPPORTED_LOCALES', () => {
            Object.keys(LOCALES).forEach((locale) => {
                expect(SUPPORTED_LOCALES).toContain(locale as Locale);
            });
        });

        it('all SUPPORTED_LOCALES should be in LOCALES', () => {
            SUPPORTED_LOCALES.forEach((locale) => {
                expect(LOCALES[locale]).toBeDefined();
            });
        });

        it('SUPPORTED_LOCALES should have no duplicates', () => {
            const uniqueLocales = new Set(SUPPORTED_LOCALES);
            expect(uniqueLocales.size).toBe(SUPPORTED_LOCALES.length);
        });
    });

    /**
     * Property 13: RTL Locale Detection
     *
     * **Feature: multi-language-expansion, Property 13: RTL Locale Detection**
     *
     * This test verifies:
     * - ar and he are correctly identified as RTL
     * - All other locales are correctly identified as LTR
     * - isRTLLocale function works correctly for all locales
     * - getLocaleDirection returns correct direction for all locales
     *
     * **Validates: Requirements 1.5, 13.1, 13.2**
     */
    describe('Property 13: RTL Locale Detection', () => {
        it('RTL_LOCALES should contain exactly ar and he', () => {
            expect(RTL_LOCALES).toEqual(EXPECTED_RTL_LOCALES);
        });

        it('isRTLLocale should return true for Arabic (ar)', () => {
            expect(isRTLLocale('ar')).toBe(true);
        });

        it('isRTLLocale should return true for Hebrew (he)', () => {
            expect(isRTLLocale('he')).toBe(true);
        });

        test.prop([rtlLocaleArbitrary], { numRuns: 100 })(
            'isRTLLocale should return true for all RTL locales',
            (locale) => {
                expect(isRTLLocale(locale)).toBe(true);
            },
        );

        test.prop([ltrLocaleArbitrary], { numRuns: 100 })(
            'isRTLLocale should return false for all LTR locales',
            (locale) => {
                expect(isRTLLocale(locale)).toBe(false);
            },
        );

        test.prop([rtlLocaleArbitrary], { numRuns: 100 })(
            'getLocaleDirection should return "rtl" for RTL locales',
            (locale) => {
                expect(getLocaleDirection(locale)).toBe('rtl');
            },
        );

        test.prop([ltrLocaleArbitrary], { numRuns: 100 })(
            'getLocaleDirection should return "ltr" for LTR locales',
            (locale) => {
                expect(getLocaleDirection(locale)).toBe('ltr');
            },
        );

        test.prop([localeArbitrary], { numRuns: 100 })(
            'LOCALES direction should match isRTLLocale result',
            (locale) => {
                const config = LOCALES[locale];
                const expectedDirection = isRTLLocale(locale) ? 'rtl' : 'ltr';
                expect(config.direction).toBe(expectedDirection);
            },
        );

        it('all RTL locales should be in SUPPORTED_LOCALES', () => {
            RTL_LOCALES.forEach((locale) => {
                expect(SUPPORTED_LOCALES).toContain(locale);
            });
        });

        it('RTL locales in LOCALES should have direction "rtl"', () => {
            RTL_LOCALES.forEach((locale) => {
                expect(LOCALES[locale].direction).toBe('rtl');
            });
        });

        it('non-RTL locales in LOCALES should have direction "ltr"', () => {
            SUPPORTED_LOCALES.filter((l) => !RTL_LOCALES.includes(l)).forEach((locale) => {
                expect(LOCALES[locale].direction).toBe('ltr');
            });
        });
    });
});
