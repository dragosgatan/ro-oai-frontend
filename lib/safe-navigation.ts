import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@/lib/types';

export function getLocaleFromPathname(pathname: string): Locale {
    const locale = pathname.split('/').filter(Boolean)[0];

    return SUPPORTED_LOCALES.includes(locale as Locale) ? (locale as Locale) : DEFAULT_LOCALE;
}

export function getLocaleHomePath(pathname: string): string {
    return `/${getLocaleFromPathname(pathname)}`;
}

/**
 * Resolve an untrusted return URL to a same-origin path.
 *
 * Keeping only the path, query, and hash prevents open redirects while still
 * preserving the user's exact destination through authentication flows.
 */
export function getSafeReturnPath(
    candidate: string | null | undefined,
    fallback: string,
    currentOrigin?: string,
): string {
    if (!candidate) {
        return fallback;
    }

    const origin = currentOrigin ?? 'https://mlcompete.local';

    try {
        const baseUrl = new URL(origin);
        const targetUrl = new URL(candidate, baseUrl);

        if (targetUrl.origin !== baseUrl.origin) {
            return fallback;
        }

        return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    } catch {
        return fallback;
    }
}
