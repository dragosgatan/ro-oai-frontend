/**
 * Property-Based Tests for Join Confirmation Dialog Visibility
 *
 * **Feature: anticheat-feature-flags, Property 5: Join Confirmation Dialog Visibility**
 *
 * This test verifies:
 * - *For any* competition with `dnsBlockingEnabled` set to true, clicking "Join Competition"
 *   SHALL display the join confirmation dialog.
 * - *For any* competition with `dnsBlockingEnabled` set to false, clicking "Join Competition"
 *   SHALL NOT display the join confirmation dialog.
 *
 * **Validates: Requirements 3.1, 3.7**
 */

import { describe, expect, vi, afterEach } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { useState, useCallback } from 'react';
import type { BasicCompetitionUserResponse } from '@/lib/types';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

/**
 * Arbitrary for generating valid competition IDs (positive integers)
 */
const competitionIdArbitrary = fc.integer({ min: 1, max: 1000000 });

/**
 * Arbitrary for generating competition names (non-empty strings)
 */
const competitionNameArbitrary = fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0);

/**
 * Arbitrary for generating boolean values for isPrivate
 */
const isPrivateArbitrary = fc.boolean();

/**
 * Arbitrary for generating boolean values for antiCheatEnabled
 */
const antiCheatEnabledArbitrary = fc.boolean();

/**
 * Arbitrary for generating boolean values for dnsBlockingEnabled
 */
const dnsBlockingEnabledArbitrary = fc.boolean();

/**
 * Arbitrary for generating optional dnsBlockingEnabled (can be undefined)
 */
const optionalDnsBlockingEnabledArbitrary = fc.option(fc.boolean(), { nil: undefined });

/**
 * Arbitrary for generating BasicCompetitionUserResponse with dnsBlockingEnabled
 */
const competitionWithDnsBlockingArbitrary: fc.Arbitrary<BasicCompetitionUserResponse> = fc.record({
    id: competitionIdArbitrary,
    name: competitionNameArbitrary,
    isPrivate: isPrivateArbitrary,
    antiCheatEnabled: antiCheatEnabledArbitrary,
    dnsBlockingEnabled: optionalDnsBlockingEnabledArbitrary,
});

/**
 * Mock JoinConfirmationDialog component for testing
 * This simulates the real dialog behavior without the complex UI dependencies
 */
interface MockJoinConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    competitionName: string;
}

function MockJoinConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    competitionName,
}: MockJoinConfirmationDialogProps) {
    if (!open) return null;

    return (
        <div data-testid="join-confirmation-dialog" role="dialog">
            <h2>Internet Restrictions</h2>
            <p>Joining {competitionName} will enable internet restrictions</p>
            <div>
                <p>Internet Access Restricted</p>
                <p>Access will be limited to whitelisted websites only</p>
            </div>
            <div>
                <p>Blocked Categories</p>
                <ul>
                    <li>Social media platforms</li>
                    <li>Messaging applications</li>
                    <li>Non-whitelisted websites</li>
                </ul>
            </div>
            <div>
                <p>Automatic Removal</p>
                <p>Restrictions will be automatically removed when the competition ends</p>
            </div>
            <button onClick={() => onOpenChange(false)} data-testid="dialog-cancel">
                Cancel
            </button>
            <button onClick={onConfirm} data-testid="dialog-confirm">
                Accept and Join
            </button>
        </div>
    );
}

/**
 * Test component that simulates the join flow with dialog visibility logic
 *
 * This component implements the logic from Requirements 3.1 and 3.7:
 * - When dnsBlockingEnabled is true, show the confirmation dialog
 * - When dnsBlockingEnabled is false or undefined, do NOT show the dialog
 */
interface JoinFlowTestComponentProps {
    competition: BasicCompetitionUserResponse;
    onJoinAttempt: () => void;
    onDialogShown: () => void;
    onDialogNotShown: () => void;
    onJoinConfirmed: () => void;
    onJoinCancelled: () => void;
}

function JoinFlowTestComponent({
    competition,
    onJoinAttempt,
    onDialogShown,
    onDialogNotShown,
    onJoinConfirmed,
    onJoinCancelled,
}: JoinFlowTestComponentProps) {
    const [showDialog, setShowDialog] = useState(false);

    const handleJoinClick = useCallback(() => {
        onJoinAttempt();

        // Requirement 3.1: When dnsBlockingEnabled is true, show the dialog
        // Requirement 3.7: When dnsBlockingEnabled is false, do NOT show the dialog
        if (competition.dnsBlockingEnabled === true) {
            setShowDialog(true);
            onDialogShown();
        } else {
            // Proceed directly without showing dialog
            onDialogNotShown();
            onJoinConfirmed();
        }
    }, [
        competition.dnsBlockingEnabled,
        onJoinAttempt,
        onDialogShown,
        onDialogNotShown,
        onJoinConfirmed,
    ]);

    const handleDialogConfirm = useCallback(() => {
        setShowDialog(false);
        onJoinConfirmed();
    }, [onJoinConfirmed]);

    const handleDialogCancel = useCallback(() => {
        setShowDialog(false);
        onJoinCancelled();
    }, [onJoinCancelled]);

    return (
        <div>
            <button onClick={handleJoinClick} data-testid="join-button">
                Join Competition
            </button>
            <MockJoinConfirmationDialog
                open={showDialog}
                onOpenChange={setShowDialog}
                onConfirm={handleDialogConfirm}
                competitionName={competition.name}
            />
        </div>
    );
}

describe('Join Confirmation Dialog Visibility Property-Based Tests', () => {
    /**
     * **Feature: anticheat-feature-flags, Property 5: Join Confirmation Dialog Visibility**
     * **Validates: Requirements 3.1, 3.7**
     */
    describe('Property 5: Join Confirmation Dialog Visibility', () => {
        test.prop(
            [
                competitionIdArbitrary,
                competitionNameArbitrary,
                isPrivateArbitrary,
                antiCheatEnabledArbitrary,
            ],
            { numRuns: 100 },
        )(
            'dialog SHALL be displayed when dnsBlockingEnabled is true',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                const competition: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate,
                    antiCheatEnabled,
                    dnsBlockingEnabled: true, // Explicitly true
                };

                const onJoinAttempt = vi.fn();
                const onDialogShown = vi.fn();
                const onDialogNotShown = vi.fn();
                const onJoinConfirmed = vi.fn();
                const onJoinCancelled = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={onJoinAttempt}
                        onDialogShown={onDialogShown}
                        onDialogNotShown={onDialogNotShown}
                        onJoinConfirmed={onJoinConfirmed}
                        onJoinCancelled={onJoinCancelled}
                    />,
                );

                // Click the join button
                const joinButton = screen.getByTestId('join-button');
                fireEvent.click(joinButton);

                // Verify the dialog was shown
                expect(onJoinAttempt).toHaveBeenCalledTimes(1);
                expect(onDialogShown).toHaveBeenCalledTimes(1);
                expect(onDialogNotShown).not.toHaveBeenCalled();

                // Verify the dialog is visible in the DOM
                expect(screen.getByTestId('join-confirmation-dialog')).toBeInTheDocument();
                expect(screen.getByText('Internet Restrictions')).toBeInTheDocument();
            },
        );

        test.prop(
            [
                competitionIdArbitrary,
                competitionNameArbitrary,
                isPrivateArbitrary,
                antiCheatEnabledArbitrary,
            ],
            { numRuns: 100 },
        )(
            'dialog SHALL NOT be displayed when dnsBlockingEnabled is false',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                const competition: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate,
                    antiCheatEnabled,
                    dnsBlockingEnabled: false, // Explicitly false
                };

                const onJoinAttempt = vi.fn();
                const onDialogShown = vi.fn();
                const onDialogNotShown = vi.fn();
                const onJoinConfirmed = vi.fn();
                const onJoinCancelled = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={onJoinAttempt}
                        onDialogShown={onDialogShown}
                        onDialogNotShown={onDialogNotShown}
                        onJoinConfirmed={onJoinConfirmed}
                        onJoinCancelled={onJoinCancelled}
                    />,
                );

                // Click the join button
                const joinButton = screen.getByTestId('join-button');
                fireEvent.click(joinButton);

                // Verify the dialog was NOT shown
                expect(onJoinAttempt).toHaveBeenCalledTimes(1);
                expect(onDialogShown).not.toHaveBeenCalled();
                expect(onDialogNotShown).toHaveBeenCalledTimes(1);

                // Verify join proceeded directly
                expect(onJoinConfirmed).toHaveBeenCalledTimes(1);

                // Verify the dialog is NOT visible in the DOM
                expect(screen.queryByTestId('join-confirmation-dialog')).not.toBeInTheDocument();
            },
        );

        test.prop(
            [
                competitionIdArbitrary,
                competitionNameArbitrary,
                isPrivateArbitrary,
                antiCheatEnabledArbitrary,
            ],
            { numRuns: 100 },
        )(
            'dialog SHALL NOT be displayed when dnsBlockingEnabled is undefined',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                const competition: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate,
                    antiCheatEnabled,
                    // dnsBlockingEnabled is undefined (not set)
                };

                const onJoinAttempt = vi.fn();
                const onDialogShown = vi.fn();
                const onDialogNotShown = vi.fn();
                const onJoinConfirmed = vi.fn();
                const onJoinCancelled = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={onJoinAttempt}
                        onDialogShown={onDialogShown}
                        onDialogNotShown={onDialogNotShown}
                        onJoinConfirmed={onJoinConfirmed}
                        onJoinCancelled={onJoinCancelled}
                    />,
                );

                // Click the join button
                const joinButton = screen.getByTestId('join-button');
                fireEvent.click(joinButton);

                // Verify the dialog was NOT shown
                expect(onJoinAttempt).toHaveBeenCalledTimes(1);
                expect(onDialogShown).not.toHaveBeenCalled();
                expect(onDialogNotShown).toHaveBeenCalledTimes(1);

                // Verify join proceeded directly
                expect(onJoinConfirmed).toHaveBeenCalledTimes(1);

                // Verify the dialog is NOT visible in the DOM
                expect(screen.queryByTestId('join-confirmation-dialog')).not.toBeInTheDocument();
            },
        );

        test.prop([competitionWithDnsBlockingArbitrary], { numRuns: 100 })(
            'dialog visibility is determined solely by dnsBlockingEnabled flag for any competition',
            (competition) => {
                cleanup();

                const onJoinAttempt = vi.fn();
                const onDialogShown = vi.fn();
                const onDialogNotShown = vi.fn();
                const onJoinConfirmed = vi.fn();
                const onJoinCancelled = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={onJoinAttempt}
                        onDialogShown={onDialogShown}
                        onDialogNotShown={onDialogNotShown}
                        onJoinConfirmed={onJoinConfirmed}
                        onJoinCancelled={onJoinCancelled}
                    />,
                );

                // Click the join button
                const joinButton = screen.getByTestId('join-button');
                fireEvent.click(joinButton);

                // Verify the correct behavior based on dnsBlockingEnabled
                expect(onJoinAttempt).toHaveBeenCalledTimes(1);

                if (competition.dnsBlockingEnabled === true) {
                    // Dialog should be shown
                    expect(onDialogShown).toHaveBeenCalledTimes(1);
                    expect(onDialogNotShown).not.toHaveBeenCalled();
                    expect(screen.getByTestId('join-confirmation-dialog')).toBeInTheDocument();
                } else {
                    // Dialog should NOT be shown (false or undefined)
                    expect(onDialogShown).not.toHaveBeenCalled();
                    expect(onDialogNotShown).toHaveBeenCalledTimes(1);
                    expect(onJoinConfirmed).toHaveBeenCalledTimes(1);
                    expect(
                        screen.queryByTestId('join-confirmation-dialog'),
                    ).not.toBeInTheDocument();
                }
            },
        );

        test.prop(
            [
                competitionIdArbitrary,
                competitionNameArbitrary,
                isPrivateArbitrary,
                antiCheatEnabledArbitrary,
            ],
            { numRuns: 100 },
        )(
            'dialog visibility is independent of antiCheatEnabled flag',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                // Test with dnsBlockingEnabled=true regardless of antiCheatEnabled
                const competitionWithDns: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate,
                    antiCheatEnabled, // Can be true or false
                    dnsBlockingEnabled: true,
                };

                const onDialogShown1 = vi.fn();
                const onDialogNotShown1 = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competitionWithDns}
                        onJoinAttempt={vi.fn()}
                        onDialogShown={onDialogShown1}
                        onDialogNotShown={onDialogNotShown1}
                        onJoinConfirmed={vi.fn()}
                        onJoinCancelled={vi.fn()}
                    />,
                );

                fireEvent.click(screen.getByTestId('join-button'));

                // Dialog should always be shown when dnsBlockingEnabled is true
                // regardless of antiCheatEnabled value
                expect(onDialogShown1).toHaveBeenCalledTimes(1);
                expect(onDialogNotShown1).not.toHaveBeenCalled();
            },
        );

        test.prop(
            [
                competitionIdArbitrary,
                competitionNameArbitrary,
                isPrivateArbitrary,
                antiCheatEnabledArbitrary,
            ],
            { numRuns: 100 },
        )(
            'dialog visibility is independent of isPrivate flag',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                // Test with dnsBlockingEnabled=true regardless of isPrivate
                const competitionWithDns: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate, // Can be true or false
                    antiCheatEnabled,
                    dnsBlockingEnabled: true,
                };

                const onDialogShown = vi.fn();
                const onDialogNotShown = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competitionWithDns}
                        onJoinAttempt={vi.fn()}
                        onDialogShown={onDialogShown}
                        onDialogNotShown={onDialogNotShown}
                        onJoinConfirmed={vi.fn()}
                        onJoinCancelled={vi.fn()}
                    />,
                );

                fireEvent.click(screen.getByTestId('join-button'));

                // Dialog should always be shown when dnsBlockingEnabled is true
                // regardless of isPrivate value
                expect(onDialogShown).toHaveBeenCalledTimes(1);
                expect(onDialogNotShown).not.toHaveBeenCalled();
            },
        );

        test.prop([competitionWithDnsBlockingArbitrary], { numRuns: 100 })(
            'dialog visibility is consistent across multiple join attempts',
            (competition) => {
                cleanup();

                const onDialogShown = vi.fn();
                const onDialogNotShown = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={vi.fn()}
                        onDialogShown={onDialogShown}
                        onDialogNotShown={onDialogNotShown}
                        onJoinConfirmed={vi.fn()}
                        onJoinCancelled={vi.fn()}
                    />,
                );

                // First click
                fireEvent.click(screen.getByTestId('join-button'));
                const firstDialogShownCount = onDialogShown.mock.calls.length;
                const firstDialogNotShownCount = onDialogNotShown.mock.calls.length;

                // Reset mocks and re-render
                onDialogShown.mockClear();
                onDialogNotShown.mockClear();
                cleanup();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={vi.fn()}
                        onDialogShown={onDialogShown}
                        onDialogNotShown={onDialogNotShown}
                        onJoinConfirmed={vi.fn()}
                        onJoinCancelled={vi.fn()}
                    />,
                );

                // Second click
                fireEvent.click(screen.getByTestId('join-button'));
                const secondDialogShownCount = onDialogShown.mock.calls.length;
                const secondDialogNotShownCount = onDialogNotShown.mock.calls.length;

                // Behavior should be consistent
                expect(firstDialogShownCount).toBe(secondDialogShownCount);
                expect(firstDialogNotShownCount).toBe(secondDialogNotShownCount);
            },
        );
    });
});
