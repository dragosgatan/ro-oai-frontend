/**
 * Problem Translation Resolution Utility
 *
 * This module provides utilities for resolving problem content based on user locale.
 * It implements automatic fallback chain: target language → English → Romanian.
 *
 * Requirements: 1.5, 6.1, 6.2, 6.3, 9.1
 */

import { Locale, SUPPORTED_LOCALES } from './types';

/**
 * Represents the translated content fields of a problem
 */
export interface ProblemContent {
    title: string;
    shortDescription: string;
    longDescription: string;
}

/**
 * Extended Problem type with optional translation fields for all supported languages
 * This interface represents the problem data structure with translations
 */
export interface TranslatableProblem {
    // Original Romanian content (required - always present)
    title: string;
    shortDescription: string;
    longDescription?: string;

    // English translations (optional)
    titleEn?: string | null;
    shortDescriptionEn?: string | null;
    longDescriptionEn?: string | null;

    // German translations (optional)
    titleDe?: string | null;
    shortDescriptionDe?: string | null;
    longDescriptionDe?: string | null;

    // Bulgarian translations (optional)
    titleBg?: string | null;
    shortDescriptionBg?: string | null;
    longDescriptionBg?: string | null;

    // Serbian translations (optional)
    titleSr?: string | null;
    shortDescriptionSr?: string | null;
    longDescriptionSr?: string | null;

    // Ukrainian translations (optional)
    titleUk?: string | null;
    shortDescriptionUk?: string | null;
    longDescriptionUk?: string | null;

    // Hungarian translations (optional)
    titleHu?: string | null;
    shortDescriptionHu?: string | null;
    longDescriptionHu?: string | null;

    // Russian translations (optional)
    titleRu?: string | null;
    shortDescriptionRu?: string | null;
    longDescriptionRu?: string | null;

    // Kazakh translations (optional)
    titleKk?: string | null;
    shortDescriptionKk?: string | null;
    longDescriptionKk?: string | null;

    // Georgian translations (optional)
    titleKa?: string | null;
    shortDescriptionKa?: string | null;
    longDescriptionKa?: string | null;

    // French translations (optional)
    titleFr?: string | null;
    shortDescriptionFr?: string | null;
    longDescriptionFr?: string | null;

    // Dutch translations (optional)
    titleNl?: string | null;
    shortDescriptionNl?: string | null;
    longDescriptionNl?: string | null;

    // Estonian translations (optional)
    titleEt?: string | null;
    shortDescriptionEt?: string | null;
    longDescriptionEt?: string | null;

    // Finnish translations (optional)
    titleFi?: string | null;
    shortDescriptionFi?: string | null;
    longDescriptionFi?: string | null;

    // Swedish translations (optional)
    titleSv?: string | null;
    shortDescriptionSv?: string | null;
    longDescriptionSv?: string | null;

    // Latvian translations (optional)
    titleLv?: string | null;
    shortDescriptionLv?: string | null;
    longDescriptionLv?: string | null;

    // Lithuanian translations (optional)
    titleLt?: string | null;
    shortDescriptionLt?: string | null;
    longDescriptionLt?: string | null;

    // Croatian translations (optional)
    titleHr?: string | null;
    shortDescriptionHr?: string | null;
    longDescriptionHr?: string | null;

    // Slovak translations (optional)
    titleSk?: string | null;
    shortDescriptionSk?: string | null;
    longDescriptionSk?: string | null;

    // Slovenian translations (optional)
    titleSl?: string | null;
    shortDescriptionSl?: string | null;
    longDescriptionSl?: string | null;

    // Czech translations (optional)
    titleCs?: string | null;
    shortDescriptionCs?: string | null;
    longDescriptionCs?: string | null;

    // Danish translations (optional)
    titleDa?: string | null;
    shortDescriptionDa?: string | null;
    longDescriptionDa?: string | null;

    // Italian translations (optional)
    titleIt?: string | null;
    shortDescriptionIt?: string | null;
    longDescriptionIt?: string | null;

    // Spanish translations (optional)
    titleEs?: string | null;
    shortDescriptionEs?: string | null;
    longDescriptionEs?: string | null;

    // Portuguese translations (optional)
    titlePt?: string | null;
    shortDescriptionPt?: string | null;
    longDescriptionPt?: string | null;

    // Polish translations (optional)
    titlePl?: string | null;
    shortDescriptionPl?: string | null;
    longDescriptionPl?: string | null;

    // Norwegian translations (optional)
    titleNo?: string | null;
    shortDescriptionNo?: string | null;
    longDescriptionNo?: string | null;

    // Chinese (Simplified) translations (optional)
    titleZhCn?: string | null;
    shortDescriptionZhCn?: string | null;
    longDescriptionZhCn?: string | null;

    // Arabic translations (optional)
    titleAr?: string | null;
    shortDescriptionAr?: string | null;
    longDescriptionAr?: string | null;

    // Hebrew translations (optional)
    titleHe?: string | null;
    shortDescriptionHe?: string | null;
    longDescriptionHe?: string | null;
}

/**
 * Translation field keys for each locale
 */
type TranslationFieldKey = 'title' | 'shortDescription' | 'longDescription';

/**
 * Gets the translation field name for a given locale and field
 * @param locale - The target locale
 * @param field - The field name (title, shortDescription, longDescription)
 * @returns The field key for the locale (e.g., 'titleDe' for German title)
 */
function getTranslationFieldKey(
    locale: Locale,
    field: TranslationFieldKey,
): keyof TranslatableProblem {
    if (locale === 'ro') {
        return field;
    }
    // Handle hyphenated locale codes (e.g., 'zh-CN' -> 'ZhCn')
    let capitalizedLocale: string;
    if (locale === 'zh-CN') {
        capitalizedLocale = 'ZhCn';
    } else {
        capitalizedLocale = locale.charAt(0).toUpperCase() + locale.slice(1);
    }
    return `${field}${capitalizedLocale}` as keyof TranslatableProblem;
}

/**
 * Gets a translation field value from a problem for a specific locale
 * @param problem - The problem object
 * @param locale - The target locale
 * @param field - The field name
 * @returns The field value or null/undefined if not present
 */
function getTranslationField(
    problem: TranslatableProblem,
    locale: Locale,
    field: TranslationFieldKey,
): string | null | undefined {
    const key = getTranslationFieldKey(locale, field);
    return problem[key] as string | null | undefined;
}

/**
 * Checks if a string value is non-empty (not null, undefined, or empty string)
 */
function isNonEmpty(value: string | null | undefined): value is string {
    return value !== null && value !== undefined && value !== '';
}

/**
 * Resolves a single field using the fallback chain: target → English → Romanian
 * @param problem - The problem object
 * @param locale - The target locale
 * @param field - The field to resolve
 * @returns The resolved field value
 */
function resolveField(
    problem: TranslatableProblem,
    locale: Locale,
    field: TranslationFieldKey,
): string {
    // For Romanian locale, always return Romanian content directly
    if (locale === 'ro') {
        const roValue = getTranslationField(problem, 'ro', field);
        return roValue || '';
    }

    // Try target locale first
    const targetValue = getTranslationField(problem, locale, field);
    if (isNonEmpty(targetValue)) {
        return targetValue;
    }

    // Fallback to English (if not already English)
    if (locale !== 'en') {
        const enValue = getTranslationField(problem, 'en', field);
        if (isNonEmpty(enValue)) {
            return enValue;
        }
    }

    // Final fallback to Romanian
    const roValue = getTranslationField(problem, 'ro', field);
    return roValue || '';
}

/**
 * Resolves problem content based on the user's locale preference
 *
 * This function implements the translation resolution logic with fallback chain:
 * - For Romanian locale ('ro'): Always returns Romanian content
 * - For other locales: Returns target language → English → Romanian (fallback chain)
 *
 * @param problem - The problem object containing translations for all supported languages
 * @param locale - The user's selected locale
 * @returns ProblemContent object with resolved title, shortDescription, and longDescription
 *
 * @example
 * ```typescript
 * const problem = {
 *   title: "Suma numerelor",
 *   shortDescription: "Calculați suma a două numere",
 *   longDescription: "Descriere detaliată...",
 *   titleEn: "Sum of numbers",
 *   shortDescriptionEn: "Calculate the sum of two numbers",
 *   longDescriptionEn: "Detailed description...",
 *   titleDe: "Summe der Zahlen",
 *   // ... other translations
 * };
 *
 * const content = getProblemContent(problem, 'de');
 * // Returns: { title: "Summe der Zahlen", shortDescription: "Calculate...", ... }
 * // (German title, English fallback for short description)
 *
 * const contentRo = getProblemContent(problem, 'ro');
 * // Returns: { title: "Suma numerelor", shortDescription: "Calculați...", ... }
 * ```
 */
export function getProblemContent(problem: TranslatableProblem, locale: Locale): ProblemContent {
    return {
        title: resolveField(problem, locale, 'title'),
        shortDescription: resolveField(problem, locale, 'shortDescription'),
        longDescription: resolveField(problem, locale, 'longDescription'),
    };
}

/**
 * Checks if a problem has complete translations for a specific locale
 *
 * @param problem - The problem object to check
 * @param locale - The locale to check (defaults to 'en')
 * @returns true if all translation fields (title, short description, long description) are present
 */
export function hasCompleteTranslation(
    problem: TranslatableProblem,
    locale: Locale = 'en',
): boolean {
    const title = getTranslationField(problem, locale, 'title');
    const shortDesc = getTranslationField(problem, locale, 'shortDescription');
    const longDesc = getTranslationField(problem, locale, 'longDescription');
    return isNonEmpty(title) && isNonEmpty(shortDesc) && isNonEmpty(longDesc);
}

/**
 * Checks if a problem has any translations for a specific locale
 *
 * @param problem - The problem object to check
 * @param locale - The locale to check (defaults to 'en')
 * @returns true if at least one translation field is present
 */
export function hasAnyTranslation(problem: TranslatableProblem, locale: Locale = 'en'): boolean {
    const title = getTranslationField(problem, locale, 'title');
    const shortDesc = getTranslationField(problem, locale, 'shortDescription');
    const longDesc = getTranslationField(problem, locale, 'longDescription');
    return isNonEmpty(title) || isNonEmpty(shortDesc) || isNonEmpty(longDesc);
}

/**
 * Gets the translation status for a problem for a specific locale
 *
 * @param problem - The problem object to check
 * @param locale - The locale to check (defaults to 'en')
 * @returns 'complete' | 'partial' | 'none'
 */
export function getTranslationStatus(
    problem: TranslatableProblem,
    locale: Locale = 'en',
): 'complete' | 'partial' | 'none' {
    if (hasCompleteTranslation(problem, locale)) {
        return 'complete';
    }
    if (hasAnyTranslation(problem, locale)) {
        return 'partial';
    }
    return 'none';
}

/**
 * Counts how many languages have complete translations for a problem
 *
 * @param problem - The problem object to check
 * @returns Number of languages with complete translations (0-7)
 */
export function countCompleteTranslations(problem: TranslatableProblem): number {
    return SUPPORTED_LOCALES.filter((locale) => hasCompleteTranslation(problem, locale)).length;
}

/**
 * Gets the translation status summary for all languages
 *
 * @param problem - The problem object to check
 * @returns Object with status for each locale
 */
export function getAllTranslationStatuses(
    problem: TranslatableProblem,
): Record<Locale, 'complete' | 'partial' | 'none'> {
    const statuses: Partial<Record<Locale, 'complete' | 'partial' | 'none'>> = {};
    for (const locale of SUPPORTED_LOCALES) {
        statuses[locale] = getTranslationStatus(problem, locale);
    }
    return statuses as Record<Locale, 'complete' | 'partial' | 'none'>;
}
