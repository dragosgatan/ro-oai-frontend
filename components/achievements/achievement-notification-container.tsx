'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import { AchievementNotificationToast } from './achievement-notification-toast';
import type { AchievementNotificationItem } from './achievement-notification-provider';

export interface AchievementNotificationContainerProps {
    /** List of notifications to display */
    notifications: AchievementNotificationItem[];
    /** Callback when a notification is dismissed */
    onDismiss: (id: string) => void;
    /** Maximum number of visible notifications (default: 1) */
    maxVisible?: number;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Container component for achievement notification toasts.
 *
 * Features:
 * Displays a compact FIFO queue in the viewport's logical bottom corner.
 *
 * Requirements: 3.3 - Queue notifications and display them sequentially
 */
export function AchievementNotificationContainer({
    notifications,
    onDismiss,
    maxVisible = 1,
    className,
}: AchievementNotificationContainerProps) {
    const t = useTranslations('achievements');

    const visibleNotifications = notifications.filter((n) => !n.dismissed).slice(0, maxVisible);

    if (visibleNotifications.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                'pointer-events-none fixed inset-x-3 z-[60] flex flex-col gap-3',
                'bottom-[max(1rem,env(safe-area-inset-bottom))]',
                'sm:inset-x-auto sm:end-4 sm:w-[min(28rem,calc(100vw-2rem))]',
                className,
            )}
            role="region"
            aria-label={t('notification.title')}
        >
            {visibleNotifications.map((notification, index) => (
                <div
                    key={notification.id}
                    className="pointer-events-auto"
                    style={{
                        zIndex: 50 + (visibleNotifications.length - index),
                    }}
                >
                    <AchievementNotificationToast
                        id={notification.id}
                        userAchievement={notification.userAchievement}
                        onDismiss={onDismiss}
                        zIndex={50 + (visibleNotifications.length - index)}
                    />
                </div>
            ))}
        </div>
    );
}
