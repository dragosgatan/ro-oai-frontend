'use client';

import { useLevelUpIntegration } from '@/hooks/use-level-up-integration';

/**
 * Component that integrates level-up notifications with the achievement system.
 *
 * This component should be rendered inside both the AchievementNotificationProvider
 * and LevelNotificationProvider. It monitors achievement unlocks and triggers
 * level-up notifications when the user's level increases.
 *
 * Requirements: 4.1, 4.2, 6.6
 *
 * Usage:
 * Place this component in the app layout, inside the notification providers:
 *
 * ```tsx
 * <AchievementNotificationProvider>
 *   <LevelNotificationProvider>
 *     <LevelUpIntegration />
 *     {children}
 *   </LevelNotificationProvider>
 * </AchievementNotificationProvider>
 * ```
 */
export function LevelUpIntegration() {
    // This hook handles all the level-up integration logic
    useLevelUpIntegration();

    // This component doesn't render anything visible
    return null;
}
