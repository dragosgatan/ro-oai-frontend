/**
 * Property-based tests for FeaturedSolutionsSection component
 *
 * **Feature: competition-editorial, Property 15: Featured solutions section visibility**
 * **Validates: Requirements 7.1**
 *
 * **Feature: competition-editorial, Property 17: Featured solutions ordered by rank**
 * **Validates: Requirements 7.4**
 */

import { describe, it, expect } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import {
    shouldShowFeaturedSolutions,
    sortFeaturedSolutionsByRank,
} from './featured-solutions-utils';
import type { FeaturedSolutionResponse } from '@/lib/types';

// Arbitrary for generating a single featured solution
const featuredSolutionArbitrary: fc.Arbitrary<FeaturedSolutionResponse> = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    userId: fc.uuid(),
    username: fc.string({ minLength: 1, maxLength: 50 }),
    avatar: fc.option(fc.webUrl()),
    competitionRank: fc.option(fc.integer({ min: 1, max: 1000 })),
    description: fc.string({ minLength: 0, maxLength: 500 }),
    sourceFiles: fc.array(
        fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            fileName: fc.string({ minLength: 1, maxLength: 100 }),
            fileLabel: fc.string({ minLength: 1, maxLength: 100 }),
            language: fc.constantFrom('python', 'java', 'cpp', 'javascript', 'typescript'),
            downloadUrl: fc.webUrl(),
        }),
        { minLength: 0, maxLength: 5 },
    ),
});

// Arbitrary for generating an array of featured solutions
const featuredSolutionsArrayArbitrary = fc.array(featuredSolutionArbitrary, {
    minLength: 0,
    maxLength: 20,
});

// Arbitrary for generating a non-empty array of featured solutions
const nonEmptyFeaturedSolutionsArbitrary = fc.array(featuredSolutionArbitrary, {
    minLength: 1,
    maxLength: 20,
});

describe('FeaturedSolutionsSection', () => {
    describe('Property 15: Featured solutions section visibility', () => {
        /**
         * **Feature: competition-editorial, Property 15: Featured solutions section visibility**
         * **Validates: Requirements 7.1**
         *
         * For any editorial, a "Featured Solutions" section should be displayed
         * if and only if the editorial has at least one featured solution.
         */

        fcTest.prop([featuredSolutionsArrayArbitrary])(
            'section visibility should match presence of solutions',
            (solutions) => {
                const shouldShow = shouldShowFeaturedSolutions(solutions);
                const hasSolutions = solutions.length > 0;

                // Property: visibility equals having at least one solution
                expect(shouldShow).toBe(hasSolutions);
            },
        );

        fcTest.prop([nonEmptyFeaturedSolutionsArbitrary])(
            'should show section when solutions exist',
            (solutions) => {
                expect(shouldShowFeaturedSolutions(solutions)).toBe(true);
            },
        );

        it('should not show section when solutions array is empty', () => {
            expect(shouldShowFeaturedSolutions([])).toBe(false);
        });

        it('should not show section when solutions is undefined', () => {
            expect(shouldShowFeaturedSolutions(undefined)).toBe(false);
        });

        it('should not show section when solutions is null', () => {
            expect(shouldShowFeaturedSolutions(null)).toBe(false);
        });

        it('should show section when there is exactly one solution', () => {
            const solutions: FeaturedSolutionResponse[] = [
                {
                    id: 1,
                    userId: 'user-1',
                    username: 'testuser',
                    description: 'Test solution',
                    sourceFiles: [],
                },
            ];
            expect(shouldShowFeaturedSolutions(solutions)).toBe(true);
        });
    });

    describe('Property 17: Featured solutions ordered by rank', () => {
        /**
         * **Feature: competition-editorial, Property 17: Featured solutions ordered by rank**
         * **Validates: Requirements 7.4**
         *
         * For any list of featured solutions, they should be displayed in
         * ascending order of competition rank (rank 1 first).
         */

        fcTest.prop([nonEmptyFeaturedSolutionsArbitrary])(
            'sorted solutions should be in ascending rank order',
            (solutions) => {
                const sorted = sortFeaturedSolutionsByRank(solutions);

                // Verify ascending order: each element's rank should be <= next element's rank
                // (with null ranks at the end)
                for (let i = 0; i < sorted.length - 1; i++) {
                    const currentRank = sorted[i].competitionRank;
                    const nextRank = sorted[i + 1].competitionRank;

                    if (currentRank != null && nextRank != null) {
                        // Both have ranks: current should be <= next
                        expect(currentRank).toBeLessThanOrEqual(nextRank);
                    } else if (currentRank == null && nextRank != null) {
                        // Current is null but next has rank: this violates ordering
                        // Null ranks should be at the end
                        expect(true).toBe(false); // This should not happen
                    }
                    // If currentRank != null and nextRank == null, that's fine (null at end)
                    // If both are null, that's also fine
                }
            },
        );

        fcTest.prop([nonEmptyFeaturedSolutionsArbitrary])(
            'sorting should preserve all original elements',
            (solutions) => {
                const sorted = sortFeaturedSolutionsByRank(solutions);

                // Same length
                expect(sorted.length).toBe(solutions.length);

                // All original IDs should be present
                const originalIds = new Set(solutions.map((s) => s.id));
                const sortedIds = new Set(sorted.map((s) => s.id));
                expect(sortedIds).toEqual(originalIds);
            },
        );

        fcTest.prop([nonEmptyFeaturedSolutionsArbitrary])(
            'solutions with null ranks should be at the end',
            (solutions) => {
                const sorted = sortFeaturedSolutionsByRank(solutions);

                // Find the first null rank position
                const firstNullIndex = sorted.findIndex((s) => s.competitionRank == null);

                if (firstNullIndex !== -1) {
                    // All elements after firstNullIndex should also have null ranks
                    for (let i = firstNullIndex; i < sorted.length; i++) {
                        expect(sorted[i].competitionRank).toBeNull();
                    }
                }
            },
        );

        it('should sort solutions by rank in ascending order', () => {
            const solutions: FeaturedSolutionResponse[] = [
                {
                    id: 1,
                    userId: 'u1',
                    username: 'user1',
                    competitionRank: 3,
                    description: '',
                    sourceFiles: [],
                },
                {
                    id: 2,
                    userId: 'u2',
                    username: 'user2',
                    competitionRank: 1,
                    description: '',
                    sourceFiles: [],
                },
                {
                    id: 3,
                    userId: 'u3',
                    username: 'user3',
                    competitionRank: 2,
                    description: '',
                    sourceFiles: [],
                },
            ];

            const sorted = sortFeaturedSolutionsByRank(solutions);

            expect(sorted[0].competitionRank).toBe(1);
            expect(sorted[1].competitionRank).toBe(2);
            expect(sorted[2].competitionRank).toBe(3);
        });

        it('should place undefined ranks at the end', () => {
            const solutions: FeaturedSolutionResponse[] = [
                {
                    id: 1,
                    userId: 'u1',
                    username: 'user1',
                    competitionRank: undefined,
                    description: '',
                    sourceFiles: [],
                },
                {
                    id: 2,
                    userId: 'u2',
                    username: 'user2',
                    competitionRank: 2,
                    description: '',
                    sourceFiles: [],
                },
                {
                    id: 3,
                    userId: 'u3',
                    username: 'user3',
                    competitionRank: 1,
                    description: '',
                    sourceFiles: [],
                },
            ];

            const sorted = sortFeaturedSolutionsByRank(solutions);

            expect(sorted[0].competitionRank).toBe(1);
            expect(sorted[1].competitionRank).toBe(2);
            expect(sorted[2].competitionRank).toBeUndefined();
        });

        it('should handle all undefined ranks', () => {
            const solutions: FeaturedSolutionResponse[] = [
                {
                    id: 1,
                    userId: 'u1',
                    username: 'user1',
                    competitionRank: undefined,
                    description: '',
                    sourceFiles: [],
                },
                {
                    id: 2,
                    userId: 'u2',
                    username: 'user2',
                    competitionRank: undefined,
                    description: '',
                    sourceFiles: [],
                },
            ];

            const sorted = sortFeaturedSolutionsByRank(solutions);

            expect(sorted.length).toBe(2);
            expect(sorted[0].competitionRank).toBeUndefined();
            expect(sorted[1].competitionRank).toBeUndefined();
        });

        it('should handle empty array', () => {
            const sorted = sortFeaturedSolutionsByRank([]);
            expect(sorted).toEqual([]);
        });

        it('should not mutate the original array', () => {
            const solutions: FeaturedSolutionResponse[] = [
                {
                    id: 1,
                    userId: 'u1',
                    username: 'user1',
                    competitionRank: 3,
                    description: '',
                    sourceFiles: [],
                },
                {
                    id: 2,
                    userId: 'u2',
                    username: 'user2',
                    competitionRank: 1,
                    description: '',
                    sourceFiles: [],
                },
            ];

            const originalOrder = solutions.map((s) => s.id);
            sortFeaturedSolutionsByRank(solutions);

            expect(solutions.map((s) => s.id)).toEqual(originalOrder);
        });
    });
});
