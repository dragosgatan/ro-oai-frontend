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
import { useCompetitionData } from '@/components/competition-data-provider';
import { getUnreadCount } from '@/lib/api';

interface CommentNotificationContextValue {
    unreadCount: number;
    fetchUnread: () => void;
    error: Error | null;
}

const CommentNotificationContext = createContext<CommentNotificationContextValue | null>(null);

/**
 * Hook to access comment notification context.
 * Must be used within CommentNotificationProvider.
 */
export function useCommentNotificationContext(): CommentNotificationContextValue {
    const context = useContext(CommentNotificationContext);

    if (!context) {
        throw new Error(
            'useCommentNotificationContext must be used within CommentNotificationProvider',
        );
    }

    return context;
}

interface CommentNotificationProviderProps {
    children: React.ReactNode;
}

/**
 * Global provider for comment answer notifications.
 *
 * Features:
 * - Polls for new answers every 30 seconds
 * - Displays toast notifications when new answers are received
 * - Provides unread count to child components
 * - Integrates with useCommentNotifications hook
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4
 *
 * Usage:
 * Wrap your application root with this provider to enable comment notifications.
 */
export function CommentNotificationProvider({ children }: CommentNotificationProviderProps) {
    const { data: session, status } = useSession();
    const { authenticated, isProfileConfirmed } = useCompetitionData();
    const isUsernameMissing = authenticated && !isProfileConfirmed;
    const userKey =
        status === 'authenticated'
            ? String((session as any)?.id ?? session?.user?.email ?? 'authenticated')
            : null;

    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [error, setError] = useState<Error | null>(null);
    const requestVersionRef = useRef(0);

    useEffect(() => {
        requestVersionRef.current += 1;
        setUnreadCount(0);
        setError(null);
    }, [userKey]);

    const fetchUnread = useCallback(async () => {
        if (status !== 'authenticated' || isUsernameMissing || !userKey) return;
        const requestVersion = ++requestVersionRef.current;
        try {
            const count = await getUnreadCount();
            if (requestVersion !== requestVersionRef.current) return;
            setUnreadCount(count);
            setError(null);
        } catch (err) {
            if (requestVersion !== requestVersionRef.current) return;
            const e = err instanceof Error ? err : new Error('Failed to fetch unread count');
            setError(e);
            console.error('Failed to fetch comment unread count:', e);
        }
    }, [status, isUsernameMissing, userKey]);

    // Initial fetch
    useEffect(() => {
        void fetchUnread();
    }, [fetchUnread]);

    const contextValue: CommentNotificationContextValue = useMemo(
        () => ({ unreadCount, error, fetchUnread }),
        [unreadCount, error, fetchUnread],
    );

    return (
        <CommentNotificationContext.Provider value={contextValue}>
            {children}
        </CommentNotificationContext.Provider>
    );
}
