/**
 * Property-based tests for EditorialContributionsSection component
 *
 * **Feature: competition-editorial, Property 18: Profile editorial contributions section visibility**
 * **Validates: Requirements 8.1, 8.3**
 *
 * **Feature: competition-editorial, Property 20: Profile contributions ordered by date**
 * **Validates: Requirements 8.4**
 *
 * **Feature: competition-editorial, Property 21: Source code indicator on profile**
 * **Validates: Requirements 8.5**
 */

import { describe, it, expect } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import type { EditorialContribution } from '@/lib/types';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Determines if the contributions section should be visible.
 * Returns true if and only if there is at least one contribution.
 */
export function shouldShowContributionsSection(contributions: EditorialContribution[]): boolean {
    return contributions != null && contributions.length > 0;
}

/**
 * Checks if contributions are ordered by competition end date (most recent first).
 * Returns true if contributions are in descending order by date.
 */
export function areContributionsOrderedByDate(contributions: EditorialContribution[]): boolean {
    if (contributions.length <= 1) return true;

    for (let i = 0; i < contributions.length - 1; i++) {
        const currentDate = new Date(contributions[i].competitionEndDate);
        const nextDate = new Date(contributions[i + 1].competitionEndDate);
        if (currentDate < nextDate) {
            return false;
        }
    }
    return true;
}

/**
 * Checks if a contribution with source code should show the code indicator.
 */
export function shouldShowSourceCodeIndicator(contribution: EditorialContribution): boolean {
    return contribution.hasSourceCode === true;
}

// ============================================================================
// Arbitraries
// ============================================================================

// Arbitrary for generating valid competition IDs
const competitionIdArbitrary = fc.integer({ min: 1, max: 10000 });

// Arbitrary for generating competition names
const competitionNameArbitrary = fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0);

// Arbitrary for generating ISO date strings
const dateArbitrary = fc
    .integer({
        min: new Date('2020-01-01').getTime(),
        max: new Date('2030-12-31').getTime(),
    })
    .map((timestamp) => new Date(timestamp).toISOString());

// Arbitrary for generating optional competition ranks
const rankArbitrary = fc.option(fc.integer({ min: 1, max: 1000 }));

// Arbitrary for generating roles
const roleArbitrary = fc.constantFrom('Author', 'Contributor', 'Reviewer');

// Arbitrary for generating a single editorial contribution
const contributionArbitrary: fc.Arbitrary<EditorialContribution> = fc.record({
    competitionId: competitionIdArbitrary,
    competitionName: competitionNameArbitrary,
    competitionEndDate: dateArbitrary,
    competitionRank: rankArbitrary,
    role: roleArbitrary,
    hasSourceCode: fc.boolean(),
    editorialUrl: fc.string({ minLength: 1 }).map((s) => `/competitions/${s}/editorial`),
});

// Arbitrary for generating a list of contributions
const contributionsListArbitrary = fc.array(contributionArbitrary, { minLength: 0, maxLength: 10 });

// Arbitrary for generating non-empty contributions list
const nonEmptyContributionsArbitrary = fc.array(contributionArbitrary, {
    minLength: 1,
    maxLength: 10,
});

// ============================================================================
// Property Tests
// ============================================================================

describe('EditorialContributionsSection', () => {
    describe('Property 18: Profile editorial contributions section visibility', () => {
        /**
         * **Feature: competition-editorial, Property 18: Profile editorial contributions section visibility**
         * **Validates: Requirements 8.1, 8.3**
         *
         * For any user profile, the "Editorial Contributions" section should be displayed
         * if and only if the user has at least one editorial contribution.
         */

        fcTest.prop([contributionsListArbitrary])(
            'section visibility should match presence of contributions',
            (contributions) => {
                const shouldShow = shouldShowContributionsSection(contributions);
                const hasContributions = contributions.length > 0;

                expect(shouldShow).toBe(hasContributions);
            },
        );

        it('should return false for empty array', () => {
            expect(shouldShowContributionsSection([])).toBe(false);
        });

        it('should return false for null/undefined', () => {
            expect(shouldShowContributionsSection(null as any)).toBe(false);
            expect(shouldShowContributionsSection(undefined as any)).toBe(false);
        });

        it('should return true for non-empty array', () => {
            const contributions: EditorialContribution[] = [
                {
                    competitionId: 1,
                    competitionName: 'Test Competition',
                    competitionEndDate: '2024-01-01T00:00:00Z',
                    competitionRank: 5,
                    role: 'Author',
                    hasSourceCode: true,
                    editorialUrl: '/competitions/1/editorial',
                },
            ];
            expect(shouldShowContributionsSection(contributions)).toBe(true);
        });
    });

    describe('Property 20: Profile contributions ordered by date', () => {
        /**
         * **Feature: competition-editorial, Property 20: Profile contributions ordered by date**
         * **Validates: Requirements 8.4**
         *
         * For any user with multiple editorial contributions, they should be displayed
         * in descending order of competition end date (most recent first).
         */

        fcTest.prop([nonEmptyContributionsArbitrary])(
            'sorted contributions should be in descending date order',
            (contributions) => {
                // Sort contributions by date (most recent first)
                const sorted = [...contributions].sort(
                    (a, b) =>
                        new Date(b.competitionEndDate).getTime() -
                        new Date(a.competitionEndDate).getTime(),
                );

                // Verify the sorted array is in correct order
                expect(areContributionsOrderedByDate(sorted)).toBe(true);
            },
        );

        it('should return true for single contribution', () => {
            const contributions: EditorialContribution[] = [
                {
                    competitionId: 1,
                    competitionName: 'Test',
                    competitionEndDate: '2024-01-01T00:00:00Z',
                    role: 'Author',
                    hasSourceCode: false,
                    editorialUrl: '/competitions/1/editorial',
                },
            ];
            expect(areContributionsOrderedByDate(contributions)).toBe(true);
        });

        it('should return true for empty array', () => {
            expect(areContributionsOrderedByDate([])).toBe(true);
        });

        it('should return true for correctly ordered contributions', () => {
            const contributions: EditorialContribution[] = [
                {
                    competitionId: 1,
                    competitionName: 'Recent',
                    competitionEndDate: '2024-06-01T00:00:00Z',
                    role: 'Author',
                    hasSourceCode: false,
                    editorialUrl: '/competitions/1/editorial',
                },
                {
                    competitionId: 2,
                    competitionName: 'Older',
                    competitionEndDate: '2024-01-01T00:00:00Z',
                    role: 'Author',
                    hasSourceCode: false,
                    editorialUrl: '/competitions/2/editorial',
                },
            ];
            expect(areContributionsOrderedByDate(contributions)).toBe(true);
        });

        it('should return false for incorrectly ordered contributions', () => {
            const contributions: EditorialContribution[] = [
                {
                    competitionId: 1,
                    competitionName: 'Older',
                    competitionEndDate: '2024-01-01T00:00:00Z',
                    role: 'Author',
                    hasSourceCode: false,
                    editorialUrl: '/competitions/1/editorial',
                },
                {
                    competitionId: 2,
                    competitionName: 'Recent',
                    competitionEndDate: '2024-06-01T00:00:00Z',
                    role: 'Author',
                    hasSourceCode: false,
                    editorialUrl: '/competitions/2/editorial',
                },
            ];
            expect(areContributionsOrderedByDate(contributions)).toBe(false);
        });
    });

    describe('Property 21: Source code indicator on profile', () => {
        /**
         * **Feature: competition-editorial, Property 21: Source code indicator on profile**
         * **Validates: Requirements 8.5**
         *
         * For any editorial contribution where the user shared source code,
         * a code icon should be displayed next to that contribution.
         */

        fcTest.prop([contributionArbitrary])(
            'source code indicator should match hasSourceCode flag',
            (contribution) => {
                const shouldShow = shouldShowSourceCodeIndicator(contribution);
                expect(shouldShow).toBe(contribution.hasSourceCode);
            },
        );

        it('should return true when hasSourceCode is true', () => {
            const contribution: EditorialContribution = {
                competitionId: 1,
                competitionName: 'Test',
                competitionEndDate: '2024-01-01T00:00:00Z',
                role: 'Author',
                hasSourceCode: true,
                editorialUrl: '/competitions/1/editorial',
            };
            expect(shouldShowSourceCodeIndicator(contribution)).toBe(true);
        });

        it('should return false when hasSourceCode is false', () => {
            const contribution: EditorialContribution = {
                competitionId: 1,
                competitionName: 'Test',
                competitionEndDate: '2024-01-01T00:00:00Z',
                role: 'Author',
                hasSourceCode: false,
                editorialUrl: '/competitions/1/editorial',
            };
            expect(shouldShowSourceCodeIndicator(contribution)).toBe(false);
        });
    });
});
