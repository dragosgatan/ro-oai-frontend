import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    fetchWithTimeout: vi.fn(),
    signOut: vi.fn(),
    trackEvent: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
    signOut: mocks.signOut,
}));

vi.mock('next-auth/next', () => ({
    getServerSession: vi.fn(),
}));

vi.mock('next-auth/providers/keycloak', () => ({
    default: vi.fn((configuration) => ({ id: 'keycloak', ...configuration })),
}));

vi.mock('@/lib/analytics', () => ({
    analytics: { trackEvent: mocks.trackEvent },
    AnalyticsEvents: { LOGOUT: 'logout' },
}));

vi.mock('@/lib/fetch-with-timeout', () => ({
    fetchWithTimeout: mocks.fetchWithTimeout,
}));

import { authOptions, handleLogout } from '@/lib/auth';

const jwtCallback = authOptions.callbacks?.jwt as (...args: any[]) => Promise<any>;
const sessionCallback = authOptions.callbacks?.session as (...args: any[]) => Promise<any>;

function tokenWithSubject(subject: string): string {
    const payload = Buffer.from(JSON.stringify({ sub: subject })).toString('base64url');
    return `header.${payload}.signature`;
}

describe('authentication lifecycle hardening', () => {
    beforeEach(() => {
        mocks.fetchWithTimeout.mockReset();
        mocks.signOut.mockReset();
        mocks.trackEvent.mockReset();
        process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER = 'https://auth.example.test/realms/platform';
        process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID = 'frontend';
        process.env.KEYCLOAK_CLIENT_SECRET = 'public-test-placeholder';
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('clears a stale refresh error while the access token is still valid', async () => {
        const token = await jwtCallback({
            token: {
                accessToken: tokenWithSubject('participant-1'),
                refreshToken: 'refresh-1',
                expiresAt: Math.floor(Date.now() / 1000) + 600,
                error: 'RefreshAccessTokenError',
            },
            account: null,
        });

        expect(token.error).toBeUndefined();
    });

    it('clears an old error when Keycloak starts a new session', async () => {
        const token = await jwtCallback({
            token: { error: 'RefreshAccessTokenError' },
            account: {
                provider: 'keycloak',
                access_token: tokenWithSubject('participant-1'),
                refresh_token: 'new-refresh-token',
                expires_at: Math.floor(Date.now() / 1000) + 600,
            },
        });

        expect(token.error).toBeUndefined();
        expect(token.refreshToken).toBe('new-refresh-token');
    });

    it('shares a rotating refresh request and clears errors after success', async () => {
        let resolveRefresh!: (response: Response) => void;
        mocks.fetchWithTimeout.mockReturnValue(
            new Promise<Response>((resolve) => {
                resolveRefresh = resolve;
            }),
        );

        const expiredToken = {
            accessToken: tokenWithSubject('participant-1'),
            refreshToken: 'shared-refresh-token',
            expiresAt: Math.floor(Date.now() / 1000) - 60,
            error: 'RefreshAccessTokenError',
        };
        const firstRefresh = jwtCallback({ token: { ...expiredToken }, account: null });
        const secondRefresh = jwtCallback({ token: { ...expiredToken }, account: null });

        expect(mocks.fetchWithTimeout).toHaveBeenCalledOnce();
        resolveRefresh(
            new Response(
                JSON.stringify({
                    access_token: tokenWithSubject('participant-1'),
                    refresh_token: 'rotated-refresh-token',
                    expires_in: 300,
                }),
                { status: 200, headers: { 'content-type': 'application/json' } },
            ),
        );

        const [firstToken, secondToken] = await Promise.all([firstRefresh, secondRefresh]);
        expect(firstToken.error).toBeUndefined();
        expect(secondToken.error).toBeUndefined();
        expect(firstToken.refreshToken).toBe('rotated-refresh-token');
        expect(secondToken.refreshToken).toBe('rotated-refresh-token');
    });

    it('returns a safe session instead of throwing for a malformed access token', async () => {
        const session = await sessionCallback({
            session: { user: {}, expires: new Date(Date.now() + 60_000).toISOString() },
            token: {
                accessToken: 'not-a-jwt',
                sub: 'participant-fallback',
                expiresAt: Math.floor(Date.now() / 1000) + 60,
            },
        });

        expect(session.id).toBe('participant-fallback');
        expect(session.error).toBe('InvalidAccessToken');
    });

    it('coalesces concurrent logout requests into one navigation', async () => {
        const assign = vi.fn();
        vi.stubGlobal('window', {
            dataLayer: [],
            location: {
                pathname: '/ro/problems',
                origin: 'https://platform.example.test',
                assign,
            },
        });
        mocks.signOut.mockResolvedValue({ url: 'https://platform.example.test/ro' });

        const firstLogout = handleLogout('/ro/problems');
        const secondLogout = handleLogout('/ro/leaderboard');

        expect(secondLogout).toBe(firstLogout);
        await Promise.all([firstLogout, secondLogout]);
        expect(mocks.signOut).toHaveBeenCalledOnce();
        expect(assign).toHaveBeenCalledOnce();
    });
});
