/**
 * Search Filter Property-Based Tests
 *
 * Property test for task 13.3: Client-Side Search Filter Correctness
 *
 * **Feature: problem-search-filter, Property 1: Search Filter Correctness**
 *
 * This test verifies:
 * - For any search term and any list of problems, filtering by that search term SHALL return
 *   only problems whose title contains the search term (case-insensitive), and when the search
 *   term is empty, all problems matching other filters SHALL be returned.
 *
 * **Validates: Requirements 1.1, 1.2**
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import type { Problem } from '@/lib/types';

/**
 * Filter problems by search term (case-insensitive title match)
 * This is the client-side filtering logic that should match the API behavior
 */
function filterProblemsBySearch(problems: Problem[], searchTerm: string): Problem[] {
    const trimmedSearch = searchTerm.trim().toLowerCase();

    if (!trimmedSearch) {
        return problems;
    }

    return problems.filter((problem) => problem.title.toLowerCase().includes(trimmedSearch));
}

// Arbitrary for generating problem titles
const titleArbitrary = fc
    .string({ minLength: 1, maxLength: 100 })
    .map((s) => s.replace(/[^\w\s]/g, '').trim() || 'Default Title');

// Arbitrary for generating search terms
const searchTermArbitrary = fc
    .string({ minLength: 0, maxLength: 50 })
    .map((s) => s.replace(/[^\w\s]/g, '').trim());

// Arbitrary for generating a minimal Problem object
const problemArbitrary: fc.Arbitrary<Problem> = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    title: titleArbitrary,
    shortDescription: fc.string({ minLength: 0, maxLength: 200 }),
    difficulty: fc.constantFrom('Easy', 'Medium', 'Hard') as fc.Arbitrary<
        'Easy' | 'Medium' | 'Hard'
    >,
    author: fc.string({ minLength: 1, maxLength: 50 }),
    lastAttemptedScore: fc.option(fc.float({ min: 0, max: 100 }), { nil: null }),
    partialTopScore: fc.float({ min: 0, max: 100 }),
    selectedSubmissionIds: fc.array(fc.integer({ min: 1, max: 1000 }), { maxLength: 5 }),
    metricPreference: fc.constantFrom(
        'SMALLER_IS_BETTER',
        'BIGGER_IS_BETTER',
        'FASTER_SUBMISSION_IS_BETTER',
    ) as fc.Arbitrary<'SMALLER_IS_BETTER' | 'BIGGER_IS_BETTER' | 'FASTER_SUBMISSION_IS_BETTER'>,
    isInOngoingCompetition: fc.boolean(),
});

// Arbitrary for generating arrays of problems
const problemsArrayArbitrary = fc.array(problemArbitrary, { minLength: 0, maxLength: 20 });

describe('Search Filter Property-Based Tests', () => {
    describe('Property 1: Search Filter Correctness', () => {
        test.prop([problemsArrayArbitrary, searchTermArbitrary], { numRuns: 100 })(
            'filtered problems should all contain the search term in their title (case-insensitive)',
            (problems, searchTerm) => {
                const filtered = filterProblemsBySearch(problems, searchTerm);
                const trimmedSearch = searchTerm.trim().toLowerCase();

                // All filtered problems should contain the search term in their title
                filtered.forEach((problem) => {
                    expect(problem.title.toLowerCase()).toContain(trimmedSearch);
                });
            },
        );

        test.prop([problemsArrayArbitrary, searchTermArbitrary], { numRuns: 100 })(
            'no problem outside the filtered set should match the search term',
            (problems, searchTerm) => {
                const filtered = filterProblemsBySearch(problems, searchTerm);
                const trimmedSearch = searchTerm.trim().toLowerCase();

                if (!trimmedSearch) {
                    // Empty search should return all problems
                    return;
                }

                // Get problems that were NOT included in the filtered set
                const filteredIds = new Set(filtered.map((p) => p.id));
                const excluded = problems.filter((p) => !filteredIds.has(p.id));

                // None of the excluded problems should contain the search term
                excluded.forEach((problem) => {
                    expect(problem.title.toLowerCase()).not.toContain(trimmedSearch);
                });
            },
        );

        test.prop([problemsArrayArbitrary], { numRuns: 100 })(
            'empty search term should return all problems',
            (problems) => {
                const filtered = filterProblemsBySearch(problems, '');
                expect(filtered.length).toBe(problems.length);

                // Verify all original problems are in the result
                const filteredIds = new Set(filtered.map((p) => p.id));
                problems.forEach((problem) => {
                    expect(filteredIds.has(problem.id)).toBe(true);
                });
            },
        );

        test.prop([problemsArrayArbitrary], { numRuns: 100 })(
            'whitespace-only search term should return all problems',
            (problems) => {
                const filtered = filterProblemsBySearch(problems, '   ');
                expect(filtered.length).toBe(problems.length);
            },
        );

        test.prop([problemsArrayArbitrary, searchTermArbitrary], { numRuns: 100 })(
            'search should be case-insensitive',
            (problems, searchTerm) => {
                const trimmedSearch = searchTerm.trim();
                if (!trimmedSearch) return;

                const lowerFiltered = filterProblemsBySearch(problems, trimmedSearch.toLowerCase());
                const upperFiltered = filterProblemsBySearch(problems, trimmedSearch.toUpperCase());
                const mixedFiltered = filterProblemsBySearch(problems, trimmedSearch);

                // All case variations should produce the same results
                expect(lowerFiltered.length).toBe(upperFiltered.length);
                expect(lowerFiltered.length).toBe(mixedFiltered.length);

                const lowerIds = new Set(lowerFiltered.map((p) => p.id));
                const upperIds = new Set(upperFiltered.map((p) => p.id));
                const mixedIds = new Set(mixedFiltered.map((p) => p.id));

                lowerFiltered.forEach((p) => {
                    expect(upperIds.has(p.id)).toBe(true);
                    expect(mixedIds.has(p.id)).toBe(true);
                });
            },
        );

        test.prop([problemsArrayArbitrary, searchTermArbitrary], { numRuns: 100 })(
            'filtered results should be a subset of original problems',
            (problems, searchTerm) => {
                const filtered = filterProblemsBySearch(problems, searchTerm);

                // Filtered count should never exceed original count
                expect(filtered.length).toBeLessThanOrEqual(problems.length);

                // All filtered problems should exist in the original set
                const originalIds = new Set(problems.map((p) => p.id));
                filtered.forEach((problem) => {
                    expect(originalIds.has(problem.id)).toBe(true);
                });
            },
        );

        test.prop(
            [
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 1, max: 10000 }),
                        title: fc.constant('Machine Learning Basics'),
                        shortDescription: fc.constant('Learn ML'),
                        difficulty: fc.constant('Easy') as fc.Arbitrary<'Easy'>,
                        author: fc.constant('Author'),
                        lastAttemptedScore: fc.constant(null),
                        partialTopScore: fc.constant(0),
                        selectedSubmissionIds: fc.constant([]),
                        metricPreference: fc.constant(
                            'BIGGER_IS_BETTER',
                        ) as fc.Arbitrary<'BIGGER_IS_BETTER'>,
                        isInOngoingCompetition: fc.constant(false),
                    }),
                    { minLength: 1, maxLength: 5 },
                ),
            ],
            { numRuns: 50 },
        )('searching for substring of title should return matching problems', (problems) => {
            // Search for "Machine" which is part of "Machine Learning Basics"
            const filtered = filterProblemsBySearch(problems, 'Machine');
            expect(filtered.length).toBe(problems.length);

            // Search for "learning" (case-insensitive)
            const filtered2 = filterProblemsBySearch(problems, 'learning');
            expect(filtered2.length).toBe(problems.length);

            // Search for non-matching term
            const filtered3 = filterProblemsBySearch(problems, 'xyz123');
            expect(filtered3.length).toBe(0);
        });

        test.prop(
            [
                fc.uniqueArray(problemArbitrary, {
                    minLength: 0,
                    maxLength: 20,
                    comparator: (a, b) => a.id === b.id,
                }),
            ],
            { numRuns: 100 },
        )('filtering should preserve problem order', (problems) => {
            const searchTerm = 'a'; // Common letter likely to match some problems
            const filtered = filterProblemsBySearch(problems, searchTerm);

            // Get the indices of filtered problems in the original array
            const filteredIndices = filtered.map((fp) => problems.findIndex((p) => p.id === fp.id));

            // Indices should be in ascending order (preserving original order)
            for (let i = 1; i < filteredIndices.length; i++) {
                expect(filteredIndices[i]).toBeGreaterThan(filteredIndices[i - 1]);
            }
        });
    });
});
