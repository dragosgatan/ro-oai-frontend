import { NextRequest, NextResponse } from 'next/server';

import {
    ARTICLE_INVITATION_REDEEM_COOKIE,
    articleInvitationRedeemCookiePath,
    getArticleInvitationHandle,
    isArticleInvitationHandle,
} from '@/lib/articles/invitation-session';
import { getSession } from '@/lib/auth';

function apiError(status: number, errorCode: string, publicErrorMessage: string) {
    const response = NextResponse.json({ errorCode, publicErrorMessage }, { status });
    response.headers.set('Cache-Control', 'no-store, private');
    return response;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ handle: string }> },
) {
    const { handle } = await params;
    if (!isArticleInvitationHandle(handle)) {
        return apiError(410, 'INVITATION_UNAVAILABLE', 'This invitation is no longer available');
    }
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) {
        return apiError(403, 'INVALID_ORIGIN', 'The request origin is not allowed');
    }

    const token = request.cookies.get(ARTICLE_INVITATION_REDEEM_COOKIE)?.value;
    if (!token || (await getArticleInvitationHandle(token)) !== handle) {
        return apiError(410, 'INVITATION_UNAVAILABLE', 'This invitation is no longer available');
    }

    const session = await getSession();
    if (!session?.accessToken) {
        return apiError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
        return apiError(503, 'SERVICE_UNAVAILABLE', 'The invitation service is unavailable');
    }

    const upstream = await fetch(
        new URL('/me/article-invitations/redeem', `${baseUrl.replace(/\/$/, '')}/`),
        {
            method: 'POST',
            headers: {
                accept: 'application/json',
                authorization: `Bearer ${session.accessToken}`,
                'content-type': 'application/json',
            },
            body: JSON.stringify({ token }),
            cache: 'no-store',
        },
    );
    const body = await upstream.text();
    const response = new NextResponse(body, {
        status: upstream.status,
        headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
    });
    response.headers.set('Cache-Control', 'no-store, private');
    if (upstream.ok || upstream.status === 404 || upstream.status === 410) {
        response.cookies.set(ARTICLE_INVITATION_REDEEM_COOKIE, '', {
            expires: new Date(0),
            httpOnly: true,
            path: articleInvitationRedeemCookiePath(handle),
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production' || request.nextUrl.protocol === 'https:',
        });
    }
    return response;
}
