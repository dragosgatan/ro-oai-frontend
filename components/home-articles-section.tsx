import {
    ArrowRight,
    BookOpenText,
    CalendarDays,
    Lightbulb,
    PenLine,
    ShieldCheck,
} from 'lucide-react';

import { Link } from '@/i18n/routing';
import { getArticleAuthorName, type ArticleSummary } from '@/lib/articles';
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

type HomeArticlesSectionProps = {
    locale: Locale;
    articles: ArticleSummary[];
    unavailable?: boolean;
    eyebrow: string;
    title: string;
    description: string;
    readLabel: string;
    viewAllLabel: string;
    authorsLabel: string;
    authorFallback: string;
    editorialLabel: string;
    generalLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    unavailableTitle: string;
    unavailableDescription: string;
    contributeEyebrow: string;
    contributeTitle: string;
    contributeDescription: string;
    writeLabel: string;
    proposeLabel: string;
    reviewNote: string;
};

function articleKindLabel(
    article: ArticleSummary,
    editorialLabel: string,
    generalLabel: string,
): string {
    return article.kind === 'PROBLEM_EDITORIAL' ? editorialLabel : generalLabel;
}

function ArticleMeta({
    article,
    locale,
    authorsLabel,
    authorFallback,
}: {
    article: ArticleSummary;
    locale: Locale;
    authorsLabel: string;
    authorFallback: string;
}) {
    const published = formatDate(article.publishedAt, locale);
    const authors = article.authors
        .map((author) => getArticleAuthorName(author, authorFallback))
        .join(', ');

    return (
        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="min-w-0 max-w-full truncate font-semibold">
                <span className="text-[color:var(--home-paper-muted)]">{authorsLabel}: </span>
                {authors || authorFallback}
            </span>
            {published ? (
                <time
                    dateTime={article.publishedAt ?? undefined}
                    className="inline-flex items-center gap-2 text-[color:var(--home-paper-muted)]"
                >
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                    {published}
                </time>
            ) : null}
        </div>
    );
}

export function HomeArticlesSection({
    locale,
    articles,
    unavailable = false,
    eyebrow,
    title,
    description,
    readLabel,
    viewAllLabel,
    authorsLabel,
    authorFallback,
    editorialLabel,
    generalLabel,
    emptyTitle,
    emptyDescription,
    unavailableTitle,
    unavailableDescription,
    contributeEyebrow,
    contributeTitle,
    contributeDescription,
    writeLabel,
    proposeLabel,
    reviewNote,
}: HomeArticlesSectionProps) {
    const [featured, ...moreArticles] = articles.slice(0, 3);

    return (
        <section
            id="articles"
            aria-labelledby="home-articles-heading"
            className="scroll-mt-24 bg-[var(--home-ink)] text-[var(--home-paper)]"
        >
            <div className="mx-auto max-w-[90rem] px-5 py-10 sm:px-8 sm:py-12 lg:py-14 xl:px-12">
                <header className="grid gap-5 border-b border-[color:var(--home-paper-line)] pb-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.62fr)] lg:items-end lg:gap-12">
                    <div>
                        <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.13em] text-[color:var(--home-paper-muted)]">
                            <PenLine
                                className="h-4 w-4 text-[var(--home-on-ink-accent)]"
                                aria-hidden="true"
                            />
                            {eyebrow}
                        </p>
                        <h2
                            id="home-articles-heading"
                            className="home-display mt-4 max-w-[18ch] text-balance text-[clamp(2.25rem,3.6vw,4rem)] leading-[0.98] tracking-[-0.055em]"
                        >
                            {title}
                        </h2>
                    </div>
                    <div className="lg:pb-1">
                        <p className="max-w-[60ch] text-pretty text-base leading-7 text-[color:var(--home-paper-muted)]">
                            {description}
                        </p>
                        {featured ? (
                            <Link
                                href="/articles"
                                className="group mt-4 inline-flex min-h-11 items-center gap-2 font-semibold underline decoration-[var(--home-on-ink-accent)] decoration-2 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-on-ink-accent)]"
                            >
                                {viewAllLabel}
                                <ArrowRight
                                    className="h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                        ) : null}
                    </div>
                </header>

                <div className="mt-6 grid overflow-hidden border-y border-[color:var(--home-paper-line)] lg:grid-cols-[minmax(0,1.32fr)_minmax(23rem,0.68fr)]">
                    <div className="min-w-0">
                        {featured ? (
                            <ol className={moreArticles.length === 0 ? 'lg:h-full' : undefined}>
                                <li
                                    className={
                                        moreArticles.length > 0
                                            ? 'border-b border-[color:var(--home-paper-line)]'
                                            : 'lg:h-full'
                                    }
                                >
                                    <Link
                                        href={`/articles/${featured.slug}`}
                                        locale={featured.language}
                                        className={`group block px-5 py-7 outline-none transition-colors duration-200 ease-out hover:bg-[color-mix(in_oklch,var(--home-violet)_18%,var(--home-ink))] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--home-on-ink-accent)] sm:px-8 sm:py-8 lg:px-10 ${
                                            moreArticles.length === 0
                                                ? 'lg:flex lg:h-full lg:flex-col lg:justify-center'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--home-paper-muted)]">
                                            <span className="home-display text-[var(--home-on-ink-accent)]">
                                                01
                                            </span>
                                            <span aria-hidden="true">·</span>
                                            <span>
                                                {articleKindLabel(
                                                    featured,
                                                    editorialLabel,
                                                    generalLabel,
                                                )}
                                            </span>
                                            {featured.problem ? (
                                                <>
                                                    <span aria-hidden="true">·</span>
                                                    <span className="font-mono tabular-nums">
                                                        #{featured.problem.id}
                                                    </span>
                                                </>
                                            ) : null}
                                        </div>
                                        <h3 className="mt-4 max-w-[30ch] text-pretty text-2xl font-semibold leading-tight tracking-[-0.035em] transition-colors group-hover:text-[var(--home-on-ink-accent)] lg:text-3xl">
                                            {featured.title}
                                        </h3>
                                        <p className="mt-3 line-clamp-2 max-w-[68ch] text-pretty text-sm leading-6 text-[color:var(--home-paper-muted)] sm:text-base">
                                            {featured.excerpt}
                                        </p>
                                        <ArticleMeta
                                            article={featured}
                                            locale={locale}
                                            authorsLabel={authorsLabel}
                                            authorFallback={authorFallback}
                                        />
                                        <span className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--home-on-ink-accent)] underline decoration-[var(--home-coral)] decoration-2 underline-offset-4">
                                            {readLabel}
                                            <ArrowRight
                                                className="h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                                                aria-hidden="true"
                                            />
                                        </span>
                                    </Link>
                                </li>
                                {moreArticles.map((article, index) => (
                                    <li
                                        key={article.id}
                                        className="border-b border-[color:var(--home-paper-line)] last:border-b-0"
                                    >
                                        <Link
                                            href={`/articles/${article.slug}`}
                                            locale={article.language}
                                            className="group grid min-h-24 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-start gap-3 px-5 py-5 outline-none transition-colors duration-200 ease-out hover:bg-[color-mix(in_oklch,var(--home-violet)_18%,var(--home-ink))] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--home-on-ink-accent)] sm:grid-cols-[2.75rem_minmax(0,1fr)_auto] sm:gap-4 sm:px-8 lg:px-10"
                                        >
                                            <span className="home-display text-xs tabular-nums text-[var(--home-on-ink-accent)]">
                                                {String(index + 2).padStart(2, '0')}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--home-paper-muted)]">
                                                    {articleKindLabel(
                                                        article,
                                                        editorialLabel,
                                                        generalLabel,
                                                    )}
                                                </span>
                                                <span className="mt-1.5 line-clamp-2 block text-pretty text-base font-semibold leading-tight tracking-[-0.02em] transition-colors group-hover:text-[var(--home-on-ink-accent)] sm:text-lg">
                                                    {article.title}
                                                </span>
                                            </span>
                                            <ArrowRight
                                                className="mt-1 h-5 w-5 shrink-0 text-[var(--home-on-ink-accent)] transition-transform duration-200 ease-out group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <div
                                className="flex h-full flex-col items-start gap-5 px-5 py-8 sm:flex-row sm:items-center sm:gap-7 sm:px-8 sm:py-9 lg:px-10"
                                role={unavailable ? 'status' : undefined}
                            >
                                <span className="grid h-12 w-12 shrink-0 place-items-center bg-[var(--home-coral)] text-[var(--home-on-accent)] sm:h-14 sm:w-14">
                                    <BookOpenText
                                        className="h-5 w-5 sm:h-6 sm:w-6"
                                        aria-hidden="true"
                                    />
                                </span>
                                <div>
                                    <h3 className="max-w-[28ch] text-pretty text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-3xl">
                                        {unavailable ? unavailableTitle : emptyTitle}
                                    </h3>
                                    <p className="mt-3 max-w-[58ch] text-pretty text-sm leading-6 text-[color:var(--home-paper-muted)] sm:text-base sm:leading-7">
                                        {unavailable ? unavailableDescription : emptyDescription}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <aside
                        aria-labelledby="home-contribute-heading"
                        className="home-accent-panel flex flex-col justify-center border-t border-[var(--home-on-accent)] bg-[var(--home-citron)] px-5 py-8 text-[var(--home-on-accent)] sm:px-8 lg:border-s lg:border-t-0 lg:p-8"
                    >
                        <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.13em]">
                            <span className="h-2 w-2 bg-[var(--home-coral)]" aria-hidden="true" />
                            {contributeEyebrow}
                        </p>
                        <h3
                            id="home-contribute-heading"
                            className="home-display mt-4 max-w-[22ch] text-balance text-2xl leading-[1.02] tracking-[-0.045em] sm:text-3xl"
                        >
                            {contributeTitle}
                        </h3>
                        <p className="mt-3 max-w-[48ch] text-pretty text-sm leading-6 text-[color:var(--home-ink-muted-strong)]">
                            {contributeDescription}
                        </p>

                        <div className="mt-6 flex flex-col gap-3">
                            <Link
                                href="/writing/new"
                                className="group inline-flex min-h-12 items-center justify-between gap-4 bg-[var(--home-on-accent)] px-4 py-3 text-sm font-semibold leading-5 text-[var(--home-citron)] outline-none transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[var(--home-coral)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-citron)] active:translate-y-0"
                            >
                                <span className="inline-flex items-center gap-3">
                                    <PenLine className="h-5 w-5 shrink-0" aria-hidden="true" />
                                    {writeLabel}
                                </span>
                                <ArrowRight
                                    className="h-5 w-5 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                            <Link
                                href="/problem-proposals/new"
                                className="group inline-flex min-h-12 items-center justify-between gap-4 border border-[var(--home-on-accent)] px-4 py-3 text-sm font-semibold leading-5 outline-none transition-colors duration-200 ease-out hover:bg-[color-mix(in_oklch,var(--home-on-accent)_8%,transparent)] focus-visible:ring-4 focus-visible:ring-[var(--home-coral)]"
                            >
                                <span className="inline-flex items-center gap-3">
                                    <Lightbulb className="h-5 w-5 shrink-0" aria-hidden="true" />
                                    {proposeLabel}
                                </span>
                                <ArrowRight
                                    className="h-5 w-5 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>

                        <p className="mt-5 flex items-start gap-2 border-t border-[color-mix(in_oklch,var(--home-on-accent)_30%,transparent)] pt-4 text-xs leading-5 text-[color:var(--home-ink-muted-strong)]">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            {reviewNote}
                        </p>
                    </aside>
                </div>
            </div>
        </section>
    );
}
