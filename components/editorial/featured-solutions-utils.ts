import type { FeaturedSolutionResponse } from '@/lib/types';

/**
 * Sort featured solutions by competition rank in ascending order.
 * Solutions without a rank are placed at the end.
 */
export function sortFeaturedSolutionsByRank(
    solutions: FeaturedSolutionResponse[],
): FeaturedSolutionResponse[] {
    return [...solutions].sort((a, b) => {
        if (a.competitionRank == null && b.competitionRank == null) return 0;
        if (a.competitionRank == null) return 1;
        if (b.competitionRank == null) return -1;
        return a.competitionRank - b.competitionRank;
    });
}

/** Return whether a featured-solutions section has content to display. */
export function shouldShowFeaturedSolutions(
    solutions: FeaturedSolutionResponse[] | undefined | null,
): boolean {
    return solutions != null && solutions.length > 0;
}
