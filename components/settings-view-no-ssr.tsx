'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

import { PlatformPageShell } from '@/components/platform-page-shell';
import { Skeleton } from '@/components/ui/skeleton';

function SettingsModuleLoading() {
    const tCommon = useTranslations('common');

    return (
        <PlatformPageShell contentClassName="space-y-8 md:space-y-10" aria-busy="true">
            <span className="sr-only" role="status">
                {tCommon('loadingSettings')}
            </span>
            <div className="border-b border-[var(--platform-line-strong)] pb-8 md:pb-12">
                <Skeleton className="h-4 w-28 rounded-none bg-[var(--platform-paper-strong)]" />
                <Skeleton className="mt-5 h-12 w-64 max-w-full rounded-none bg-[var(--platform-paper-strong)] sm:h-16" />
                <Skeleton className="mt-5 h-5 w-full max-w-xl rounded-none bg-[var(--platform-paper-strong)]" />
            </div>
            <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
                <Skeleton className="h-40 rounded-none bg-[var(--platform-paper-strong)]" />
                <Skeleton className="h-[32rem] rounded-none bg-[var(--platform-paper-strong)]" />
            </div>
        </PlatformPageShell>
    );
}

const SettingsView = dynamic(
    () => import('@/components/settings-view').then((mod) => mod.SettingsView),
    { ssr: false, loading: SettingsModuleLoading },
);

export function SettingsViewNoSsr() {
    return <SettingsView />;
}
