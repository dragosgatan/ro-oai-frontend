import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { AlertTriangle, ArrowRight, Trophy } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { fetchApi } from '@/lib/api';
import type { CompetitionUserListResponse } from '@/lib/types';
import { CompetitionsSection } from '@/components/competitions-section';
import { CompetitionModeNotice } from '@/components/competition-mode-notice';
import {
    PlatformEmptyState,
    PlatformPageHeader,
    PlatformPageShell,
} from '@/components/platform-page-shell';
import { getServerLocale } from '@/lib/i18n-server';
import { generateCompetitionsListMetadata } from '@/lib/seo/page-metadata';
import { Link } from '@/i18n/routing';

const ScrollReveal = dynamic(
    () => import('@/components/scroll-reveal').then((mod) => ({ default: mod.ScrollReveal })),
    {
        loading: () => <div />,
    },
);

const PageTransition = dynamic(
    () => import('@/components/page-transition').then((mod) => ({ default: mod.PageTransition })),
    {
        loading: () => <div />,
    },
);

type PageProps = {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

type PageResponse<T> = {
    content: T[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
};

/**
 * Generate metadata for competitions list page with localized content
 */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getServerLocale();
    const metadata = await generateCompetitionsListMetadata(locale);

    return {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        openGraph: metadata.openGraph,
        twitter: metadata.twitter,
        alternates: metadata.alternates,
        robots: metadata.robots,
    };
}

export default async function CompetitionsPage({ searchParams }: PageProps) {
    const [t, tHosting] = await Promise.all([
        getTranslations('competitions.list'),
        getTranslations('competitionHosting.publicCta'),
    ]);
    const resolvedSearchParams = await searchParams;

    const requestedPage = Number(
        Array.isArray(resolvedSearchParams?.page)
            ? resolvedSearchParams.page[0]
            : resolvedSearchParams?.page,
    );
    const requestedSize = Number(
        Array.isArray(resolvedSearchParams?.size)
            ? resolvedSearchParams.size[0]
            : resolvedSearchParams?.size,
    );
    const page =
        Number.isFinite(requestedPage) && requestedPage >= 0 ? Math.floor(requestedPage) : 0;
    const size =
        Number.isFinite(requestedSize) && requestedSize >= 1 && requestedSize <= 50
            ? Math.floor(requestedSize)
            : 9;

    const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/competitions`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', String(size));

    let json: PageResponse<CompetitionUserListResponse>;
    try {
        const res = await fetchApi(url.toString());
        if (!res.ok) {
            throw new Error(`Competition list request failed with status ${res.status}`);
        }
        json = (await res.json()) as PageResponse<CompetitionUserListResponse>;
    } catch (error) {
        console.error('[Competitions] Failed to load competition list:', error);
        return (
            <PageTransition>
                <PlatformPageShell>
                    <PlatformPageHeader
                        eyebrow={t('title')}
                        icon={Trophy}
                        title={t('title')}
                        description={t('subtitle')}
                    />
                    <PlatformEmptyState className="mt-8" icon={AlertTriangle} title={t('error')} />
                </PlatformPageShell>
            </PageTransition>
        );
    }

    const competitions = json.content;
    const totalPages = json.page.totalPages;
    const currentPage = json.page.number;

    return (
        <PageTransition>
            <PlatformPageShell>
                <div className="mb-8">
                    <CompetitionModeNotice />
                </div>
                <ScrollReveal>
                    <CompetitionsSection
                        title={'title'}
                        subtitle={'subtitle'}
                        competitions={competitions}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        size={size}
                        basePath="/competitions"
                        showNavigation={true}
                        sectionId="competitions-list"
                    />
                </ScrollReveal>
                <section className="mt-12 grid gap-5 border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
                    <div>
                        <h2 className="text-xl font-bold tracking-[-0.025em] text-[var(--platform-ink)]">
                            {tHosting('title')}
                        </h2>
                        <p className="mt-2 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {tHosting('description')}
                        </p>
                    </div>
                    <Link
                        href="/my-competitions/new"
                        className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-5 text-sm font-bold text-white dark:text-[var(--platform-on-accent)]"
                    >
                        {tHosting('action')}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                </section>
            </PlatformPageShell>
        </PageTransition>
    );
}
