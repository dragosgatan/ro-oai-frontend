/**
 * Language Selector Property-Based Tests
 *
 * Property test for task 11.2: Language Picker Properties
 *
 * **Feature: multi-language-expansion, Property 4: Language Picker Native Name Display**
 * **Feature: multi-language-expansion, Property 5: Language Picker Alphabetical Ordering**
 *
 * This test verifies:
 * - All 30 languages display with their native names
 * - Languages are sorted alphabetically by native name
 * - Native names match LOCALE_NATIVE_NAMES definitions
 *
 * **Validates: Requirements 3.2, 3.3, 5.2**
 */

import { describe, expect, it } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import {
    SUPPORTED_LOCALES,
    LOCALE_NATIVE_NAMES,
    LOCALES,
    type Locale,
    type LocaleConfig,
} from '../../lib/types';
import { sortLocalesByNativeName } from '../language-selector';

// Expected number of supported locales (30 total: 7 existing + 23 new)
const EXPECTED_LOCALE_COUNT = 30;

// Arbitrary for generating supported locale codes
const localeArbitrary = fc.constantFrom(...SUPPORTED_LOCALES);

// Arbitrary for generating pairs of different locales
const localePairArbitrary = fc.tuple(localeArbitrary, localeArbitrary).filter(([a, b]) => a !== b);

describe('Language Selector Property-Based Tests', () => {
    describe('Property 4: Language Picker Native Name Display', () => {
        it('should display all 30 supported languages', () => {
            const localeConfigs = Object.values(LOCALES);
            expect(localeConfigs.length).toBe(EXPECTED_LOCALE_COUNT);
        });

        test.prop([localeArbitrary], { numRuns: 100 })(
            'every locale should have a native name that matches LOCALE_NATIVE_NAMES',
            (locale) => {
                const config = LOCALES[locale];
                expect(config.nativeName).toBe(LOCALE_NATIVE_NAMES[locale]);
            },
        );

        test.prop([localeArbitrary], { numRuns: 100 })(
            'every locale native name should be a non-empty string',
            (locale) => {
                const config = LOCALES[locale];
                expect(typeof config.nativeName).toBe('string');
                expect(config.nativeName.length).toBeGreaterThan(0);
            },
        );

        test.prop([localeArbitrary], { numRuns: 100 })(
            'every locale should have a flag emoji for display',
            (locale) => {
                const config = LOCALES[locale];
                expect(typeof config.flag).toBe('string');
                expect(config.flag.length).toBeGreaterThan(0);
            },
        );

        it('all SUPPORTED_LOCALES should have corresponding LOCALES entries', () => {
            SUPPORTED_LOCALES.forEach((locale) => {
                expect(LOCALES[locale]).toBeDefined();
                expect(LOCALES[locale].nativeName).toBeDefined();
            });
        });
    });

    describe('Property 5: Language Picker Alphabetical Ordering', () => {
        it('sortLocalesByNativeName should return all locales', () => {
            const sorted = sortLocalesByNativeName(Object.values(LOCALES));
            expect(sorted.length).toBe(EXPECTED_LOCALE_COUNT);
        });

        it('sortLocalesByNativeName should preserve all locale codes', () => {
            const original = Object.values(LOCALES);
            const sorted = sortLocalesByNativeName(original);

            const originalCodes = new Set(original.map((l) => l.code));
            const sortedCodes = new Set(sorted.map((l) => l.code));

            expect(sortedCodes).toEqual(originalCodes);
        });

        it('sorted locales should be in ascending alphabetical order by native name', () => {
            const sorted = sortLocalesByNativeName(Object.values(LOCALES));

            for (let i = 0; i < sorted.length - 1; i++) {
                const current = sorted[i].nativeName;
                const next = sorted[i + 1].nativeName;
                const comparison = current.localeCompare(next, undefined, { sensitivity: 'base' });
                expect(comparison).toBeLessThanOrEqual(0);
            }
        });

        test.prop([localePairArbitrary], { numRuns: 100 })(
            'for any two different locales, their relative order should match native name comparison',
            ([localeA, localeB]) => {
                const sorted = sortLocalesByNativeName(Object.values(LOCALES));
                const indexA = sorted.findIndex((l) => l.code === localeA);
                const indexB = sorted.findIndex((l) => l.code === localeB);

                const nativeNameA = LOCALES[localeA].nativeName;
                const nativeNameB = LOCALES[localeB].nativeName;
                const comparison = nativeNameA.localeCompare(nativeNameB, undefined, {
                    sensitivity: 'base',
                });

                if (comparison < 0) {
                    expect(indexA).toBeLessThan(indexB);
                } else if (comparison > 0) {
                    expect(indexA).toBeGreaterThan(indexB);
                }
                // If comparison === 0, order doesn't matter (equal native names)
            },
        );

        it('sortLocalesByNativeName should not mutate the original array', () => {
            const original = Object.values(LOCALES);
            const originalCopy = [...original];
            sortLocalesByNativeName(original);

            expect(original).toEqual(originalCopy);
        });

        it('sortLocalesByNativeName should be idempotent', () => {
            const original = Object.values(LOCALES);
            const sortedOnce = sortLocalesByNativeName(original);
            const sortedTwice = sortLocalesByNativeName(sortedOnce);

            expect(sortedOnce.map((l) => l.code)).toEqual(sortedTwice.map((l) => l.code));
        });

        test.prop([fc.array(localeArbitrary, { minLength: 1, maxLength: 30 })], { numRuns: 100 })(
            'sorting any subset of locales should maintain alphabetical order',
            (locales) => {
                const uniqueLocales = [...new Set(locales)];
                const configs = uniqueLocales.map((l) => LOCALES[l]);
                const sorted = sortLocalesByNativeName(configs);

                for (let i = 0; i < sorted.length - 1; i++) {
                    const current = sorted[i].nativeName;
                    const next = sorted[i + 1].nativeName;
                    const comparison = current.localeCompare(next, undefined, {
                        sensitivity: 'base',
                    });
                    expect(comparison).toBeLessThanOrEqual(0);
                }
            },
        );
    });

    describe('Integration: Language Picker Display', () => {
        it('should have exactly 30 languages available for display', () => {
            const sorted = sortLocalesByNativeName(Object.values(LOCALES));
            expect(sorted.length).toBe(30);
        });

        it('each language should have all required display properties', () => {
            const sorted = sortLocalesByNativeName(Object.values(LOCALES));

            sorted.forEach((config) => {
                expect(config.code).toBeDefined();
                expect(config.nativeName).toBeDefined();
                expect(config.flag).toBeDefined();
                expect(config.name).toBeDefined();
            });
        });

        it('first and last languages in sorted order should be correct', () => {
            const sorted = sortLocalesByNativeName(Object.values(LOCALES));

            // Verify the list is sorted - first should come before last alphabetically
            const first = sorted[0].nativeName;
            const last = sorted[sorted.length - 1].nativeName;
            const comparison = first.localeCompare(last, undefined, { sensitivity: 'base' });
            expect(comparison).toBeLessThanOrEqual(0);
        });
    });
});
