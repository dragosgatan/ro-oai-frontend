/**
 * Translation Key Validation Utility
 *
 * This utility provides development-mode validation for translation keys
 * to help identify missing translations and ensure translation coverage.
 */

import enTranslations from '@/locales/en.json';
import roTranslations from '@/locales/ro.json';

export type Locale = 'en' | 'ro';
export type TranslationNamespace = keyof typeof enTranslations;

/**
 * Get a nested translation value by dot-notation key path
 * @param obj - Translation object
 * @param path - Dot-notation path (e.g., "common.loading")
 * @returns The translation value or undefined if not found
 */
function getNestedValue(obj: any, path: string): string | undefined {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return undefined;
        }
    }

    return typeof current === 'string' ? current : undefined;
}

/**
 * Validate if a translation key exists in the specified locale
 * @param key - Translation key in dot notation (e.g., "common.loading")
 * @param locale - Target locale
 * @returns true if key exists, false otherwise
 */
export function validateTranslationKey(key: string, locale: Locale = 'en'): boolean {
    const translations = locale === 'en' ? enTranslations : roTranslations;
    return getNestedValue(translations, key) !== undefined;
}

/**
 * Get all translation keys from an object (flattened with dot notation)
 * @param obj - Translation object
 * @param prefix - Current prefix for nested keys
 * @returns Array of flattened key paths
 */
function getAllKeys(obj: any, prefix: string = ''): string[] {
    const keys: string[] = [];

    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys.push(...getAllKeys(obj[key], fullKey));
        } else {
            keys.push(fullKey);
        }
    }

    return keys;
}

/**
 * Find missing translation keys between two locales
 * @param sourceLocale - Source locale (typically 'en')
 * @param targetLocale - Target locale to check
 * @returns Array of missing keys in target locale
 */
export function findMissingTranslations(
    sourceLocale: Locale = 'en',
    targetLocale: Locale = 'ro',
): string[] {
    const sourceTranslations = sourceLocale === 'en' ? enTranslations : roTranslations;
    const targetTranslations = targetLocale === 'en' ? enTranslations : roTranslations;

    const sourceKeys = getAllKeys(sourceTranslations);
    const missingKeys: string[] = [];

    for (const key of sourceKeys) {
        if (getNestedValue(targetTranslations, key) === undefined) {
            missingKeys.push(key);
        }
    }

    return missingKeys;
}

/**
 * Get translation coverage percentage for a locale
 * @param sourceLocale - Source locale (typically 'en')
 * @param targetLocale - Target locale to check
 * @returns Coverage percentage (0-100)
 */
export function getTranslationCoverage(
    sourceLocale: Locale = 'en',
    targetLocale: Locale = 'ro',
): number {
    const sourceTranslations = sourceLocale === 'en' ? enTranslations : roTranslations;
    const sourceKeys = getAllKeys(sourceTranslations);
    const missingKeys = findMissingTranslations(sourceLocale, targetLocale);

    if (sourceKeys.length === 0) return 100;

    const coverage = ((sourceKeys.length - missingKeys.length) / sourceKeys.length) * 100;
    return Math.round(coverage * 100) / 100; // Round to 2 decimal places
}

/**
 * Log translation coverage report to console (development mode only)
 */
export function logTranslationCoverage(): void {
    if (process.env.NODE_ENV !== 'development') return;

    console.group('📊 Translation Coverage Report');

    const locales: Locale[] = ['en', 'ro'];

    for (const locale of locales) {
        const otherLocale = locale === 'en' ? 'ro' : 'en';
        const coverage = getTranslationCoverage(otherLocale, locale);
        const missingKeys = findMissingTranslations(otherLocale, locale);

        console.debug(`\n${locale.toUpperCase()} Coverage: ${coverage}%`);

        if (missingKeys.length > 0) {
            console.warn(`Missing ${missingKeys.length} translations in ${locale}:`);
            missingKeys.forEach((key) => console.warn(`  - ${key}`));
        } else {
            console.debug(`✅ All translations present in ${locale}`);
        }
    }

    console.groupEnd();
}

/**
 * Track missing translations to avoid duplicate warnings
 */
const missingTranslationsCache = new Set<string>();

/**
 * Warn about missing translation key (development mode only)
 * @param key - Translation key that is missing
 * @param locale - Locale where key is missing
 */
export function warnMissingTranslation(key: string, locale: Locale): void {
    if (process.env.NODE_ENV !== 'development') return;

    const cacheKey = `${locale}:${key}`;

    // Only warn once per missing key to avoid console spam
    if (!missingTranslationsCache.has(cacheKey)) {
        missingTranslationsCache.add(cacheKey);
        console.warn(
            `%c[i18n] Missing translation`,
            'color: #f59e0b; font-weight: bold;',
            `\nKey: "${key}"\nLocale: ${locale}\nFalling back to English`,
        );
    }
}

/**
 * Clear the missing translations cache (useful for testing)
 */
export function clearMissingTranslationsCache(): void {
    missingTranslationsCache.clear();
}

/**
 * Get a translation with fallback to English
 * @param key - Translation key in dot notation
 * @param locale - Target locale
 * @returns Translation string or key path if not found
 */
export function getTranslationWithFallback(key: string, locale: Locale): string {
    const translations = locale === 'en' ? enTranslations : roTranslations;
    let value = getNestedValue(translations, key);

    // If not found in target locale, try English fallback
    if (value === undefined && locale !== 'en') {
        if (process.env.NODE_ENV === 'development') {
            warnMissingTranslation(key, locale);
        }
        value = getNestedValue(enTranslations, key);
    }

    // If still not found, return key path in development, empty in production
    if (value === undefined) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[i18n] Missing translation: "${key}" in all locales`);
            return `[${key}]`;
        }
        return '';
    }

    return value;
}

/**
 * Interpolate variables in translation strings
 * @param template - Translation string with {variable} placeholders
 * @param variables - Object with variable values
 * @returns Interpolated string
 */
export function interpolate(template: string, variables: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return key in variables ? String(variables[key]) : match;
    });
}

// Export translation objects for type checking
export { enTranslations, roTranslations };
