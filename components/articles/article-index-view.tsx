import {
    ArrowLeft,
    ArrowRight,
    BookOpenText,
    CalendarDays,
    FilePlus2,
    LibraryBig,
} from 'lucide-react';

import { ArticleAuthors } from '@/components/articles/article-authors';
import { ArticleKindVisual } from '@/components/articles/article-kind-visual';
import { EditorialOpportunities } from '@/components/articles/editorial-opportunities';
import {
    PlatformEmptyState,
    PlatformPageHeader,
    PlatformPageShell,
} from '@/components/platform-page-shell';
import { Link } from '@/i18n/routing';
import {
    buildArticleIndexHref,
    type ArticleIndexFilters,
    type ArticlePage,
    type ArticleSummary,
} from '@/lib/articles';
import type { Locale } from '@/lib/types';

export type ArticleIndexLabels = {
    eyebrow: string;
    title: string;
    description: string;
    count: string;
    featured: string;
    general: string;
    editorial: string;
    authors: string;
    authorFallback: string;
    published: string;
    linkedProblem: string;
    readArticle: string;
    previousPage: string;
    nextPage: string;
    paginationLabel: string;
    pageLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    writeArticle: string;
};

function kindLabel(article: ArticleSummary, labels: ArticleIndexLabels): string {
    return article.kind === 'PROBLEM_EDITORIAL' ? labels.editorial : labels.general;
}

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

export function ArticleIndexView({
    articles,
    locale,
    labels,
    filters = {},
}: {
    articles: ArticlePage;
    locale: Locale;
    labels: ArticleIndexLabels;
    filters?: ArticleIndexFilters;
}) {
    const [featured, ...remaining] = articles.content;
    const currentPage = articles.page.number + 1;
    const totalPages = articles.page.totalPages;
    const formatter = new Intl.NumberFormat(locale, {
        minimumIntegerDigits: 2,
        useGrouping: false,
    });

    return (
        <PlatformPageShell contentClassName="space-y-10 md:space-y-14">
            <PlatformPageHeader
                eyebrow={labels.eyebrow}
                icon={LibraryBig}
                title={labels.title}
                description={labels.description}
                aside={
                    <div className="flex w-full min-w-52 flex-col gap-3 sm:w-auto">
                        <dl className="grid grid-cols-[1fr_auto] border-y border-[var(--platform-line-strong)] py-3 text-sm">
                            <dt className="text-[var(--platform-ink-muted)]">{labels.count}</dt>
                            <dd className="font-mono text-xl font-bold tabular-nums text-[var(--platform-violet)]">
                                {new Intl.NumberFormat(locale).format(articles.page.totalElements)}
                            </dd>
                        </dl>
                        <Link
                            href="/writing/new"
                            className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[var(--platform-violet)] bg-[var(--platform-violet)] px-4 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-citron)] transition-[background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--platform-violet-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] motion-reduce:transform-none dark:text-[var(--platform-on-accent)]"
                        >
                            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                            {labels.writeArticle}
                        </Link>
                    </div>
                }
            />

            <EditorialOpportunities />

            {!featured ? (
                <PlatformEmptyState
                    icon={BookOpenText}
                    title={labels.emptyTitle}
                    description={labels.emptyDescription}
                />
            ) : (
                <>
                    <section aria-labelledby="featured-article-heading">
                        <p className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--platform-violet)]">
                            {labels.featured}
                        </p>
                        <Link
                            href={`/articles/${featured.slug}`}
                            locale={featured.language}
                            className="group grid overflow-hidden border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] shadow-[7px_7px_0_var(--platform-line)] transition-transform duration-200 ease-out hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] lg:grid-cols-[0.88fr_1.12fr]"
                        >
                            <ArticleKindVisual
                                kind={featured.kind}
                                problemId={featured.problem?.id}
                                className="min-h-72 border-0 border-b lg:min-h-[28rem] lg:border-b-0 lg:border-e"
                            />
                            <div className="flex min-w-0 flex-col p-6 sm:p-8 lg:p-10">
                                <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink-muted)]">
                                    <span className="bg-[var(--platform-citron)] px-2.5 py-1 text-[var(--platform-on-accent)]">
                                        {kindLabel(featured, labels)}
                                    </span>
                                    {formatDate(featured.publishedAt, locale) ? (
                                        <span className="inline-flex items-center gap-1.5">
                                            <CalendarDays
                                                className="h-3.5 w-3.5"
                                                aria-hidden="true"
                                            />
                                            <time dateTime={featured.publishedAt ?? undefined}>
                                                {formatDate(featured.publishedAt, locale)}
                                            </time>
                                        </span>
                                    ) : null}
                                </div>
                                <h2
                                    id="featured-article-heading"
                                    className="mt-7 text-balance text-3xl font-bold leading-tight tracking-[-0.045em] text-[var(--platform-ink)] transition-colors group-hover:text-[var(--platform-violet-strong)] dark:group-hover:text-[var(--platform-violet)] sm:text-4xl"
                                >
                                    {featured.title}
                                </h2>
                                <p className="mt-5 max-w-[65ch] text-pretty text-base leading-7 text-[var(--platform-ink-muted)]">
                                    {featured.excerpt}
                                </p>
                                {featured.problem ? (
                                    <p className="mt-5 font-mono text-xs font-semibold text-[var(--platform-violet)]">
                                        {labels.linkedProblem} #{featured.problem.id}:{' '}
                                        {featured.problem.title}
                                    </p>
                                ) : null}
                                <ArticleAuthors
                                    authors={featured.authors}
                                    label={labels.authors}
                                    fallbackName={labels.authorFallback}
                                    compact
                                    className="mt-auto pt-8"
                                />
                                <span className="mt-7 inline-flex min-h-11 items-center gap-2 self-start font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 dark:text-[var(--platform-violet)]">
                                    {labels.readArticle}
                                    <ArrowRight
                                        className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                                        aria-hidden="true"
                                    />
                                </span>
                            </div>
                        </Link>
                    </section>

                    {remaining.length > 0 ? (
                        <ol className="border-y border-[var(--platform-line-strong)]">
                            {remaining.map((article, index) => (
                                <li
                                    key={article.id}
                                    className="border-b border-[var(--platform-line)] last:border-b-0"
                                >
                                    <Link
                                        href={`/articles/${article.slug}`}
                                        locale={article.language}
                                        className="group grid min-h-44 gap-5 px-2 py-6 transition-[background-color,padding] duration-200 hover:bg-[var(--platform-paper-strong)] hover:px-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[var(--platform-coral)] sm:grid-cols-[3rem_minmax(0,1fr)_9rem_auto] sm:items-center sm:px-4 sm:hover:px-6"
                                    >
                                        <span className="font-mono text-xs font-bold tabular-nums text-[var(--platform-violet)]">
                                            {formatter.format(index + 2)}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--platform-ink-muted)]">
                                                <span>{kindLabel(article, labels)}</span>
                                                {article.problem ? (
                                                    <span className="font-mono">
                                                        #{article.problem.id}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <h2 className="mt-2 text-pretty text-xl font-bold tracking-[-0.025em] text-[var(--platform-ink)] transition-colors group-hover:text-[var(--platform-violet-strong)] dark:group-hover:text-[var(--platform-violet)] sm:text-2xl">
                                                {article.title}
                                            </h2>
                                            <p className="mt-2 line-clamp-2 max-w-[70ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                                                {article.excerpt}
                                            </p>
                                        </div>
                                        <div className="hidden text-xs leading-5 text-[var(--platform-ink-muted)] sm:block">
                                            <p>{labels.published}</p>
                                            <time dateTime={article.publishedAt ?? undefined}>
                                                {formatDate(article.publishedAt, locale)}
                                            </time>
                                        </div>
                                        <span className="grid h-11 w-11 place-items-center border border-[var(--platform-line-strong)] text-[var(--platform-violet)] transition-colors group-hover:border-[var(--platform-violet)] group-hover:bg-[var(--platform-violet)] group-hover:text-white dark:group-hover:text-[var(--platform-on-accent)]">
                                            <ArrowRight
                                                className="h-4 w-4 rtl:rotate-180"
                                                aria-hidden="true"
                                            />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    ) : null}
                </>
            )}

            {totalPages > 1 ? (
                <nav
                    aria-label={labels.paginationLabel}
                    className="flex flex-col items-center justify-between gap-4 border-t border-[var(--platform-line-strong)] pt-6 sm:flex-row"
                >
                    <Link
                        href={buildArticleIndexHref(Math.max(1, currentPage - 1), filters)}
                        aria-disabled={currentPage <= 1}
                        tabIndex={currentPage <= 1 ? -1 : undefined}
                        className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
                    >
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                        {labels.previousPage}
                    </Link>
                    <p className="font-mono text-sm font-semibold tabular-nums text-[var(--platform-ink-muted)]">
                        {labels.pageLabel
                            .replace('{page}', String(currentPage))
                            .replace('{pages}', String(totalPages))}
                    </p>
                    <Link
                        href={buildArticleIndexHref(Math.min(totalPages, currentPage + 1), filters)}
                        aria-disabled={currentPage >= totalPages}
                        tabIndex={currentPage >= totalPages ? -1 : undefined}
                        className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
                    >
                        {labels.nextPage}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                </nav>
            ) : null}
        </PlatformPageShell>
    );
}
