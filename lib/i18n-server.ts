import { cookies, headers } from 'next/headers';
import { Locale, DEFAULT_LOCALE, SUPPORTED_LOCALES, RTL_LOCALES } from './types';
import { isValidLocale, normalizeLocale } from './i18n-config';
import { getLocale } from 'next-intl/server';
import { MESSAGE_FALLBACK_LOCALE, mergeMessageFallback } from './i18n-messages';

/**
 * Server-side locale detection
 * Uses next-intl's getLocale() which reads from the middleware-set locale
 * Falls back to cookie/header detection if needed
 */
export async function getServerLocale(): Promise<Locale> {
    try {
        // Use next-intl's getLocale which is set by the middleware
        const locale = await getLocale();
        if (locale && SUPPORTED_LOCALES.includes(locale as Locale)) {
            return locale as Locale;
        }
    } catch {
        // Fallback to manual detection if next-intl context is not available
    }

    // 1. Check cookie for saved preference
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get('mlcompete-locale');

    if (localeCookie?.value && isValidLocale(localeCookie.value)) {
        return localeCookie.value as Locale;
    }

    // 2. Check Accept-Language header
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');

    if (acceptLanguage) {
        const locale = parseAcceptLanguage(acceptLanguage);
        if (locale) {
            return locale;
        }
    }

    // 3. Fallback to default locale
    return DEFAULT_LOCALE;
}

/**
 * Parse Accept-Language header and return first supported locale
 */
function parseAcceptLanguage(acceptLanguage: string): Locale | null {
    // Parse format: "en-US,en;q=0.9,ro;q=0.8"
    const languages = acceptLanguage
        .split(',')
        .map((lang) => {
            const [code, qValue] = lang.trim().split(';');
            const quality = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
            return { code: code.toLowerCase(), quality };
        })
        .sort((a, b) => b.quality - a.quality);

    for (const { code } of languages) {
        const locale = normalizeLocale(code);
        if (locale) return locale;
    }

    return null;
}

/**
 * Load messages for a specific locale with fallback support
 */
export async function getMessages(locale: Locale): Promise<Record<string, any>> {
    try {
        const messages = await import(`@/locales/${locale}.json`);
        const loadedMessages = messages.default;

        if (locale !== MESSAGE_FALLBACK_LOCALE) {
            const englishMessages = await import(`@/locales/${MESSAGE_FALLBACK_LOCALE}.json`);
            return mergeMessageFallback(loadedMessages, englishMessages.default, locale);
        }

        return loadedMessages;
    } catch (error) {
        console.error(`[i18n] Failed to load messages for locale: ${locale}`, error);

        // Fall back to English if the requested locale cannot be loaded.
        if (locale !== MESSAGE_FALLBACK_LOCALE) {
            try {
                const fallbackMessages = await import(`@/locales/${MESSAGE_FALLBACK_LOCALE}.json`);
                console.warn(`[i18n] Using English fallback for locale: ${locale}`);
                return fallbackMessages.default;
            } catch (fallbackError) {
                console.error('[i18n] Failed to load fallback messages', fallbackError);
            }
        }

        return {};
    }
}

/**
 * Set locale cookie (for server actions)
 */
export async function setLocaleCookie(locale: Locale): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set('mlcompete-locale', locale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
    });
}

/**
 * Get the text direction for a locale (server-side)
 * @param locale - The locale code
 * @returns 'rtl' for RTL languages (Arabic, Hebrew), 'ltr' for all others
 */
export function getServerLocaleDirection(locale: Locale): 'rtl' | 'ltr' {
    return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}
