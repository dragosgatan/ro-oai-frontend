import { getTranslations } from 'next-intl/server';

import { PlatformPageShell } from '@/components/platform-page-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default async function LeaderboardLoading() {
    const t = await getTranslations('common');

    return (
        <PlatformPageShell contentClassName="space-y-8" aria-busy="true" aria-live="polite">
            <span className="sr-only">{t('loading')}</span>

            <header className="platform-page-header" aria-hidden="true">
                <div className="min-w-0 flex-1">
                    <Skeleton className="h-3 w-36 rounded-none" />
                    <Skeleton className="mt-5 h-14 w-full max-w-xl rounded-none sm:h-16" />
                    <Skeleton className="mt-5 h-4 w-full max-w-2xl rounded-none" />
                </div>
                <Skeleton className="h-16 w-44 rounded-none" />
            </header>

            <div
                className="grid grid-cols-3 border-y border-[var(--platform-line-strong)] py-3"
                aria-hidden="true"
            >
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex min-h-11 items-center justify-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-none" />
                        <Skeleton className="h-4 w-20 rounded-none" />
                    </div>
                ))}
            </div>

            <section className="space-y-8" aria-hidden="true">
                <div className="grid overflow-hidden border border-[var(--platform-line-strong)] md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="min-h-52 border-b border-[var(--platform-line)] p-6 last:border-b-0 md:border-b-0 md:border-e md:last:border-e-0"
                        >
                            <Skeleton className="h-8 w-14 rounded-none" />
                            <div className="mt-6 flex items-center gap-3">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <Skeleton className="h-5 w-28 rounded-none" />
                            </div>
                            <Skeleton className="mt-8 h-9 w-32 rounded-none" />
                        </div>
                    ))}
                </div>

                <div className="overflow-hidden border border-[var(--platform-line-strong)]">
                    <div className="h-12 border-b border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)]" />
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex h-14 items-center gap-4 border-b border-[var(--platform-line)] px-4 last:border-b-0"
                        >
                            <Skeleton className="h-7 w-10 rounded-none" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 flex-1 rounded-none" />
                            <Skeleton className="h-4 w-20 rounded-none" />
                        </div>
                    ))}
                </div>
            </section>
        </PlatformPageShell>
    );
}
