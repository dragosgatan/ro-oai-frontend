/**
 * Property-Based Tests for Event Schema Localization
 *
 * **Property 8: Event Schema Localization**
 * **Validates: Requirements 4.4**
 *
 * For any competition with translations and any locale, the Event schema
 * SHALL use the locale-specific name and description fields when available,
 * falling back to the default fields otherwise.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateCompetitionSchema, getLocalizedCompetitionField } from './structured-data';
import { SUPPORTED_LOCALES } from './config';
import type { CompetitionUserResponse } from '@/lib/types';

/**
 * Arbitrary generator for supported locale values
 */
const arbitraryLocale = (): fc.Arbitrary<string> => {
    return fc.constantFrom(...SUPPORTED_LOCALES);
};

/**
 * Arbitrary generator for ISO 8601 date strings
 */
const arbitraryISODate = (): fc.Arbitrary<string> => {
    const minTimestamp = new Date('2020-01-01T00:00:00Z').getTime();
    const maxTimestamp = new Date('2030-12-31T23:59:59Z').getTime();

    return fc
        .integer({ min: minTimestamp, max: maxTimestamp })
        .map((timestamp) => new Date(timestamp).toISOString());
};

/**
 * Arbitrary generator for CompetitionUserResponse with translations
 */
const arbitraryCompetitionWithTranslations = (): fc.Arbitrary<CompetitionUserResponse> => {
    return fc
        .record({
            id: fc.integer({ min: 1, max: 100000 }),
            name: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
            startTime: arbitraryISODate(),
            endTime: arbitraryISODate(),
            joined: fc.boolean(),
            problems: fc.constant([] as CompetitionUserResponse['problems']),
            rules: fc.string({ maxLength: 1000 }),
            description: fc
                .string({ minLength: 1, maxLength: 500 })
                .filter((s) => s.trim().length > 0),
            hasEditorial: fc.option(fc.boolean(), { nil: undefined }),
            showAwardRank: fc.boolean(),
            // English translations
            nameEn: fc.option(
                fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
                { nil: null },
            ),
            descriptionEn: fc.option(
                fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
                { nil: null },
            ),
            // German translations
            nameDe: fc.option(
                fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
                { nil: null },
            ),
            descriptionDe: fc.option(
                fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
                { nil: null },
            ),
            // Bulgarian translations
            nameBg: fc.option(
                fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
                { nil: null },
            ),
            descriptionBg: fc.option(
                fc.string({ minLength: 1, maxLength: 500 }).filter((s) => s.trim().length > 0),
                { nil: null },
            ),
        })
        .filter((comp) => {
            return new Date(comp.endTime) >= new Date(comp.startTime);
        }) as fc.Arbitrary<CompetitionUserResponse>;
};

describe('Event Schema Localization Property Tests', () => {
    describe('Property 8: Event Schema Localization', () => {
        /**
         * **Feature: seo-localization, Property 8: Event Schema Localization**
         * **Validates: Requirements 4.4**
         */
        it('should use English name when available for en locale', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryCompetitionWithTranslations(), async (competition) => {
                    const schema = generateCompetitionSchema(competition, 'en');

                    if (competition.nameEn) {
                        // Should use English translation when available
                        expect(schema.name).toBe(competition.nameEn);
                    } else {
                        // Should fall back to default name
                        expect(schema.name).toBe(competition.name);
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should use English description when available for en locale', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryCompetitionWithTranslations(), async (competition) => {
                    const schema = generateCompetitionSchema(competition, 'en');

                    if (competition.descriptionEn) {
                        // Should use English translation when available
                        expect(schema.description).toBe(competition.descriptionEn);
                    } else {
                        // Should fall back to default description
                        expect(schema.description).toBe(competition.description);
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should use German name when available for de locale', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryCompetitionWithTranslations(), async (competition) => {
                    const schema = generateCompetitionSchema(competition, 'de');

                    if (competition.nameDe) {
                        // Should use German translation when available
                        expect(schema.name).toBe(competition.nameDe);
                    } else {
                        // Should fall back to default name
                        expect(schema.name).toBe(competition.name);
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should use German description when available for de locale', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryCompetitionWithTranslations(), async (competition) => {
                    const schema = generateCompetitionSchema(competition, 'de');

                    if (competition.descriptionDe) {
                        // Should use German translation when available
                        expect(schema.description).toBe(competition.descriptionDe);
                    } else {
                        // Should fall back to default description
                        expect(schema.description).toBe(competition.description);
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should fall back to default name for unsupported locale translations', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryCompetitionWithTranslations(), async (competition) => {
                    // Test with a locale that doesn't have translations (e.g., 'fr')
                    const schema = generateCompetitionSchema(competition, 'fr');

                    // Should fall back to default name since French translations don't exist
                    expect(schema.name).toBe(competition.name);
                }),
                { numRuns: 100 },
            );
        });

        it('should fall back to default description for unsupported locale translations', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryCompetitionWithTranslations(), async (competition) => {
                    // Test with a locale that doesn't have translations (e.g., 'fr')
                    const schema = generateCompetitionSchema(competition, 'fr');

                    // Should fall back to default description since French translations don't exist
                    expect(schema.description).toBe(competition.description);
                }),
                { numRuns: 100 },
            );
        });

        it('should include inLanguage property matching the locale', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetitionWithTranslations(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const schema = generateCompetitionSchema(competition, locale);

                        // Event schema should include inLanguage
                        expect(schema.inLanguage).toBeDefined();
                        expect(schema.inLanguage).toBe(locale);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    describe('getLocalizedCompetitionField helper function', () => {
        it('should return English name when available', () => {
            const competition = {
                id: 1,
                name: 'Default Name',
                nameEn: 'English Name',
                startTime: '2024-01-01T00:00:00Z',
                endTime: '2024-12-31T23:59:59Z',
                joined: false,
                problems: [],
                rules: '',
                description: 'Default Description',
                showAwardRank: false,
            } as CompetitionUserResponse;

            expect(getLocalizedCompetitionField(competition, 'name', 'en')).toBe('English Name');
        });

        it('should return default name when English translation is null', () => {
            const competition = {
                id: 1,
                name: 'Default Name',
                nameEn: null,
                startTime: '2024-01-01T00:00:00Z',
                endTime: '2024-12-31T23:59:59Z',
                joined: false,
                problems: [],
                rules: '',
                description: 'Default Description',
                showAwardRank: false,
            } as CompetitionUserResponse;

            expect(getLocalizedCompetitionField(competition, 'name', 'en')).toBe('Default Name');
        });

        it('should return German description when available', () => {
            const competition = {
                id: 1,
                name: 'Default Name',
                startTime: '2024-01-01T00:00:00Z',
                endTime: '2024-12-31T23:59:59Z',
                joined: false,
                problems: [],
                rules: '',
                description: 'Default Description',
                descriptionDe: 'German Description',
                showAwardRank: false,
            } as CompetitionUserResponse;

            expect(getLocalizedCompetitionField(competition, 'description', 'de')).toBe(
                'German Description',
            );
        });

        it('should return default description for unsupported locale', () => {
            const competition = {
                id: 1,
                name: 'Default Name',
                startTime: '2024-01-01T00:00:00Z',
                endTime: '2024-12-31T23:59:59Z',
                joined: false,
                problems: [],
                rules: '',
                description: 'Default Description',
                showAwardRank: false,
            } as CompetitionUserResponse;

            expect(getLocalizedCompetitionField(competition, 'description', 'fr')).toBe(
                'Default Description',
            );
        });
    });
});
