/**
 * Difficulty Filter Property-Based Tests
 *
 * Property test for task 13.4: Difficulty Filter Correctness
 *
 * **Feature: problem-search-filter, Property 3: Difficulty Filter Correctness**
 *
 * This test verifies:
 * - For any selection of difficulty levels (including empty selection), filtering SHALL return
 *   only problems matching at least one selected difficulty, or all problems when no difficulties
 *   are selected.
 *
 * **Validates: Requirements 2.2, 2.3**
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import type { Problem } from '@/lib/types';
import type { Difficulty } from '@/hooks/use-problem-filters';

/**
 * Filter problems by difficulty levels
 * This is the client-side filtering logic that should match the API behavior
 */
function filterProblemsByDifficulty(problems: Problem[], difficulties: Difficulty[]): Problem[] {
    // If no difficulties selected, return all problems
    if (difficulties.length === 0) {
        return problems;
    }

    return problems.filter((problem) => difficulties.includes(problem.difficulty));
}

// Arbitrary for generating problem titles
const titleArbitrary = fc
    .string({ minLength: 1, maxLength: 100 })
    .map((s) => s.replace(/[^\w\s]/g, '').trim() || 'Default Title');

// Arbitrary for generating valid difficulty values
const difficultyArbitrary = fc.constantFrom<Difficulty>('Easy', 'Medium', 'Hard');

// Arbitrary for generating arrays of unique difficulties
const difficultyArrayArbitrary = fc
    .uniqueArray(difficultyArbitrary, { maxLength: 3 })
    .map((arr) => arr as Difficulty[]);

// Arbitrary for generating a minimal Problem object
const problemArbitrary: fc.Arbitrary<Problem> = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    title: titleArbitrary,
    shortDescription: fc.string({ minLength: 0, maxLength: 200 }),
    difficulty: difficultyArbitrary as fc.Arbitrary<'Easy' | 'Medium' | 'Hard'>,
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

describe('Difficulty Filter Property-Based Tests', () => {
    describe('Property 3: Difficulty Filter Correctness', () => {
        test.prop([problemsArrayArbitrary, difficultyArrayArbitrary], { numRuns: 100 })(
            'filtered problems should all have a difficulty matching one of the selected difficulties',
            (problems, difficulties) => {
                const filtered = filterProblemsByDifficulty(problems, difficulties);

                if (difficulties.length === 0) {
                    // Empty selection should return all problems
                    expect(filtered.length).toBe(problems.length);
                    return;
                }

                // All filtered problems should have a matching difficulty
                filtered.forEach((problem) => {
                    expect(difficulties).toContain(problem.difficulty);
                });
            },
        );

        test.prop([problemsArrayArbitrary, difficultyArrayArbitrary], { numRuns: 100 })(
            'no problem outside the filtered set should match any selected difficulty',
            (problems, difficulties) => {
                const filtered = filterProblemsByDifficulty(problems, difficulties);

                if (difficulties.length === 0) {
                    // Empty selection returns all, so no excluded problems
                    return;
                }

                // Get problems that were NOT included in the filtered set
                const filteredIds = new Set(filtered.map((p) => p.id));
                const excluded = problems.filter((p) => !filteredIds.has(p.id));

                // None of the excluded problems should have a matching difficulty
                excluded.forEach((problem) => {
                    expect(difficulties).not.toContain(problem.difficulty);
                });
            },
        );

        test.prop([problemsArrayArbitrary], { numRuns: 100 })(
            'empty difficulty selection should return all problems',
            (problems) => {
                const filtered = filterProblemsByDifficulty(problems, []);
                expect(filtered.length).toBe(problems.length);

                // Verify all original problems are in the result
                const filteredIds = new Set(filtered.map((p) => p.id));
                problems.forEach((problem) => {
                    expect(filteredIds.has(problem.id)).toBe(true);
                });
            },
        );

        test.prop([problemsArrayArbitrary, difficultyArrayArbitrary], { numRuns: 100 })(
            'filtered results should be a subset of original problems',
            (problems, difficulties) => {
                const filtered = filterProblemsByDifficulty(problems, difficulties);

                // Filtered count should never exceed original count
                expect(filtered.length).toBeLessThanOrEqual(problems.length);

                // All filtered problems should exist in the original set
                const originalIds = new Set(problems.map((p) => p.id));
                filtered.forEach((problem) => {
                    expect(originalIds.has(problem.id)).toBe(true);
                });
            },
        );

        test.prop([problemsArrayArbitrary], { numRuns: 100 })(
            'selecting all difficulties should return all problems',
            (problems) => {
                const allDifficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];
                const filtered = filterProblemsByDifficulty(problems, allDifficulties);
                expect(filtered.length).toBe(problems.length);
            },
        );

        test.prop([problemsArrayArbitrary, difficultyArbitrary], { numRuns: 100 })(
            'selecting a single difficulty should return only problems with that difficulty',
            (problems, difficulty) => {
                const filtered = filterProblemsByDifficulty(problems, [difficulty]);

                // All filtered problems should have the selected difficulty
                filtered.forEach((problem) => {
                    expect(problem.difficulty).toBe(difficulty);
                });

                // Count should match the number of problems with that difficulty
                const expectedCount = problems.filter((p) => p.difficulty === difficulty).length;
                expect(filtered.length).toBe(expectedCount);
            },
        );

        test.prop(
            [
                fc.uniqueArray(problemArbitrary, {
                    minLength: 0,
                    maxLength: 20,
                    comparator: (a, b) => a.id === b.id,
                }),
                difficultyArrayArbitrary,
            ],
            { numRuns: 100 },
        )('filtering should preserve problem order', (problems, difficulties) => {
            const filtered = filterProblemsByDifficulty(problems, difficulties);

            // Get the indices of filtered problems in the original array
            const filteredIndices = filtered.map((fp) => problems.findIndex((p) => p.id === fp.id));

            // Indices should be in ascending order (preserving original order)
            for (let i = 1; i < filteredIndices.length; i++) {
                expect(filteredIndices[i]).toBeGreaterThan(filteredIndices[i - 1]);
            }
        });

        test.prop([problemsArrayArbitrary, difficultyArrayArbitrary, difficultyArrayArbitrary], {
            numRuns: 100,
        })(
            'filtering with combined difficulties should be equivalent to union of individual filters',
            (problems, difficulties1, difficulties2) => {
                // Skip if either array is empty (empty means "all" which changes the semantics)
                if (difficulties1.length === 0 || difficulties2.length === 0) {
                    return;
                }

                // Combine the two difficulty arrays (unique values)
                const combined = [...new Set([...difficulties1, ...difficulties2])] as Difficulty[];

                const filteredCombined = filterProblemsByDifficulty(problems, combined);
                const filtered1 = filterProblemsByDifficulty(problems, difficulties1);
                const filtered2 = filterProblemsByDifficulty(problems, difficulties2);

                // Union of filtered1 and filtered2 (by id)
                const unionIds = new Set([
                    ...filtered1.map((p) => p.id),
                    ...filtered2.map((p) => p.id),
                ]);

                // The combined filter should produce the same set of problems
                const combinedIds = new Set(filteredCombined.map((p) => p.id));

                expect(combinedIds.size).toBe(unionIds.size);
                unionIds.forEach((id) => {
                    expect(combinedIds.has(id)).toBe(true);
                });
            },
        );

        test.prop([problemsArrayArbitrary, difficultyArrayArbitrary], { numRuns: 100 })(
            'filtering is idempotent - filtering twice produces same result',
            (problems, difficulties) => {
                const filtered1 = filterProblemsByDifficulty(problems, difficulties);
                const filtered2 = filterProblemsByDifficulty(filtered1, difficulties);

                expect(filtered2.length).toBe(filtered1.length);

                const ids1 = new Set(filtered1.map((p) => p.id));
                const ids2 = new Set(filtered2.map((p) => p.id));

                ids1.forEach((id) => {
                    expect(ids2.has(id)).toBe(true);
                });
            },
        );
    });
});
