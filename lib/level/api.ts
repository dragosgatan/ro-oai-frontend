/**
 * Level API Client Functions
 *
 * API functions for fetching user level information and level thresholds.
 * Follows the same patterns as other API functions in lib/api.ts.
 *
 * Requirements: 9.1, 9.4
 */

import { fetchApi } from '@/lib/api';
import type { UserLevel, LevelThresholdsResponse, LevelTier } from './types';

/**
 * Cache for level thresholds (they don't change).
 */
let thresholdsCache: LevelThresholdsResponse | null = null;

/**
 * Fetch level information for a specific user.
 * Returns the user's current level, XP, tier, and progress toward next level.
 *
 * @param userId - The user's ID
 * @throws {Error} If the request fails due to network or authentication errors
 * @returns The user's level information
 */
export async function fetchUserLevel(userId: string): Promise<UserLevel> {
    try {
        const response = await fetchApi(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${userId}/level`,
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication required. Please log in again.');
            }
            if (response.status === 404) {
                throw new Error('User not found');
            }
            if (response.status === 400) {
                throw new Error('Invalid user ID');
            }
            throw new Error(
                `Failed to fetch user level: ${response.status} ${response.statusText}`,
            );
        }

        const data = await response.json();

        // Transform the response to match our frontend types
        return {
            userId: data.userId,
            level: data.level,
            totalXp: data.totalXp,
            tier: data.tier as LevelTier,
            tierName: data.tierName,
            progress: {
                currentXpInLevel: data.progress.currentXpInLevel,
                xpNeededForNextLevel: data.progress.xpNeededForNextLevel,
                percentage: data.progress.percentage,
                isMaxLevel: data.progress.isMaxLevel,
            },
        };
    } catch (error) {
        // Re-throw with more context for network failures
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error(
                'Network error: Unable to connect to the server. Please check your connection.',
            );
        }
        throw error;
    }
}

/**
 * Fetch all level XP thresholds.
 * Returns the XP requirements for each level from 1 to 50.
 * Results are cached since thresholds don't change.
 *
 * @param useCache - Whether to use cached results (default: true)
 * @throws {Error} If the request fails due to network errors
 * @returns All level thresholds with tier information
 */
export async function fetchLevelThresholds(
    useCache: boolean = true,
): Promise<LevelThresholdsResponse> {
    // Return cached data if available and caching is enabled
    if (useCache && thresholdsCache) {
        return thresholdsCache;
    }

    try {
        const response = await fetchApi(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/level/thresholds`,
        );

        if (!response.ok) {
            throw new Error(
                `Failed to fetch level thresholds: ${response.status} ${response.statusText}`,
            );
        }

        const data = await response.json();

        // Transform the response to match our frontend types
        const result: LevelThresholdsResponse = {
            thresholds: (data.thresholds || []).map((threshold: any) => ({
                level: threshold.level,
                xpRequired: threshold.xpRequired,
                tier: threshold.tier as LevelTier,
                tierName: threshold.tierName,
            })),
        };

        // Cache the result
        thresholdsCache = result;

        return result;
    } catch (error) {
        // Re-throw with more context for network failures
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error(
                'Network error: Unable to connect to the server. Please check your connection.',
            );
        }
        throw error;
    }
}

/**
 * Clear the level thresholds cache.
 * Useful for testing or when thresholds might have changed.
 */
export function clearThresholdsCache(): void {
    thresholdsCache = null;
}
