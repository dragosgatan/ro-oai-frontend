/**
 * Level Calculator Utilities
 *
 * Client-side level calculation functions that match the backend LevelCalculator logic.
 * Uses the same exponential formula: XP for level n = sum(base * multiplier^(i-1)) for i = 1 to n-1
 *
 * Requirements: 3.1, 3.2
 */

import type { LevelProgress, LevelTier, LevelThreshold } from './types';
import { getTierForLevel, TIER_CONFIG } from './tier-config';

/**
 * Level system constants matching backend LevelConstants.
 */
export const LEVEL_CONSTANTS = {
    /** Maximum level a user can achieve */
    MAX_LEVEL: 50,
    /** Minimum level (starting level for all users) */
    MIN_LEVEL: 1,
    /** Approximate maximum XP required to reach level 50 */
    MAX_XP: 100_000,
    /** Base XP for the exponential formula */
    XP_BASE: 50.0,
    /** Multiplier for the exponential formula */
    XP_MULTIPLIER: 1.12,
} as const;

/**
 * Pre-calculated XP thresholds for each level (1-50).
 * Index 0 = Level 1 threshold (0 XP)
 * Index 49 = Level 50 threshold
 */
const LEVEL_THRESHOLDS: number[] = calculateThresholds();

/**
 * Calculate XP thresholds using exponential curve.
 * Formula: cumulative_xp(n) = sum(base * multiplier^(i-1)) for i = 1 to n-1
 * @returns Array of cumulative XP thresholds for levels 1-50
 */
function calculateThresholds(): number[] {
    const thresholds: number[] = new Array(LEVEL_CONSTANTS.MAX_LEVEL);
    thresholds[0] = 0; // Level 1 requires 0 XP

    const base = LEVEL_CONSTANTS.XP_BASE;
    const multiplier = LEVEL_CONSTANTS.XP_MULTIPLIER;
    let cumulative = 0;

    for (let i = 1; i < LEVEL_CONSTANTS.MAX_LEVEL; i++) {
        const xpForThisLevel = Math.floor(base * Math.pow(multiplier, i - 1));
        cumulative += xpForThisLevel;
        thresholds[i] = cumulative;
    }

    return thresholds;
}

/**
 * Calculate level from total XP.
 * @param totalXp - The user's total XP
 * @returns The calculated level (1-50)
 */
export function calculateLevel(totalXp: number): number {
    if (totalXp <= 0) {
        return LEVEL_CONSTANTS.MIN_LEVEL;
    }

    // Search from highest level down
    for (let level = LEVEL_CONSTANTS.MAX_LEVEL; level >= 1; level--) {
        if (totalXp >= LEVEL_THRESHOLDS[level - 1]) {
            return level;
        }
    }

    return LEVEL_CONSTANTS.MIN_LEVEL;
}

/**
 * Get XP required to reach a specific level.
 * @param level - The target level (1-50)
 * @returns Total cumulative XP required to reach that level
 */
export function getXpForLevel(level: number): number {
    if (level <= LEVEL_CONSTANTS.MIN_LEVEL) {
        return 0;
    }
    if (level > LEVEL_CONSTANTS.MAX_LEVEL) {
        return LEVEL_THRESHOLDS[LEVEL_CONSTANTS.MAX_LEVEL - 1];
    }
    return LEVEL_THRESHOLDS[level - 1];
}

/**
 * Get XP progress within current level.
 * @param totalXp - The user's total XP
 * @returns Progress info (current XP in level, XP needed for next level, percentage)
 */
export function getProgress(totalXp: number): LevelProgress {
    const currentLevel = calculateLevel(totalXp);

    if (currentLevel >= LEVEL_CONSTANTS.MAX_LEVEL) {
        return {
            currentXpInLevel: totalXp,
            xpNeededForNextLevel: totalXp,
            percentage: 100.0,
            isMaxLevel: true,
        };
    }

    const currentLevelXp = getXpForLevel(currentLevel);
    const nextLevelXp = getXpForLevel(currentLevel + 1);
    const xpInLevel = totalXp - currentLevelXp;
    const xpNeeded = nextLevelXp - currentLevelXp;

    let percentage = xpNeeded > 0 ? (xpInLevel * 100.0) / xpNeeded : 0.0;
    // Clamp percentage to valid range
    percentage = Math.max(0.0, Math.min(100.0, percentage));

    return {
        currentXpInLevel: xpInLevel,
        xpNeededForNextLevel: xpNeeded,
        percentage,
        isMaxLevel: false,
    };
}

/**
 * Get the XP required to go from one level to the next.
 * @param level - The current level
 * @returns XP needed to advance to level+1
 */
export function getXpBetweenLevels(level: number): number {
    if (level < LEVEL_CONSTANTS.MIN_LEVEL || level >= LEVEL_CONSTANTS.MAX_LEVEL) {
        return 0;
    }
    return getXpForLevel(level + 1) - getXpForLevel(level);
}

/**
 * Get all level thresholds for display purposes.
 * @returns Array of level threshold information for levels 1-50
 */
export function getAllThresholds(): LevelThreshold[] {
    return LEVEL_THRESHOLDS.map((xpRequired, index) => {
        const level = index + 1;
        const tier: LevelTier = getTierForLevel(level);
        return {
            level,
            xpRequired,
            tier,
            tierName: TIER_CONFIG[tier].name,
        };
    });
}
