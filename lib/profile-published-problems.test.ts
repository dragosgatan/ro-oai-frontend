import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetchApiMock } = vi.hoisted(() => ({
    fetchApiMock: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ fetchApi: fetchApiMock }));

import { getProfilePublishedProblems } from '@/lib/profile-published-problems';

function jsonResponse(payload: unknown, status = 200): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

describe('profile published problems API adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test';
    });

    it('requests the encoded profile route with the active locale', async () => {
        fetchApiMock.mockResolvedValue(
            jsonResponse({
                items: [
                    { id: 289, title: 'Grid Search' },
                    { id: 301, title: 'Newsroom' },
                ],
                totalElements: 2,
            }),
        );

        const result = await getProfilePublishedProblems('author/one', 'ro');

        expect(result).toEqual({
            items: [
                { id: 289, title: 'Grid Search' },
                { id: 301, title: 'Newsroom' },
            ],
            totalElements: 2,
        });
        expect(fetchApiMock).toHaveBeenCalledWith(
            'https://api.example.test/profile/author%2Fone/published-problems',
            { headers: { 'Accept-Language': 'ro' } },
        );
    });

    it('drops malformed entries and never reports fewer items than it received', async () => {
        fetchApiMock.mockResolvedValue(
            jsonResponse({
                items: [
                    { id: 289, title: 'Grid Search' },
                    { id: 'bad', title: 'Invalid' },
                    { id: 301, title: '   ' },
                ],
                totalElements: 0,
            }),
        );

        await expect(getProfilePublishedProblems('author-one', 'en')).resolves.toEqual({
            items: [{ id: 289, title: 'Grid Search' }],
            totalElements: 1,
        });
    });

    it('surfaces backend failures so the profile can render its error state', async () => {
        fetchApiMock.mockResolvedValue(jsonResponse({ message: 'Unavailable' }, 503));

        await expect(getProfilePublishedProblems('author-one', 'en')).rejects.toThrow(
            'Failed to fetch profile published problems: 503',
        );
    });
});
