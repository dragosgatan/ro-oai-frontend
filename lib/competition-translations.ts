/**
 * Competition Translation Resolution Utility
 *
 * This module provides utilities for resolving competition content based on user locale.
 * It implements automatic fallback chain: target language → English → Romanian.
 *
 * Requirements: 9.1, 9.2, 9.3, 13.1, 13.4
 */

import { Locale, SUPPORTED_LOCALES } from './types';

/**
 * Represents the translated content fields of a competition
 */
export interface CompetitionContent {
    name: string;
    shortDescription: string;
    description: string;
    rules: string;
}

/**
 * Extended Competition type with optional translation fields for all supported languages
 * This interface represents the competition data structure with translations
 */
export interface TranslatableCompetition {
    // Original Romanian content (required - always present)
    name: string;
    shortDescription?: string;
    description?: string;
    rules?: string;

    // English translations (optional)
    nameEn?: string | null;
    shortDescriptionEn?: string | null;
    descriptionEn?: string | null;
    rulesEn?: string | null;

    // German translations (optional)
    nameDe?: string | null;
    shortDescriptionDe?: string | null;
    descriptionDe?: string | null;
    rulesDe?: string | null;

    // Bulgarian translations (optional)
    nameBg?: string | null;
    shortDescriptionBg?: string | null;
    descriptionBg?: string | null;
    rulesBg?: string | null;

    // Serbian translations (optional)
    nameSr?: string | null;
    shortDescriptionSr?: string | null;
    descriptionSr?: string | null;
    rulesSr?: string | null;

    // Ukrainian translations (optional)
    nameUk?: string | null;
    shortDescriptionUk?: string | null;
    descriptionUk?: string | null;
    rulesUk?: string | null;

    // Hungarian translations (optional)
    nameHu?: string | null;
    shortDescriptionHu?: string | null;
    descriptionHu?: string | null;
    rulesHu?: string | null;

    // Russian translations (optional)
    nameRu?: string | null;
    shortDescriptionRu?: string | null;
    descriptionRu?: string | null;
    rulesRu?: string | null;

    // Kazakh translations (optional)
    nameKk?: string | null;
    shortDescriptionKk?: string | null;
    descriptionKk?: string | null;
    rulesKk?: string | null;

    // Georgian translations (optional)
    nameKa?: string | null;
    shortDescriptionKa?: string | null;
    descriptionKa?: string | null;
    rulesKa?: string | null;

    // French translations (optional)
    nameFr?: string | null;
    shortDescriptionFr?: string | null;
    descriptionFr?: string | null;
    rulesFr?: string | null;

    // Dutch translations (optional)
    nameNl?: string | null;
    shortDescriptionNl?: string | null;
    descriptionNl?: string | null;
    rulesNl?: string | null;

    // Estonian translations (optional)
    nameEt?: string | null;
    shortDescriptionEt?: string | null;
    descriptionEt?: string | null;
    rulesEt?: string | null;

    // Finnish translations (optional)
    nameFi?: string | null;
    shortDescriptionFi?: string | null;
    descriptionFi?: string | null;
    rulesFi?: string | null;

    // Swedish translations (optional)
    nameSv?: string | null;
    shortDescriptionSv?: string | null;
    descriptionSv?: string | null;
    rulesSv?: string | null;

    // Latvian translations (optional)
    nameLv?: string | null;
    shortDescriptionLv?: string | null;
    descriptionLv?: string | null;
    rulesLv?: string | null;

    // Lithuanian translations (optional)
    nameLt?: string | null;
    shortDescriptionLt?: string | null;
    descriptionLt?: string | null;
    rulesLt?: string | null;

    // Croatian translations (optional)
    nameHr?: string | null;
    shortDescriptionHr?: string | null;
    descriptionHr?: string | null;
    rulesHr?: string | null;

    // Slovak translations (optional)
    nameSk?: string | null;
    shortDescriptionSk?: string | null;
    descriptionSk?: string | null;
    rulesSk?: string | null;

    // Slovenian translations (optional)
    nameSl?: string | null;
    shortDescriptionSl?: string | null;
    descriptionSl?: string | null;
    rulesSl?: string | null;

    // Czech translations (optional)
    nameCs?: string | null;
    shortDescriptionCs?: string | null;
    descriptionCs?: string | null;
    rulesCs?: string | null;

    // Danish translations (optional)
    nameDa?: string | null;
    shortDescriptionDa?: string | null;
    descriptionDa?: string | null;
    rulesDa?: string | null;

    // Italian translations (optional)
    nameIt?: string | null;
    shortDescriptionIt?: string | null;
    descriptionIt?: string | null;
    rulesIt?: string | null;

    // Spanish translations (optional)
    nameEs?: string | null;
    shortDescriptionEs?: string | null;
    descriptionEs?: string | null;
    rulesEs?: string | null;

    // Portuguese translations (optional)
    namePt?: string | null;
    shortDescriptionPt?: string | null;
    descriptionPt?: string | null;
    rulesPt?: string | null;

    // Polish translations (optional)
    namePl?: string | null;
    shortDescriptionPl?: string | null;
    descriptionPl?: string | null;
    rulesPl?: string | null;

    // Norwegian translations (optional)
    nameNo?: string | null;
    shortDescriptionNo?: string | null;
    descriptionNo?: string | null;
    rulesNo?: string | null;

    // Chinese (Simplified) translations (optional)
    nameZhCn?: string | null;
    shortDescriptionZhCn?: string | null;
    descriptionZhCn?: string | null;
    rulesZhCn?: string | null;

    // Arabic translations (optional)
    nameAr?: string | null;
    shortDescriptionAr?: string | null;
    descriptionAr?: string | null;
    rulesAr?: string | null;

    // Hebrew translations (optional)
    nameHe?: string | null;
    shortDescriptionHe?: string | null;
    descriptionHe?: string | null;
    rulesHe?: string | null;
}

/**
 * Translation field keys for each locale
 */
type TranslationFieldKey = 'name' | 'shortDescription' | 'description' | 'rules';

/**
 * Gets the translation field name for a given locale and field
 * @param locale - The target locale
 * @param field - The field name (name, shortDescription, description, rules)
 * @returns The field key for the locale (e.g., 'nameDe' for German name)
 */
function getTranslationFieldKey(
    locale: Locale,
    field: TranslationFieldKey,
): keyof TranslatableCompetition {
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
    return `${field}${capitalizedLocale}` as keyof TranslatableCompetition;
}

/**
 * Gets a translation field value from a competition for a specific locale
 * @param competition - The competition object
 * @param locale - The target locale
 * @param field - The field name
 * @returns The field value or null/undefined if not present
 */
function getTranslationField(
    competition: TranslatableCompetition,
    locale: Locale,
    field: TranslationFieldKey,
): string | null | undefined {
    const key = getTranslationFieldKey(locale, field);
    return competition[key] as string | null | undefined;
}

/**
 * Checks if a string value is non-empty (not null, undefined, or empty string)
 */
function isNonEmpty(value: string | null | undefined): value is string {
    return value !== null && value !== undefined && value !== '';
}

/**
 * Resolves a single field using the fallback chain: target → English → Romanian
 * @param competition - The competition object
 * @param locale - The target locale
 * @param field - The field to resolve
 * @returns The resolved field value
 */
function resolveField(
    competition: TranslatableCompetition,
    locale: Locale,
    field: TranslationFieldKey,
): string {
    // For Romanian locale, always return Romanian content directly
    if (locale === 'ro') {
        const roValue = getTranslationField(competition, 'ro', field);
        return roValue || '';
    }

    // Try target locale first
    const targetValue = getTranslationField(competition, locale, field);
    if (isNonEmpty(targetValue)) {
        return targetValue;
    }

    // Fallback to English (if not already English)
    if (locale !== 'en') {
        const enValue = getTranslationField(competition, 'en', field);
        if (isNonEmpty(enValue)) {
            return enValue;
        }
    }

    // Final fallback to Romanian
    const roValue = getTranslationField(competition, 'ro', field);
    return roValue || '';
}

/**
 * Resolves competition content based on the user's locale preference
 *
 * This function implements the translation resolution logic with fallback chain:
 * - For Romanian locale ('ro'): Always returns Romanian content
 * - For other locales: Returns target language → English → Romanian (fallback chain)
 *
 * @param competition - The competition object containing translations for all supported languages
 * @param locale - The user's selected locale
 * @returns CompetitionContent object with resolved name, shortDescription, description, and rules
 *
 * @example
 * ```typescript
 * const competition = {
 *   name: "Concurs de programare",
 *   shortDescription: "Descriere scurtă",
 *   description: "Descriere detaliată...",
 *   rules: "Regulile competiției...",
 *   nameEn: "Programming Contest",
 *   shortDescriptionEn: "Short description",
 *   descriptionEn: "Detailed description...",
 *   rulesEn: "Competition rules...",
 *   nameDe: "Programmierwettbewerb",
 *   // ... other translations
 * };
 *
 * const content = getCompetitionContent(competition, 'de');
 * // Returns: { name: "Programmierwettbewerb", shortDescription: "Short description", ... }
 * // (German name, English fallback for short description)
 *
 * const contentRo = getCompetitionContent(competition, 'ro');
 * // Returns: { name: "Concurs de programare", shortDescription: "Descriere scurtă", ... }
 * ```
 */
export function getCompetitionContent(
    competition: TranslatableCompetition,
    locale: Locale,
): CompetitionContent {
    return {
        name: resolveField(competition, locale, 'name'),
        shortDescription: resolveField(competition, locale, 'shortDescription'),
        description: resolveField(competition, locale, 'description'),
        rules: resolveField(competition, locale, 'rules'),
    };
}

/**
 * Checks if a competition has complete translations for a specific locale
 *
 * @param competition - The competition object to check
 * @param locale - The locale to check (defaults to 'en')
 * @returns true if all translation fields (name, shortDescription, description, rules) are present
 */
export function hasCompleteCompetitionTranslation(
    competition: TranslatableCompetition,
    locale: Locale = 'en',
): boolean {
    const name = getTranslationField(competition, locale, 'name');
    const shortDesc = getTranslationField(competition, locale, 'shortDescription');
    const desc = getTranslationField(competition, locale, 'description');
    const rules = getTranslationField(competition, locale, 'rules');
    return isNonEmpty(name) && isNonEmpty(shortDesc) && isNonEmpty(desc) && isNonEmpty(rules);
}

/**
 * Checks if a competition has any translations for a specific locale
 *
 * @param competition - The competition object to check
 * @param locale - The locale to check (defaults to 'en')
 * @returns true if at least one translation field is present
 */
export function hasAnyCompetitionTranslation(
    competition: TranslatableCompetition,
    locale: Locale = 'en',
): boolean {
    const name = getTranslationField(competition, locale, 'name');
    const shortDesc = getTranslationField(competition, locale, 'shortDescription');
    const desc = getTranslationField(competition, locale, 'description');
    const rules = getTranslationField(competition, locale, 'rules');
    return isNonEmpty(name) || isNonEmpty(shortDesc) || isNonEmpty(desc) || isNonEmpty(rules);
}

/**
 * Gets the translation status for a competition for a specific locale
 *
 * @param competition - The competition object to check
 * @param locale - The locale to check (defaults to 'en')
 * @returns 'complete' | 'partial' | 'none'
 */
export function getCompetitionTranslationStatus(
    competition: TranslatableCompetition,
    locale: Locale = 'en',
): 'complete' | 'partial' | 'none' {
    if (hasCompleteCompetitionTranslation(competition, locale)) {
        return 'complete';
    }
    if (hasAnyCompetitionTranslation(competition, locale)) {
        return 'partial';
    }
    return 'none';
}

/**
 * Counts how many languages have complete translations for a competition
 *
 * @param competition - The competition object to check
 * @returns Number of languages with complete translations (0-7)
 */
export function countCompleteCompetitionTranslations(competition: TranslatableCompetition): number {
    return SUPPORTED_LOCALES.filter((locale) =>
        hasCompleteCompetitionTranslation(competition, locale),
    ).length;
}

/**
 * Gets the translation status summary for all languages
 *
 * @param competition - The competition object to check
 * @returns Object with status for each locale
 */
export function getAllCompetitionTranslationStatuses(
    competition: TranslatableCompetition,
): Record<Locale, 'complete' | 'partial' | 'none'> {
    const statuses: Partial<Record<Locale, 'complete' | 'partial' | 'none'>> = {};
    for (const locale of SUPPORTED_LOCALES) {
        statuses[locale] = getCompetitionTranslationStatus(competition, locale);
    }
    return statuses as Record<Locale, 'complete' | 'partial' | 'none'>;
}
