/**
 * Level Tier Configuration
 *
 * Styling configuration for each level tier including colors, gradients, icons, and glow effects.
 * Matches the backend LevelTier enum styling.
 */

import type { LevelTier } from './types';

/**
 * Configuration for a single tier's visual styling.
 */
export type TierConfig = {
    /** Display name of the tier */
    name: string;
    /** Primary color (hex or CSS value) */
    color: string;
    /** Tailwind gradient classes for backgrounds */
    bgGradient: string;
    /** Emoji icon for the tier */
    icon: string;
    /** Glow color for effects (rgba) */
    glowColor: string;
    /** CSS class name for the tier */
    cssClass: string;
    /** Border color for badges */
    borderColor: string;
    /** Text color for contrast */
    textColor: string;
    /** Enhanced glow intensity for higher tiers (0-1) */
    glowIntensity: number;
    /** Whether this tier has animated effects */
    hasAnimatedEffects: boolean;
};

/**
 * Tier styling configuration for all level tiers.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.3
 */
export const TIER_CONFIG: Record<LevelTier, TierConfig> = {
    NOVICE: {
        name: 'Novice',
        color: '#CD7F32',
        bgGradient: 'from-amber-700 to-amber-900',
        icon: '🥉',
        glowColor: 'rgba(205, 127, 50, 0.4)',
        cssClass: 'bronze',
        borderColor: '#CD7F32',
        textColor: '#FFFFFF',
        glowIntensity: 0.3,
        hasAnimatedEffects: false,
    },
    APPRENTICE: {
        name: 'Apprentice',
        color: '#C0C0C0',
        bgGradient: 'from-slate-400 to-slate-600',
        icon: '🥈',
        glowColor: 'rgba(192, 192, 192, 0.4)',
        cssClass: 'silver',
        borderColor: '#C0C0C0',
        textColor: '#FFFFFF',
        glowIntensity: 0.4,
        hasAnimatedEffects: false,
    },
    EXPERT: {
        name: 'Expert',
        color: '#FFD700',
        bgGradient: 'from-yellow-400 to-yellow-600',
        icon: '🥇',
        glowColor: 'rgba(255, 215, 0, 0.5)',
        cssClass: 'gold',
        borderColor: '#FFD700',
        textColor: '#000000',
        glowIntensity: 0.5,
        hasAnimatedEffects: true,
    },
    MASTER: {
        name: 'Master',
        color: '#E5E4E2',
        bgGradient: 'from-cyan-200 to-blue-400',
        icon: '💎',
        glowColor: 'rgba(103, 232, 249, 0.6)',
        cssClass: 'platinum',
        borderColor: '#67E8F9',
        textColor: '#000000',
        glowIntensity: 0.6,
        hasAnimatedEffects: true,
    },
    LEGEND: {
        name: 'Legend',
        color: 'transparent',
        bgGradient: 'from-purple-500 via-pink-500 to-orange-500',
        icon: '👑',
        glowColor: 'rgba(168, 85, 247, 0.7)',
        cssClass: 'prismatic',
        borderColor: '#A855F7',
        textColor: '#FFFFFF',
        glowIntensity: 0.8,
        hasAnimatedEffects: true,
    },
};

/**
 * Level tier boundaries matching backend LevelConstants.
 */
export const TIER_BOUNDARIES = {
    NOVICE: { min: 1, max: 10 },
    APPRENTICE: { min: 11, max: 20 },
    EXPERT: { min: 21, max: 30 },
    MASTER: { min: 31, max: 40 },
    LEGEND: { min: 41, max: 50 },
} as const;

/**
 * Get the tier for a given level.
 * @param level - The level (1-50)
 * @returns The corresponding tier
 */
export function getTierForLevel(level: number): LevelTier {
    if (level < 1) return 'NOVICE';
    if (level <= 10) return 'NOVICE';
    if (level <= 20) return 'APPRENTICE';
    if (level <= 30) return 'EXPERT';
    if (level <= 40) return 'MASTER';
    return 'LEGEND';
}

/**
 * Get the tier configuration for a given level.
 * @param level - The level (1-50)
 * @returns The tier configuration
 */
export function getTierConfigForLevel(level: number): TierConfig {
    const tier = getTierForLevel(level);
    return TIER_CONFIG[tier];
}

/**
 * Get the tier configuration for a given tier.
 * @param tier - The tier
 * @returns The tier configuration
 */
export function getTierConfig(tier: LevelTier): TierConfig {
    return TIER_CONFIG[tier];
}

/**
 * Check if a level is at a tier boundary (first level of a new tier).
 * @param level - The level to check
 * @returns True if the level is the first level of a tier
 */
export function isTierBoundary(level: number): boolean {
    return level === 1 || level === 11 || level === 21 || level === 31 || level === 41;
}

/**
 * Get all tiers in order from lowest to highest.
 */
export const TIER_ORDER: LevelTier[] = ['NOVICE', 'APPRENTICE', 'EXPERT', 'MASTER', 'LEGEND'];
