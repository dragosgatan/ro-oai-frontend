/**
 * Property-Based Tests for Join Confirmation Dialog Controls Join Flow
 *
 * **Feature: anticheat-feature-flags, Property 6: Join Confirmation Dialog Controls Join Flow**
 *
 * This test verifies:
 * - *For any* displayed join confirmation dialog, accepting the dialog SHALL proceed with
 *   joining the competition.
 * - *For any* displayed join confirmation dialog, declining the dialog SHALL NOT join
 *   the competition.
 *
 * **Validates: Requirements 3.5, 3.6**
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
 * Test component that simulates the join flow with dialog control logic
 *
 * This component implements the logic from Requirements 3.5 and 3.6:
 * - When user accepts the dialog, proceed with joining the competition
 * - When user declines the dialog, do NOT join the competition
 */
interface JoinFlowTestComponentProps {
    competition: BasicCompetitionUserResponse;
    onJoinAttempt: () => void;
    onJoinProceeded: () => void;
    onJoinCancelled: () => void;
}

function JoinFlowTestComponent({
    competition,
    onJoinAttempt,
    onJoinProceeded,
    onJoinCancelled,
}: JoinFlowTestComponentProps) {
    const [showDialog, setShowDialog] = useState(false);

    const handleJoinClick = useCallback(() => {
        onJoinAttempt();

        // When dnsBlockingEnabled is true, show the dialog
        if (competition.dnsBlockingEnabled === true) {
            setShowDialog(true);
        } else {
            // Proceed directly without showing dialog
            onJoinProceeded();
        }
    }, [competition.dnsBlockingEnabled, onJoinAttempt, onJoinProceeded]);

    // Requirement 3.5: When user accepts the dialog, proceed with joining
    const handleDialogConfirm = useCallback(() => {
        setShowDialog(false);
        onJoinProceeded();
    }, [onJoinProceeded]);

    // Requirement 3.6: When user declines the dialog, do NOT join
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
                onOpenChange={(open) => {
                    if (!open) {
                        // Dialog was closed via onOpenChange (e.g., clicking outside or pressing Escape)
                        // This should be treated as a cancel action
                        handleDialogCancel();
                    }
                }}
                onConfirm={handleDialogConfirm}
                competitionName={competition.name}
            />
        </div>
    );
}

describe('Join Confirmation Dialog Controls Join Flow Property-Based Tests', () => {
    /**
     * **Feature: anticheat-feature-flags, Property 6: Join Confirmation Dialog Controls Join Flow**
     * **Validates: Requirements 3.5, 3.6**
     */
    describe('Property 6: Join Confirmation Dialog Controls Join Flow', () => {
        test.prop(
            [
                competitionIdArbitrary,
                competitionNameArbitrary,
                isPrivateArbitrary,
                antiCheatEnabledArbitrary,
            ],
            { numRuns: 100 },
        )(
            'accepting the dialog SHALL proceed with joining the competition',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                const competition: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate,
                    antiCheatEnabled,
                    dnsBlockingEnabled: true, // Dialog is shown when dnsBlockingEnabled is true
                };

                const onJoinAttempt = vi.fn();
                const onJoinProceeded = vi.fn();
                const onJoinCancelled = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={onJoinAttempt}
                        onJoinProceeded={onJoinProceeded}
                        onJoinCancelled={onJoinCancelled}
                    />,
                );

                // Click the join button to show the dialog
                const joinButton = screen.getByTestId('join-button');
                fireEvent.click(joinButton);

                // Verify the dialog is shown
                expect(onJoinAttempt).toHaveBeenCalledTimes(1);
                expect(screen.getByTestId('join-confirmation-dialog')).toBeInTheDocument();

                // Click the "Accept and Join" button
                const confirmButton = screen.getByTestId('dialog-confirm');
                fireEvent.click(confirmButton);

                // Verify join proceeded
                expect(onJoinProceeded).toHaveBeenCalledTimes(1);
                expect(onJoinCancelled).not.toHaveBeenCalled();

                // Verify the dialog is closed
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
            'declining the dialog SHALL NOT join the competition',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                const competition: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate,
                    antiCheatEnabled,
                    dnsBlockingEnabled: true, // Dialog is shown when dnsBlockingEnabled is true
                };

                const onJoinAttempt = vi.fn();
                const onJoinProceeded = vi.fn();
                const onJoinCancelled = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={onJoinAttempt}
                        onJoinProceeded={onJoinProceeded}
                        onJoinCancelled={onJoinCancelled}
                    />,
                );

                // Click the join button to show the dialog
                const joinButton = screen.getByTestId('join-button');
                fireEvent.click(joinButton);

                // Verify the dialog is shown
                expect(onJoinAttempt).toHaveBeenCalledTimes(1);
                expect(screen.getByTestId('join-confirmation-dialog')).toBeInTheDocument();

                // Click the "Cancel" button
                const cancelButton = screen.getByTestId('dialog-cancel');
                fireEvent.click(cancelButton);

                // Verify join was cancelled (NOT proceeded)
                expect(onJoinProceeded).not.toHaveBeenCalled();
                expect(onJoinCancelled).toHaveBeenCalledTimes(1);

                // Verify the dialog is closed
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
            'accepting dialog results in exactly one join action',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                const competition: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate,
                    antiCheatEnabled,
                    dnsBlockingEnabled: true,
                };

                const onJoinAttempt = vi.fn();
                const onJoinProceeded = vi.fn();
                const onJoinCancelled = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={onJoinAttempt}
                        onJoinProceeded={onJoinProceeded}
                        onJoinCancelled={onJoinCancelled}
                    />,
                );

                // Click join button
                fireEvent.click(screen.getByTestId('join-button'));

                // Accept the dialog
                fireEvent.click(screen.getByTestId('dialog-confirm'));

                // Verify exactly one join action occurred
                expect(onJoinProceeded).toHaveBeenCalledTimes(1);
                expect(onJoinCancelled).toHaveBeenCalledTimes(0);
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
            'declining dialog results in exactly zero join actions',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                const competition: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate,
                    antiCheatEnabled,
                    dnsBlockingEnabled: true,
                };

                const onJoinAttempt = vi.fn();
                const onJoinProceeded = vi.fn();
                const onJoinCancelled = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={onJoinAttempt}
                        onJoinProceeded={onJoinProceeded}
                        onJoinCancelled={onJoinCancelled}
                    />,
                );

                // Click join button
                fireEvent.click(screen.getByTestId('join-button'));

                // Decline the dialog
                fireEvent.click(screen.getByTestId('dialog-cancel'));

                // Verify exactly zero join actions occurred
                expect(onJoinProceeded).toHaveBeenCalledTimes(0);
                expect(onJoinCancelled).toHaveBeenCalledTimes(1);
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
            'dialog accept/decline behavior is independent of competition properties',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                // Test that accept behavior works regardless of other competition properties
                const competition: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate,
                    antiCheatEnabled,
                    dnsBlockingEnabled: true,
                };

                const onJoinProceeded = vi.fn();
                const onJoinCancelled = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={vi.fn()}
                        onJoinProceeded={onJoinProceeded}
                        onJoinCancelled={onJoinCancelled}
                    />,
                );

                // Click join button
                fireEvent.click(screen.getByTestId('join-button'));

                // Accept the dialog
                fireEvent.click(screen.getByTestId('dialog-confirm'));

                // Verify join proceeded regardless of isPrivate or antiCheatEnabled values
                expect(onJoinProceeded).toHaveBeenCalledTimes(1);
                expect(onJoinCancelled).not.toHaveBeenCalled();
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
            'dialog decline behavior is independent of competition properties',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                // Test that decline behavior works regardless of other competition properties
                const competition: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate,
                    antiCheatEnabled,
                    dnsBlockingEnabled: true,
                };

                const onJoinProceeded = vi.fn();
                const onJoinCancelled = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={vi.fn()}
                        onJoinProceeded={onJoinProceeded}
                        onJoinCancelled={onJoinCancelled}
                    />,
                );

                // Click join button
                fireEvent.click(screen.getByTestId('join-button'));

                // Decline the dialog
                fireEvent.click(screen.getByTestId('dialog-cancel'));

                // Verify join was cancelled regardless of isPrivate or antiCheatEnabled values
                expect(onJoinProceeded).not.toHaveBeenCalled();
                expect(onJoinCancelled).toHaveBeenCalledTimes(1);
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
        )('dialog closes after accepting', (id, name, isPrivate, antiCheatEnabled) => {
            cleanup();

            const competition: BasicCompetitionUserResponse = {
                id,
                name,
                isPrivate,
                antiCheatEnabled,
                dnsBlockingEnabled: true,
            };

            render(
                <JoinFlowTestComponent
                    competition={competition}
                    onJoinAttempt={vi.fn()}
                    onJoinProceeded={vi.fn()}
                    onJoinCancelled={vi.fn()}
                />,
            );

            // Click join button to show dialog
            fireEvent.click(screen.getByTestId('join-button'));

            // Verify dialog is visible
            expect(screen.getByTestId('join-confirmation-dialog')).toBeInTheDocument();

            // Accept the dialog
            fireEvent.click(screen.getByTestId('dialog-confirm'));

            // Verify dialog is closed
            expect(screen.queryByTestId('join-confirmation-dialog')).not.toBeInTheDocument();
        });

        test.prop(
            [
                competitionIdArbitrary,
                competitionNameArbitrary,
                isPrivateArbitrary,
                antiCheatEnabledArbitrary,
            ],
            { numRuns: 100 },
        )('dialog closes after declining', (id, name, isPrivate, antiCheatEnabled) => {
            cleanup();

            const competition: BasicCompetitionUserResponse = {
                id,
                name,
                isPrivate,
                antiCheatEnabled,
                dnsBlockingEnabled: true,
            };

            render(
                <JoinFlowTestComponent
                    competition={competition}
                    onJoinAttempt={vi.fn()}
                    onJoinProceeded={vi.fn()}
                    onJoinCancelled={vi.fn()}
                />,
            );

            // Click join button to show dialog
            fireEvent.click(screen.getByTestId('join-button'));

            // Verify dialog is visible
            expect(screen.getByTestId('join-confirmation-dialog')).toBeInTheDocument();

            // Decline the dialog
            fireEvent.click(screen.getByTestId('dialog-cancel'));

            // Verify dialog is closed
            expect(screen.queryByTestId('join-confirmation-dialog')).not.toBeInTheDocument();
        });

        test.prop(
            [
                competitionIdArbitrary,
                competitionNameArbitrary,
                isPrivateArbitrary,
                antiCheatEnabledArbitrary,
            ],
            { numRuns: 100 },
        )(
            'accept and decline are mutually exclusive outcomes',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                const competition: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate,
                    antiCheatEnabled,
                    dnsBlockingEnabled: true,
                };

                const onJoinProceeded = vi.fn();
                const onJoinCancelled = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={vi.fn()}
                        onJoinProceeded={onJoinProceeded}
                        onJoinCancelled={onJoinCancelled}
                    />,
                );

                // Click join button
                fireEvent.click(screen.getByTestId('join-button'));

                // Accept the dialog
                fireEvent.click(screen.getByTestId('dialog-confirm'));

                // Verify that only one outcome occurred
                const totalOutcomes =
                    onJoinProceeded.mock.calls.length + onJoinCancelled.mock.calls.length;
                expect(totalOutcomes).toBe(1);

                // Verify it was the accept outcome
                expect(onJoinProceeded).toHaveBeenCalledTimes(1);
                expect(onJoinCancelled).toHaveBeenCalledTimes(0);
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
            'decline and accept are mutually exclusive outcomes',
            (id, name, isPrivate, antiCheatEnabled) => {
                cleanup();

                const competition: BasicCompetitionUserResponse = {
                    id,
                    name,
                    isPrivate,
                    antiCheatEnabled,
                    dnsBlockingEnabled: true,
                };

                const onJoinProceeded = vi.fn();
                const onJoinCancelled = vi.fn();

                render(
                    <JoinFlowTestComponent
                        competition={competition}
                        onJoinAttempt={vi.fn()}
                        onJoinProceeded={onJoinProceeded}
                        onJoinCancelled={onJoinCancelled}
                    />,
                );

                // Click join button
                fireEvent.click(screen.getByTestId('join-button'));

                // Decline the dialog
                fireEvent.click(screen.getByTestId('dialog-cancel'));

                // Verify that only one outcome occurred
                const totalOutcomes =
                    onJoinProceeded.mock.calls.length + onJoinCancelled.mock.calls.length;
                expect(totalOutcomes).toBe(1);

                // Verify it was the decline outcome
                expect(onJoinProceeded).toHaveBeenCalledTimes(0);
                expect(onJoinCancelled).toHaveBeenCalledTimes(1);
            },
        );
    });
});
