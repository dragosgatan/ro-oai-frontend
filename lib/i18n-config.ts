import { Locale, DEFAULT_LOCALE, SUPPORTED_LOCALES, RTL_LOCALES } from './types';

/**
 * Detects the user's preferred locale based on a fallback chain:
 * 1. User's saved preference (localStorage: 'mlcompete-locale')
 * 2. Browser's navigator.language or navigator.languages[0]
 * 3. Fallback to Romanian (DEFAULT_LOCALE)
 */
export function detectLocale(): Locale {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        return DEFAULT_LOCALE;
    }

    // 1. Check localStorage for saved preference
    const storedLocale = getStoredLocale();
    if (storedLocale) {
        return storedLocale;
    }

    // 2. Check browser language settings
    const browserLocale = getBrowserLocale();
    if (browserLocale) {
        return browserLocale;
    }

    // 3. Fallback to default locale
    return DEFAULT_LOCALE;
}

/**
 * Gets the stored locale from localStorage with validation
 */
export function getStoredLocale(): Locale | null {
    try {
        const stored = localStorage.getItem('mlcompete-locale');
        if (stored && isValidLocale(stored)) {
            return stored as Locale;
        }
    } catch (error) {
        // localStorage might not be available (SSR, privacy mode, etc.)
        console.warn('[i18n] Failed to read from localStorage:', error);
    }
    return null;
}

/**
 * Saves the locale preference to localStorage and cookie
 */
export function saveLocale(locale: Locale): void {
    try {
        localStorage.setItem('mlcompete-locale', locale);

        // Also set cookie for server-side access
        document.cookie = `mlcompete-locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    } catch (error) {
        console.warn('[i18n] Failed to save locale:', error);
    }
}

/**
 * Gets the browser's preferred locale
 */
export function getBrowserLocale(): Locale | null {
    try {
        // Check navigator.language first
        if (navigator.language) {
            const locale = normalizeLocale(navigator.language);
            if (locale) return locale;
        }

        // Check navigator.languages array
        if (navigator.languages && navigator.languages.length > 0) {
            for (const lang of navigator.languages) {
                const locale = normalizeLocale(lang);
                if (locale) return locale;
            }
        }
    } catch (error) {
        console.warn('[i18n] Failed to detect browser locale:', error);
    }
    return null;
}

/**
 * Normalizes a locale string (e.g., "en-US" -> "en", "ro-RO" -> "ro")
 * and validates it against supported locales
 */
export function normalizeLocale(localeString: string): Locale | null {
    const normalizedLocale = localeString.trim().replace('_', '-').toLowerCase();
    const exactMatch = SUPPORTED_LOCALES.find(
        (supportedLocale) => supportedLocale.toLowerCase() === normalizedLocale,
    );

    if (exactMatch) return exactMatch;

    // Extract the language code (first part before hyphen). Chinese is the only
    // supported locale whose canonical app route retains a region/script choice.
    const languageCode = normalizedLocale.split('-')[0];

    if (languageCode === 'zh') return 'zh-CN';

    if (isValidLocale(languageCode)) {
        return languageCode as Locale;
    }

    return null;
}

/**
 * Validates if a string is a supported locale
 */
export function isValidLocale(locale: string): locale is Locale {
    return SUPPORTED_LOCALES.includes(locale as Locale);
}

/**
 * Updates the HTML lang attribute for accessibility and SEO
 * Also updates the dir attribute for RTL language support
 */
export function updateHtmlLang(locale: Locale): void {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = locale;
        document.documentElement.dir = getLocaleDirection(locale);
    }
}

/**
 * Checks if a locale is a right-to-left (RTL) language
 * Currently supports Arabic (ar) and Hebrew (he)
 * @param locale - The locale code to check
 * @returns true if the locale is RTL, false otherwise
 */
export function isRTLLocale(locale: Locale): boolean {
    return RTL_LOCALES.includes(locale);
}

/**
 * Gets the text direction for a given locale
 * @param locale - The locale code
 * @returns 'rtl' for RTL languages, 'ltr' for LTR languages
 */
export function getLocaleDirection(locale: Locale): 'rtl' | 'ltr' {
    return isRTLLocale(locale) ? 'rtl' : 'ltr';
}
