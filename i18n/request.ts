import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { Locale } from '@/lib/types';
import { MESSAGE_FALLBACK_LOCALE, mergeMessageFallback } from '@/lib/i18n-messages';

/**
 * Request configuration for next-intl
 * This is called for each request to load the appropriate messages
 */
export default getRequestConfig(async ({ requestLocale }) => {
    // Get the locale from the request (set by middleware)
    let locale = await requestLocale;

    // Validate that the incoming locale is supported
    if (!locale || !routing.locales.includes(locale as Locale)) {
        locale = routing.defaultLocale;
    }

    const messages = (await import(`../locales/${locale}.json`)).default;
    const fallbackMessages = (await import(`../locales/${MESSAGE_FALLBACK_LOCALE}.json`)).default;

    return {
        locale,
        messages:
            locale === MESSAGE_FALLBACK_LOCALE
                ? messages
                : mergeMessageFallback(messages, fallbackMessages, locale),
    };
});
