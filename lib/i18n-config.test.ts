/**
 * Property-Based Test: Language Preference Persistence Round-Trip
 *
 * Feature: multi-language-support
 * Property 2: Language Preference Persistence Round-Trip
 *
 * For any valid locale code, saving the locale preference and then
 * retrieving it SHALL return the same locale code.
 *
 * Validates: Requirements 1.4, 2.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, Locale } from './types';
import {
    saveLocale,
    getStoredLocale,
    isValidLocale,
    normalizeLocale,
    detectLocale,
} from './i18n-config';

// Mock localStorage for testing
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
    };
})();

// Mock document.cookie
let cookieStore = '';

describe('Language Preference Persistence', () => {
    beforeEach(() => {
        // Setup localStorage mock
        vi.stubGlobal('localStorage', localStorageMock);
        localStorageMock.clear();

        // Setup document.cookie mock
        cookieStore = '';
        Object.defineProperty(document, 'cookie', {
            get: () => cookieStore,
            set: (value: string) => {
                cookieStore = cookieStore ? `${cookieStore}; ${value}` : value;
            },
            configurable: true,
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        localStorageMock.clear();
    });

    describe('Task 13.1: Verify localStorage persistence works for all locales', () => {
        it('should save and retrieve English locale', () => {
            saveLocale('en');
            expect(getStoredLocale()).toBe('en');
        });

        it('should save and retrieve Romanian locale', () => {
            saveLocale('ro');
            expect(getStoredLocale()).toBe('ro');
        });

        it('should save and retrieve German locale', () => {
            saveLocale('de');
            expect(getStoredLocale()).toBe('de');
        });

        it('should save and retrieve Bulgarian locale', () => {
            saveLocale('bg');
            expect(getStoredLocale()).toBe('bg');
        });

        it('should save and retrieve Serbian locale', () => {
            saveLocale('sr');
            expect(getStoredLocale()).toBe('sr');
        });

        it('should save and retrieve Ukrainian locale', () => {
            saveLocale('uk');
            expect(getStoredLocale()).toBe('uk');
        });

        it('should save and retrieve Hungarian locale', () => {
            saveLocale('hu');
            expect(getStoredLocale()).toBe('hu');
        });

        it('should return null when no locale is stored', () => {
            expect(getStoredLocale()).toBeNull();
        });

        it('should use correct localStorage key', () => {
            saveLocale('de');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('mlcompete-locale', 'de');
        });

        it('should set cookie when saving locale', () => {
            saveLocale('bg');
            expect(cookieStore).toContain('mlcompete-locale=bg');
            expect(cookieStore).toContain('NEXT_LOCALE=bg');
        });
    });

    describe('Task 13.2: Property 2 - Language Preference Persistence Round-Trip', () => {
        // Arbitrary for generating valid locale codes
        const localeArbitrary = fc.constantFrom(...SUPPORTED_LOCALES);

        fcTest.prop([localeArbitrary], { numRuns: 100 })(
            'For any valid locale, saving and retrieving should return the same locale',
            (locale: Locale) => {
                // Clear any previous state
                localStorageMock.clear();

                // Save the locale
                saveLocale(locale);

                // Retrieve the locale
                const retrieved = getStoredLocale();

                // Should return the same locale
                expect(retrieved).toBe(locale);
            },
        );

        fcTest.prop([localeArbitrary, localeArbitrary], { numRuns: 100 })(
            'Saving a new locale should overwrite the previous locale',
            (firstLocale: Locale, secondLocale: Locale) => {
                // Clear any previous state
                localStorageMock.clear();

                // Save first locale
                saveLocale(firstLocale);

                // Save second locale (overwrite)
                saveLocale(secondLocale);

                // Should return the second locale
                const retrieved = getStoredLocale();
                expect(retrieved).toBe(secondLocale);
            },
        );
    });

    describe('isValidLocale', () => {
        it('should return true for all supported locales', () => {
            for (const locale of SUPPORTED_LOCALES) {
                expect(isValidLocale(locale)).toBe(true);
            }
        });

        it('should return false for invalid locale codes', () => {
            expect(isValidLocale('xx')).toBe(false);
            expect(isValidLocale('invalid')).toBe(false);
            expect(isValidLocale('')).toBe(false);
        });

        fcTest.prop([fc.constantFrom(...SUPPORTED_LOCALES)], { numRuns: 100 })(
            'For any supported locale, isValidLocale should return true',
            (locale: Locale) => {
                expect(isValidLocale(locale)).toBe(true);
            },
        );
    });

    describe('normalizeLocale', () => {
        it('should normalize locale strings with region codes', () => {
            expect(normalizeLocale('en-US')).toBe('en');
            expect(normalizeLocale('en-GB')).toBe('en');
            expect(normalizeLocale('ro-RO')).toBe('ro');
            expect(normalizeLocale('de-DE')).toBe('de');
            expect(normalizeLocale('de-AT')).toBe('de');
            expect(normalizeLocale('bg-BG')).toBe('bg');
            expect(normalizeLocale('sr-RS')).toBe('sr');
            expect(normalizeLocale('uk-UA')).toBe('uk');
            expect(normalizeLocale('hu-HU')).toBe('hu');
        });

        it('should return null for unsupported locales', () => {
            expect(normalizeLocale('invalid')).toBeNull();
            expect(normalizeLocale('xx-XX')).toBeNull();
            expect(normalizeLocale('zz')).toBeNull();
        });

        it('should normalize new supported locales with region codes', () => {
            expect(normalizeLocale('fr-FR')).toBe('fr');
            expect(normalizeLocale('es-ES')).toBe('es');
            expect(normalizeLocale('ru-RU')).toBe('ru');
            expect(normalizeLocale('pl-PL')).toBe('pl');
            expect(normalizeLocale('it-IT')).toBe('it');
        });

        it('should handle lowercase conversion', () => {
            expect(normalizeLocale('EN-US')).toBe('en');
            expect(normalizeLocale('RO-RO')).toBe('ro');
            expect(normalizeLocale('DE-DE')).toBe('de');
        });

        it('should preserve the canonical Chinese locale', () => {
            expect(normalizeLocale('zh-CN')).toBe('zh-CN');
            expect(normalizeLocale('ZH-cn')).toBe('zh-CN');
            expect(normalizeLocale('zh-Hans')).toBe('zh-CN');
        });
    });

    describe('detectLocale', () => {
        it('should return stored locale if available', () => {
            saveLocale('de');
            expect(detectLocale()).toBe('de');
        });

        it('should return default locale when no preference is stored', () => {
            // No locale stored, no browser language mocked
            vi.stubGlobal('navigator', { language: undefined, languages: [] });
            expect(detectLocale()).toBe(DEFAULT_LOCALE);
        });
    });
});
