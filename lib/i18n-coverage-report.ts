/**
 * Translation Coverage Report Utility
 *
 * Provides detailed analysis of translation coverage across locales
 * Only runs in development mode
 */

import { Locale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from './types';

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return undefined;
        }
    }

    return current;
}

/**
 * Get all translation keys from an object (flattened with dot notation)
 */
function getAllKeys(obj: any, prefix: string = ''): string[] {
    const keys: string[] = [];

    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys.push(...getAllKeys(obj[key], fullKey));
        } else {
            keys.push(fullKey);
        }
    }

    return keys;
}

/**
 * Find missing translation keys between two locales
 */
export function findMissingTranslations(
    sourceMessages: Record<string, any>,
    targetMessages: Record<string, any>,
): string[] {
    const sourceKeys = getAllKeys(sourceMessages);
    const missingKeys: string[] = [];

    for (const key of sourceKeys) {
        if (getNestedValue(targetMessages, key) === undefined) {
            missingKeys.push(key);
        }
    }

    return missingKeys;
}

/**
 * Get translation coverage percentage
 */
export function getTranslationCoverage(
    sourceMessages: Record<string, any>,
    targetMessages: Record<string, any>,
): number {
    const sourceKeys = getAllKeys(sourceMessages);
    const missingKeys = findMissingTranslations(sourceMessages, targetMessages);

    if (sourceKeys.length === 0) return 100;

    const coverage = ((sourceKeys.length - missingKeys.length) / sourceKeys.length) * 100;
    return Math.round(coverage * 100) / 100; // Round to 2 decimal places
}

/**
 * Find extra keys in target that don't exist in source (potential unused translations)
 */
export function findExtraTranslations(
    sourceMessages: Record<string, any>,
    targetMessages: Record<string, any>,
): string[] {
    const sourceKeys = new Set(getAllKeys(sourceMessages));
    const targetKeys = getAllKeys(targetMessages);

    return targetKeys.filter((key) => !sourceKeys.has(key));
}

/**
 * Generate a detailed coverage report for all locales
 */
export async function generateCoverageReport(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
        console.warn('[i18n] Coverage report is only available in development mode');
        return;
    }

    try {
        // Load all translation files
        const translations: Record<Locale, Record<string, any>> = {} as any;

        for (const locale of SUPPORTED_LOCALES) {
            try {
                const messages = await import(`@/locales/${locale}.json`);
                translations[locale] = messages.default;
            } catch (error) {
                console.error(`[i18n] Failed to load translations for ${locale}:`, error);
                translations[locale] = {};
            }
        }

        // Generate report
        console.group('📊 Translation Coverage Report');
        console.debug('Generated at:', new Date().toLocaleString());
        console.debug('');

        const englishMessages = translations[DEFAULT_LOCALE];
        const totalEnglishKeys = getAllKeys(englishMessages).length;

        console.debug(`📝 Total translation keys in English: ${totalEnglishKeys}`);
        console.debug('');

        // Analyze each locale
        for (const locale of SUPPORTED_LOCALES) {
            if (locale === DEFAULT_LOCALE) continue;

            const localeMessages = translations[locale];
            const coverage = getTranslationCoverage(englishMessages, localeMessages);
            const missingKeys = findMissingTranslations(englishMessages, localeMessages);
            const extraKeys = findExtraTranslations(englishMessages, localeMessages);
            const totalKeys = getAllKeys(localeMessages).length;

            console.group(
                `🌐 ${locale.toUpperCase()} (${translations[locale] ? 'Loaded' : 'Failed'})`,
            );
            console.log(`Coverage: ${coverage}%`);
            console.log(`Total keys: ${totalKeys}`);
            console.log(`Missing keys: ${missingKeys.length}`);
            console.log(`Extra keys: ${extraKeys.length}`);

            if (missingKeys.length > 0) {
                console.group(`⚠️  Missing translations (${missingKeys.length}):`);
                missingKeys.forEach((key) => console.log(`  - ${key}`));
                console.groupEnd();
            } else {
                console.log('✅ All translations present');
            }

            if (extraKeys.length > 0) {
                console.group(`ℹ️  Extra translations (${extraKeys.length}):`);
                extraKeys.forEach((key) => console.log(`  - ${key}`));
                console.groupEnd();
            }

            console.groupEnd();
            console.log('');
        }

        // Summary
        console.group('📈 Summary');
        const locales = SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE);
        const averageCoverage =
            locales.reduce((sum, locale) => {
                return sum + getTranslationCoverage(englishMessages, translations[locale]);
            }, 0) / locales.length;

        console.log(`Average coverage: ${averageCoverage.toFixed(2)}%`);

        if (averageCoverage === 100) {
            console.log('✅ All locales have complete translations!');
        } else if (averageCoverage >= 90) {
            console.log('⚠️  Most translations are complete, but some are missing');
        } else {
            console.log('❌ Significant translations are missing');
        }

        console.groupEnd();
        console.groupEnd();
    } catch (error) {
        console.error('[i18n] Failed to generate coverage report:', error);
    }
}

/**
 * Log a simplified coverage summary
 */
export async function logCoverageSummary(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') return;

    try {
        const englishMessages = await import('@/locales/en.json');
        const romanianMessages = await import('@/locales/ro.json');

        const coverage = getTranslationCoverage(englishMessages.default, romanianMessages.default);
        const missingCount = findMissingTranslations(
            englishMessages.default,
            romanianMessages.default,
        ).length;

        if (missingCount > 0) {
            console.warn(
                `[i18n] Romanian translation coverage: ${coverage}% (${missingCount} missing keys)`,
            );
        } else {
            console.log('[i18n] ✅ All translations complete');
        }
    } catch (error) {
        console.error('[i18n] Failed to check coverage:', error);
    }
}

/**
 * Validate that a translation key exists in all locales
 */
export async function validateTranslationKey(key: string): Promise<{
    valid: boolean;
    missing: Locale[];
}> {
    const missing: Locale[] = [];

    for (const locale of SUPPORTED_LOCALES) {
        try {
            const messages = await import(`@/locales/${locale}.json`);
            const value = getNestedValue(messages.default, key);

            if (value === undefined) {
                missing.push(locale);
            }
        } catch (error) {
            console.error(`[i18n] Failed to load ${locale} for validation:`, error);
            missing.push(locale);
        }
    }

    return {
        valid: missing.length === 0,
        missing,
    };
}
