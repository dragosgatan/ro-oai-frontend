/**
 * Property-Based Tests for Translation File Existence
 *
 * **Property 10: Translation File Existence**
 * **Validates: Requirements 5.3**
 *
 * For all locales in SUPPORTED_LOCALES, there SHALL exist a corresponding
 * translation file at locales/{locale}.json.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

import { SUPPORTED_LOCALES } from './config';
import { Locale } from '@/lib/types';

// Path to locales directory
const localesDir = path.join(__dirname, '../../locales');

/**
 * Check if a translation file exists for a given locale
 */
function translationFileExists(locale: Locale): boolean {
    const filePath = path.join(localesDir, `${locale}.json`);
    return fs.existsSync(filePath);
}

/**
 * Load and validate a translation file
 */
function loadTranslationFile(locale: Locale): Record<string, unknown> | null {
    const filePath = path.join(localesDir, `${locale}.json`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

describe('Translation File Existence Property Tests', () => {
    describe('Property 10: Translation File Existence', () => {
        /**
         * **Feature: seo-localization, Property 10: Translation File Existence**
         * **Validates: Requirements 5.3**
         *
         * Verify each locale has a corresponding translation file
         */
        it('should have a translation file for every supported locale', () => {
            fc.assert(
                fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale: Locale) => {
                    const exists = translationFileExists(locale);
                    expect(exists).toBe(true);
                }),
                { numRuns: SUPPORTED_LOCALES.length },
            );
        });

        it('should have valid JSON in every translation file', () => {
            fc.assert(
                fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale: Locale) => {
                    const content = loadTranslationFile(locale);
                    expect(content).not.toBeNull();
                    expect(typeof content).toBe('object');
                }),
                { numRuns: SUPPORTED_LOCALES.length },
            );
        });

        it('should have all 30 translation files present', () => {
            const missingFiles: Locale[] = [];

            for (const locale of SUPPORTED_LOCALES) {
                if (!translationFileExists(locale)) {
                    missingFiles.push(locale);
                }
            }

            expect(missingFiles).toHaveLength(0);
            expect(SUPPORTED_LOCALES.length).toBe(30);
        });

        it('should have non-empty translation files', () => {
            fc.assert(
                fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale: Locale) => {
                    const content = loadTranslationFile(locale);
                    expect(content).not.toBeNull();

                    // File should have at least some keys
                    const keys = Object.keys(content || {});
                    expect(keys.length).toBeGreaterThan(0);
                }),
                { numRuns: SUPPORTED_LOCALES.length },
            );
        });
    });
});
