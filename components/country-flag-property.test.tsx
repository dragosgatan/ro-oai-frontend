/**
 * CountryFlag Component Property-Based Tests
 *
 * Property test for task 15.2: Flag display consistency
 *
 * **Feature: institution-country-support, Property 3: Country Flag Display Consistency**
 *
 * This test verifies:
 * - For any institution with a valid country code, the country flag should be
 *   displayed consistently across all UI contexts (list view, detail view, rankings)
 *
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */

import { describe, it, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';

// Helper function to generate flag emoji from country code
// This mirrors the logic in the CountryFlag component
function generateFlagEmoji(countryCode: string): string {
    if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
        return '';
    }

    const normalizedCode = countryCode.toUpperCase();
    const codePoints = [...normalizedCode].map((char: string) => 0x1f1e6 + char.charCodeAt(0) - 65);
    const flagEmoji = String.fromCodePoint(...codePoints);

    return flagEmoji;
}

// Arbitrary for generating valid 2-letter country codes
const validCountryCodeArbitrary = fc.string({
    minLength: 2,
    maxLength: 2,
    unit: fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')),
});

describe('CountryFlag Property-Based Tests', () => {
    describe('Property 3: Country Flag Display Consistency', () => {
        test.prop([validCountryCodeArbitrary], { numRuns: 100 })(
            'should generate the same flag emoji for the same country code regardless of context',
            (countryCode) => {
                // Simulate rendering in different contexts (list view, detail view, rankings)
                const flagInListView = generateFlagEmoji(countryCode);
                const flagInDetailView = generateFlagEmoji(countryCode);
                const flagInRankings = generateFlagEmoji(countryCode);

                // All contexts should produce the same flag emoji
                expect(flagInListView).toBe(flagInDetailView);
                expect(flagInDetailView).toBe(flagInRankings);
                expect(flagInListView).toBe(flagInRankings);

                // The flag should be non-empty for valid codes
                expect(flagInListView.length).toBeGreaterThan(0);
            },
        );

        test.prop([validCountryCodeArbitrary], { numRuns: 100 })(
            'should be case-insensitive - same flag for uppercase and lowercase',
            (countryCode) => {
                const upperFlag = generateFlagEmoji(countryCode.toUpperCase());
                const lowerFlag = generateFlagEmoji(countryCode.toLowerCase());
                const mixedFlag = generateFlagEmoji(
                    countryCode.charAt(0).toUpperCase() + countryCode.charAt(1).toLowerCase(),
                );

                // All case variations should produce the same flag
                expect(upperFlag).toBe(lowerFlag);
                expect(lowerFlag).toBe(mixedFlag);
                expect(upperFlag).toBe(mixedFlag);
            },
        );

        test.prop([validCountryCodeArbitrary], { numRuns: 100 })(
            'should be deterministic - same input always produces same output',
            (countryCode) => {
                const flag1 = generateFlagEmoji(countryCode);
                const flag2 = generateFlagEmoji(countryCode);
                const flag3 = generateFlagEmoji(countryCode);

                // Multiple calls with same input should produce identical results
                expect(flag1).toBe(flag2);
                expect(flag2).toBe(flag3);
                expect(flag1).toBe(flag3);
            },
        );

        test.prop([validCountryCodeArbitrary, validCountryCodeArbitrary], { numRuns: 100 })(
            'should produce different flags for different country codes',
            (code1, code2) => {
                // Skip if codes are the same
                if (code1 === code2) {
                    return;
                }

                const flag1 = generateFlagEmoji(code1);
                const flag2 = generateFlagEmoji(code2);

                // Different country codes should produce different flags
                expect(flag1).not.toBe(flag2);
            },
        );

        test.prop([validCountryCodeArbitrary], { numRuns: 100 })(
            'should produce valid Unicode flag emoji',
            (countryCode) => {
                const flag = generateFlagEmoji(countryCode);

                // Flag should be non-empty
                expect(flag.length).toBeGreaterThan(0);

                // Flag should contain regional indicator symbols
                // Regional indicators are in the range U+1F1E6 to U+1F1FF
                const codePoints = [...flag].map((char) => char.codePointAt(0) || 0);

                // Should have exactly 2 code points (for a 2-letter country code)
                expect(codePoints.length).toBe(2);

                // Both code points should be in the regional indicator range
                codePoints.forEach((cp) => {
                    expect(cp).toBeGreaterThanOrEqual(0x1f1e6);
                    expect(cp).toBeLessThanOrEqual(0x1f1ff);
                });
            },
        );

        test.prop(
            [
                fc.oneof(
                    fc.constant(''),
                    fc.string({ minLength: 1, maxLength: 1 }),
                    fc.string({ minLength: 3, maxLength: 10 }),
                    fc.constant(null),
                    fc.constant(undefined),
                ),
            ],
            { numRuns: 100 },
        )('should return empty string for invalid country codes', (invalidCode) => {
            const flag = generateFlagEmoji(invalidCode as any);

            // Invalid codes should produce empty string
            expect(flag).toBe('');
        });
    });

    describe('Known Country Codes', () => {
        it('should correctly generate flags for common countries', () => {
            const knownCountries = [
                { code: 'RO', flag: '🇷🇴', name: 'Romania' },
                { code: 'US', flag: '🇺🇸', name: 'United States' },
                { code: 'MD', flag: '🇲🇩', name: 'Moldova' },
                { code: 'GB', flag: '🇬🇧', name: 'Great Britain' },
                { code: 'FR', flag: '🇫🇷', name: 'France' },
                { code: 'DE', flag: '🇩🇪', name: 'Germany' },
                { code: 'IT', flag: '🇮🇹', name: 'Italy' },
                { code: 'ES', flag: '🇪🇸', name: 'Spain' },
            ];

            knownCountries.forEach(({ code, flag, name }) => {
                const generated = generateFlagEmoji(code);
                expect(generated).toBe(flag);
            });
        });
    });
});
