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
import { useTranslations } from 'next-intl';
import { useCompetitionData } from '@/components/competition-data-provider';
import { toast } from 'sonner';
import type { Notification } from '@/lib/types';
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '@/lib/api';
import type { IMessage } from '@stomp/stompjs';
import { setNotificationsCallback } from '@/lib/realtime/stomp-client';
import { useAchievementNotifications } from '@/components/achievements';
import { useCommentNotificationContext } from '@/components/comment-notification-provider';

interface NotificationsContextValue {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: Error | null;
    markAsRead: (notificationId: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function useAppNotifications(): NotificationsContextValue {
    const ctx = useContext(NotificationsContext);
    if (!ctx) {
        throw new Error('useAppNotifications must be used within NotificationsProvider');
    }
    return ctx;
}

interface NotificationsProviderProps {
    children: React.ReactNode;
}

/**
 * Global notifications provider based on previous useNotifications hook logic.
 * Keeps a single source of truth for notifications/unread count across the app.
 */
export function NotificationsProvider({ children }: NotificationsProviderProps) {
    const { data: session, status } = useSession();
    const t = useTranslations('notifications');
    const { authenticated, isProfileConfirmed } = useCompetitionData();
    const isUsernameMissing = authenticated && !isProfileConfirmed;
    const userKey =
        status === 'authenticated'
            ? String((session as any)?.id ?? session?.user?.email ?? 'authenticated')
            : null;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const requestVersionRef = useRef(0);
    const activeUserRef = useRef<string | null>(userKey);
    const notificationIdsRef = useRef<Set<number>>(new Set());

    const { pollForAchievements } = useAchievementNotifications();
    const { fetchUnread } = useCommentNotificationContext();

    useEffect(() => {
        activeUserRef.current = userKey;
        requestVersionRef.current += 1;
        notificationIdsRef.current.clear();
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        setError(null);
    }, [userKey]);

    const fetchNotifications = useCallback(async () => {
        if (status !== 'authenticated' || isUsernameMissing || !userKey) return;
        const requestVersion = ++requestVersionRef.current;
        try {
            setIsLoading(true);
            setError(null);
            const data = await getNotifications();
            if (requestVersion !== requestVersionRef.current) return;
            notificationIdsRef.current = new Set(data.map((notification) => notification.id));
            setNotifications(data);
            setUnreadCount(data.filter((n) => !n.isRead).length);
        } catch (err) {
            if (requestVersion !== requestVersionRef.current) return;
            console.error('Error fetching notifications:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
        } finally {
            if (requestVersion === requestVersionRef.current) setIsLoading(false);
        }
    }, [status, isUsernameMissing, userKey]);

    const markAsRead = useCallback(
        async (notificationId: number) => {
            const actionUser = userKey;
            try {
                await markNotificationAsRead(notificationId);
                if (activeUserRef.current !== actionUser) return;
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === notificationId
                            ? { ...n, isRead: true, readAt: new Date().toISOString() }
                            : n,
                    ),
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            } catch (err) {
                if (activeUserRef.current !== actionUser) return;
                console.error('Error marking notification as read:', err);
                toast.error(t('error'));
            }
        },
        [t, userKey],
    );

    const markAllAsRead = useCallback(async () => {
        const actionUser = userKey;
        try {
            await markAllNotificationsAsRead();
            if (activeUserRef.current !== actionUser) return;
            const now = new Date().toISOString();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: now })));
            setUnreadCount(0);
            toast.success(t('markAllRead'));
        } catch (err) {
            if (activeUserRef.current !== actionUser) return;
            console.error('Error marking all notifications as read:', err);
            toast.error(t('error'));
        }
    }, [t, userKey]);

    // Initial fetch
    useEffect(() => {
        void fetchNotifications();
    }, [fetchNotifications]);

    // WebSocket subscription for new notifications (shared STOMP client)
    useEffect(() => {
        if (status !== 'authenticated' || isUsernameMissing) return;
        const token = (session as any)?.accessToken as string | undefined;
        if (!token) return;

        return setNotificationsCallback((message: IMessage) => {
            try {
                const body = JSON.parse(message.body);
                const incoming: Notification = body.payload;
                if (incoming && body.type === 'NOTIFICATION_NEW') {
                    if (notificationIdsRef.current.has(incoming.id)) return;
                    notificationIdsRef.current.add(incoming.id);
                    setNotifications((prev) => [incoming, ...prev]);
                    setUnreadCount((c) => c + 1);
                    if (incoming.type === 'NEW_ACHIEVEMENT') {
                        pollForAchievements();
                    } else if (incoming.type === 'NEW_MODERATION') {
                        fetchUnread();
                        toast.info(incoming.title, {
                            description: incoming.message,
                            duration: 5000,
                        });
                    } else {
                        toast.info(incoming.title, {
                            description: incoming.message,
                            duration: 5000,
                        });
                    }
                }
            } catch (e) {
                console.error('Error handling WS notification message', e);
            }
        }, token);
    }, [status, isUsernameMissing, session, pollForAchievements, fetchUnread]);

    const value = useMemo<NotificationsContextValue>(
        () => ({
            notifications,
            unreadCount,
            isLoading,
            error,
            markAsRead,
            markAllAsRead,
            refresh: fetchNotifications,
        }),
        [
            notifications,
            unreadCount,
            isLoading,
            error,
            markAsRead,
            markAllAsRead,
            fetchNotifications,
        ],
    );

    return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
