'use client';

import {
    ArrowRight,
    BookOpenCheck,
    BookOpenText,
    CalendarDays,
    Check,
    FilePenLine,
    Lightbulb,
    PenLine,
    Sparkles,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useMemo } from 'react';

import { Link } from '@/i18n/routing';
import type { ArticleSummary } from '@/lib/articles';
import {
    buildArticleAchievementJourney,
    type ArticleAchievementMilestone,
    type ArticleAchievementTrack,
} from '@/lib/article-achievements';
import type { Achievement, AchievementProgress, Locale, UserAchievement } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ProfileAuthoredArticles({
    articles,
    totalCount,
    authorId,
    isOwnProfile = false,
    achievements = [],
    userAchievements = [],
    achievementProgress = [],
}: {
    articles: ArticleSummary[];
    totalCount: number;
    authorId: string;
    isOwnProfile?: boolean;
    achievements?: Achievement[];
    userAchievements?: UserAchievement[];
    achievementProgress?: AchievementProgress[];
}) {
    const t = useTranslations('articles');
    const tAchievements = useTranslations('achievements');
    const locale = useLocale() as Locale;
    const journeys = useMemo(
        () =>
            buildArticleAchievementJourney({
                achievements,
                userAchievements,
                progress: achievementProgress,
                showUpcoming: isOwnProfile,
            }),
        [achievementProgress, achievements, isOwnProfile, userAchievements],
    );
    const visibleJourneys = journeys.filter((journey) => journey.displayMilestone);
    const milestoneCount = journeys.reduce(
        (count, journey) => count + journey.milestones.length,
        0,
    );
    const earnedMilestoneCount = journeys.reduce(
        (count, journey) => count + journey.earnedCount,
        0,
    );

    if (articles.length === 0 && !isOwnProfile) return null;

    return (
        <section
            aria-labelledby="profile-authored-articles"
            className="platform-panel overflow-hidden bg-[var(--platform-paper)]"
        >
            <header className="flex flex-col gap-4 border-b border-[var(--platform-line-strong)] p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
                <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[var(--platform-violet)]">
                        <BookOpenText className="h-4 w-4" aria-hidden="true" />
                        {t('profile.eyebrow')}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        <h2
                            id="profile-authored-articles"
                            className="text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                        >
                            {t('profile.title')}
                        </h2>
                        <span className="inline-flex min-h-7 items-center bg-[var(--platform-citron)] px-2.5 font-mono text-xs font-bold tabular-nums text-[var(--platform-on-accent)]">
                            {t('profile.count', { count: totalCount })}
                        </span>
                    </div>
                </div>
                {isOwnProfile && articles.length > 0 ? (
                    <Link
                        href="/writing/new"
                        className="inline-flex min-h-11 items-center justify-center gap-2 self-start border border-[var(--platform-violet)] bg-[var(--platform-violet)] px-4 text-sm font-bold text-white transition-colors hover:bg-[var(--platform-violet-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-on-accent)] sm:self-auto"
                    >
                        <PenLine className="h-4 w-4" aria-hidden="true" />
                        {t('profile.writeArticle')}
                    </Link>
                ) : null}
            </header>

            {articles.length === 0 ? (
                <ProfileWritingEmptyState />
            ) : (
                <div
                    className={cn(
                        visibleJourneys.length > 0 &&
                            'grid lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.72fr)]',
                    )}
                >
                    <div className="min-w-0">
                        <ol aria-label={t('profile.listLabel')}>
                            {articles.map((article, index) => (
                                <ProfileArticleRow
                                    key={article.id}
                                    article={article}
                                    index={index}
                                    locale={locale}
                                />
                            ))}
                        </ol>
                        {totalCount > articles.length ? (
                            <div className="border-t border-[var(--platform-line-strong)] p-4 sm:p-6">
                                <Link
                                    href={`/articles?authorId=${encodeURIComponent(authorId)}`}
                                    className="inline-flex min-h-11 items-center gap-2 font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)]"
                                >
                                    {t('profile.viewAll')}
                                    <ArrowRight
                                        className="h-4 w-4 rtl:rotate-180"
                                        aria-hidden="true"
                                    />
                                </Link>
                            </div>
                        ) : null}
                    </div>

                    {visibleJourneys.length > 0 ? (
                        <aside
                            aria-labelledby="profile-writing-journey"
                            className="border-t border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4 lg:border-t-0 lg:border-s sm:p-6"
                        >
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-[var(--platform-violet)]">
                                <Sparkles className="h-4 w-4" aria-hidden="true" />
                                {t('profile.journey.eyebrow')}
                            </p>
                            <h3
                                id="profile-writing-journey"
                                className="mt-3 text-xl font-bold tracking-[-0.03em] text-[var(--platform-ink)]"
                            >
                                {t('profile.journey.title')}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                {t('profile.journey.count', {
                                    earned: earnedMilestoneCount,
                                    total: milestoneCount,
                                })}
                            </p>

                            <div className="mt-6 space-y-6">
                                {visibleJourneys.map((journey) => (
                                    <WritingJourneyTrack
                                        key={journey.id}
                                        journey={journey}
                                        isOwnProfile={isOwnProfile}
                                        achievementName={(code, fallback) =>
                                            tAchievements.has(`names.${code}`)
                                                ? tAchievements(`names.${code}`)
                                                : fallback
                                        }
                                    />
                                ))}
                            </div>

                            <Link
                                href="/achievements"
                                className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)]"
                            >
                                {t('profile.journey.viewAchievements')}
                                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                            </Link>
                        </aside>
                    ) : null}
                </div>
            )}
        </section>
    );
}

function ProfileArticleRow({
    article,
    index,
    locale,
}: {
    article: ArticleSummary;
    index: number;
    locale: Locale;
}) {
    const t = useTranslations('articles');
    const published = formatPublishedDate(article.publishedAt, locale);

    return (
        <li className="border-b border-[var(--platform-line)] last:border-b-0">
            <Link
                href={`/articles/${article.slug}`}
                locale={article.language}
                className="group grid min-h-32 grid-cols-[2rem_minmax(0,1fr)] items-start gap-4 p-4 transition-colors hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[var(--platform-coral)] sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center sm:p-6"
            >
                <span className="font-mono text-xs font-bold tabular-nums text-[var(--platform-violet)]">
                    {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]">
                        <span>
                            {article.kind === 'PROBLEM_EDITORIAL'
                                ? t('kinds.problemEditorial')
                                : t('kinds.general')}
                        </span>
                        {article.problem ? (
                            <span className="font-mono text-[var(--platform-violet)]">
                                #{article.problem.id}
                            </span>
                        ) : null}
                        {published ? (
                            <time
                                dateTime={article.publishedAt ?? undefined}
                                className="inline-flex items-center gap-1.5 normal-case tracking-normal"
                            >
                                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                                {published}
                            </time>
                        ) : null}
                    </div>
                    <h3
                        className="mt-2 text-pretty text-lg font-bold tracking-[-0.02em] text-[var(--platform-ink)] transition-colors group-hover:text-[var(--platform-violet-strong)] dark:group-hover:text-[var(--platform-violet)] sm:text-xl"
                        dir="auto"
                    >
                        {article.title}
                    </h3>
                    <p
                        className="mt-2 line-clamp-2 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]"
                        dir="auto"
                    >
                        {article.excerpt}
                    </p>
                </div>
                <span className="hidden h-11 w-11 place-items-center border border-[var(--platform-line-strong)] text-[var(--platform-violet)] transition-colors group-hover:border-[var(--platform-violet)] group-hover:bg-[var(--platform-violet)] group-hover:text-white dark:group-hover:text-[var(--platform-on-accent)] sm:grid">
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </span>
            </Link>
        </li>
    );
}

function WritingJourneyTrack({
    journey,
    isOwnProfile,
    achievementName,
}: {
    journey: ArticleAchievementTrack;
    isOwnProfile: boolean;
    achievementName: (code: string, fallback: string) => string;
}) {
    const t = useTranslations('articles');
    const pathLabelId = useId();
    const milestoneNameId = useId();
    const milestone = journey.displayMilestone!;
    const Icon = journey.id === 'articles' ? BookOpenCheck : Lightbulb;
    const pathLabel =
        journey.id === 'articles'
            ? t('profile.journey.articlePath')
            : t('profile.journey.editorialPath');
    const milestoneLabel = journey.isComplete
        ? t('profile.journey.pathComplete')
        : isOwnProfile
          ? t('profile.journey.nextMilestone')
          : t('profile.journey.highestMilestone');

    return (
        <div>
            <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-violet)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <p
                        id={pathLabelId}
                        className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]"
                    >
                        {pathLabel}
                    </p>
                    <p
                        id={milestoneNameId}
                        className="mt-1 text-sm font-bold text-[var(--platform-ink)]"
                        dir="auto"
                    >
                        {achievementName(milestone.achievement.code, milestone.achievement.name)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--platform-ink-muted)]">
                        {milestoneLabel}
                    </p>
                </div>
                {milestone.isEarned ? (
                    <span className="grid h-7 w-7 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)]">
                        <Check className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">{t('profile.journey.earned')}</span>
                    </span>
                ) : null}
            </div>
            <MilestoneProgress
                milestone={milestone}
                labelledBy={`${pathLabelId} ${milestoneNameId}`}
            />
        </div>
    );
}

function MilestoneProgress({
    milestone,
    labelledBy,
}: {
    milestone: ArticleAchievementMilestone;
    labelledBy: string;
}) {
    const t = useTranslations('articles');
    const progressLabel = t('profile.journey.progress', {
        current: milestone.currentValue,
        target: milestone.targetValue,
    });

    return (
        <div className="mt-3">
            <div className="flex items-center justify-between gap-3 font-mono text-xs tabular-nums text-[var(--platform-ink-muted)]">
                <span>{progressLabel}</span>
                <span>{Math.round(milestone.percentComplete)}%</span>
            </div>
            <div
                className="mt-2 h-2 overflow-hidden bg-[var(--platform-line)]"
                role="progressbar"
                aria-labelledby={labelledBy}
                aria-valuemin={0}
                aria-valuemax={milestone.targetValue}
                aria-valuenow={Math.min(milestone.currentValue, milestone.targetValue)}
                aria-valuetext={`${progressLabel}, ${Math.round(milestone.percentComplete)}%`}
            >
                <span
                    className="block h-full bg-[var(--platform-violet)] transition-[width] duration-200 motion-reduce:transition-none"
                    style={{ width: `${milestone.percentComplete}%` }}
                    aria-hidden="true"
                />
            </div>
        </div>
    );
}

function ProfileWritingEmptyState() {
    const t = useTranslations('articles');

    return (
        <div className="grid min-h-64 place-items-center p-6 text-center sm:p-10">
            <div className="max-w-lg">
                <span className="mx-auto grid h-14 w-14 place-items-center border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-[var(--platform-violet)]">
                    <FilePenLine className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-bold tracking-[-0.025em] text-[var(--platform-ink)]">
                    {t('profile.emptyOwnTitle')}
                </h3>
                <p className="mx-auto mt-2 max-w-[55ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                    {t('profile.emptyOwnDescription')}
                </p>
                <Link
                    href="/writing/new"
                    className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-5 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-citron)] transition-colors hover:bg-[var(--platform-violet-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-on-accent)]"
                >
                    <PenLine className="h-4 w-4" aria-hidden="true" />
                    {t('profile.startWriting')}
                </Link>
            </div>
        </div>
    );
}

function formatPublishedDate(value: string | null, locale: Locale): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Europe/Bucharest',
    }).format(date);
}
