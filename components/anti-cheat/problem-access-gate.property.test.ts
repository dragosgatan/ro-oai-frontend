/**
 * ProblemAccessGate Property-Based Tests
 *
 * Tests for the ProblemAccessGate component's access control logic.
 *
 * **Feature: private-competition-onboarding**
 *
 * Property 1: Onboarding Gate Display Based on Status
 * Property 7: Problem Access Gating
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import type { OnboardingProgress } from '@/hooks/use-onboarding-progress';
import { isOnboardingComplete } from '@/hooks/use-onboarding-progress';
import type { OnboardingStatusResponse } from '@/hooks/use-onboarding-status';
import { shouldShowOnboardingGate, shouldGrantProblemAccess } from '@/hooks/use-onboarding-status';

/**
 * Represents the state needed to determine problem access
 */
interface ProblemAccessState {
    competitionId: number;
    antiCheatEnabled: boolean;
    isAuthenticated: boolean;
    onboardingProgress: OnboardingProgress | null;
    backendOnboardingComplete: boolean | null;
    isConnected: boolean;
    isInterrupted: boolean;
}

/**
 * Represents the expected UI state based on access conditions
 */
type AccessUIState =
    | 'show_content' // Show problem content normally
    | 'show_onboarding_gate' // Show onboarding gate (blocking)
    | 'show_content_with_warning'; // Show content with connection warning

/**
 * Pure function to determine what UI should be shown based on access state
 * This mirrors the logic in the ProblemAccessGate component
 */
export function determineAccessUIState(state: ProblemAccessState): AccessUIState {
    // If anti-cheat is not enabled, show content
    if (!state.antiCheatEnabled) {
        return 'show_content';
    }

    // If not authenticated, show content (auth is handled elsewhere)
    if (!state.isAuthenticated) {
        return 'show_content';
    }

    // Determine if onboarding is complete (prefer backend, fall back to local)
    const localOnboardingComplete = isOnboardingComplete(state.onboardingProgress);
    const onboardingComplete = state.backendOnboardingComplete ?? localOnboardingComplete;

    // If onboarding is not complete, show the gate
    if (!onboardingComplete) {
        return 'show_onboarding_gate';
    }

    // Onboarding is complete - check connection status
    // If connection is lost or interrupted, show warning but allow access
    if (!state.isConnected || state.isInterrupted) {
        return 'show_content_with_warning';
    }

    // All checks passed - show content normally
    return 'show_content';
}

/**
 * Pure function to check if problem content should be blocked
 */
export function shouldBlockProblemContent(state: ProblemAccessState): boolean {
    return determineAccessUIState(state) === 'show_onboarding_gate';
}

/**
 * Pure function to check if connection warning should be shown
 */
export function shouldShowConnectionWarning(state: ProblemAccessState): boolean {
    return determineAccessUIState(state) === 'show_content_with_warning';
}

// Arbitraries for property-based testing

const competitionIdArbitrary = fc.integer({ min: 1, max: 100000 });

// Use integer timestamps to avoid invalid date values
const validDateArbitrary = fc
    .integer({
        min: new Date('2020-01-01').getTime(),
        max: new Date('2030-12-31').getTime(),
    })
    .map((timestamp) => new Date(timestamp));

const onboardingProgressArbitrary = (competitionId: number): fc.Arbitrary<OnboardingProgress> =>
    fc.record({
        competitionId: fc.constant(competitionId),
        downloadComplete: fc.boolean(),
        installComplete: fc.boolean(),
        connectComplete: fc.boolean(),
        scanComplete: fc.boolean(),
        consentComplete: fc.boolean(),
        completedAt: fc.option(
            validDateArbitrary.map((d) => d.toISOString()),
            { nil: undefined },
        ),
    });

const completeOnboardingProgressArbitrary = (
    competitionId: number,
): fc.Arbitrary<OnboardingProgress> =>
    fc.record({
        competitionId: fc.constant(competitionId),
        downloadComplete: fc.constant(true),
        installComplete: fc.constant(true),
        connectComplete: fc.constant(true),
        scanComplete: fc.constant(true),
        consentComplete: fc.constant(true),
        completedAt: validDateArbitrary.map((d) => d.toISOString()),
    });

const incompleteOnboardingProgressArbitrary = (
    competitionId: number,
): fc.Arbitrary<OnboardingProgress> =>
    fc.record({
        competitionId: fc.constant(competitionId),
        downloadComplete: fc.boolean(),
        installComplete: fc.boolean(),
        connectComplete: fc.boolean(),
        scanComplete: fc.boolean(),
        consentComplete: fc.constant(false), // At least consent must be false
        completedAt: fc.constant(undefined),
    });

const problemAccessStateArbitrary: fc.Arbitrary<ProblemAccessState> = competitionIdArbitrary.chain(
    (competitionId) =>
        fc.record({
            competitionId: fc.constant(competitionId),
            antiCheatEnabled: fc.boolean(),
            isAuthenticated: fc.boolean(),
            onboardingProgress: fc.option(onboardingProgressArbitrary(competitionId), {
                nil: null,
            }),
            backendOnboardingComplete: fc.option(fc.boolean(), { nil: null }),
            isConnected: fc.boolean(),
            isInterrupted: fc.boolean(),
        }),
);

// Arbitraries for OnboardingStatusResponse (for pre-joined participant tests)
const competitionNameArbitrary = fc.string({ minLength: 1, maxLength: 100 });

const onboardingStatusResponseArbitrary: fc.Arbitrary<OnboardingStatusResponse> = fc.record({
    isParticipant: fc.boolean(),
    onboardingComplete: fc.boolean(),
    antiCheatEnabled: fc.boolean(),
    competitionName: competitionNameArbitrary,
    competitionId: competitionIdArbitrary,
});

// Pre-joined participant with incomplete onboarding (for Property 1)
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

describe('ProblemAccessGate Property-Based Tests', () => {
    /**
     * **Property 1: Onboarding Gate Display Based on Status**
     * *For any* pre-joined participant with onboarding_complete=false in an anti-cheat competition,
     * navigating to the competition page or any problem page SHALL display the Onboarding_Gate
     * instead of normal content.
     *
     * **Feature: private-competition-onboarding, Property 1: Onboarding Gate Display Based on Status**
     * **Validates: Requirements 1.2, 3.1, 4.2**
     */
    describe('Property 1: Onboarding Gate Display Based on Status', () => {
        test.prop([preJoinedIncompleteArbitrary], { numRuns: 100 })(
            'pre-joined participant with incomplete onboarding shows gate on problem page',
            (status) => {
                // Requirements 1.2, 3.1, 4.2: Pre-joined participant with incomplete onboarding
                // should see the onboarding gate instead of problem content
                const shouldShow = shouldShowOnboardingGate(status);
                expect(shouldShow).toBe(true);

                // Also verify problem access is denied
                const shouldGrant = shouldGrantProblemAccess(status);
                expect(shouldGrant).toBe(false);
            },
        );

        test.prop([preJoinedCompleteArbitrary], { numRuns: 100 })(
            'pre-joined participant with complete onboarding does not show gate',
            (status) => {
                // Requirement 4.2: When onboarding is complete, show normal content
                const shouldShow = shouldShowOnboardingGate(status);
                expect(shouldShow).toBe(false);

                // Problem access should be granted
                const shouldGrant = shouldGrantProblemAccess(status);
                expect(shouldGrant).toBe(true);
            },
        );

        test.prop([nonParticipantArbitrary], { numRuns: 100 })(
            'non-participant does not show onboarding gate',
            (status) => {
                // Non-participants should not see the onboarding gate
                // (they need to join first via the join flow)
                const shouldShow = shouldShowOnboardingGate(status);
                expect(shouldShow).toBe(false);
            },
        );

        test.prop([participantNoAntiCheatArbitrary], { numRuns: 100 })(
            'participant in non-anti-cheat competition does not show gate',
            (status) => {
                // If anti-cheat is disabled, no onboarding gate should be shown
                const shouldShow = shouldShowOnboardingGate(status);
                expect(shouldShow).toBe(false);

                // Problem access should be granted regardless of onboarding status
                const shouldGrant = shouldGrantProblemAccess(status);
                expect(shouldGrant).toBe(true);
            },
        );

        test('null status does not show gate', () => {
            const shouldShow = shouldShowOnboardingGate(null);
            expect(shouldShow).toBe(false);
        });

        test.prop([onboardingStatusResponseArbitrary], { numRuns: 100 })(
            'gate shown only when participant + antiCheat + incomplete onboarding',
            (status) => {
                const shouldShow = shouldShowOnboardingGate(status);
                const expected =
                    status.isParticipant && status.antiCheatEnabled && !status.onboardingComplete;
                expect(shouldShow).toBe(expected);
            },
        );
    });

    describe('Property 7: Problem Access Gating', () => {
        /**
         * **Property 7: Problem Access Gating**
         * *For any* participant who has not completed onboarding for an anti-cheat competition,
         * navigating to any problem page SHALL display the OnboardingGate instead of problem content.
         *
         * **Validates: Requirements 6.2**
         */
        test.prop(
            [
                competitionIdArbitrary.chain((id) =>
                    fc.record({
                        competitionId: fc.constant(id),
                        antiCheatEnabled: fc.constant(true),
                        isAuthenticated: fc.constant(true),
                        onboardingProgress: incompleteOnboardingProgressArbitrary(id),
                        backendOnboardingComplete: fc.constant(null), // Fall back to local
                        isConnected: fc.boolean(),
                        isInterrupted: fc.boolean(),
                    }),
                ),
            ],
            { numRuns: 100 },
        )('incomplete onboarding blocks problem access for anti-cheat competitions', (state) => {
            const uiState = determineAccessUIState(state);
            expect(uiState).toBe('show_onboarding_gate');
            expect(shouldBlockProblemContent(state)).toBe(true);
        });

        test.prop(
            [
                competitionIdArbitrary.chain((id) =>
                    fc.record({
                        competitionId: fc.constant(id),
                        antiCheatEnabled: fc.constant(true),
                        isAuthenticated: fc.constant(true),
                        onboardingProgress: fc.option(onboardingProgressArbitrary(id), {
                            nil: null,
                        }),
                        backendOnboardingComplete: fc.constant(false), // Backend says not complete
                        isConnected: fc.boolean(),
                        isInterrupted: fc.boolean(),
                    }),
                ),
            ],
            { numRuns: 100 },
        )('backend onboarding status takes precedence over local storage', (state) => {
            const uiState = determineAccessUIState(state);
            expect(uiState).toBe('show_onboarding_gate');
            expect(shouldBlockProblemContent(state)).toBe(true);
        });

        test.prop(
            [
                competitionIdArbitrary.chain((id) =>
                    fc.record({
                        competitionId: fc.constant(id),
                        antiCheatEnabled: fc.constant(true),
                        isAuthenticated: fc.constant(true),
                        onboardingProgress: completeOnboardingProgressArbitrary(id),
                        backendOnboardingComplete: fc.constant(null), // Fall back to local
                        isConnected: fc.constant(true),
                        isInterrupted: fc.constant(false),
                    }),
                ),
            ],
            { numRuns: 100 },
        )('complete onboarding allows problem access', (state) => {
            const uiState = determineAccessUIState(state);
            expect(uiState).toBe('show_content');
            expect(shouldBlockProblemContent(state)).toBe(false);
        });

        test.prop(
            [
                competitionIdArbitrary.chain((id) =>
                    fc.record({
                        competitionId: fc.constant(id),
                        antiCheatEnabled: fc.constant(true),
                        isAuthenticated: fc.constant(true),
                        onboardingProgress: fc.option(onboardingProgressArbitrary(id), {
                            nil: null,
                        }),
                        backendOnboardingComplete: fc.constant(true), // Backend says complete
                        isConnected: fc.constant(true),
                        isInterrupted: fc.constant(false),
                    }),
                ),
            ],
            { numRuns: 100 },
        )('backend complete status allows access regardless of local storage', (state) => {
            const uiState = determineAccessUIState(state);
            expect(uiState).toBe('show_content');
            expect(shouldBlockProblemContent(state)).toBe(false);
        });
    });

    /**
     * **Property 3: Problem Access After Onboarding Completion**
     * *For any* participant with onboarding_complete=true, navigating to problem pages
     * SHALL display the problem content without showing the Onboarding_Gate.
     *
     * **Feature: private-competition-onboarding, Property 3: Problem Access After Onboarding Completion**
     * **Validates: Requirements 2.4, 3.3, 4.5**
     */
    describe('Property 3: Problem Access After Onboarding Completion', () => {
        test.prop([preJoinedCompleteArbitrary], { numRuns: 100 })(
            'pre-joined participant with complete onboarding gets problem access',
            (status) => {
                // Requirements 2.4, 3.3, 4.5: When onboarding is complete, allow access to problems
                const shouldGrant = shouldGrantProblemAccess(status);
                expect(shouldGrant).toBe(true);

                // Onboarding gate should not be shown
                const shouldShow = shouldShowOnboardingGate(status);
                expect(shouldShow).toBe(false);
            },
        );

        test.prop(
            [
                competitionIdArbitrary.chain((id) =>
                    fc.record({
                        competitionId: fc.constant(id),
                        antiCheatEnabled: fc.constant(true),
                        isAuthenticated: fc.constant(true),
                        onboardingProgress: completeOnboardingProgressArbitrary(id),
                        backendOnboardingComplete: fc.constant(true),
                        isConnected: fc.constant(true),
                        isInterrupted: fc.constant(false),
                    }),
                ),
            ],
            { numRuns: 100 },
        )('complete onboarding shows problem content without gate', (state) => {
            // Requirement 3.3: When participant completes onboarding, immediately allow access
            const uiState = determineAccessUIState(state);
            expect(uiState).toBe('show_content');
            expect(shouldBlockProblemContent(state)).toBe(false);
        });

        test.prop([participantNoAntiCheatArbitrary], { numRuns: 100 })(
            'participant in non-anti-cheat competition always gets access',
            (status) => {
                // Requirement 4.5: When anti-cheat is disabled, show normal competition access
                const shouldGrant = shouldGrantProblemAccess(status);
                expect(shouldGrant).toBe(true);
            },
        );

        test.prop(
            [
                competitionIdArbitrary.chain((id) =>
                    fc.record({
                        competitionId: fc.constant(id),
                        antiCheatEnabled: fc.constant(true),
                        isAuthenticated: fc.constant(true),
                        onboardingProgress: completeOnboardingProgressArbitrary(id),
                        backendOnboardingComplete: fc.constant(true),
                        isConnected: fc.constant(false), // Connection lost
                        isInterrupted: fc.boolean(),
                    }),
                ),
            ],
            { numRuns: 100 },
        )('complete onboarding allows access even with connection loss', (state) => {
            // Requirement 3.3: Access should be granted even if connection is lost
            // (warning is shown but access is not blocked)
            const uiState = determineAccessUIState(state);
            expect(uiState).toBe('show_content_with_warning');
            expect(shouldBlockProblemContent(state)).toBe(false);
        });

        test.prop([preJoinedIncompleteArbitrary], { numRuns: 100 })(
            'incomplete onboarding denies problem access',
            (status) => {
                // Requirement 3.3: Access should be denied if onboarding is not complete
                const shouldGrant = shouldGrantProblemAccess(status);
                expect(shouldGrant).toBe(false);
            },
        );
    });

    describe('Anti-Cheat Disabled Bypass', () => {
        test.prop(
            [
                competitionIdArbitrary.chain((id) =>
                    fc.record({
                        competitionId: fc.constant(id),
                        antiCheatEnabled: fc.constant(false), // Anti-cheat disabled
                        isAuthenticated: fc.boolean(),
                        onboardingProgress: fc.option(onboardingProgressArbitrary(id), {
                            nil: null,
                        }),
                        backendOnboardingComplete: fc.option(fc.boolean(), { nil: null }),
                        isConnected: fc.boolean(),
                        isInterrupted: fc.boolean(),
                    }),
                ),
            ],
            { numRuns: 100 },
        )('anti-cheat disabled always allows access', (state) => {
            const uiState = determineAccessUIState(state);
            expect(uiState).toBe('show_content');
            expect(shouldBlockProblemContent(state)).toBe(false);
        });
    });

    describe('Unauthenticated User Bypass', () => {
        test.prop(
            [
                competitionIdArbitrary.chain((id) =>
                    fc.record({
                        competitionId: fc.constant(id),
                        antiCheatEnabled: fc.boolean(),
                        isAuthenticated: fc.constant(false), // Not authenticated
                        onboardingProgress: fc.option(onboardingProgressArbitrary(id), {
                            nil: null,
                        }),
                        backendOnboardingComplete: fc.option(fc.boolean(), { nil: null }),
                        isConnected: fc.boolean(),
                        isInterrupted: fc.boolean(),
                    }),
                ),
            ],
            { numRuns: 100 },
        )('unauthenticated users always see content (auth handled elsewhere)', (state) => {
            const uiState = determineAccessUIState(state);
            expect(uiState).toBe('show_content');
            expect(shouldBlockProblemContent(state)).toBe(false);
        });
    });

    describe('Connection Loss Warning', () => {
        test.prop(
            [
                competitionIdArbitrary.chain((id) =>
                    fc.record({
                        competitionId: fc.constant(id),
                        antiCheatEnabled: fc.constant(true),
                        isAuthenticated: fc.constant(true),
                        onboardingProgress: completeOnboardingProgressArbitrary(id),
                        backendOnboardingComplete: fc.constant(true),
                        isConnected: fc.constant(false), // Disconnected
                        isInterrupted: fc.boolean(),
                    }),
                ),
            ],
            { numRuns: 100 },
        )('connection loss shows warning but allows access', (state) => {
            const uiState = determineAccessUIState(state);
            expect(uiState).toBe('show_content_with_warning');
            expect(shouldBlockProblemContent(state)).toBe(false);
            expect(shouldShowConnectionWarning(state)).toBe(true);
        });

        test.prop(
            [
                competitionIdArbitrary.chain((id) =>
                    fc.record({
                        competitionId: fc.constant(id),
                        antiCheatEnabled: fc.constant(true),
                        isAuthenticated: fc.constant(true),
                        onboardingProgress: completeOnboardingProgressArbitrary(id),
                        backendOnboardingComplete: fc.constant(true),
                        isConnected: fc.constant(true),
                        isInterrupted: fc.constant(true), // Interrupted
                    }),
                ),
            ],
            { numRuns: 100 },
        )('connection interrupted shows warning but allows access', (state) => {
            const uiState = determineAccessUIState(state);
            expect(uiState).toBe('show_content_with_warning');
            expect(shouldBlockProblemContent(state)).toBe(false);
            expect(shouldShowConnectionWarning(state)).toBe(true);
        });
    });

    describe('Complete Access Flow', () => {
        test.prop([problemAccessStateArbitrary], { numRuns: 100 })(
            'access decision is deterministic for any state',
            (state) => {
                const uiState1 = determineAccessUIState(state);
                const uiState2 = determineAccessUIState(state);

                // Same state should always produce same result
                expect(uiState1).toBe(uiState2);

                // UI state should be one of the valid states
                expect([
                    'show_content',
                    'show_onboarding_gate',
                    'show_content_with_warning',
                ]).toContain(uiState1);
            },
        );

        test.prop([problemAccessStateArbitrary], { numRuns: 100 })(
            'blocking and warning are mutually exclusive',
            (state) => {
                const isBlocked = shouldBlockProblemContent(state);
                const hasWarning = shouldShowConnectionWarning(state);

                // Cannot be both blocked and have warning
                expect(isBlocked && hasWarning).toBe(false);
            },
        );

        test.prop([problemAccessStateArbitrary], { numRuns: 100 })(
            'access state covers all cases',
            (state) => {
                const uiState = determineAccessUIState(state);
                const isBlocked = shouldBlockProblemContent(state);
                const hasWarning = shouldShowConnectionWarning(state);

                // Exactly one of the three states should be true
                const showsContent = uiState === 'show_content';
                const showsGate = uiState === 'show_onboarding_gate';
                const showsWarning = uiState === 'show_content_with_warning';

                expect(showsContent || showsGate || showsWarning).toBe(true);
                expect([showsContent, showsGate, showsWarning].filter(Boolean).length).toBe(1);

                // Verify consistency with helper functions
                expect(isBlocked).toBe(showsGate);
                expect(hasWarning).toBe(showsWarning);
            },
        );
    });
});
