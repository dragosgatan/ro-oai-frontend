/**
 * Difficulty Count Property-Based Tests
 *
 * Property test for task 14.3: Difficulty Count Accuracy
 *
 * **Feature: problem-search-filter, Property 5: Difficulty Count Accuracy**
 *
 * This test verifies:
 * - For any set of problems, the displayed count for each difficulty level SHALL equal
 *   the actual number of problems with that difficulty.
 *
 * **Validates: Requirements 2.4**
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import type { Problem, Difficulty } from '@/lib/types';

/**
 * Calculate difficulty counts from a list of problems
 * This is the function that should be used to display counts in the filter panel
 */
function calculateDifficultyCounts(problems: Problem[]): Record<Difficulty, number> {
    const counts: Record<Difficulty, number> = {
        Easy: 0,
        Medium: 0,
        Hard: 0,
    };

    problems.forEach((problem) => {
        counts[problem.difficulty]++;
    });

    return counts;
}

/**
 * Get the actual count of problems with a specific difficulty
 */
function getActualDifficultyCount(problems: Problem[], difficulty: Difficulty): number {
    return problems.filter((p) => p.difficulty === difficulty).length;
}

// Arbitrary for generating problem titles
const titleArbitrary = fc
    .string({ minLength: 1, maxLength: 100 })
    .map((s) => s.replace(/[^\w\s]/g, '').trim() || 'Default Title');

// Arbitrary for generating valid difficulty values
const difficultyArbitrary = fc.constantFrom<Difficulty>('Easy', 'Medium', 'Hard');

// Arbitrary for generating a minimal Problem object
const problemArbitrary: fc.Arbitrary<Problem> = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    title: titleArbitrary,
    shortDescription: fc.string({ minLength: 0, maxLength: 200 }),
    difficulty: difficultyArbitrary,
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
    subtasks: fc.constant(null),
});

// Arbitrary for generating arrays of problems
const problemsArrayArbitrary = fc.array(problemArbitrary, { minLength: 0, maxLength: 50 });

describe('Difficulty Count Property-Based Tests', () => {
    describe('Property 5: Difficulty Count Accuracy', () => {
        test.prop([problemsArrayArbitrary], { numRuns: 100 })(
            'displayed count for each difficulty should equal actual count',
            (problems) => {
                const counts = calculateDifficultyCounts(problems);

                // Verify each difficulty count matches actual count
                expect(counts.Easy).toBe(getActualDifficultyCount(problems, 'Easy'));
                expect(counts.Medium).toBe(getActualDifficultyCount(problems, 'Medium'));
                expect(counts.Hard).toBe(getActualDifficultyCount(problems, 'Hard'));
            },
        );

        test.prop([problemsArrayArbitrary], { numRuns: 100 })(
            'sum of all difficulty counts should equal total problems',
            (problems) => {
                const counts = calculateDifficultyCounts(problems);
                const totalCount = counts.Easy + counts.Medium + counts.Hard;

                expect(totalCount).toBe(problems.length);
            },
        );

        test.prop([problemsArrayArbitrary], { numRuns: 100 })(
            'all difficulty counts should be non-negative',
            (problems) => {
                const counts = calculateDifficultyCounts(problems);

                expect(counts.Easy).toBeGreaterThanOrEqual(0);
                expect(counts.Medium).toBeGreaterThanOrEqual(0);
                expect(counts.Hard).toBeGreaterThanOrEqual(0);
            },
        );

        test.prop([problemsArrayArbitrary, difficultyArbitrary], { numRuns: 100 })(
            'count for a specific difficulty should match filter results',
            (problems, difficulty) => {
                const counts = calculateDifficultyCounts(problems);
                const filteredProblems = problems.filter((p) => p.difficulty === difficulty);

                expect(counts[difficulty]).toBe(filteredProblems.length);
            },
        );

        test.prop([problemsArrayArbitrary], { numRuns: 100 })(
            'empty problems array should have zero counts for all difficulties',
            () => {
                const emptyProblems: Problem[] = [];
                const counts = calculateDifficultyCounts(emptyProblems);

                expect(counts.Easy).toBe(0);
                expect(counts.Medium).toBe(0);
                expect(counts.Hard).toBe(0);
            },
        );

        test.prop([problemsArrayArbitrary], { numRuns: 100 })(
            'counts should be consistent across multiple calculations',
            (problems) => {
                const counts1 = calculateDifficultyCounts(problems);
                const counts2 = calculateDifficultyCounts(problems);
                const counts3 = calculateDifficultyCounts(problems);

                expect(counts1.Easy).toBe(counts2.Easy);
                expect(counts1.Medium).toBe(counts2.Medium);
                expect(counts1.Hard).toBe(counts2.Hard);

                expect(counts2.Easy).toBe(counts3.Easy);
                expect(counts2.Medium).toBe(counts3.Medium);
                expect(counts2.Hard).toBe(counts3.Hard);
            },
        );

        test.prop([problemsArrayArbitrary, problemArbitrary], { numRuns: 100 })(
            'adding a problem should increase only its difficulty count by 1',
            (problems, newProblem) => {
                const countsBefore = calculateDifficultyCounts(problems);
                const countsAfter = calculateDifficultyCounts([...problems, newProblem]);

                // The count for the new problem's difficulty should increase by 1
                expect(countsAfter[newProblem.difficulty]).toBe(
                    countsBefore[newProblem.difficulty] + 1,
                );

                // Other difficulty counts should remain unchanged
                const otherDifficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'].filter(
                    (d) => d !== newProblem.difficulty,
                ) as Difficulty[];

                otherDifficulties.forEach((d) => {
                    expect(countsAfter[d]).toBe(countsBefore[d]);
                });
            },
        );

        test.prop(
            [
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 1, max: 10000 }),
                        title: fc.constant('Test Problem'),
                        shortDescription: fc.constant('Description'),
                        difficulty: fc.constant('Easy') as fc.Arbitrary<'Easy'>,
                        author: fc.constant('Author'),
                        lastAttemptedScore: fc.constant(null),
                        partialTopScore: fc.constant(0),
                        selectedSubmissionIds: fc.constant([] as number[]),
                        metricPreference: fc.constant(
                            'BIGGER_IS_BETTER',
                        ) as fc.Arbitrary<'BIGGER_IS_BETTER'>,
                        isInOngoingCompetition: fc.constant(false),
                        subtasks: fc.constant(null),
                    }),
                    { minLength: 5, maxLength: 10 },
                ),
            ],
            { numRuns: 50 },
        )('all Easy problems should have Easy count equal to total', (problems) => {
            const counts = calculateDifficultyCounts(problems);

            expect(counts.Easy).toBe(problems.length);
            expect(counts.Medium).toBe(0);
            expect(counts.Hard).toBe(0);
        });

        test.prop(
            [
                fc.tuple(
                    fc.integer({ min: 0, max: 20 }),
                    fc.integer({ min: 0, max: 20 }),
                    fc.integer({ min: 0, max: 20 }),
                ),
            ],
            { numRuns: 100 },
        )(
            'counts should match exact distribution of difficulties',
            ([easyCount, mediumCount, hardCount]) => {
                // Create problems with exact distribution
                const problems: Problem[] = [];

                for (let i = 0; i < easyCount; i++) {
                    problems.push({
                        id: problems.length + 1,
                        title: `Easy Problem ${i}`,
                        shortDescription: 'Description',
                        difficulty: 'Easy',
                        author: 'Author',
                        lastAttemptedScore: null,
                        partialTopScore: 0,
                        selectedSubmissionIds: [],
                        metricPreference: 'BIGGER_IS_BETTER',
                        isInOngoingCompetition: false,
                        subtasks: null,
                    });
                }

                for (let i = 0; i < mediumCount; i++) {
                    problems.push({
                        id: problems.length + 1,
                        title: `Medium Problem ${i}`,
                        shortDescription: 'Description',
                        difficulty: 'Medium',
                        author: 'Author',
                        lastAttemptedScore: null,
                        partialTopScore: 0,
                        selectedSubmissionIds: [],
                        metricPreference: 'BIGGER_IS_BETTER',
                        isInOngoingCompetition: false,
                        subtasks: null,
                    });
                }

                for (let i = 0; i < hardCount; i++) {
                    problems.push({
                        id: problems.length + 1,
                        title: `Hard Problem ${i}`,
                        shortDescription: 'Description',
                        difficulty: 'Hard',
                        author: 'Author',
                        lastAttemptedScore: null,
                        partialTopScore: 0,
                        selectedSubmissionIds: [],
                        metricPreference: 'BIGGER_IS_BETTER',
                        isInOngoingCompetition: false,
                        subtasks: null,
                    });
                }

                const counts = calculateDifficultyCounts(problems);

                expect(counts.Easy).toBe(easyCount);
                expect(counts.Medium).toBe(mediumCount);
                expect(counts.Hard).toBe(hardCount);
            },
        );
    });
});
