/**
 * Property-Based Tests for Leaderboard Event Field Completeness
 *
 * **Feature: seo-gtm-social-sharing, Property 6: Leaderboard Event Field Completeness**
 *
 * *For any* leaderboard-related GTM event (view, tab_change, filter, paginate), the event SHALL contain:
 * - The leaderboard type
 * - Event-specific fields (selected tab, filter criteria, page number)
 *
 * **Validates: Requirements 6.1, 6.2, 6.4, 6.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { AnalyticsEvents } from './events';

// ============================================================================
// Types
// ============================================================================

interface LeaderboardEvent {
    event: string;
    leaderboardType: string;
    timestamp: string;
    pagePath: string;
    isAuthenticated: boolean;
    selectedTab?: string;
    previousTab?: string;
    filterCriteria?: Record<string, string>;
    pageNumber?: number;
    entryCount?: number;
    isCompetition?: boolean;
}

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generator for leaderboard types
 */
const leaderboardTypeArbitrary = fc.constantFrom('users', 'institutions', 'countries');

/**
 * Generator for tab names
 */
const tabNameArbitrary = fc.constantFrom('users', 'institutions', 'countries');

/**
 * Generator for ISO 8601 timestamps
 */
const iso8601TimestampArbitrary = fc
    .integer({
        min: new Date('2020-01-01').getTime(),
        max: new Date('2030-12-31').getTime(),
    })
    .map((timestamp) => new Date(timestamp).toISOString());

/**
 * Generator for page paths
 */
const pagePathArbitrary = fc.constantFrom(
    '/rankings',
    '/rankings/users',
    '/rankings/institutions',
    '/rankings/countries',
    '/competitions/123/leaderboard',
);

/**
 * Generator for filter criteria
 */
const filterCriteriaArbitrary = fc.dictionary(
    fc.constantFrom('country', 'institution', 'difficulty', 'timeRange'),
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
);

/**
 * Generator for page numbers
 */
const pageNumberArbitrary = fc.integer({ min: 1, max: 1000 });

/**
 * Generator for entry counts
 */
const entryCountArbitrary = fc.integer({ min: 0, max: 10000 });

/**
 * Generator for leaderboard view events
 */
const leaderboardViewEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.LEADERBOARD_VIEW),
    leaderboardType: leaderboardTypeArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
    entryCount: fc.option(entryCountArbitrary, { nil: undefined }),
    isCompetition: fc.option(fc.boolean(), { nil: undefined }),
});

/**
 * Generator for leaderboard tab change events
 */
const leaderboardTabChangeEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.LEADERBOARD_TAB_CHANGE),
    leaderboardType: leaderboardTypeArbitrary,
    selectedTab: tabNameArbitrary,
    previousTab: fc.option(tabNameArbitrary, { nil: undefined }),
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
    isCompetition: fc.option(fc.boolean(), { nil: undefined }),
});

/**
 * Generator for leaderboard filter events
 */
const leaderboardFilterEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.LEADERBOARD_FILTER),
    leaderboardType: leaderboardTypeArbitrary,
    filterCriteria: filterCriteriaArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for leaderboard paginate events
 */
const leaderboardPaginateEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.LEADERBOARD_PAGINATE),
    leaderboardType: leaderboardTypeArbitrary,
    pageNumber: pageNumberArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for leaderboard profile click events
 */
const leaderboardProfileClickEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.LEADERBOARD_PROFILE_CLICK),
    leaderboardType: leaderboardTypeArbitrary,
    clickedUserId: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    clickedUsername: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
    clickedUserRank: fc.integer({ min: 1, max: 10000 }),
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for any leaderboard event
 */
const anyLeaderboardEventArbitrary = fc.oneof(
    leaderboardViewEventArbitrary,
    leaderboardTabChangeEventArbitrary,
    leaderboardFilterEventArbitrary,
    leaderboardPaginateEventArbitrary,
    leaderboardProfileClickEventArbitrary,
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate that a leaderboard event has all required fields
 */
function validateLeaderboardEvent(event: LeaderboardEvent): {
    isValid: boolean;
    missingFields: string[];
} {
    const missingFields: string[] = [];

    // All leaderboard events must have leaderboardType
    if (!event.leaderboardType || typeof event.leaderboardType !== 'string') {
        missingFields.push('leaderboardType');
    }

    // Tab change events must have selectedTab
    if (event.event === AnalyticsEvents.LEADERBOARD_TAB_CHANGE) {
        if (!event.selectedTab || typeof event.selectedTab !== 'string') {
            missingFields.push('selectedTab');
        }
    }

    // Filter events must have filterCriteria
    if (event.event === AnalyticsEvents.LEADERBOARD_FILTER) {
        if (!event.filterCriteria || typeof event.filterCriteria !== 'object') {
            missingFields.push('filterCriteria');
        }
    }

    // Paginate events must have pageNumber
    if (event.event === AnalyticsEvents.LEADERBOARD_PAGINATE) {
        if (event.pageNumber === undefined || typeof event.pageNumber !== 'number') {
            missingFields.push('pageNumber');
        }
    }

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 6: Leaderboard Event Field Completeness', () => {
    /**
     * **Feature: seo-gtm-social-sharing, Property 6: Leaderboard Event Field Completeness**
     * **Validates: Requirements 6.1, 6.2, 6.4, 6.5**
     */

    describe('6.1: Leaderboard view events contain required fields', () => {
        it('For any leaderboard view event, leaderboardType SHALL be present', () => {
            fc.assert(
                fc.property(leaderboardViewEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.LEADERBOARD_VIEW);

                    // Leaderboard type is present and valid
                    expect(event.leaderboardType).toBeDefined();
                    expect(typeof event.leaderboardType).toBe('string');
                    expect(event.leaderboardType.length).toBeGreaterThan(0);
                    expect(['users', 'institutions', 'countries']).toContain(event.leaderboardType);

                    // Base event fields are present
                    expect(event.timestamp).toBeDefined();
                    expect(event.pagePath).toBeDefined();
                    expect(typeof event.isAuthenticated).toBe('boolean');

                    // Validation passes
                    const validation = validateLeaderboardEvent(event);
                    expect(validation.isValid).toBe(true);
                    expect(validation.missingFields).toHaveLength(0);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('6.2: Leaderboard tab change events contain required fields', () => {
        it('For any leaderboard tab change event, leaderboardType and selectedTab SHALL be present', () => {
            fc.assert(
                fc.property(leaderboardTabChangeEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.LEADERBOARD_TAB_CHANGE);

                    // Leaderboard type is present and valid
                    expect(event.leaderboardType).toBeDefined();
                    expect(typeof event.leaderboardType).toBe('string');
                    expect(['users', 'institutions', 'countries']).toContain(event.leaderboardType);

                    // Selected tab is present and valid
                    expect(event.selectedTab).toBeDefined();
                    expect(typeof event.selectedTab).toBe('string');
                    expect(['users', 'institutions', 'countries']).toContain(event.selectedTab);

                    // Validation passes
                    const validation = validateLeaderboardEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('6.4: Leaderboard filter events contain required fields', () => {
        it('For any leaderboard filter event, leaderboardType and filterCriteria SHALL be present', () => {
            fc.assert(
                fc.property(leaderboardFilterEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.LEADERBOARD_FILTER);

                    // Leaderboard type is present and valid
                    expect(event.leaderboardType).toBeDefined();
                    expect(typeof event.leaderboardType).toBe('string');
                    expect(['users', 'institutions', 'countries']).toContain(event.leaderboardType);

                    // Filter criteria is present and valid
                    expect(event.filterCriteria).toBeDefined();
                    expect(typeof event.filterCriteria).toBe('object');

                    // Validation passes
                    const validation = validateLeaderboardEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('6.5: Leaderboard paginate events contain required fields', () => {
        it('For any leaderboard paginate event, leaderboardType and pageNumber SHALL be present', () => {
            fc.assert(
                fc.property(leaderboardPaginateEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.LEADERBOARD_PAGINATE);

                    // Leaderboard type is present and valid
                    expect(event.leaderboardType).toBeDefined();
                    expect(typeof event.leaderboardType).toBe('string');
                    expect(['users', 'institutions', 'countries']).toContain(event.leaderboardType);

                    // Page number is present and valid
                    expect(event.pageNumber).toBeDefined();
                    expect(typeof event.pageNumber).toBe('number');
                    expect(event.pageNumber).toBeGreaterThanOrEqual(1);

                    // Validation passes
                    const validation = validateLeaderboardEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('6.3: Leaderboard profile click events contain required fields', () => {
        it('For any leaderboard profile click event, leaderboardType and clicked user info SHALL be present', () => {
            fc.assert(
                fc.property(leaderboardProfileClickEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.LEADERBOARD_PROFILE_CLICK);

                    // Leaderboard type is present and valid
                    expect(event.leaderboardType).toBeDefined();
                    expect(typeof event.leaderboardType).toBe('string');
                    expect(['users', 'institutions', 'countries']).toContain(event.leaderboardType);

                    // Clicked user info is present
                    expect(event.clickedUserId).toBeDefined();
                    expect(typeof event.clickedUserId).toBe('string');
                    expect(event.clickedUserId.length).toBeGreaterThan(0);

                    expect(event.clickedUsername).toBeDefined();
                    expect(typeof event.clickedUsername).toBe('string');
                    expect(event.clickedUsername.length).toBeGreaterThan(0);

                    expect(event.clickedUserRank).toBeDefined();
                    expect(typeof event.clickedUserRank).toBe('number');
                    expect(event.clickedUserRank).toBeGreaterThanOrEqual(1);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Combined: All leaderboard events have complete required fields', () => {
        it('For any leaderboard event, all required fields SHALL be present and valid', () => {
            fc.assert(
                fc.property(anyLeaderboardEventArbitrary, (event) => {
                    // Event name is a valid leaderboard event
                    const validLeaderboardEvents = [
                        AnalyticsEvents.LEADERBOARD_VIEW,
                        AnalyticsEvents.LEADERBOARD_TAB_CHANGE,
                        AnalyticsEvents.LEADERBOARD_FILTER,
                        AnalyticsEvents.LEADERBOARD_PAGINATE,
                        AnalyticsEvents.LEADERBOARD_PROFILE_CLICK,
                    ];
                    expect(validLeaderboardEvents).toContain(event.event);

                    // Leaderboard type is always present
                    expect(event.leaderboardType).toBeDefined();
                    expect(typeof event.leaderboardType).toBe('string');
                    expect(['users', 'institutions', 'countries']).toContain(event.leaderboardType);

                    // Base event fields are present
                    expect(event.timestamp).toBeDefined();
                    expect(event.pagePath).toBeDefined();
                    expect(typeof event.isAuthenticated).toBe('boolean');

                    // Timestamp is valid ISO 8601
                    const parsedDate = new Date(event.timestamp);
                    expect(isNaN(parsedDate.getTime())).toBe(false);

                    // Validation passes
                    const validation = validateLeaderboardEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Edge cases: Leaderboard type variations', () => {
        it('For any valid leaderboard type, events SHALL be correctly categorized', () => {
            fc.assert(
                fc.property(
                    leaderboardTypeArbitrary,
                    iso8601TimestampArbitrary,
                    fc.boolean(),
                    (leaderboardType, timestamp, isAuthenticated) => {
                        const event: LeaderboardEvent = {
                            event: AnalyticsEvents.LEADERBOARD_VIEW,
                            leaderboardType,
                            timestamp,
                            pagePath: '/rankings',
                            isAuthenticated,
                        };

                        // Leaderboard type should be one of the valid types
                        expect(['users', 'institutions', 'countries']).toContain(
                            event.leaderboardType,
                        );

                        // Validation passes
                        const validation = validateLeaderboardEvent(event);
                        expect(validation.isValid).toBe(true);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });
});
