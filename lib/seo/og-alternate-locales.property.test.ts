/**
 * Property-Based Tests for OG Alternate Locales
 *
 * **Property 6: OG Alternate Locales**
 * **Validates: Requirements 3.2**
 *
 * For any page rendered in locale L, the og:locale:alternate array SHALL
 * contain exactly SUPPORTED_LOCALES.length - 1 entries, excluding locale L itself.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { generateMetadata } from './metadata';
import { SUPPORTED_LOCALES, getOgLocale } from './config';
import type { Locale } from '@/lib/types';

describe('OG Alternate Locales Property Tests', () => {
    describe('Property 6: OG Alternate Locales', () => {
        /**
         * **Feature: seo-localization, Property 6: OG Alternate Locales**
         * **Validates: Requirements 3.2**
         *
         * Verify alternateLocales count equals SUPPORTED_LOCALES.length - 1
         */
        it('should include exactly SUPPORTED_LOCALES.length - 1 alternate locales', () => {
            fc.assert(
                fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale: Locale) => {
                    const metadata = generateMetadata({
                        title: 'Test Page',
                        description: 'Test description for the page',
                        locale,
                    });

                    // alternateLocales should have all locales except the current one
                    expect(metadata.openGraph.alternateLocales).toBeDefined();
                    expect(metadata.openGraph.alternateLocales?.length).toBe(
                        SUPPORTED_LOCALES.length - 1,
                    );
                }),
                { numRuns: 100 },
            );
        });

        it('should not include the current locale in alternateLocales', () => {
            fc.assert(
                fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale: Locale) => {
                    const metadata = generateMetadata({
                        title: 'Test Page',
                        description: 'Test description for the page',
                        locale,
                    });

                    const currentOgLocale = getOgLocale(locale);

                    // The current locale should not be in alternateLocales
                    expect(metadata.openGraph.alternateLocales).not.toContain(currentOgLocale);
                }),
                { numRuns: 100 },
            );
        });

        it('should include all other locales in alternateLocales', () => {
            fc.assert(
                fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale: Locale) => {
                    const metadata = generateMetadata({
                        title: 'Test Page',
                        description: 'Test description for the page',
                        locale,
                    });

                    const alternateLocales = metadata.openGraph.alternateLocales || [];

                    // Check that all other locales are included
                    for (const otherLocale of SUPPORTED_LOCALES) {
                        if (otherLocale !== locale) {
                            const expectedOgLocale = getOgLocale(otherLocale);
                            expect(alternateLocales).toContain(expectedOgLocale);
                        }
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should have alternateLocales in {language}_{REGION} format', () => {
            fc.assert(
                fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale: Locale) => {
                    const metadata = generateMetadata({
                        title: 'Test Page',
                        description: 'Test description for the page',
                        locale,
                    });

                    const alternateLocales = metadata.openGraph.alternateLocales || [];

                    // All alternate locales should be in {language}_{REGION} format
                    for (const altLocale of alternateLocales) {
                        expect(altLocale).toMatch(/^[a-z]{2,3}_[A-Z]{2}$/);
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should have unique values in alternateLocales', () => {
            fc.assert(
                fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale: Locale) => {
                    const metadata = generateMetadata({
                        title: 'Test Page',
                        description: 'Test description for the page',
                        locale,
                    });

                    const alternateLocales = metadata.openGraph.alternateLocales || [];
                    const uniqueLocales = new Set(alternateLocales);

                    // All values should be unique
                    expect(uniqueLocales.size).toBe(alternateLocales.length);
                }),
                { numRuns: 100 },
            );
        });

        it('should set og:locale to the current locale in {language}_{REGION} format', () => {
            fc.assert(
                fc.property(fc.constantFrom(...SUPPORTED_LOCALES), (locale: Locale) => {
                    const metadata = generateMetadata({
                        title: 'Test Page',
                        description: 'Test description for the page',
                        locale,
                    });

                    const expectedOgLocale = getOgLocale(locale);

                    // og:locale should match the expected format
                    expect(metadata.openGraph.locale).toBe(expectedOgLocale);
                }),
                { numRuns: 100 },
            );
        });
    });
});
