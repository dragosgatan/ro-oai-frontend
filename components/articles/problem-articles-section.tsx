'use client';

import { ArrowRight, BookOpenText } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ArticleAuthors } from '@/components/articles/article-authors';
import { Link } from '@/i18n/routing';
import type { ArticleSummary } from '@/lib/articles';

export function ProblemArticlesSection({
    articles,
    totalCount,
    problemId,
}: {
    articles: ArticleSummary[];
    totalCount: number;
    problemId: number;
}) {
    const t = useTranslations('articles');
    if (articles.length === 0) return null;

    return (
        <section
            aria-labelledby="problem-articles-heading"
            className="mt-8 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] shadow-[6px_6px_0_var(--platform-line)]"
        >
            <div className="border-b border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-5 py-5 sm:px-7">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-violet)]">
                    <BookOpenText className="h-4 w-4" aria-hidden="true" />
                    {t('problem.eyebrow')}
                </p>
                <h2
                    id="problem-articles-heading"
                    className="mt-2 text-xl font-bold tracking-[-0.025em] text-[var(--platform-ink)] sm:text-2xl"
                >
                    {t('problem.title')}
                </h2>
                <p className="mt-2 max-w-[65ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                    {t('problem.description')}
                </p>
            </div>
            <ol>
                {articles.map((article, index) => (
                    <li
                        key={article.id}
                        className="border-b border-[var(--platform-line)] last:border-b-0"
                    >
                        <Link
                            href={`/articles/${article.slug}`}
                            locale={article.language}
                            className="group grid min-h-36 gap-4 p-5 transition-colors hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[var(--platform-coral)] sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-7"
                        >
                            <span className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]">
                                    {article.kind === 'PROBLEM_EDITORIAL'
                                        ? t('kinds.problemEditorial')
                                        : t('kinds.general')}
                                </p>
                                <h3 className="mt-2 text-pretty text-lg font-bold tracking-[-0.02em] text-[var(--platform-ink)] transition-colors group-hover:text-[var(--platform-violet-strong)] dark:group-hover:text-[var(--platform-violet)] sm:text-xl">
                                    {article.title}
                                </h3>
                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                    {article.excerpt}
                                </p>
                                <ArticleAuthors
                                    authors={article.authors}
                                    label={t('authors')}
                                    fallbackName={t('authorFallback')}
                                    compact
                                    className="mt-3"
                                />
                            </div>
                            <span className="grid h-11 w-11 place-items-center border border-[var(--platform-line-strong)] text-[var(--platform-violet)] group-hover:border-[var(--platform-violet)] group-hover:bg-[var(--platform-violet)] group-hover:text-white dark:group-hover:text-[var(--platform-on-accent)]">
                                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                            </span>
                        </Link>
                    </li>
                ))}
            </ol>
            {totalCount > articles.length ? (
                <div className="border-t border-[var(--platform-line-strong)] px-5 py-4 sm:px-7">
                    <Link
                        href={`/articles?problemId=${problemId}`}
                        className="inline-flex min-h-11 items-center gap-2 font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)]"
                    >
                        {t('problem.viewAll')}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                </div>
            ) : null}
        </section>
    );
}
