/**
 * Level System Types
 *
 * Type definitions for the user leveling system that integrates with achievements.
 * Matches backend DTOs from ro-oai-backend.
 */

/**
 * Level tier representing visual groupings of levels.
 * Each tier has distinct styling and represents a progression milestone.
 */
export type LevelTier = 'NOVICE' | 'APPRENTICE' | 'EXPERT' | 'MASTER' | 'LEGEND';

/**
 * Progress information within the current level.
 */
export type LevelProgress = {
    /** XP earned within the current level */
    currentXpInLevel: number;
    /** Total XP needed to reach the next level from current level start */
    xpNeededForNextLevel: number;
    /** Progress percentage (0-100) */
    percentage: number;
    /** True if the user is at maximum level (50) */
    isMaxLevel: boolean;
};

/**
 * Complete user level information returned from the API.
 */
export type UserLevel = {
    /** The user's ID */
    userId: string;
    /** The user's current level (1-50) */
    level: number;
    /** The user's total XP earned from achievements */
    totalXp: number;
    /** The user's current level tier */
    tier: LevelTier;
    /** The display name of the tier */
    tierName: string;
    /** Progress information within the current level */
    progress: LevelProgress;
};

/**
 * Level-up notification data for displaying celebrations.
 */
export type LevelUpNotification = {
    /** The level before the increase */
    previousLevel: number;
    /** The new level after the increase */
    newLevel: number;
    /** Whether the tier changed during this level-up */
    tierChanged: boolean;
    /** The new tier if tier changed */
    newTier?: LevelTier;
};

/**
 * Level threshold information for a single level.
 */
export type LevelThreshold = {
    /** The level number (1-50) */
    level: number;
    /** Total cumulative XP required to reach this level */
    xpRequired: number;
    /** The tier this level belongs to */
    tier: LevelTier;
    /** Display name of the tier */
    tierName: string;
};

/**
 * Response from the level thresholds API endpoint.
 */
export type LevelThresholdsResponse = {
    /** Array of all level thresholds from 1 to 50 */
    thresholds: LevelThreshold[];
};
