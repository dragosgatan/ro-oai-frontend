import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_APPEARANCE } from '@/lib/appearance';
import {
    APPEARANCE_REQUEST_TIMEOUT_MS,
    getServerAppearancePreferences,
} from '@/lib/appearance-server';

describe('server appearance loading', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test/';
    });

    it('uses defaults without an authenticated session', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch');
        await expect(getServerAppearancePreferences(null)).resolves.toEqual(DEFAULT_APPEARANCE);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('loads the account preference without exposing profile data', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ uiTheme: 'onia-v1', colorMode: 'dark' }), {
                status: 200,
            }),
        );

        await expect(
            getServerAppearancePreferences({ accessToken: 'token' } as never),
        ).resolves.toEqual({ uiTheme: 'onia-v1', colorMode: 'dark' });
        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.example.test/profile/preferences/appearance',
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer token' }),
                cache: 'no-store',
            }),
        );
        expect(APPEARANCE_REQUEST_TIMEOUT_MS).toBeLessThanOrEqual(1_500);
    });

    it('falls back for unavailable or malformed responses', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ uiTheme: 'unknown', colorMode: 'sepia' }), {
                status: 200,
            }),
        );
        await expect(
            getServerAppearancePreferences({ accessToken: 'token' } as never),
        ).resolves.toEqual(DEFAULT_APPEARANCE);
    });
});
