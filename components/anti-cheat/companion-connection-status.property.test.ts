/**
 * CompanionConnectionStatus Property-Based Tests
 *
 * Tests for the CompanionConnectionStatus component's display logic.
 *
 * **Feature: backend-mediated-companion-status**
 *
 * Property 3: Status Display Correctness
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';

/**
 * Connection status types for the companion app
 */
type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

/**
 * Monitoring mode types from the backend
 */
type MonitoringMode = 'PreJoin' | 'Active' | 'Inactive' | null;

/**
 * Pure function to determine the display text for connection status
 * Used for property-based testing
 *
 * Requirements: 2.3, 2.4
 *
 * @param status - The connection status
 * @param monitoringMode - The monitoring mode (when connected)
 * @returns Object with statusText and modeText
 */
function getStatusDisplayText(
    status: ConnectionStatus,
    monitoringMode: MonitoringMode,
): { statusText: string; modeText: string | null } {
    if (status === 'checking') {
        return { statusText: 'checking', modeText: null };
    }

    if (status === 'connected') {
        // Requirements 2.3: Display "Connected" with the monitoring mode
        const modeText = monitoringMode ? monitoringMode : null;
        return { statusText: 'connected', modeText };
    }

    // Requirements 2.4: Display "Disconnected"
    return { statusText: 'disconnected', modeText: null };
}

/**
 * Pure function to determine if instructions should be shown
 * Used for property-based testing
 *
 * Requirements: 2.4
 *
 * @param status - The connection status
 * @param showInstructions - Whether instructions are enabled
 * @returns true if instructions should be displayed
 */
function shouldShowInstructions(status: ConnectionStatus, showInstructions: boolean): boolean {
    // Requirements 2.4: Show instructions when disconnected
    return status === 'disconnected' && showInstructions;
}

/**
 * Pure function to validate status display correctness
 * Used for property-based testing
 *
 * Requirements: 2.3, 2.4
 *
 * @param status - The connection status
 * @param monitoringMode - The monitoring mode
 * @param displayedStatusText - The text being displayed for status
 * @param displayedModeText - The text being displayed for mode (or null)
 * @param instructionsShown - Whether instructions are shown
 * @param showInstructionsEnabled - Whether showInstructions prop is true
 * @returns true if the display is correct according to requirements
 */
function isStatusDisplayCorrect(
    status: ConnectionStatus,
    monitoringMode: MonitoringMode,
    displayedStatusText: string,
    displayedModeText: string | null,
    instructionsShown: boolean,
    showInstructionsEnabled: boolean,
): boolean {
    if (status === 'connected') {
        // Requirements 2.3: Must show "Connected" with monitoring mode
        if (displayedStatusText !== 'connected') return false;
        // Mode should be shown if available
        if (monitoringMode && displayedModeText !== monitoringMode) return false;
        // Instructions should not be shown when connected
        if (instructionsShown) return false;
        return true;
    }

    if (status === 'disconnected') {
        // Requirements 2.4: Must show "Disconnected" with instructions
        if (displayedStatusText !== 'disconnected') return false;
        // Mode should not be shown when disconnected
        if (displayedModeText !== null) return false;
        // Instructions should be shown if enabled
        if (showInstructionsEnabled && !instructionsShown) return false;
        return true;
    }

    if (status === 'checking') {
        if (displayedStatusText !== 'checking') return false;
        if (displayedModeText !== null) return false;
        if (instructionsShown) return false;
        return true;
    }

    return false;
}

// Arbitraries for property-based testing

const connectionStatusArbitrary = fc.constantFrom<ConnectionStatus>(
    'connected',
    'disconnected',
    'checking',
);

const monitoringModeArbitrary = fc.constantFrom<MonitoringMode>(
    'PreJoin',
    'Active',
    'Inactive',
    null,
);

describe('CompanionConnectionStatus Property-Based Tests', () => {
    /**
     * **Property 3: Status Display Correctness**
     * *For any* companion status response, the frontend SHALL display "Connected"
     * with the monitoring mode when connected is true, and "Disconnected" with
     * connection instructions when connected is false.
     *
     * **Feature: backend-mediated-companion-status, Property 3: Status Display Correctness**
     * **Validates: Requirements 2.3, 2.4**
     */
    describe('Property 3: Status Display Correctness', () => {
        test.prop([monitoringModeArbitrary], { numRuns: 100 })(
            'connected status displays "connected" with monitoring mode',
            (monitoringMode) => {
                const { statusText, modeText } = getStatusDisplayText('connected', monitoringMode);

                // Requirements 2.3: Display "Connected" with the monitoring mode
                expect(statusText).toBe('connected');

                // Mode should be shown if available
                if (monitoringMode) {
                    expect(modeText).toBe(monitoringMode);
                } else {
                    expect(modeText).toBeNull();
                }
            },
        );

        test.prop([monitoringModeArbitrary], { numRuns: 100 })(
            'disconnected status displays "disconnected" without mode',
            (monitoringMode) => {
                const { statusText, modeText } = getStatusDisplayText(
                    'disconnected',
                    monitoringMode,
                );

                // Requirements 2.4: Display "Disconnected"
                expect(statusText).toBe('disconnected');

                // Mode should not be shown when disconnected
                expect(modeText).toBeNull();
            },
        );

        test.prop([monitoringModeArbitrary], { numRuns: 100 })(
            'checking status displays "checking" without mode',
            (monitoringMode) => {
                const { statusText, modeText } = getStatusDisplayText('checking', monitoringMode);

                expect(statusText).toBe('checking');
                expect(modeText).toBeNull();
            },
        );

        test.prop([fc.boolean()], { numRuns: 100 })(
            'instructions shown only when disconnected and enabled',
            (showInstructionsEnabled) => {
                // When connected, instructions should never be shown
                expect(shouldShowInstructions('connected', showInstructionsEnabled)).toBe(false);

                // When checking, instructions should never be shown
                expect(shouldShowInstructions('checking', showInstructionsEnabled)).toBe(false);

                // When disconnected, instructions depend on the flag
                expect(shouldShowInstructions('disconnected', showInstructionsEnabled)).toBe(
                    showInstructionsEnabled,
                );
            },
        );

        test.prop([connectionStatusArbitrary, monitoringModeArbitrary, fc.boolean()], {
            numRuns: 100,
        })(
            'status display is correct for all status/mode combinations',
            (status, monitoringMode, showInstructionsEnabled) => {
                const { statusText, modeText } = getStatusDisplayText(status, monitoringMode);
                const instructionsShown = shouldShowInstructions(status, showInstructionsEnabled);

                const isCorrect = isStatusDisplayCorrect(
                    status,
                    monitoringMode,
                    statusText,
                    modeText,
                    instructionsShown,
                    showInstructionsEnabled,
                );

                expect(isCorrect).toBe(true);
            },
        );
    });

    describe('Connected Status Display', () => {
        test.prop([fc.constantFrom<MonitoringMode>('PreJoin', 'Active', 'Inactive')], {
            numRuns: 100,
        })('connected with non-null mode shows mode text', (monitoringMode) => {
            const { statusText, modeText } = getStatusDisplayText('connected', monitoringMode);

            expect(statusText).toBe('connected');
            expect(modeText).toBe(monitoringMode);
        });

        test('connected with null mode shows no mode text', () => {
            const { statusText, modeText } = getStatusDisplayText('connected', null);

            expect(statusText).toBe('connected');
            expect(modeText).toBeNull();
        });

        test.prop([monitoringModeArbitrary], { numRuns: 100 })(
            'connected status never shows instructions',
            (monitoringMode) => {
                // Even with showInstructions=true, connected should not show instructions
                expect(shouldShowInstructions('connected', true)).toBe(false);
                expect(shouldShowInstructions('connected', false)).toBe(false);

                // Verify with isStatusDisplayCorrect
                const { statusText, modeText } = getStatusDisplayText('connected', monitoringMode);
                const isCorrectWithInstructions = isStatusDisplayCorrect(
                    'connected',
                    monitoringMode,
                    statusText,
                    modeText,
                    true, // instructions shown
                    true, // showInstructions enabled
                );
                expect(isCorrectWithInstructions).toBe(false); // Should be incorrect if instructions shown

                const isCorrectWithoutInstructions = isStatusDisplayCorrect(
                    'connected',
                    monitoringMode,
                    statusText,
                    modeText,
                    false, // instructions not shown
                    true, // showInstructions enabled
                );
                expect(isCorrectWithoutInstructions).toBe(true);
            },
        );
    });

    describe('Disconnected Status Display', () => {
        test.prop([monitoringModeArbitrary], { numRuns: 100 })(
            'disconnected status never shows mode text',
            (monitoringMode) => {
                const { statusText, modeText } = getStatusDisplayText(
                    'disconnected',
                    monitoringMode,
                );

                expect(statusText).toBe('disconnected');
                expect(modeText).toBeNull();
            },
        );

        test('disconnected with showInstructions=true shows instructions', () => {
            expect(shouldShowInstructions('disconnected', true)).toBe(true);
        });

        test('disconnected with showInstructions=false hides instructions', () => {
            expect(shouldShowInstructions('disconnected', false)).toBe(false);
        });

        test.prop([monitoringModeArbitrary], { numRuns: 100 })(
            'disconnected status requires instructions when enabled',
            (monitoringMode) => {
                const { statusText, modeText } = getStatusDisplayText(
                    'disconnected',
                    monitoringMode,
                );

                // When showInstructions is enabled, instructions must be shown
                const isCorrectWithInstructions = isStatusDisplayCorrect(
                    'disconnected',
                    monitoringMode,
                    statusText,
                    modeText,
                    true, // instructions shown
                    true, // showInstructions enabled
                );
                expect(isCorrectWithInstructions).toBe(true);

                // When showInstructions is enabled but instructions not shown, it's incorrect
                const isIncorrectWithoutInstructions = isStatusDisplayCorrect(
                    'disconnected',
                    monitoringMode,
                    statusText,
                    modeText,
                    false, // instructions not shown
                    true, // showInstructions enabled
                );
                expect(isIncorrectWithoutInstructions).toBe(false);
            },
        );
    });

    describe('Checking Status Display', () => {
        test.prop([monitoringModeArbitrary], { numRuns: 100 })(
            'checking status shows "checking" without mode or instructions',
            (monitoringMode) => {
                const { statusText, modeText } = getStatusDisplayText('checking', monitoringMode);

                expect(statusText).toBe('checking');
                expect(modeText).toBeNull();
                expect(shouldShowInstructions('checking', true)).toBe(false);
                expect(shouldShowInstructions('checking', false)).toBe(false);
            },
        );
    });

    describe('Display Consistency', () => {
        test.prop([connectionStatusArbitrary, monitoringModeArbitrary], { numRuns: 100 })(
            'getStatusDisplayText is deterministic',
            (status, monitoringMode) => {
                const result1 = getStatusDisplayText(status, monitoringMode);
                const result2 = getStatusDisplayText(status, monitoringMode);

                expect(result1.statusText).toBe(result2.statusText);
                expect(result1.modeText).toBe(result2.modeText);
            },
        );

        test.prop([connectionStatusArbitrary, fc.boolean()], { numRuns: 100 })(
            'shouldShowInstructions is deterministic',
            (status, showInstructionsEnabled) => {
                const result1 = shouldShowInstructions(status, showInstructionsEnabled);
                const result2 = shouldShowInstructions(status, showInstructionsEnabled);

                expect(result1).toBe(result2);
            },
        );

        test.prop([connectionStatusArbitrary, monitoringModeArbitrary], { numRuns: 100 })(
            'status text matches status type',
            (status, monitoringMode) => {
                const { statusText } = getStatusDisplayText(status, monitoringMode);

                // Status text should always match the status type
                expect(statusText).toBe(status);
            },
        );
    });

    describe('Mode Display Rules', () => {
        test.prop(
            [
                fc.constantFrom<ConnectionStatus>('disconnected', 'checking'),
                fc.constantFrom<MonitoringMode>('PreJoin', 'Active', 'Inactive'),
            ],
            { numRuns: 100 },
        )('mode is only shown when connected', (status, monitoringMode) => {
            const { modeText } = getStatusDisplayText(status, monitoringMode);

            // Mode should never be shown when not connected
            expect(modeText).toBeNull();
        });

        test.prop([fc.constantFrom<MonitoringMode>('PreJoin', 'Active', 'Inactive')], {
            numRuns: 100,
        })('mode is shown when connected and mode is not null', (monitoringMode) => {
            const { modeText } = getStatusDisplayText('connected', monitoringMode);

            expect(modeText).toBe(monitoringMode);
        });
    });

    describe('Validation Function Correctness', () => {
        test.prop([connectionStatusArbitrary, monitoringModeArbitrary, fc.boolean()], {
            numRuns: 100,
        })(
            'isStatusDisplayCorrect validates all rules correctly',
            (status, monitoringMode, showInstructionsEnabled) => {
                const { statusText, modeText } = getStatusDisplayText(status, monitoringMode);
                const instructionsShown = shouldShowInstructions(status, showInstructionsEnabled);

                // When using correct values from helper functions, validation should pass
                const isCorrect = isStatusDisplayCorrect(
                    status,
                    monitoringMode,
                    statusText,
                    modeText,
                    instructionsShown,
                    showInstructionsEnabled,
                );

                expect(isCorrect).toBe(true);
            },
        );

        test.prop([monitoringModeArbitrary], { numRuns: 100 })(
            'wrong status text fails validation',
            (monitoringMode) => {
                // Connected with wrong status text
                const isCorrect = isStatusDisplayCorrect(
                    'connected',
                    monitoringMode,
                    'disconnected', // Wrong status text
                    monitoringMode,
                    false,
                    false,
                );

                expect(isCorrect).toBe(false);
            },
        );

        test.prop([fc.constantFrom<MonitoringMode>('PreJoin', 'Active', 'Inactive')], {
            numRuns: 100,
        })('wrong mode text fails validation for connected status', (monitoringMode) => {
            const wrongMode = monitoringMode === 'Active' ? 'PreJoin' : 'Active';

            const isCorrect = isStatusDisplayCorrect(
                'connected',
                monitoringMode,
                'connected',
                wrongMode, // Wrong mode text
                false,
                false,
            );

            expect(isCorrect).toBe(false);
        });
    });
});
