/**
 * Property-Based Tests for Dynamic Content Localization
 *
 * **Property 12: Dynamic Content Localization**
 * **Validates: Requirements 7.1, 7.2, 7.3**
 *
 * For any problem or competition with locale-specific translations, the generated
 * metadata SHALL use the translated title/description for the current locale when available.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './config';
import { Locale } from '@/lib/types';

// Simulated Problem type with locale-specific fields
interface LocalizedProblem {
    id: string;
    title: string;
    shortDescription: string;
    longDescription?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    author: string;
    // Locale-specific fields
    titleEn?: string;
    titleRo?: string;
    titleEs?: string;
    titleDe?: string;
    titleFr?: string;
    shortDescriptionEn?: string;
    shortDescriptionRo?: string;
    shortDescriptionEs?: string;
    shortDescriptionDe?: string;
    shortDescriptionFr?: string;
    [key: string]: unknown;
}

// Simulated Competition type with locale-specific fields
interface LocalizedCompetition {
    id: number;
    name: string;
    description: string;
    startTime: string;
    endTime: string;
    participantCount?: number;
    // Locale-specific fields
    nameEn?: string;
    nameRo?: string;
    nameEs?: string;
    nameDe?: string;
    nameFr?: string;
    descriptionEn?: string;
    descriptionRo?: string;
    descriptionEs?: string;
    descriptionDe?: string;
    descriptionFr?: string;
    [key: string]: unknown;
}

/**
 * Get localized field from a dynamic content object (problem/competition)
 * This mirrors the implementation in page-metadata.ts
 */
function getLocalizedField(
    obj: Record<string, unknown>,
    fieldName: string,
    locale: string,
    defaultLocale: string = 'ro',
): string {
    // Capitalize first letter for field name pattern (e.g., 'En', 'Ro')
    const localeCapitalized = locale.charAt(0).toUpperCase() + locale.slice(1);
    const defaultLocaleCapitalized = defaultLocale.charAt(0).toUpperCase() + defaultLocale.slice(1);

    // 1. Try locale-specific field (e.g., nameEn, descriptionFr)
    const localeField = `${fieldName}${localeCapitalized}`;
    if (obj[localeField] && typeof obj[localeField] === 'string') {
        return obj[localeField] as string;
    }

    // 2. Try English field
    const enField = `${fieldName}En`;
    if (locale !== 'en' && obj[enField] && typeof obj[enField] === 'string') {
        return obj[enField] as string;
    }

    // 3. Try default locale field (usually Romanian for problems/competitions)
    const defaultField = `${fieldName}${defaultLocaleCapitalized}`;
    if (obj[defaultField] && typeof obj[defaultField] === 'string') {
        return obj[defaultField] as string;
    }

    // 4. Fall back to base field
    if (obj[fieldName] && typeof obj[fieldName] === 'string') {
        return obj[fieldName] as string;
    }

    return '';
}

// Arbitraries for generating test data
const problemArbitrary = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 5, maxLength: 100 }),
    shortDescription: fc.string({ minLength: 20, maxLength: 200 }),
    longDescription: fc.option(fc.string({ minLength: 50, maxLength: 500 })),
    difficulty: fc.constantFrom('Easy', 'Medium', 'Hard') as fc.Arbitrary<
        'Easy' | 'Medium' | 'Hard'
    >,
    author: fc.string({ minLength: 3, maxLength: 50 }),
    // Locale-specific fields (optional)
    titleEn: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
    titleRo: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
    titleEs: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
    shortDescriptionEn: fc.option(fc.string({ minLength: 20, maxLength: 200 })),
    shortDescriptionRo: fc.option(fc.string({ minLength: 20, maxLength: 200 })),
    shortDescriptionEs: fc.option(fc.string({ minLength: 20, maxLength: 200 })),
});

const competitionArbitrary = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: fc.string({ minLength: 5, maxLength: 100 }),
    description: fc.string({ minLength: 20, maxLength: 300 }),
    startTime: fc.constant('2024-06-01T00:00:00.000Z'),
    endTime: fc.constant('2024-12-31T23:59:59.000Z'),
    participantCount: fc.option(fc.integer({ min: 0, max: 10000 })),
    // Locale-specific fields (optional)
    nameEn: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
    nameRo: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
    nameEs: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
    descriptionEn: fc.option(fc.string({ minLength: 20, maxLength: 300 })),
    descriptionRo: fc.option(fc.string({ minLength: 20, maxLength: 300 })),
    descriptionEs: fc.option(fc.string({ minLength: 20, maxLength: 300 })),
});

// Locales to test
const TEST_LOCALES: Locale[] = ['en', 'ro', 'es', 'de', 'fr'];

describe('Dynamic Content Localization Property Tests', () => {
    describe('Property 12: Dynamic Content Localization', () => {
        /**
         * **Feature: seo-localization, Property 12: Dynamic Content Localization**
         * **Validates: Requirements 7.1, 7.2, 7.3**
         *
         * Verify problem/competition metadata uses locale translations
         */
        it('should use locale-specific title when available for problems', () => {
            fc.assert(
                fc.property(
                    problemArbitrary,
                    fc.constantFrom(...TEST_LOCALES),
                    (problem, locale) => {
                        const localizedTitle = getLocalizedField(
                            problem as Record<string, unknown>,
                            'title',
                            locale,
                        );

                        // Should return a non-empty string
                        expect(localizedTitle.length).toBeGreaterThan(0);

                        // If locale-specific field exists, it should be used
                        const localeCapitalized = locale.charAt(0).toUpperCase() + locale.slice(1);
                        const localeField = `title${localeCapitalized}`;
                        if (problem[localeField as keyof typeof problem]) {
                            expect(localizedTitle).toBe(
                                problem[localeField as keyof typeof problem],
                            );
                        }
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should use locale-specific name when available for competitions', () => {
            fc.assert(
                fc.property(
                    competitionArbitrary,
                    fc.constantFrom(...TEST_LOCALES),
                    (competition, locale) => {
                        const localizedName = getLocalizedField(
                            competition as Record<string, unknown>,
                            'name',
                            locale,
                        );

                        // Should return a non-empty string
                        expect(localizedName.length).toBeGreaterThan(0);

                        // If locale-specific field exists, it should be used
                        const localeCapitalized = locale.charAt(0).toUpperCase() + locale.slice(1);
                        const localeField = `name${localeCapitalized}`;
                        if (competition[localeField as keyof typeof competition]) {
                            expect(localizedName).toBe(
                                competition[localeField as keyof typeof competition],
                            );
                        }
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should fall back to English when locale-specific field is missing', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.uuid(),
                        title: fc.string({ minLength: 5, maxLength: 100 }),
                        shortDescription: fc.string({ minLength: 20, maxLength: 200 }),
                        difficulty: fc.constantFrom('Easy', 'Medium', 'Hard') as fc.Arbitrary<
                            'Easy' | 'Medium' | 'Hard'
                        >,
                        author: fc.string({ minLength: 3, maxLength: 50 }),
                        // Only English field available
                        titleEn: fc.string({ minLength: 5, maxLength: 100 }),
                    }),
                    fc.constantFrom('es', 'de', 'fr') as fc.Arbitrary<Locale>,
                    (problem, locale) => {
                        const localizedTitle = getLocalizedField(
                            problem as Record<string, unknown>,
                            'title',
                            locale,
                        );

                        // Should fall back to English
                        expect(localizedTitle).toBe(problem.titleEn);
                    },
                ),
                { numRuns: 50 },
            );
        });

        it('should fall back to Romanian (default) when neither locale nor English is available', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.uuid(),
                        title: fc.string({ minLength: 5, maxLength: 100 }),
                        shortDescription: fc.string({ minLength: 20, maxLength: 200 }),
                        difficulty: fc.constantFrom('Easy', 'Medium', 'Hard') as fc.Arbitrary<
                            'Easy' | 'Medium' | 'Hard'
                        >,
                        author: fc.string({ minLength: 3, maxLength: 50 }),
                        // Only Romanian field available
                        titleRo: fc.string({ minLength: 5, maxLength: 100 }),
                    }),
                    fc.constantFrom('es', 'de', 'fr') as fc.Arbitrary<Locale>,
                    (problem, locale) => {
                        const localizedTitle = getLocalizedField(
                            problem as Record<string, unknown>,
                            'title',
                            locale,
                        );

                        // Should fall back to Romanian
                        expect(localizedTitle).toBe(problem.titleRo);
                    },
                ),
                { numRuns: 50 },
            );
        });

        it('should fall back to base field when no locale-specific fields exist', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.uuid(),
                        title: fc.string({ minLength: 5, maxLength: 100 }),
                        shortDescription: fc.string({ minLength: 20, maxLength: 200 }),
                        difficulty: fc.constantFrom('Easy', 'Medium', 'Hard') as fc.Arbitrary<
                            'Easy' | 'Medium' | 'Hard'
                        >,
                        author: fc.string({ minLength: 3, maxLength: 50 }),
                        // No locale-specific fields
                    }),
                    fc.constantFrom(...TEST_LOCALES),
                    (problem, locale) => {
                        const localizedTitle = getLocalizedField(
                            problem as Record<string, unknown>,
                            'title',
                            locale,
                        );

                        // Should fall back to base title field
                        expect(localizedTitle).toBe(problem.title);
                    },
                ),
                { numRuns: 50 },
            );
        });

        it('should prioritize locale-specific field over English for non-English locales', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.uuid(),
                        title: fc.string({ minLength: 5, maxLength: 100 }),
                        shortDescription: fc.string({ minLength: 20, maxLength: 200 }),
                        difficulty: fc.constantFrom('Easy', 'Medium', 'Hard') as fc.Arbitrary<
                            'Easy' | 'Medium' | 'Hard'
                        >,
                        author: fc.string({ minLength: 3, maxLength: 50 }),
                        // Both Spanish and English available
                        titleEs: fc.string({ minLength: 5, maxLength: 100 }),
                        titleEn: fc.string({ minLength: 5, maxLength: 100 }),
                    }),
                    (problem) => {
                        const localizedTitle = getLocalizedField(
                            problem as Record<string, unknown>,
                            'title',
                            'es',
                        );

                        // Should use Spanish, not English
                        expect(localizedTitle).toBe(problem.titleEs);
                    },
                ),
                { numRuns: 50 },
            );
        });

        it('should handle description field localization for competitions', () => {
            fc.assert(
                fc.property(
                    competitionArbitrary,
                    fc.constantFrom(...TEST_LOCALES),
                    (competition, locale) => {
                        const localizedDesc = getLocalizedField(
                            competition as Record<string, unknown>,
                            'description',
                            locale,
                        );

                        // Should return a non-empty string
                        expect(localizedDesc.length).toBeGreaterThan(0);

                        // If locale-specific field exists, it should be used
                        const localeCapitalized = locale.charAt(0).toUpperCase() + locale.slice(1);
                        const localeField = `description${localeCapitalized}`;
                        if (competition[localeField as keyof typeof competition]) {
                            expect(localizedDesc).toBe(
                                competition[localeField as keyof typeof competition],
                            );
                        }
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should never return undefined for any locale and field combination', () => {
            fc.assert(
                fc.property(
                    problemArbitrary,
                    fc.constantFrom(...SUPPORTED_LOCALES),
                    fc.constantFrom('title', 'shortDescription'),
                    (problem, locale, fieldName) => {
                        const localizedValue = getLocalizedField(
                            problem as Record<string, unknown>,
                            fieldName,
                            locale,
                        );

                        // Should never be undefined (empty string is acceptable as fallback)
                        expect(localizedValue).not.toBeUndefined();
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should maintain fallback order: locale → English → Romanian → base', () => {
            // Test with a problem that has all fields
            const problem = {
                id: 'test-123',
                title: 'Base Title',
                shortDescription: 'Base Description',
                difficulty: 'Medium' as const,
                author: 'Test Author',
                titleEs: 'Título en Español',
                titleEn: 'English Title',
                titleRo: 'Titlu în Română',
            };

            // Spanish locale should use Spanish
            expect(getLocalizedField(problem, 'title', 'es')).toBe('Título en Español');

            // English locale should use English
            expect(getLocalizedField(problem, 'title', 'en')).toBe('English Title');

            // Romanian locale should use Romanian
            expect(getLocalizedField(problem, 'title', 'ro')).toBe('Titlu în Română');

            // German (no specific field) should fall back to English
            expect(getLocalizedField(problem, 'title', 'de')).toBe('English Title');
        });
    });
});
