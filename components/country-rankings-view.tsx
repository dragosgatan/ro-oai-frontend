'use client';

import { AlertCircle, Award, Building2, Crown, Globe2, Medal, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { CountryFlag } from '@/components/country-flag';
import { PlatformEmptyState, PlatformSectionHeading } from '@/components/platform-page-shell';
import type { CountryRanking } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CountryRankingsViewProps {
    rankings: CountryRanking[];
    isLoading: boolean;
    error: Error | null;
    onRetry: () => void;
}

function RankMark({ rank }: { rank: number }) {
    const Icon = rank === 1 ? Crown : rank === 2 ? Medal : rank === 3 ? Award : null;

    return (
        <span
            className={cn(
                'inline-flex min-h-8 min-w-8 items-center justify-center gap-1 px-2 text-xs font-bold tabular-nums',
                rank === 1 && 'bg-[var(--platform-citron)] text-[var(--platform-on-accent)]',
                rank === 2 && 'bg-[var(--platform-paper-strong)] text-[var(--platform-ink)]',
                rank === 3 &&
                    'bg-[color-mix(in_oklch,var(--platform-coral)_22%,transparent)] text-[var(--platform-ink)]',
                rank > 3 &&
                    'border border-[var(--platform-line)] text-[var(--platform-ink-muted-strong)]',
            )}
        >
            {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            <span>#{rank}</span>
        </span>
    );
}

export function CountryRankingsView({
    rankings,
    isLoading,
    error,
    onRetry,
}: CountryRankingsViewProps) {
    const t = useTranslations('leaderboard');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const numberFormatter = new Intl.NumberFormat(locale);
    const scoreFormatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const heading = (
        <PlatformSectionHeading
            title={t('countryRankings.title')}
            description={t('countryRankings.subtitle')}
            action={
                !isLoading && !error ? (
                    <span className="text-sm font-semibold tabular-nums text-[var(--platform-ink-muted-strong)]">
                        {t('countryRankings.resultsCount', { count: rankings.length })}
                    </span>
                ) : undefined
            }
        />
    );

    if (isLoading) {
        return (
            <div className="space-y-6 sm:space-y-8" aria-busy="true">
                {heading}
                <CountryLoadingState />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6 sm:space-y-8">
                {heading}
                <PlatformEmptyState
                    icon={AlertCircle}
                    title={t('countryRankings.errorTitle')}
                    description={t('countryRankings.errorMessage')}
                    action={
                        <button
                            type="button"
                            onClick={onRetry}
                            className="inline-flex min-h-11 items-center justify-center bg-[var(--platform-ink)] px-5 text-sm font-semibold text-[var(--platform-paper)] transition-transform active:translate-y-px"
                        >
                            {tCommon('retry')}
                        </button>
                    }
                />
            </div>
        );
    }

    if (rankings.length === 0) {
        return (
            <div className="space-y-6 sm:space-y-8">
                {heading}
                <PlatformEmptyState
                    icon={Globe2}
                    title={t('countryRankings.noData')}
                    description={t('countryRankings.noDataDescription')}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            {heading}

            <section aria-labelledby="country-table-heading">
                <div className="platform-panel overflow-hidden">
                    <div className="flex items-center justify-between gap-4 border-b border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] px-4 py-3 sm:px-5">
                        <h3
                            id="country-table-heading"
                            className="font-semibold text-[var(--platform-ink)]"
                        >
                            {t('countryRankings.topCountries')}
                        </h3>
                        <span className="text-xs text-[var(--platform-ink-muted)]">
                            {t('countryRankings.resultsCount', { count: rankings.length })}
                        </span>
                    </div>
                    <div
                        className="max-h-[42rem] overflow-auto overscroll-contain scrollbar-thin"
                        role="region"
                        aria-labelledby="country-table-heading"
                        tabIndex={0}
                    >
                        <table className="w-full border-collapse text-sm text-[var(--platform-ink)]">
                            <thead className="sticky top-0 z-[1] bg-[var(--platform-paper-strong)]">
                                <tr className="border-b border-[var(--platform-line-strong)]">
                                    <th
                                        scope="col"
                                        className="h-12 w-16 px-3 text-start text-xs font-semibold text-[var(--platform-ink-muted-strong)]"
                                    >
                                        {t('rank')}
                                    </th>
                                    <th
                                        scope="col"
                                        className="h-12 min-w-36 px-3 text-start text-xs font-semibold text-[var(--platform-ink-muted-strong)] sm:px-4"
                                    >
                                        {t('countryRankings.country')}
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden h-12 px-4 text-end text-xs font-semibold text-[var(--platform-ink-muted-strong)] sm:table-cell"
                                    >
                                        {t('countryRankings.participants')}
                                    </th>
                                    <th
                                        scope="col"
                                        className="hidden h-12 px-4 text-end text-xs font-semibold text-[var(--platform-ink-muted-strong)] md:table-cell"
                                    >
                                        {t('countryRankings.institutions')}
                                    </th>
                                    <th
                                        scope="col"
                                        className="h-12 min-w-24 px-3 text-end text-xs font-semibold text-[var(--platform-ink-muted-strong)] sm:px-4"
                                    >
                                        {t('countryRankings.totalScore')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rankings.map((ranking) => (
                                    <tr
                                        key={ranking.countryCode}
                                        className={cn(
                                            'border-b border-[var(--platform-line)] last:border-b-0 hover:bg-[var(--platform-paper-strong)]',
                                            ranking.rank === 1 &&
                                                'bg-[color-mix(in_oklch,var(--platform-citron)_12%,transparent)]',
                                        )}
                                    >
                                        <td className="px-3 py-3 align-middle">
                                            <RankMark rank={ranking.rank} />
                                        </td>
                                        <td className="min-w-0 px-3 py-3 align-middle sm:px-4">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <CountryFlag
                                                    countryCode={ranking.countryCode}
                                                    countryName={ranking.countryName}
                                                    size="md"
                                                    showName={false}
                                                    className="shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold">
                                                        {ranking.countryName}
                                                    </p>
                                                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--platform-ink-muted)] sm:hidden">
                                                        <span className="inline-flex items-center gap-1">
                                                            <Users
                                                                className="h-3 w-3"
                                                                aria-hidden="true"
                                                            />
                                                            {numberFormatter.format(
                                                                ranking.totalParticipants,
                                                            )}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <Building2
                                                                className="h-3 w-3"
                                                                aria-hidden="true"
                                                            />
                                                            {numberFormatter.format(
                                                                ranking.institutionCount,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden px-4 py-3 text-end tabular-nums sm:table-cell">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                                {numberFormatter.format(ranking.totalParticipants)}
                                            </span>
                                        </td>
                                        <td className="hidden px-4 py-3 text-end tabular-nums md:table-cell">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Building2
                                                    className="h-3.5 w-3.5"
                                                    aria-hidden="true"
                                                />
                                                {numberFormatter.format(ranking.institutionCount)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-end font-semibold tabular-nums sm:px-4">
                                            {scoreFormatter.format(ranking.totalScore)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
}

function CountryLoadingState() {
    return (
        <div className="platform-panel overflow-hidden">
            <div className="border-b border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] px-4 py-4">
                <div className="h-4 w-44 animate-pulse bg-[var(--platform-line)] motion-reduce:animate-none" />
            </div>
            {Array.from({ length: 10 }).map((_, index) => (
                <div
                    key={index}
                    className="flex h-16 items-center gap-4 border-b border-[var(--platform-line)] px-4 last:border-b-0"
                >
                    <div className="h-7 w-10 animate-pulse bg-[var(--platform-paper-strong)] motion-reduce:animate-none" />
                    <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--platform-paper-strong)] motion-reduce:animate-none" />
                    <div className="h-4 flex-1 animate-pulse bg-[var(--platform-paper-strong)] motion-reduce:animate-none" />
                    <div className="h-4 w-24 animate-pulse bg-[var(--platform-paper-strong)] motion-reduce:animate-none" />
                </div>
            ))}
        </div>
    );
}
