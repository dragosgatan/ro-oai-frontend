import { Suspense } from 'react';
import { MapPinned } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CountyListView } from '@/components/county-list-view';
import { PlatformPageHeader, PlatformPageShell } from '@/components/platform-page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { generateCountiesMetadata } from '@/lib/seo/page-metadata';
import { getServerLocale } from '@/lib/i18n-server';

export async function generateMetadata() {
    const locale = await getServerLocale();
    return generateCountiesMetadata(locale);
}

export default async function CountiesPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations();

    return (
        <PlatformPageShell>
            <PlatformPageHeader
                eyebrow={t('hero.platformTitle')}
                icon={MapPinned}
                title={t('counties.title')}
                description={t('counties.description')}
            />
            <Suspense fallback={<CountyListSkeleton loadingLabel={t('common.loading')} />}>
                <CountyListView />
            </Suspense>
        </PlatformPageShell>
    );
}

function CountyListSkeleton({ loadingLabel }: { loadingLabel: string }) {
    return (
        <div className="mt-8" role="status" aria-label={loadingLabel} aria-busy="true">
            <div className="platform-toolbar px-4 py-5 sm:px-6">
                <div className="max-w-2xl space-y-2">
                    <Skeleton className="h-3 w-24 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                    <Skeleton className="h-11 w-full rounded-none bg-[var(--platform-paper)] motion-reduce:animate-none" />
                </div>
            </div>
            <Skeleton className="my-5 h-4 w-32 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, groupIndex) => (
                    <div key={groupIndex}>
                        <Skeleton className="mb-3 h-8 w-8 rounded-none bg-[var(--platform-citron)] motion-reduce:animate-none" />
                        <div className="border-t border-[var(--platform-line-strong)]">
                            {Array.from({ length: 3 }).map((_, rowIndex) => (
                                <div
                                    key={rowIndex}
                                    className="flex min-h-14 items-center justify-between gap-4 border-b border-[var(--platform-line)] py-3"
                                >
                                    <Skeleton className="h-4 w-36 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                                    <Skeleton className="h-4 w-8 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
