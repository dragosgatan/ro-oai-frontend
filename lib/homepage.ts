import type { CompetitionUserListResponse, Problem } from '@/lib/types';
import { getCompetitionStatus, sortCompetitions } from '@/lib/competition-utils';

export type HomepageProblem = Omit<Problem, 'difficulty'> & {
    // The list endpoint currently returns uppercase values while the product
    // model uses title case. Keep that transport detail at the API boundary.
    difficulty: Problem['difficulty'] | Uppercase<Problem['difficulty']>;
};

const FIXTURE_SENTINEL = '[not a real competition]';
const CONFIGURED_EXCLUDED_COMPETITION_IDS = new Set(
    (process.env.HOMEPAGE_EXCLUDED_COMPETITION_IDS ?? '')
        .split(',')
        .map((value) => Number(value.trim()))
        .filter(Number.isFinite),
);

/**
 * Keeps obvious fixtures and smoke-test records out of the public homepage preview.
 * They remain available in the full competition archive, but never take over the
 * public homepage or suppress its learning and practice paths.
 */
export function isHomepageCompetition(competition: CompetitionUserListResponse): boolean {
    if (competition.disabled || CONFIGURED_EXCLUDED_COMPETITION_IDS.has(competition.id)) {
        return false;
    }

    const searchableName = [competition.name, competition.nameEn].filter(Boolean).join(' ');
    return !searchableName.toLowerCase().includes(FIXTURE_SENTINEL);
}

export function getOngoingCompetitions(
    competitions: CompetitionUserListResponse[],
    now: Date = new Date(),
): CompetitionUserListResponse[] {
    return sortCompetitions(competitions, now).filter(
        (competition) =>
            isHomepageCompetition(competition) &&
            getCompetitionStatus(competition.startTime, competition.endTime, now) === 'in_progress',
    );
}

export function getHomepageCompetitionPreview(
    competitions: CompetitionUserListResponse[],
    now: Date = new Date(),
    limit = 3,
): CompetitionUserListResponse[] {
    return sortCompetitions(competitions, now)
        .filter(isHomepageCompetition)
        .slice(0, Math.max(0, limit));
}

export function getHomepageCompetitionCount(
    loadedCompetitions: CompetitionUserListResponse[],
    totalElements: number,
): number {
    const excludedLoadedCount = loadedCompetitions.filter(
        (competition) => !isHomepageCompetition(competition),
    ).length;

    return Math.max(0, totalElements - excludedLoadedCount);
}

export function shouldUseHomepageCompetitionMode({
    publicOngoingCount,
    authoritativeCompetitionMode,
    competitionCatalogUnavailable,
}: {
    publicOngoingCount: number;
    authoritativeCompetitionMode: boolean;
    competitionCatalogUnavailable: boolean;
}): boolean {
    return (
        publicOngoingCount > 0 || (authoritativeCompetitionMode && competitionCatalogUnavailable)
    );
}

export function getNextCompetitionBoundary(
    competitions: CompetitionUserListResponse[],
    now: Date = new Date(),
): string | null {
    const nowMs = now.getTime();
    const nextBoundary = competitions
        .filter(isHomepageCompetition)
        .flatMap((competition) => [competition.startTime, competition.endTime])
        .map((value) => new Date(value))
        .filter((date) => Number.isFinite(date.getTime()) && date.getTime() > nowMs)
        .sort((a, b) => a.getTime() - b.getTime())[0];

    return nextBoundary?.toISOString() ?? null;
}
