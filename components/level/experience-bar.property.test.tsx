/**
 * ExperienceBar Component Property-Based Tests
 *
 * **Feature: user-leveling-system, Property 9: Experience bar shows required fields**
 * **Feature: user-leveling-system, Property 16: ARIA labels are present on experience bar**
 *
 * These tests verify:
 * - For any rendered experience bar, the output should contain current XP, XP needed, and percentage
 * - For any rendered experience bar, the element should have aria-label or aria-valuenow/aria-valuemax attributes
 *
 * **Validates: Requirements 2.2, 8.2**
 */

import * as React from 'react';
import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ExperienceBar } from './experience-bar';
import { getTierForLevel } from '@/lib/level/tier-config';
import type { LevelProgress } from '@/lib/level/types';

// Wrapper component for testing with TooltipProvider
import { TooltipProvider } from '@/components/ui/tooltip';

function renderWithTooltip(ui: React.ReactElement) {
    // Clean up any previous renders
    cleanup();
    return render(
        <NextIntlClientProvider locale="en" messages={{}}>
            <TooltipProvider>{ui}</TooltipProvider>
        </NextIntlClientProvider>,
    );
}

// Arbitrary for generating valid level values (1-50)
const levelArbitrary = fc.integer({ min: 1, max: 50 });

// Arbitrary for generating valid XP values
const xpArbitrary = fc.integer({ min: 0, max: 200000 });

// Arbitrary for generating valid percentage values (0-100)
const percentageArbitrary = fc.double({ min: 0, max: 100, noNaN: true });

// Arbitrary for generating valid progress objects (non-max level)
const progressArbitrary = fc.record({
    currentXpInLevel: fc.integer({ min: 0, max: 50000 }),
    xpNeededForNextLevel: fc.integer({ min: 100, max: 100000 }),
    percentage: percentageArbitrary,
    isMaxLevel: fc.constant(false),
});

// Arbitrary for generating max level progress
const maxLevelProgressArbitrary = fc.record({
    currentXpInLevel: fc.integer({ min: 0, max: 100000 }),
    xpNeededForNextLevel: fc.constant(0),
    percentage: fc.constant(100),
    isMaxLevel: fc.constant(true),
});

// Combined progress arbitrary
const anyProgressArbitrary = fc.oneof(progressArbitrary, maxLevelProgressArbitrary);

describe('ExperienceBar Property-Based Tests', () => {
    /**
     * **Feature: user-leveling-system, Property 9: Experience bar shows required fields**
     * **Validates: Requirements 2.2**
     */
    describe('Property 9: Experience bar shows required fields', () => {
        test.prop([levelArbitrary, progressArbitrary, xpArbitrary], { numRuns: 100 })(
            'should display current XP, XP needed, and percentage for non-max level',
            (level, progress, totalXp) => {
                // Ensure level is not max level for this test
                const testLevel = Math.min(level, 49);

                renderWithTooltip(
                    <ExperienceBar
                        level={testLevel}
                        progress={progress}
                        totalXp={totalXp}
                        showDetails={true}
                    />,
                );

                // Get the details section text
                const container = screen.getByRole('progressbar').parentElement;
                const textContent = container?.textContent || '';

                // Should contain current XP in level
                expect(textContent).toContain(progress.currentXpInLevel.toLocaleString());

                // Should contain XP needed for next level
                expect(textContent).toContain(progress.xpNeededForNextLevel.toLocaleString());

                // Should contain percentage (as integer)
                const displayPercentage = Math.min(100, Math.max(0, progress.percentage));
                expect(textContent).toContain(`${displayPercentage.toFixed(0)}%`);
            },
        );

        test.prop([xpArbitrary], { numRuns: 100 })(
            'should display "Max Level" indicator for level 50',
            (totalXp) => {
                const maxProgress: LevelProgress = {
                    currentXpInLevel: totalXp,
                    xpNeededForNextLevel: 0,
                    percentage: 100,
                    isMaxLevel: true,
                };

                renderWithTooltip(
                    <ExperienceBar
                        level={50}
                        progress={maxProgress}
                        totalXp={totalXp}
                        showDetails={true}
                    />,
                );

                // Get the progress bar
                const progressBar = screen.getByRole('progressbar');

                // Should contain "MAX LEVEL" text
                expect(progressBar.textContent).toContain('MAX LEVEL');

                // Details section should show "Max Level"
                const container = progressBar.parentElement;
                const textContent = container?.textContent || '';
                expect(textContent).toContain('Max Level');
            },
        );

        test.prop([levelArbitrary, progressArbitrary, xpArbitrary], { numRuns: 100 })(
            'should display tier name in details section',
            (level, progress, totalXp) => {
                const tier = getTierForLevel(level);

                renderWithTooltip(
                    <ExperienceBar
                        level={level}
                        progress={progress}
                        totalXp={totalXp}
                        showDetails={true}
                    />,
                );

                const container = screen.getByRole('progressbar').parentElement;
                const textContent = container?.textContent || '';

                // Should contain tier name
                const tierNames = ['Novice', 'Apprentice', 'Expert', 'Master', 'Legend'];
                const expectedTierName =
                    tierNames[['NOVICE', 'APPRENTICE', 'EXPERT', 'MASTER', 'LEGEND'].indexOf(tier)];
                expect(textContent).toContain(expectedTierName);
            },
        );

        test.prop([levelArbitrary, progressArbitrary, xpArbitrary], { numRuns: 100 })(
            'should hide details when showDetails is false',
            (level, progress, totalXp) => {
                renderWithTooltip(
                    <ExperienceBar
                        level={level}
                        progress={progress}
                        totalXp={totalXp}
                        showDetails={false}
                    />,
                );

                const progressBar = screen.getByRole('progressbar');
                const container = progressBar.parentElement;

                // The container should only have the progress bar, not the details section
                // Details section has tier name and XP info
                const children = container?.children || [];

                // With showDetails=false, there should be fewer elements
                // The progress bar is wrapped in a Tooltip, so we check the structure
                expect(children.length).toBeLessThanOrEqual(2);
            },
        );
    });

    /**
     * **Feature: user-leveling-system, Property 16: ARIA labels are present on experience bar**
     * **Validates: Requirements 8.2**
     */
    describe('Property 16: ARIA labels are present on experience bar', () => {
        test.prop([levelArbitrary, progressArbitrary, xpArbitrary], { numRuns: 100 })(
            'should have aria-valuenow attribute for non-max level',
            (level, progress, totalXp) => {
                const testLevel = Math.min(level, 49);
                const testProgress = { ...progress, isMaxLevel: false };

                renderWithTooltip(
                    <ExperienceBar level={testLevel} progress={testProgress} totalXp={totalXp} />,
                );

                const progressBar = screen.getByRole('progressbar');

                // Should have aria-valuenow
                const ariaValueNow = progressBar.getAttribute('aria-valuenow');
                expect(ariaValueNow).not.toBeNull();
                expect(Number(ariaValueNow)).toBe(testProgress.currentXpInLevel);
            },
        );

        test.prop([levelArbitrary, progressArbitrary, xpArbitrary], { numRuns: 100 })(
            'should have aria-valuemax attribute for non-max level',
            (level, progress, totalXp) => {
                const testLevel = Math.min(level, 49);
                const testProgress = { ...progress, isMaxLevel: false };

                renderWithTooltip(
                    <ExperienceBar level={testLevel} progress={testProgress} totalXp={totalXp} />,
                );

                const progressBar = screen.getByRole('progressbar');

                // Should have aria-valuemax
                const ariaValueMax = progressBar.getAttribute('aria-valuemax');
                expect(ariaValueMax).not.toBeNull();
                expect(Number(ariaValueMax)).toBe(testProgress.xpNeededForNextLevel);
            },
        );

        test.prop([levelArbitrary, progressArbitrary, xpArbitrary], { numRuns: 100 })(
            'should have aria-valuemin attribute set to 0',
            (level, progress, totalXp) => {
                renderWithTooltip(
                    <ExperienceBar level={level} progress={progress} totalXp={totalXp} />,
                );

                const progressBar = screen.getByRole('progressbar');

                // Should have aria-valuemin set to 0
                const ariaValueMin = progressBar.getAttribute('aria-valuemin');
                expect(ariaValueMin).not.toBeNull();
                expect(Number(ariaValueMin)).toBe(0);
            },
        );

        test.prop([levelArbitrary, progressArbitrary, xpArbitrary], { numRuns: 100 })(
            'should have descriptive aria-label for non-max level',
            (level, progress, totalXp) => {
                const testLevel = Math.min(level, 49);
                const testProgress = { ...progress, isMaxLevel: false };

                renderWithTooltip(
                    <ExperienceBar level={testLevel} progress={testProgress} totalXp={totalXp} />,
                );

                const progressBar = screen.getByRole('progressbar');
                const ariaLabel = progressBar.getAttribute('aria-label');

                // Should have aria-label
                expect(ariaLabel).not.toBeNull();

                // Should contain level number
                expect(ariaLabel).toContain(`Level ${testLevel}`);

                // Should contain XP information
                expect(ariaLabel).toContain('XP');

                // Should contain percentage
                expect(ariaLabel).toContain('%');
            },
        );

        test.prop([xpArbitrary], { numRuns: 100 })(
            'should have descriptive aria-label for max level',
            (totalXp) => {
                const maxProgress: LevelProgress = {
                    currentXpInLevel: totalXp,
                    xpNeededForNextLevel: 0,
                    percentage: 100,
                    isMaxLevel: true,
                };

                renderWithTooltip(
                    <ExperienceBar level={50} progress={maxProgress} totalXp={totalXp} />,
                );

                const progressBar = screen.getByRole('progressbar');
                const ariaLabel = progressBar.getAttribute('aria-label');

                // Should have aria-label
                expect(ariaLabel).not.toBeNull();

                // Should indicate max level
                expect(ariaLabel?.toLowerCase()).toContain('maximum');

                // Should contain level 50
                expect(ariaLabel).toContain('Level 50');
            },
        );

        test.prop([levelArbitrary, anyProgressArbitrary, xpArbitrary], { numRuns: 100 })(
            'should have role="progressbar" attribute',
            (level, progress, totalXp) => {
                renderWithTooltip(
                    <ExperienceBar level={level} progress={progress} totalXp={totalXp} />,
                );

                // Should be able to find by role
                const progressBar = screen.getByRole('progressbar');
                expect(progressBar).toBeDefined();
            },
        );
    });

    /**
     * Additional property tests for edge cases and consistency
     */
    describe('Additional Properties', () => {
        test.prop([levelArbitrary, xpArbitrary], { numRuns: 100 })(
            'should clamp percentage between 0 and 100',
            (level, totalXp) => {
                // Test with percentage > 100
                const overProgress: LevelProgress = {
                    currentXpInLevel: 1500,
                    xpNeededForNextLevel: 1000,
                    percentage: 150, // Over 100%
                    isMaxLevel: false,
                };

                renderWithTooltip(
                    <ExperienceBar
                        level={level}
                        progress={overProgress}
                        totalXp={totalXp}
                        showDetails={true}
                    />,
                );

                const container = screen.getByRole('progressbar').parentElement;
                const textContent = container?.textContent || '';

                // Should show 100% (clamped)
                expect(textContent).toContain('100%');

                cleanup();

                // Test with percentage < 0
                const underProgress: LevelProgress = {
                    currentXpInLevel: 0,
                    xpNeededForNextLevel: 1000,
                    percentage: -10, // Under 0%
                    isMaxLevel: false,
                };

                renderWithTooltip(
                    <ExperienceBar
                        level={level}
                        progress={underProgress}
                        totalXp={totalXp}
                        showDetails={true}
                    />,
                );

                const container2 = screen.getByRole('progressbar').parentElement;
                const textContent2 = container2?.textContent || '';

                // Should show 0% (clamped)
                expect(textContent2).toContain('0%');
            },
        );

        test.prop([levelArbitrary, progressArbitrary, xpArbitrary], { numRuns: 100 })(
            'should format numbers with locale separators',
            (level, progress, totalXp) => {
                // Use large numbers to ensure formatting is applied
                const largeProgress: LevelProgress = {
                    currentXpInLevel: 12345,
                    xpNeededForNextLevel: 67890,
                    percentage: 18.2,
                    isMaxLevel: false,
                };

                renderWithTooltip(
                    <ExperienceBar
                        level={level}
                        progress={largeProgress}
                        totalXp={totalXp}
                        showDetails={true}
                    />,
                );

                const container = screen.getByRole('progressbar').parentElement;
                const textContent = container?.textContent || '';

                // Should contain formatted numbers (with commas for thousands)
                expect(textContent).toContain('12,345');
                expect(textContent).toContain('67,890');
            },
        );
    });
});
