/**
 * Active Filters Property-Based Tests
 *
 * Property test for task 12.3: Active Filters Display Correctness
 *
 * **Feature: problem-search-filter, Property 12: Active Filters Display Correctness**
 *
 * This test verifies:
 * - For any combination of active filters, the Active_Filters component SHALL display
 *   a chip/badge for each active filter value.
 *
 * **Validates: Requirements 5.3**
 */

import { describe, expect, vi, afterEach } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import type { ProblemFilters, Difficulty } from '@/hooks/use-problem-filters';
import type { Category, CompetitionFilterOption } from '@/lib/types';

// Mock next-intl
vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => {
        const translations: Record<string, string> = {
            'filters.activeFilters': 'Active filters',
            'filters.removeFilter': 'Remove filter',
            'filters.search': 'Search',
            'filters.clearAll': 'Clear all filters',
            'filters.clearAllAriaLabel': 'Clear all active filters',
            'difficulty.easy': 'Easy',
            'difficulty.medium': 'Medium',
            'difficulty.hard': 'Hard',
        };
        return translations[key] ?? key;
    },
}));

// Import after mocking
import { ActiveFilters } from '../active-filters';

// Cleanup after each test to prevent multiple elements
afterEach(() => {
    cleanup();
});

// Arbitrary for generating valid difficulty values
const difficultyArbitrary = fc.constantFrom<Difficulty>('Easy', 'Medium', 'Hard');

// Arbitrary for generating arrays of unique difficulties
const difficultyArrayArbitrary = fc
    .uniqueArray(difficultyArbitrary, { maxLength: 3 })
    .map((arr) => arr as Difficulty[]);

// Arbitrary for generating positive category IDs
const categoryIdArbitrary = fc.integer({ min: 1, max: 100 });

// Arbitrary for generating arrays of unique category IDs
const categoryIdsArrayArbitrary = fc.uniqueArray(categoryIdArbitrary, { maxLength: 5 });

// Arbitrary for generating search strings
const searchStringArbitrary = fc
    .string({ minLength: 0, maxLength: 30 })
    .map((s) => s.replace(/[^a-zA-Z0-9 ]/g, '').trim());

// Arbitrary for generating positive competition IDs
const competitionIdArbitrary = fc.integer({ min: 1, max: 100 });

// Arbitrary for generating arrays of unique competition IDs
const competitionIdsArrayArbitrary = fc.uniqueArray(competitionIdArbitrary, { maxLength: 5 });

// Arbitrary for generating attempted status
const attemptedStatusArbitrary = fc.constantFrom<'attempted' | 'unattempted' | null>(
    'attempted',
    'unattempted',
    null,
);

// Arbitrary for generating complete filter state
const problemFiltersArbitrary: fc.Arbitrary<ProblemFilters> = fc.record({
    search: searchStringArbitrary,
    difficulty: difficultyArrayArbitrary,
    categoryIds: categoryIdsArrayArbitrary,
    competitionIds: competitionIdsArrayArbitrary,
    attemptedStatus: attemptedStatusArbitrary,
});

// Arbitrary for generating categories that match the filter categoryIds
const categoriesFromIdsArbitrary = (categoryIds: number[]): Category[] => {
    return categoryIds.map((id) => ({
        id,
        name: `Category ${id}`,
        description: null,
        problemCount: Math.floor(Math.random() * 100),
    }));
};

// Arbitrary for generating competitions that match the filter competitionIds
const competitionsFromIdsArbitrary = (competitionIds: number[]): CompetitionFilterOption[] => {
    return competitionIds.map((id) => ({
        id,
        name: `Competition ${id}`,
        problemCount: Math.floor(Math.random() * 100),
    }));
};

describe('Active Filters Property-Based Tests', () => {
    describe('Property 12: Active Filters Display Correctness', () => {
        test.prop([problemFiltersArbitrary], { numRuns: 100 })(
            'should display a chip for each active filter value',
            (filters) => {
                cleanup(); // Ensure clean state
                const categories = categoriesFromIdsArbitrary(filters.categoryIds);
                const competitions = competitionsFromIdsArbitrary(filters.competitionIds);
                const onRemoveFilter = vi.fn();
                const onClearAll = vi.fn();

                const { container } = render(
                    <ActiveFilters
                        filters={filters}
                        categories={categories}
                        competitions={competitions}
                        onRemoveFilter={onRemoveFilter}
                        onClearAll={onClearAll}
                    />,
                );

                // Count expected chips
                const hasSearch = filters.search.trim() !== '';
                const hasAttemptedStatus = filters.attemptedStatus !== null;
                const expectedChipCount =
                    (hasSearch ? 1 : 0) +
                    filters.difficulty.length +
                    filters.categoryIds.length +
                    filters.competitionIds.length +
                    (hasAttemptedStatus ? 1 : 0);

                // If no active filters, component should not render anything
                if (expectedChipCount === 0) {
                    expect(container.firstChild).toBeNull();
                    return;
                }

                // Check search chip is displayed
                if (hasSearch) {
                    const searchElements = screen.getAllByText(filters.search, {
                        collapseWhitespace: false,
                    });
                    expect(searchElements.length).toBeGreaterThanOrEqual(1);
                }

                // Check difficulty chips are displayed
                filters.difficulty.forEach((difficulty) => {
                    const difficultyText =
                        difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
                    const difficultyElements = screen.getAllByText(difficultyText);
                    expect(difficultyElements.length).toBeGreaterThanOrEqual(1);
                });

                // Check category chips are displayed
                filters.categoryIds.forEach((categoryId) => {
                    const categoryElements = screen.getAllByText(`Category ${categoryId}`);
                    expect(categoryElements.length).toBeGreaterThanOrEqual(1);
                });

                // Check competition chips are displayed
                filters.competitionIds.forEach((competitionId) => {
                    const competitionElements = screen.getAllByText(`Competition ${competitionId}`);
                    expect(competitionElements.length).toBeGreaterThanOrEqual(1);
                });
            },
        );

        test.prop([problemFiltersArbitrary], { numRuns: 100 })(
            'should show clear all button only when multiple filters are active',
            (filters) => {
                cleanup(); // Ensure clean state
                const categories = categoriesFromIdsArbitrary(filters.categoryIds);
                const competitions = competitionsFromIdsArbitrary(filters.competitionIds);
                const onRemoveFilter = vi.fn();
                const onClearAll = vi.fn();

                render(
                    <ActiveFilters
                        filters={filters}
                        categories={categories}
                        competitions={competitions}
                        onRemoveFilter={onRemoveFilter}
                        onClearAll={onClearAll}
                    />,
                );

                const hasSearch = filters.search.trim() !== '';
                const hasAttemptedStatus = filters.attemptedStatus !== null;
                const activeFilterCount =
                    (hasSearch ? 1 : 0) +
                    filters.difficulty.length +
                    filters.categoryIds.length +
                    filters.competitionIds.length +
                    (hasAttemptedStatus ? 1 : 0);

                const clearAllButtons = screen.queryAllByRole('button', {
                    name: /clear all/i,
                });

                if (activeFilterCount > 1) {
                    expect(clearAllButtons.length).toBeGreaterThanOrEqual(1);
                } else {
                    expect(clearAllButtons.length).toBe(0);
                }
            },
        );

        test.prop([problemFiltersArbitrary], { numRuns: 100 })(
            'each filter chip should have a remove button',
            (filters) => {
                cleanup(); // Ensure clean state
                const categories = categoriesFromIdsArbitrary(filters.categoryIds);
                const competitions = competitionsFromIdsArbitrary(filters.competitionIds);
                const onRemoveFilter = vi.fn();
                const onClearAll = vi.fn();

                const { container } = render(
                    <ActiveFilters
                        filters={filters}
                        categories={categories}
                        competitions={competitions}
                        onRemoveFilter={onRemoveFilter}
                        onClearAll={onClearAll}
                    />,
                );

                const hasSearch = filters.search.trim() !== '';
                const hasAttemptedStatus = filters.attemptedStatus !== null;
                const expectedChipCount =
                    (hasSearch ? 1 : 0) +
                    filters.difficulty.length +
                    filters.categoryIds.length +
                    filters.competitionIds.length +
                    (hasAttemptedStatus ? 1 : 0);

                if (expectedChipCount === 0) {
                    expect(container.firstChild).toBeNull();
                    return;
                }

                // Each chip should have an X button for removal
                // Count the number of X icons (each chip has one)
                const removeButtons = container.querySelectorAll('svg.lucide-x');

                // We expect at least one X per chip (some chips have nested buttons)
                // The clear all button also has an X if shown
                const minExpectedXIcons = expectedChipCount;

                expect(removeButtons.length).toBeGreaterThanOrEqual(minExpectedXIcons);
            },
        );

        test.prop(
            [
                fc.record({
                    search: fc.constant(''),
                    difficulty: fc.constant([] as Difficulty[]),
                    categoryIds: fc.constant([] as number[]),
                    competitionIds: fc.constant([] as number[]),
                    attemptedStatus: fc.constant(null as 'attempted' | 'unattempted' | null),
                }),
            ],
            { numRuns: 10 },
        )('should not render when no filters are active', (emptyFilters) => {
            cleanup(); // Ensure clean state
            const onRemoveFilter = vi.fn();
            const onClearAll = vi.fn();

            const { container } = render(
                <ActiveFilters
                    filters={emptyFilters}
                    categories={[]}
                    competitions={[]}
                    onRemoveFilter={onRemoveFilter}
                    onClearAll={onClearAll}
                />,
            );

            expect(container.firstChild).toBeNull();
        });
    });
});
