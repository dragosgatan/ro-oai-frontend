'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

import { LevelUpNotification } from './level-up-notification';
import type { LevelUpNotification as LevelUpNotificationType } from '@/lib/level/types';

/**
 * Level-up notification item in the queue.
 * Duplicated here to avoid circular dependency with provider.
 */
export interface LevelNotificationItem {
    /** Unique notification ID */
    id: string;
    /** The level-up notification data */
    notification: LevelUpNotificationType;
    /** Timestamp when notification was added to queue */
    addedAt: Date;
    /** Whether this notification has been dismissed */
    dismissed: boolean;
}

export interface LevelNotificationContainerProps {
    /** List of notifications to display */
    notifications: LevelNotificationItem[];
    /** Callback when a notification is dismissed */
    onDismiss: (id: string) => void;
    /** Maximum number of visible notifications (default: 1) */
    maxVisible?: number;
    /** Auto-dismiss duration in milliseconds (default: 6000) */
    autoDismissDuration?: number;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Container component for level-up notification toasts.
 *
 * Features:
 * Displays level-up announcements sequentially in the logical bottom corner.
 *
 * Requirements: 4.2, 4.3 - Queue notifications and display them sequentially
 */
export function LevelNotificationContainer({
    notifications,
    onDismiss,
    maxVisible = 1,
    autoDismissDuration = 6000,
    className,
}: LevelNotificationContainerProps) {
    const t = useTranslations('level');
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
            {visibleNotifications.map((notificationItem, index) => (
                <div
                    key={notificationItem.id}
                    className="pointer-events-auto"
                    style={{
                        zIndex: 60 + (visibleNotifications.length - index),
                    }}
                >
                    <LevelUpNotification
                        notification={notificationItem.notification}
                        onDismiss={() => onDismiss(notificationItem.id)}
                        autoDismissDuration={autoDismissDuration}
                    />
                </div>
            ))}
        </div>
    );
}
