import { Suspense } from 'react';
import { Building2 } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { InstitutionListView } from '@/components/institution-list-view';
import { PlatformPageHeader, PlatformPageShell } from '@/components/platform-page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { generateInstitutionsMetadata } from '@/lib/seo/page-metadata';
import { getServerLocale } from '@/lib/i18n-server';

export async function generateMetadata() {
    const locale = await getServerLocale();
    return generateInstitutionsMetadata(locale);
}

export default async function InstitutionsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations();

    return (
        <PlatformPageShell>
            <PlatformPageHeader
                eyebrow={t('hero.platformTitle')}
                icon={Building2}
                title={t('institutions.title')}
                description={t('institutions.description')}
            />
            <Suspense fallback={<InstitutionListSkeleton loadingLabel={t('common.loading')} />}>
                <InstitutionListView />
            </Suspense>
        </PlatformPageShell>
    );
}

function InstitutionListSkeleton({ loadingLabel }: { loadingLabel: string }) {
    return (
        <div className="mt-8" role="status" aria-label={loadingLabel} aria-busy="true">
            <div className="platform-toolbar grid gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[14rem_14rem_minmax(18rem,1fr)]">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                        <Skeleton className="h-3 w-24 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                        <Skeleton className="h-11 w-full rounded-none bg-[var(--platform-paper)] motion-reduce:animate-none" />
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between gap-4 py-5">
                <Skeleton className="h-4 w-36 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                <Skeleton className="h-4 w-28 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
            </div>
            <div className="platform-panel divide-y divide-[var(--platform-line)]">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="grid gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_12rem_13rem] lg:items-center"
                    >
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-3/4 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                            <Skeleton className="h-4 w-1/2 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                        </div>
                        <Skeleton className="h-4 w-28 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                        <Skeleton className="h-11 w-full rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                    </div>
                ))}
            </div>
        </div>
    );
}
