'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useSession } from 'next-auth/react';

import { useAchievementNotifications } from '@/components/achievements/achievement-notification-provider';
import type { LevelUpNotification as LevelUpNotificationType } from '@/lib/level/types';

import {
    LevelNotificationContainer,
    type LevelNotificationItem,
} from './level-notification-container';

// Re-export the type for consumers
export type { LevelNotificationItem };

interface LevelNotificationContextValue {
    /** Current notification queue */
    notifications: LevelNotificationItem[];
    /** Add a level-up notification to the queue */
    addLevelUpNotification: (notification: LevelUpNotificationType) => void;
    /** Dismiss a notification by ID */
    dismissNotification: (id: string) => void;
    /** Clear all notifications */
    clearAllNotifications: () => void;
}

const LevelNotificationContext = createContext<LevelNotificationContextValue | null>(null);

/**
 * Hook to access level notification context.
 * Must be used within LevelNotificationProvider.
 */
export function useLevelNotifications(): LevelNotificationContextValue {
    const context = useContext(LevelNotificationContext);

    if (!context) {
        throw new Error('useLevelNotifications must be used within LevelNotificationProvider');
    }

    return context;
}

interface LevelNotificationProviderProps {
    children: React.ReactNode;
    /** Auto-dismiss duration in milliseconds (default: 6000) */
    autoDismissDuration?: number;
    /** Maximum number of visible notifications (default: 1) */
    maxVisible?: number;
}

/**
 * Global provider for level-up notifications.
 *
 * Features:
 * - Manages notification queue with FIFO ordering
 * - Supports multiple level-ups in sequence
 * - Auto-dismiss with configurable timing
 * - Limits notification queue to prevent memory issues
 *
 * Requirements: 4.2, 4.3
 *
 * Usage:
 * Wrap your application root with this provider to enable level-up notifications.
 * Then use the useLevelNotifications hook to trigger notifications when achievements
 * are unlocked and level-ups occur.
 */
export function LevelNotificationProvider({
    children,
    autoDismissDuration = 6000,
    maxVisible = 1,
}: LevelNotificationProviderProps) {
    const { data: session } = useSession();
    const userId = (session as { id?: string } | null)?.id;
    const { notifications: achievementNotifications } = useAchievementNotifications();

    // Notification queue state - maintains order (FIFO)
    const [notifications, setNotifications] = useState<LevelNotificationItem[]>([]);

    // Track notification IDs to prevent duplicates
    const notificationIdCounter = useRef(0);

    useEffect(() => {
        notificationIdCounter.current = 0;
        setNotifications([]);
    }, [userId]);

    /**
     * Add a level-up notification to the queue.
     * Maintains FIFO order - new notifications are added at the end.
     *
     * Requirement 4.3: Queue notifications and display them sequentially
     */
    const addLevelUpNotification = useCallback((notification: LevelUpNotificationType) => {
        const id = `level-up-${++notificationIdCounter.current}-${Date.now()}`;

        const notificationItem: LevelNotificationItem = {
            id,
            notification,
            addedAt: new Date(),
            dismissed: false,
        };

        setNotifications((prev) => {
            // Add to end of queue (FIFO order)
            const updated = [...prev, notificationItem];
            // Limit queue size to prevent memory issues
            return updated.slice(-10);
        });
    }, []);

    /**
     * Dismiss a notification by ID.
     *
     * Requirement 4.2: Level-up notification with dismiss functionality
     */
    const dismissNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, dismissed: true } : n)));
    }, []);

    /**
     * Clear all notifications.
     */
    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const hasActiveAchievement = achievementNotifications.some(
        (notification) => !notification.dismissed,
    );

    const contextValue = useMemo<LevelNotificationContextValue>(
        () => ({
            notifications,
            addLevelUpNotification,
            dismissNotification,
            clearAllNotifications,
        }),
        [addLevelUpNotification, clearAllNotifications, dismissNotification, notifications],
    );

    return (
        <LevelNotificationContext.Provider value={contextValue}>
            {children}

            {/* Render notification toasts */}
            <LevelNotificationContainer
                notifications={hasActiveAchievement ? [] : notifications}
                onDismiss={dismissNotification}
                maxVisible={maxVisible}
                autoDismissDuration={autoDismissDuration}
            />
        </LevelNotificationContext.Provider>
    );
}
