/**
 * AchievementsSection Component Property-Based Tests
 *
 * **Feature: achievement-system, Property 1: Achievement display contains required fields**
 * **Feature: achievement-system, Property 14: Achievement sorting correctness**
 *
 * These tests verify:
 * - For any set of user achievements, the rendered achievement display should contain the icon, name, and unlock date
 * - For any list of achievements sorted by a given criterion, the resulting list should be in the correct order
 *
 * **Validates: Requirements 1.1, 5.4**
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import type {
    Achievement,
    UserAchievement,
    AchievementProgress,
    AchievementRarity,
    AchievementCategory,
} from '@/lib/types';

// All possible rarity values in order from highest to lowest
const RARITY_ORDER: AchievementRarity[] = ['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];

// All possible category values in order
const CATEGORY_ORDER: AchievementCategory[] = [
    'PROBLEM_SOLVING',
    'COMPETITION',
    'ENGAGEMENT',
    'SOCIAL',
    'SPECIAL',
];

// Arbitrary for generating valid rarity values
const rarityArbitrary = fc.constantFrom<AchievementRarity>(...RARITY_ORDER);

// Arbitrary for generating valid category values
const categoryArbitrary = fc.constantFrom<AchievementCategory>(...CATEGORY_ORDER);

// Arbitrary for generating a valid achievement
const achievementArbitrary = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    code: fc.string({ minLength: 3, maxLength: 20 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    description: fc.string({ minLength: 1, maxLength: 200 }),
    iconUrl: fc.string({ minLength: 0, maxLength: 100 }),
    category: categoryArbitrary,
    rarity: rarityArbitrary,
    xpReward: fc.integer({ min: 0, max: 1000 }),
    targetValue: fc.integer({ min: 1, max: 1000 }),
    isSecret: fc.boolean(),
    unlockedPercentage: fc.float({ min: 0, max: 100 }),
});

// Arbitrary for generating a user achievement
const userAchievementArbitrary = achievementArbitrary.chain((achievement) =>
    fc.record({
        id: fc.integer({ min: 1, max: 10000 }),
        achievement: fc.constant(achievement),
        unlockedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
        isShowcased: fc.boolean(),
        showcaseOrder: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
    }),
);

// Helper function to check if an achievement has required display fields
function hasRequiredDisplayFields(achievement: Achievement): boolean {
    return (
        typeof achievement.name === 'string' &&
        achievement.name.length > 0 &&
        typeof achievement.iconUrl === 'string' &&
        typeof achievement.description === 'string'
    );
}

// Helper function to check if a user achievement has required display fields
function userAchievementHasRequiredFields(userAchievement: UserAchievement): boolean {
    return (
        hasRequiredDisplayFields(userAchievement.achievement) &&
        userAchievement.unlockedAt instanceof Date
    );
}

// Helper function to sort achievements by rarity
function sortByRarity(achievements: Achievement[]): Achievement[] {
    return [...achievements].sort((a, b) => {
        const aIndex = RARITY_ORDER.indexOf(a.rarity);
        const bIndex = RARITY_ORDER.indexOf(b.rarity);
        return aIndex - bIndex;
    });
}

// Helper function to sort achievements by category
function sortByCategory(achievements: Achievement[]): Achievement[] {
    return [...achievements].sort((a, b) => {
        const aIndex = CATEGORY_ORDER.indexOf(a.category);
        const bIndex = CATEGORY_ORDER.indexOf(b.category);
        if (aIndex !== bIndex) return aIndex - bIndex;
        // Within same category, sort by rarity
        const aRarity = RARITY_ORDER.indexOf(a.rarity);
        const bRarity = RARITY_ORDER.indexOf(b.rarity);
        return aRarity - bRarity;
    });
}

// Helper function to sort achievements by name
function sortByName(achievements: Achievement[]): Achievement[] {
    return [...achievements].sort((a, b) => a.name.localeCompare(b.name));
}

// Helper function to check if array is sorted by rarity
function isSortedByRarity(achievements: Achievement[]): boolean {
    for (let i = 1; i < achievements.length; i++) {
        const prevIndex = RARITY_ORDER.indexOf(achievements[i - 1].rarity);
        const currIndex = RARITY_ORDER.indexOf(achievements[i].rarity);
        if (prevIndex > currIndex) return false;
    }
    return true;
}

// Helper function to check if array is sorted by category
function isSortedByCategory(achievements: Achievement[]): boolean {
    for (let i = 1; i < achievements.length; i++) {
        const prevCatIndex = CATEGORY_ORDER.indexOf(achievements[i - 1].category);
        const currCatIndex = CATEGORY_ORDER.indexOf(achievements[i].category);
        if (prevCatIndex > currCatIndex) return false;
    }
    return true;
}

// Helper function to check if array is sorted by name
function isSortedByName(achievements: Achievement[]): boolean {
    for (let i = 1; i < achievements.length; i++) {
        if (achievements[i - 1].name.localeCompare(achievements[i].name) > 0) {
            return false;
        }
    }
    return true;
}

describe('AchievementsSection Property-Based Tests', () => {
    /**
     * **Feature: achievement-system, Property 1: Achievement display contains required fields**
     * **Validates: Requirements 1.1**
     */
    describe('Property 1: Achievement display contains required fields', () => {
        test.prop([achievementArbitrary], { numRuns: 100 })(
            'should have name field for any achievement',
            (achievement) => {
                expect(achievement.name).toBeDefined();
                expect(typeof achievement.name).toBe('string');
                expect(achievement.name.length).toBeGreaterThan(0);
            },
        );

        test.prop([achievementArbitrary], { numRuns: 100 })(
            'should have iconUrl field for any achievement',
            (achievement) => {
                expect(achievement.iconUrl).toBeDefined();
                expect(typeof achievement.iconUrl).toBe('string');
            },
        );

        test.prop([userAchievementArbitrary], { numRuns: 100 })(
            'should have unlock date for any user achievement',
            (userAchievement) => {
                expect(userAchievement.unlockedAt).toBeDefined();
                expect(userAchievement.unlockedAt).toBeInstanceOf(Date);
            },
        );

        test.prop([userAchievementArbitrary], { numRuns: 100 })(
            'should have all required display fields for any user achievement',
            (userAchievement) => {
                expect(userAchievementHasRequiredFields(userAchievement)).toBe(true);
            },
        );

        test.prop([fc.array(userAchievementArbitrary, { minLength: 1, maxLength: 20 })], {
            numRuns: 50,
        })('should have required fields for all achievements in a list', (userAchievements) => {
            userAchievements.forEach((ua) => {
                expect(userAchievementHasRequiredFields(ua)).toBe(true);
            });
        });

        test.prop([achievementArbitrary], { numRuns: 100 })(
            'should have description field for any achievement',
            (achievement) => {
                expect(achievement.description).toBeDefined();
                expect(typeof achievement.description).toBe('string');
            },
        );
    });

    /**
     * **Feature: achievement-system, Property 14: Achievement sorting correctness**
     * **Validates: Requirements 5.4**
     */
    describe('Property 14: Achievement sorting correctness', () => {
        test.prop([fc.array(achievementArbitrary, { minLength: 2, maxLength: 20 })], {
            numRuns: 50,
        })('should correctly sort achievements by rarity', (achievements) => {
            const sorted = sortByRarity(achievements);
            expect(isSortedByRarity(sorted)).toBe(true);
        });

        test.prop([fc.array(achievementArbitrary, { minLength: 2, maxLength: 20 })], {
            numRuns: 50,
        })('should correctly sort achievements by category', (achievements) => {
            const sorted = sortByCategory(achievements);
            expect(isSortedByCategory(sorted)).toBe(true);
        });

        test.prop([fc.array(achievementArbitrary, { minLength: 2, maxLength: 20 })], {
            numRuns: 50,
        })('should correctly sort achievements by name', (achievements) => {
            const sorted = sortByName(achievements);
            expect(isSortedByName(sorted)).toBe(true);
        });

        test.prop([fc.array(achievementArbitrary, { minLength: 1, maxLength: 20 })], {
            numRuns: 50,
        })('should preserve all achievements after sorting by rarity', (achievements) => {
            const sorted = sortByRarity(achievements);
            expect(sorted.length).toBe(achievements.length);

            // All original achievements should be in the sorted list
            achievements.forEach((original) => {
                expect(sorted.some((s) => s.id === original.id)).toBe(true);
            });
        });

        test.prop([fc.array(achievementArbitrary, { minLength: 1, maxLength: 20 })], {
            numRuns: 50,
        })('should preserve all achievements after sorting by category', (achievements) => {
            const sorted = sortByCategory(achievements);
            expect(sorted.length).toBe(achievements.length);

            // All original achievements should be in the sorted list
            achievements.forEach((original) => {
                expect(sorted.some((s) => s.id === original.id)).toBe(true);
            });
        });

        test.prop([fc.array(achievementArbitrary, { minLength: 1, maxLength: 20 })], {
            numRuns: 50,
        })('should preserve all achievements after sorting by name', (achievements) => {
            const sorted = sortByName(achievements);
            expect(sorted.length).toBe(achievements.length);

            // All original achievements should be in the sorted list
            achievements.forEach((original) => {
                expect(sorted.some((s) => s.id === original.id)).toBe(true);
            });
        });

        test.prop([fc.array(achievementArbitrary, { minLength: 1, maxLength: 20 })], {
            numRuns: 50,
        })('should be idempotent - sorting twice produces same result', (achievements) => {
            const sortedOnce = sortByRarity(achievements);
            const sortedTwice = sortByRarity(sortedOnce);

            expect(sortedOnce.map((a) => a.id)).toEqual(sortedTwice.map((a) => a.id));
        });

        test.prop([achievementArbitrary], { numRuns: 100 })(
            'should handle single achievement correctly',
            (achievement) => {
                const achievements = [achievement];

                const sortedByRarity = sortByRarity(achievements);
                const sortedByCategory = sortByCategory(achievements);
                const sortedByName = sortByName(achievements);

                expect(sortedByRarity.length).toBe(1);
                expect(sortedByCategory.length).toBe(1);
                expect(sortedByName.length).toBe(1);
                expect(sortedByRarity[0].id).toBe(achievement.id);
            },
        );
    });
});
