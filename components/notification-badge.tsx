'use client';

import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAppNotifications } from '@/components/notifications-provider';
import { NotificationList } from './notification-list';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { headerControlClassName, headerMenuSurfaceClassName } from '@/components/header-styles';

/**
 * Notification badge component for the header.
 *
 * Features:
 * - Displays unread notification count
 * - Opens popover with notification list
 * - Auto-refreshes every 30 seconds
 * - Only visible for authenticated users
 *
 * Requirements: 15.4, 15.5
 */
type NotificationBadgeProps = {
    className?: string;
};

export function NotificationBadge({ className }: NotificationBadgeProps) {
    const { data: session } = useSession();
    const t = useTranslations('notifications');
    const { unreadCount, notifications, markAsRead, markAllAsRead, isLoading, error, refresh } =
        useAppNotifications();

    // Don't render if user is not authenticated
    if (!session) {
        return null;
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(headerControlClassName, className, 'relative overflow-visible')}
                    aria-label={`${t('title')}${unreadCount > 0 ? `, ${t('unreadCount', { count: unreadCount })}` : ''}`}
                >
                    <Bell className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-sm border border-[oklch(0.36_0.22_291)] bg-[oklch(0.72_0.18_32)] px-1 text-[0.625rem] font-bold tabular-nums text-[oklch(0.2_0.045_282)] shadow-none dark:border-[oklch(0.77_0.17_292)] dark:bg-[oklch(0.74_0.17_32)]">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent
                className={cn(
                    'w-[min(calc(100vw-1.5rem),24rem)] p-0 font-sans',
                    headerMenuSurfaceClassName,
                )}
                align="end"
                sideOffset={10}
            >
                <NotificationList
                    notifications={notifications}
                    isLoading={isLoading}
                    error={error}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onRetry={refresh}
                />
            </PopoverContent>
        </Popover>
    );
}
