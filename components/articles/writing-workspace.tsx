import {
    ArrowLeft,
    ArrowRight,
    BookOpenCheck,
    Clock3,
    FilePenLine,
    Plus,
    Send,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PlatformEmptyState, PlatformPageShell } from '@/components/platform-page-shell';
import { Link } from '@/i18n/routing';
import type { OwnedArticlePage } from '@/lib/articles';
import type { Locale } from '@/lib/types';

function formatDate(value: string, locale: Locale): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Europe/Bucharest',
    }).format(date);
}

export function WritingWorkspace({
    articlePage,
    locale,
}: {
    articlePage: OwnedArticlePage;
    locale: Locale;
}) {
    const t = useTranslations('writing');
    const articles = articlePage.content;
    const inReview = articles.filter(
        (article) => article.latestChangeRequest?.status === 'PENDING',
    ).length;

    return (
        <PlatformPageShell contentClassName="space-y-10 md:space-y-14">
            <header className="grid gap-8 border-b border-[var(--platform-line-strong)] pb-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
                <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--platform-violet)]">
                        <FilePenLine className="h-4 w-4" aria-hidden="true" />
                        {t('eyebrow')}
                    </p>
                    <h1 className="mt-5 max-w-[15ch] text-balance text-4xl font-bold leading-[1.03] tracking-[-0.055em] text-[var(--platform-ink)] sm:text-5xl lg:text-6xl">
                        {t('title')}
                    </h1>
                    <p className="mt-5 max-w-[65ch] text-pretty text-base leading-7 text-[var(--platform-ink-muted)] sm:text-lg">
                        {t('description')}
                    </p>
                </div>
                <div className="grid grid-cols-3 border-y border-[var(--platform-line-strong)] py-4">
                    <div className="border-e border-[var(--platform-line)] px-3 first:ps-0">
                        <p className="font-mono text-2xl font-bold tabular-nums text-[var(--platform-violet)]">
                            {articlePage.page.totalElements}
                        </p>
                        <p className="mt-1 text-xs text-[var(--platform-ink-muted)]">
                            {t('stats.total')}
                        </p>
                    </div>
                    <div className="border-e border-[var(--platform-line)] px-3">
                        <p className="font-mono text-2xl font-bold tabular-nums text-[var(--platform-ink)]">
                            {inReview}
                        </p>
                        <p className="mt-1 text-xs text-[var(--platform-ink-muted)]">
                            {t('stats.inReviewPage')}
                        </p>
                    </div>
                    <div className="px-3 pe-0">
                        <p className="font-mono text-2xl font-bold tabular-nums text-[var(--platform-ink)]">
                            {articlePage.page.totalPages === 0 ? 0 : articlePage.page.number + 1}
                        </p>
                        <p className="mt-1 text-xs text-[var(--platform-ink-muted)]">
                            {t('stats.page', {
                                total: Math.max(articlePage.page.totalPages, 1),
                            })}
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]">
                        {t('library.title')}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--platform-ink-muted)]">
                        {t('library.description')}
                    </p>
                </div>
                <Link
                    href="/writing/new"
                    className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-5 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-line)] transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-on-accent)]"
                >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {t('newArticle')}
                </Link>
            </div>

            {articles.length === 0 ? (
                <PlatformEmptyState
                    icon={FilePenLine}
                    title={t('empty.title')}
                    description={t('empty.description')}
                    action={
                        <Link
                            href="/writing/new"
                            className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {t('empty.action')}
                        </Link>
                    }
                />
            ) : (
                <ol className="border-y border-[var(--platform-line-strong)]">
                    {articles.map((article, index) => {
                        const review = article.latestChangeRequest;
                        const ReviewIcon = review?.status === 'PENDING' ? Send : BookOpenCheck;

                        return (
                            <li
                                key={article.id}
                                className="border-b border-[var(--platform-line)] last:border-b-0"
                            >
                                <Link
                                    href={`/writing/${article.id}`}
                                    className="group grid min-h-40 gap-5 px-2 py-6 transition-[background-color,padding] hover:bg-[var(--platform-paper-strong)] hover:px-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[var(--platform-coral)] sm:grid-cols-[3rem_minmax(0,1fr)_13rem_auto] sm:items-center sm:px-4 sm:hover:px-6"
                                >
                                    <span className="font-mono text-xs font-bold tabular-nums text-[var(--platform-violet)]">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink-muted)]">
                                            {t(`kinds.${article.kind}`)}
                                            {article.problem ? ` · #${article.problem.id}` : ''}
                                        </p>
                                        <h3 className="mt-2 text-pretty text-xl font-bold tracking-[-0.025em] text-[var(--platform-ink)] group-hover:text-[var(--platform-violet-strong)] dark:group-hover:text-[var(--platform-violet)] sm:text-2xl">
                                            {article.title || t('untitled')}
                                        </h3>
                                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                            {article.excerpt || t('noExcerpt')}
                                        </p>
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap gap-2">
                                            <p className="inline-flex min-h-8 items-center gap-2 border border-[var(--platform-line-strong)] px-2.5 text-xs font-bold text-[var(--platform-ink)]">
                                                <BookOpenCheck
                                                    className="h-3.5 w-3.5 text-[var(--platform-violet)]"
                                                    aria-hidden="true"
                                                />
                                                {t(
                                                    `publicationStatus.${article.publicationStatus}`,
                                                )}
                                            </p>
                                            {review ? (
                                                <p className="inline-flex min-h-8 items-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] px-2.5 text-xs font-bold text-[var(--platform-ink)]">
                                                    <ReviewIcon
                                                        className="h-3.5 w-3.5 text-[var(--platform-coral)]"
                                                        aria-hidden="true"
                                                    />
                                                    {t(`reviewStatus.${review.status}`)}
                                                </p>
                                            ) : null}
                                        </div>
                                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--platform-ink-muted)]">
                                            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                                            {t('updated', {
                                                date: formatDate(article.updatedAt, locale),
                                            })}
                                        </p>
                                    </div>
                                    <span className="grid h-11 w-11 place-items-center border border-[var(--platform-line-strong)] text-[var(--platform-violet)] transition-colors group-hover:border-[var(--platform-violet)] group-hover:bg-[var(--platform-violet)] group-hover:text-white dark:group-hover:text-[var(--platform-on-accent)]">
                                        <ArrowRight
                                            className="h-4 w-4 rtl:rotate-180"
                                            aria-hidden="true"
                                        />
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ol>
            )}

            {articlePage.page.totalPages > 1 ? (
                <nav
                    aria-label={t('pagination.label')}
                    className="flex flex-col items-center justify-between gap-4 border-t border-[var(--platform-line-strong)] pt-6 sm:flex-row"
                >
                    <Link
                        href={`/writing?page=${Math.max(1, articlePage.page.number)}`}
                        aria-disabled={articlePage.page.number === 0}
                        tabIndex={articlePage.page.number === 0 ? -1 : undefined}
                        className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
                    >
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                        {t('pagination.previous')}
                    </Link>
                    <p className="font-mono text-sm font-semibold tabular-nums text-[var(--platform-ink-muted)]">
                        {t('pagination.page', {
                            page: articlePage.page.number + 1,
                            pages: articlePage.page.totalPages,
                        })}
                    </p>
                    <Link
                        href={`/writing?page=${Math.min(
                            articlePage.page.totalPages,
                            articlePage.page.number + 2,
                        )}`}
                        aria-disabled={articlePage.page.number + 1 >= articlePage.page.totalPages}
                        tabIndex={
                            articlePage.page.number + 1 >= articlePage.page.totalPages
                                ? -1
                                : undefined
                        }
                        className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
                    >
                        {t('pagination.next')}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                </nav>
            ) : null}
        </PlatformPageShell>
    );
}
