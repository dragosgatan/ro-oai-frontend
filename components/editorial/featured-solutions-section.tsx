'use client';

import { TrophyIcon } from 'lucide-react';
import type { FeaturedSolutionResponse } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { FeaturedSolutionCard } from './featured-solution-card';
import { sortFeaturedSolutionsByRank } from './featured-solutions-utils';

type FeaturedSolutionsSectionProps = {
    solutions: FeaturedSolutionResponse[];
};

/**
 * FeaturedSolutionsSection displays featured solutions from top performers,
 * ordered by competition rank (best rank first).
 *
 * The section is only rendered when there are solutions to display.
 *
 * Requirements: 7.1, 7.4
 *
 * Property 15: Featured solutions section visibility
 * - Section is displayed if and only if there is at least one featured solution
 *
 * Property 17: Featured solutions ordered by rank
 * - Solutions are displayed in ascending order of competition rank (rank 1 first)
 */
export function FeaturedSolutionsSection({ solutions }: FeaturedSolutionsSectionProps) {
    const t = useTranslations('editorial');

    // Don't render if no solutions (Property 15: visibility based on existence)
    if (!solutions || solutions.length === 0) {
        return null;
    }

    // Sort featured solutions by rank - best rank first (Property 17: ordered by rank)
    const sortedSolutions = sortFeaturedSolutionsByRank(solutions);

    return (
        <section
            className="platform-panel overflow-hidden"
            aria-labelledby="featured-solutions-heading"
            data-testid="featured-solutions-section"
        >
            <header className="platform-toolbar flex items-center gap-3 px-4 py-4 sm:px-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                    <TrophyIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2
                    id="featured-solutions-heading"
                    className="text-lg font-bold tracking-[-0.03em] text-[var(--platform-ink)]"
                >
                    {t('featuredSolutions')}
                </h2>
            </header>
            <div
                className="divide-y divide-[var(--platform-line)]"
                data-testid="featured-solutions-list"
            >
                {sortedSolutions.map((solution) => (
                    <FeaturedSolutionCard key={solution.id} solution={solution} />
                ))}
            </div>
        </section>
    );
}
