import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    ARTICLE_INVITATION_REDEEM_COOKIE,
    articleInvitationRedeemCookiePath,
    getArticleInvitationHandle,
} from '@/lib/articles/invitation-session';

const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock('@/lib/auth', () => ({ getSession: mocks.getSession }));

import { POST } from './route';

describe('stored article invitation redemption', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test';
        mocks.getSession.mockResolvedValue({ accessToken: 'access-token' });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('binds the displayed invitation to its cookie and clears it after redemption', async () => {
        const token = 'a-secret-token';
        const handle = await getArticleInvitationHandle(token);
        const upstream = vi.fn().mockResolvedValue(Response.json({ id: 42, slug: 'safe-draft' }));
        vi.stubGlobal('fetch', upstream);
        const request = new NextRequest(
            `https://platform.olimpiada-ai.ro/api/article-invitations/${handle}/redeem`,
            {
                method: 'POST',
                headers: { origin: 'https://platform.olimpiada-ai.ro' },
            },
        );
        request.cookies.set(ARTICLE_INVITATION_REDEEM_COOKIE, token);

        const response = await POST(request, { params: Promise.resolve({ handle }) });

        expect(response.status).toBe(200);
        expect(upstream).toHaveBeenCalledWith(
            new URL('https://api.example.test/me/article-invitations/redeem'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    authorization: 'Bearer access-token',
                    'content-type': 'application/json',
                }),
                body: JSON.stringify({ token }),
            }),
        );
        expect(response.headers.get('set-cookie')).toContain(
            `${ARTICLE_INVITATION_REDEEM_COOKIE}=`,
        );
        expect(response.headers.get('set-cookie')).toContain(
            `Path=${articleInvitationRedeemCookiePath(handle)}`,
        );
        expect(response.headers.get('set-cookie')).toContain(
            'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        );
    });

    it('cannot redeem a different tab invitation through a mismatched handle', async () => {
        const token = 'invitation-from-tab-b';
        const handleFromTabA = await getArticleInvitationHandle('invitation-from-tab-a');
        const request = new NextRequest(
            `https://platform.olimpiada-ai.ro/api/article-invitations/${handleFromTabA}/redeem`,
            { method: 'POST' },
        );
        request.cookies.set(ARTICLE_INVITATION_REDEEM_COOKIE, token);

        const response = await POST(request, {
            params: Promise.resolve({ handle: handleFromTabA }),
        });

        expect(response.status).toBe(410);
    });
});
