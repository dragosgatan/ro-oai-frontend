import { describe, expect, it } from 'vitest';

import {
    containsArticleInvitationSecret,
    REDACTED_INVITATION_VALUE,
    shouldSuppressInvitationAnalytics,
    scrubOrDropSensitiveEvent,
    scrubSensitiveValues,
} from '@/lib/monitoring/sensitive-data';

describe('sensitive telemetry scrubbing', () => {
    it('detects raw and callback-encoded invitation URLs', () => {
        expect(containsArticleInvitationSecret('/ro/writing/invitations/a-secret-token')).toBe(
            true,
        );
        expect(
            containsArticleInvitationSecret(
                '/login?callbackUrl=%2Fro%2Fwriting%2Finvitations%2Fa-secret-token',
            ),
        ).toBe(true);
        expect(containsArticleInvitationSecret('/ro/writing/invitations/continue')).toBe(false);
        expect(
            containsArticleInvitationSecret('/ro/writing/invitations/continue/public-handle'),
        ).toBe(true);
        expect(
            containsArticleInvitationSecret(
                'https://api.example/article-invitations/a-secret-token',
            ),
        ).toBe(true);
        expect(
            containsArticleInvitationSecret(
                'https%3A%2F%2Fapi.example%2Farticle-invitations%2Fa-secret-token',
            ),
        ).toBe(true);
        expect(
            containsArticleInvitationSecret(
                'POST https://api.example/me/article-invitations/a-secret-token/redeem',
            ),
        ).toBe(true);
        expect(
            containsArticleInvitationSecret('/admin/article-invitations/a-safe-admin-uuid'),
        ).toBe(false);
        expect(
            containsArticleInvitationSecret(
                '/login?callbackUrl=%2Fro%2Fcompetition-invitations%2Fcontinue%2Fsafe-handle',
            ),
        ).toBe(true);
        expect(
            containsArticleInvitationSecret(
                'https://platform.example/competition-invitations/a-legacy-raw-token',
            ),
        ).toBe(true);
        expect(
            containsArticleInvitationSecret('/api/competition-invitations/safe-handle/redeem'),
        ).toBe(true);
        expect(containsArticleInvitationSecret('/api/competition-invitations/exchange')).toBe(true);
        expect(
            containsArticleInvitationSecret(
                '/ro/competition-invitations/accept#token=a-secret-token',
            ),
        ).toBe(true);
        expect(
            containsArticleInvitationSecret('/competition-invitations/accept?token=a-secret-token'),
        ).toBe(true);
        expect(containsArticleInvitationSecret('/competition-invitations/preview')).toBe(false);
        expect(containsArticleInvitationSecret('/competition-invitations/accept')).toBe(false);
        expect(
            containsArticleInvitationSecret(
                '/me/hosted-competitions/42/users/search?query=Ana%20Pop',
            ),
        ).toBe(true);
        expect(
            containsArticleInvitationSecret(
                'https%3A%2F%2Fapi.example%2Fme%2Fhosted-competitions%2F42%2Fusers%2Fsearch%3Fquery%3Duser-123',
            ),
        ).toBe(true);
    });

    it('redacts nested values and drops events whose request URL contains the secret', () => {
        expect(
            scrubSensitiveValues({ breadcrumb: '/ro/writing/invitations/a-secret-token' }),
        ).toEqual({ breadcrumb: REDACTED_INVITATION_VALUE });
        expect(
            scrubOrDropSensitiveEvent({
                request: { url: 'https://platform.example/ro/writing/invitations/a-secret-token' },
            }),
        ).toBeNull();
        expect(
            scrubOrDropSensitiveEvent({
                request: {
                    url: 'https://api.example/me/hosted-competitions/42/users/search?query=ana',
                },
            }),
        ).toBeNull();
        expect(
            scrubOrDropSensitiveEvent({
                request: {
                    url: 'https://platform.example/api/competition-invitations/exchange',
                    data: { token: 'raw-competition-invitation-token' },
                },
            }),
        ).toBeNull();
    });

    it('suppresses analytics on the competition invitation landing route before token exchange', () => {
        expect(shouldSuppressInvitationAnalytics('/ro/competition-invitations/accept')).toBe(true);
        expect(
            shouldSuppressInvitationAnalytics(
                '/ro/competition-invitations/accept',
                'https://platform.example/ro/competition-invitations/accept#token=raw-token',
            ),
        ).toBe(true);
        expect(shouldSuppressInvitationAnalytics('/ro/competitions')).toBe(false);
    });
});
