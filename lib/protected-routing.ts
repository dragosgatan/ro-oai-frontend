import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from '@/lib/types';

export type ProtectedRouteContext = {
    locale: Locale;
    pathname: string;
    routePath: string;
};

/** Parse only the pathname used by route gates; query/hash text is never authoritative. */
export function getProtectedRouteContext(url: string): ProtectedRouteContext {
    let pathname = '/';

    try {
        pathname = new URL(url, 'http://localhost').pathname || '/';
    } catch {
        // A malformed internal header gets the strictest, default-route treatment.
    }

    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];
    const locale = SUPPORTED_LOCALES.includes(firstSegment as Locale)
        ? (firstSegment as Locale)
        : DEFAULT_LOCALE;
    const routeSegments = locale === firstSegment ? segments.slice(1) : segments;
    const routePath = routeSegments.length > 0 ? `/${routeSegments.join('/')}` : '/';

    return { locale, pathname, routePath };
}

export function isProtectedGateAllowlisted(routePath: string): boolean {
    return (
        routePath === '/logout' ||
        routePath === '/login' ||
        routePath === '/error' ||
        routePath === '/admin-preview' ||
        routePath.startsWith('/admin-preview/') ||
        routePath === '/api' ||
        routePath.startsWith('/api/')
    );
}

export function isProfileConfirmationRoute(routePath: string): boolean {
    return routePath === '/profile/confirm';
}

export function isCompetitionRestrictedRoute(routePath: string): boolean {
    return (
        routePath === '/problems' || routePath === '/roadmap' || routePath.startsWith('/roadmap/')
    );
}

export function buildLocalePath(path: string, locale: Locale): string {
    const normalizedPath = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
    return `/${locale}${normalizedPath}`;
}
