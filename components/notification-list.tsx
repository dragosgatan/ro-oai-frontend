'use client';

import { AlertCircle, Bell, Check, CheckCheck, RotateCcw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from '@/i18n/routing';
import type { Notification } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NotificationListProps {
    notifications: Notification[];
    isLoading: boolean;
    error: Error | null;
    onMarkAsRead: (notificationId: number) => Promise<void>;
    onMarkAllAsRead: () => Promise<void>;
    onRetry: () => Promise<void>;
}

const RELATIVE_TIME_UNITS: Array<{
    unit: Intl.RelativeTimeFormatUnit;
    seconds: number;
}> = [
    { unit: 'year', seconds: 31_536_000 },
    { unit: 'month', seconds: 2_592_000 },
    { unit: 'week', seconds: 604_800 },
    { unit: 'day', seconds: 86_400 },
    { unit: 'hour', seconds: 3_600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
];

function formatRelativeTime(value: string, locale: string): string {
    const elapsedSeconds = (new Date(value).getTime() - Date.now()) / 1_000;
    const selectedUnit =
        RELATIVE_TIME_UNITS.find(({ seconds }) => Math.abs(elapsedSeconds) >= seconds) ??
        RELATIVE_TIME_UNITS[RELATIVE_TIME_UNITS.length - 1];

    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
        Math.round(elapsedSeconds / selectedUnit.seconds),
        selectedUnit.unit,
    );
}

export function NotificationList({
    notifications,
    isLoading,
    error,
    onMarkAsRead,
    onMarkAllAsRead,
    onRetry,
}: NotificationListProps) {
    const t = useTranslations('notifications');
    const tCommon = useTranslations('common');
    const hasUnread = notifications.some((notification) => !notification.isRead);

    return (
        <section aria-labelledby="header-notifications-title" className="flex flex-col">
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-[oklch(0.79_0.04_289)] px-4 py-3 dark:border-[oklch(0.34_0.055_287)]">
                <div className="min-w-0">
                    <h2
                        id="header-notifications-title"
                        className="text-sm font-bold tracking-[-0.015em]"
                    >
                        {t('title')}
                    </h2>
                    {hasUnread ? (
                        <p className="mt-0.5 text-xs text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                            {t('unreadCount', {
                                count: notifications.filter((notification) => !notification.isRead)
                                    .length,
                            })}
                        </p>
                    ) : null}
                </div>
                {hasUnread ? (
                    <button
                        type="button"
                        onClick={() => void onMarkAllAsRead()}
                        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm border border-[oklch(0.62_0.06_287)] px-3 text-xs font-semibold text-[oklch(0.36_0.22_291)] transition-colors duration-150 hover:border-[oklch(0.43_0.235_291)] hover:bg-[oklch(0.952_0.026_292)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.72_0.18_32)] dark:border-[oklch(0.5_0.07_287)] dark:text-[oklch(0.77_0.17_292)] dark:hover:border-[oklch(0.72_0.19_292)] dark:hover:bg-[oklch(0.215_0.046_286)]"
                    >
                        <CheckCheck className="h-4 w-4" aria-hidden="true" />
                        <span>{t('markAllRead')}</span>
                    </button>
                ) : null}
            </div>

            <ScrollArea className="h-[min(25rem,calc(100vh-10rem))]">
                {isLoading && notifications.length === 0 ? (
                    <NotificationSkeleton label={t('loading')} />
                ) : error && notifications.length === 0 ? (
                    <div
                        className="flex min-h-44 flex-col items-center justify-center px-6 py-8 text-center"
                        role="alert"
                    >
                        <span className="grid h-11 w-11 place-items-center border border-red-700/40 bg-red-500/10 text-red-700 dark:text-red-300">
                            <AlertCircle className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <p className="mt-3 text-sm font-semibold">{t('error')}</p>
                        <button
                            type="button"
                            onClick={() => void onRetry()}
                            className="mt-4 inline-flex min-h-11 items-center gap-2 border border-[oklch(0.62_0.06_287)] px-4 text-sm font-bold text-[oklch(0.36_0.22_291)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.72_0.18_32)] dark:border-[oklch(0.5_0.07_287)] dark:text-[oklch(0.77_0.17_292)]"
                        >
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            {tCommon('retry')}
                        </button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex min-h-44 flex-col items-center justify-center px-6 py-8 text-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-sm border border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] text-[oklch(0.46_0.044_282)] dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)] dark:text-[oklch(0.73_0.034_290)]">
                            <Bell className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <p className="mt-3 text-sm font-semibold">{t('noNotifications')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[oklch(0.79_0.04_289)] dark:divide-[oklch(0.34_0.055_287)]">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={onMarkAsRead}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </section>
    );
}

function NotificationSkeleton({ label }: { label: string }) {
    return (
        <div
            aria-busy="true"
            aria-label={label}
            className="divide-y divide-[oklch(0.79_0.04_289)] dark:divide-[oklch(0.34_0.055_287)]"
        >
            {[0, 1, 2].map((item) => (
                <div key={item} className="animate-pulse px-4 py-4">
                    <div className="h-3 w-2/5 rounded-sm bg-[oklch(0.88_0.03_292)] dark:bg-[oklch(0.3_0.045_286)]" />
                    <div className="mt-3 h-2.5 w-full rounded-sm bg-[oklch(0.88_0.03_292)] dark:bg-[oklch(0.3_0.045_286)]" />
                    <div className="mt-2 h-2.5 w-3/5 rounded-sm bg-[oklch(0.88_0.03_292)] dark:bg-[oklch(0.3_0.045_286)]" />
                </div>
            ))}
        </div>
    );
}

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (notificationId: number) => Promise<void>;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('notifications');

    const handleOpen = () => {
        if (!notification.isRead) {
            void onMarkAsRead(notification.id);
        }

        const { relatedEntityType, relatedEntityId } = notification;

        if (relatedEntityType === 'PROBLEM' && relatedEntityId) {
            router.push(`/problems/${relatedEntityId}`);
        } else if (relatedEntityType === 'COMPETITION' && relatedEntityId) {
            router.push(`/competitions/${relatedEntityId}`);
        } else if (relatedEntityType === 'INSTITUTION' && relatedEntityId) {
            router.push(`/institutions/${relatedEntityId}`);
        } else if (relatedEntityType === 'ACHIEVEMENT') {
            router.push('/achievements');
        }
    };

    return (
        <article
            className={cn(
                'flex items-start gap-1 px-2 py-2 transition-colors duration-150',
                !notification.isRead &&
                    'bg-[oklch(0.952_0.026_292)] dark:bg-[oklch(0.215_0.046_286)]',
            )}
        >
            <button
                type="button"
                onClick={handleOpen}
                className="min-w-0 flex-1 rounded-sm px-2 py-2 text-start transition-colors duration-150 hover:bg-[oklch(0.978_0.014_292)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-0 focus-visible:outline-[oklch(0.72_0.18_32)] dark:hover:bg-[oklch(0.18_0.038_286)]"
            >
                <span className="flex items-start gap-2">
                    {!notification.isRead ? (
                        <span
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-sm bg-[oklch(0.72_0.18_32)]"
                            aria-hidden="true"
                        />
                    ) : null}
                    <span className={cn('min-w-0', notification.isRead && 'ps-4')}>
                        <span className="block text-sm font-semibold leading-5" dir="auto">
                            {notification.title}
                        </span>
                        <span
                            className="mt-1 block text-xs leading-5 text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]"
                            dir="auto"
                        >
                            {notification.message}
                        </span>
                        <time
                            dateTime={notification.createdAt}
                            className="mt-1.5 block text-[0.6875rem] font-medium text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]"
                        >
                            {formatRelativeTime(notification.createdAt, locale)}
                        </time>
                    </span>
                </span>
            </button>
            {!notification.isRead ? (
                <button
                    type="button"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-[oklch(0.46_0.044_282)] transition-colors duration-150 hover:bg-[oklch(0.978_0.014_292)] hover:text-[oklch(0.36_0.22_291)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-0 focus-visible:outline-[oklch(0.72_0.18_32)] dark:text-[oklch(0.73_0.034_290)] dark:hover:bg-[oklch(0.18_0.038_286)] dark:hover:text-[oklch(0.77_0.17_292)]"
                    onClick={() => void onMarkAsRead(notification.id)}
                    aria-label={t('markAsRead')}
                >
                    <Check className="h-4 w-4" aria-hidden="true" />
                </button>
            ) : null}
        </article>
    );
}
