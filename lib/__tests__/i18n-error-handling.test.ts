/**
 * Tests for i18n error handling and fallback mechanisms
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    validateTranslationKey,
    findMissingTranslations,
    getTranslationWithFallback,
    warnMissingTranslation,
    clearMissingTranslationsCache,
} from '../i18n-validation';
import {
    findMissingTranslations as findMissingFromReport,
    getTranslationCoverage,
    findExtraTranslations,
} from '../i18n-coverage-report';

describe('i18n Error Handling', () => {
    beforeEach(() => {
        // Clear console mocks and cache before each test
        vi.clearAllMocks();
        clearMissingTranslationsCache();
    });

    describe('Translation Key Validation', () => {
        it('should validate existing translation keys', () => {
            expect(validateTranslationKey('common.appName', 'en')).toBe(true);
            expect(validateTranslationKey('navigation.problems', 'en')).toBe(true);
        });

        it('should return false for non-existent keys', () => {
            expect(validateTranslationKey('nonexistent.key', 'en')).toBe(false);
            expect(validateTranslationKey('invalid.nested.key', 'ro')).toBe(false);
        });

        it('should validate nested keys correctly', () => {
            expect(validateTranslationKey('hero.title', 'en')).toBe(true);
            expect(validateTranslationKey('hero.subtitle', 'en')).toBe(true);
        });
    });

    describe('Fallback Mechanism', () => {
        it('should return translation for existing key', () => {
            const translation = getTranslationWithFallback('common.appName', 'en');
            expect(translation).toBe('MLCompete');
        });

        it('should fallback to English for missing Romanian translation', () => {
            // This test assumes there might be missing keys in Romanian
            const translation = getTranslationWithFallback('common.appName', 'ro');
            expect(translation).toBeTruthy();
            expect(typeof translation).toBe('string');
        });

        it('should return key path for completely missing keys in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const translation = getTranslationWithFallback('completely.missing.key', 'en');
            expect(translation).toBe('[completely.missing.key]');

            process.env.NODE_ENV = originalEnv;
        });

        it('should return empty string for missing keys in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const translation = getTranslationWithFallback('completely.missing.key', 'en');
            expect(translation).toBe('');

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('Missing Translation Detection', () => {
        it('should find missing translations between locales', () => {
            const sourceMessages = {
                common: {
                    key1: 'value1',
                    key2: 'value2',
                },
                navigation: {
                    home: 'Home',
                },
            };

            const targetMessages = {
                common: {
                    key1: 'translated1',
                    // key2 is missing
                },
                // navigation is completely missing
            };

            const missing = findMissingFromReport(sourceMessages, targetMessages);
            expect(missing).toContain('common.key2');
            expect(missing).toContain('navigation.home');
        });

        it('should return empty array when all translations present', () => {
            const messages = {
                common: {
                    key1: 'value1',
                },
            };

            const missing = findMissingFromReport(messages, messages);
            expect(missing).toHaveLength(0);
        });
    });

    describe('Translation Coverage', () => {
        it('should calculate 100% coverage for identical translations', () => {
            const messages = {
                common: {
                    key1: 'value1',
                    key2: 'value2',
                },
            };

            const coverage = getTranslationCoverage(messages, messages);
            expect(coverage).toBe(100);
        });

        it('should calculate correct coverage percentage', () => {
            const sourceMessages = {
                key1: 'value1',
                key2: 'value2',
                key3: 'value3',
                key4: 'value4',
            };

            const targetMessages = {
                key1: 'translated1',
                key2: 'translated2',
                // key3 and key4 missing = 50% coverage
            };

            const coverage = getTranslationCoverage(sourceMessages, targetMessages);
            expect(coverage).toBe(50);
        });

        it('should handle nested objects in coverage calculation', () => {
            const sourceMessages = {
                common: {
                    key1: 'value1',
                    key2: 'value2',
                },
                navigation: {
                    home: 'Home',
                    about: 'About',
                },
            };

            const targetMessages = {
                common: {
                    key1: 'translated1',
                    key2: 'translated2',
                },
                navigation: {
                    home: 'Acasă',
                    // about is missing
                },
            };

            const coverage = getTranslationCoverage(sourceMessages, targetMessages);
            expect(coverage).toBe(75); // 3 out of 4 keys present
        });
    });

    describe('Extra Translations Detection', () => {
        it('should find extra keys in target that are not in source', () => {
            const sourceMessages = {
                common: {
                    key1: 'value1',
                },
            };

            const targetMessages = {
                common: {
                    key1: 'translated1',
                    key2: 'extra translation',
                },
                extra: {
                    unused: 'unused translation',
                },
            };

            const extra = findExtraTranslations(sourceMessages, targetMessages);
            expect(extra).toContain('common.key2');
            expect(extra).toContain('extra.unused');
        });

        it('should return empty array when no extra keys', () => {
            const sourceMessages = {
                common: {
                    key1: 'value1',
                    key2: 'value2',
                },
            };

            const targetMessages = {
                common: {
                    key1: 'translated1',
                },
            };

            const extra = findExtraTranslations(sourceMessages, targetMessages);
            expect(extra).toHaveLength(0);
        });
    });

    describe('Missing Translation Warnings', () => {
        it('should warn about missing translations in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            warnMissingTranslation('test.key', 'ro');

            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
            process.env.NODE_ENV = originalEnv;
        });

        it('should not warn about same missing translation twice', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            warnMissingTranslation('test.key', 'ro');
            warnMissingTranslation('test.key', 'ro');

            // Should only warn once
            expect(consoleSpy).toHaveBeenCalledTimes(1);

            consoleSpy.mockRestore();
            process.env.NODE_ENV = originalEnv;
        });

        it('should not warn in production mode', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            warnMissingTranslation('test.key', 'ro');

            expect(consoleSpy).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
            process.env.NODE_ENV = originalEnv;
        });
    });
});
