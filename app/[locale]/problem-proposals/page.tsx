import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FileWarning, RotateCcw } from 'lucide-react';

import { ProblemProposalsWorkspace } from '@/components/problem-proposals/problem-proposals-workspace';
import { PlatformEmptyState, PlatformPageShell } from '@/components/platform-page-shell';
import { Link } from '@/i18n/routing';
import { ProblemProposalApiError, getMyProblemProposals } from '@/lib/problem-proposals';
import { getSession } from '@/lib/auth';
import type { Locale } from '@/lib/types';

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ page?: string | string[] }>;
};

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function ProblemProposalsPage({ params, searchParams }: Props) {
    const [{ locale: localeParam }, query] = await Promise.all([params, searchParams]);
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    const [session, t] = await Promise.all([getSession(), getTranslations('problemProposals')]);
    if (!session) {
        const callbackUrl = encodeURIComponent(`/${locale}/problem-proposals`);
        redirect(`/${locale}/login?callbackUrl=${callbackUrl}`);
    }
    const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
    const requestedPage = /^\d+$/.test(rawPage ?? '') ? Math.max(1, Number(rawPage)) : 1;

    try {
        const proposals = await getMyProblemProposals({
            page: requestedPage - 1,
            size: 20,
        });
        if (proposals.page.totalPages > 0 && requestedPage > proposals.page.totalPages) {
            notFound();
        }
        return <ProblemProposalsWorkspace proposalPage={proposals} locale={locale} />;
    } catch (error) {
        console.error('[Problem proposals] Failed to load contributor workspace:', error);
        const forbidden = error instanceof ProblemProposalApiError && error.status === 403;
        return (
            <PlatformPageShell>
                <PlatformEmptyState
                    icon={FileWarning}
                    title={forbidden ? t('access.title') : t('error.title')}
                    description={forbidden ? t('access.description') : t('error.description')}
                    action={
                        forbidden ? undefined : (
                            <Link
                                href="/problem-proposals"
                                className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)]"
                            >
                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                {t('error.retry')}
                            </Link>
                        )
                    }
                />
            </PlatformPageShell>
        );
    }
}
