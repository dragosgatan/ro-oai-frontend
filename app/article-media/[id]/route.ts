import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';

const SAFE_MEDIA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);
const PUBLIC_CACHE_CONTROL = 'public, max-age=60, must-revalidate';
const PRIVATE_CACHE_CONTROL = 'private, no-store';

function errorResponse(status: number): NextResponse {
    const response = new NextResponse(null, { status });
    response.headers.set('Cache-Control', PRIVATE_CACHE_CONTROL);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
}

function safeSignedStorageUrl(value: string | null): URL | null {
    if (!value) return null;
    try {
        const url = new URL(value);
        if (url.username || url.password) return null;
        const loopbackHost = new Set(['localhost', '127.0.0.1', '::1', '[::1]']).has(url.hostname);
        const secure = url.protocol === 'https:';
        const localDevelopment =
            url.protocol === 'http:' && process.env.NODE_ENV !== 'production' && loopbackHost;
        if (!secure && !localDevelopment) return null;
        return url;
    } catch {
        return null;
    }
}

function backendErrorStatus(status: number): number {
    if (status === 400 || status === 401 || status === 403) return 404;
    if (status >= 500) return 503;
    return status === 404 ? 404 : 502;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!SAFE_MEDIA_ID.test(id)) return errorResponse(404);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) return errorResponse(503);
    const backendUrl = new URL(
        `/article-media/${encodeURIComponent(id)}`,
        `${baseUrl.replace(/\/$/, '')}/`,
    );

    let accessToken: string | undefined;
    try {
        accessToken = (await getSession())?.accessToken;
    } catch {
        // Published media remains available anonymously even if session storage
        // is temporarily unavailable. The backend still authorizes draft media.
    }

    const backendHeaders = new Headers({ accept: 'image/png,image/jpeg' });
    if (accessToken) backendHeaders.set('authorization', `Bearer ${accessToken}`);

    const requestBackend = () =>
        fetch(backendUrl, {
            headers: new Headers(backendHeaders),
            cache: 'no-store',
            redirect: 'manual',
        });

    let upstream: Response;
    try {
        upstream = await requestBackend();
    } catch {
        return errorResponse(503);
    }
    if (upstream.status === 401 && accessToken) {
        backendHeaders.delete('authorization');
        try {
            upstream = await requestBackend();
        } catch {
            return errorResponse(503);
        }
    }
    if (upstream.status !== 307) return errorResponse(backendErrorStatus(upstream.status));

    const visibility = upstream.headers.get('x-article-media-visibility');
    if (visibility !== 'public' && visibility !== 'private') return errorResponse(502);
    const storageUrl = safeSignedStorageUrl(upstream.headers.get('location'));
    if (!storageUrl) return errorResponse(502);

    let storageResponse: Response;
    try {
        // Signed object URLs are bearer credentials themselves. Never forward the
        // platform access token, cookies, or backend cache policy to storage.
        storageResponse = await fetch(storageUrl, {
            headers: { accept: 'image/png,image/jpeg' },
            cache: 'no-store',
            redirect: 'error',
        });
    } catch {
        return errorResponse(503);
    }
    if (!storageResponse.ok || !storageResponse.body) return errorResponse(502);

    const contentType = storageResponse.headers.get('content-type')?.split(';', 1)[0]?.trim();
    if (!contentType || !SAFE_IMAGE_TYPES.has(contentType)) return errorResponse(502);

    const responseHeaders = new Headers({
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': visibility === 'public' ? PUBLIC_CACHE_CONTROL : PRIVATE_CACHE_CONTROL,
    });
    const contentLength = storageResponse.headers.get('content-length');
    if (contentLength) responseHeaders.set('content-length', contentLength);

    return new NextResponse(storageResponse.body, { status: 200, headers: responseHeaders });
}
