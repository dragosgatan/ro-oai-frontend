import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

type PublicApiRequestInit = RequestInit & {
    next?: {
        revalidate?: number | false;
        tags?: string[];
    };
};

/**
 * Fetch a public API resource without resolving the authenticated session first.
 * Public ranking endpoints return the same representation for every participant,
 * so adding a bearer token only creates an avoidable session round trip.
 */
export function fetchPublicApi(
    input: string | URL,
    init: PublicApiRequestInit = {},
): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('accept', headers.get('accept') ?? 'application/json');

    return fetchWithTimeout(input, {
        ...init,
        headers,
    });
}
