/**
 * Level System Module
 *
 * Exports all level-related types, utilities, and API functions.
 */

// Types
export type {
    LevelTier,
    LevelProgress,
    UserLevel,
    LevelUpNotification,
    LevelThreshold,
    LevelThresholdsResponse,
} from './types';

// Tier configuration
export type { TierConfig } from './tier-config';
export {
    TIER_CONFIG,
    TIER_BOUNDARIES,
    TIER_ORDER,
    getTierForLevel,
    getTierConfig,
    getTierConfigForLevel,
    isTierBoundary,
} from './tier-config';

// Level calculation utilities
export {
    LEVEL_CONSTANTS,
    calculateLevel,
    getXpForLevel,
    getProgress,
    getXpBetweenLevels,
    getAllThresholds,
} from './calculator';

// API functions
export { fetchUserLevel, fetchLevelThresholds } from './api';
