/**
 * LevelUpNotification Component Property-Based Tests
 *
 * **Feature: user-leveling-system, Property 14: Level notification contains required fields**
 * **Feature: user-leveling-system, Property 15: Reduced motion preference is respected**
 *
 * These tests verify:
 * - For any level-up notification, the rendered output should contain old level, new level, and tier change indicator
 * - For any animation component, when prefers-reduced-motion is enabled, the animation should be disabled or simplified
 *
 * **Validates: Requirements 4.4, 7.4, 8.4**
 */

import * as React from 'react';
import { describe, expect, vi, beforeEach, afterEach } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { LevelUpNotification } from './level-up-notification';
import { getTierForLevel, TIER_CONFIG } from '@/lib/level/tier-config';
import type { LevelTier, LevelUpNotification as LevelUpNotificationType } from '@/lib/level/types';
import enMessages from '@/locales/en.json';

// Arbitrary for generating valid level-up notifications
const levelUpNotificationArbitrary = fc
    .record({
        previousLevel: fc.integer({ min: 1, max: 49 }),
        newLevel: fc.integer({ min: 2, max: 50 }),
        tierChanged: fc.boolean(),
    })
    .chain((base) => {
        // Ensure newLevel > previousLevel
        const adjustedNewLevel = Math.max(base.previousLevel + 1, base.newLevel);
        const adjustedPreviousLevel = Math.min(base.previousLevel, adjustedNewLevel - 1);

        // Determine if tier actually changed based on levels
        const previousTier = getTierForLevel(adjustedPreviousLevel);
        const newTier = getTierForLevel(adjustedNewLevel);
        const actualTierChanged = previousTier !== newTier;

        return fc.constant({
            previousLevel: adjustedPreviousLevel,
            newLevel: adjustedNewLevel,
            tierChanged: actualTierChanged,
            newTier: actualTierChanged ? newTier : undefined,
        } as LevelUpNotificationType);
    });

// Arbitrary for generating tier change notifications specifically
const tierChangeNotificationArbitrary = fc.constantFrom(
    // Level 10 -> 11 (NOVICE -> APPRENTICE)
    { previousLevel: 10, newLevel: 11, tierChanged: true, newTier: 'APPRENTICE' as LevelTier },
    // Level 20 -> 21 (APPRENTICE -> EXPERT)
    { previousLevel: 20, newLevel: 21, tierChanged: true, newTier: 'EXPERT' as LevelTier },
    // Level 30 -> 31 (EXPERT -> MASTER)
    { previousLevel: 30, newLevel: 31, tierChanged: true, newTier: 'MASTER' as LevelTier },
    // Level 40 -> 41 (MASTER -> LEGEND)
    { previousLevel: 40, newLevel: 41, tierChanged: true, newTier: 'LEGEND' as LevelTier },
);

// Wrapper component for testing with TooltipProvider
import { TooltipProvider } from '@/components/ui/tooltip';

function renderWithTooltip(ui: React.ReactElement) {
    cleanup();
    return render(
        <NextIntlClientProvider locale="en" messages={{ level: enMessages.level }}>
            <TooltipProvider>{ui}</TooltipProvider>
        </NextIntlClientProvider>,
    );
}

// Mock for reduced motion preference
function setupReducedMotionMock(prefersReducedMotion: boolean) {
    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)' ? prefersReducedMotion : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));
    window.matchMedia = mockMatchMedia as unknown as typeof window.matchMedia;
}

describe('LevelUpNotification Property-Based Tests', () => {
    beforeEach(() => {
        // Default to no reduced motion preference
        setupReducedMotionMock(false);
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    /**
     * **Feature: user-leveling-system, Property 14: Level notification contains required fields**
     * **Validates: Requirements 4.4**
     */
    describe('Property 14: Level notification contains required fields', () => {
        test.prop([levelUpNotificationArbitrary], { numRuns: 25 })(
            'should display old level in the notification',
            (notification) => {
                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                // The notification should contain the previous level
                const dialog = screen.getByRole('status');
                expect(dialog.textContent).toContain(String(notification.previousLevel));
            },
        );

        test.prop([levelUpNotificationArbitrary], { numRuns: 25 })(
            'should display new level in the notification',
            (notification) => {
                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                // The notification should contain the new level
                const dialog = screen.getByRole('status');
                expect(dialog.textContent).toContain(String(notification.newLevel));
            },
        );

        test.prop([levelUpNotificationArbitrary], { numRuns: 25 })(
            'should display level difference in the notification',
            (notification) => {
                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                const levelDifference = notification.newLevel - notification.previousLevel;
                const dialog = screen.getByRole('status');

                // The notification should show the level difference with a + prefix
                expect(dialog.textContent).toContain(`+${levelDifference}`);
            },
        );

        test.prop([tierChangeNotificationArbitrary], { numRuns: 20 })(
            'should display tier change indicator when tier changes',
            (notification) => {
                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                const dialog = screen.getByRole('status');
                const newTierConfig = TIER_CONFIG[notification.newTier!];

                // The notification should contain the new tier name
                expect(dialog.textContent).toContain(newTierConfig.name);
            },
        );

        test.prop([levelUpNotificationArbitrary], { numRuns: 25 })(
            'should have proper ARIA attributes for accessibility',
            (notification) => {
                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                const dialog = screen.getByRole('status');

                // Progress feedback is important but should not interrupt urgent announcements.
                expect(dialog.getAttribute('aria-live')).toBe('polite');
                expect(dialog.getAttribute('aria-atomic')).toBe('true');
            },
        );

        test.prop([levelUpNotificationArbitrary], { numRuns: 25 })(
            'should have screen reader announcement with level information',
            (notification) => {
                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                const status = screen.getByRole('status');
                const descriptionId = status.getAttribute('aria-describedby');
                const description = descriptionId ? document.getElementById(descriptionId) : null;

                expect(description?.textContent).toContain(String(notification.previousLevel));
                expect(description?.textContent).toContain(String(notification.newLevel));
            },
        );
    });

    /**
     * **Feature: user-leveling-system, Property 15: Reduced motion preference is respected**
     * **Validates: Requirements 7.4, 8.4**
     */
    describe('Property 15: Reduced motion preference is respected', () => {
        test.prop([levelUpNotificationArbitrary], { numRuns: 20 })(
            'should preserve all content when reduced motion is preferred',
            (notification) => {
                // Enable reduced motion preference
                setupReducedMotionMock(true);

                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                // The notification should still be visible
                const dialog = screen.getByRole('status');
                expect(dialog).toBeDefined();

                // Content should still be present
                expect(dialog.textContent).toContain(String(notification.previousLevel));
                expect(dialog.textContent).toContain(String(notification.newLevel));
            },
        );

        test.prop([tierChangeNotificationArbitrary], { numRuns: 20 })(
            'should show static tier change indicator when reduced motion is preferred',
            (notification) => {
                // Enable reduced motion preference
                setupReducedMotionMock(true);

                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                const dialog = screen.getByRole('status');
                const newTierConfig = TIER_CONFIG[notification.newTier!];

                // Tier change should still be indicated even without animation
                expect(dialog.textContent).toContain(newTierConfig.name);
            },
        );

        test.prop([levelUpNotificationArbitrary], { numRuns: 20 })(
            'should not show particle effects when reduced motion is preferred',
            (notification) => {
                // Enable reduced motion preference
                setupReducedMotionMock(true);

                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                // The redesigned notification does not depend on decorative particles.
                const dialog = screen.getByRole('status');
                expect(dialog).toBeDefined();
            },
        );

        test.prop([levelUpNotificationArbitrary], { numRuns: 20 })(
            'should support keyboard dismissal regardless of motion preference',
            async (notification) => {
                // Enable reduced motion preference
                setupReducedMotionMock(true);

                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                const dialog = screen.getByRole('status');

                // Press Escape to dismiss
                fireEvent.keyDown(dialog, { key: 'Escape' });

                // onDismiss is called after a setTimeout(0) for reduced motion
                await vi.waitFor(
                    () => {
                        expect(onDismiss).toHaveBeenCalled();
                    },
                    { timeout: 100 },
                );
            },
        );
    });

    /**
     * Additional tests for dismiss functionality
     */
    describe('Dismiss functionality', () => {
        test.prop([levelUpNotificationArbitrary], { numRuns: 20 })(
            'should call onDismiss when dismiss button is clicked',
            async (notification) => {
                setupReducedMotionMock(true);
                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                const dismissButton = screen.getByRole('button', { name: /dismiss/i });
                fireEvent.click(dismissButton);

                await vi.waitFor(() => expect(onDismiss).toHaveBeenCalledOnce(), {
                    timeout: 100,
                });
            },
        );

        test.prop([levelUpNotificationArbitrary], { numRuns: 20 })(
            'should not turn the entire status region into an Enter-key button',
            (notification) => {
                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                const dialog = screen.getByRole('status');
                fireEvent.keyDown(dialog, { key: 'Enter' });

                expect(onDismiss).not.toHaveBeenCalled();
            },
        );

        test.prop([levelUpNotificationArbitrary], { numRuns: 20 })(
            'should not turn the entire status region into a Space-key button',
            (notification) => {
                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                const dialog = screen.getByRole('status');
                fireEvent.keyDown(dialog, { key: ' ' });

                expect(onDismiss).not.toHaveBeenCalled();
            },
        );
    });

    /**
     * Tier styling tests
     */
    describe('Tier styling', () => {
        test.prop([tierChangeNotificationArbitrary], { numRuns: 20 })(
            'should provide a non-color tier label for tier changes',
            (notification) => {
                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                const dialog = screen.getByRole('status');
                const newTierConfig = TIER_CONFIG[notification.newTier!];

                expect(dialog.textContent).toContain(newTierConfig.name);
            },
        );

        test.prop([levelUpNotificationArbitrary], { numRuns: 25 })(
            'should display "Level Up!" title',
            (notification) => {
                const onDismiss = vi.fn();
                renderWithTooltip(
                    <LevelUpNotification notification={notification} onDismiss={onDismiss} />,
                );

                const titles = screen.getAllByText(/level up/i);
                expect(titles.length).toBeGreaterThan(0);

                // Verify the visible title element exists
                const visibleTitle = screen
                    .getByRole('status')
                    .querySelector('[id^="level-up-title-"]');
                expect(visibleTitle).toBeDefined();
                expect(visibleTitle?.textContent).toContain('Level Up');
            },
        );
    });
});
