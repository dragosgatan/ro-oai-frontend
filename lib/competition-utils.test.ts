/**
 * Property-Based Tests for Competition Sorting
 *
 * These tests use fast-check to verify correctness properties across
 * all possible inputs, ensuring the competition sorting logic is robust.
 *
 * Feature: highlighted-competitions
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    sortCompetitions,
    getCompetitionStatus,
    hasLiveFinalScores,
    CompetitionWithHighlight,
} from './competition-utils';

/**
 * Arbitrary generator for CompetitionWithHighlight objects
 * Generates competitions with valid start/end times where end > start
 */
const arbitraryCompetition = (): fc.Arbitrary<CompetitionWithHighlight> => {
    // Use integer timestamps to avoid date overflow issues
    const minTimestamp = new Date('2022-01-01T00:00:00Z').getTime();
    const maxTimestamp = new Date('2026-12-31T00:00:00Z').getTime();

    return fc
        .record({
            startTimestamp: fc.integer({ min: minTimestamp, max: maxTimestamp }),
            durationDays: fc.integer({ min: 1, max: 30 }),
            highlighted: fc.boolean(),
            id: fc.nat({ max: 10000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
        })
        .map(({ startTimestamp, durationDays, highlighted, id, name }) => {
            const startDate = new Date(startTimestamp);
            const endDate = new Date(startTimestamp + durationDays * 24 * 60 * 60 * 1000);
            return {
                id,
                name,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                competitionType: 'CLASSIC',
                joined: false,
                shortDescription: 'Test competition',
                highlighted,
            };
        });
};

/**
 * Arbitrary generator for a "now" date within the competition range
 */
const arbitraryNowDate = (): fc.Arbitrary<Date> => {
    const minTimestamp = new Date('2022-01-01T00:00:00Z').getTime();
    const maxTimestamp = new Date('2026-12-31T00:00:00Z').getTime();
    return fc.integer({ min: minTimestamp, max: maxTimestamp }).map((ts) => new Date(ts));
};

/**
 * Arbitrary generator for a list of competitions
 */
const arbitraryCompetitionList = (): fc.Arbitrary<CompetitionWithHighlight[]> => {
    return fc.array(arbitraryCompetition(), { minLength: 0, maxLength: 20 });
};

/**
 * Helper to check if a competition is finished at a given time
 */
function isFinished(competition: CompetitionWithHighlight, now: Date): boolean {
    return new Date(competition.endTime) < now;
}

/**
 * Helper to check if a competition is highlighted and not finished
 */
function isHighlightedAndActive(competition: CompetitionWithHighlight, now: Date): boolean {
    return (competition.highlighted ?? false) && !isFinished(competition, now);
}

describe('Competition Sorting - Property-Based Tests', () => {
    /**
     * Feature: highlighted-competitions, Property 2: Competition List Sorting Order
     * Validates: Requirements 2.1, 2.2, 2.3
     *
     * Property: For any list of competitions with varying highlighted flags, start times,
     * and end times, the sorted list should satisfy:
     * 1. All non-finished competitions appear before all finished competitions
     * 2. Among non-finished competitions, all highlighted competitions appear before non-highlighted ones
     * 3. Among highlighted non-finished competitions, they are sorted by start date descending
     * 4. Among non-highlighted non-finished competitions, they are sorted by start date descending
     * 5. Among finished competitions, they are sorted by start date descending
     */
    describe('Property 2: Competition List Sorting Order', () => {
        it('should place all non-finished competitions before finished competitions', () => {
            fc.assert(
                fc.property(arbitraryCompetitionList(), arbitraryNowDate(), (competitions, now) => {
                    const sorted = sortCompetitions(competitions, now);

                    // Find the first finished competition index
                    let firstFinishedIndex = -1;
                    for (let i = 0; i < sorted.length; i++) {
                        if (isFinished(sorted[i], now)) {
                            firstFinishedIndex = i;
                            break;
                        }
                    }

                    // If there are finished competitions, all competitions after the first
                    // finished one should also be finished
                    if (firstFinishedIndex !== -1) {
                        for (let i = firstFinishedIndex; i < sorted.length; i++) {
                            expect(isFinished(sorted[i], now)).toBe(true);
                        }
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should place highlighted non-finished competitions before non-highlighted non-finished competitions', () => {
            fc.assert(
                fc.property(arbitraryCompetitionList(), arbitraryNowDate(), (competitions, now) => {
                    const sorted = sortCompetitions(competitions, now);

                    // Get only non-finished competitions
                    const nonFinished = sorted.filter((c) => !isFinished(c, now));

                    // Find the first non-highlighted competition index among non-finished
                    let firstNonHighlightedIndex = -1;
                    for (let i = 0; i < nonFinished.length; i++) {
                        if (!(nonFinished[i].highlighted ?? false)) {
                            firstNonHighlightedIndex = i;
                            break;
                        }
                    }

                    // If there are non-highlighted competitions, all competitions after
                    // the first non-highlighted one should also be non-highlighted
                    if (firstNonHighlightedIndex !== -1) {
                        for (let i = firstNonHighlightedIndex; i < nonFinished.length; i++) {
                            expect(nonFinished[i].highlighted ?? false).toBe(false);
                        }
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should sort highlighted non-finished competitions by start date descending', () => {
            fc.assert(
                fc.property(arbitraryCompetitionList(), arbitraryNowDate(), (competitions, now) => {
                    const sorted = sortCompetitions(competitions, now);

                    // Get highlighted non-finished competitions
                    const highlightedActive = sorted.filter((c) => isHighlightedAndActive(c, now));

                    // Verify they are sorted by start date descending (most recent first)
                    for (let i = 1; i < highlightedActive.length; i++) {
                        const prevStart = new Date(highlightedActive[i - 1].startTime).getTime();
                        const currStart = new Date(highlightedActive[i].startTime).getTime();
                        expect(prevStart).toBeGreaterThanOrEqual(currStart);
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should sort non-highlighted non-finished competitions by start date descending', () => {
            fc.assert(
                fc.property(arbitraryCompetitionList(), arbitraryNowDate(), (competitions, now) => {
                    const sorted = sortCompetitions(competitions, now);

                    // Get non-highlighted non-finished competitions
                    const nonHighlightedActive = sorted.filter(
                        (c) => !isFinished(c, now) && !(c.highlighted ?? false),
                    );

                    // Verify they are sorted by start date descending (most recent first)
                    for (let i = 1; i < nonHighlightedActive.length; i++) {
                        const prevStart = new Date(nonHighlightedActive[i - 1].startTime).getTime();
                        const currStart = new Date(nonHighlightedActive[i].startTime).getTime();
                        expect(prevStart).toBeGreaterThanOrEqual(currStart);
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should sort finished competitions by start date descending (most recent first)', () => {
            fc.assert(
                fc.property(arbitraryCompetitionList(), arbitraryNowDate(), (competitions, now) => {
                    const sorted = sortCompetitions(competitions, now);

                    // Get finished competitions
                    const finished = sorted.filter((c) => isFinished(c, now));

                    // Verify they are sorted by start date descending
                    for (let i = 1; i < finished.length; i++) {
                        const prevStart = new Date(finished[i - 1].startTime).getTime();
                        const currStart = new Date(finished[i].startTime).getTime();
                        expect(prevStart).toBeGreaterThanOrEqual(currStart);
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should not mutate the original array', () => {
            fc.assert(
                fc.property(arbitraryCompetitionList(), arbitraryNowDate(), (competitions, now) => {
                    const originalOrder = competitions.map((c) => c.id);
                    sortCompetitions(competitions, now);
                    const afterSortOrder = competitions.map((c) => c.id);

                    expect(afterSortOrder).toEqual(originalOrder);
                }),
                { numRuns: 100 },
            );
        });

        it('should preserve all competitions (no items lost or duplicated)', () => {
            fc.assert(
                fc.property(arbitraryCompetitionList(), arbitraryNowDate(), (competitions, now) => {
                    const sorted = sortCompetitions(competitions, now);

                    expect(sorted.length).toBe(competitions.length);

                    // Check all original competitions are in the sorted result
                    const originalIds = new Set(competitions.map((c) => c.id));
                    const sortedIds = new Set(sorted.map((c) => c.id));

                    expect(sortedIds.size).toBe(originalIds.size);
                    for (const id of originalIds) {
                        expect(sortedIds.has(id)).toBe(true);
                    }
                }),
                { numRuns: 100 },
            );
        });
    });

    /**
     * Feature: highlighted-competitions, Property 3: Sorting Idempotence
     * Validates: Requirements 2.4
     *
     * Property: For any list of competitions, applying the sort function twice
     * should produce the same result as applying it once.
     */
    describe('Property 3: Sorting Idempotence', () => {
        it('should produce the same result when applied twice', () => {
            fc.assert(
                fc.property(arbitraryCompetitionList(), arbitraryNowDate(), (competitions, now) => {
                    const sortedOnce = sortCompetitions(competitions, now);
                    const sortedTwice = sortCompetitions(sortedOnce, now);

                    // The order should be identical
                    expect(sortedTwice.map((c) => c.id)).toEqual(sortedOnce.map((c) => c.id));
                }),
                { numRuns: 100 },
            );
        });

        it('should produce the same result when applied multiple times', () => {
            fc.assert(
                fc.property(
                    arbitraryCompetitionList(),
                    arbitraryNowDate(),
                    fc.integer({ min: 2, max: 5 }),
                    (competitions, now, times) => {
                        let result = sortCompetitions(competitions, now);
                        const firstSortIds = result.map((c) => c.id);

                        for (let i = 1; i < times; i++) {
                            result = sortCompetitions(result, now);
                        }

                        expect(result.map((c) => c.id)).toEqual(firstSortIds);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    /**
     * Unit tests for getCompetitionStatus helper function
     */
    describe('getCompetitionStatus', () => {
        it('should return "future" when now is before start time', () => {
            const now = new Date('2024-01-01T00:00:00Z');
            const startTime = '2024-06-01T00:00:00Z';
            const endTime = '2024-06-15T00:00:00Z';

            expect(getCompetitionStatus(startTime, endTime, now)).toBe('future');
        });

        it('should return "in_progress" when now is between start and end time', () => {
            const now = new Date('2024-06-10T00:00:00Z');
            const startTime = '2024-06-01T00:00:00Z';
            const endTime = '2024-06-15T00:00:00Z';

            expect(getCompetitionStatus(startTime, endTime, now)).toBe('in_progress');
        });

        it('should return "finished" when now is after end time', () => {
            const now = new Date('2024-07-01T00:00:00Z');
            const startTime = '2024-06-01T00:00:00Z';
            const endTime = '2024-06-15T00:00:00Z';

            expect(getCompetitionStatus(startTime, endTime, now)).toBe('finished');
        });
    });

    describe('hasLiveFinalScores', () => {
        it('enables live complete scores only for casual competitions', () => {
            expect(hasLiveFinalScores('CASUAL')).toBe(true);
            expect(hasLiveFinalScores('CLASSIC')).toBe(false);
        });

        it('keeps the classic hidden-score policy for rolling or malformed responses', () => {
            expect(hasLiveFinalScores(undefined)).toBe(false);
            expect(hasLiveFinalScores(null)).toBe(false);
            expect(hasLiveFinalScores('UNKNOWN' as never)).toBe(false);
        });
    });

    /**
     * Unit tests for edge cases
     */
    describe('Edge Cases', () => {
        it('should handle empty competition list', () => {
            const result = sortCompetitions([], new Date());
            expect(result).toEqual([]);
        });

        it('should handle single competition', () => {
            const competition: CompetitionWithHighlight = {
                id: 1,
                name: 'Test',
                startTime: '2024-06-01T00:00:00Z',
                endTime: '2024-06-15T00:00:00Z',
                competitionType: 'CLASSIC',
                joined: false,
                shortDescription: 'Test',
                highlighted: true,
            };

            const result = sortCompetitions([competition], new Date('2024-06-10T00:00:00Z'));
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(1);
        });

        it('should handle competitions with highlighted=false vs highlighted=true', () => {
            const competitions: CompetitionWithHighlight[] = [
                {
                    id: 1,
                    name: 'Not highlighted',
                    startTime: '2024-06-01T00:00:00Z',
                    endTime: '2024-06-15T00:00:00Z',
                    competitionType: 'CLASSIC',
                    joined: false,
                    shortDescription: 'Test',
                    highlighted: false,
                },
                {
                    id: 2,
                    name: 'Highlighted',
                    startTime: '2024-06-02T00:00:00Z',
                    endTime: '2024-06-16T00:00:00Z',
                    competitionType: 'CLASSIC',
                    joined: false,
                    shortDescription: 'Test',
                    highlighted: true,
                },
            ];

            const now = new Date('2024-06-10T00:00:00Z');
            const result = sortCompetitions(competitions, now);

            // Highlighted should come first
            expect(result[0].id).toBe(2);
            expect(result[1].id).toBe(1);
        });
    });
});
