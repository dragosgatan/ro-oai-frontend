'use client';

import { useState, useEffect } from 'react';
import { getUnreadCount } from '@/lib/api';

/**
 * Hook to fetch and poll for unread question count.
 * Polls every 30 seconds to check for new answers.
 */
export function useUnreadQuestions() {
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const fetchUnreadCount = async () => {
        try {
            const count = await getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
            // Don't show error to user, just log it
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchUnreadCount();

        // Poll every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        return () => clearInterval(interval);
    }, []);

    return { unreadCount, loading, refresh: fetchUnreadCount };
}
