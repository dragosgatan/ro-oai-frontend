import { ArrowLeft, CalendarDays, ExternalLink, UsersRound } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { ArticleAuthors } from '@/components/articles/article-authors';
import { ArticleContent } from '@/components/articles/article-content';
import { ArticleKindVisual } from '@/components/articles/article-kind-visual';
import { ArticleSolutionPanel } from '@/components/articles/article-solution-panel';
import { PlatformPageShell } from '@/components/platform-page-shell';
import { Link } from '@/i18n/routing';
import type { ArticleDetail } from '@/lib/articles';
import { formatProblemAuthorList } from '@/lib/problem-authors';
import type { Locale } from '@/lib/types';

function formatDate(value: string | null, locale: Locale): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Bucharest',
    }).format(date);
}

/** The single visual implementation for public articles and protected admin previews. */
export async function ArticleDetailView({
    article,
    locale,
}: {
    article: ArticleDetail;
    locale: Locale;
}) {
    const t = await getTranslations({ locale, namespace: 'articles' });
    const publishedLabel = formatDate(article.publishedAt, locale);
    const kindLabel =
        article.kind === 'PROBLEM_EDITORIAL' ? t('kinds.problemEditorial') : t('kinds.general');
    const problemAuthorNames = article.problem
        ? formatProblemAuthorList(article.problem.authors, locale)
        : '';

    return (
        <PlatformPageShell contentClassName="space-y-10 md:space-y-14">
            <Link
                href="/articles"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)]"
            >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                {t('detail.backToArticles')}
            </Link>

            <header
                lang={article.language}
                className="grid items-stretch gap-8 border-b border-[var(--platform-line-strong)] pb-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12 lg:pb-14"
            >
                <div className="flex min-w-0 flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink-muted)]">
                        <span className="bg-[var(--platform-citron)] px-2.5 py-1 text-[var(--platform-on-accent)]">
                            {kindLabel}
                        </span>
                        {publishedLabel ? (
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                                <time dateTime={article.publishedAt ?? undefined}>
                                    {publishedLabel}
                                </time>
                            </span>
                        ) : null}
                    </div>
                    <h1 className="mt-6 max-w-[19ch] text-balance text-4xl font-bold leading-[1.04] tracking-[-0.055em] text-[var(--platform-ink)] sm:text-5xl lg:text-6xl">
                        {article.title}
                    </h1>
                    <p className="mt-6 max-w-[65ch] text-pretty text-lg leading-8 text-[var(--platform-ink-muted)]">
                        {article.excerpt}
                    </p>
                    <ArticleAuthors
                        authors={article.authors}
                        label={t('authors')}
                        fallbackName={t('authorFallback')}
                        problemAuthorLabel={t('detail.problemAuthor')}
                        className="mt-7"
                    />
                </div>
                <ArticleKindVisual
                    kind={article.kind}
                    problemId={article.problem?.id}
                    className="min-h-64 shadow-[7px_7px_0_var(--platform-line)] lg:min-h-[25rem]"
                />
            </header>

            {article.problem ? (
                <aside className="grid gap-5 border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
                    <div>
                        <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-violet)]">
                            {t('detail.relatedProblem')}
                        </p>
                        <p className="mt-2 text-lg font-bold text-[var(--platform-ink)]">
                            #{article.problem.id} {article.problem.title}
                        </p>
                        {problemAuthorNames ? (
                            <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                <UsersRound className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                                <span>
                                    {t('detail.problemAuthors', { names: problemAuthorNames })}
                                </span>
                            </p>
                        ) : null}
                    </div>
                    <Link
                        href={`/problems/${article.problem.id}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] transition-colors hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                    >
                        {t('detail.viewProblem')}
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </Link>
                </aside>
            ) : null}

            {article.sharedSubmission ? (
                <ArticleSolutionPanel submission={article.sharedSubmission} locale={locale} />
            ) : null}

            <ArticleContent html={article.sanitizedHtml} language={article.language} />
        </PlatformPageShell>
    );
}
