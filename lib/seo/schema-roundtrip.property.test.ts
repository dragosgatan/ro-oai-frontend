/**
 * Property-Based Tests for Schema Round-Trip Consistency
 *
 * **Property 10: Schema Round-Trip Consistency**
 * **Validates: Requirements 7.1**
 *
 * For any valid input data, generating a schema, serializing it to JSON,
 * and parsing it back SHALL produce an equivalent object structure.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    generateOrganizationSchema,
    generateWebSiteSchema,
    generateBreadcrumbSchema,
    generateQuizSchema,
    generateCompetitionSchema,
    generateArticleSchema,
    generateImageObjectSchema,
    sanitizeStructuredData,
    validateStructuredData,
    type ArticleInput,
    type ImageObjectOptions,
} from './structured-data';
import type { BreadcrumbItem } from './types';
import type { Problem, CompetitionUserResponse } from '@/lib/types';

/**
 * Arbitrary generator for locale values
 */
const arbitraryLocale = (): fc.Arbitrary<string> => {
    return fc.constantFrom('en', 'ro');
};

/**
 * Arbitrary generator for safe strings (no XSS vectors)
 */
const arbitrarySafeString = (minLength = 1, maxLength = 100): fc.Arbitrary<string> => {
    return fc.stringMatching(/^[a-zA-Z0-9\s\-_.,!?()]+$/, { minLength, maxLength });
};

/**
 * Arbitrary generator for breadcrumb items
 */
const arbitraryBreadcrumbItem = (): fc.Arbitrary<BreadcrumbItem> => {
    return fc.record({
        name: arbitrarySafeString(1, 50),
        url: fc.webUrl(),
    });
};

/**
 * Arbitrary generator for Problem objects
 */
const arbitraryProblem = (): fc.Arbitrary<Problem> => {
    return fc.record({
        id: fc.uuid(),
        title: arbitrarySafeString(5, 100),
        shortDescription: arbitrarySafeString(10, 200),
        difficulty: fc.constantFrom('easy', 'medium', 'hard', 'expert'),
        author: arbitrarySafeString(3, 50),
        topScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
        subtasks: fc.option(
            fc.array(
                fc.record({
                    subtaskName: arbitrarySafeString(3, 30),
                    subtaskScore: fc.integer({ min: 0, max: 100 }),
                }),
                { minLength: 0, maxLength: 5 },
            ),
            { nil: undefined },
        ),
    }) as fc.Arbitrary<Problem>;
};

/**
 * Arbitrary generator for Competition objects
 */
const arbitraryCompetition = (): fc.Arbitrary<CompetitionUserResponse> => {
    return fc.record({
        id: fc.uuid(),
        name: arbitrarySafeString(5, 100),
        description: arbitrarySafeString(10, 500),
        startTime: fc.constant(new Date('2024-01-01T10:00:00Z').toISOString()),
        endTime: fc.constant(new Date('2024-12-31T18:00:00Z').toISOString()),
    }) as fc.Arbitrary<CompetitionUserResponse>;
};

/**
 * Arbitrary generator for Article input
 */
const arbitraryArticleInput = (): fc.Arbitrary<ArticleInput> => {
    return fc.record({
        title: arbitrarySafeString(5, 100),
        slug: fc.stringMatching(/^[a-z0-9\-]+$/, { minLength: 3, maxLength: 50 }),
        html: fc.option(arbitrarySafeString(20, 500), { nil: undefined }),
        description: fc.option(arbitrarySafeString(10, 160), { nil: undefined }),
        datePublished: fc.option(fc.constant(new Date('2024-06-15T12:00:00Z').toISOString()), {
            nil: undefined,
        }),
        dateModified: fc.option(fc.constant(new Date('2024-07-20T14:30:00Z').toISOString()), {
            nil: undefined,
        }),
        image: fc.option(fc.webUrl(), { nil: undefined }),
    });
};

/**
 * Arbitrary generator for ImageObject options
 */
const arbitraryImageObjectOptions = (): fc.Arbitrary<ImageObjectOptions | undefined> => {
    return fc.option(
        fc.record({
            license: fc.option(fc.webUrl(), { nil: undefined }),
            acquireLicensePage: fc.option(fc.webUrl(), { nil: undefined }),
            creditText: fc.option(arbitrarySafeString(3, 50), { nil: undefined }),
            creator: fc.option(arbitrarySafeString(3, 50), { nil: undefined }),
            copyrightNotice: fc.option(arbitrarySafeString(5, 100), { nil: undefined }),
            width: fc.option(fc.integer({ min: 1, max: 4096 }), { nil: undefined }),
            height: fc.option(fc.integer({ min: 1, max: 4096 }), { nil: undefined }),
        }),
        { nil: undefined },
    );
};

/**
 * Helper function to perform round-trip test
 * Serializes to JSON and parses back, comparing structure
 */
function roundTrip(schema: object): object {
    const jsonString = JSON.stringify(schema);
    return JSON.parse(jsonString);
}

/**
 * Helper function to deep compare objects
 * Handles undefined values and nested structures
 */
function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === undefined && b === undefined) return true;
    if (a === null && b === null) return true;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => deepEqual(item, b[index]));
    }

    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
        const keysA = Object.keys(a as Record<string, unknown>);
        const keysB = Object.keys(b as Record<string, unknown>);

        // Get all unique keys
        const allKeys = new Set([...keysA, ...keysB]);

        for (const key of allKeys) {
            const valA = (a as Record<string, unknown>)[key];
            const valB = (b as Record<string, unknown>)[key];

            // Skip undefined values (they don't serialize to JSON)
            if (valA === undefined && valB === undefined) continue;
            if (valA === undefined && !(key in (b as Record<string, unknown>))) continue;
            if (valB === undefined && !(key in (a as Record<string, unknown>))) continue;

            if (!deepEqual(valA, valB)) return false;
        }
        return true;
    }

    return false;
}

describe('Schema Round-Trip Consistency Property Tests', () => {
    describe('Property 10: Schema Round-Trip Consistency', () => {
        /**
         * **Feature: schema-org-structured-data, Property 10: Schema Round-Trip Consistency**
         * **Validates: Requirements 7.1**
         */

        it('should preserve Organization schema structure after round-trip', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryLocale(), async (locale) => {
                    const original = generateOrganizationSchema(locale);
                    const roundTripped = roundTrip(original);

                    // Requirement 7.1: Round-trip should produce equivalent structure
                    expect(validateStructuredData(roundTripped)).toBe(true);
                    expect(roundTripped['@context']).toBe(original['@context']);
                    expect(roundTripped['@type']).toBe(original['@type']);
                    expect((roundTripped as Record<string, unknown>).name).toBe(original.name);
                    expect((roundTripped as Record<string, unknown>).url).toBe(original.url);
                }),
                { numRuns: 100 },
            );
        });

        it('should preserve WebSite schema structure after round-trip', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryLocale(), async (locale) => {
                    const original = generateWebSiteSchema(locale);
                    const roundTripped = roundTrip(original);

                    expect(validateStructuredData(roundTripped)).toBe(true);
                    expect(roundTripped['@context']).toBe(original['@context']);
                    expect(roundTripped['@type']).toBe(original['@type']);
                    expect((roundTripped as Record<string, unknown>).name).toBe(original.name);
                    expect((roundTripped as Record<string, unknown>).url).toBe(original.url);
                }),
                { numRuns: 100 },
            );
        });

        it('should preserve Breadcrumb schema structure after round-trip', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(arbitraryBreadcrumbItem(), { minLength: 1, maxLength: 5 }),
                    async (items) => {
                        const original = generateBreadcrumbSchema(items);
                        const roundTripped = roundTrip(original);

                        expect(validateStructuredData(roundTripped)).toBe(true);
                        expect(roundTripped['@context']).toBe(original['@context']);
                        expect(roundTripped['@type']).toBe(original['@type']);

                        // Check itemListElement array
                        const originalItems = original.itemListElement;
                        const roundTrippedItems = (roundTripped as Record<string, unknown>)
                            .itemListElement as unknown[];
                        expect(roundTrippedItems.length).toBe(originalItems.length);

                        // Each item should have correct position, name, and item
                        originalItems.forEach((item, index) => {
                            const rtItem = roundTrippedItems[index] as Record<string, unknown>;
                            expect(rtItem.position).toBe(item.position);
                            expect(rtItem.name).toBe(item.name);
                            expect(rtItem.item).toBe(item.item);
                        });
                    },
                ),
                { numRuns: 100 },
            );
        }, 30000);

        it('should preserve Quiz schema structure after round-trip', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryProblem(), arbitraryLocale(), async (problem, locale) => {
                    const original = generateQuizSchema(problem, locale);
                    const roundTripped = roundTrip(original);

                    expect(validateStructuredData(roundTripped)).toBe(true);
                    expect(roundTripped['@context']).toBe(original['@context']);
                    expect(roundTripped['@type']).toBe(original['@type']);
                    expect((roundTripped as Record<string, unknown>).name).toBe(original.name);
                    expect((roundTripped as Record<string, unknown>).educationalLevel).toBe(
                        original.educationalLevel,
                    );
                }),
                { numRuns: 100 },
            );
        });

        it('should preserve Event schema structure after round-trip', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const original = generateCompetitionSchema(competition, locale);
                        const roundTripped = roundTrip(original);

                        expect(validateStructuredData(roundTripped)).toBe(true);
                        expect(roundTripped['@context']).toBe(original['@context']);
                        expect(roundTripped['@type']).toBe(original['@type']);
                        expect((roundTripped as Record<string, unknown>).name).toBe(original.name);
                        expect((roundTripped as Record<string, unknown>).startDate).toBe(
                            original.startDate,
                        );
                        expect((roundTripped as Record<string, unknown>).endDate).toBe(
                            original.endDate,
                        );
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should preserve Article schema structure after round-trip', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryArticleInput(),
                    arbitraryLocale(),
                    async (article, locale) => {
                        const original = generateArticleSchema(article, locale);
                        const roundTripped = roundTrip(original);

                        expect(validateStructuredData(roundTripped)).toBe(true);
                        expect(roundTripped['@context']).toBe(original['@context']);
                        expect(roundTripped['@type']).toBe(original['@type']);
                        expect((roundTripped as Record<string, unknown>).headline).toBe(
                            original.headline,
                        );
                        expect((roundTripped as Record<string, unknown>).datePublished).toBe(
                            original.datePublished,
                        );
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should preserve ImageObject schema structure after round-trip', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.webUrl(),
                    arbitraryImageObjectOptions(),
                    async (imageUrl, options) => {
                        const original = generateImageObjectSchema(imageUrl, options);
                        const roundTripped = roundTrip(original);

                        expect(validateStructuredData(roundTripped)).toBe(true);
                        expect(roundTripped['@context']).toBe(original['@context']);
                        expect(roundTripped['@type']).toBe(original['@type']);
                        expect((roundTripped as Record<string, unknown>).contentUrl).toBe(
                            original.contentUrl,
                        );
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should preserve sanitized schema structure after round-trip', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryLocale(), async (locale) => {
                    const original = generateOrganizationSchema(locale);
                    const sanitized = sanitizeStructuredData(original);
                    const roundTripped = roundTrip(sanitized);

                    // Sanitized and round-tripped should be equivalent
                    expect(validateStructuredData(roundTripped)).toBe(true);
                    expect(deepEqual(sanitized, roundTripped)).toBe(true);
                }),
                { numRuns: 100 },
            );
        });

        it('should handle complex nested structures in round-trip', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const original = generateCompetitionSchema(competition, locale);
                        const roundTripped = roundTrip(original);

                        // Check nested organizer object
                        const originalOrganizer = original.organizer;
                        const rtOrganizer = (roundTripped as Record<string, unknown>)
                            .organizer as Record<string, unknown>;
                        expect(rtOrganizer['@type']).toBe(originalOrganizer['@type']);
                        expect(rtOrganizer.name).toBe(originalOrganizer.name);
                        expect(rtOrganizer.url).toBe(originalOrganizer.url);

                        // Check nested location object
                        const originalLocation = original.location;
                        const rtLocation = (roundTripped as Record<string, unknown>)
                            .location as Record<string, unknown>;
                        expect(rtLocation['@type']).toBe(originalLocation['@type']);
                        expect(rtLocation.url).toBe(originalLocation.url);

                        // Check nested offers object
                        const originalOffers = original.offers;
                        const rtOffers = (roundTripped as Record<string, unknown>).offers as Record<
                            string,
                            unknown
                        >;
                        expect(rtOffers['@type']).toBe(originalOffers!['@type']);
                        expect(rtOffers.price).toBe(originalOffers!.price);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should preserve array elements in round-trip', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryLocale(), async (locale) => {
                    const original = generateOrganizationSchema(locale);
                    const roundTripped = roundTrip(original);

                    // Check sameAs array
                    const originalSameAs = original.sameAs;
                    const rtSameAs = (roundTripped as Record<string, unknown>).sameAs as string[];
                    expect(rtSameAs.length).toBe(originalSameAs!.length);
                    originalSameAs!.forEach((url, index) => {
                        expect(rtSameAs[index]).toBe(url);
                    });

                    // Check contactPoint.availableLanguage array
                    const originalLangs = original.contactPoint!.availableLanguage;
                    const rtContactPoint = (roundTripped as Record<string, unknown>)
                        .contactPoint as Record<string, unknown>;
                    const rtLangs = rtContactPoint.availableLanguage as string[];
                    expect(rtLangs.length).toBe(originalLangs!.length);
                }),
                { numRuns: 100 },
            );
        });
    });
});
