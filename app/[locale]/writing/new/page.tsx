import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft, FileWarning, RotateCcw } from 'lucide-react';

import { ArticleEditor } from '@/components/articles/article-editor';
import { PlatformEmptyState, PlatformPageShell } from '@/components/platform-page-shell';
import { Link } from '@/i18n/routing';
import { getArticleProblemOption } from '@/lib/articles';
import { getSession } from '@/lib/auth';
import type { Locale } from '@/lib/types';

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ problemId?: string | string[] }>;
};

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

function parseProblemId(value: string | string[] | undefined): number | null {
    const candidate = Array.isArray(value) ? value[0] : value;
    if (!/^\d+$/.test(candidate ?? '')) return null;
    const problemId = Number(candidate);
    return Number.isSafeInteger(problemId) && problemId > 0 ? problemId : null;
}

export default async function NewArticlePage({ params, searchParams }: Props) {
    const [{ locale: localeParam }, query] = await Promise.all([params, searchParams]);
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    const session = await getSession();
    const problemId = parseProblemId(query.problemId);
    if (!session) {
        const safeQuery = problemId ? `?problemId=${problemId}` : '';
        const callbackUrl = encodeURIComponent(`/${locale}/writing/new${safeQuery}`);
        redirect(`/${locale}/login?callbackUrl=${callbackUrl}`);
    }

    let initialProblem = null;
    if (problemId) {
        try {
            initialProblem = await getArticleProblemOption(problemId, locale);
        } catch (error) {
            console.error('[Writing] Failed to preselect the requested editorial problem:', error);
        }

        if (!initialProblem) {
            const t = await getTranslations('writing.editorialPreselection');
            return (
                <PlatformPageShell>
                    <PlatformEmptyState
                        icon={FileWarning}
                        title={t('title')}
                        description={t('description')}
                        action={
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <a
                                    href={`/${locale}/writing/new?problemId=${problemId}`}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                                >
                                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                    {t('retry')}
                                </a>
                                <Link
                                    href="/articles"
                                    className="inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)]"
                                >
                                    <ArrowLeft
                                        className="h-4 w-4 rtl:rotate-180"
                                        aria-hidden="true"
                                    />
                                    {t('back')}
                                </Link>
                            </div>
                        }
                    />
                </PlatformPageShell>
            );
        }
    }

    return (
        <ArticleEditor
            initialArticle={null}
            initialProblem={initialProblem}
            recoveryScope={`${session.id ?? 'authenticated'}:${problemId ? `problem-${problemId}` : 'general'}`}
            currentUserId={session.id}
        />
    );
}
