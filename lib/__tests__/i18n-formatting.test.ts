import { describe, it, expect } from 'vitest';
import {
    formatDate,
    formatShortDate,
    formatMediumDate,
    formatLongDate,
    formatDateTime,
    formatTime,
    formatNumber,
    formatInteger,
    formatDecimal,
    formatPercent,
    formatScore,
    getPluralCategory,
    pluralize,
    formatPlural,
    formatFileSize,
    formatDuration,
} from '../i18n-formatting';

describe('i18n-formatting', () => {
    const testDate = new Date('2024-01-15T14:30:00Z');

    describe('Date Formatting', () => {
        it('should format dates in English', () => {
            const result = formatShortDate(testDate, 'en');
            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
        });

        it('should format dates in Romanian', () => {
            const result = formatShortDate(testDate, 'ro');
            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
        });

        it('should format medium dates', () => {
            const enResult = formatMediumDate(testDate, 'en');
            const roResult = formatMediumDate(testDate, 'ro');
            expect(enResult).toBeTruthy();
            expect(roResult).toBeTruthy();
        });

        it('should format long dates', () => {
            const enResult = formatLongDate(testDate, 'en');
            const roResult = formatLongDate(testDate, 'ro');
            expect(enResult).toBeTruthy();
            expect(roResult).toBeTruthy();
        });

        it('should format date with time', () => {
            const result = formatDateTime(testDate, 'en');
            expect(result).toBeTruthy();
        });

        it('should format time only', () => {
            const result = formatTime(testDate, 'en');
            expect(result).toBeTruthy();
        });

        it('should handle invalid dates gracefully', () => {
            const result = formatDate('invalid', 'en');
            expect(result).toBe('invalid');
        });
    });

    describe('Number Formatting', () => {
        it('should format integers with thousands separators', () => {
            const enResult = formatInteger(1234567, 'en');
            const roResult = formatInteger(1234567, 'ro');

            // English uses commas, Romanian uses dots
            expect(enResult).toContain('1');
            expect(roResult).toContain('1');
        });

        it('should format decimals with specified precision', () => {
            const result = formatDecimal(123.456, 'en', 2);
            expect(result).toContain('123');
        });

        it('should format percentages', () => {
            const result = formatPercent(75, 'en');
            expect(result).toContain('75');
            expect(result).toContain('%');
        });

        it('should format scores with appropriate precision', () => {
            const lowScore = formatScore(85.5, 'en');
            const highScore = formatScore(99.9999, 'en');

            expect(lowScore).toBeTruthy();
            expect(highScore).toBeTruthy();
        });

        it('should handle invalid numbers gracefully', () => {
            const result = formatNumber(NaN, 'en');
            expect(result).toBe('NaN');
        });
    });

    describe('Pluralization', () => {
        describe('English pluralization', () => {
            it('should return "one" for count of 1', () => {
                expect(getPluralCategory(1, 'en')).toBe('one');
            });

            it('should return "other" for count of 0', () => {
                expect(getPluralCategory(0, 'en')).toBe('other');
            });

            it('should return "other" for count > 1', () => {
                expect(getPluralCategory(5, 'en')).toBe('other');
            });
        });

        describe('Romanian pluralization', () => {
            it('should return "one" for count of 1', () => {
                expect(getPluralCategory(1, 'ro')).toBe('one');
            });

            it('should return "few" for count of 0', () => {
                expect(getPluralCategory(0, 'ro')).toBe('few');
            });

            it('should return "few" for counts 2-19', () => {
                expect(getPluralCategory(2, 'ro')).toBe('few');
                expect(getPluralCategory(15, 'ro')).toBe('few');
                expect(getPluralCategory(19, 'ro')).toBe('few');
            });

            it('should return "other" for count of 20+', () => {
                expect(getPluralCategory(20, 'ro')).toBe('other');
                expect(getPluralCategory(100, 'ro')).toBe('other');
            });
        });

        it('should pluralize correctly in English', () => {
            const options = { one: 'problem', other: 'problems' };

            expect(pluralize(1, 'en', options)).toBe('problem');
            expect(pluralize(5, 'en', options)).toBe('problems');
        });

        it('should pluralize correctly in Romanian', () => {
            const options = {
                one: 'problemă',
                few: 'probleme',
                other: 'de probleme',
            };

            expect(pluralize(1, 'ro', options)).toBe('problemă');
            expect(pluralize(5, 'ro', options)).toBe('probleme');
            expect(pluralize(20, 'ro', options)).toBe('de probleme');
        });

        it('should format plural with count', () => {
            const options = { one: 'problem', other: 'problems' };
            const result = formatPlural(5, 'en', options);

            expect(result).toContain('5');
            expect(result).toContain('problems');
        });
    });

    describe('Utility Formatters', () => {
        it('should format file sizes', () => {
            expect(formatFileSize(0, 'en')).toContain('0');
            expect(formatFileSize(1024, 'en')).toContain('KB');
            expect(formatFileSize(1048576, 'en')).toContain('MB');
        });

        it('should format durations', () => {
            const oneSecond = 1000;
            const oneMinute = 60 * 1000;
            const oneHour = 60 * 60 * 1000;
            const oneDay = 24 * 60 * 60 * 1000;

            expect(formatDuration(oneSecond, 'en')).toContain('second');
            expect(formatDuration(oneMinute, 'en')).toContain('minute');
            expect(formatDuration(oneHour, 'en')).toContain('hour');
            expect(formatDuration(oneDay, 'en')).toContain('day');
        });
    });
});
