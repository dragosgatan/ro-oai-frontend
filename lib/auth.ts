import { NextAuthOptions } from 'next-auth';
import { cache } from 'react';
import { signOut } from 'next-auth/react';
import { getServerSession } from 'next-auth/next';
import KeycloakProvider from 'next-auth/providers/keycloak';
import { analytics, AnalyticsEvents } from '@/lib/analytics';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { buildKeycloakLogoutUrl, buildKeycloakOidcEndpoint } from '@/lib/keycloak-urls';
import { getLocaleHomePath, getSafeReturnPath } from '@/lib/safe-navigation';

const AUTH_REFRESH_TIMEOUT_MS = 10_000;

type RefreshResult =
    | {
          ok: true;
          accessToken: string;
          expiresAt: number;
          refreshToken?: string;
      }
    | { ok: false };

const refreshRequests = new Map<string, Promise<RefreshResult>>();

function parseJwtSubject(token: unknown): string | undefined {
    if (typeof token !== 'string') return undefined;

    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return undefined;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        const bytes = Uint8Array.from(atob(paddedBase64), (character) => character.charCodeAt(0));
        const payload = JSON.parse(new TextDecoder().decode(bytes)) as { sub?: unknown };

        return typeof payload.sub === 'string' && payload.sub.length > 0 ? payload.sub : undefined;
    } catch {
        return undefined;
    }
}

async function requestAccessTokenRefresh(refreshToken: string): Promise<RefreshResult> {
    try {
        const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
        const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
        const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

        if (!issuer || !clientId || !clientSecret) {
            console.error('Unable to refresh access token: identity provider is not configured.');
            return { ok: false };
        }

        const tokenUrl = buildKeycloakOidcEndpoint(issuer, 'token');
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
        });

        const response = await fetchWithTimeout(
            tokenUrl,
            {
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            },
            AUTH_REFRESH_TIMEOUT_MS,
        );

        const refreshed = (await response.json().catch(() => null)) as Record<
            string,
            unknown
        > | null;
        if (!response.ok || !refreshed) {
            console.error(`Failed to refresh access token (HTTP ${response.status}).`);
            return { ok: false };
        }

        const accessToken = refreshed.access_token;
        const expiresIn = Number(refreshed.expires_in);
        if (
            typeof accessToken !== 'string' ||
            accessToken.length === 0 ||
            !Number.isFinite(expiresIn) ||
            expiresIn <= 0
        ) {
            console.error('Failed to refresh access token: invalid identity provider response.');
            return { ok: false };
        }

        const rotatedRefreshToken = refreshed.refresh_token;
        return {
            ok: true,
            accessToken,
            expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
            refreshToken:
                typeof rotatedRefreshToken === 'string' && rotatedRefreshToken.length > 0
                    ? rotatedRefreshToken
                    : undefined,
        };
    } catch (error) {
        console.error('Error refreshing access token:', error);
        return { ok: false };
    }
}

function refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
    const pendingRequest = refreshRequests.get(refreshToken);
    if (pendingRequest) return pendingRequest;

    const request = requestAccessTokenRefresh(refreshToken);
    refreshRequests.set(refreshToken, request);

    const clearRequest = () => {
        if (refreshRequests.get(refreshToken) === request) {
            refreshRequests.delete(refreshToken);
        }
    };
    void request.then(clearRequest, clearRequest);

    return request;
}

export const authOptions: NextAuthOptions = {
    providers: [
        KeycloakProvider({
            clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID!,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
            issuer: process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER!,
            authorization: {
                params: {
                    scope: 'openid email profile',
                },
            },
        }),
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async redirect({ url, baseUrl }) {
            // Handle relative URLs (e.g., /, /it, /ro/problems)
            if (url.startsWith('/')) {
                return `${baseUrl}${url}`;
            }
            // Handle absolute URLs from the same origin
            if (url.startsWith(baseUrl)) {
                return url;
            }
            // Default to base URL for external URLs (security)
            return baseUrl;
        },
        async jwt({ token, account }) {
            // Initial sign-in: persist tokens from provider
            if (account) {
                // Some providers return expires_at (seconds since epoch), others only expires_in
                const expiresAtSeconds =
                    (account as any).expires_at ??
                    Math.floor(Date.now() / 1000) + ((account as any).expires_in ?? 3600);

                token.accessToken = (account as any).access_token;
                token.refreshToken = (account as any).refresh_token;
                // NOTE: Do not store idToken in the JWT to keep cookie small
                token.expiresAt = expiresAtSeconds;
                token.provider = account.provider;
                delete token.error;
                return token;
            }

            // If we have no expiry info, just return the token to avoid crashing
            if (!token.expiresAt) {
                return token;
            }

            // If the token is still valid, return it
            const nowMs = Date.now();
            const expiresMs = (token.expiresAt as number) * 1000;
            // Add a small buffer (e.g., 30 seconds) to proactively refresh
            const refreshBufferMs = 30 * 1000;
            if (nowMs + refreshBufferMs < expiresMs) {
                if (typeof token.accessToken === 'string' && token.accessToken.length > 0) {
                    delete token.error;
                } else {
                    token.error = 'InvalidAccessToken';
                }
                return token;
            }

            // Token expired or about to expire, attempt refresh
            const refreshToken = token.refreshToken;
            if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
                token.error = 'RefreshAccessTokenError';
                return token;
            }

            const refreshed = await refreshAccessToken(refreshToken);
            if (!refreshed.ok) {
                token.error = 'RefreshAccessTokenError';
                return token;
            }

            token.accessToken = refreshed.accessToken;
            token.expiresAt = refreshed.expiresAt;
            // Some IdPs rotate refresh tokens
            if (refreshed.refreshToken) token.refreshToken = refreshed.refreshToken;
            delete token.error;
            // Do not persist id_token in JWT to reduce cookie size

            return token;
        },
        async session({ session, token }) {
            const accessToken =
                typeof token.accessToken === 'string' && token.accessToken.length > 0
                    ? token.accessToken
                    : undefined;
            const parsedSubject = parseJwtSubject(accessToken);
            const fallbackSubject =
                typeof token.sub === 'string' && token.sub.length > 0 ? token.sub : undefined;

            if (accessToken) session.accessToken = accessToken;
            else delete session.accessToken;
            // idToken intentionally omitted to keep cookie small
            if (typeof token.error === 'string') session.error = token.error;
            else delete session.error;

            if (typeof token.expiresAt === 'number' && Number.isFinite(token.expiresAt)) {
                session.expiresAt = token.expiresAt;
            } else {
                delete session.expiresAt;
            }

            const subject = parsedSubject ?? fallbackSubject;
            if (subject) session.id = subject;
            else delete session.id;

            if (accessToken && !parsedSubject && !session.error) {
                session.error = 'InvalidAccessToken';
            }

            return session;
        },
    },
    session: {
        strategy: 'jwt',
    },
    debug: process.env.NODE_ENV === 'development',
};

export const getSession = cache(async () => getServerSession(authOptions));

export async function getCurrentUser() {
    const session = await getSession();
    return session?.user;
}

export async function requireAuth() {
    const session = await getSession();
    if (!session) {
        throw new Error('Authentication required');
    }
    return session;
}

let logoutRequest: Promise<void> | null = null;

async function performLogout(returnTo?: string): Promise<void> {
    if (typeof window === 'undefined') {
        throw new Error('Logout can only be started in the browser.');
    }

    const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
    const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
    if (!issuer || !clientId) {
        throw new Error('The identity provider is not configured.');
    }

    const fallbackPath = getLocaleHomePath(window.location.pathname);
    const returnPath = getSafeReturnPath(returnTo, fallbackPath, window.location.origin);
    const postLogoutRedirect = new URL(returnPath, window.location.origin).toString();
    const logoutUrl = buildKeycloakLogoutUrl(issuer, clientId, postLogoutRedirect);

    // Build base event properties for GTM
    const baseEventProps = {
        timestamp: new Date().toISOString(),
        pagePath: window.location.pathname,
        isAuthenticated: true, // Still authenticated at this point
        method: 'keycloak',
    };

    // Track logout event via analytics tracker
    try {
        analytics.trackEvent({
            name: AnalyticsEvents.LOGOUT,
            properties: {
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('[Analytics] Failed to track logout event:', error);
    }

    // Push to GTM dataLayer
    try {
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: AnalyticsEvents.LOGOUT,
                category: 'authentication',
                ...baseEventProps,
            });
        }
    } catch (error) {
        console.error('[GTM] Failed to push logout event to dataLayer:', error);
    }

    // End NextAuth session but don't redirect yet
    await signOut({ redirect: false });

    // Then redirect user to Keycloak logout
    window.location.assign(logoutUrl.toString());
}

export function handleLogout(returnTo?: string): Promise<void> {
    if (logoutRequest) return logoutRequest;

    const request = performLogout(returnTo);
    logoutRequest = request;
    void request.catch(() => {
        if (logoutRequest === request) logoutRequest = null;
    });

    return request;
}

// ============================================================================
// Type Augmentation for Window
// ============================================================================

declare global {
    interface Window {
        dataLayer?: any[];
    }
}
