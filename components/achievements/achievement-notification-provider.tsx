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
import { fetchUnnotifiedAchievements, markAchievementsNotified } from '@/lib/api';
import type { UserAchievement } from '@/lib/types';
import { AchievementNotificationContainer } from './achievement-notification-container';

/**
 * Achievement notification item in the queue
 */
export interface AchievementNotificationItem {
    /** Unique notification ID */
    id: string;
    /** The user achievement data */
    userAchievement: UserAchievement;
    /** Timestamp when notification was added to queue */
    addedAt: Date;
    /** Whether this notification has been dismissed */
    dismissed: boolean;
}

interface AchievementNotificationContextValue {
    /** Current notification queue */
    notifications: AchievementNotificationItem[];
    /** Add a notification to the queue */
    pollForAchievements: () => void;
    /** Dismiss a notification by ID */
    dismissNotification: (id: string) => void;
    /** Clear all notifications */
    clearAllNotifications: () => void;
    /** Whether polling is active */
    isPolling: boolean;
    /** Last poll error if any */
    error: Error | null;
}

const AchievementNotificationContext = createContext<AchievementNotificationContextValue | null>(
    null,
);

/**
 * Hook to access achievement notification context.
 * Must be used within AchievementNotificationProvider.
 */
export function useAchievementNotifications(): AchievementNotificationContextValue {
    const context = useContext(AchievementNotificationContext);

    if (!context) {
        throw new Error(
            'useAchievementNotifications must be used within AchievementNotificationProvider',
        );
    }

    return context;
}

interface AchievementNotificationProviderProps {
    children: React.ReactNode;
}

/**
 * Global provider for achievement notifications.
 *
 * Features:
 * - Polls for unnotified achievements periodically
 * - Manages notification queue with FIFO ordering
 * - Automatically marks achievements as notified when dismissed
 * - Limits notification queue to prevent memory issues
 * - Only polls when user is authenticated
 *
 * Requirements: 3.1, 3.3
 *
 * Usage:
 * Wrap your application root with this provider to enable achievement notifications.
 */
export function AchievementNotificationProvider({
    children,
}: AchievementNotificationProviderProps) {
    const { data: session, status } = useSession();
    // Session ID is stored directly on session object (from JWT callback)
    const userId = (session as any)?.id as string | undefined;
    const isAuthenticated = status === 'authenticated' && !!userId;

    // Notification queue state - maintains order (FIFO)
    const [notifications, setNotifications] = useState<AchievementNotificationItem[]>([]);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Track seen achievement IDs to prevent duplicates
    const seenAchievementIds = useRef<Set<number>>(new Set());
    const acknowledgedAchievementIds = useRef<Set<number>>(new Set());
    const notificationsRef = useRef<AchievementNotificationItem[]>([]);
    const pollRequestIdRef = useRef(0);

    useEffect(() => {
        notificationsRef.current = notifications;
    }, [notifications]);

    /**
     * Add a notification to the queue.
     * Maintains FIFO order - new notifications are added at the end.
     *
     * Requirement 3.3: Queue notifications and display them sequentially
     */
    const addNotification = useCallback((userAchievement: UserAchievement) => {
        const achievementId = userAchievement.achievement.id;

        // Skip if already seen
        if (seenAchievementIds.current.has(achievementId)) {
            return;
        }

        seenAchievementIds.current.add(achievementId);

        const notification: AchievementNotificationItem = {
            id: `achievement-${achievementId}-${Date.now()}`,
            userAchievement,
            addedAt: new Date(),
            dismissed: false,
        };

        setNotifications((prev) => {
            // Add to end of queue (FIFO order)
            const updated = [...prev, notification];
            // Limit queue size to prevent memory issues
            return updated.slice(-20);
        });
    }, []);

    /**
     * Dismiss a notification and mark it as notified on the server.
     *
     * Requirement 3.4: When a user dismisses a notification, mark as viewed
     */
    const dismissNotification = useCallback(
        async (id: string) => {
            const notification = notificationsRef.current.find((item) => item.id === id);

            setNotifications((prev) =>
                prev.map((item) => (item.id === id ? { ...item, dismissed: true } : item)),
            );

            if (!notification || !userId || notification.dismissed) return;

            const achievementId = notification.userAchievement.achievement.id;
            if (acknowledgedAchievementIds.current.has(achievementId)) return;

            acknowledgedAchievementIds.current.add(achievementId);

            try {
                await markAchievementsNotified(userId, [achievementId]);
            } catch (err) {
                console.error('Failed to mark achievement as notified:', err);
            }
        },
        [userId],
    );

    /**
     * Clear all notifications.
     */
    const clearAllNotifications = useCallback(() => {
        // Mark all as notified on server
        if (userId) {
            const achievementIds = notificationsRef.current
                .filter((n) => !n.dismissed)
                .map((n) => n.userAchievement.achievement.id);

            if (achievementIds.length > 0) {
                achievementIds.forEach((achievementId) =>
                    acknowledgedAchievementIds.current.add(achievementId),
                );
                markAchievementsNotified(userId, achievementIds).catch((err) =>
                    console.error('Failed to mark achievements as notified:', err),
                );
            }
        }

        setNotifications([]);
    }, [userId]);

    /**
     * Poll for unnotified achievements.
     *
     * Requirement 3.1: Display notification within 2 seconds of achievement unlock
     * (We poll periodically to detect new achievements)
     */
    const pollForAchievements = useCallback(async () => {
        if (!userId) return;

        const requestId = ++pollRequestIdRef.current;
        setIsPolling(true);
        setError(null);

        try {
            const unnotified = await fetchUnnotifiedAchievements(userId);

            if (requestId !== pollRequestIdRef.current) return;

            // Add each unnotified achievement to the queue
            for (const userAchievement of unnotified) {
                addNotification(userAchievement);
            }
        } catch (err) {
            if (requestId !== pollRequestIdRef.current) return;

            setError(err instanceof Error ? err : new Error('Failed to fetch achievements'));
            console.error('Achievement polling error:', err);
        } finally {
            if (requestId === pollRequestIdRef.current) {
                setIsPolling(false);
            }
        }
    }, [userId, addNotification]);

    /**
     * Reset notification state when the authenticated user changes.
     */
    useEffect(() => {
        pollRequestIdRef.current += 1;
        seenAchievementIds.current.clear();
        acknowledgedAchievementIds.current.clear();
        notificationsRef.current = [];
        setNotifications([]);
        setIsPolling(false);
        setError(null);
    }, [userId]);

    /** Fetch the initial queue after user-specific state has been reset. */
    useEffect(() => {
        if (isAuthenticated) {
            void pollForAchievements();
        }
    }, [isAuthenticated, pollForAchievements]);

    const contextValue = useMemo<AchievementNotificationContextValue>(
        () => ({
            notifications,
            pollForAchievements,
            dismissNotification,
            clearAllNotifications,
            isPolling,
            error,
        }),
        [
            clearAllNotifications,
            dismissNotification,
            error,
            isPolling,
            notifications,
            pollForAchievements,
        ],
    );

    return (
        <AchievementNotificationContext.Provider value={contextValue}>
            {children}

            {/* Render notification toasts */}
            <AchievementNotificationContainer
                notifications={notifications}
                onDismiss={dismissNotification}
                maxVisible={1}
            />
        </AchievementNotificationContext.Provider>
    );
}
