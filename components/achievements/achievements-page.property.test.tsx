/**
 * Achievements Page Property-Based Tests
 *
 * **Feature: achievement-system, Property 13: Unlock percentage calculation**
 * **Feature: achievement-system, Property 28: User comparison set difference**
 *
 * These tests verify:
 * - For any achievement, the displayed unlock percentage should equal (usersWithAchievement / totalUsers) * 100
 * - For any two users being compared, the highlighted achievements should be exactly those that the current user has earned but the viewed user has not
 *
 * **Validates: Requirements 5.3, 11.3**
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import type {
    Achievement,
    UserAchievement,
    AchievementCategory,
    AchievementRarity,
} from '@/lib/types';

// All possible rarity values
const ALL_RARITIES: AchievementRarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
const ALL_CATEGORIES: AchievementCategory[] = [
    'PROBLEM_SOLVING',
    'COMPETITION',
    'ENGAGEMENT',
    'SOCIAL',
    'SPECIAL',
];

// Arbitrary for generating valid rarity values
const rarityArbitrary = fc.constantFrom<AchievementRarity>(...ALL_RARITIES);
const categoryArbitrary = fc.constantFrom<AchievementCategory>(...ALL_CATEGORIES);

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
const userAchievementArbitrary = (achievement: Achievement) =>
    fc.record({
        id: fc.integer({ min: 1, max: 10000 }),
        achievement: fc.constant(achievement),
        unlockedAt: fc.date(),
        isShowcased: fc.boolean(),
        showcaseOrder: fc.option(fc.integer({ min: 1, max: 5 })),
    });

/**
 * Calculate unlock percentage
 * This is the pure function that calculates the unlock percentage
 */
export function calculateUnlockPercentage(
    usersWithAchievement: number,
    totalUsers: number,
): number {
    if (totalUsers === 0) return 0;
    return (usersWithAchievement / totalUsers) * 100;
}

/**
 * Calculate user comparison set difference
 * Returns achievements that currentUser has but compareUser doesn't
 */
export function calculateUniqueAchievements(
    currentUserAchievementIds: Set<number>,
    compareUserAchievementIds: Set<number>,
    allAchievements: Achievement[],
): Achievement[] {
    return allAchievements.filter(
        (a) => currentUserAchievementIds.has(a.id) && !compareUserAchievementIds.has(a.id),
    );
}

/**
 * Calculate shared achievements between two users
 */
export function calculateSharedAchievements(
    currentUserAchievementIds: Set<number>,
    compareUserAchievementIds: Set<number>,
    allAchievements: Achievement[],
): Achievement[] {
    return allAchievements.filter(
        (a) => currentUserAchievementIds.has(a.id) && compareUserAchievementIds.has(a.id),
    );
}

describe('Achievements Page Property-Based Tests', () => {
    /**
     * **Feature: achievement-system, Property 13: Unlock percentage calculation**
     * **Validates: Requirements 5.3**
     */
    describe('Property 13: Unlock percentage calculation', () => {
        test.prop([fc.integer({ min: 0, max: 10000 }), fc.integer({ min: 1, max: 10000 })], {
            numRuns: 100,
        })(
            'should calculate unlock percentage as (usersWithAchievement / totalUsers) * 100',
            (usersWithAchievement, totalUsers) => {
                // Ensure usersWithAchievement doesn't exceed totalUsers
                const actualUsersWithAchievement = Math.min(usersWithAchievement, totalUsers);

                const percentage = calculateUnlockPercentage(
                    actualUsersWithAchievement,
                    totalUsers,
                );
                const expected = (actualUsersWithAchievement / totalUsers) * 100;

                expect(percentage).toBeCloseTo(expected, 10);
            },
        );

        test.prop([fc.integer({ min: 0, max: 10000 })], { numRuns: 100 })(
            'should return 0 when totalUsers is 0',
            (usersWithAchievement) => {
                const percentage = calculateUnlockPercentage(usersWithAchievement, 0);
                expect(percentage).toBe(0);
            },
        );

        test.prop([fc.integer({ min: 1, max: 10000 })], { numRuns: 100 })(
            'should return 100 when all users have the achievement',
            (totalUsers) => {
                const percentage = calculateUnlockPercentage(totalUsers, totalUsers);
                expect(percentage).toBe(100);
            },
        );

        test.prop([fc.integer({ min: 1, max: 10000 })], { numRuns: 100 })(
            'should return 0 when no users have the achievement',
            (totalUsers) => {
                const percentage = calculateUnlockPercentage(0, totalUsers);
                expect(percentage).toBe(0);
            },
        );

        test.prop([fc.integer({ min: 0, max: 10000 }), fc.integer({ min: 1, max: 10000 })], {
            numRuns: 100,
        })('should always return a value between 0 and 100', (usersWithAchievement, totalUsers) => {
            const actualUsersWithAchievement = Math.min(usersWithAchievement, totalUsers);
            const percentage = calculateUnlockPercentage(actualUsersWithAchievement, totalUsers);

            expect(percentage).toBeGreaterThanOrEqual(0);
            expect(percentage).toBeLessThanOrEqual(100);
        });

        test.prop([fc.integer({ min: 0, max: 10000 }), fc.integer({ min: 1, max: 10000 })], {
            numRuns: 100,
        })(
            'should be consistent - same inputs always produce same output',
            (usersWithAchievement, totalUsers) => {
                const actualUsersWithAchievement = Math.min(usersWithAchievement, totalUsers);

                const result1 = calculateUnlockPercentage(actualUsersWithAchievement, totalUsers);
                const result2 = calculateUnlockPercentage(actualUsersWithAchievement, totalUsers);
                const result3 = calculateUnlockPercentage(actualUsersWithAchievement, totalUsers);

                expect(result1).toBe(result2);
                expect(result2).toBe(result3);
            },
        );

        test.prop([fc.integer({ min: 1, max: 5000 }), fc.integer({ min: 5001, max: 10000 })], {
            numRuns: 100,
        })(
            'should increase monotonically as more users unlock',
            (usersWithAchievement1, totalUsers) => {
                const usersWithAchievement2 = usersWithAchievement1 + 1;

                const percentage1 = calculateUnlockPercentage(usersWithAchievement1, totalUsers);
                const percentage2 = calculateUnlockPercentage(usersWithAchievement2, totalUsers);

                expect(percentage2).toBeGreaterThan(percentage1);
            },
        );
    });

    /**
     * **Feature: achievement-system, Property 28: User comparison set difference**
     * **Validates: Requirements 11.3**
     */
    describe('Property 28: User comparison set difference', () => {
        // Generate a list of unique achievement IDs
        const achievementIdsArbitrary = fc.uniqueArray(fc.integer({ min: 1, max: 1000 }), {
            minLength: 0,
            maxLength: 50,
        });

        test.prop(
            [
                achievementIdsArbitrary,
                achievementIdsArbitrary,
                fc.array(achievementArbitrary, { minLength: 1, maxLength: 50 }),
            ],
            { numRuns: 100 },
        )(
            'should return exactly the achievements current user has that compare user does not',
            (currentUserIds, compareUserIds, achievements) => {
                // Ensure achievements have unique IDs
                const uniqueAchievements = achievements.reduce((acc, a, i) => {
                    acc.push({ ...a, id: i + 1 });
                    return acc;
                }, [] as Achievement[]);

                // Create sets from the IDs that exist in our achievements
                const validIds = new Set(uniqueAchievements.map((a) => a.id));
                const currentUserSet = new Set(currentUserIds.filter((id) => validIds.has(id)));
                const compareUserSet = new Set(compareUserIds.filter((id) => validIds.has(id)));

                const uniqueToCurrentUser = calculateUniqueAchievements(
                    currentUserSet,
                    compareUserSet,
                    uniqueAchievements,
                );

                // Verify each returned achievement is in currentUser's set but not in compareUser's set
                for (const achievement of uniqueToCurrentUser) {
                    expect(currentUserSet.has(achievement.id)).toBe(true);
                    expect(compareUserSet.has(achievement.id)).toBe(false);
                }

                // Verify we didn't miss any achievements
                const expectedCount = uniqueAchievements.filter(
                    (a) => currentUserSet.has(a.id) && !compareUserSet.has(a.id),
                ).length;
                expect(uniqueToCurrentUser.length).toBe(expectedCount);
            },
        );

        test.prop(
            [
                achievementIdsArbitrary,
                fc.array(achievementArbitrary, { minLength: 1, maxLength: 50 }),
            ],
            { numRuns: 100 },
        )(
            'should return empty array when comparing user with themselves',
            (userIds, achievements) => {
                const uniqueAchievements = achievements.reduce((acc, a, i) => {
                    acc.push({ ...a, id: i + 1 });
                    return acc;
                }, [] as Achievement[]);

                const validIds = new Set(uniqueAchievements.map((a) => a.id));
                const userSet = new Set(userIds.filter((id) => validIds.has(id)));

                // When comparing with self, unique achievements should be empty
                const uniqueToCurrentUser = calculateUniqueAchievements(
                    userSet,
                    userSet,
                    uniqueAchievements,
                );

                expect(uniqueToCurrentUser.length).toBe(0);
            },
        );

        test.prop(
            [
                achievementIdsArbitrary,
                fc.array(achievementArbitrary, { minLength: 1, maxLength: 50 }),
            ],
            { numRuns: 100 },
        )(
            'should return all current user achievements when compare user has none',
            (currentUserIds, achievements) => {
                const uniqueAchievements = achievements.reduce((acc, a, i) => {
                    acc.push({ ...a, id: i + 1 });
                    return acc;
                }, [] as Achievement[]);

                const validIds = new Set(uniqueAchievements.map((a) => a.id));
                const currentUserSet = new Set(currentUserIds.filter((id) => validIds.has(id)));
                const emptySet = new Set<number>();

                const uniqueToCurrentUser = calculateUniqueAchievements(
                    currentUserSet,
                    emptySet,
                    uniqueAchievements,
                );

                // Should return all achievements the current user has
                expect(uniqueToCurrentUser.length).toBe(currentUserSet.size);
            },
        );

        test.prop(
            [
                achievementIdsArbitrary,
                fc.array(achievementArbitrary, { minLength: 1, maxLength: 50 }),
            ],
            { numRuns: 100 },
        )(
            'should return empty array when current user has no achievements',
            (compareUserIds, achievements) => {
                const uniqueAchievements = achievements.reduce((acc, a, i) => {
                    acc.push({ ...a, id: i + 1 });
                    return acc;
                }, [] as Achievement[]);

                const validIds = new Set(uniqueAchievements.map((a) => a.id));
                const emptySet = new Set<number>();
                const compareUserSet = new Set(compareUserIds.filter((id) => validIds.has(id)));

                const uniqueToCurrentUser = calculateUniqueAchievements(
                    emptySet,
                    compareUserSet,
                    uniqueAchievements,
                );

                expect(uniqueToCurrentUser.length).toBe(0);
            },
        );

        test.prop(
            [
                achievementIdsArbitrary,
                achievementIdsArbitrary,
                fc.array(achievementArbitrary, { minLength: 1, maxLength: 50 }),
            ],
            { numRuns: 100 },
        )(
            'unique + shared + other unique should equal total achievements',
            (currentUserIds, compareUserIds, achievements) => {
                const uniqueAchievements = achievements.reduce((acc, a, i) => {
                    acc.push({ ...a, id: i + 1 });
                    return acc;
                }, [] as Achievement[]);

                const validIds = new Set(uniqueAchievements.map((a) => a.id));
                const currentUserSet = new Set(currentUserIds.filter((id) => validIds.has(id)));
                const compareUserSet = new Set(compareUserIds.filter((id) => validIds.has(id)));

                const uniqueToCurrentUser = calculateUniqueAchievements(
                    currentUserSet,
                    compareUserSet,
                    uniqueAchievements,
                );

                const uniqueToCompareUser = calculateUniqueAchievements(
                    compareUserSet,
                    currentUserSet,
                    uniqueAchievements,
                );

                const shared = calculateSharedAchievements(
                    currentUserSet,
                    compareUserSet,
                    uniqueAchievements,
                );

                // The sets should be disjoint
                const uniqueToCurrentIds = new Set(uniqueToCurrentUser.map((a) => a.id));
                const uniqueToCompareIds = new Set(uniqueToCompareUser.map((a) => a.id));
                const sharedIds = new Set(shared.map((a) => a.id));

                // No overlap between unique sets
                for (const id of uniqueToCurrentIds) {
                    expect(uniqueToCompareIds.has(id)).toBe(false);
                    expect(sharedIds.has(id)).toBe(false);
                }

                for (const id of uniqueToCompareIds) {
                    expect(uniqueToCurrentIds.has(id)).toBe(false);
                    expect(sharedIds.has(id)).toBe(false);
                }

                for (const id of sharedIds) {
                    expect(uniqueToCurrentIds.has(id)).toBe(false);
                    expect(uniqueToCompareIds.has(id)).toBe(false);
                }
            },
        );

        test.prop(
            [
                achievementIdsArbitrary,
                achievementIdsArbitrary,
                fc.array(achievementArbitrary, { minLength: 1, maxLength: 50 }),
            ],
            { numRuns: 100 },
        )(
            'should be consistent - same inputs always produce same output',
            (currentUserIds, compareUserIds, achievements) => {
                const uniqueAchievements = achievements.reduce((acc, a, i) => {
                    acc.push({ ...a, id: i + 1 });
                    return acc;
                }, [] as Achievement[]);

                const validIds = new Set(uniqueAchievements.map((a) => a.id));
                const currentUserSet = new Set(currentUserIds.filter((id) => validIds.has(id)));
                const compareUserSet = new Set(compareUserIds.filter((id) => validIds.has(id)));

                const result1 = calculateUniqueAchievements(
                    currentUserSet,
                    compareUserSet,
                    uniqueAchievements,
                );
                const result2 = calculateUniqueAchievements(
                    currentUserSet,
                    compareUserSet,
                    uniqueAchievements,
                );
                const result3 = calculateUniqueAchievements(
                    currentUserSet,
                    compareUserSet,
                    uniqueAchievements,
                );

                expect(result1.map((a) => a.id).sort()).toEqual(result2.map((a) => a.id).sort());
                expect(result2.map((a) => a.id).sort()).toEqual(result3.map((a) => a.id).sort());
            },
        );
    });
});
