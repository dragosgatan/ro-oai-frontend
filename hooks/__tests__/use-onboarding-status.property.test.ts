/**
 * Onboarding Status Property-Based Tests
 *
 * Tests for the useOnboardingStatus hook's state transitions and UI logic.
 *
 * **Feature: private-competition-onboarding**
 *
 * Tests correct state transitions based on API responses.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 3.1, 4.2, 4.3**
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import {
    OnboardingStatusResponse,
    OnboardingUIState,
    shouldShowOnboardingGate,
    shouldHideJoinButton,
    shouldGrantProblemAccess,
    isValidOnboardingStatusResponse,
    determineUIState,
} from '../use-onboarding-status';

// Arbitraries for property-based testing

const competitionIdArbitrary = fc.integer({ min: 1, max: 100000 });

const competitionNameArbitrary = fc.string({ minLength: 1, maxLength: 100 });

const onboardingStatusResponseArbitrary: fc.Arbitrary<OnboardingStatusResponse> = fc.record({
    isParticipant: fc.boolean(),
    onboardingComplete: fc.boolean(),
    antiCheatEnabled: fc.boolean(),
    competitionName: competitionNameArbitrary,
    competitionId: competitionIdArbitrary,
});

// Pre-joined participant with incomplete onboarding
const preJoinedIncompleteArbitrary: fc.Arbitrary<OnboardingStatusResponse> = fc.record({
    isParticipant: fc.constant(true),
    onboardingComplete: fc.constant(false),
    antiCheatEnabled: fc.constant(true),
    competitionName: competitionNameArbitrary,
    competitionId: competitionIdArbitrary,
});

// Pre-joined participant with complete onboarding
const preJoinedCompleteArbitrary: fc.Arbitrary<OnboardingStatusResponse> = fc.record({
    isParticipant: fc.constant(true),
    onboardingComplete: fc.constant(true),
    antiCheatEnabled: fc.constant(true),
    competitionName: competitionNameArbitrary,
    competitionId: competitionIdArbitrary,
});

// Non-participant
const nonParticipantArbitrary: fc.Arbitrary<OnboardingStatusResponse> = fc.record({
    isParticipant: fc.constant(false),
    onboardingComplete: fc.constant(false),
    antiCheatEnabled: fc.boolean(),
    competitionName: competitionNameArbitrary,
    competitionId: competitionIdArbitrary,
});

// Participant without anti-cheat
const participantNoAntiCheatArbitrary: fc.Arbitrary<OnboardingStatusResponse> = fc.record({
    isParticipant: fc.constant(true),
    onboardingComplete: fc.boolean(),
    antiCheatEnabled: fc.constant(false),
    competitionName: competitionNameArbitrary,
    competitionId: competitionIdArbitrary,
});

const errorArbitrary = fc.string({ minLength: 1, maxLength: 100 }).map((msg) => new Error(msg));

describe('Onboarding Status Property-Based Tests', () => {
    /**
     * **Property: Onboarding Gate Display Based on Status**
     * *For any* pre-joined participant with onboarding_complete=false in an anti-cheat competition,
     * the onboarding gate SHALL be displayed.
     *
     * **Feature: private-competition-onboarding, Property 1: Onboarding Gate Display Based on Status**
     * **Validates: Requirements 1.2, 3.1, 4.2**
     */
    describe('Property 1: Onboarding Gate Display Based on Status', () => {
        test.prop([preJoinedIncompleteArbitrary], { numRuns: 100 })(
            'pre-joined participant with incomplete onboarding shows gate',
            (status) => {
                const shouldShow = shouldShowOnboardingGate(status);
                expect(shouldShow).toBe(true);
            },
        );

        test.prop([preJoinedCompleteArbitrary], { numRuns: 100 })(
            'pre-joined participant with complete onboarding does not show gate',
            (status) => {
                const shouldShow = shouldShowOnboardingGate(status);
                expect(shouldShow).toBe(false);
            },
        );

        test.prop([nonParticipantArbitrary], { numRuns: 100 })(
            'non-participant does not show gate',
            (status) => {
                const shouldShow = shouldShowOnboardingGate(status);
                expect(shouldShow).toBe(false);
            },
        );

        test.prop([participantNoAntiCheatArbitrary], { numRuns: 100 })(
            'participant without anti-cheat does not show gate',
            (status) => {
                const shouldShow = shouldShowOnboardingGate(status);
                expect(shouldShow).toBe(false);
            },
        );

        test('null status does not show gate', () => {
            const shouldShow = shouldShowOnboardingGate(null);
            expect(shouldShow).toBe(false);
        });

        test.prop([onboardingStatusResponseArbitrary], { numRuns: 100 })(
            'gate shown only when participant + antiCheat + incomplete',
            (status) => {
                const shouldShow = shouldShowOnboardingGate(status);
                const expected =
                    status.isParticipant && status.antiCheatEnabled && !status.onboardingComplete;
                expect(shouldShow).toBe(expected);
            },
        );
    });

    /**
     * **Property: Join Button Visibility for Pre-Joined Participants**
     * *For any* pre-joined participant (isParticipant=true), the "Join Competition" button
     * SHALL NOT be displayed, regardless of onboarding status.
     *
     * **Feature: private-competition-onboarding, Property 2: Join Button Visibility for Pre-Joined Participants**
     * **Validates: Requirements 1.3, 4.3**
     */
    describe('Property 2: Join Button Visibility for Pre-Joined Participants', () => {
        test.prop([preJoinedIncompleteArbitrary], { numRuns: 100 })(
            'pre-joined participant with incomplete onboarding hides join button',
            (status) => {
                const shouldHide = shouldHideJoinButton(status);
                expect(shouldHide).toBe(true);
            },
        );

        test.prop([preJoinedCompleteArbitrary], { numRuns: 100 })(
            'pre-joined participant with complete onboarding hides join button',
            (status) => {
                const shouldHide = shouldHideJoinButton(status);
                expect(shouldHide).toBe(true);
            },
        );

        test.prop([nonParticipantArbitrary], { numRuns: 100 })(
            'non-participant shows join button',
            (status) => {
                const shouldHide = shouldHideJoinButton(status);
                expect(shouldHide).toBe(false);
            },
        );

        test('null status shows join button', () => {
            const shouldHide = shouldHideJoinButton(null);
            expect(shouldHide).toBe(false);
        });

        test.prop([onboardingStatusResponseArbitrary], { numRuns: 100 })(
            'join button hidden if and only if isParticipant is true',
            (status) => {
                const shouldHide = shouldHideJoinButton(status);
                expect(shouldHide).toBe(status.isParticipant);
            },
        );
    });

    /**
     * **Property: Problem Access After Onboarding Completion**
     * *For any* participant with onboarding_complete=true, problem access SHALL be granted.
     *
     * **Feature: private-competition-onboarding, Property 3: Problem Access After Onboarding Completion**
     * **Validates: Requirements 2.4, 3.3, 4.5**
     */
    describe('Property 3: Problem Access After Onboarding Completion', () => {
        test.prop([preJoinedCompleteArbitrary], { numRuns: 100 })(
            'pre-joined participant with complete onboarding gets access',
            (status) => {
                const shouldGrant = shouldGrantProblemAccess(status);
                expect(shouldGrant).toBe(true);
            },
        );

        test.prop([preJoinedIncompleteArbitrary], { numRuns: 100 })(
            'pre-joined participant with incomplete onboarding denied access',
            (status) => {
                const shouldGrant = shouldGrantProblemAccess(status);
                expect(shouldGrant).toBe(false);
            },
        );

        test.prop([participantNoAntiCheatArbitrary], { numRuns: 100 })(
            'participant without anti-cheat gets access regardless of onboarding',
            (status) => {
                const shouldGrant = shouldGrantProblemAccess(status);
                expect(shouldGrant).toBe(true);
            },
        );

        test.prop([nonParticipantArbitrary], { numRuns: 100 })(
            'non-participant denied access',
            (status) => {
                const shouldGrant = shouldGrantProblemAccess(status);
                expect(shouldGrant).toBe(false);
            },
        );

        test('null status denied access', () => {
            const shouldGrant = shouldGrantProblemAccess(null);
            expect(shouldGrant).toBe(false);
        });
    });

    /**
     * **Property: Onboarding Status API Response Structure**
     * *For any* call to the onboarding-status endpoint, the response SHALL include
     * all required fields with correct types.
     *
     * **Feature: private-competition-onboarding, Property 7: Onboarding Status API Response Structure**
     * **Validates: Requirements 5.2**
     */
    describe('Property 7: Onboarding Status API Response Structure', () => {
        test.prop([onboardingStatusResponseArbitrary], { numRuns: 100 })(
            'valid response passes validation',
            (status) => {
                const isValid = isValidOnboardingStatusResponse(status);
                expect(isValid).toBe(true);
            },
        );

        test('null is not valid', () => {
            expect(isValidOnboardingStatusResponse(null)).toBe(false);
        });

        test('undefined is not valid', () => {
            expect(isValidOnboardingStatusResponse(undefined)).toBe(false);
        });

        test('empty object is not valid', () => {
            expect(isValidOnboardingStatusResponse({})).toBe(false);
        });

        test('missing isParticipant is not valid', () => {
            const response = {
                onboardingComplete: true,
                antiCheatEnabled: true,
                competitionName: 'Test',
                competitionId: 1,
            };
            expect(isValidOnboardingStatusResponse(response)).toBe(false);
        });

        test('missing onboardingComplete is not valid', () => {
            const response = {
                isParticipant: true,
                antiCheatEnabled: true,
                competitionName: 'Test',
                competitionId: 1,
            };
            expect(isValidOnboardingStatusResponse(response)).toBe(false);
        });

        test('missing antiCheatEnabled is not valid', () => {
            const response = {
                isParticipant: true,
                onboardingComplete: true,
                competitionName: 'Test',
                competitionId: 1,
            };
            expect(isValidOnboardingStatusResponse(response)).toBe(false);
        });

        test('missing competitionName is not valid', () => {
            const response = {
                isParticipant: true,
                onboardingComplete: true,
                antiCheatEnabled: true,
                competitionId: 1,
            };
            expect(isValidOnboardingStatusResponse(response)).toBe(false);
        });

        test('missing competitionId is not valid', () => {
            const response = {
                isParticipant: true,
                onboardingComplete: true,
                antiCheatEnabled: true,
                competitionName: 'Test',
            };
            expect(isValidOnboardingStatusResponse(response)).toBe(false);
        });

        test('wrong type for isParticipant is not valid', () => {
            const response = {
                isParticipant: 'true',
                onboardingComplete: true,
                antiCheatEnabled: true,
                competitionName: 'Test',
                competitionId: 1,
            };
            expect(isValidOnboardingStatusResponse(response)).toBe(false);
        });
    });

    /**
     * **Property: UI State Transitions**
     * Tests that the UI state is correctly determined based on loading, error, and status.
     *
     * **Validates: Requirements 1.1**
     */
    describe('UI State Transitions', () => {
        test.prop([onboardingStatusResponseArbitrary], { numRuns: 100 })(
            'loading state takes precedence',
            (status) => {
                const uiState = determineUIState(status, true, null);
                expect(uiState).toBe('loading');
            },
        );

        test.prop([onboardingStatusResponseArbitrary, errorArbitrary], { numRuns: 100 })(
            'error state takes precedence over status',
            (status, error) => {
                const uiState = determineUIState(status, false, error);
                expect(uiState).toBe('error');
            },
        );

        test.prop([nonParticipantArbitrary], { numRuns: 100 })(
            'non-participant shows join state',
            (status) => {
                const uiState = determineUIState(status, false, null);
                expect(uiState).toBe('join');
            },
        );

        test.prop([preJoinedIncompleteArbitrary], { numRuns: 100 })(
            'pre-joined incomplete shows onboarding-gate state',
            (status) => {
                const uiState = determineUIState(status, false, null);
                expect(uiState).toBe('onboarding-gate');
            },
        );

        test.prop([preJoinedCompleteArbitrary], { numRuns: 100 })(
            'pre-joined complete shows problems state',
            (status) => {
                const uiState = determineUIState(status, false, null);
                expect(uiState).toBe('problems');
            },
        );

        test.prop([participantNoAntiCheatArbitrary], { numRuns: 100 })(
            'participant without anti-cheat shows problems state',
            (status) => {
                const uiState = determineUIState(status, false, null);
                expect(uiState).toBe('problems');
            },
        );

        test('null status with no loading shows loading state', () => {
            const uiState = determineUIState(null, false, null);
            expect(uiState).toBe('loading');
        });

        test.prop([onboardingStatusResponseArbitrary], { numRuns: 100 })(
            'UI state is deterministic based on inputs',
            (status) => {
                const uiState1 = determineUIState(status, false, null);
                const uiState2 = determineUIState(status, false, null);
                expect(uiState1).toBe(uiState2);
            },
        );
    });

    /**
     * **Property: State Consistency**
     * Tests that the various helper functions are consistent with each other.
     */
    describe('State Consistency', () => {
        test.prop([onboardingStatusResponseArbitrary], { numRuns: 100 })(
            'if gate is shown, problem access is denied',
            (status) => {
                const showGate = shouldShowOnboardingGate(status);
                const grantAccess = shouldGrantProblemAccess(status);

                // If gate is shown, access should be denied
                if (showGate) {
                    expect(grantAccess).toBe(false);
                }
            },
        );

        test.prop([onboardingStatusResponseArbitrary], { numRuns: 100 })(
            'if join button is hidden, user is participant',
            (status) => {
                const hideJoin = shouldHideJoinButton(status);

                if (hideJoin) {
                    expect(status.isParticipant).toBe(true);
                }
            },
        );

        test.prop([onboardingStatusResponseArbitrary], { numRuns: 100 })(
            'non-participant never shows gate and never gets access',
            (status) => {
                if (!status.isParticipant) {
                    expect(shouldShowOnboardingGate(status)).toBe(false);
                    expect(shouldGrantProblemAccess(status)).toBe(false);
                }
            },
        );
    });
});
