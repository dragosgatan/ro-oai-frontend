/**
 * Category Count Property-Based Tests
 *
 * Property test for task 14.4: Category Count Accuracy
 *
 * **Feature: problem-search-filter, Property 11: Category Count Accuracy**
 *
 * This test verifies:
 * - For any set of problems and categories, the displayed count for each category SHALL equal
 *   the actual number of problems associated with that category.
 *
 * **Validates: Requirements 4.4**
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import type { Problem, Category } from '@/lib/types';

/**
 * Extended Problem type with categories for testing
 */
type ProblemWithCategories = Problem & {
    categories: Category[];
};

/**
 * Calculate category counts from a list of problems
 * This is the function that should be used to display counts in the filter panel
 */
function calculateCategoryCounts(
    problems: ProblemWithCategories[],
    categories: Category[],
): Record<number, number> {
    const counts: Record<number, number> = {};

    // Initialize counts for all categories
    categories.forEach((cat) => {
        counts[cat.id] = 0;
    });

    // Count problems for each category
    problems.forEach((problem) => {
        problem.categories.forEach((cat) => {
            if (counts[cat.id] !== undefined) {
                counts[cat.id]++;
            }
        });
    });

    return counts;
}

/**
 * Get the actual count of problems with a specific category
 */
function getActualCategoryCount(problems: ProblemWithCategories[], categoryId: number): number {
    return problems.filter((p) => p.categories.some((cat) => cat.id === categoryId)).length;
}

// Arbitrary for generating problem titles
const titleArbitrary = fc
    .string({ minLength: 1, maxLength: 100 })
    .map((s) => s.replace(/[^\w\s]/g, '').trim() || 'Default Title');

// Arbitrary for generating valid difficulty values
const difficultyArbitrary = fc.constantFrom('Easy', 'Medium', 'Hard') as fc.Arbitrary<
    'Easy' | 'Medium' | 'Hard'
>;

// Arbitrary for generating category IDs
const categoryIdArbitrary = fc.integer({ min: 1, max: 100 });

// Arbitrary for generating a Category
const categoryArbitrary: fc.Arbitrary<Category> = fc.record({
    id: categoryIdArbitrary,
    name: fc
        .string({ minLength: 1, maxLength: 50 })
        .map((s) => s.replace(/[^\w\s]/g, '').trim() || 'Category'),
    description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: null }),
    problemCount: fc.integer({ min: 0, max: 1000 }),
});

// Arbitrary for generating arrays of unique categories (by id)
const categoriesArrayArbitrary = fc.uniqueArray(categoryArbitrary, {
    minLength: 1,
    maxLength: 10,
    comparator: (a, b) => a.id === b.id,
});

// Arbitrary for generating a minimal Problem with categories
const problemWithCategoriesArbitrary = (
    availableCategories: Category[],
): fc.Arbitrary<ProblemWithCategories> =>
    fc.record({
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
        categories: fc.subarray(availableCategories, {
            minLength: 0,
            maxLength: availableCategories.length,
        }),
        subtasks: fc.constant(null),
    });

// Combined arbitrary that generates categories first, then problems using those categories
const problemsAndCategoriesArbitrary = categoriesArrayArbitrary.chain((categories) =>
    fc.tuple(
        fc.array(problemWithCategoriesArbitrary(categories), { minLength: 0, maxLength: 20 }),
        fc.constant(categories),
    ),
);

describe('Category Count Property-Based Tests', () => {
    describe('Property 11: Category Count Accuracy', () => {
        test.prop([problemsAndCategoriesArbitrary], { numRuns: 100 })(
            'displayed count for each category should equal actual count',
            ([problems, categories]) => {
                const counts = calculateCategoryCounts(problems, categories);

                // Verify each category count matches actual count
                categories.forEach((category) => {
                    const actualCount = getActualCategoryCount(problems, category.id);
                    expect(counts[category.id]).toBe(actualCount);
                });
            },
        );

        test.prop([problemsAndCategoriesArbitrary], { numRuns: 100 })(
            'all category counts should be non-negative',
            ([problems, categories]) => {
                const counts = calculateCategoryCounts(problems, categories);

                categories.forEach((category) => {
                    expect(counts[category.id]).toBeGreaterThanOrEqual(0);
                });
            },
        );

        test.prop([problemsAndCategoriesArbitrary], { numRuns: 100 })(
            'category count should not exceed total problems',
            ([problems, categories]) => {
                const counts = calculateCategoryCounts(problems, categories);

                categories.forEach((category) => {
                    expect(counts[category.id]).toBeLessThanOrEqual(problems.length);
                });
            },
        );

        test.prop([categoriesArrayArbitrary], { numRuns: 100 })(
            'empty problems array should have zero counts for all categories',
            (categories) => {
                const emptyProblems: ProblemWithCategories[] = [];
                const counts = calculateCategoryCounts(emptyProblems, categories);

                categories.forEach((category) => {
                    expect(counts[category.id]).toBe(0);
                });
            },
        );

        test.prop([problemsAndCategoriesArbitrary], { numRuns: 100 })(
            'counts should be consistent across multiple calculations',
            ([problems, categories]) => {
                const counts1 = calculateCategoryCounts(problems, categories);
                const counts2 = calculateCategoryCounts(problems, categories);
                const counts3 = calculateCategoryCounts(problems, categories);

                categories.forEach((category) => {
                    expect(counts1[category.id]).toBe(counts2[category.id]);
                    expect(counts2[category.id]).toBe(counts3[category.id]);
                });
            },
        );

        test.prop([problemsAndCategoriesArbitrary], { numRuns: 100 })(
            'problem with multiple categories should be counted in each',
            ([problems, categories]) => {
                const counts = calculateCategoryCounts(problems, categories);

                // For each problem, verify it's counted in each of its categories
                problems.forEach((problem) => {
                    problem.categories.forEach((cat) => {
                        // The count for this category should be at least 1
                        // (since this problem has this category)
                        if (categories.some((c) => c.id === cat.id)) {
                            expect(counts[cat.id]).toBeGreaterThanOrEqual(1);
                        }
                    });
                });
            },
        );

        test.prop([fc.tuple(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 0, max: 10 }))], {
            numRuns: 100,
        })(
            'counts should match exact distribution when all problems have same category',
            ([categoryId, problemCount]) => {
                const category: Category = {
                    id: categoryId,
                    name: 'Test Category',
                    description: null,
                    problemCount: 0,
                };

                const problems: ProblemWithCategories[] = [];
                for (let i = 0; i < problemCount; i++) {
                    problems.push({
                        id: i + 1,
                        title: `Problem ${i}`,
                        shortDescription: 'Description',
                        difficulty: 'Easy',
                        author: 'Author',
                        lastAttemptedScore: null,
                        partialTopScore: 0,
                        selectedSubmissionIds: [],
                        metricPreference: 'BIGGER_IS_BETTER',
                        isInOngoingCompetition: false,
                        categories: [category],
                        subtasks: null,
                    });
                }

                const counts = calculateCategoryCounts(problems, [category]);
                expect(counts[categoryId]).toBe(problemCount);
            },
        );

        test.prop(
            [
                fc.tuple(
                    fc.integer({ min: 1, max: 100 }),
                    fc.integer({ min: 101, max: 200 }),
                    fc.integer({ min: 0, max: 10 }),
                    fc.integer({ min: 0, max: 10 }),
                    fc.integer({ min: 0, max: 10 }),
                ),
            ],
            { numRuns: 100 },
        )(
            'counts should be accurate with multiple categories and varying distributions',
            ([cat1Id, cat2Id, onlyCat1Count, onlyCat2Count, bothCatsCount]) => {
                const category1: Category = {
                    id: cat1Id,
                    name: 'Category 1',
                    description: null,
                    problemCount: 0,
                };
                const category2: Category = {
                    id: cat2Id,
                    name: 'Category 2',
                    description: null,
                    problemCount: 0,
                };

                const problems: ProblemWithCategories[] = [];
                let id = 1;

                // Problems with only category 1
                for (let i = 0; i < onlyCat1Count; i++) {
                    problems.push({
                        id: id++,
                        title: `Cat1 Only ${i}`,
                        shortDescription: 'Description',
                        difficulty: 'Easy',
                        author: 'Author',
                        lastAttemptedScore: null,
                        partialTopScore: 0,
                        selectedSubmissionIds: [],
                        metricPreference: 'BIGGER_IS_BETTER',
                        isInOngoingCompetition: false,
                        categories: [category1],
                        subtasks: null,
                    });
                }

                // Problems with only category 2
                for (let i = 0; i < onlyCat2Count; i++) {
                    problems.push({
                        id: id++,
                        title: `Cat2 Only ${i}`,
                        shortDescription: 'Description',
                        difficulty: 'Medium',
                        author: 'Author',
                        lastAttemptedScore: null,
                        partialTopScore: 0,
                        selectedSubmissionIds: [],
                        metricPreference: 'BIGGER_IS_BETTER',
                        isInOngoingCompetition: false,
                        categories: [category2],
                        subtasks: null,
                    });
                }

                // Problems with both categories
                for (let i = 0; i < bothCatsCount; i++) {
                    problems.push({
                        id: id++,
                        title: `Both Cats ${i}`,
                        shortDescription: 'Description',
                        difficulty: 'Hard',
                        author: 'Author',
                        lastAttemptedScore: null,
                        partialTopScore: 0,
                        selectedSubmissionIds: [],
                        metricPreference: 'BIGGER_IS_BETTER',
                        isInOngoingCompetition: false,
                        categories: [category1, category2],
                        subtasks: null,
                    });
                }

                const counts = calculateCategoryCounts(problems, [category1, category2]);

                // Category 1 count = problems with only cat1 + problems with both
                expect(counts[cat1Id]).toBe(onlyCat1Count + bothCatsCount);

                // Category 2 count = problems with only cat2 + problems with both
                expect(counts[cat2Id]).toBe(onlyCat2Count + bothCatsCount);
            },
        );

        test.prop([problemsAndCategoriesArbitrary], { numRuns: 100 })(
            'problems with no categories should not affect any category count',
            ([problems, categories]) => {
                // Create a version where some problems have no categories
                const problemsWithEmpty = problems.map((p, i) =>
                    i % 2 === 0 ? { ...p, categories: [] } : p,
                );

                const countsOriginal = calculateCategoryCounts(problems, categories);
                const countsWithEmpty = calculateCategoryCounts(problemsWithEmpty, categories);

                // Problems with empty categories should reduce counts
                categories.forEach((category) => {
                    // Count should be less than or equal to original
                    expect(countsWithEmpty[category.id]).toBeLessThanOrEqual(
                        countsOriginal[category.id],
                    );
                });
            },
        );
    });
});
