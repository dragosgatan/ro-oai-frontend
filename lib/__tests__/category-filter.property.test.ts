/**
 * Category Filter Property-Based Tests
 *
 * Property test for task 13.5: Category Filter Correctness
 *
 * **Feature: problem-search-filter, Property 9: Category Filter Correctness**
 *
 * This test verifies:
 * - For any selection of categories (including empty selection), filtering SHALL return
 *   only problems belonging to at least one selected category, or all problems when no
 *   categories are selected.
 *
 * **Validates: Requirements 4.2, 4.3**
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import type { Problem } from '@/lib/types';
import type { Category } from '@/components/problem-filter-panel';

/**
 * Extended Problem type with categories for testing
 */
type ProblemWithCategories = Problem & {
    categories: Category[];
};

/**
 * Filter problems by category IDs
 * This is the client-side filtering logic that should match the API behavior
 */
function filterProblemsByCategory(
    problems: ProblemWithCategories[],
    categoryIds: number[],
): ProblemWithCategories[] {
    // If no categories selected, return all problems
    if (categoryIds.length === 0) {
        return problems;
    }

    return problems.filter((problem) =>
        problem.categories.some((cat) => categoryIds.includes(cat.id)),
    );
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
    maxLength: 5,
    comparator: (a, b) => a.id === b.id,
});

// Arbitrary for generating arrays of unique category IDs
const categoryIdsArrayArbitrary = fc.uniqueArray(categoryIdArbitrary, { maxLength: 5 });

// Arbitrary for generating a minimal Problem with categories
const problemWithCategoriesArbitrary: fc.Arbitrary<ProblemWithCategories> = fc.record({
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
    categories: categoriesArrayArbitrary,
    subtasks: fc.constant(null),
});

// Arbitrary for generating arrays of problems with categories
const problemsWithCategoriesArrayArbitrary = fc.array(problemWithCategoriesArbitrary, {
    minLength: 0,
    maxLength: 20,
});

describe('Category Filter Property-Based Tests', () => {
    describe('Property 9: Category Filter Correctness', () => {
        test.prop([problemsWithCategoriesArrayArbitrary, categoryIdsArrayArbitrary], {
            numRuns: 100,
        })(
            'filtered problems should all belong to at least one selected category',
            (problems, categoryIds) => {
                const filtered = filterProblemsByCategory(problems, categoryIds);

                if (categoryIds.length === 0) {
                    // Empty selection should return all problems
                    expect(filtered.length).toBe(problems.length);
                    return;
                }

                // All filtered problems should have at least one matching category
                filtered.forEach((problem) => {
                    const hasMatchingCategory = problem.categories.some((cat) =>
                        categoryIds.includes(cat.id),
                    );
                    expect(hasMatchingCategory).toBe(true);
                });
            },
        );

        test.prop([problemsWithCategoriesArrayArbitrary, categoryIdsArrayArbitrary], {
            numRuns: 100,
        })(
            'no problem outside the filtered set should belong to any selected category',
            (problems, categoryIds) => {
                const filtered = filterProblemsByCategory(problems, categoryIds);

                if (categoryIds.length === 0) {
                    // Empty selection returns all, so no excluded problems
                    return;
                }

                // Get problems that were NOT included in the filtered set
                const filteredIds = new Set(filtered.map((p) => p.id));
                const excluded = problems.filter((p) => !filteredIds.has(p.id));

                // None of the excluded problems should have a matching category
                excluded.forEach((problem) => {
                    const hasMatchingCategory = problem.categories.some((cat) =>
                        categoryIds.includes(cat.id),
                    );
                    expect(hasMatchingCategory).toBe(false);
                });
            },
        );

        test.prop([problemsWithCategoriesArrayArbitrary], { numRuns: 100 })(
            'empty category selection should return all problems',
            (problems) => {
                const filtered = filterProblemsByCategory(problems, []);
                expect(filtered.length).toBe(problems.length);

                // Verify all original problems are in the result
                const filteredIds = new Set(filtered.map((p) => p.id));
                problems.forEach((problem) => {
                    expect(filteredIds.has(problem.id)).toBe(true);
                });
            },
        );

        test.prop([problemsWithCategoriesArrayArbitrary, categoryIdsArrayArbitrary], {
            numRuns: 100,
        })('filtered results should be a subset of original problems', (problems, categoryIds) => {
            const filtered = filterProblemsByCategory(problems, categoryIds);

            // Filtered count should never exceed original count
            expect(filtered.length).toBeLessThanOrEqual(problems.length);

            // All filtered problems should exist in the original set
            const originalIds = new Set(problems.map((p) => p.id));
            filtered.forEach((problem) => {
                expect(originalIds.has(problem.id)).toBe(true);
            });
        });

        test.prop([problemsWithCategoriesArrayArbitrary, categoryIdArbitrary], { numRuns: 100 })(
            'selecting a single category should return only problems with that category',
            (problems, categoryId) => {
                const filtered = filterProblemsByCategory(problems, [categoryId]);

                // All filtered problems should have the selected category
                filtered.forEach((problem) => {
                    const hasCategory = problem.categories.some((cat) => cat.id === categoryId);
                    expect(hasCategory).toBe(true);
                });

                // Count should match the number of problems with that category
                const expectedCount = problems.filter((p) =>
                    p.categories.some((cat) => cat.id === categoryId),
                ).length;
                expect(filtered.length).toBe(expectedCount);
            },
        );

        test.prop(
            [
                fc.uniqueArray(problemWithCategoriesArbitrary, {
                    minLength: 0,
                    maxLength: 20,
                    comparator: (a, b) => a.id === b.id,
                }),
                categoryIdsArrayArbitrary,
            ],
            { numRuns: 100 },
        )('filtering should preserve problem order', (problems, categoryIds) => {
            const filtered = filterProblemsByCategory(problems, categoryIds);

            // Get the indices of filtered problems in the original array
            const filteredIndices = filtered.map((fp) => problems.findIndex((p) => p.id === fp.id));

            // Indices should be in ascending order (preserving original order)
            for (let i = 1; i < filteredIndices.length; i++) {
                expect(filteredIndices[i]).toBeGreaterThan(filteredIndices[i - 1]);
            }
        });

        test.prop(
            [
                problemsWithCategoriesArrayArbitrary,
                categoryIdsArrayArbitrary,
                categoryIdsArrayArbitrary,
            ],
            { numRuns: 100 },
        )(
            'filtering with combined categories should be equivalent to union of individual filters',
            (problems, categoryIds1, categoryIds2) => {
                // Skip if either array is empty (empty means "all" which changes the semantics)
                if (categoryIds1.length === 0 || categoryIds2.length === 0) {
                    return;
                }

                // Combine the two category ID arrays (unique values)
                const combined = [...new Set([...categoryIds1, ...categoryIds2])];

                const filteredCombined = filterProblemsByCategory(problems, combined);
                const filtered1 = filterProblemsByCategory(problems, categoryIds1);
                const filtered2 = filterProblemsByCategory(problems, categoryIds2);

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

        test.prop([problemsWithCategoriesArrayArbitrary, categoryIdsArrayArbitrary], {
            numRuns: 100,
        })(
            'filtering is idempotent - filtering twice produces same result',
            (problems, categoryIds) => {
                const filtered1 = filterProblemsByCategory(problems, categoryIds);
                const filtered2 = filterProblemsByCategory(filtered1, categoryIds);

                expect(filtered2.length).toBe(filtered1.length);

                const ids1 = new Set(filtered1.map((p) => p.id));
                const ids2 = new Set(filtered2.map((p) => p.id));

                ids1.forEach((id) => {
                    expect(ids2.has(id)).toBe(true);
                });
            },
        );

        test.prop([problemsWithCategoriesArrayArbitrary], { numRuns: 100 })(
            'problems with no categories should not match any category filter',
            (problems) => {
                // Create a version where some problems have no categories
                const problemsWithEmpty = problems.map((p, i) =>
                    i % 2 === 0 ? { ...p, categories: [] } : p,
                );

                // Get all category IDs from problems that have categories
                const allCategoryIds = problemsWithEmpty
                    .flatMap((p) => p.categories.map((c) => c.id))
                    .filter((id, i, arr) => arr.indexOf(id) === i);

                if (allCategoryIds.length === 0) {
                    // No categories to filter by
                    return;
                }

                const filtered = filterProblemsByCategory(problemsWithEmpty, allCategoryIds);

                // Problems with no categories should not be in the filtered result
                filtered.forEach((problem) => {
                    expect(problem.categories.length).toBeGreaterThan(0);
                });
            },
        );
    });
});
