import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ fetchApi: vi.fn() }));

vi.mock('@/lib/api', () => ({ fetchApi: mocks.fetchApi }));

import { APPEARANCE_UPDATE_TIMEOUT_MS, updateAppearancePreferences } from '@/lib/appearance-api';

describe('appearance API', () => {
    beforeEach(() => {
        mocks.fetchApi.mockReset();
        process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test';
    });

    afterEach(() => vi.useRealTimers());

    it('updates only the supplied appearance preference', async () => {
        mocks.fetchApi.mockResolvedValue(
            new Response(JSON.stringify({ uiTheme: 'onia-v1', colorMode: 'system' }), {
                status: 200,
            }),
        );

        await expect(updateAppearancePreferences({ uiTheme: 'onia-v1' })).resolves.toEqual({
            uiTheme: 'onia-v1',
            colorMode: 'system',
        });

        expect(mocks.fetchApi).toHaveBeenCalledWith(
            'https://api.example.test/profile/preferences/appearance',
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({ uiTheme: 'onia-v1' }),
            }),
        );
    });

    it('rejects unsuccessful responses', async () => {
        mocks.fetchApi.mockResolvedValue(new Response(null, { status: 400 }));
        await expect(updateAppearancePreferences({ colorMode: 'dark' })).rejects.toThrow(
            'appearance-update-failed:400',
        );
    });

    it('aborts a stalled update so the selector can recover', async () => {
        vi.useFakeTimers();
        mocks.fetchApi.mockImplementation(
            (_url: string, init?: RequestInit) =>
                new Promise<Response>((_resolve, reject) => {
                    init?.signal?.addEventListener('abort', () =>
                        reject(new DOMException('The operation was aborted.', 'AbortError')),
                    );
                }),
        );

        const request = updateAppearancePreferences({ colorMode: 'dark' });
        const rejection = expect(request).rejects.toMatchObject({ name: 'AbortError' });
        await vi.advanceTimersByTimeAsync(APPEARANCE_UPDATE_TIMEOUT_MS);

        await rejection;
    });
});
