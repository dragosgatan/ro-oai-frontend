import type { CompetitionType, CompetitionUserListResponse } from './types';

/**
 * Competition status derived from timestamps
 */
export type CompetitionStatus = 'future' | 'in_progress' | 'finished';

/**
 * Casual competitions reveal complete evaluator scores throughout the event.
 * Missing or unknown values intentionally retain the classic, score-hidden behavior.
 */
export function hasLiveFinalScores(competitionType: CompetitionType | null | undefined): boolean {
    return competitionType === 'CASUAL';
}

/**
 * Determines the status of a competition based on current time
 * @param startTime - ISO string of competition start time
 * @param endTime - ISO string of competition end time
 * @param now - Current date (optional, defaults to new Date())
 * @returns The competition status
 */
export function getCompetitionStatus(
    startTime: string,
    endTime: string,
    now: Date = new Date(),
): CompetitionStatus {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) return 'future';
    if (now > end) return 'finished';
    return 'in_progress';
}

/**
 * Competition type alias for sorting (highlighted is now part of CompetitionUserListResponse)
 * Kept for backwards compatibility with existing code
 */
export type CompetitionWithHighlight = CompetitionUserListResponse;

/**
 * Sorts competitions according to the following priority rules:
 * 1. First: Highlighted competitions (future or in_progress), sorted by start date descending
 * 2. Second: Non-highlighted future or in_progress competitions, sorted by start date descending
 * 3. Third: Finished competitions, sorted by start date descending
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 *
 * @param competitions - Array of competitions to sort
 * @param now - Current date (optional, defaults to new Date())
 * @returns Sorted array of competitions (new array, does not mutate input)
 */
export function sortCompetitions<T extends CompetitionWithHighlight>(
    competitions: T[],
    now: Date = new Date(),
): T[] {
    // Create a copy to avoid mutating the original array
    return [...competitions].sort((a, b) => {
        const aStart = new Date(a.startTime);
        const aEnd = new Date(a.endTime);
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);

        const aFinished = aEnd < now;
        const bFinished = bEnd < now;

        // Rule 1 & 3: Finished competitions go to the end
        if (aFinished !== bFinished) {
            return aFinished ? 1 : -1;
        }

        // Rule 3: For finished competitions, sort by start date descending (most recent first)
        if (aFinished && bFinished) {
            return bStart.getTime() - aStart.getTime();
        }

        // For active/future competitions:
        const aHighlighted = a.highlighted ?? false;
        const bHighlighted = b.highlighted ?? false;

        // Rule 1 & 2: Highlighted competitions come first
        if (aHighlighted !== bHighlighted) {
            return aHighlighted ? -1 : 1;
        }

        // Same highlight status: sort by start date descending (most recent first)
        return bStart.getTime() - aStart.getTime();
    });
}
