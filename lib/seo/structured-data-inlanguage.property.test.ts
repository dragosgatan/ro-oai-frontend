/**
 * Property-Based Tests for Structured Data inLanguage
 *
 * **Property 7: Structured Data inLanguage**
 * **Validates: Requirements 4.1, 4.2**
 *
 * For any locale, both the Organization schema and WebSite schema
 * SHALL include an inLanguage property matching the current locale code.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateOrganizationSchema, generateWebSiteSchema } from './structured-data';
import { SUPPORTED_LOCALES } from './config';

/**
 * Arbitrary generator for supported locale values
 */
const arbitraryLocale = (): fc.Arbitrary<string> => {
    return fc.constantFrom(...SUPPORTED_LOCALES);
};

describe('Structured Data inLanguage Property Tests', () => {
    describe('Property 7: Structured Data inLanguage', () => {
        /**
         * **Feature: seo-localization, Property 7: Structured Data inLanguage**
         * **Validates: Requirements 4.1, 4.2**
         */
        it('Organization schema should include inLanguage matching the current locale', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryLocale(), async (locale) => {
                    const schema = generateOrganizationSchema(locale);

                    // Requirement 4.1: Organization schema SHALL include inLanguage property
                    expect(schema.inLanguage).toBeDefined();
                    expect(schema.inLanguage).toBe(locale);
                }),
                { numRuns: 100 },
            );
        });

        it('WebSite schema should include inLanguage matching the current locale', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryLocale(), async (locale) => {
                    const schema = generateWebSiteSchema(locale);

                    // Requirement 4.2: WebSite schema SHALL include inLanguage property
                    expect(schema.inLanguage).toBeDefined();
                    expect(schema.inLanguage).toBe(locale);
                }),
                { numRuns: 100 },
            );
        });

        it('inLanguage should be a valid locale string for Organization schema', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryLocale(), async (locale) => {
                    const schema = generateOrganizationSchema(locale);

                    // inLanguage should be a non-empty string
                    expect(typeof schema.inLanguage).toBe('string');
                    expect(schema.inLanguage!.length).toBeGreaterThan(0);

                    // inLanguage should be one of the supported locales
                    expect(SUPPORTED_LOCALES).toContain(schema.inLanguage);
                }),
                { numRuns: 100 },
            );
        });

        it('inLanguage should be a valid locale string for WebSite schema', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryLocale(), async (locale) => {
                    const schema = generateWebSiteSchema(locale);

                    // inLanguage should be a non-empty string
                    expect(typeof schema.inLanguage).toBe('string');
                    expect(schema.inLanguage!.length).toBeGreaterThan(0);

                    // inLanguage should be one of the supported locales
                    expect(SUPPORTED_LOCALES).toContain(schema.inLanguage);
                }),
                { numRuns: 100 },
            );
        });

        it('Organization and WebSite schemas should have consistent inLanguage for same locale', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryLocale(), async (locale) => {
                    const orgSchema = generateOrganizationSchema(locale);
                    const webSchema = generateWebSiteSchema(locale);

                    // Both schemas should have the same inLanguage value
                    expect(orgSchema.inLanguage).toBe(webSchema.inLanguage);
                    expect(orgSchema.inLanguage).toBe(locale);
                }),
                { numRuns: 100 },
            );
        });
    });
});
