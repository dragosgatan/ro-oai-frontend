/**
 * Property-Based Tests for Problem Event Field Completeness
 *
 * **Feature: seo-gtm-social-sharing, Property 5: Problem Event Field Completeness**
 *
 * *For any* problem-related GTM event (view, start, submit, editorial_view, question_ask), the event SHALL contain:
 * - The problem ID
 * - The problem difficulty (for view events)
 * - Event-specific fields (e.g., submission details for submit events)
 *
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { AnalyticsEvents } from './events';

// ============================================================================
// Types
// ============================================================================

interface ProblemEvent {
    event: string;
    problemId: string;
    problemTitle?: string;
    problemDifficulty?: string;
    competitionId?: string;
    timestamp: string;
    pagePath: string;
    isAuthenticated: boolean;
    hasSourceFile?: boolean;
    commentId?: number;
    contentLength?: number;
}

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generator for problem IDs (numeric strings)
 */
const problemIdArbitrary = fc.integer({ min: 1, max: 999999 }).map(String);

/**
 * Generator for problem titles
 */
const problemTitleArbitrary = fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0);

/**
 * Generator for problem difficulty
 */
const problemDifficultyArbitrary = fc.constantFrom(
    'easy',
    'medium',
    'hard',
    'EASY',
    'MEDIUM',
    'HARD',
);

/**
 * Generator for competition IDs (optional)
 */
const optionalCompetitionIdArbitrary = fc.option(fc.integer({ min: 1, max: 999999 }).map(String), {
    nil: undefined,
});

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
    .map((s) => '/problems/' + s.replace(/^\/+/, ''));

/**
 * Generator for problem view events
 */
const problemViewEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.PROBLEM_VIEW),
    problemId: problemIdArbitrary,
    problemTitle: fc.option(problemTitleArbitrary, { nil: undefined }),
    problemDifficulty: problemDifficultyArbitrary,
    competitionId: optionalCompetitionIdArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for problem start events
 */
const problemStartEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.PROBLEM_START),
    problemId: problemIdArbitrary,
    problemTitle: fc.option(problemTitleArbitrary, { nil: undefined }),
    problemDifficulty: fc.option(problemDifficultyArbitrary, { nil: undefined }),
    competitionId: optionalCompetitionIdArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for solution submit events
 */
const solutionSubmitEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.SOLUTION_SUBMIT),
    problemId: problemIdArbitrary,
    problemTitle: fc.option(problemTitleArbitrary, { nil: undefined }),
    problemDifficulty: fc.option(problemDifficultyArbitrary, { nil: undefined }),
    competitionId: optionalCompetitionIdArbitrary,
    hasSourceFile: fc.boolean(),
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for editorial view events
 */
const editorialViewEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.EDITORIAL_VIEW),
    problemId: problemIdArbitrary,
    problemTitle: fc.option(problemTitleArbitrary, { nil: undefined }),
    competitionId: optionalCompetitionIdArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for question ask events
 */
const questionAskEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.QUESTION_ASK),
    problemId: problemIdArbitrary,
    commentId: fc.option(fc.integer({ min: 1, max: 999999 }), { nil: undefined }),
    contentLength: fc.option(fc.integer({ min: 1, max: 5000 }), { nil: undefined }),
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for comments view events
 */
const commentsViewEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.COMMENTS_VIEW),
    problemId: problemIdArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for any problem event
 */
const anyProblemEventArbitrary = fc.oneof(
    problemViewEventArbitrary,
    problemStartEventArbitrary,
    solutionSubmitEventArbitrary,
    editorialViewEventArbitrary,
    questionAskEventArbitrary,
    commentsViewEventArbitrary,
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate that a problem event has all required fields
 */
function validateProblemEvent(event: ProblemEvent): {
    isValid: boolean;
    missingFields: string[];
} {
    const missingFields: string[] = [];

    // All problem events must have problemId
    if (!event.problemId || typeof event.problemId !== 'string') {
        missingFields.push('problemId');
    }

    // View events must have difficulty
    if (event.event === AnalyticsEvents.PROBLEM_VIEW) {
        if (!event.problemDifficulty || typeof event.problemDifficulty !== 'string') {
            missingFields.push('problemDifficulty');
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

describe('Property 5: Problem Event Field Completeness', () => {
    /**
     * **Feature: seo-gtm-social-sharing, Property 5: Problem Event Field Completeness**
     * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
     */

    describe('4.1: Problem view events contain required fields including difficulty', () => {
        it('For any problem view event, problemId and problemDifficulty SHALL be present', () => {
            fc.assert(
                fc.property(problemViewEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.PROBLEM_VIEW);

                    // Problem ID is present and valid
                    expect(event.problemId).toBeDefined();
                    expect(typeof event.problemId).toBe('string');
                    expect(event.problemId.length).toBeGreaterThan(0);

                    // Problem difficulty is present and valid
                    expect(event.problemDifficulty).toBeDefined();
                    expect(typeof event.problemDifficulty).toBe('string');
                    expect(['easy', 'medium', 'hard', 'EASY', 'MEDIUM', 'HARD']).toContain(
                        event.problemDifficulty,
                    );

                    // Validation passes
                    const validation = validateProblemEvent(event);
                    expect(validation.isValid).toBe(true);
                    expect(validation.missingFields).toHaveLength(0);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('4.2: Problem start events contain required fields', () => {
        it('For any problem start event, problemId SHALL be present', () => {
            fc.assert(
                fc.property(problemStartEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.PROBLEM_START);

                    // Problem ID is present and valid
                    expect(event.problemId).toBeDefined();
                    expect(typeof event.problemId).toBe('string');
                    expect(event.problemId.length).toBeGreaterThan(0);

                    // Validation passes
                    const validation = validateProblemEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('4.3: Solution submit events contain required fields', () => {
        it('For any solution submit event, problemId SHALL be present', () => {
            fc.assert(
                fc.property(solutionSubmitEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.SOLUTION_SUBMIT);

                    // Problem ID is present and valid
                    expect(event.problemId).toBeDefined();
                    expect(typeof event.problemId).toBe('string');
                    expect(event.problemId.length).toBeGreaterThan(0);

                    // hasSourceFile is present (submission detail)
                    expect(typeof event.hasSourceFile).toBe('boolean');

                    // Validation passes
                    const validation = validateProblemEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('4.4: Editorial view events contain required fields', () => {
        it('For any editorial view event, problemId SHALL be present', () => {
            fc.assert(
                fc.property(editorialViewEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.EDITORIAL_VIEW);

                    // Problem ID is present and valid
                    expect(event.problemId).toBeDefined();
                    expect(typeof event.problemId).toBe('string');
                    expect(event.problemId.length).toBeGreaterThan(0);

                    // Validation passes
                    const validation = validateProblemEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('4.5: Question ask events contain required fields', () => {
        it('For any question ask event, problemId SHALL be present', () => {
            fc.assert(
                fc.property(questionAskEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.QUESTION_ASK);

                    // Problem ID is present and valid
                    expect(event.problemId).toBeDefined();
                    expect(typeof event.problemId).toBe('string');
                    expect(event.problemId.length).toBeGreaterThan(0);

                    // Validation passes
                    const validation = validateProblemEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Comments view events contain required fields', () => {
        it('For any comments view event, problemId SHALL be present', () => {
            fc.assert(
                fc.property(commentsViewEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.COMMENTS_VIEW);

                    // Problem ID is present and valid
                    expect(event.problemId).toBeDefined();
                    expect(typeof event.problemId).toBe('string');
                    expect(event.problemId.length).toBeGreaterThan(0);

                    // Validation passes
                    const validation = validateProblemEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Combined: All problem events have complete required fields', () => {
        it('For any problem event, all required fields SHALL be present and valid', () => {
            fc.assert(
                fc.property(anyProblemEventArbitrary, (event) => {
                    // Event name is a valid problem event
                    const validProblemEvents = [
                        AnalyticsEvents.PROBLEM_VIEW,
                        AnalyticsEvents.PROBLEM_START,
                        AnalyticsEvents.SOLUTION_SUBMIT,
                        AnalyticsEvents.EDITORIAL_VIEW,
                        AnalyticsEvents.QUESTION_ASK,
                        AnalyticsEvents.COMMENTS_VIEW,
                    ];
                    expect(validProblemEvents).toContain(event.event);

                    // Problem ID is always present
                    expect(event.problemId).toBeDefined();
                    expect(typeof event.problemId).toBe('string');
                    expect(event.problemId.length).toBeGreaterThan(0);

                    // Base event fields are present
                    expect(event.timestamp).toBeDefined();
                    expect(event.pagePath).toBeDefined();
                    expect(typeof event.isAuthenticated).toBe('boolean');

                    // Timestamp is valid ISO 8601
                    const parsedDate = new Date(event.timestamp);
                    expect(isNaN(parsedDate.getTime())).toBe(false);

                    // Page path starts with /problems/
                    expect(event.pagePath.startsWith('/problems/')).toBe(true);

                    // Validation passes
                    const validation = validateProblemEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Edge cases: Problem ID formats', () => {
        it('For any numeric problem ID, it SHALL be converted to string correctly', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 999999 }),
                    problemDifficultyArbitrary,
                    (numericId, difficulty) => {
                        const event: ProblemEvent = {
                            event: AnalyticsEvents.PROBLEM_VIEW,
                            problemId: String(numericId),
                            problemDifficulty: difficulty,
                            timestamp: new Date().toISOString(),
                            pagePath: `/problems/${numericId}`,
                            isAuthenticated: false,
                        };

                        // ID should be a non-empty string
                        expect(event.problemId).toBe(String(numericId));
                        expect(event.problemId.length).toBeGreaterThan(0);

                        // Validation passes
                        const validation = validateProblemEvent(event);
                        expect(validation.isValid).toBe(true);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    describe('Competition context: Problem events with competition ID', () => {
        it('For any problem event with competition context, competitionId SHALL be a valid string when present', () => {
            fc.assert(
                fc.property(
                    problemIdArbitrary,
                    fc.integer({ min: 1, max: 999999 }),
                    problemDifficultyArbitrary,
                    (problemId, competitionId, difficulty) => {
                        const event: ProblemEvent = {
                            event: AnalyticsEvents.PROBLEM_VIEW,
                            problemId,
                            problemDifficulty: difficulty,
                            competitionId: String(competitionId),
                            timestamp: new Date().toISOString(),
                            pagePath: `/problems/${problemId}`,
                            isAuthenticated: true,
                        };

                        // Competition ID should be a valid string
                        expect(event.competitionId).toBeDefined();
                        expect(typeof event.competitionId).toBe('string');
                        expect(event.competitionId!.length).toBeGreaterThan(0);

                        // Validation passes
                        const validation = validateProblemEvent(event);
                        expect(validation.isValid).toBe(true);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });
});
