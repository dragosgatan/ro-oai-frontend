import { cache } from 'react';

import { fetchApi } from '@/lib/api';

export type CurrentCompetitionState = {
    isAnyCompetitionOngoing: boolean;
    isProfileConfirmed: boolean;
    participantName: string | null;
    avatar: string | null;
    username: string | null;
};

/**
 * Canonical competition-mode state for the current request. React's request-scoped
 * cache lets the protected layout and homepage share the same authenticated call.
 */
export const getCurrentCompetitionState = cache(async (): Promise<CurrentCompetitionState> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const response = await fetchApi(`${baseUrl}/competitions/current/join`);

    if (!response.ok) {
        throw new Error(`Unable to load current competition state: ${response.status}`);
    }

    const data = (await response.json()) as Partial<CurrentCompetitionState>;

    return {
        isAnyCompetitionOngoing: Boolean(data.isAnyCompetitionOngoing),
        isProfileConfirmed: Boolean(data.isProfileConfirmed),
        participantName: data.participantName ?? null,
        avatar: data.avatar ?? null,
        username: data.username ?? null,
    };
});
