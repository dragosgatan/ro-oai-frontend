import { Suspense } from 'react';
import { MyRequestsView } from '@/components/my-requests-view';
import { Skeleton } from '@/components/ui/skeleton';
import { generateMyRequestsMetadata } from '@/lib/seo/page-metadata';
import { getServerLocale } from '@/lib/i18n-server';
import { getTranslations } from 'next-intl/server';
import { FileText } from 'lucide-react';
import { PlatformPageHeader, PlatformPageShell } from '@/components/platform-page-shell';

export async function generateMetadata() {
    const locale = await getServerLocale();
    return generateMyRequestsMetadata(locale);
}

export default async function MyRequestsPage() {
    const t = await getTranslations('myRequests');

    return (
        <PlatformPageShell>
            <PlatformPageHeader
                eyebrow={t('status.pending')}
                icon={FileText}
                title={t('title')}
                description={t('description')}
            />
            <Suspense fallback={<MyRequestsSkeleton />}>
                <MyRequestsView />
            </Suspense>
        </PlatformPageShell>
    );
}

function MyRequestsSkeleton() {
    return (
        <div className="mt-8 space-y-5" role="status" aria-busy="true">
            <Skeleton className="h-4 w-44 rounded-none bg-[var(--platform-line)]" />
            <div className="platform-panel divide-y divide-[var(--platform-line)]">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-3 px-4 py-5 sm:px-6">
                        <Skeleton className="h-5 w-2/3 rounded-none bg-[var(--platform-line)]" />
                        <Skeleton className="h-4 w-1/3 rounded-none bg-[var(--platform-line)]" />
                        <Skeleton className="h-11 w-40 rounded-none bg-[var(--platform-line)]" />
                    </div>
                ))}
            </div>
        </div>
    );
}
