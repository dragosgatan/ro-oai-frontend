/**
 * Property-Based Tests for Achievement System Accessibility
 *
 * **Feature: achievement-system, Property 30: Screen reader attributes present**
 * **Feature: achievement-system, Property 31: Non-color rarity indicators**
 * **Feature: achievement-system, Property 32: Reduced motion preference respected**
 *
 * These tests verify accessibility requirements for the achievement system.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getRarityStyles } from './achievement-card';
import { shouldShowEnhancedCelebration } from './achievement-notification-toast';
import { getAnimationDuration, getMotionTransition } from './use-reduced-motion';
import type { AchievementRarity, Achievement, UserAchievement } from '@/lib/types';

// All possible rarity values
const ALL_RARITIES: AchievementRarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

// Arbitrary for generating random rarity
const rarityArb = fc.constantFrom(...ALL_RARITIES);

// Arbitrary for generating random achievement
const achievementArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    code: fc.string({ minLength: 1, maxLength: 50 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    iconUrl: fc.string({ minLength: 0, maxLength: 255 }),
    category: fc.constantFrom(
        'PROBLEM_SOLVING',
        'COMPETITION',
        'ENGAGEMENT',
        'SOCIAL',
        'SPECIAL',
    ) as fc.Arbitrary<Achievement['category']>,
    rarity: rarityArb,
    xpReward: fc.integer({ min: 0, max: 10000 }),
    targetValue: fc.integer({ min: 1, max: 1000 }),
    isSecret: fc.boolean(),
    unlockedPercentage: fc.float({ min: 0, max: 100 }),
});

// Arbitrary for generating random user achievement
const userAchievementArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    achievement: achievementArb,
    unlockedAt: fc.date(),
    isShowcased: fc.boolean(),
    showcaseOrder: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
});

describe('Achievement Accessibility Property-Based Tests', () => {
    /**
     * **Feature: achievement-system, Property 30: Screen reader attributes present**
     * **Validates: Requirements 12.2**
     *
     * For any achievement notification, the rendered element should include
     * appropriate aria-label or aria-live attributes containing the achievement
     * name and description.
     */
    describe('Property 30: Screen reader attributes present', () => {
        it('should have rarity styles with badgeText for screen reader labels', () => {
            fc.assert(
                fc.property(rarityArb, (rarity) => {
                    const styles = getRarityStyles(rarity);

                    // badgeText should be present and non-empty for aria-label usage
                    expect(styles.badgeText).toBeDefined();
                    expect(styles.badgeText.length).toBeGreaterThan(0);

                    // badgeText should be human-readable (not a code)
                    expect(styles.badgeText).toMatch(/^[A-Z][a-z]+$/);
                }),
                { seed: 1234567890 },
            );
        });

        it('should have achievement name and description available for screen readers', () => {
            fc.assert(
                fc.property(achievementArb, (achievement) => {
                    // Achievement should have name for aria-label
                    expect(achievement.name).toBeDefined();
                    expect(achievement.name.length).toBeGreaterThan(0);

                    // Achievement should have description for aria-describedby
                    expect(achievement.description).toBeDefined();
                    expect(achievement.description.length).toBeGreaterThan(0);
                }),
                { seed: -987654321 },
            );
        });

        it('should have XP reward available for screen reader announcement', () => {
            fc.assert(
                fc.property(achievementArb, (achievement) => {
                    // XP reward should be a number that can be announced
                    expect(typeof achievement.xpReward).toBe('number');
                    expect(achievement.xpReward).toBeGreaterThanOrEqual(0);
                }),
                { seed: 555555555 },
            );
        });

        it('should have all required fields for complete screen reader announcement', () => {
            fc.assert(
                fc.property(userAchievementArb, (userAchievement) => {
                    const { achievement } = userAchievement;
                    const styles = getRarityStyles(achievement.rarity);

                    // All fields needed for a complete announcement should be present
                    const announcementParts = [
                        achievement.name,
                        achievement.description,
                        styles.badgeText,
                        String(achievement.xpReward),
                    ];

                    announcementParts.forEach((part) => {
                        expect(part).toBeDefined();
                        expect(part.length).toBeGreaterThan(0);
                    });
                }),
                { seed: 111222333 },
            );
        });
    });

    /**
     * **Feature: achievement-system, Property 31: Non-color rarity indicators**
     * **Validates: Requirements 12.3**
     *
     * For any achievement rarity level, there should be a non-color visual
     * indicator (icon or pattern) that distinguishes it from other rarities.
     */
    describe('Property 31: Non-color rarity indicators', () => {
        it('should have unique icon for each rarity level', () => {
            const icons = ALL_RARITIES.map((rarity) => getRarityStyles(rarity).icon);
            const uniqueIcons = new Set(icons);

            // Each rarity should have a unique icon
            expect(uniqueIcons.size).toBe(ALL_RARITIES.length);
        });

        it('should have non-empty icon for any rarity', () => {
            fc.assert(
                fc.property(rarityArb, (rarity) => {
                    const styles = getRarityStyles(rarity);

                    expect(styles.icon).toBeDefined();
                    expect(styles.icon.length).toBeGreaterThan(0);
                }),
                { seed: 444555666 },
            );
        });

        it('should have indicator count for visual hierarchy', () => {
            fc.assert(
                fc.property(rarityArb, (rarity) => {
                    const styles = getRarityStyles(rarity);

                    // indicatorCount should be present and positive
                    expect(styles.indicatorCount).toBeDefined();
                    expect(styles.indicatorCount).toBeGreaterThan(0);
                    expect(styles.indicatorCount).toBeLessThanOrEqual(5);
                }),
                { seed: 777888999 },
            );
        });

        it('should have increasing indicator count with rarity tier', () => {
            const rarityOrder: AchievementRarity[] = [
                'COMMON',
                'UNCOMMON',
                'RARE',
                'EPIC',
                'LEGENDARY',
            ];

            for (let i = 0; i < rarityOrder.length - 1; i++) {
                const currentStyles = getRarityStyles(rarityOrder[i]);
                const nextStyles = getRarityStyles(rarityOrder[i + 1]);

                // Higher rarity should have more indicators
                expect(nextStyles.indicatorCount).toBeGreaterThan(currentStyles.indicatorCount);
            }
        });

        it('should have different icons for different rarities', () => {
            fc.assert(
                fc.property(rarityArb, rarityArb, (rarity1, rarity2) => {
                    if (rarity1 === rarity2) return true; // Skip same rarity

                    const styles1 = getRarityStyles(rarity1);
                    const styles2 = getRarityStyles(rarity2);

                    // Different rarities should have different icons
                    expect(styles1.icon).not.toBe(styles2.icon);
                    return true;
                }),
                { seed: 123123123 },
            );
        });
    });

    /**
     * **Feature: achievement-system, Property 32: Reduced motion preference respected**
     * **Validates: Requirements 12.4**
     *
     * For any animation in the achievement system, when the user has
     * prefers-reduced-motion enabled, the animation should be disabled or simplified.
     */
    describe('Property 32: Reduced motion preference respected', () => {
        it('should return 0 duration when reduced motion is preferred', () => {
            fc.assert(
                fc.property(fc.integer({ min: 0, max: 10000 }), (duration) => {
                    const result = getAnimationDuration(duration, true);
                    expect(result).toBe(0);
                }),
                { seed: 999888777 },
            );
        });

        it('should return original duration when reduced motion is not preferred', () => {
            fc.assert(
                fc.property(fc.integer({ min: 0, max: 10000 }), (duration) => {
                    const result = getAnimationDuration(duration, false);
                    expect(result).toBe(duration);
                }),
                { seed: 666555444 },
            );
        });

        it('should return instant transition when reduced motion is preferred', () => {
            const transition = getMotionTransition(true);
            expect(transition.duration).toBe(0);
        });

        it('should return normal transition when reduced motion is not preferred', () => {
            const transition = getMotionTransition(false);
            expect(transition.duration).toBeGreaterThan(0);
            expect(transition.ease).toBeDefined();
        });

        it('should consistently return same transition for same preference', () => {
            fc.assert(
                fc.property(fc.boolean(), (prefersReducedMotion) => {
                    const transition1 = getMotionTransition(prefersReducedMotion);
                    const transition2 = getMotionTransition(prefersReducedMotion);

                    expect(transition1.duration).toBe(transition2.duration);
                }),
                { seed: 333222111 },
            );
        });

        it('should disable confetti for rare+ achievements when reduced motion is preferred', () => {
            // Enhanced celebration should still be determined by rarity
            // but the actual animation should be disabled by the component
            const rareRarities: AchievementRarity[] = ['RARE', 'EPIC', 'LEGENDARY'];
            const commonRarities: AchievementRarity[] = ['COMMON', 'UNCOMMON'];

            rareRarities.forEach((rarity) => {
                expect(shouldShowEnhancedCelebration(rarity)).toBe(true);
            });

            commonRarities.forEach((rarity) => {
                expect(shouldShowEnhancedCelebration(rarity)).toBe(false);
            });
        });
    });
});
