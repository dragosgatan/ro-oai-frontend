/**
 * Canonical URL and Hreflang Management
 *
 * Functions for generating canonical URLs and hreflang tags for multi-language support
 */

import { HreflangTag, HreflangConfig, CanonicalUrlConfig } from './types';
import { BASE_URL, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './config';
import type { Locale } from '@/lib/types';

// ============================================================================
// Canonical URL Generation
// ============================================================================

/**
 * Generate canonical URL with proper normalization
 * Removes trailing slashes, query parameters, and fragments
 * All locales get explicit prefixes (including default)
 */
export function generateCanonicalUrl(config: CanonicalUrlConfig): string {
    const { baseUrl, path, locale, includeLocale = true } = config;

    // Normalize path: remove trailing slash, query params, and fragments
    let normalizedPath = normalizePath(path);

    // Build URL with locale prefix (all locales get prefixes)
    let url = baseUrl.replace(/\/+$/, '');

    if (includeLocale && locale) {
        url += `/${locale}`;
    }

    // A localized homepage is `/ro`, not `/ro/`. Keeping canonical URLs in
    // the same trailing-slash form as next-intl prevents a needless redirect
    // when crawlers follow canonical or hreflang links.
    if (normalizedPath !== '/') {
        url += normalizedPath;
    } else if (!includeLocale || !locale) {
        url += '/';
    }

    return url;
}

/**
 * Normalize path by removing trailing slashes, query params, and fragments
 */
function normalizePath(path: string): string {
    // Remove query parameters and fragments
    let normalized = path.split('?')[0].split('#')[0];

    // Ensure path starts with /
    if (!normalized.startsWith('/')) {
        normalized = `/${normalized}`;
    }

    // Remove trailing slash (except for root)
    if (normalized.length > 1 && normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
    }

    return normalized;
}

/**
 * Generate canonical URL from current path and locale
 * All locales get explicit prefixes
 */
export function getCanonicalUrl(path: string, locale: string = DEFAULT_LOCALE): string {
    return generateCanonicalUrl({
        baseUrl: BASE_URL,
        path,
        locale,
        includeLocale: true,
    });
}

// ============================================================================
// Hreflang Tags Generation
// ============================================================================

/**
 * Convert locale code to proper hreflang format
 * zh-CN should be converted to zh-Hans for hreflang tags
 */
function getHreflangCode(locale: string): string {
    // zh-CN should be converted to zh-Hans for hreflang tags
    // This follows the BCP 47 language tag standard
    if (locale === 'zh-CN') {
        return 'zh-Hans';
    }
    return locale;
}

/**
 * Generate hreflang tags for all supported locales
 * Includes x-default for the default locale
 */
export function generateHreflangTags(config: HreflangConfig): HreflangTag[] {
    const { baseUrl, path, supportedLocales, defaultLocale } = config;

    const tags: HreflangTag[] = [];
    const normalizedPath = normalizePath(path);
    const localizedPath = normalizedPath === '/' ? '' : normalizedPath;
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

    // Generate hreflang tag for each supported locale
    // All locales get explicit prefixes
    for (const locale of supportedLocales) {
        const href = `${normalizedBaseUrl}/${locale}${localizedPath}`;

        // Use proper hreflang format (zh-CN → zh-Hans, others stay as-is)
        const hreflang = getHreflangCode(locale);

        tags.push({
            hreflang,
            href,
        });
    }

    // Add x-default tag pointing to default locale (Romanian)
    const defaultHref = `${normalizedBaseUrl}/${defaultLocale}${localizedPath}`;
    tags.push({
        hreflang: 'x-default',
        href: defaultHref,
    });

    return tags;
}

/**
 * Generate hreflang tags for current path
 * Uses all SUPPORTED_LOCALES from the i18n system
 */
export function getHreflangTags(path: string): HreflangTag[] {
    return generateHreflangTags({
        baseUrl: BASE_URL,
        path,
        supportedLocales: [...SUPPORTED_LOCALES],
        defaultLocale: DEFAULT_LOCALE,
    });
}

/**
 * Generate alternate language links as a record
 * Used for Next.js metadata alternates.languages
 * Returns a record mapping locale codes to their full URLs
 * All locales get explicit prefixes
 */
export function generateAlternateLanguages(path: string): Record<Locale | 'x-default', string> {
    const normalizedPath = normalizePath(path);
    const localizedPath = normalizedPath === '/' ? '' : normalizedPath;
    const alternates: Record<string, string> = {};

    for (const locale of SUPPORTED_LOCALES) {
        const href = `${BASE_URL}/${locale}${localizedPath}`;
        alternates[locale] = href;
    }

    // Add x-default pointing to Romanian version (default locale)
    alternates['x-default'] = `${BASE_URL}/${DEFAULT_LOCALE}${localizedPath}`;

    return alternates as Record<Locale | 'x-default', string>;
}

// ============================================================================
// URL Validation and Utilities
// ============================================================================

/**
 * Validate if a URL is properly formatted
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Extract path from full URL
 */
export function extractPath(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.pathname;
    } catch {
        // If not a valid URL, assume it's already a path
        return url;
    }
}

/**
 * Check if URL is absolute
 */
export function isAbsoluteUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Convert relative URL to absolute
 */
export function toAbsoluteUrl(url: string, baseUrl: string = BASE_URL): string {
    if (isAbsoluteUrl(url)) {
        return url;
    }

    const normalizedPath = normalizePath(url);
    return `${baseUrl}${normalizedPath}`;
}

/**
 * Get locale from URL path
 */
export function getLocaleFromPath(path: string): string | null {
    const segments = path.split('/').filter(Boolean);

    if (segments.length > 0) {
        const firstSegment = segments[0];
        if (SUPPORTED_LOCALES.includes(firstSegment as any)) {
            return firstSegment;
        }
    }

    return null;
}

/**
 * Remove locale from path
 */
export function removeLocaleFromPath(path: string): string {
    const locale = getLocaleFromPath(path);

    if (locale) {
        return path.replace(`/${locale}`, '') || '/';
    }

    return path;
}
