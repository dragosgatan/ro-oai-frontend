import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getClientSession: vi.fn(),
    handleLogout: vi.fn(),
    fetch: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
    getSession: mocks.getClientSession,
}));

vi.mock('@/lib/auth', () => ({
    getSession: vi.fn(),
    handleLogout: mocks.handleLogout,
}));

vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}));

import { fetchApi } from '@/lib/api';

const API_URL = 'https://api.example.test/profile';

describe('fetchApi client authentication recovery', () => {
    beforeEach(() => {
        mocks.getClientSession.mockReset();
        mocks.handleLogout.mockReset();
        mocks.fetch.mockReset();
        vi.stubGlobal('fetch', mocks.fetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('shares one non-broadcast session lookup across concurrent requests', async () => {
        let resolveSession!: (session: any) => void;
        mocks.getClientSession.mockReturnValue(
            new Promise((resolve) => {
                resolveSession = resolve;
            }),
        );
        mocks.fetch.mockResolvedValue(new Response('{}', { status: 200 }));

        const firstRequest = fetchApi(API_URL, { method: 'POST' });
        const secondRequest = fetchApi(API_URL, { method: 'POST' });

        await vi.waitFor(() => expect(mocks.getClientSession).toHaveBeenCalledOnce());
        resolveSession({ accessToken: 'access-1' });
        await Promise.all([firstRequest, secondRequest]);

        expect(mocks.getClientSession).toHaveBeenCalledWith({ broadcast: false });
        expect(mocks.fetch).toHaveBeenCalledTimes(2);
    });

    it('does not retry or log out an anonymous visitor after a 401', async () => {
        mocks.getClientSession.mockResolvedValue(null);
        mocks.fetch.mockResolvedValue(new Response('', { status: 401 }));

        const response = await fetchApi(API_URL, { method: 'POST' });

        expect(response.status).toBe(401);
        expect(mocks.fetch).toHaveBeenCalledOnce();
        expect(mocks.handleLogout).not.toHaveBeenCalled();
    });

    it('preserves an explicit request language instead of replacing it with browser state', async () => {
        mocks.getClientSession.mockResolvedValue({ accessToken: 'access-1' });
        mocks.fetch.mockResolvedValue(new Response('{}', { status: 200 }));

        await fetchApi(API_URL, {
            method: 'POST',
            headers: { 'accept-language': 'en' },
        });

        const headers = new Headers(mocks.fetch.mock.calls[0]?.[1]?.headers);
        expect(headers.get('accept-language')).toBe('en');
    });

    it('rechecks the session, retries once, and stops after a second 401', async () => {
        mocks.getClientSession
            .mockResolvedValueOnce({ accessToken: 'expired-access' })
            .mockResolvedValueOnce({ accessToken: 'refreshed-access' });
        mocks.fetch
            .mockResolvedValueOnce(new Response('', { status: 401 }))
            .mockResolvedValueOnce(new Response('', { status: 401 }));
        mocks.handleLogout.mockResolvedValue(undefined);

        const response = await fetchApi(API_URL, { method: 'POST' });

        expect(response.status).toBe(401);
        expect(mocks.fetch).toHaveBeenCalledTimes(2);
        expect(mocks.getClientSession).toHaveBeenCalledTimes(2);
        expect(mocks.handleLogout).toHaveBeenCalledOnce();

        const firstHeaders = new Headers(mocks.fetch.mock.calls[0]?.[1]?.headers);
        const retryHeaders = new Headers(mocks.fetch.mock.calls[1]?.[1]?.headers);
        expect(firstHeaders.get('authorization')).toBe('Bearer expired-access');
        expect(retryHeaders.get('authorization')).toBe('Bearer refreshed-access');
    });
});
