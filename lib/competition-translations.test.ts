/**
 * Property-Based Tests for Competition Translation Resolution
 *
 * These tests use fast-check to verify correctness properties across
 * all possible inputs, ensuring the translation resolution logic is robust.
 *
 * Feature: auto-translate-competitions
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    getCompetitionContent,
    TranslatableCompetition,
    hasCompleteCompetitionTranslation,
    hasAnyCompetitionTranslation,
    getCompetitionTranslationStatus,
} from './competition-translations';
import { Locale, SUPPORTED_LOCALES } from './types';

/**
 * Arbitrary generator for TranslatableCompetition objects with all 7 languages
 * Generates competitions with various combinations of translations
 */
const arbitraryCompetition = (): fc.Arbitrary<TranslatableCompetition> => {
    return fc.record({
        // Romanian (required)
        name: fc.string({ minLength: 1 }),
        shortDescription: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        description: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        rules: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        // English
        nameEn: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        shortDescriptionEn: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        descriptionEn: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        rulesEn: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        // German
        nameDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        shortDescriptionDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        descriptionDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        rulesDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        // Bulgarian
        nameBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        shortDescriptionBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        descriptionBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        rulesBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        // Serbian
        nameSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        shortDescriptionSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        descriptionSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        rulesSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        // Ukrainian
        nameUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        shortDescriptionUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        descriptionUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        rulesUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        // Hungarian
        nameHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        shortDescriptionHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        descriptionHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
        rulesHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
    });
};

/**
 * Arbitrary generator for all supported Locale values
 */
const arbitraryLocale = (): fc.Arbitrary<Locale> => {
    return fc.constantFrom(...SUPPORTED_LOCALES);
};

/**
 * Helper to get translation field from competition by locale
 */
function getFieldByLocale(
    competition: TranslatableCompetition,
    locale: Locale,
    field: 'name' | 'shortDescription' | 'description' | 'rules',
): string | null | undefined {
    if (locale === 'ro') {
        return competition[field];
    }
    const capitalizedLocale = locale.charAt(0).toUpperCase() + locale.slice(1);
    const key = `${field}${capitalizedLocale}` as keyof TranslatableCompetition;
    return competition[key] as string | null | undefined;
}

/**
 * Helper to check if a value is non-empty
 */
function isNonEmpty(value: string | null | undefined): value is string {
    return value !== null && value !== undefined && value !== '';
}

describe('Competition Translation Resolution - Property-Based Tests', () => {
    /**
     * Feature: auto-translate-competitions, Property 7: Fallback Chain Resolution
     * Validates: Requirements 9.1, 9.2, 9.3, 13.1, 13.4
     *
     * Property: For any competition and any supported locale, the translation resolver SHALL:
     * - Return the target locale's translation if it exists and is non-empty
     * - Otherwise return the English translation if it exists and is non-empty
     * - Otherwise return the Romanian content (which always exists)
     * - Never return empty strings when Romanian content exists
     */
    describe('Property 7: Fallback Chain Resolution', () => {
        it('should return target locale translation when it exists and is non-empty', () => {
            fc.assert(
                fc.property(arbitraryCompetition(), arbitraryLocale(), (competition, locale) => {
                    const content = getCompetitionContent(competition, locale);

                    // For each field, verify the fallback chain
                    const fields: ('name' | 'shortDescription' | 'description' | 'rules')[] = [
                        'name',
                        'shortDescription',
                        'description',
                        'rules',
                    ];

                    for (const field of fields) {
                        const targetValue = getFieldByLocale(competition, locale, field);
                        const enValue = getFieldByLocale(competition, 'en', field);
                        const roValue = getFieldByLocale(competition, 'ro', field);

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
                fc.property(arbitraryCompetition(), arbitraryLocale(), (competition, locale) => {
                    expect(() => getCompetitionContent(competition, locale)).not.toThrow();
                }),
                { numRuns: 100 },
            );
        });

        it('should always return defined string content fields for any locale', () => {
            fc.assert(
                fc.property(arbitraryCompetition(), arbitraryLocale(), (competition, locale) => {
                    const content = getCompetitionContent(competition, locale);

                    // All fields should be defined strings
                    expect(content.name).toBeDefined();
                    expect(content.shortDescription).toBeDefined();
                    expect(content.description).toBeDefined();
                    expect(content.rules).toBeDefined();
                    expect(typeof content.name).toBe('string');
                    expect(typeof content.shortDescription).toBe('string');
                    expect(typeof content.description).toBe('string');
                    expect(typeof content.rules).toBe('string');
                }),
                { numRuns: 100 },
            );
        });

        it('should always return Romanian content when locale is ro', () => {
            fc.assert(
                fc.property(arbitraryCompetition(), (competition) => {
                    const content = getCompetitionContent(competition, 'ro');

                    // Should always return Romanian content
                    expect(content.name).toBe(competition.name);
                    expect(content.shortDescription).toBe(competition.shortDescription || '');
                    expect(content.description).toBe(competition.description || '');
                    expect(content.rules).toBe(competition.rules || '');
                }),
                { numRuns: 100 },
            );
        });

        it('should fallback to English when target locale translation is missing (non-ro, non-en)', () => {
            // Test with German locale but only English translations available
            fc.assert(
                fc.property(
                    fc.record({
                        name: fc.string({ minLength: 1 }),
                        shortDescription: fc.option(fc.string({ minLength: 1 }), {
                            nil: undefined,
                        }),
                        description: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                        rules: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                        nameEn: fc.string({ minLength: 1 }),
                        shortDescriptionEn: fc.string({ minLength: 1 }),
                        descriptionEn: fc.string({ minLength: 1 }),
                        rulesEn: fc.string({ minLength: 1 }),
                        // All other languages null
                        nameDe: fc.constant(null),
                        shortDescriptionDe: fc.constant(null),
                        descriptionDe: fc.constant(null),
                        rulesDe: fc.constant(null),
                        nameBg: fc.constant(null),
                        shortDescriptionBg: fc.constant(null),
                        descriptionBg: fc.constant(null),
                        rulesBg: fc.constant(null),
                        nameSr: fc.constant(null),
                        shortDescriptionSr: fc.constant(null),
                        descriptionSr: fc.constant(null),
                        rulesSr: fc.constant(null),
                        nameUk: fc.constant(null),
                        shortDescriptionUk: fc.constant(null),
                        descriptionUk: fc.constant(null),
                        rulesUk: fc.constant(null),
                        nameHu: fc.constant(null),
                        shortDescriptionHu: fc.constant(null),
                        descriptionHu: fc.constant(null),
                        rulesHu: fc.constant(null),
                    }),
                    fc.constantFrom(
                        'de' as Locale,
                        'bg' as Locale,
                        'sr' as Locale,
                        'uk' as Locale,
                        'hu' as Locale,
                    ),
                    (competition, locale) => {
                        const content = getCompetitionContent(competition, locale);

                        // Should fallback to English
                        expect(content.name).toBe(competition.nameEn);
                        expect(content.shortDescription).toBe(competition.shortDescriptionEn);
                        expect(content.description).toBe(competition.descriptionEn);
                        expect(content.rules).toBe(competition.rulesEn);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should fallback to Romanian when both target and English translations are missing', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        name: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        description: fc.string({ minLength: 1 }),
                        rules: fc.string({ minLength: 1 }),
                        // All translations null
                        nameEn: fc.constant(null),
                        shortDescriptionEn: fc.constant(null),
                        descriptionEn: fc.constant(null),
                        rulesEn: fc.constant(null),
                        nameDe: fc.constant(null),
                        shortDescriptionDe: fc.constant(null),
                        descriptionDe: fc.constant(null),
                        rulesDe: fc.constant(null),
                        nameBg: fc.constant(null),
                        shortDescriptionBg: fc.constant(null),
                        descriptionBg: fc.constant(null),
                        rulesBg: fc.constant(null),
                        nameSr: fc.constant(null),
                        shortDescriptionSr: fc.constant(null),
                        descriptionSr: fc.constant(null),
                        rulesSr: fc.constant(null),
                        nameUk: fc.constant(null),
                        shortDescriptionUk: fc.constant(null),
                        descriptionUk: fc.constant(null),
                        rulesUk: fc.constant(null),
                        nameHu: fc.constant(null),
                        shortDescriptionHu: fc.constant(null),
                        descriptionHu: fc.constant(null),
                        rulesHu: fc.constant(null),
                    }),
                    arbitraryLocale(),
                    (competition, locale) => {
                        const content = getCompetitionContent(competition, locale);

                        // Should fallback to Romanian for all locales
                        expect(content.name).toBe(competition.name);
                        expect(content.shortDescription).toBe(competition.shortDescription);
                        expect(content.description).toBe(competition.description);
                        expect(content.rules).toBe(competition.rules);
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
                        name: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        description: fc.string({ minLength: 1 }),
                        rules: fc.string({ minLength: 1 }),
                        // English has only shortDescription and rules
                        nameEn: fc.constant(null),
                        shortDescriptionEn: fc.string({ minLength: 1 }),
                        descriptionEn: fc.constant(null),
                        rulesEn: fc.string({ minLength: 1 }),
                        // German has only name and description
                        nameDe: fc.string({ minLength: 1 }),
                        shortDescriptionDe: fc.constant(null),
                        descriptionDe: fc.string({ minLength: 1 }),
                        rulesDe: fc.constant(null),
                        // Others null
                        nameBg: fc.constant(null),
                        shortDescriptionBg: fc.constant(null),
                        descriptionBg: fc.constant(null),
                        rulesBg: fc.constant(null),
                        nameSr: fc.constant(null),
                        shortDescriptionSr: fc.constant(null),
                        descriptionSr: fc.constant(null),
                        rulesSr: fc.constant(null),
                        nameUk: fc.constant(null),
                        shortDescriptionUk: fc.constant(null),
                        descriptionUk: fc.constant(null),
                        rulesUk: fc.constant(null),
                        nameHu: fc.constant(null),
                        shortDescriptionHu: fc.constant(null),
                        descriptionHu: fc.constant(null),
                        rulesHu: fc.constant(null),
                    }),
                    (competition) => {
                        const content = getCompetitionContent(competition, 'de');

                        // Name: German exists -> use German
                        expect(content.name).toBe(competition.nameDe);
                        // ShortDescription: German null, English exists -> use English
                        expect(content.shortDescription).toBe(competition.shortDescriptionEn);
                        // Description: German exists -> use German
                        expect(content.description).toBe(competition.descriptionDe);
                        // Rules: German null, English exists -> use English
                        expect(content.rules).toBe(competition.rulesEn);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should return English translation directly when locale is en and translation exists', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        name: fc.string({ minLength: 1 }),
                        shortDescription: fc.option(fc.string({ minLength: 1 }), {
                            nil: undefined,
                        }),
                        description: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                        rules: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                        nameEn: fc.string({ minLength: 1 }),
                        shortDescriptionEn: fc.string({ minLength: 1 }),
                        descriptionEn: fc.string({ minLength: 1 }),
                        rulesEn: fc.string({ minLength: 1 }),
                        nameDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        descriptionDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        rulesDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        nameBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        descriptionBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        rulesBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        nameSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        descriptionSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        rulesSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        nameUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        descriptionUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        rulesUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        nameHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        descriptionHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        rulesHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                    }),
                    (competition) => {
                        const content = getCompetitionContent(competition, 'en');

                        // Should return English translations
                        expect(content.name).toBe(competition.nameEn);
                        expect(content.shortDescription).toBe(competition.shortDescriptionEn);
                        expect(content.description).toBe(competition.descriptionEn);
                        expect(content.rules).toBe(competition.rulesEn);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should handle empty string translations as missing (fallback)', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        name: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        description: fc.string({ minLength: 1 }),
                        rules: fc.string({ minLength: 1 }),
                        // English with empty strings
                        nameEn: fc.constant(''),
                        shortDescriptionEn: fc.constant(''),
                        descriptionEn: fc.constant(''),
                        rulesEn: fc.constant(''),
                        nameDe: fc.constant(null),
                        shortDescriptionDe: fc.constant(null),
                        descriptionDe: fc.constant(null),
                        rulesDe: fc.constant(null),
                        nameBg: fc.constant(null),
                        shortDescriptionBg: fc.constant(null),
                        descriptionBg: fc.constant(null),
                        rulesBg: fc.constant(null),
                        nameSr: fc.constant(null),
                        shortDescriptionSr: fc.constant(null),
                        descriptionSr: fc.constant(null),
                        rulesSr: fc.constant(null),
                        nameUk: fc.constant(null),
                        shortDescriptionUk: fc.constant(null),
                        descriptionUk: fc.constant(null),
                        rulesUk: fc.constant(null),
                        nameHu: fc.constant(null),
                        shortDescriptionHu: fc.constant(null),
                        descriptionHu: fc.constant(null),
                        rulesHu: fc.constant(null),
                    }),
                    (competition) => {
                        const content = getCompetitionContent(competition, 'en');

                        // Empty strings should be treated as missing, fallback to Romanian
                        expect(content.name).toBe(competition.name);
                        expect(content.shortDescription).toBe(competition.shortDescription);
                        expect(content.description).toBe(competition.description);
                        expect(content.rules).toBe(competition.rules);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should never return empty strings when Romanian content exists', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        name: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        description: fc.string({ minLength: 1 }),
                        rules: fc.string({ minLength: 1 }),
                        // Random translations
                        nameEn: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionEn: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        descriptionEn: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        rulesEn: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        nameDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        descriptionDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        rulesDe: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        nameBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        descriptionBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        rulesBg: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        nameSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        descriptionSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        rulesSr: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        nameUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        descriptionUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        rulesUk: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        nameHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        shortDescriptionHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        descriptionHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                        rulesHu: fc.option(fc.string({ minLength: 1 }), { nil: null }),
                    }),
                    arbitraryLocale(),
                    (competition, locale) => {
                        const content = getCompetitionContent(competition, locale);

                        // When Romanian content exists, resolved content should never be empty
                        expect(content.name.length).toBeGreaterThan(0);
                        expect(content.shortDescription.length).toBeGreaterThan(0);
                        expect(content.description.length).toBeGreaterThan(0);
                        expect(content.rules.length).toBeGreaterThan(0);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    /**
     * Feature: auto-translate-competitions, Property 8: Translation Status Calculation
     * Validates: Requirements 2.4, 10.2
     *
     * Property: For any competition with any combination of translation fields, the translation
     * status calculation SHALL correctly report:
     * - "complete" when all 4 fields (name, shortDescription, description, rules) are non-empty
     * - "partial" when at least 1 but fewer than 4 fields are non-empty
     * - "none" when all fields are empty or null
     */
    describe('Property 8: Translation Status Calculation', () => {
        it('hasCompleteCompetitionTranslation should return true only when all 4 fields are non-empty', () => {
            fc.assert(
                fc.property(arbitraryCompetition(), arbitraryLocale(), (competition, locale) => {
                    const result = hasCompleteCompetitionTranslation(competition, locale);

                    const name = getFieldByLocale(competition, locale, 'name');
                    const shortDesc = getFieldByLocale(competition, locale, 'shortDescription');
                    const desc = getFieldByLocale(competition, locale, 'description');
                    const rules = getFieldByLocale(competition, locale, 'rules');

                    const expected =
                        isNonEmpty(name) &&
                        isNonEmpty(shortDesc) &&
                        isNonEmpty(desc) &&
                        isNonEmpty(rules);
                    expect(result).toBe(expected);
                }),
                { numRuns: 100 },
            );
        });

        it('hasAnyCompetitionTranslation should return true when at least one field is non-empty', () => {
            fc.assert(
                fc.property(arbitraryCompetition(), arbitraryLocale(), (competition, locale) => {
                    const result = hasAnyCompetitionTranslation(competition, locale);

                    const name = getFieldByLocale(competition, locale, 'name');
                    const shortDesc = getFieldByLocale(competition, locale, 'shortDescription');
                    const desc = getFieldByLocale(competition, locale, 'description');
                    const rules = getFieldByLocale(competition, locale, 'rules');

                    const expected =
                        isNonEmpty(name) ||
                        isNonEmpty(shortDesc) ||
                        isNonEmpty(desc) ||
                        isNonEmpty(rules);
                    expect(result).toBe(expected);
                }),
                { numRuns: 100 },
            );
        });

        it('getCompetitionTranslationStatus should return correct status based on field completeness', () => {
            fc.assert(
                fc.property(arbitraryCompetition(), arbitraryLocale(), (competition, locale) => {
                    const status = getCompetitionTranslationStatus(competition, locale);

                    if (hasCompleteCompetitionTranslation(competition, locale)) {
                        expect(status).toBe('complete');
                    } else if (hasAnyCompetitionTranslation(competition, locale)) {
                        expect(status).toBe('partial');
                    } else {
                        expect(status).toBe('none');
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should return "complete" when all 4 fields are present', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        name: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        description: fc.string({ minLength: 1 }),
                        rules: fc.string({ minLength: 1 }),
                        // English with all fields
                        nameEn: fc.string({ minLength: 1 }),
                        shortDescriptionEn: fc.string({ minLength: 1 }),
                        descriptionEn: fc.string({ minLength: 1 }),
                        rulesEn: fc.string({ minLength: 1 }),
                        // Others null
                        nameDe: fc.constant(null),
                        shortDescriptionDe: fc.constant(null),
                        descriptionDe: fc.constant(null),
                        rulesDe: fc.constant(null),
                        nameBg: fc.constant(null),
                        shortDescriptionBg: fc.constant(null),
                        descriptionBg: fc.constant(null),
                        rulesBg: fc.constant(null),
                        nameSr: fc.constant(null),
                        shortDescriptionSr: fc.constant(null),
                        descriptionSr: fc.constant(null),
                        rulesSr: fc.constant(null),
                        nameUk: fc.constant(null),
                        shortDescriptionUk: fc.constant(null),
                        descriptionUk: fc.constant(null),
                        rulesUk: fc.constant(null),
                        nameHu: fc.constant(null),
                        shortDescriptionHu: fc.constant(null),
                        descriptionHu: fc.constant(null),
                        rulesHu: fc.constant(null),
                    }),
                    (competition) => {
                        expect(getCompetitionTranslationStatus(competition, 'en')).toBe('complete');
                        expect(getCompetitionTranslationStatus(competition, 'ro')).toBe('complete');
                        expect(getCompetitionTranslationStatus(competition, 'de')).toBe('none');
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should return "partial" when some but not all fields are present', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        name: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        description: fc.string({ minLength: 1 }),
                        rules: fc.string({ minLength: 1 }),
                        // English with only some fields
                        nameEn: fc.string({ minLength: 1 }),
                        shortDescriptionEn: fc.constant(null),
                        descriptionEn: fc.string({ minLength: 1 }),
                        rulesEn: fc.constant(null),
                        // Others null
                        nameDe: fc.constant(null),
                        shortDescriptionDe: fc.constant(null),
                        descriptionDe: fc.constant(null),
                        rulesDe: fc.constant(null),
                        nameBg: fc.constant(null),
                        shortDescriptionBg: fc.constant(null),
                        descriptionBg: fc.constant(null),
                        rulesBg: fc.constant(null),
                        nameSr: fc.constant(null),
                        shortDescriptionSr: fc.constant(null),
                        descriptionSr: fc.constant(null),
                        rulesSr: fc.constant(null),
                        nameUk: fc.constant(null),
                        shortDescriptionUk: fc.constant(null),
                        descriptionUk: fc.constant(null),
                        rulesUk: fc.constant(null),
                        nameHu: fc.constant(null),
                        shortDescriptionHu: fc.constant(null),
                        descriptionHu: fc.constant(null),
                        rulesHu: fc.constant(null),
                    }),
                    (competition) => {
                        expect(getCompetitionTranslationStatus(competition, 'en')).toBe('partial');
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should return "none" when no fields are present', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        name: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        description: fc.string({ minLength: 1 }),
                        rules: fc.string({ minLength: 1 }),
                        // All translations null
                        nameEn: fc.constant(null),
                        shortDescriptionEn: fc.constant(null),
                        descriptionEn: fc.constant(null),
                        rulesEn: fc.constant(null),
                        nameDe: fc.constant(null),
                        shortDescriptionDe: fc.constant(null),
                        descriptionDe: fc.constant(null),
                        rulesDe: fc.constant(null),
                        nameBg: fc.constant(null),
                        shortDescriptionBg: fc.constant(null),
                        descriptionBg: fc.constant(null),
                        rulesBg: fc.constant(null),
                        nameSr: fc.constant(null),
                        shortDescriptionSr: fc.constant(null),
                        descriptionSr: fc.constant(null),
                        rulesSr: fc.constant(null),
                        nameUk: fc.constant(null),
                        shortDescriptionUk: fc.constant(null),
                        descriptionUk: fc.constant(null),
                        rulesUk: fc.constant(null),
                        nameHu: fc.constant(null),
                        shortDescriptionHu: fc.constant(null),
                        descriptionHu: fc.constant(null),
                        rulesHu: fc.constant(null),
                    }),
                    (competition) => {
                        expect(getCompetitionTranslationStatus(competition, 'en')).toBe('none');
                        expect(getCompetitionTranslationStatus(competition, 'de')).toBe('none');
                        expect(getCompetitionTranslationStatus(competition, 'bg')).toBe('none');
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should handle empty strings as missing fields', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        name: fc.string({ minLength: 1 }),
                        shortDescription: fc.string({ minLength: 1 }),
                        description: fc.string({ minLength: 1 }),
                        rules: fc.string({ minLength: 1 }),
                        // English with empty strings
                        nameEn: fc.constant(''),
                        shortDescriptionEn: fc.constant(''),
                        descriptionEn: fc.constant(''),
                        rulesEn: fc.constant(''),
                        nameDe: fc.constant(null),
                        shortDescriptionDe: fc.constant(null),
                        descriptionDe: fc.constant(null),
                        rulesDe: fc.constant(null),
                        nameBg: fc.constant(null),
                        shortDescriptionBg: fc.constant(null),
                        descriptionBg: fc.constant(null),
                        rulesBg: fc.constant(null),
                        nameSr: fc.constant(null),
                        shortDescriptionSr: fc.constant(null),
                        descriptionSr: fc.constant(null),
                        rulesSr: fc.constant(null),
                        nameUk: fc.constant(null),
                        shortDescriptionUk: fc.constant(null),
                        descriptionUk: fc.constant(null),
                        rulesUk: fc.constant(null),
                        nameHu: fc.constant(null),
                        shortDescriptionHu: fc.constant(null),
                        descriptionHu: fc.constant(null),
                        rulesHu: fc.constant(null),
                    }),
                    (competition) => {
                        // Empty strings should be treated as missing
                        expect(getCompetitionTranslationStatus(competition, 'en')).toBe('none');
                        expect(hasCompleteCompetitionTranslation(competition, 'en')).toBe(false);
                        expect(hasAnyCompetitionTranslation(competition, 'en')).toBe(false);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });
});
