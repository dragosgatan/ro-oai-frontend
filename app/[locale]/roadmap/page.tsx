import { fetchApi } from '@/lib/api';
import { generateRoadmapMetadata } from '@/lib/seo/page-metadata';
import { getServerLocale } from '@/lib/i18n-server';
import { getTranslations } from 'next-intl/server';
import RoadmapDetails, {
    type RoadmapPagePublicResponse,
    type RoadmapTreeEntry,
} from '@/components/roadmap-details';
import {
    PlatformEmptyState,
    PlatformPageHeader,
    PlatformPageShell,
} from '@/components/platform-page-shell';
import { AlertTriangle, BookOpen, RotateCcw } from 'lucide-react';
import { Link } from '@/i18n/routing';

export async function generateMetadata() {
    const locale = await getServerLocale();
    return generateRoadmapMetadata(locale);
}

export default async function RoadmapPage() {
    const t = await getTranslations();
    const [pageResult, treeResult] = await Promise.allSettled([
        fetchApi(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roadmap/pages/roadmap`),
        fetchApi(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roadmap/tree`),
    ]);

    const pageResponse = pageResult.status === 'fulfilled' ? pageResult.value : null;
    const treeResponse = treeResult.status === 'fulfilled' ? treeResult.value : null;

    let page: RoadmapPagePublicResponse | null = null;
    let tree: RoadmapTreeEntry[] = [];

    if (pageResponse?.ok) {
        try {
            page = (await pageResponse.json()) as RoadmapPagePublicResponse;
        } catch {
            page = null;
        }
    }

    if (treeResponse?.ok) {
        try {
            tree = (await treeResponse.json()) as RoadmapTreeEntry[];
        } catch {
            tree = [];
        }
    }

    if (!page) {
        return (
            <PlatformPageShell>
                <PlatformPageHeader
                    eyebrow={t('hero.platformTitle')}
                    icon={BookOpen}
                    title={t('navigation.roadmap')}
                    description={t('roadmap.description')}
                />
                <PlatformEmptyState
                    className="mt-10"
                    icon={AlertTriangle}
                    title={t('common.error')}
                    description={t('roadmap.description')}
                    action={
                        <Link
                            href="/roadmap"
                            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-violet)] px-4 py-2 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-line)] transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--platform-coral)] focus-visible:ring-offset-2 active:translate-y-px dark:text-[var(--platform-on-accent)]"
                        >
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            {t('common.retry')}
                        </Link>
                    }
                />
            </PlatformPageShell>
        );
    }

    return (
        <PlatformPageShell>
            <PlatformPageHeader
                eyebrow={t('hero.platformTitle')}
                icon={BookOpen}
                title={page.title}
                description={t('roadmap.description')}
            />
            <RoadmapDetails page={page} tree={tree} showTitle={false} />
        </PlatformPageShell>
    );
}
