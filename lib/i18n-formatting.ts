import { Locale } from './types';

/**
 * Locale-specific formatting utilities for dates, numbers, and pluralization
 * Supports English (en) and Romanian (ro) locales
 */

// ============================================================================
// Date Formatting
// ============================================================================

export interface DateFormatOptions {
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
    day?: 'numeric' | '2-digit';
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
    second?: 'numeric' | '2-digit';
    weekday?: 'long' | 'short' | 'narrow';
}

/**
 * Formats a date according to the specified locale
 * @param date - The date to format
 * @param locale - The locale to use for formatting
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
    date: Date | string | number,
    locale: Locale,
    options?: DateFormatOptions,
): string {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        console.warn('[i18n-formatting] Invalid date:', date);
        return String(date);
    }

    const localeString = getLocaleString(locale);

    try {
        return new Intl.DateTimeFormat(localeString, options).format(dateObj);
    } catch (error) {
        console.error('[i18n-formatting] Date formatting error:', error);
        return dateObj.toISOString();
    }
}

/**
 * Formats a date as a short date string (e.g., "12/31/2023" or "31.12.2023")
 */
export function formatShortDate(date: Date | string | number, locale: Locale): string {
    return formatDate(date, locale, { dateStyle: 'short' });
}

/**
 * Formats a date as a medium date string (e.g., "Dec 31, 2023" or "31 dec. 2023")
 */
export function formatMediumDate(date: Date | string | number, locale: Locale): string {
    return formatDate(date, locale, { dateStyle: 'medium' });
}

/**
 * Formats a date as a long date string (e.g., "December 31, 2023" or "31 decembrie 2023")
 */
export function formatLongDate(date: Date | string | number, locale: Locale): string {
    return formatDate(date, locale, { dateStyle: 'long' });
}

/**
 * Formats a date with time (e.g., "12/31/2023, 3:45 PM" or "31.12.2023, 15:45")
 */
export function formatDateTime(date: Date | string | number, locale: Locale): string {
    return formatDate(date, locale, {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

/**
 * Formats only the time portion (e.g., "3:45 PM" or "15:45")
 */
export function formatTime(date: Date | string | number, locale: Locale): string {
    return formatDate(date, locale, { timeStyle: 'short' });
}

/**
 * Formats a relative time string (e.g., "2 days ago", "in 3 hours")
 * @param date - The date to compare
 * @param locale - The locale to use
 * @param baseDate - The base date to compare against (defaults to now)
 */
export function formatRelativeTime(
    date: Date | string | number,
    locale: Locale,
    baseDate: Date = new Date(),
): string {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        console.warn('[i18n-formatting] Invalid date:', date);
        return String(date);
    }

    const diffMs = dateObj.getTime() - baseDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    const localeString = getLocaleString(locale);

    try {
        // Use Intl.RelativeTimeFormat for modern browsers
        if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
            const rtf = new Intl.RelativeTimeFormat(localeString, { numeric: 'auto' });

            if (Math.abs(diffYears) >= 1) {
                return rtf.format(diffYears, 'year');
            } else if (Math.abs(diffMonths) >= 1) {
                return rtf.format(diffMonths, 'month');
            } else if (Math.abs(diffWeeks) >= 1) {
                return rtf.format(diffWeeks, 'week');
            } else if (Math.abs(diffDays) >= 1) {
                return rtf.format(diffDays, 'day');
            } else if (Math.abs(diffHours) >= 1) {
                return rtf.format(diffHours, 'hour');
            } else if (Math.abs(diffMinutes) >= 1) {
                return rtf.format(diffMinutes, 'minute');
            } else {
                return rtf.format(diffSeconds, 'second');
            }
        }
    } catch (error) {
        console.error('[i18n-formatting] Relative time formatting error:', error);
    }

    // Fallback for older browsers
    return formatDateTime(dateObj, locale);
}

// ============================================================================
// Number Formatting
// ============================================================================

export interface NumberFormatOptions {
    style?: 'decimal' | 'currency' | 'percent' | 'unit';
    currency?: string;
    currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    minimumIntegerDigits?: number;
    useGrouping?: boolean;
    notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
}

/**
 * Formats a number according to the specified locale
 * @param value - The number to format
 * @param locale - The locale to use for formatting
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(value: number, locale: Locale, options?: NumberFormatOptions): string {
    if (typeof value !== 'number' || isNaN(value)) {
        console.warn('[i18n-formatting] Invalid number:', value);
        return String(value);
    }

    const localeString = getLocaleString(locale);

    try {
        return new Intl.NumberFormat(localeString, options).format(value);
    } catch (error) {
        console.error('[i18n-formatting] Number formatting error:', error);
        return String(value);
    }
}

/**
 * Formats a number as an integer with thousands separators
 * (e.g., "1,234" or "1.234" depending on locale)
 */
export function formatInteger(value: number, locale: Locale): string {
    return formatNumber(value, locale, {
        maximumFractionDigits: 0,
        useGrouping: true,
    });
}

/**
 * Formats a number as a decimal with specified precision
 */
export function formatDecimal(value: number, locale: Locale, decimalPlaces: number = 2): string {
    return formatNumber(value, locale, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
        useGrouping: true,
    });
}

/**
 * Formats a number as a percentage (e.g., "75%" or "75 %")
 */
export function formatPercent(value: number, locale: Locale, decimalPlaces: number = 0): string {
    return formatNumber(value / 100, locale, {
        style: 'percent',
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    });
}

/**
 * Formats a number in compact notation (e.g., "1.2K", "3.4M")
 */
export function formatCompactNumber(value: number, locale: Locale): string {
    return formatNumber(value, locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
    });
}

/**
 * Formats a score with appropriate decimal places
 */
export function formatScore(value: number, locale: Locale): string {
    // Show more precision for scores close to 100
    const decimalPlaces = value >= 99 ? 4 : 2;
    return formatDecimal(value, locale, decimalPlaces);
}

// ============================================================================
// Pluralization
// ============================================================================

/**
 * Romanian pluralization rules:
 * - one: n = 1 (1 problemă)
 * - few: n = 0 OR n % 100 in 2..19 (0 probleme, 2 probleme, 15 probleme)
 * - other: everything else (20 de probleme, 100 de probleme)
 */
function getRomanianPluralCategory(count: number): 'one' | 'few' | 'other' {
    const absCount = Math.abs(count);

    if (absCount === 1) {
        return 'one';
    }

    if (absCount === 0 || (absCount % 100 >= 2 && absCount % 100 <= 19)) {
        return 'few';
    }

    return 'other';
}

/**
 * English pluralization rules:
 * - one: n = 1 (1 problem)
 * - other: everything else (0 problems, 2 problems)
 */
function getEnglishPluralCategory(count: number): 'one' | 'other' {
    return Math.abs(count) === 1 ? 'one' : 'other';
}

/**
 * Gets the plural category for a given count and locale
 */
export function getPluralCategory(count: number, locale: Locale): 'one' | 'few' | 'other' {
    if (locale === 'ro') {
        return getRomanianPluralCategory(count);
    }
    return getEnglishPluralCategory(count);
}

/**
 * Pluralization options for different forms
 */
export interface PluralOptions {
    one: string;
    few?: string; // Only used for Romanian
    other: string;
}

/**
 * Returns the appropriate plural form based on count and locale
 * @param count - The count to determine pluralization
 * @param locale - The locale to use
 * @param options - The plural forms for different categories
 * @returns The appropriate plural form
 *
 * @example
 * // English
 * pluralize(1, 'en', { one: 'problem', other: 'problems' }) // "problem"
 * pluralize(5, 'en', { one: 'problem', other: 'problems' }) // "problems"
 *
 * // Romanian
 * pluralize(1, 'ro', { one: 'problemă', few: 'probleme', other: 'de probleme' }) // "problemă"
 * pluralize(5, 'ro', { one: 'problemă', few: 'probleme', other: 'de probleme' }) // "probleme"
 * pluralize(20, 'ro', { one: 'problemă', few: 'probleme', other: 'de probleme' }) // "de probleme"
 */
export function pluralize(count: number, locale: Locale, options: PluralOptions): string {
    const category = getPluralCategory(count, locale);

    if (category === 'one') {
        return options.one;
    }

    if (category === 'few' && options.few) {
        return options.few;
    }

    return options.other;
}

/**
 * Formats a count with the appropriate plural form
 * @param count - The count to format
 * @param locale - The locale to use
 * @param options - The plural forms
 * @param includeCount - Whether to include the count in the output
 * @returns Formatted string with count and plural form
 *
 * @example
 * formatPlural(1, 'en', { one: 'problem', other: 'problems' }) // "1 problem"
 * formatPlural(5, 'en', { one: 'problem', other: 'problems' }) // "5 problems"
 * formatPlural(5, 'ro', { one: 'problemă', few: 'probleme', other: 'de probleme' }) // "5 probleme"
 */
export function formatPlural(
    count: number,
    locale: Locale,
    options: PluralOptions,
    includeCount: boolean = true,
): string {
    const pluralForm = pluralize(count, locale, options);
    const formattedCount = formatInteger(count, locale);

    return includeCount ? `${formattedCount} ${pluralForm}` : pluralForm;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts our Locale type to a full locale string for Intl APIs
 */
function getLocaleString(locale: Locale): string {
    return locale === 'ro' ? 'ro-RO' : 'en-US';
}

/**
 * Formats a file size in bytes to a human-readable format
 */
export function formatFileSize(bytes: number, locale: Locale): string {
    const units = locale === 'ro' ? ['B', 'KB', 'MB', 'GB', 'TB'] : ['B', 'KB', 'MB', 'GB', 'TB'];

    if (bytes === 0) return `0 ${units[0]}`;

    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);

    return `${formatDecimal(value, locale, i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Formats a duration in milliseconds to a human-readable format
 */
export function formatDuration(ms: number, locale: Locale): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return formatPlural(days, locale, {
            one: locale === 'ro' ? 'zi' : 'day',
            few: locale === 'ro' ? 'zile' : undefined,
            other: locale === 'ro' ? 'de zile' : 'days',
        });
    }

    if (hours > 0) {
        return formatPlural(hours, locale, {
            one: locale === 'ro' ? 'oră' : 'hour',
            few: locale === 'ro' ? 'ore' : undefined,
            other: locale === 'ro' ? 'de ore' : 'hours',
        });
    }

    if (minutes > 0) {
        return formatPlural(minutes, locale, {
            one: locale === 'ro' ? 'minut' : 'minute',
            few: locale === 'ro' ? 'minute' : undefined,
            other: locale === 'ro' ? 'de minute' : 'minutes',
        });
    }

    return formatPlural(seconds, locale, {
        one: locale === 'ro' ? 'secundă' : 'second',
        few: locale === 'ro' ? 'secunde' : undefined,
        other: locale === 'ro' ? 'de secunde' : 'seconds',
    });
}
