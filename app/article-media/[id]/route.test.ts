import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), fetch: vi.fn() }));

vi.mock('@/lib/auth', () => ({ getSession: mocks.getSession }));

import { GET } from '@/app/article-media/[id]/route';

const MEDIA_ID = '8e1327fe-5678-4abc-9abc-123456789012';
const STORAGE_URL = 'https://storage.example.test/signed/image.png?signature=secret';

function backendRedirect(
    visibility: 'public' | 'private' | string = 'public',
    location: string | null = STORAGE_URL,
) {
    const headers = new Headers({ 'x-article-media-visibility': visibility });
    if (location) headers.set('location', location);
    return new Response(null, { status: 307, headers });
}

function storedImage(contentType = 'image/png') {
    return new Response(new Uint8Array([137, 80, 78, 71]), {
        headers: {
            'content-type': contentType,
            'cache-control': 'public, max-age=31536000, immutable',
            etag: 'storage-etag',
        },
    });
}

async function request(id = MEDIA_ID) {
    return GET(new NextRequest(`https://platform.example/article-media/${id}`), {
        params: Promise.resolve({ id }),
    });
}

describe('article media proxy', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test';
        vi.stubGlobal('fetch', mocks.fetch);
    });

    it('serves public media through a validated two-hop fetch with a short revocable cache', async () => {
        mocks.getSession.mockResolvedValue(null);
        mocks.fetch
            .mockResolvedValueOnce(backendRedirect('public'))
            .mockResolvedValueOnce(storedImage());

        const response = await request();

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('image/png');
        expect(response.headers.get('x-content-type-options')).toBe('nosniff');
        expect(response.headers.get('cache-control')).toBe('public, max-age=60, must-revalidate');
        expect(response.headers.get('cache-control')).not.toContain('stale-while-revalidate');
        expect(response.headers.get('cache-control')).not.toContain('immutable');
        expect(response.headers.has('etag')).toBe(false);
        expect(mocks.fetch).toHaveBeenCalledTimes(2);
        expect(mocks.fetch.mock.calls[0]?.[1]).toMatchObject({ redirect: 'manual' });
        expect(String(mocks.fetch.mock.calls[1]?.[0])).toBe(STORAGE_URL);
        expect(mocks.fetch.mock.calls[1]?.[1]).toMatchObject({ redirect: 'error' });
    });

    it('uses the bearer only for backend authorization and never forwards it to storage', async () => {
        mocks.getSession.mockResolvedValue({ accessToken: 'editor-token' });
        mocks.fetch
            .mockResolvedValueOnce(backendRedirect('private'))
            .mockResolvedValueOnce(storedImage('image/jpeg'));

        const response = await request();

        const backendHeaders = new Headers(mocks.fetch.mock.calls[0]?.[1]?.headers);
        const storageHeaders = new Headers(mocks.fetch.mock.calls[1]?.[1]?.headers);
        expect(backendHeaders.get('authorization')).toBe('Bearer editor-token');
        expect(storageHeaders.has('authorization')).toBe(false);
        expect(response.headers.get('cache-control')).toBe('private, no-store');
    });

    it('retries an expired bearer anonymously before fetching published storage', async () => {
        mocks.getSession.mockResolvedValue({ accessToken: 'expired-token' });
        mocks.fetch
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(backendRedirect('public'))
            .mockResolvedValueOnce(storedImage());

        const response = await request();

        expect(response.status).toBe(200);
        expect(mocks.fetch).toHaveBeenCalledTimes(3);
        expect(new Headers(mocks.fetch.mock.calls[0]?.[1]?.headers).get('authorization')).toBe(
            'Bearer expired-token',
        );
        expect(new Headers(mocks.fetch.mock.calls[1]?.[1]?.headers).has('authorization')).toBe(
            false,
        );
        expect(new Headers(mocks.fetch.mock.calls[2]?.[1]?.headers).has('authorization')).toBe(
            false,
        );
        expect(response.headers.get('cache-control')).toBe('public, max-age=60, must-revalidate');
    });

    it('rejects malformed identifiers before calling the backend', async () => {
        const response = await request('8e1327fe-not-a-uuid');

        expect(response.status).toBe(404);
        expect(mocks.fetch).not.toHaveBeenCalled();
    });

    it('hides backend authorization and path-binding errors without a storage fetch', async () => {
        mocks.getSession.mockResolvedValue(null);
        mocks.fetch.mockResolvedValue(new Response(null, { status: 400 }));

        expect((await request()).status).toBe(404);
        expect(mocks.fetch).toHaveBeenCalledOnce();
    });

    it.each([
        ['missing visibility', backendRedirect('', STORAGE_URL)],
        ['unknown visibility', backendRedirect('shared', STORAGE_URL)],
        ['missing location', backendRedirect('public', null)],
        ['insecure location', backendRedirect('public', 'http://storage.example/image.png')],
        [
            'credentialed location',
            backendRedirect(
                'public',
                'https://placeholder-user:placeholder-password@storage.example/image.png',
            ),
        ],
        ['non-redirect response', storedImage()],
    ])('rejects a malformed backend handoff: %s', async (_label, upstream) => {
        mocks.getSession.mockResolvedValue(null);
        mocks.fetch.mockResolvedValue(upstream);

        expect((await request()).status).toBe(502);
        expect(mocks.fetch).toHaveBeenCalledOnce();
    });

    it('allows loopback HTTP signed storage only outside production', async () => {
        const localStorage = 'http://127.0.0.1:4566/bucket/image.png?signature=local';
        mocks.getSession.mockResolvedValue(null);
        mocks.fetch
            .mockResolvedValueOnce(backendRedirect('public', localStorage))
            .mockResolvedValueOnce(storedImage());

        expect((await request()).status).toBe(200);
        expect(String(mocks.fetch.mock.calls[1]?.[0])).toBe(localStorage);

        vi.stubEnv('NODE_ENV', 'production');
        mocks.fetch.mockReset();
        mocks.fetch.mockResolvedValue(backendRedirect('public', localStorage));
        expect((await request()).status).toBe(502);
        vi.unstubAllEnvs();
    });

    it('refuses non-image storage content', async () => {
        mocks.getSession.mockResolvedValue(null);
        mocks.fetch.mockResolvedValueOnce(backendRedirect('public')).mockResolvedValueOnce(
            new Response('<script>alert(1)</script>', {
                headers: { 'content-type': 'text/html' },
            }),
        );

        expect((await request()).status).toBe(502);
    });
});
