'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertCircle,
    CalendarPlus,
    HistoryIcon,
    Lightbulb,
    Loader2,
    LogOutIcon,
    MessageSquare,
    PenLine,
    RefreshCw,
    SettingsIcon,
    UserIcon,
} from 'lucide-react';
import { signIn } from 'next-auth/react';
import { handleLogout } from '@/lib/auth';
import { useCurrentUser } from '@/components/providers/current-user-provider';
import { useCommentNotificationContext } from '@/components/comment-notification-provider';
import { ProfileCompletionIndicator } from '@/components/profile-completion-indicator';
import { useTranslations } from 'next-intl';
import { getProfileUrl, getProfileUrlWithTab } from '@/lib/profile-utils';
import * as Sentry from '@sentry/nextjs';
import { cn } from '@/lib/utils';
import {
    headerControlClassName,
    headerMenuItemClassName,
    headerMenuSurfaceClassName,
} from '@/components/header-styles';
import { UserAvatar } from '@/components/user-avatar';

type UserDropdownProps = {
    className?: string;
};

export function UserDropdown({ className }: UserDropdownProps) {
    const { user, status, sessionId, profileStatus, refetch } = useCurrentUser();
    const { unreadCount } = useCommentNotificationContext();
    const t = useTranslations();

    useEffect(() => {
        if (status === 'authenticated') {
            Sentry.setUser({
                id: sessionId || '',
                email: user?.email || undefined,
            });
        } else if (status === 'unauthenticated') {
            Sentry.setUser(null);
        }
    }, [sessionId, status, user?.email]);

    if (status === 'loading' || (status === 'authenticated' && profileStatus === 'loading')) {
        return (
            <button
                type="button"
                className={cn(headerControlClassName, className)}
                disabled
                aria-label={t('common.loading')}
            >
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="sr-only">{t('common.loading')}</span>
            </button>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <button
                type="button"
                className={cn(headerControlClassName, className)}
                onClick={() => signIn('keycloak')}
                aria-label={t('navigation.login')}
            >
                <UserIcon className="h-4 w-4" />
                <span className="sr-only">{t('navigation.login')}</span>
            </button>
        );
    }

    if (!user) {
        return (
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className={cn(headerControlClassName, className, 'relative bg-transparent')}
                        aria-label={t('header.userMenu')}
                    >
                        <UserIcon className="h-4 w-4" aria-hidden="true" />
                        <span
                            className="absolute end-1 top-1 h-2 w-2 bg-[oklch(0.72_0.18_32)]"
                            aria-hidden="true"
                        />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    sideOffset={10}
                    className={cn('w-72 p-2 font-sans', headerMenuSurfaceClassName)}
                >
                    <DropdownMenuLabel className="px-3 py-3 font-normal">
                        <div className="flex items-start gap-3">
                            <AlertCircle
                                className="mt-0.5 h-5 w-5 shrink-0 text-[oklch(0.72_0.18_32)]"
                                aria-hidden="true"
                            />
                            <div>
                                <p className="text-sm font-semibold leading-5">
                                    {t('settings.errorLoadingSettings')}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {t('common.error')}
                                </p>
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="mx-0 bg-[oklch(0.79_0.04_289)] dark:bg-[oklch(0.34_0.055_287)]" />
                    <DropdownMenuItem
                        onSelect={() => void refetch()}
                        className={headerMenuItemClassName}
                    >
                        <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
                        {t('common.retry')}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className={headerMenuItemClassName}>
                        <Link href="/settings" className="flex items-center">
                            <SettingsIcon className="me-2 h-4 w-4" aria-hidden="true" />
                            {t('navigation.settings')}
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="mx-0 bg-[oklch(0.79_0.04_289)] dark:bg-[oklch(0.34_0.055_287)]" />
                    <DropdownMenuItem
                        onClick={() => handleLogout()}
                        className={cn(
                            headerMenuItemClassName,
                            'text-red-700 focus:border-red-500 focus:bg-red-50 focus:text-red-800 dark:text-red-300 dark:focus:border-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-200',
                        )}
                    >
                        <LogOutIcon className="me-2 h-4 w-4" aria-hidden="true" />
                        {t('navigation.logout')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    const name = user.username || user.email || 'User';
    const username = user.username;

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(headerControlClassName, className, 'relative bg-transparent')}
                    aria-label={t('header.userMenu')}
                >
                    <UserAvatar
                        avatar={user.avatar}
                        userId={user.userId}
                        username={user.username}
                        firstName={user.firstName}
                        lastName={user.lastName}
                        email={user.email}
                        loading="eager"
                        className="h-6 w-6 rounded-sm"
                        imageClassName="rounded-sm"
                        fallbackClassName="rounded-sm text-xs"
                    />
                    <span className="sr-only">{t('header.userMenu')}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={10}
                className={cn('w-64 p-2 font-sans', headerMenuSurfaceClassName)}
            >
                <DropdownMenuLabel className="px-3 py-2 font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{name}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="mx-0 bg-[oklch(0.79_0.04_289)] dark:bg-[oklch(0.34_0.055_287)]" />
                {/* Profile completion indicator */}
                <div className="px-2 py-1.5">
                    <ProfileCompletionIndicator variant="inline" dismissible={true} />
                </div>
                <DropdownMenuItem asChild className={headerMenuItemClassName}>
                    <Link
                        href={getProfileUrl(sessionId as string, username || '')}
                        className="flex items-center"
                    >
                        <UserIcon className="me-2 h-4 w-4" />
                        {t('navigation.profile')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={headerMenuItemClassName}>
                    <Link
                        href={getProfileUrlWithTab(
                            sessionId as string,
                            username || '',
                            'submissions',
                        )}
                        className="flex items-center"
                    >
                        <HistoryIcon className="me-2 h-4 w-4" />
                        {t('navigation.myRecentSubmissions')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={headerMenuItemClassName}>
                    <Link href="/writing" className="flex items-center">
                        <PenLine className="me-2 h-4 w-4" aria-hidden="true" />
                        {t('navigation.myWriting')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={headerMenuItemClassName}>
                    <Link href="/problem-proposals" className="flex items-center">
                        <Lightbulb className="me-2 h-4 w-4" aria-hidden="true" />
                        {t('navigation.myProblemProposals')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={headerMenuItemClassName}>
                    <Link href="/my-competitions" className="flex items-center">
                        <CalendarPlus className="me-2 h-4 w-4" aria-hidden="true" />
                        {t('navigation.myCompetitions')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={headerMenuItemClassName}>
                    <Link href="/my-questions" className="flex items-center justify-between w-full">
                        <span className="flex items-center">
                            <MessageSquare className="me-2 h-4 w-4" />
                            {t('navigation.myQuestions')}
                        </span>
                        {unreadCount > 0 && (
                            <Badge
                                variant="secondary"
                                className="ms-2 flex h-5 min-w-5 items-center justify-center rounded-sm bg-[oklch(0.89_0.185_116)] text-[oklch(0.2_0.045_282)]"
                            >
                                {unreadCount}
                            </Badge>
                        )}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={headerMenuItemClassName}>
                    <Link href="/settings" className="flex items-center">
                        <SettingsIcon className="me-2 h-4 w-4" />
                        {t('navigation.settings')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="mx-0 bg-[oklch(0.79_0.04_289)] dark:bg-[oklch(0.34_0.055_287)]" />
                <DropdownMenuItem
                    onClick={() => handleLogout()}
                    className={cn(
                        headerMenuItemClassName,
                        'text-red-700 focus:border-red-500 focus:bg-red-50 focus:text-red-800 dark:text-red-300 dark:focus:border-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-200',
                    )}
                >
                    <LogOutIcon className="me-2 h-4 w-4" />
                    {t('navigation.logout')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
