import type { Session } from 'next-auth';

import {
    DEFAULT_APPEARANCE,
    normalizeAppearance,
    type AppearancePreferences,
} from '@/lib/appearance';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export const APPEARANCE_REQUEST_TIMEOUT_MS = 1_500;

export async function getServerAppearancePreferences(
    session: Session | null,
): Promise<AppearancePreferences> {
    const accessToken = session?.accessToken;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

    if (!accessToken || !baseUrl) return { ...DEFAULT_APPEARANCE };

    try {
        const response = await fetchWithTimeout(
            `${baseUrl}/profile/preferences/appearance`,
            {
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                cache: 'no-store',
            },
            APPEARANCE_REQUEST_TIMEOUT_MS,
        );

        if (!response.ok) return { ...DEFAULT_APPEARANCE };
        return normalizeAppearance(await response.json());
    } catch {
        return { ...DEFAULT_APPEARANCE };
    }
}
