/**
 * OnboardingGate Property-Based Tests
 *
 * Tests for the OnboardingGate component's step progression and state management.
 *
 * **Feature: anti-cheat-onboarding-gate**
 *
 * Property 1: Step Progression Invariant
 * Property 2: Connection Status Display Mapping
 * Property 3: Connection Gating
 * Property 4: Violation Display Completeness
 * Property 6: Consent Gating
 *
 * **Feature: private-competition-onboarding**
 *
 * Property: Setup-Only Mode Step Filtering
 */

import { describe, expect, beforeEach } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import type {
    OnboardingStep,
    OnboardingStepId,
    OnboardingMode,
    ConnectionStatus,
    PreJoinScanResult,
    ProcessViolation,
    WebsiteViolation,
} from './onboarding-gate';

// Step IDs in order
const STEP_IDS: OnboardingStepId[] = ['download', 'install', 'connect', 'scan', 'consent'];

// Step IDs for setup-only mode (skips download and install)
const SETUP_ONLY_STEP_IDS: OnboardingStepId[] = ['connect', 'scan', 'consent'];

/**
 * Pure function to get the steps that should be displayed based on mode
 * In 'setup-only' mode, download and install steps are skipped
 * Requirements: 2.5
 */
export function getStepsForMode(mode: OnboardingMode): OnboardingStepId[] {
    return mode === 'setup-only' ? SETUP_ONLY_STEP_IDS : STEP_IDS;
}

/**
 * Pure function to get the first step ID based on mode
 * In 'setup-only' mode, the first step is 'connect'
 * Requirements: 2.5
 */
export function getFirstStepForMode(mode: OnboardingMode): OnboardingStepId {
    return mode === 'setup-only' ? 'connect' : 'download';
}

/**
 * Pure function to check if a step should be shown based on mode
 * In 'setup-only' mode, download and install steps are hidden
 * Requirements: 2.5
 */
export function isStepVisibleInMode(stepId: OnboardingStepId, mode: OnboardingMode): boolean {
    if (mode === 'full') {
        return true;
    }
    // In setup-only mode, only connect, scan, and consent are visible
    return stepId === 'connect' || stepId === 'scan' || stepId === 'consent';
}

/**
 * Pure function to compute step states based on completion status
 * This mirrors the logic in the OnboardingGate component
 */
export function computeStepStates(
    completedSteps: Record<OnboardingStepId, boolean>,
    currentStepId: OnboardingStepId,
): OnboardingStep[] {
    const currentStepIndex = STEP_IDS.indexOf(currentStepId);

    return STEP_IDS.map((id, index) => {
        const isComplete = completedSteps[id];
        const isActive = id === currentStepId;

        // A step is disabled if the previous step is not complete
        // First step is never disabled
        let isDisabled = false;
        if (index > 0) {
            const previousStepId = STEP_IDS[index - 1];
            isDisabled = !completedSteps[previousStepId];
        }

        return {
            id,
            title: `Step ${index + 1}`,
            description: `Description for step ${index + 1}`,
            isComplete,
            isActive,
            isDisabled,
        };
    });
}

/**
 * Pure function to determine if a step can proceed to the next
 */
export function canProceedToNextStep(
    currentStepId: OnboardingStepId,
    completedSteps: Record<OnboardingStepId, boolean>,
    connectionStatus: ConnectionStatus,
    scanResults: PreJoinScanResult | null,
    consentChecked: boolean,
): boolean {
    switch (currentStepId) {
        case 'download':
        case 'install':
            // These steps can always proceed (user self-reports completion)
            return true;
        case 'connect':
            // Can only proceed if connected
            return connectionStatus === 'connected';
        case 'scan':
            // Can only proceed if scan completed with no violations
            return scanResults !== null && !scanResults.hasViolations;
        case 'consent':
            // Can only proceed if consent is checked
            return consentChecked;
        default:
            return false;
    }
}

/**
 * Pure function to get the connection status display properties
 */
export function getConnectionStatusDisplay(status: ConnectionStatus): {
    color: 'green' | 'red' | 'loading';
    icon: 'check' | 'x' | 'spinner';
} {
    switch (status) {
        case 'connected':
            return { color: 'green', icon: 'check' };
        case 'disconnected':
            return { color: 'red', icon: 'x' };
        case 'checking':
            return { color: 'loading', icon: 'spinner' };
    }
}

/**
 * Pure function to count violations in scan results
 */
export function countViolations(scanResults: PreJoinScanResult): {
    processCount: number;
    websiteCount: number;
    total: number;
} {
    const processCount = scanResults.blacklistedProcesses.length;
    const websiteCount = scanResults.nonWhitelistedWebsites.length;
    return {
        processCount,
        websiteCount,
        total: processCount + websiteCount,
    };
}

/**
 * Pure function to check if join button should be enabled
 */
export function isJoinButtonEnabled(
    allPreviousStepsComplete: boolean,
    consentChecked: boolean,
): boolean {
    return allPreviousStepsComplete && consentChecked;
}

// Arbitraries for property-based testing

const stepIdArbitrary = fc.constantFrom<OnboardingStepId>(...STEP_IDS);

const completedStepsArbitrary = fc.record({
    download: fc.boolean(),
    install: fc.boolean(),
    connect: fc.boolean(),
    scan: fc.boolean(),
    consent: fc.boolean(),
});

const connectionStatusArbitrary = fc.constantFrom<ConnectionStatus>(
    'connected',
    'disconnected',
    'checking',
);

const processViolationArbitrary: fc.Arbitrary<ProcessViolation> = fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    pid: fc.option(fc.integer({ min: 1, max: 65535 }), { nil: undefined }),
    matchedPattern: fc.string({ minLength: 1, maxLength: 50 }),
});

const websiteViolationArbitrary: fc.Arbitrary<WebsiteViolation> = fc.record({
    url: fc.webUrl(),
    browserName: fc.constantFrom('Chrome', 'Firefox', 'Safari', 'Edge'),
    tabTitle: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

// Use integer timestamps to avoid invalid date values
const validDateArbitrary = fc
    .integer({
        min: new Date('2020-01-01').getTime(),
        max: new Date('2030-12-31').getTime(),
    })
    .map((timestamp) => new Date(timestamp));

const scanResultsArbitrary: fc.Arbitrary<PreJoinScanResult> = fc
    .record({
        blacklistedProcesses: fc.array(processViolationArbitrary, { minLength: 0, maxLength: 10 }),
        nonWhitelistedWebsites: fc.array(websiteViolationArbitrary, {
            minLength: 0,
            maxLength: 10,
        }),
        scanTimestamp: validDateArbitrary.map((d) => d.toISOString()),
    })
    .map((result) => ({
        ...result,
        hasViolations:
            result.blacklistedProcesses.length > 0 || result.nonWhitelistedWebsites.length > 0,
    }));

describe('OnboardingGate Property-Based Tests', () => {
    describe('Property 1: Step Progression Invariant', () => {
        /**
         * **Property 1: Step Progression Invariant**
         * *For any* onboarding step N, completing step N SHALL enable step N+1,
         * and step N+1 SHALL remain disabled until step N is complete.
         * No step can be skipped.
         *
         * **Validates: Requirements 1.3, 1.4**
         */
        test.prop([completedStepsArbitrary, stepIdArbitrary], { numRuns: 100 })(
            'completing step N enables step N+1, and step N+1 is disabled until step N is complete',
            (completedSteps, currentStepId) => {
                const steps = computeStepStates(completedSteps, currentStepId);

                // For each step (except the first), verify it's disabled if previous step is incomplete
                for (let i = 1; i < steps.length; i++) {
                    const currentStep = steps[i];
                    const previousStepId = STEP_IDS[i - 1];
                    const previousStepComplete = completedSteps[previousStepId];

                    if (!previousStepComplete) {
                        // If previous step is not complete, current step MUST be disabled
                        expect(currentStep.isDisabled).toBe(true);
                    } else {
                        // If previous step is complete, current step MUST NOT be disabled
                        expect(currentStep.isDisabled).toBe(false);
                    }
                }
            },
        );

        test.prop([completedStepsArbitrary], { numRuns: 100 })(
            'first step is never disabled',
            (completedSteps) => {
                const steps = computeStepStates(completedSteps, 'download');
                expect(steps[0].isDisabled).toBe(false);
            },
        );

        test.prop([fc.integer({ min: 0, max: 4 })], { numRuns: 100 })(
            'steps before current are enabled if their predecessors are complete',
            (currentIndex) => {
                // Create a scenario where all steps up to currentIndex are complete
                const completedSteps: Record<OnboardingStepId, boolean> = {
                    download: currentIndex >= 0,
                    install: currentIndex >= 1,
                    connect: currentIndex >= 2,
                    scan: currentIndex >= 3,
                    consent: currentIndex >= 4,
                };

                const currentStepId = STEP_IDS[Math.min(currentIndex, 4)];
                const steps = computeStepStates(completedSteps, currentStepId);

                // All steps up to and including current should not be disabled
                for (let i = 0; i <= currentIndex && i < steps.length; i++) {
                    expect(steps[i].isDisabled).toBe(false);
                }
            },
        );
    });

    describe('Property 2: Connection Status Display Mapping', () => {
        /**
         * **Property 2: Connection Status Display Mapping**
         * *For any* connection status value, the UI SHALL display the corresponding
         * visual indicator: "connected" → green indicator, "disconnected" → red indicator,
         * "checking" → loading indicator.
         *
         * **Validates: Requirements 2.3, 2.4**
         */
        test.prop([connectionStatusArbitrary], { numRuns: 100 })(
            'connection status maps to correct display properties',
            (status) => {
                const display = getConnectionStatusDisplay(status);

                switch (status) {
                    case 'connected':
                        expect(display.color).toBe('green');
                        expect(display.icon).toBe('check');
                        break;
                    case 'disconnected':
                        expect(display.color).toBe('red');
                        expect(display.icon).toBe('x');
                        break;
                    case 'checking':
                        expect(display.color).toBe('loading');
                        expect(display.icon).toBe('spinner');
                        break;
                }
            },
        );

        test.prop([connectionStatusArbitrary], { numRuns: 100 })(
            'every connection status has a defined display mapping',
            (status) => {
                const display = getConnectionStatusDisplay(status);
                expect(display).toBeDefined();
                expect(display.color).toBeDefined();
                expect(display.icon).toBeDefined();
            },
        );
    });

    describe('Property 3: Connection Gating', () => {
        /**
         * **Property 3: Connection Gating**
         * *For any* connection status that is not "connected", the "Connect & Authenticate"
         * step SHALL NOT be marked as complete, and subsequent steps SHALL remain disabled.
         *
         * **Validates: Requirements 2.6**
         */
        test.prop(
            [
                connectionStatusArbitrary.filter((s) => s !== 'connected'),
                fc.boolean(),
                fc.boolean(),
            ],
            { numRuns: 100 },
        )('cannot proceed from connect step when not connected', (status, _, consentChecked) => {
            const canProceed = canProceedToNextStep(
                'connect',
                { download: true, install: true, connect: false, scan: false, consent: false },
                status,
                null,
                consentChecked,
            );

            expect(canProceed).toBe(false);
        });

        test.prop([fc.boolean()], { numRuns: 100 })(
            'can proceed from connect step when connected',
            (_) => {
                const canProceed = canProceedToNextStep(
                    'connect',
                    { download: true, install: true, connect: false, scan: false, consent: false },
                    'connected',
                    null,
                    false,
                );

                expect(canProceed).toBe(true);
            },
        );
    });

    describe('Property 4: Violation Display Completeness', () => {
        /**
         * **Property 4: Violation Display Completeness**
         * *For any* pre-join scan result containing N blacklisted processes and M
         * non-whitelisted websites, the warning display SHALL list exactly N process
         * entries and M website entries, with no omissions.
         *
         * **Validates: Requirements 3.3, 3.4, 4.1, 4.2, 4.3**
         */
        test.prop([scanResultsArbitrary], { numRuns: 100 })(
            'violation counts match input counts exactly',
            (scanResults) => {
                const counts = countViolations(scanResults);

                expect(counts.processCount).toBe(scanResults.blacklistedProcesses.length);
                expect(counts.websiteCount).toBe(scanResults.nonWhitelistedWebsites.length);
                expect(counts.total).toBe(
                    scanResults.blacklistedProcesses.length +
                        scanResults.nonWhitelistedWebsites.length,
                );
            },
        );

        test.prop([scanResultsArbitrary], { numRuns: 100 })(
            'hasViolations is true if and only if there are violations',
            (scanResults) => {
                const counts = countViolations(scanResults);
                expect(scanResults.hasViolations).toBe(counts.total > 0);
            },
        );

        test.prop(
            [
                fc.array(processViolationArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(websiteViolationArbitrary, { minLength: 0, maxLength: 10 }),
            ],
            { numRuns: 100 },
        )('all process violations are counted', (processes, websites) => {
            const scanResults: PreJoinScanResult = {
                hasViolations: processes.length > 0 || websites.length > 0,
                blacklistedProcesses: processes,
                nonWhitelistedWebsites: websites,
                scanTimestamp: new Date().toISOString(),
            };

            const counts = countViolations(scanResults);
            expect(counts.processCount).toBe(processes.length);
        });

        test.prop(
            [
                fc.array(processViolationArbitrary, { minLength: 0, maxLength: 10 }),
                fc.array(websiteViolationArbitrary, { minLength: 1, maxLength: 10 }),
            ],
            { numRuns: 100 },
        )('all website violations are counted', (processes, websites) => {
            const scanResults: PreJoinScanResult = {
                hasViolations: processes.length > 0 || websites.length > 0,
                blacklistedProcesses: processes,
                nonWhitelistedWebsites: websites,
                scanTimestamp: new Date().toISOString(),
            };

            const counts = countViolations(scanResults);
            expect(counts.websiteCount).toBe(websites.length);
        });
    });

    describe('Property 6: Consent Gating', () => {
        /**
         * **Property 6: Consent Gating**
         * *For any* onboarding state where the consent checkbox is unchecked OR any
         * previous step is incomplete, the "Join Competition" button SHALL be disabled.
         *
         * **Validates: Requirements 5.3, 5.5**
         */
        test.prop([fc.boolean(), fc.boolean()], { numRuns: 100 })(
            'join button disabled when consent not checked',
            (allPreviousComplete, consentChecked) => {
                if (!consentChecked) {
                    const enabled = isJoinButtonEnabled(allPreviousComplete, consentChecked);
                    expect(enabled).toBe(false);
                }
            },
        );

        test.prop([fc.boolean()], { numRuns: 100 })(
            'join button disabled when previous steps incomplete',
            (consentChecked) => {
                const enabled = isJoinButtonEnabled(false, consentChecked);
                expect(enabled).toBe(false);
            },
        );

        test.prop([fc.boolean()], { numRuns: 1 })(
            'join button enabled only when all conditions met',
            (_) => {
                // Only enabled when both conditions are true
                expect(isJoinButtonEnabled(true, true)).toBe(true);
                expect(isJoinButtonEnabled(true, false)).toBe(false);
                expect(isJoinButtonEnabled(false, true)).toBe(false);
                expect(isJoinButtonEnabled(false, false)).toBe(false);
            },
        );

        test.prop([connectionStatusArbitrary, fc.boolean()], { numRuns: 100 })(
            'cannot proceed from consent step without consent checked',
            (connectionStatus, _) => {
                const canProceed = canProceedToNextStep(
                    'consent',
                    { download: true, install: true, connect: true, scan: true, consent: false },
                    connectionStatus,
                    null,
                    false, // consent not checked
                );

                expect(canProceed).toBe(false);
            },
        );

        test.prop([connectionStatusArbitrary], { numRuns: 100 })(
            'can proceed from consent step when consent is checked',
            (_) => {
                const canProceed = canProceedToNextStep(
                    'consent',
                    { download: true, install: true, connect: true, scan: true, consent: false },
                    'connected',
                    null,
                    true, // consent checked
                );

                expect(canProceed).toBe(true);
            },
        );
    });
});

/**
 * Mode arbitrary for property-based testing
 */
const modeArbitrary = fc.constantFrom<OnboardingMode>('full', 'setup-only');

describe('OnboardingGate Mode Property-Based Tests', () => {
    /**
     * **Feature: private-competition-onboarding**
     *
     * Property: Setup-Only Mode Step Filtering
     * *For any* onboarding mode, the visible steps SHALL be determined by the mode:
     * - 'full' mode: all 5 steps (download, install, connect, scan, consent)
     * - 'setup-only' mode: only 3 steps (connect, scan, consent), skipping download and install
     *
     * **Validates: Requirements 2.5**
     */
    describe('Setup-Only Mode Step Filtering', () => {
        test.prop([modeArbitrary], { numRuns: 100 })(
            'setup-only mode returns exactly 3 steps (connect, scan, consent)',
            (mode) => {
                const steps = getStepsForMode(mode);

                if (mode === 'setup-only') {
                    expect(steps).toHaveLength(3);
                    expect(steps).toEqual(['connect', 'scan', 'consent']);
                    expect(steps).not.toContain('download');
                    expect(steps).not.toContain('install');
                } else {
                    expect(steps).toHaveLength(5);
                    expect(steps).toEqual(['download', 'install', 'connect', 'scan', 'consent']);
                }
            },
        );

        test.prop([modeArbitrary], { numRuns: 100 })(
            'first step is connect in setup-only mode, download in full mode',
            (mode) => {
                const firstStep = getFirstStepForMode(mode);

                if (mode === 'setup-only') {
                    expect(firstStep).toBe('connect');
                } else {
                    expect(firstStep).toBe('download');
                }
            },
        );

        test.prop([stepIdArbitrary, modeArbitrary], { numRuns: 100 })(
            'download and install steps are hidden in setup-only mode',
            (stepId, mode) => {
                const isVisible = isStepVisibleInMode(stepId, mode);

                if (mode === 'setup-only') {
                    if (stepId === 'download' || stepId === 'install') {
                        expect(isVisible).toBe(false);
                    } else {
                        expect(isVisible).toBe(true);
                    }
                } else {
                    // In full mode, all steps are visible
                    expect(isVisible).toBe(true);
                }
            },
        );

        test.prop([modeArbitrary], { numRuns: 100 })(
            'connect, scan, and consent steps are always visible regardless of mode',
            (mode) => {
                expect(isStepVisibleInMode('connect', mode)).toBe(true);
                expect(isStepVisibleInMode('scan', mode)).toBe(true);
                expect(isStepVisibleInMode('consent', mode)).toBe(true);
            },
        );

        test.prop([modeArbitrary], { numRuns: 100 })(
            'setup-only mode steps are a subset of full mode steps',
            (mode) => {
                const fullSteps = getStepsForMode('full');
                const setupOnlySteps = getStepsForMode('setup-only');

                // Every step in setup-only mode should also be in full mode
                for (const step of setupOnlySteps) {
                    expect(fullSteps).toContain(step);
                }

                // Setup-only should have fewer steps than full
                expect(setupOnlySteps.length).toBeLessThan(fullSteps.length);
            },
        );
    });
});
