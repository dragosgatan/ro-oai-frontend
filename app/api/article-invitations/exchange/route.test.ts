import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import {
    ARTICLE_INVITATION_PREVIEW_COOKIE,
    ARTICLE_INVITATION_REDEEM_COOKIE,
    getArticleInvitationHandle,
} from '@/lib/articles/invitation-session';

import { POST } from './route';

describe('fragment article invitation exchange', () => {
    it('moves a fragment bearer into handle-scoped HttpOnly cookies', async () => {
        const token = 'abcdefghijklmnopqrstuvwxyz_ABCDEFGH-123456';
        const handle = await getArticleInvitationHandle(token);
        const response = await POST(
            new NextRequest('https://platform.olimpiada-ai.ro/api/article-invitations/exchange', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    origin: 'https://platform.olimpiada-ai.ro',
                },
                body: JSON.stringify({ token, locale: 'ro' }),
            }),
        );

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            continuationPath: `/ro/writing/invitations/continue/${handle}`,
        });
        const cookieHeader = response.headers.get('set-cookie');
        expect(cookieHeader).toContain(`${ARTICLE_INVITATION_PREVIEW_COOKIE}=`);
        expect(cookieHeader).toContain(`${ARTICLE_INVITATION_REDEEM_COOKIE}=`);
        expect(cookieHeader).toContain('HttpOnly');
        expect(cookieHeader).toContain(`Path=/ro/writing/invitations/continue/${handle}`);
        expect(cookieHeader).toContain(`Path=/api/article-invitations/${handle}`);
        expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    });

    it('rejects invalid tokens and cross-origin requests without setting cookies', async () => {
        const invalid = await POST(
            new NextRequest('https://platform.olimpiada-ai.ro/api/article-invitations/exchange', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ token: 'short', locale: 'ro' }),
            }),
        );
        const crossOriginRequest = new NextRequest(
            'https://platform.olimpiada-ai.ro/api/article-invitations/exchange',
            {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    token: 'abcdefghijklmnopqrstuvwxyz_ABCDEFGH-123456',
                    locale: 'ro',
                }),
            },
        );
        crossOriginRequest.headers.set('origin', 'https://attacker.example');
        expect(crossOriginRequest.headers.get('origin')).toBe('https://attacker.example');
        const crossOrigin = await POST(crossOriginRequest);

        expect(invalid.status).toBe(400);
        expect(crossOrigin.status).toBe(403);
        expect(invalid.headers.get('set-cookie')).toBeNull();
        expect(crossOrigin.headers.get('set-cookie')).toBeNull();
    });
});
