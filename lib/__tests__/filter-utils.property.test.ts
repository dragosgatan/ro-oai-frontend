/**
 * Filter Utils Property-Based Tests
 *
 * Property test for task 11.3: URL State Synchronization
 *
 * **Feature: problem-search-filter, Property 13: URL State Synchronization**
 *
 * This test verifies:
 * - For any filter state, the URL query parameters SHALL reflect the current filters,
 *   and loading a URL with filter parameters SHALL restore the corresponding filter state.
 *
 * **Validates: Requirements 5.6**
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import {
    serializeFiltersToUrl,
    deserializeFiltersFromUrl,
    areFiltersEqual,
    hasActiveFilters,
    countActiveFilters,
    createEmptyFilters,
    isValidDifficulty,
    VALID_DIFFICULTIES,
    buildApiQueryParams,
} from '../filter-utils';
import type { ProblemFilters, Difficulty, AttemptedStatus } from '@/hooks/use-problem-filters';

// Arbitrary for generating valid difficulty values
const difficultyArbitrary = fc.constantFrom<Difficulty>('Easy', 'Medium', 'Hard');

// Arbitrary for generating arrays of unique difficulties
const difficultyArrayArbitrary = fc
    .uniqueArray(difficultyArbitrary, { maxLength: 3 })
    .map((arr) => arr as Difficulty[]);

// Arbitrary for generating positive category IDs
const categoryIdArbitrary = fc.integer({ min: 1, max: 10000 });

// Arbitrary for generating arrays of unique category IDs
const categoryIdsArrayArbitrary = fc.uniqueArray(categoryIdArbitrary, { maxLength: 10 });
const competitionIdsArrayArbitrary = fc.uniqueArray(categoryIdArbitrary, { maxLength: 10 });
const attemptedStatusArbitrary = fc.constantFrom<AttemptedStatus>(null, 'attempted', 'unattempted');

// Arbitrary for generating search strings (alphanumeric with spaces)
const searchStringArbitrary = fc.string({ minLength: 0, maxLength: 50 }).map((s) =>
    // Filter to only alphanumeric and spaces for cleaner URLs
    s.replace(/[^a-zA-Z0-9 ]/g, '').trim(),
);

// Arbitrary for generating complete filter state
const problemFiltersArbitrary: fc.Arbitrary<ProblemFilters> = fc.record({
    search: searchStringArbitrary,
    difficulty: difficultyArrayArbitrary,
    categoryIds: categoryIdsArrayArbitrary,
    competitionIds: competitionIdsArrayArbitrary,
    attemptedStatus: attemptedStatusArbitrary,
});

describe('Filter Utils Property-Based Tests', () => {
    describe('Property 13: URL State Synchronization', () => {
        test.prop([problemFiltersArbitrary], { numRuns: 100 })(
            'serializing then deserializing filters should produce equivalent filter state (round-trip)',
            (filters) => {
                // Serialize filters to URL string
                const urlString = serializeFiltersToUrl(filters);

                // Deserialize back to filter state
                const restored = deserializeFiltersFromUrl(urlString);

                // The restored filters should be equivalent to the original
                // Note: We compare trimmed search since serialization trims whitespace
                const normalizedOriginal: ProblemFilters = {
                    search: filters.search.trim(),
                    difficulty: [...filters.difficulty].sort(),
                    categoryIds: [...filters.categoryIds].sort((a, b) => a - b),
                    competitionIds: [...filters.competitionIds].sort((a, b) => a - b),
                    attemptedStatus: filters.attemptedStatus,
                };

                const normalizedRestored: ProblemFilters = {
                    search: restored.search.trim(),
                    difficulty: [...restored.difficulty].sort(),
                    categoryIds: [...restored.categoryIds].sort((a, b) => a - b),
                    competitionIds: [...restored.competitionIds].sort((a, b) => a - b),
                    attemptedStatus: restored.attemptedStatus,
                };

                expect(normalizedRestored.search).toBe(normalizedOriginal.search);
                expect(normalizedRestored.difficulty).toEqual(normalizedOriginal.difficulty);
                expect(normalizedRestored.categoryIds).toEqual(normalizedOriginal.categoryIds);
                expect(normalizedRestored.competitionIds).toEqual(
                    normalizedOriginal.competitionIds,
                );
                expect(normalizedRestored.attemptedStatus).toBe(normalizedOriginal.attemptedStatus);
            },
        );

        test.prop([problemFiltersArbitrary], { numRuns: 100 })(
            'areFiltersEqual should return true for identical filters',
            (filters) => {
                // Create a copy of the filters
                const copy: ProblemFilters = {
                    search: filters.search,
                    difficulty: [...filters.difficulty],
                    categoryIds: [...filters.categoryIds],
                    competitionIds: [...filters.competitionIds],
                    attemptedStatus: filters.attemptedStatus,
                };

                expect(areFiltersEqual(filters, copy)).toBe(true);
            },
        );

        test.prop([problemFiltersArbitrary, problemFiltersArbitrary], { numRuns: 100 })(
            'areFiltersEqual should be symmetric',
            (a, b) => {
                // areFiltersEqual(a, b) should equal areFiltersEqual(b, a)
                expect(areFiltersEqual(a, b)).toBe(areFiltersEqual(b, a));
            },
        );

        test.prop([problemFiltersArbitrary], { numRuns: 100 })(
            'hasActiveFilters should correctly detect active filters',
            (filters) => {
                const hasActive = hasActiveFilters(filters);
                const expectedHasActive =
                    filters.search.trim() !== '' ||
                    filters.difficulty.length > 0 ||
                    filters.categoryIds.length > 0 ||
                    filters.competitionIds.length > 0 ||
                    filters.attemptedStatus !== null;

                expect(hasActive).toBe(expectedHasActive);
            },
        );

        test.prop([problemFiltersArbitrary], { numRuns: 100 })(
            'countActiveFilters should correctly count filter values',
            (filters) => {
                const count = countActiveFilters(filters);
                let expectedCount = 0;
                if (filters.search.trim()) expectedCount += 1;
                expectedCount += filters.difficulty.length;
                expectedCount += filters.categoryIds.length;
                expectedCount += filters.competitionIds.length;
                if (filters.attemptedStatus) expectedCount += 1;

                expect(count).toBe(expectedCount);
            },
        );

        test.prop([problemFiltersArbitrary], { numRuns: 100 })(
            'serialized URL should contain all filter values',
            (filters) => {
                const urlString = serializeFiltersToUrl(filters);
                const params = new URLSearchParams(urlString);

                // Check search parameter
                if (filters.search.trim()) {
                    expect(params.get('search')).toBe(filters.search.trim());
                } else {
                    expect(params.has('search')).toBe(false);
                }

                // Check difficulty parameters
                const difficultyParams = params.getAll('difficulty');
                expect(difficultyParams.length).toBe(filters.difficulty.length);
                filters.difficulty.forEach((d) => {
                    expect(difficultyParams).toContain(d);
                });

                // Check categoryIds parameters
                const categoryIdsParams = params.getAll('categoryIds');
                expect(categoryIdsParams.length).toBe(filters.categoryIds.length);
                filters.categoryIds.forEach((id) => {
                    expect(categoryIdsParams).toContain(id.toString());
                });

                const competitionIdsParams = params.getAll('competitionIds');
                expect(competitionIdsParams.length).toBe(filters.competitionIds.length);
                filters.competitionIds.forEach((id) => {
                    expect(competitionIdsParams).toContain(id.toString());
                });

                expect(params.get('attemptedStatus')).toBe(filters.attemptedStatus);
            },
        );

        test.prop([difficultyArbitrary], { numRuns: 100 })(
            'isValidDifficulty should return true for valid difficulties',
            (difficulty) => {
                expect(isValidDifficulty(difficulty)).toBe(true);
            },
        );

        test.prop([fc.string().filter((s) => !VALID_DIFFICULTIES.includes(s as Difficulty))], {
            numRuns: 100,
        })(
            'isValidDifficulty should return false for invalid difficulties',
            (invalidDifficulty) => {
                expect(isValidDifficulty(invalidDifficulty)).toBe(false);
            },
        );

        test.prop(
            [
                problemFiltersArbitrary,
                fc.integer({ min: 0, max: 100 }),
                fc.integer({ min: 1, max: 100 }),
            ],
            { numRuns: 100 },
        )(
            'buildApiQueryParams should include page and size when provided',
            (filters, page, size) => {
                const params = buildApiQueryParams(filters, page, size);

                expect(params.get('page')).toBe(page.toString());
                expect(params.get('size')).toBe(size.toString());
            },
        );
    });

    describe('Empty Filters', () => {
        test.prop([fc.constant(null)], { numRuns: 1 })(
            'createEmptyFilters should create valid empty state',
            () => {
                const empty = createEmptyFilters();

                expect(empty.search).toBe('');
                expect(empty.difficulty).toEqual([]);
                expect(empty.categoryIds).toEqual([]);
                expect(empty.competitionIds).toEqual([]);
                expect(empty.attemptedStatus).toBeNull();
                expect(hasActiveFilters(empty)).toBe(false);
                expect(countActiveFilters(empty)).toBe(0);
            },
        );

        test.prop([fc.constant(null)], { numRuns: 1 })(
            'serializing empty filters should produce empty URL string',
            () => {
                const empty = createEmptyFilters();
                const urlString = serializeFiltersToUrl(empty);

                expect(urlString).toBe('');
            },
        );

        test.prop([fc.constant(null)], { numRuns: 1 })(
            'deserializing empty URL should produce empty filters',
            () => {
                const restored = deserializeFiltersFromUrl('');

                expect(restored.search).toBe('');
                expect(restored.difficulty).toEqual([]);
                expect(restored.categoryIds).toEqual([]);
                expect(restored.competitionIds).toEqual([]);
                expect(restored.attemptedStatus).toBeNull();
            },
        );
    });

    describe('Edge Cases', () => {
        test.prop([fc.integer({ min: -1000, max: 0 })], { numRuns: 100 })(
            'deserializing should ignore non-positive category IDs',
            (invalidId) => {
                const urlString = `categoryIds=${invalidId}`;
                const restored = deserializeFiltersFromUrl(urlString);

                expect(restored.categoryIds).toEqual([]);
            },
        );

        test.prop([fc.string().filter((s) => !['Easy', 'Medium', 'Hard'].includes(s))], {
            numRuns: 100,
        })('deserializing should ignore invalid difficulty values', (invalidDifficulty) => {
            const urlString = `difficulty=${encodeURIComponent(invalidDifficulty)}`;
            const restored = deserializeFiltersFromUrl(urlString);

            expect(restored.difficulty).toEqual([]);
        });

        test.prop([fc.integer({ min: -1000, max: 0 })], { numRuns: 100 })(
            'deserializing should ignore non-positive competition IDs',
            (invalidId) => {
                const restored = deserializeFiltersFromUrl(`competitionIds=${invalidId}`);
                expect(restored.competitionIds).toEqual([]);
            },
        );

        test.prop([fc.string().filter((status) => !['attempted', 'unattempted'].includes(status))])(
            'deserializing should ignore invalid attempted statuses',
            (invalidStatus) => {
                const restored = deserializeFiltersFromUrl(
                    `attemptedStatus=${encodeURIComponent(invalidStatus)}`,
                );
                expect(restored.attemptedStatus).toBeNull();
            },
        );
    });
});
