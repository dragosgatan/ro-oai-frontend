import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

/**
 * next-intl middleware for locale-based routing
 *
 * This middleware handles:
 * 1. Locale detection from URL path (e.g., /it/problems)
 * 2. Locale detection from Accept-Language header
 * 3. Locale detection from cookie (NEXT_LOCALE)
 * 4. Redirecting to appropriate locale version
 *
 * URL patterns:
 * - /problems -> redirects to Romanian (default locale)
 * - /ro/problems -> Romanian
 * - /en/problems -> English
 * - /it/problems -> Italian
 * - /de/problems -> German
 * All rendered routes retain an explicit locale prefix.
 */
const intlMiddleware = createMiddleware(routing);

function isPublicArticleDetailPath(pathname: string): boolean {
    const segments = pathname.split('/').filter(Boolean);
    return (
        segments.length === 3 &&
        routing.locales.includes(segments[0] as (typeof routing.locales)[number]) &&
        segments[1] === 'articles' &&
        Boolean(segments[2])
    );
}

export default function proxy(request: NextRequest) {
    // next-intl forwards request headers through its rewrite/next response. Put the
    // original URL on that request before invoking it so server layouts can make
    // route-aware access decisions. A response-only header is not visible through
    // Next's `headers()` API during rendering.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-url', request.url);

    const response = intlMiddleware(new NextRequest(request, { headers: requestHeaders }));

    if (isPublicArticleDetailPath(request.nextUrl.pathname)) {
        // Article bodies have their own author-selected content language. The generic
        // next-intl header would incorrectly advertise the same body as 30 translations;
        // the page metadata emits only the truthful content-language canonical instead.
        response.headers.delete('link');
    }

    return response;
}

export const config = {
    // Match all paths except:
    // - API routes (/api/*)
    // - Next.js internals (/_next/*)
    // - Static files (files with extensions like .ico, .png, .jpg, etc.)
    matcher: [
        // Match all pathnames except for
        // - … if they start with `/api`, `/_next` or `/_vercel`
        // - … if they contain a dot (e.g. `favicon.ico`)
        '/((?!api|article-media|_next|_vercel|monitoring|.*\\..*).*)',
    ],
};
