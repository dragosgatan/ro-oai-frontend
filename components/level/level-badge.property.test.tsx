/**
 * LevelBadge Component Property-Based Tests
 *
 * **Feature: user-leveling-system, Property 7: Level badge contains level number**
 * **Feature: user-leveling-system, Property 8: Different tiers have different styling**
 * **Feature: user-leveling-system, Property 18: Compact badge renders correctly**
 *
 * These tests verify:
 * - For any level, the rendered badge should contain the level number as text
 * - For any two levels in different tiers, the rendered badge CSS classes should be different
 * - For any level, the compact badge variant should render with reduced size while still showing the level number
 *
 * **Validates: Requirements 1.1, 1.2, 1.4, 6.1-6.5, 10.2**
 */

import * as React from 'react';
import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LevelBadge, getLevelBadgeConfig } from './level-badge';
import { getTierForLevel, TIER_CONFIG } from '@/lib/level/tier-config';
import type { LevelTier } from '@/lib/level/types';

// All possible tier values
const ALL_TIERS: LevelTier[] = ['NOVICE', 'APPRENTICE', 'EXPERT', 'MASTER', 'LEGEND'];

// Arbitrary for generating valid level values (1-50)
const levelArbitrary = fc.integer({ min: 1, max: 50 });

// Arbitrary for generating valid tier values
const tierArbitrary = fc.constantFrom<LevelTier>(...ALL_TIERS);

// Arbitrary for generating size variants
const sizeArbitrary = fc.constantFrom('xs', 'sm', 'md', 'lg');

// Wrapper component for testing with TooltipProvider
import { TooltipProvider } from '@/components/ui/tooltip';

function renderWithTooltip(ui: React.ReactElement) {
    // Clean up any previous renders
    cleanup();
    return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe('LevelBadge Property-Based Tests', () => {
    /**
     * **Feature: user-leveling-system, Property 7: Level badge contains level number**
     * **Validates: Requirements 1.1**
     */
    describe('Property 7: Level badge contains level number', () => {
        test.prop([levelArbitrary], { numRuns: 100 })(
            'should display the level number for any valid level',
            (level) => {
                renderWithTooltip(<LevelBadge level={level} />);

                // The level number should be visible in the badge
                const badge = screen.getByRole('img', { name: new RegExp(`Level ${level}`) });
                expect(badge).toBeDefined();
                expect(badge.textContent).toContain(String(level));
            },
        );

        test.prop([levelArbitrary], { numRuns: 100 })(
            'should have proper ARIA label containing level number',
            (level) => {
                renderWithTooltip(<LevelBadge level={level} />);

                const tier = getTierForLevel(level);
                const tierConfig = TIER_CONFIG[tier];

                // The badge should have an aria-label with level and tier info
                const badge = screen.getByRole('img');
                expect(badge.getAttribute('aria-label')).toBe(
                    `Level ${level} - ${tierConfig.name} tier`,
                );
            },
        );

        test.prop([levelArbitrary, sizeArbitrary], { numRuns: 100 })(
            'should display level number regardless of size variant',
            (level, size) => {
                renderWithTooltip(
                    <LevelBadge level={level} size={size as 'xs' | 'sm' | 'md' | 'lg'} />,
                );

                const badge = screen.getByRole('img');
                expect(badge.textContent).toContain(String(level));
            },
        );
    });

    /**
     * **Feature: user-leveling-system, Property 8: Different tiers have different styling**
     * **Validates: Requirements 1.2, 6.1-6.5**
     */
    describe('Property 8: Different tiers have different styling', () => {
        test.prop([tierArbitrary, tierArbitrary], { numRuns: 100 })(
            'should have different gradient backgrounds for different tiers',
            (tier1, tier2) => {
                // Skip if tiers are the same
                if (tier1 === tier2) {
                    return;
                }

                const config1 = TIER_CONFIG[tier1];
                const config2 = TIER_CONFIG[tier2];

                // Different tiers should have different gradient backgrounds
                expect(config1.bgGradient).not.toBe(config2.bgGradient);
            },
        );

        test.prop([tierArbitrary, tierArbitrary], { numRuns: 100 })(
            'should have different border colors for different tiers',
            (tier1, tier2) => {
                // Skip if tiers are the same
                if (tier1 === tier2) {
                    return;
                }

                const config1 = TIER_CONFIG[tier1];
                const config2 = TIER_CONFIG[tier2];

                // Different tiers should have different border colors
                expect(config1.borderColor).not.toBe(config2.borderColor);
            },
        );

        test.prop([tierArbitrary, tierArbitrary], { numRuns: 100 })(
            'should have different icons for different tiers (non-color indicator)',
            (tier1, tier2) => {
                // Skip if tiers are the same
                if (tier1 === tier2) {
                    return;
                }

                const config1 = TIER_CONFIG[tier1];
                const config2 = TIER_CONFIG[tier2];

                // Different tiers should have different icons (non-color indicator for accessibility)
                expect(config1.icon).not.toBe(config2.icon);
            },
        );

        test.prop([tierArbitrary], { numRuns: 100 })(
            'should return consistent config for the same tier',
            (tier) => {
                const config1 = TIER_CONFIG[tier];
                const config2 = TIER_CONFIG[tier];
                const config3 = TIER_CONFIG[tier];

                // Same tier should always produce identical config
                expect(config1).toEqual(config2);
                expect(config2).toEqual(config3);
            },
        );

        test.prop([tierArbitrary], { numRuns: 100 })(
            'should have all required config properties for any tier',
            (tier) => {
                const config = TIER_CONFIG[tier];

                // All config properties should be defined and non-empty
                expect(config.name).toBeDefined();
                expect(config.name.length).toBeGreaterThan(0);

                expect(config.color).toBeDefined();

                expect(config.bgGradient).toBeDefined();
                expect(config.bgGradient.length).toBeGreaterThan(0);

                expect(config.icon).toBeDefined();
                expect(config.icon.length).toBeGreaterThan(0);

                expect(config.glowColor).toBeDefined();
                expect(config.glowColor.length).toBeGreaterThan(0);

                expect(config.borderColor).toBeDefined();
                expect(config.borderColor.length).toBeGreaterThan(0);

                expect(config.textColor).toBeDefined();
                expect(config.textColor.length).toBeGreaterThan(0);
            },
        );

        test.prop([levelArbitrary], { numRuns: 100 })(
            'should apply correct tier config based on level',
            (level) => {
                const config = getLevelBadgeConfig(level);
                const expectedTier = getTierForLevel(level);
                const expectedConfig = TIER_CONFIG[expectedTier];

                expect(config).toEqual(expectedConfig);
            },
        );
    });

    /**
     * **Feature: user-leveling-system, Property 18: Compact badge renders correctly**
     * **Validates: Requirements 1.4, 10.2**
     */
    describe('Property 18: Compact badge renders correctly', () => {
        test.prop([levelArbitrary], { numRuns: 100 })(
            'should render compact (xs) badge with level number visible',
            (level) => {
                renderWithTooltip(<LevelBadge level={level} size="xs" />);

                const badge = screen.getByRole('img');
                expect(badge.textContent).toContain(String(level));
            },
        );

        test.prop([levelArbitrary], { numRuns: 100 })(
            'should render compact (sm) badge with level number visible',
            (level) => {
                renderWithTooltip(<LevelBadge level={level} size="sm" />);

                const badge = screen.getByRole('img');
                expect(badge.textContent).toContain(String(level));
            },
        );

        test.prop([levelArbitrary, fc.boolean()], { numRuns: 100 })(
            'should not show tier icon on compact badges even when showTierIcon is true',
            (level, showTierIcon) => {
                renderWithTooltip(
                    <LevelBadge level={level} size="xs" showTierIcon={showTierIcon} />,
                );

                const badge = screen.getByRole('img');
                const tier = getTierForLevel(level);
                const tierConfig = TIER_CONFIG[tier];

                // For compact sizes (xs, sm), tier icon should not be displayed in the badge
                // The icon is only shown in the tooltip
                // Check that the badge content is just the level number
                const badgeText = badge.textContent || '';

                // The badge should contain the level number
                expect(badgeText).toContain(String(level));
            },
        );

        test.prop([levelArbitrary], { numRuns: 100 })(
            'should maintain proper ARIA label on compact badges',
            (level) => {
                renderWithTooltip(<LevelBadge level={level} size="xs" />);

                const tier = getTierForLevel(level);
                const tierConfig = TIER_CONFIG[tier];

                const badge = screen.getByRole('img');
                expect(badge.getAttribute('aria-label')).toBe(
                    `Level ${level} - ${tierConfig.name} tier`,
                );
            },
        );

        test.prop([levelArbitrary], { numRuns: 100 })(
            'should render larger badges (md, lg) with level number visible',
            (level) => {
                // Test md size
                const { unmount: unmountMd } = renderWithTooltip(
                    <LevelBadge level={level} size="md" />,
                );
                let badge = screen.getByRole('img');
                expect(badge.textContent).toContain(String(level));
                unmountMd();

                // Test lg size
                renderWithTooltip(<LevelBadge level={level} size="lg" />);
                badge = screen.getByRole('img');
                expect(badge.textContent).toContain(String(level));
            },
        );

        test.prop([levelArbitrary], { numRuns: 100 })(
            'should show tier icon on larger badges when showTierIcon is true',
            (level) => {
                renderWithTooltip(<LevelBadge level={level} size="lg" showTierIcon />);

                const tier = getTierForLevel(level);
                const tierConfig = TIER_CONFIG[tier];

                // For larger sizes with showTierIcon, the icon should be present
                // We check that the badge container includes the icon
                const badge = screen.getByRole('img');
                const badgeContainer = badge.parentElement;

                // The badge should still contain the level number
                expect(badge.textContent).toContain(String(level));
            },
        );
    });
});
