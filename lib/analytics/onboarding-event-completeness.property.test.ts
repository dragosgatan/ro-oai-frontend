/**
 * Property-Based Tests for Onboarding Event Field Completeness
 *
 * **Feature: seo-gtm-social-sharing, Property 7: Onboarding Event Field Completeness**
 *
 * *For any* onboarding-related GTM event (start, step_complete, complete, abandon), the event SHALL contain:
 * - Event-specific fields (step number for step_complete and abandon)
 * - Total steps count for step_complete events
 *
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { AnalyticsEvents } from './events';

// ============================================================================
// Types
// ============================================================================

interface OnboardingStartEvent {
    event: string;
    totalSteps: number;
    initialStep?: string;
    stepNumber?: number;
    stepName?: string;
    timestamp: string;
    pagePath: string;
    isAuthenticated: boolean;
}

interface OnboardingStepCompleteEvent {
    event: string;
    stepNumber: number;
    stepName: string;
    totalSteps: number;
    timestamp: string;
    pagePath: string;
    isAuthenticated: boolean;
}

interface OnboardingCompleteEvent {
    event: string;
    totalSteps: number;
    timestamp: string;
    pagePath: string;
    isAuthenticated: boolean;
}

interface OnboardingAbandonEvent {
    event: string;
    lastCompletedStep: number;
    currentStep?: string;
    stepNumber?: number;
    stepName?: string;
    totalSteps: number;
    timestamp: string;
    pagePath: string;
    isAuthenticated: boolean;
}

type OnboardingEvent =
    | OnboardingStartEvent
    | OnboardingStepCompleteEvent
    | OnboardingCompleteEvent
    | OnboardingAbandonEvent;

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generator for step numbers (1-based)
 */
const stepNumberArbitrary = fc.integer({ min: 1, max: 10 });

/**
 * Generator for total steps
 */
const totalStepsArbitrary = fc.integer({ min: 1, max: 10 });

/**
 * Generator for step names
 */
const stepNameArbitrary = fc.constantFrom(
    'Profile Setup',
    'Institution Selection',
    'Preferences',
    'Welcome',
    'Complete',
);

/**
 * Generator for current step identifiers
 */
const currentStepArbitrary = fc.constantFrom(
    'profile',
    'institution',
    'preferences',
    'welcome',
    'complete',
);

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
    '/',
    '/problems',
    '/competitions',
    '/profile',
    '/settings',
    '/leaderboard',
);

/**
 * Generator for onboarding start events
 */
const onboardingStartEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.ONBOARDING_START),
    totalSteps: totalStepsArbitrary,
    initialStep: fc.option(currentStepArbitrary, { nil: undefined }),
    stepNumber: fc.option(stepNumberArbitrary, { nil: undefined }),
    stepName: fc.option(stepNameArbitrary, { nil: undefined }),
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for onboarding step complete events
 */
const onboardingStepCompleteEventArbitrary = fc
    .tuple(
        totalStepsArbitrary,
        stepNameArbitrary,
        iso8601TimestampArbitrary,
        pagePathArbitrary,
        fc.boolean(),
    )
    .chain(([totalSteps, stepName, timestamp, pagePath, isAuthenticated]) => {
        // Step number must be <= totalSteps
        return fc.integer({ min: 1, max: totalSteps }).map((stepNumber) => ({
            event: AnalyticsEvents.ONBOARDING_STEP_COMPLETE,
            stepNumber,
            stepName,
            totalSteps,
            timestamp,
            pagePath,
            isAuthenticated,
        }));
    });

/**
 * Generator for onboarding complete events
 */
const onboardingCompleteEventArbitrary = fc.record({
    event: fc.constant(AnalyticsEvents.ONBOARDING_COMPLETE),
    totalSteps: totalStepsArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for onboarding abandon events
 */
const onboardingAbandonEventArbitrary = fc
    .tuple(
        totalStepsArbitrary,
        currentStepArbitrary,
        stepNameArbitrary,
        iso8601TimestampArbitrary,
        pagePathArbitrary,
        fc.boolean(),
    )
    .chain(([totalSteps, currentStep, stepName, timestamp, pagePath, isAuthenticated]) => {
        // lastCompletedStep must be < totalSteps (since they abandoned before completing)
        return fc.integer({ min: 0, max: totalSteps - 1 }).map((lastCompletedStep) => ({
            event: AnalyticsEvents.ONBOARDING_ABANDON,
            lastCompletedStep,
            currentStep,
            stepNumber: lastCompletedStep + 1,
            stepName,
            totalSteps,
            timestamp,
            pagePath,
            isAuthenticated,
        }));
    });

/**
 * Generator for any onboarding event
 */
const anyOnboardingEventArbitrary = fc.oneof(
    onboardingStartEventArbitrary,
    onboardingStepCompleteEventArbitrary,
    onboardingCompleteEventArbitrary,
    onboardingAbandonEventArbitrary,
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate that an onboarding start event has all required fields
 */
function validateOnboardingStartEvent(event: OnboardingStartEvent): {
    isValid: boolean;
    missingFields: string[];
} {
    const missingFields: string[] = [];

    if (typeof event.totalSteps !== 'number' || event.totalSteps < 1) {
        missingFields.push('totalSteps');
    }

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
}

/**
 * Validate that an onboarding step complete event has all required fields
 */
function validateOnboardingStepCompleteEvent(event: OnboardingStepCompleteEvent): {
    isValid: boolean;
    missingFields: string[];
} {
    const missingFields: string[] = [];

    if (typeof event.stepNumber !== 'number' || event.stepNumber < 1) {
        missingFields.push('stepNumber');
    }

    if (!event.stepName || typeof event.stepName !== 'string') {
        missingFields.push('stepName');
    }

    if (typeof event.totalSteps !== 'number' || event.totalSteps < 1) {
        missingFields.push('totalSteps');
    }

    // stepNumber should not exceed totalSteps
    if (event.stepNumber > event.totalSteps) {
        missingFields.push('stepNumber (exceeds totalSteps)');
    }

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
}

/**
 * Validate that an onboarding complete event has all required fields
 */
function validateOnboardingCompleteEvent(event: OnboardingCompleteEvent): {
    isValid: boolean;
    missingFields: string[];
} {
    const missingFields: string[] = [];

    if (typeof event.totalSteps !== 'number' || event.totalSteps < 1) {
        missingFields.push('totalSteps');
    }

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
}

/**
 * Validate that an onboarding abandon event has all required fields
 */
function validateOnboardingAbandonEvent(event: OnboardingAbandonEvent): {
    isValid: boolean;
    missingFields: string[];
} {
    const missingFields: string[] = [];

    if (typeof event.lastCompletedStep !== 'number' || event.lastCompletedStep < 0) {
        missingFields.push('lastCompletedStep');
    }

    if (typeof event.totalSteps !== 'number' || event.totalSteps < 1) {
        missingFields.push('totalSteps');
    }

    // lastCompletedStep should be less than totalSteps (since they abandoned)
    if (event.lastCompletedStep >= event.totalSteps) {
        missingFields.push('lastCompletedStep (should be less than totalSteps)');
    }

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
}

/**
 * Validate any onboarding event based on its type
 */
function validateOnboardingEvent(event: OnboardingEvent): {
    isValid: boolean;
    missingFields: string[];
} {
    switch (event.event) {
        case AnalyticsEvents.ONBOARDING_START:
            return validateOnboardingStartEvent(event as OnboardingStartEvent);
        case AnalyticsEvents.ONBOARDING_STEP_COMPLETE:
            return validateOnboardingStepCompleteEvent(event as OnboardingStepCompleteEvent);
        case AnalyticsEvents.ONBOARDING_COMPLETE:
            return validateOnboardingCompleteEvent(event as OnboardingCompleteEvent);
        case AnalyticsEvents.ONBOARDING_ABANDON:
            return validateOnboardingAbandonEvent(event as OnboardingAbandonEvent);
        default:
            return { isValid: false, missingFields: ['unknown event type'] };
    }
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 7: Onboarding Event Field Completeness', () => {
    /**
     * **Feature: seo-gtm-social-sharing, Property 7: Onboarding Event Field Completeness**
     * **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
     */

    describe('9.1: Onboarding start events contain required fields', () => {
        it('For any onboarding start event, totalSteps SHALL be present', () => {
            fc.assert(
                fc.property(onboardingStartEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.ONBOARDING_START);

                    // totalSteps is present and valid
                    expect(event.totalSteps).toBeDefined();
                    expect(typeof event.totalSteps).toBe('number');
                    expect(event.totalSteps).toBeGreaterThanOrEqual(1);

                    // Base event fields are present
                    expect(event.timestamp).toBeDefined();
                    expect(event.pagePath).toBeDefined();
                    expect(typeof event.isAuthenticated).toBe('boolean');

                    // Validation passes
                    const validation = validateOnboardingStartEvent(event);
                    expect(validation.isValid).toBe(true);
                    expect(validation.missingFields).toHaveLength(0);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('9.2: Onboarding step complete events contain required fields', () => {
        it('For any onboarding step complete event, stepNumber, stepName, and totalSteps SHALL be present', () => {
            fc.assert(
                fc.property(onboardingStepCompleteEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.ONBOARDING_STEP_COMPLETE);

                    // stepNumber is present and valid
                    expect(event.stepNumber).toBeDefined();
                    expect(typeof event.stepNumber).toBe('number');
                    expect(event.stepNumber).toBeGreaterThanOrEqual(1);

                    // stepName is present and valid
                    expect(event.stepName).toBeDefined();
                    expect(typeof event.stepName).toBe('string');
                    expect(event.stepName.length).toBeGreaterThan(0);

                    // totalSteps is present and valid
                    expect(event.totalSteps).toBeDefined();
                    expect(typeof event.totalSteps).toBe('number');
                    expect(event.totalSteps).toBeGreaterThanOrEqual(1);

                    // stepNumber should not exceed totalSteps
                    expect(event.stepNumber).toBeLessThanOrEqual(event.totalSteps);

                    // Base event fields are present
                    expect(event.timestamp).toBeDefined();
                    expect(event.pagePath).toBeDefined();
                    expect(typeof event.isAuthenticated).toBe('boolean');

                    // Validation passes
                    const validation = validateOnboardingStepCompleteEvent(event);
                    expect(validation.isValid).toBe(true);
                    expect(validation.missingFields).toHaveLength(0);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('9.3: Onboarding complete events contain required fields', () => {
        it('For any onboarding complete event, totalSteps SHALL be present', () => {
            fc.assert(
                fc.property(onboardingCompleteEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.ONBOARDING_COMPLETE);

                    // totalSteps is present and valid
                    expect(event.totalSteps).toBeDefined();
                    expect(typeof event.totalSteps).toBe('number');
                    expect(event.totalSteps).toBeGreaterThanOrEqual(1);

                    // Base event fields are present
                    expect(event.timestamp).toBeDefined();
                    expect(event.pagePath).toBeDefined();
                    expect(typeof event.isAuthenticated).toBe('boolean');

                    // Validation passes
                    const validation = validateOnboardingCompleteEvent(event);
                    expect(validation.isValid).toBe(true);
                    expect(validation.missingFields).toHaveLength(0);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('9.4: Onboarding abandon events contain required fields', () => {
        it('For any onboarding abandon event, lastCompletedStep and totalSteps SHALL be present', () => {
            fc.assert(
                fc.property(onboardingAbandonEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.ONBOARDING_ABANDON);

                    // lastCompletedStep is present and valid
                    expect(event.lastCompletedStep).toBeDefined();
                    expect(typeof event.lastCompletedStep).toBe('number');
                    expect(event.lastCompletedStep).toBeGreaterThanOrEqual(0);

                    // totalSteps is present and valid
                    expect(event.totalSteps).toBeDefined();
                    expect(typeof event.totalSteps).toBe('number');
                    expect(event.totalSteps).toBeGreaterThanOrEqual(1);

                    // lastCompletedStep should be less than totalSteps
                    expect(event.lastCompletedStep).toBeLessThan(event.totalSteps);

                    // Base event fields are present
                    expect(event.timestamp).toBeDefined();
                    expect(event.pagePath).toBeDefined();
                    expect(typeof event.isAuthenticated).toBe('boolean');

                    // Validation passes
                    const validation = validateOnboardingAbandonEvent(event);
                    expect(validation.isValid).toBe(true);
                    expect(validation.missingFields).toHaveLength(0);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Combined: All onboarding events have complete required fields', () => {
        it('For any onboarding event, all required fields SHALL be present and valid', () => {
            fc.assert(
                fc.property(anyOnboardingEventArbitrary, (event) => {
                    // Event name is a valid onboarding event
                    const validOnboardingEvents = [
                        AnalyticsEvents.ONBOARDING_START,
                        AnalyticsEvents.ONBOARDING_STEP_COMPLETE,
                        AnalyticsEvents.ONBOARDING_COMPLETE,
                        AnalyticsEvents.ONBOARDING_ABANDON,
                    ];
                    expect(validOnboardingEvents).toContain(event.event);

                    // Base event fields are always present
                    expect(event.timestamp).toBeDefined();
                    expect(event.pagePath).toBeDefined();
                    expect(typeof event.isAuthenticated).toBe('boolean');

                    // Timestamp is valid ISO 8601
                    const parsedDate = new Date(event.timestamp);
                    expect(isNaN(parsedDate.getTime())).toBe(false);

                    // Validation passes based on event type
                    const validation = validateOnboardingEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Edge cases: Step number boundaries', () => {
        it('For any step complete event, stepNumber SHALL be between 1 and totalSteps inclusive', () => {
            fc.assert(
                fc.property(onboardingStepCompleteEventArbitrary, (event) => {
                    expect(event.stepNumber).toBeGreaterThanOrEqual(1);
                    expect(event.stepNumber).toBeLessThanOrEqual(event.totalSteps);
                }),
                { numRuns: 100 },
            );
        });

        it('For any abandon event, lastCompletedStep SHALL be between 0 and totalSteps-1 inclusive', () => {
            fc.assert(
                fc.property(onboardingAbandonEventArbitrary, (event) => {
                    expect(event.lastCompletedStep).toBeGreaterThanOrEqual(0);
                    expect(event.lastCompletedStep).toBeLessThan(event.totalSteps);
                }),
                { numRuns: 100 },
            );
        });
    });
});
