import { fetchApi } from '@/lib/api';
import {
    normalizeAppearance,
    type AppearancePreferences,
    type AppearancePreferencesUpdate,
} from '@/lib/appearance';

export const APPEARANCE_UPDATE_TIMEOUT_MS = 5_000;

const appearanceUrl = () =>
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/profile/preferences/appearance`;

export async function updateAppearancePreferences(
    update: AppearancePreferencesUpdate,
): Promise<AppearancePreferences> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), APPEARANCE_UPDATE_TIMEOUT_MS);

    try {
        const response = await fetchApi(appearanceUrl(), {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(update),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`appearance-update-failed:${response.status}`);
        }

        return normalizeAppearance(await response.json());
    } finally {
        clearTimeout(timeout);
    }
}
