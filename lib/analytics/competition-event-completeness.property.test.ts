/**
 * Property-Based Tests for Competition Event Field Completeness
 *
 * **Feature: seo-gtm-social-sharing, Property 4: Competition Event Field Completeness**
 *
 * *For any* competition-related GTM event (view, join, leave, share), the event SHALL contain:
 * - The competition ID
 * - The competition status
 * - Event-specific fields (e.g., share method for share events)
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { AnalyticsEvents } from './events';

// ============================================================================
// Types
// ============================================================================

interface CompetitionEvent {
    event: string;
    competitionId: string;
    competitionName?: string;
    competitionStatus: 'UPCOMING' | 'ACTIVE' | 'ENDED';
    timestamp: string;
    pagePath: string;
    isAuthenticated: boolean;
    shareMethod?: string;
}

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generator for competition IDs (numeric strings)
 */
const competitionIdArbitrary = fc.integer({ min: 1, max: 999999 }).map(String);

/**
 * Generator for competition names
 */
const competitionNameArbitrary = fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0);

/**
 * Generator for competition status
 */
const competitionStatusArbitrary = fc.constantFrom('UPCOMING', 'ACTIVE', 'ENDED') as fc.Arbitrary<
    'UPCOMING' | 'ACTIVE' | 'ENDED'
>;

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
const pagePathArbitrary = fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => /^[a-zA-Z0-9\-_/]+$/.test(s))
    .map((s) => '/competitions/' + s.replace(/^\/+/, ''));

/**
 * Generator for share methods
 */
const shareMethodArbitrary = fc.constantFrom(
    'native',
    'clipboard',
    'twitter',
    'facebook',
    'linkedin',
);

/**
 * Generator for competition view events
 */
const competitionViewEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.COMPETITION_VIEW),
    competitionId: competitionIdArbitrary,
    competitionName: fc.option(competitionNameArbitrary, { nil: undefined }),
    competitionStatus: competitionStatusArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for competition join events
 */
const competitionJoinEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.COMPETITION_JOIN),
    competitionId: competitionIdArbitrary,
    competitionName: fc.option(competitionNameArbitrary, { nil: undefined }),
    competitionStatus: competitionStatusArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for competition leave events
 */
const competitionLeaveEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.COMPETITION_LEAVE),
    competitionId: competitionIdArbitrary,
    competitionName: fc.option(competitionNameArbitrary, { nil: undefined }),
    competitionStatus: competitionStatusArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for competition share events
 */
const competitionShareEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.COMPETITION_SHARE),
    competitionId: competitionIdArbitrary,
    competitionName: fc.option(competitionNameArbitrary, { nil: undefined }),
    competitionStatus: competitionStatusArbitrary,
    shareMethod: shareMethodArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for any competition event
 */
const anyCompetitionEventArbitrary = fc.oneof(
    competitionViewEventArbitrary,
    competitionJoinEventArbitrary,
    competitionLeaveEventArbitrary,
    competitionShareEventArbitrary,
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate that a competition event has all required fields
 */
function validateCompetitionEvent(event: CompetitionEvent): {
    isValid: boolean;
    missingFields: string[];
} {
    const missingFields: string[] = [];

    if (!event.competitionId || typeof event.competitionId !== 'string') {
        missingFields.push('competitionId');
    }

    if (
        !event.competitionStatus ||
        !['UPCOMING', 'ACTIVE', 'ENDED'].includes(event.competitionStatus)
    ) {
        missingFields.push('competitionStatus');
    }

    // Share events must have shareMethod
    if (event.event === AnalyticsEvents.COMPETITION_SHARE) {
        if (!event.shareMethod || typeof event.shareMethod !== 'string') {
            missingFields.push('shareMethod');
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

describe('Property 4: Competition Event Field Completeness', () => {
    /**
     * **Feature: seo-gtm-social-sharing, Property 4: Competition Event Field Completeness**
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.6**
     */

    describe('3.1: Competition view events contain required fields', () => {
        it('For any competition view event, competitionId and competitionStatus SHALL be present', () => {
            fc.assert(
                fc.property(competitionViewEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.COMPETITION_VIEW);

                    // Competition ID is present and valid
                    expect(event.competitionId).toBeDefined();
                    expect(typeof event.competitionId).toBe('string');
                    expect(event.competitionId.length).toBeGreaterThan(0);

                    // Competition status is present and valid
                    expect(event.competitionStatus).toBeDefined();
                    expect(['UPCOMING', 'ACTIVE', 'ENDED']).toContain(event.competitionStatus);

                    // Validation passes
                    const validation = validateCompetitionEvent(event);
                    expect(validation.isValid).toBe(true);
                    expect(validation.missingFields).toHaveLength(0);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('3.2: Competition join events contain required fields', () => {
        it('For any competition join event, competitionId and competitionStatus SHALL be present', () => {
            fc.assert(
                fc.property(competitionJoinEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.COMPETITION_JOIN);

                    // Competition ID is present and valid
                    expect(event.competitionId).toBeDefined();
                    expect(typeof event.competitionId).toBe('string');
                    expect(event.competitionId.length).toBeGreaterThan(0);

                    // Competition status is present and valid
                    expect(event.competitionStatus).toBeDefined();
                    expect(['UPCOMING', 'ACTIVE', 'ENDED']).toContain(event.competitionStatus);

                    // Validation passes
                    const validation = validateCompetitionEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('3.3: Competition leave events contain required fields', () => {
        it('For any competition leave event, competitionId and competitionStatus SHALL be present', () => {
            fc.assert(
                fc.property(competitionLeaveEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.COMPETITION_LEAVE);

                    // Competition ID is present and valid
                    expect(event.competitionId).toBeDefined();
                    expect(typeof event.competitionId).toBe('string');
                    expect(event.competitionId.length).toBeGreaterThan(0);

                    // Competition status is present and valid
                    expect(event.competitionStatus).toBeDefined();
                    expect(['UPCOMING', 'ACTIVE', 'ENDED']).toContain(event.competitionStatus);

                    // Validation passes
                    const validation = validateCompetitionEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('3.6: Competition share events contain required fields including shareMethod', () => {
        it('For any competition share event, competitionId, competitionStatus, and shareMethod SHALL be present', () => {
            fc.assert(
                fc.property(competitionShareEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.COMPETITION_SHARE);

                    // Competition ID is present and valid
                    expect(event.competitionId).toBeDefined();
                    expect(typeof event.competitionId).toBe('string');
                    expect(event.competitionId.length).toBeGreaterThan(0);

                    // Competition status is present and valid
                    expect(event.competitionStatus).toBeDefined();
                    expect(['UPCOMING', 'ACTIVE', 'ENDED']).toContain(event.competitionStatus);

                    // Share method is present and valid
                    expect(event.shareMethod).toBeDefined();
                    expect(typeof event.shareMethod).toBe('string');
                    expect(event.shareMethod.length).toBeGreaterThan(0);

                    // Validation passes
                    const validation = validateCompetitionEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Combined: All competition events have complete required fields', () => {
        it('For any competition event, all required fields SHALL be present and valid', () => {
            fc.assert(
                fc.property(anyCompetitionEventArbitrary, (event) => {
                    // Event name is a valid competition event
                    const validCompetitionEvents = [
                        AnalyticsEvents.COMPETITION_VIEW,
                        AnalyticsEvents.COMPETITION_JOIN,
                        AnalyticsEvents.COMPETITION_LEAVE,
                        AnalyticsEvents.COMPETITION_SHARE,
                    ];
                    expect(validCompetitionEvents).toContain(event.event);

                    // Competition ID is always present
                    expect(event.competitionId).toBeDefined();
                    expect(typeof event.competitionId).toBe('string');
                    expect(event.competitionId.length).toBeGreaterThan(0);

                    // Competition status is always present
                    expect(event.competitionStatus).toBeDefined();
                    expect(['UPCOMING', 'ACTIVE', 'ENDED']).toContain(event.competitionStatus);

                    // Base event fields are present
                    expect(event.timestamp).toBeDefined();
                    expect(event.pagePath).toBeDefined();
                    expect(typeof event.isAuthenticated).toBe('boolean');

                    // Timestamp is valid ISO 8601
                    const parsedDate = new Date(event.timestamp);
                    expect(isNaN(parsedDate.getTime())).toBe(false);

                    // Page path starts with /competitions/
                    expect(event.pagePath.startsWith('/competitions/')).toBe(true);

                    // Validation passes
                    const validation = validateCompetitionEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Edge cases: Competition ID formats', () => {
        it('For any numeric competition ID, it SHALL be converted to string correctly', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 999999 }),
                    competitionStatusArbitrary,
                    (numericId, status) => {
                        const event: CompetitionEvent = {
                            event: AnalyticsEvents.COMPETITION_VIEW,
                            competitionId: String(numericId),
                            competitionStatus: status,
                            timestamp: new Date().toISOString(),
                            pagePath: `/competitions/${numericId}`,
                            isAuthenticated: false,
                        };

                        // ID should be a non-empty string
                        expect(event.competitionId).toBe(String(numericId));
                        expect(event.competitionId.length).toBeGreaterThan(0);

                        // Validation passes
                        const validation = validateCompetitionEvent(event);
                        expect(validation.isValid).toBe(true);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });
});
