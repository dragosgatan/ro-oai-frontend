'use client';

import { Link } from '@/i18n/routing';
import { ArrowUpRight, BookOpenIcon, CodeIcon, TrophyIcon } from 'lucide-react';
import type { EditorialContribution } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { formatRankBadge } from './editorial-author-utils';

type EditorialContributionsSectionProps = {
    contributions: EditorialContribution[];
};

/**
 * EditorialContributionsSection displays a user's editorial contributions on their profile.
 * Shows competition name, rank badge, role, and code icon if source code was shared.
 *
 * Requirements: 8.1, 8.2, 8.5
 * - Displays "Editorial Contributions" section when user has contributions
 * - Shows competition name, user's rank, and link to editorial
 * - Indicates source code sharing with a code icon
 */
export function EditorialContributionsSection({
    contributions,
}: EditorialContributionsSectionProps) {
    const t = useTranslations('editorial');

    // Don't render if no contributions (Requirement 8.3)
    if (!contributions || contributions.length === 0) {
        return null;
    }

    return (
        <section
            className="platform-panel overflow-hidden bg-[var(--platform-paper)]"
            data-testid="editorial-contributions-section"
        >
            <div className="platform-toolbar flex flex-wrap items-end justify-between gap-4 px-4 py-4 sm:px-5">
                <div>
                    <div className="flex items-center gap-2">
                        <BookOpenIcon
                            className="h-5 w-5 text-[var(--platform-violet)]"
                            aria-hidden="true"
                        />
                        <h2 className="text-lg font-semibold tracking-[-0.025em] text-[var(--platform-ink)]">
                            {t('editorialContributions')}
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-[var(--platform-ink-muted)]">
                        {t('contributedTo')} {contributions.length}
                    </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-[var(--platform-ink-muted)]">
                    {contributions.length}
                </span>
            </div>
            <div className="divide-y divide-[var(--platform-line)]">
                {contributions.map((contribution, index) => (
                    <EditorialContributionItem
                        key={contribution.competitionId}
                        contribution={contribution}
                        index={index}
                    />
                ))}
            </div>
        </section>
    );
}

type EditorialContributionItemProps = {
    contribution: EditorialContribution;
    index: number;
};

/**
 * Individual contribution item showing competition details and link to editorial.
 */
function EditorialContributionItem({ contribution, index }: EditorialContributionItemProps) {
    const t = useTranslations('editorial');

    return (
        <Link
            href={contribution.editorialUrl}
            className="group grid min-h-20 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-[var(--platform-ink)] transition-colors hover:bg-[var(--platform-paper-strong)] sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:px-5"
            data-testid="editorial-contribution-item"
        >
            <span className="text-xs tabular-nums text-[var(--platform-ink-muted)]">
                {String(index + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
                <span
                    className="block truncate font-semibold group-hover:text-[var(--platform-violet)] group-hover:underline"
                    dir="auto"
                >
                    {contribution.competitionName}
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--platform-ink-muted)]">
                    {contribution.competitionRank != null ? (
                        <span
                            className="inline-flex items-center gap-1"
                            data-testid="contribution-rank-badge"
                        >
                            <TrophyIcon className="h-3 w-3" aria-hidden="true" />
                            {formatRankBadge(contribution.competitionRank)}
                        </span>
                    ) : null}
                    {contribution.role ? (
                        <span
                            className="border border-[var(--platform-line)] px-1.5 py-0.5"
                            dir="auto"
                        >
                            {contribution.role}
                        </span>
                    ) : null}
                    {contribution.hasSourceCode ? (
                        <span className="inline-flex items-center gap-1">
                            <CodeIcon
                                className="h-3.5 w-3.5"
                                data-testid="source-code-indicator"
                                aria-hidden="true"
                            />
                            {t('hasSourceCode')}
                        </span>
                    ) : null}
                </div>
            </div>
            <span className="inline-flex min-h-11 items-center gap-1.5 ps-2 text-xs font-semibold text-[var(--platform-violet)]">
                <span className="hidden sm:inline">{t('viewEditorial')}</span>
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </span>
        </Link>
    );
}
