'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useLevelNotifications } from '@/components/level/level-notification-provider';
import { useAchievementNotifications } from '@/components/achievements/achievement-notification-provider';
import { fetchUserLevel } from '@/lib/level/api';
import { getTierForLevel } from '@/lib/level/tier-config';
import type { LevelUpNotification } from '@/lib/level/types';

/**
 * Hook that integrates level-up notifications with the achievement system.
 *
 * This hook:
 * - Tracks the user's current level
 * - Monitors achievement notifications for new unlocks
 * - Triggers level-up notifications when achievements cause level increases
 * - Shows enhanced celebration for tier changes
 *
 * Requirements: 4.1, 4.2, 6.6
 *
 * Usage:
 * Call this hook in a component that's rendered when the user is authenticated.
 * It will automatically trigger level-up notifications when achievements are unlocked.
 */
export function useLevelUpIntegration() {
    const { data: session, status } = useSession();
    const userId = (session as any)?.id as string | undefined;
    const isAuthenticated = status === 'authenticated' && !!userId;

    const { addLevelUpNotification } = useLevelNotifications();
    const { notifications: achievementNotifications } = useAchievementNotifications();

    // Track the user's current level and XP
    const currentLevelRef = useRef<number | null>(null);
    const currentXpRef = useRef<number | null>(null);
    const lastCheckedAchievementCountRef = useRef<number>(0);

    /**
     * Check for level-up after achievements are unlocked.
     *
     * Requirement 4.1: When a user earns an achievement, immediately recalculate level
     */
    const checkForLevelUp = useCallback(async () => {
        if (!userId) return;

        try {
            const userLevel = await fetchUserLevel(userId);

            const previousLevel = currentLevelRef.current;

            // Update current values
            currentLevelRef.current = userLevel.level;
            currentXpRef.current = userLevel.totalXp;

            // Check if level increased
            if (previousLevel !== null && userLevel.level > previousLevel) {
                const previousTier = getTierForLevel(previousLevel);
                const newTier = getTierForLevel(userLevel.level);
                const tierChanged = previousTier !== newTier;

                const notification: LevelUpNotification = {
                    previousLevel,
                    newLevel: userLevel.level,
                    tierChanged,
                    newTier: tierChanged ? newTier : undefined,
                };

                // Requirement 4.2: Trigger level-up notification
                // Requirement 6.6: Show enhanced celebration for tier changes
                addLevelUpNotification(notification);
            }
        } catch (error) {
            console.error('Failed to check for level-up:', error);
        }
    }, [userId, addLevelUpNotification]);

    /**
     * Initialize the user's current level on mount.
     */
    useEffect(() => {
        if (!isAuthenticated || !userId) {
            currentLevelRef.current = null;
            currentXpRef.current = null;
            lastCheckedAchievementCountRef.current = 0;
            return;
        }

        // Fetch initial level
        fetchUserLevel(userId)
            .then((userLevel) => {
                currentLevelRef.current = userLevel.level;
                currentXpRef.current = userLevel.totalXp;
            })
            .catch((error) => {
                console.error('Failed to fetch initial level:', error);
            });
    }, [isAuthenticated, userId]);

    /**
     * Monitor achievement notifications and check for level-ups.
     *
     * When new achievements are unlocked (notifications appear),
     * we check if the user's level has increased.
     */
    useEffect(() => {
        // Count non-dismissed notifications
        const activeNotificationCount = achievementNotifications.filter((n) => !n.dismissed).length;

        // If there are new notifications since last check, check for level-up
        if (activeNotificationCount > lastCheckedAchievementCountRef.current) {
            // Small delay to allow backend to process XP update
            const timeoutId = setTimeout(() => {
                checkForLevelUp();
            }, 500);

            lastCheckedAchievementCountRef.current = activeNotificationCount;

            return () => clearTimeout(timeoutId);
        }

        // Update the count when notifications are dismissed
        lastCheckedAchievementCountRef.current = activeNotificationCount;
    }, [achievementNotifications, checkForLevelUp]);

    return {
        checkForLevelUp,
    };
}
