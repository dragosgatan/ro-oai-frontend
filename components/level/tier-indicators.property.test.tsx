/**
 * Tier Indicators Property-Based Tests
 *
 * **Feature: user-leveling-system, Property 17: Non-color tier indicators exist**
 *
 * This test verifies that for any tier, there should be an icon or pattern indicator
 * in addition to color, ensuring colorblind accessibility.
 *
 * **Validates: Requirements 8.3**
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { TIER_CONFIG, getTierForLevel, TIER_ORDER } from '@/lib/level/tier-config';
import type { LevelTier } from '@/lib/level/types';

// All possible tier values
const ALL_TIERS: LevelTier[] = ['NOVICE', 'APPRENTICE', 'EXPERT', 'MASTER', 'LEGEND'];

// Arbitrary for generating valid tier values
const tierArbitrary = fc.constantFrom<LevelTier>(...ALL_TIERS);

// Arbitrary for generating valid level values (1-50)
const levelArbitrary = fc.integer({ min: 1, max: 50 });

describe('Tier Indicators Property-Based Tests', () => {
    /**
     * **Feature: user-leveling-system, Property 17: Non-color tier indicators exist**
     * **Validates: Requirements 8.3**
     *
     * For any tier, there should be an icon or pattern indicator in addition to color.
     * This ensures colorblind users can distinguish between tiers.
     */
    describe('Property 17: Non-color tier indicators exist', () => {
        test.prop([tierArbitrary], { numRuns: 100 })(
            'should have a non-empty icon for any tier',
            (tier) => {
                const config = TIER_CONFIG[tier];

                // Each tier must have an icon (non-color indicator)
                expect(config.icon).toBeDefined();
                expect(typeof config.icon).toBe('string');
                expect(config.icon.length).toBeGreaterThan(0);
            },
        );

        test.prop([tierArbitrary], { numRuns: 100 })(
            'should have a display name for any tier (text indicator)',
            (tier) => {
                const config = TIER_CONFIG[tier];

                // Each tier must have a name (text indicator)
                expect(config.name).toBeDefined();
                expect(typeof config.name).toBe('string');
                expect(config.name.length).toBeGreaterThan(0);
            },
        );

        test.prop([tierArbitrary], { numRuns: 100 })(
            'should have a CSS class for any tier (pattern/style indicator)',
            (tier) => {
                const config = TIER_CONFIG[tier];

                // Each tier must have a CSS class (can be used for patterns)
                expect(config.cssClass).toBeDefined();
                expect(typeof config.cssClass).toBe('string');
                expect(config.cssClass.length).toBeGreaterThan(0);
            },
        );

        test.prop([tierArbitrary, tierArbitrary], { numRuns: 100 })(
            'should have unique icons for different tiers',
            (tier1, tier2) => {
                // Skip if tiers are the same
                if (tier1 === tier2) {
                    return;
                }

                const config1 = TIER_CONFIG[tier1];
                const config2 = TIER_CONFIG[tier2];

                // Different tiers must have different icons
                expect(config1.icon).not.toBe(config2.icon);
            },
        );

        test.prop([tierArbitrary, tierArbitrary], { numRuns: 100 })(
            'should have unique names for different tiers',
            (tier1, tier2) => {
                // Skip if tiers are the same
                if (tier1 === tier2) {
                    return;
                }

                const config1 = TIER_CONFIG[tier1];
                const config2 = TIER_CONFIG[tier2];

                // Different tiers must have different names
                expect(config1.name).not.toBe(config2.name);
            },
        );

        test.prop([tierArbitrary, tierArbitrary], { numRuns: 100 })(
            'should have unique CSS classes for different tiers',
            (tier1, tier2) => {
                // Skip if tiers are the same
                if (tier1 === tier2) {
                    return;
                }

                const config1 = TIER_CONFIG[tier1];
                const config2 = TIER_CONFIG[tier2];

                // Different tiers must have different CSS classes
                expect(config1.cssClass).not.toBe(config2.cssClass);
            },
        );

        test.prop([levelArbitrary], { numRuns: 100 })(
            'should provide non-color indicators for any level',
            (level) => {
                const tier = getTierForLevel(level);
                const config = TIER_CONFIG[tier];

                // For any level, the tier config should have non-color indicators
                expect(config.icon).toBeDefined();
                expect(config.icon.length).toBeGreaterThan(0);

                expect(config.name).toBeDefined();
                expect(config.name.length).toBeGreaterThan(0);

                expect(config.cssClass).toBeDefined();
                expect(config.cssClass.length).toBeGreaterThan(0);
            },
        );

        // Verify all tiers have unique non-color indicators
        test('all tiers should have unique icons', () => {
            const icons = ALL_TIERS.map((tier) => TIER_CONFIG[tier].icon);
            const uniqueIcons = new Set(icons);

            // All icons should be unique
            expect(uniqueIcons.size).toBe(ALL_TIERS.length);
        });

        test('all tiers should have unique names', () => {
            const names = ALL_TIERS.map((tier) => TIER_CONFIG[tier].name);
            const uniqueNames = new Set(names);

            // All names should be unique
            expect(uniqueNames.size).toBe(ALL_TIERS.length);
        });

        test('all tiers should have unique CSS classes', () => {
            const cssClasses = ALL_TIERS.map((tier) => TIER_CONFIG[tier].cssClass);
            const uniqueClasses = new Set(cssClasses);

            // All CSS classes should be unique
            expect(uniqueClasses.size).toBe(ALL_TIERS.length);
        });

        test('TIER_ORDER should contain all tiers', () => {
            expect(TIER_ORDER).toHaveLength(ALL_TIERS.length);
            ALL_TIERS.forEach((tier) => {
                expect(TIER_ORDER).toContain(tier);
            });
        });
    });
});
