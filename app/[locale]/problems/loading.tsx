import { getTranslations } from 'next-intl/server';

import { PlatformPageShell } from '@/components/platform-page-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default async function ProblemsLoading() {
    const t = await getTranslations('common');

    return (
        <PlatformPageShell aria-busy="true" aria-live="polite">
            <span className="sr-only">{t('loading')}</span>

            <header className="platform-page-header" aria-hidden="true">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-3 w-3 rounded-none bg-[var(--platform-citron)]" />
                        <Skeleton className="h-3 w-36 rounded-sm" />
                    </div>
                    <Skeleton className="mt-5 h-12 w-full max-w-xl rounded-sm sm:h-16" />
                    <div className="mt-6 space-y-3">
                        <Skeleton className="h-4 w-full max-w-2xl rounded-sm" />
                        <Skeleton className="h-4 w-4/5 max-w-xl rounded-sm" />
                    </div>
                </div>
                <Skeleton className="h-12 w-40 rounded-none border border-[var(--platform-line-strong)]" />
            </header>

            <section className="mt-8" aria-hidden="true">
                <div className="platform-toolbar grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-4">
                    <Skeleton className="h-14 w-full rounded-sm border border-[var(--platform-line-strong)]" />
                    <Skeleton className="h-14 w-14 rounded-sm lg:hidden" />
                </div>

                <div className="mt-8 grid items-start gap-7 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-9">
                    <div className="hidden border-y border-[var(--platform-line-strong)] lg:block">
                        <div className="border-b border-[var(--platform-line)] p-4">
                            <Skeleton className="h-4 w-24 rounded-sm" />
                        </div>
                        {Array.from({ length: 4 }).map((_, sectionIndex) => (
                            <div
                                key={sectionIndex}
                                className="space-y-3 border-b border-[var(--platform-line)] p-4 last:border-b-0"
                            >
                                <Skeleton className="h-3 w-28 rounded-sm" />
                                {Array.from({ length: sectionIndex === 0 ? 3 : 2 }).map(
                                    (_, rowIndex) => (
                                        <div
                                            key={rowIndex}
                                            className="flex min-h-11 items-center gap-3"
                                        >
                                            <Skeleton className="h-4 w-4 rounded-sm" />
                                            <Skeleton className="h-4 flex-1 rounded-sm" />
                                            <Skeleton className="h-4 w-7 rounded-sm" />
                                        </div>
                                    ),
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="min-w-0">
                        <div className="mb-5 flex min-h-11 items-center justify-between border-b border-[var(--platform-line)] pb-3">
                            <Skeleton className="h-4 w-28 rounded-sm" />
                            <Skeleton className="h-4 w-20 rounded-sm" />
                        </div>
                        <div className="border-y border-[var(--platform-line-strong)]">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="grid min-h-44 grid-cols-[2.5rem_minmax(0,1fr)_2.75rem] gap-x-3 border-b border-[var(--platform-line)] px-3 py-5 last:border-b-0 sm:grid-cols-[3rem_minmax(0,1fr)_3rem] sm:gap-x-5 sm:px-5 sm:py-6"
                                >
                                    <Skeleton className="h-4 w-7 rounded-sm" />
                                    <div className="min-w-0">
                                        <Skeleton className="h-7 w-24 rounded-sm" />
                                        <Skeleton className="mt-4 h-6 w-3/4 rounded-sm" />
                                        <Skeleton className="mt-3 h-4 w-full rounded-sm" />
                                        <Skeleton className="mt-2 h-4 w-4/5 rounded-sm" />
                                        <Skeleton className="mt-5 h-4 w-2/3 rounded-sm" />
                                    </div>
                                    <Skeleton className="h-11 w-11 rounded-none" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </PlatformPageShell>
    );
}
