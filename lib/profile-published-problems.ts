import { fetchApi } from '@/lib/api';
import type { Locale } from '@/lib/types';

export type ProfilePublishedProblem = {
    id: number;
    title: string;
};

export type ProfilePublishedProblemsResponse = {
    items: ProfilePublishedProblem[];
    totalElements: number;
};

/**
 * Fetch every public problem attributed to a profile.
 *
 * The backend applies profile privacy and problem visibility rules. Titles are
 * localized through Accept-Language so profile links match the active locale.
 */
export async function getProfilePublishedProblems(
    profileIdentifier: string,
    locale: Locale,
): Promise<ProfilePublishedProblemsResponse> {
    const response = await fetchApi(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/profile/${encodeURIComponent(profileIdentifier)}/published-problems`,
        {
            headers: {
                'Accept-Language': locale,
            },
        },
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch profile published problems: ${response.status} ${response.statusText}`,
        );
    }

    const payload = (await response.json()) as Partial<ProfilePublishedProblemsResponse>;
    const items = Array.isArray(payload.items)
        ? payload.items.filter(
              (problem): problem is ProfilePublishedProblem =>
                  typeof problem?.id === 'number' &&
                  Number.isFinite(problem.id) &&
                  typeof problem.title === 'string' &&
                  problem.title.trim().length > 0,
          )
        : [];
    const reportedTotal =
        typeof payload.totalElements === 'number' && Number.isFinite(payload.totalElements)
            ? Math.max(0, Math.trunc(payload.totalElements))
            : items.length;

    return {
        items,
        totalElements: Math.max(items.length, reportedTotal),
    };
}
