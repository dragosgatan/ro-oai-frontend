'use client';

import { ArrowRight, ArrowUpRight, Trophy, UserRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';
import { getProblemContent } from '@/lib/problem-translations';
import { formatProblemAuthorNames } from '@/lib/problem-authors';
import type { Locale, Problem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ProblemListProps = {
    problems: Problem[];
    isLoading?: boolean;
    startIndex?: number;
    variant?: 'cards' | 'ledger';
};

const difficultyStyles: Record<string, { dot: string; label: string }> = {
    easy: {
        dot: 'bg-emerald-500',
        label: 'border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    },
    medium: {
        dot: 'bg-amber-500',
        label: 'border-amber-500/20 bg-amber-500/8 text-amber-700 dark:text-amber-300',
    },
    hard: {
        dot: 'bg-rose-500',
        label: 'border-rose-500/20 bg-rose-500/8 text-rose-700 dark:text-rose-300',
    },
};

const ledgerDifficultyStyles: Record<string, string> = {
    easy: 'bg-emerald-300 text-emerald-950',
    medium: 'bg-[var(--platform-citron)] text-[var(--platform-on-accent)]',
    hard: 'bg-rose-300 text-rose-950',
};

function ProblemListSkeleton({ variant }: { variant: 'cards' | 'ledger' }) {
    if (variant === 'ledger') {
        return (
            <div className="border-y border-[var(--platform-line-strong)]" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div
                        key={index}
                        className="grid min-h-44 grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-b border-[var(--platform-line)] px-3 py-5 last:border-b-0 sm:px-5"
                    >
                        <Skeleton className="h-5 w-7 rounded-sm" />
                        <div>
                            <Skeleton className="h-7 w-24 rounded-sm" />
                            <Skeleton className="mt-4 h-6 w-3/4 rounded-sm" />
                            <Skeleton className="mt-3 h-4 w-full rounded-sm" />
                            <Skeleton className="mt-2 h-4 w-4/5 rounded-sm" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-4 xl:grid-cols-2" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-7 w-24 rounded-md" />
                        <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                    <Skeleton className="mt-8 h-7 w-3/4" />
                    <Skeleton className="mt-3 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-5/6" />
                    <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ProblemList({
    problems,
    isLoading = false,
    startIndex = 0,
    variant = 'cards',
}: ProblemListProps) {
    const t = useTranslations('problems');
    const tCommon = useTranslations('common');
    const tAccessibility = useTranslations('accessibility');
    const tDifficulty = useTranslations('difficulty');
    const locale = useLocale() as Locale;

    if (isLoading) {
        return <ProblemListSkeleton variant={variant} />;
    }

    return (
        <div
            className={cn(
                variant === 'ledger'
                    ? 'border-y border-[var(--platform-line-strong)]'
                    : 'grid gap-4 xl:grid-cols-2',
            )}
            role="list"
            aria-label={t('availableProblems')}
        >
            {problems.map((problem, index) => {
                const difficultyKey = problem.difficulty.toLowerCase();
                const difficulty = difficultyStyles[difficultyKey] ?? {
                    dot: 'bg-muted-foreground',
                    label: 'border-border bg-muted text-muted-foreground',
                };
                const problemContent = getProblemContent(problem, locale);
                const problemAuthorNames = formatProblemAuthorNames(problem, locale);
                const lastAttemptedScore = problem.lastAttemptedScore;
                const hasScore = lastAttemptedScore !== null;

                if (variant === 'ledger') {
                    return (
                        <article
                            key={problem.id}
                            role="listitem"
                            className="border-b border-[var(--platform-line)] last:border-b-0"
                        >
                            <Link
                                href={`/problems/${problem.id}`}
                                className="group grid min-h-44 grid-cols-[2.5rem_minmax(0,1fr)_2.75rem] gap-x-3 px-3 py-5 text-[var(--platform-ink)] hover:bg-[var(--platform-paper-strong)] sm:grid-cols-[3rem_minmax(0,1fr)_3rem] sm:gap-x-5 sm:px-5 sm:py-6"
                                aria-label={`${t('problem')}: ${problemContent.title}, ${t('difficulty')}: ${tDifficulty(difficultyKey)}`}
                            >
                                <span
                                    className="pt-1 font-mono text-xs font-bold tabular-nums text-[var(--platform-violet)]"
                                    aria-hidden="true"
                                >
                                    {String(startIndex + index + 1).padStart(2, '0')}
                                </span>

                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={cn(
                                                'inline-flex min-h-7 items-center rounded-md px-2.5 text-xs font-bold',
                                                ledgerDifficultyStyles[difficultyKey] ??
                                                    'bg-[var(--platform-line)] text-[var(--platform-ink)]',
                                            )}
                                            aria-label={tAccessibility('difficultyLabel', {
                                                difficulty: tDifficulty(difficultyKey),
                                            })}
                                        >
                                            {tDifficulty(difficultyKey)}
                                        </span>
                                        <span
                                            className="h-2 w-2 bg-[var(--platform-coral)]"
                                            aria-hidden="true"
                                        />
                                        <span className="font-mono text-xs tabular-nums text-[var(--platform-ink-muted)]">
                                            #{problem.id}
                                        </span>
                                    </div>

                                    <h2 className="mt-3 text-pretty text-xl font-semibold leading-tight tracking-[-0.025em] sm:text-[1.35rem]">
                                        {problemContent.title}
                                    </h2>
                                    <p className="mt-2 line-clamp-2 max-w-3xl text-pretty text-sm leading-6 text-[var(--platform-ink-muted)]">
                                        {problemContent.shortDescription}
                                    </p>

                                    <div
                                        className="mt-4 flex flex-col gap-2 border-t border-[var(--platform-line)] pt-3 text-xs text-[var(--platform-ink-muted)] sm:flex-row sm:items-center sm:justify-between"
                                        role="group"
                                        aria-label={tAccessibility('problemStats')}
                                    >
                                        <span className="flex min-w-0 items-center gap-2">
                                            <UserRound
                                                className="h-3.5 w-3.5 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span className="truncate">
                                                {t('author')}:{' '}
                                                <strong className="font-semibold text-[var(--platform-ink)]">
                                                    {problemAuthorNames}
                                                </strong>
                                            </span>
                                        </span>
                                        <span className="flex shrink-0 items-center gap-2">
                                            <Trophy
                                                className={cn(
                                                    'h-3.5 w-3.5',
                                                    hasScore
                                                        ? 'text-amber-600 dark:text-amber-300'
                                                        : 'text-[var(--platform-ink-muted)]',
                                                )}
                                                aria-hidden="true"
                                            />
                                            <span>{t('yourBest')}:</span>
                                            <strong
                                                className={cn(
                                                    'font-mono font-bold tabular-nums',
                                                    hasScore
                                                        ? 'text-[var(--platform-violet)]'
                                                        : 'text-[var(--platform-ink-muted)]',
                                                )}
                                                aria-label={
                                                    hasScore
                                                        ? tAccessibility('lastAttemptLabel', {
                                                              score: lastAttemptedScore,
                                                          })
                                                        : tAccessibility('lastAttemptNone')
                                                }
                                            >
                                                {hasScore
                                                    ? lastAttemptedScore.toFixed(2)
                                                    : tCommon('na')}
                                            </strong>
                                        </span>
                                    </div>
                                </div>

                                <span className="flex h-11 w-11 items-center justify-center self-start bg-[var(--platform-violet)] text-white group-hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]">
                                    <ArrowRight
                                        className="h-5 w-5 rtl:rotate-180"
                                        aria-hidden="true"
                                    />
                                </span>
                                <span className="sr-only">{t('viewProblem')}</span>
                            </Link>
                        </article>
                    );
                }

                return (
                    <article key={problem.id} role="listitem" className="h-full">
                        <Link
                            href={`/problems/${problem.id}`}
                            className="group relative flex h-full min-h-[16rem] flex-col overflow-hidden rounded-2xl border border-border/75 bg-card p-5 shadow-[0_18px_55px_-44px_hsl(var(--foreground)/0.55)] transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_24px_65px_-42px_hsl(var(--primary)/0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-6"
                            aria-label={`${t('problem')}: ${problemContent.title}, ${t('difficulty')}: ${tDifficulty(difficultyKey)}`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-2.5">
                                    <span
                                        className="font-mono text-xs font-semibold tabular-nums text-muted-foreground/75"
                                        aria-hidden="true"
                                    >
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold',
                                            difficulty.label,
                                        )}
                                        aria-label={tAccessibility('difficultyLabel', {
                                            difficulty: tDifficulty(difficultyKey),
                                        })}
                                    >
                                        <span
                                            className={cn(
                                                'h-1.5 w-1.5 rounded-full',
                                                difficulty.dot,
                                            )}
                                            aria-hidden="true"
                                        />
                                        {tDifficulty(difficultyKey)}
                                    </span>
                                </div>
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-[transform,color,border-color,background-color] duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground">
                                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                                </span>
                            </div>

                            <div className="mt-7">
                                <h2 className="text-xl font-semibold leading-tight tracking-[-0.02em] text-card-foreground text-pretty transition-colors duration-200 group-hover:text-primary sm:text-[1.35rem]">
                                    {problemContent.title}
                                </h2>
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground text-pretty">
                                    {problemContent.shortDescription}
                                </p>
                            </div>

                            <div
                                className="mt-auto flex flex-col gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
                                role="group"
                                aria-label={tAccessibility('problemStats')}
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <UserRound
                                        className="h-3.5 w-3.5 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <span className="truncate">
                                        {t('author')}:{' '}
                                        <strong className="font-medium text-foreground">
                                            {problemAuthorNames}
                                        </strong>
                                    </span>
                                </span>
                                <span className="flex shrink-0 items-center gap-2">
                                    <Trophy
                                        className={cn(
                                            'h-3.5 w-3.5',
                                            hasScore
                                                ? 'text-amber-500'
                                                : 'text-muted-foreground/70',
                                        )}
                                        aria-hidden="true"
                                    />
                                    <span>{t('yourBest')}:</span>
                                    <strong
                                        className={cn(
                                            'font-mono font-semibold tabular-nums',
                                            hasScore ? 'text-primary' : 'text-muted-foreground',
                                        )}
                                        aria-label={
                                            hasScore
                                                ? tAccessibility('lastAttemptLabel', {
                                                      score: lastAttemptedScore,
                                                  })
                                                : tAccessibility('lastAttemptNone')
                                        }
                                    >
                                        {hasScore ? lastAttemptedScore.toFixed(2) : tCommon('na')}
                                    </strong>
                                </span>
                            </div>
                            <span className="sr-only">{t('viewProblem')}</span>
                        </Link>
                    </article>
                );
            })}
        </div>
    );
}
