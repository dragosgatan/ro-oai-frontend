/**
 * Property-Based Tests for Problem Translation Resolution
 *
 * These tests use fast-check to verify correctness properties across
 * all possible inputs, ensuring the translation resolution logic is robust.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    getProblemContent,
    TranslatableProblem,
    hasCompleteTranslation,
    hasAnyTranslation,
    getTranslationStatus,
} from './problem-translations';
import { Locale, SUPPORTED_LOCALES } from './types';

/**
 * Arbitrary generator for TranslatableProblem objects with all 7 languages
 * Generates problems with various combinations of translations
 */
const arbitraryProblem = (): fc.Arbitrary<TranslatableProblem> => {
    return fc.record({
        // Romanian (required)
        title: fc.string({ minLength: 1 }),
        shortDescription: fc.string({ minLength: 1 }),
        longDescription: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        // English
        titleEn: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        shortDescriptionEn: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        longDescriptionEn: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        // German
        titleDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        shortDescriptionDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        longDescriptionDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        // Bulgarian
        titleBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        shortDescriptionBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        longDescriptionBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        // Serbian
        titleSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        shortDescriptionSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        longDescriptionSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        // Ukrainian
        titleUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        shortDescriptionUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        longDescriptionUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        // Hungarian
        titleHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        shortDescriptionHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        longDescriptionHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
    });
};

/**
 * Arbitrary generator for all supported Locale values
 */
const arbitraryLocale = (): fc.Arbitrary<Locale> => {
    return fc.constantFrom(...SUPPORTED_LOCALES);
};

/**
 * Helper to get translation field from problem by locale
 */
function getFieldByLocale(
    problem: TranslatableProblem,
    locale: Locale,
    field: 'title' | 'shortDescription' | 'longDescription',
): string | null | undefined {
    if (locale === 'ro') {
        return problem[field];
    }
    const capitalizedLocale = locale.charAt(0).toUpperCase() + locale.slice(1);
    const key = `${field}${capitalizedLocale}` as keyof TranslatableProblem;
    return problem[key] as string | null | undefined;
}

/**
 * Helper to check if a value is non-empty
 */
function isNonEmpty(value: string | null | undefined): value is string {
    return value !== null && value !== undefined && value !== '';
}

describe('Problem Translation Resolution - Property-Based Tests', () => {
    /**
     * Feature: multi-language-support, Property 3: Translation Fallback Chain
     * Validates: Requirements 1.5, 6.1, 6.2, 6.3, 9.1
     *
     * Property: For any problem and any supported locale, the translation resolver SHALL:
     * - Return the target locale's translation if it exists and is non-empty
     * - Otherwise return the English translation if it exists and is non-empty
     * - Otherwise return the Romanian content (which always exists)
     */
    describe('Property 3: Translation Fallback Chain', () => {
        it('should return target locale translation when it exists and is non-empty', () => {
            fc.assert(
                fc.property(arbitraryProblem(), arbitraryLocale(), (problem, locale) => {
                    const content = getProblemContent(problem, locale);

                    // For each field, verify the fallback chain
                    const fields: ('title' | 'shortDescription' | 'longDescription')[] = [
                        'title',
                        'shortDescription',
                        'longDescription',
                    ];

                    for (const field of fields) {
                        const targetValue = getFieldByLocale(problem, locale, field);
                        const enValue = getFieldByLocale(problem, 'en', field);
                        const roValue = getFieldByLocale(problem, 'ro', field);

                        const resolvedValue = content[field];

                        if (locale === 'ro') {
                            // Romanian locale always returns Romanian content
                            expect(resolvedValue).toBe(roValue || '');
                        } else if (isNonEmpty(targetValue)) {
                            // Target locale has value - should return it
                            expect(resolvedValue).toBe(targetValue);
                        } else if (locale !== 'en' && isNonEmpty(enValue)) {
                            // Fallback to English
                            expect(resolvedValue).toBe(enValue);
                        } else {
                            // Final fallback to Romanian
                            expect(resolvedValue).toBe(roValue || '');
                        }
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should never throw errors when resolving content for any locale', () => {
            fc.assert(
                fc.property(arbitraryProblem(), arbitraryLocale(), (problem, locale) => {
                    expect(() => getProblemContent(problem, locale)).not.toThrow();
                }),
                { numRuns: 100 },
            );
        });

        it('should always return defined string content fields for any locale', () => {
            fc.assert(
                fc.property(arbitraryProblem(), arbitraryLocale(), (problem, locale) => {
                    const content = getProblemContent(problem, locale);

                    // All fields should be defined strings
                    expect(content.title).toBeDefined();
                    expect(content.shortDescription).toBeDefined();
                    expect(content.longDescription).toBeDefined();
                    expect(typeof content.title).toBe('string');
                    expect(typeof content.shortDescription).toBe('string');
                    expect(typeof content.longDescription).toBe('string');
                }),
                { numRuns: 100 },
            );
        });

        it('should always return Romanian content when locale is ro', () => {
            fc.assert(
                fc.property(arbitraryProblem(), (problem) => {
                    const content = getProblemContent(problem, 'ro');

                    // Should always return Romanian content
                    expect(content.title).toBe(problem.title);
                    expect(content.shortDescription).toBe(problem.shortDescription);
                    expect(content.longDescription).toBe(problem.longDescription || '');
                }),
                { numRuns: 100 },
            );
        });

        it('should fallback to English when target locale translation is missing (non-ro, non-en)', () => {
            // Test with German locale but only English translations available
            fc.assert(
                fc.property(
                    fc.record({
                        title: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        longDescription: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                        titleEn: fc.string({ minLength: 1 }),
                        shortDescriptionEn: fc.string({ minLength: 1 }),
                        longDescriptionEn: fc.string({ minLength: 1 }),
                        // All other languages null
                        titleDe: fc.constant(null),
                        shortDescriptionDe: fc.constant(null),
                        longDescriptionDe: fc.constant(null),
                        titleBg: fc.constant(null),
                        shortDescriptionBg: fc.constant(null),
                        longDescriptionBg: fc.constant(null),
                        titleSr: fc.constant(null),
                        shortDescriptionSr: fc.constant(null),
                        longDescriptionSr: fc.constant(null),
                        titleUk: fc.constant(null),
                        shortDescriptionUk: fc.constant(null),
                        longDescriptionUk: fc.constant(null),
                        titleHu: fc.constant(null),
                        shortDescriptionHu: fc.constant(null),
                        longDescriptionHu: fc.constant(null),
                    }),
                    fc.constantFrom(
                        'de' as Locale,
                        'bg' as Locale,
                        'sr' as Locale,
                        'uk' as Locale,
                        'hu' as Locale,
                    ),
                    (problem, locale) => {
                        const content = getProblemContent(problem, locale);

                        // Should fallback to English
                        expect(content.title).toBe(problem.titleEn);
                        expect(content.shortDescription).toBe(problem.shortDescriptionEn);
                        expect(content.longDescription).toBe(problem.longDescriptionEn);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should fallback to Romanian when both target and English translations are missing', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        title: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        longDescription: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                        // All translations null
                        titleEn: fc.constant(null),
                        shortDescriptionEn: fc.constant(null),
                        longDescriptionEn: fc.constant(null),
                        titleDe: fc.constant(null),
                        shortDescriptionDe: fc.constant(null),
                        longDescriptionDe: fc.constant(null),
                        titleBg: fc.constant(null),
                        shortDescriptionBg: fc.constant(null),
                        longDescriptionBg: fc.constant(null),
                        titleSr: fc.constant(null),
                        shortDescriptionSr: fc.constant(null),
                        longDescriptionSr: fc.constant(null),
                        titleUk: fc.constant(null),
                        shortDescriptionUk: fc.constant(null),
                        longDescriptionUk: fc.constant(null),
                        titleHu: fc.constant(null),
                        shortDescriptionHu: fc.constant(null),
                        longDescriptionHu: fc.constant(null),
                    }),
                    arbitraryLocale(),
                    (problem, locale) => {
                        const content = getProblemContent(problem, locale);

                        // Should fallback to Romanian for all locales
                        expect(content.title).toBe(problem.title);
                        expect(content.shortDescription).toBe(problem.shortDescription);
                        expect(content.longDescription).toBe(problem.longDescription || '');
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should handle partial translations with correct fallback per field', () => {
            // Test where some fields have target translation, some have English, some only Romanian
            fc.assert(
                fc.property(
                    fc.record({
                        title: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        longDescription: fc.string({ minLength: 1 }),
                        // English has only shortDescription
                        titleEn: fc.constant(null),
                        shortDescriptionEn: fc.string({ minLength: 1 }),
                        longDescriptionEn: fc.constant(null),
                        // German has only title
                        titleDe: fc.string({ minLength: 1 }),
                        shortDescriptionDe: fc.constant(null),
                        longDescriptionDe: fc.constant(null),
                        // Others null
                        titleBg: fc.constant(null),
                        shortDescriptionBg: fc.constant(null),
                        longDescriptionBg: fc.constant(null),
                        titleSr: fc.constant(null),
                        shortDescriptionSr: fc.constant(null),
                        longDescriptionSr: fc.constant(null),
                        titleUk: fc.constant(null),
                        shortDescriptionUk: fc.constant(null),
                        longDescriptionUk: fc.constant(null),
                        titleHu: fc.constant(null),
                        shortDescriptionHu: fc.constant(null),
                        longDescriptionHu: fc.constant(null),
                    }),
                    (problem) => {
                        const content = getProblemContent(problem, 'de');

                        // Title: German exists -> use German
                        expect(content.title).toBe(problem.titleDe);
                        // ShortDescription: German null, English exists -> use English
                        expect(content.shortDescription).toBe(problem.shortDescriptionEn);
                        // LongDescription: German null, English null -> use Romanian
                        expect(content.longDescription).toBe(problem.longDescription);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should return English translation directly when locale is en and translation exists', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        title: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        longDescription: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                        titleEn: fc.string({ minLength: 1 }),
                        shortDescriptionEn: fc.string({ minLength: 1 }),
                        longDescriptionEn: fc.string({ minLength: 1 }),
                        titleDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        longDescriptionDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        titleBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        longDescriptionBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        titleSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        longDescriptionSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        titleUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        longDescriptionUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        titleHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        longDescriptionHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                    }),
                    (problem) => {
                        const content = getProblemContent(problem, 'en');

                        // Should return English translations
                        expect(content.title).toBe(problem.titleEn);
                        expect(content.shortDescription).toBe(problem.shortDescriptionEn);
                        expect(content.longDescription).toBe(problem.longDescriptionEn);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should handle empty string translations as missing (fallback)', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        title: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        longDescription: fc.string({ minLength: 1 }),
                        // English with empty strings
                        titleEn: fc.constant(''),
                        shortDescriptionEn: fc.constant(''),
                        longDescriptionEn: fc.constant(''),
                        titleDe: fc.constant(null),
                        shortDescriptionDe: fc.constant(null),
                        longDescriptionDe: fc.constant(null),
                        titleBg: fc.constant(null),
                        shortDescriptionBg: fc.constant(null),
                        longDescriptionBg: fc.constant(null),
                        titleSr: fc.constant(null),
                        shortDescriptionSr: fc.constant(null),
                        longDescriptionSr: fc.constant(null),
                        titleUk: fc.constant(null),
                        shortDescriptionUk: fc.constant(null),
                        longDescriptionUk: fc.constant(null),
                        titleHu: fc.constant(null),
                        shortDescriptionHu: fc.constant(null),
                        longDescriptionHu: fc.constant(null),
                    }),
                    (problem) => {
                        const content = getProblemContent(problem, 'en');

                        // Empty strings should be treated as missing, fallback to Romanian
                        expect(content.title).toBe(problem.title);
                        expect(content.shortDescription).toBe(problem.shortDescription);
                        expect(content.longDescription).toBe(problem.longDescription);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    /**
     * Feature: multi-language-support, Property: Translation Status Helpers
     * Additional tests for helper functions
     */
    describe('Translation Status Helper Functions', () => {
        it('hasCompleteTranslation should return true only when all 3 fields are non-empty', () => {
            fc.assert(
                fc.property(arbitraryProblem(), arbitraryLocale(), (problem, locale) => {
                    const result = hasCompleteTranslation(problem, locale);

                    const title = getFieldByLocale(problem, locale, 'title');
                    const shortDesc = getFieldByLocale(problem, locale, 'shortDescription');
                    const longDesc = getFieldByLocale(problem, locale, 'longDescription');

                    const expected =
                        isNonEmpty(title) && isNonEmpty(shortDesc) && isNonEmpty(longDesc);
                    expect(result).toBe(expected);
                }),
                { numRuns: 100 },
            );
        });

        it('hasAnyTranslation should return true when at least one field is non-empty', () => {
            fc.assert(
                fc.property(arbitraryProblem(), arbitraryLocale(), (problem, locale) => {
                    const result = hasAnyTranslation(problem, locale);

                    const title = getFieldByLocale(problem, locale, 'title');
                    const shortDesc = getFieldByLocale(problem, locale, 'shortDescription');
                    const longDesc = getFieldByLocale(problem, locale, 'longDescription');

                    const expected =
                        isNonEmpty(title) || isNonEmpty(shortDesc) || isNonEmpty(longDesc);
                    expect(result).toBe(expected);
                }),
                { numRuns: 100 },
            );
        });

        it('getTranslationStatus should return correct status based on field completeness', () => {
            fc.assert(
                fc.property(arbitraryProblem(), arbitraryLocale(), (problem, locale) => {
                    const status = getTranslationStatus(problem, locale);

                    if (hasCompleteTranslation(problem, locale)) {
                        expect(status).toBe('complete');
                    } else if (hasAnyTranslation(problem, locale)) {
                        expect(status).toBe('partial');
                    } else {
                        expect(status).toBe('none');
                    }
                }),
                { numRuns: 100 },
            );
        });
    });
});
