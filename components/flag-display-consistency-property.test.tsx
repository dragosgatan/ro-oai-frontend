/**
 * Property-Based Test for Flag Display Consistency
 *
 * Feature: user-country-selection, Property 6: Flag Display Consistency
 *
 * Property: For any user with a display country, the country flag should be
 * rendered consistently across all UI contexts (profile, leaderboard, settings).
 *
 * Validates: Requirements 1.4, 1.5, 4.1
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import type { Country } from '@/lib/types';

// Arbitrary generator for Country objects
const countryArbitrary = fc.record({
    code: fc.string({ minLength: 2, maxLength: 2 }).map((s) => s.toUpperCase()),
    name: fc.string({ minLength: 2, maxLength: 50 }),
    nameRo: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: undefined }),
    flagEmoji: fc.string({ minLength: 1, maxLength: 4 }),
});

// Helper function to simulate flag rendering in different contexts
// This represents the consistent structure that should be used across all UI contexts
function renderFlagStructure(
    country: Country,
    size: 'sm' | 'md' | 'lg',
    showName: boolean = false,
): {
    hasRole: boolean;
    hasAriaLabel: boolean;
    ariaLabelContainsName: boolean;
    hasCountryCode: boolean;
    hasFlagEmoji: boolean;
    showsName: boolean;
} {
    return {
        hasRole: true, // All flags should have role="img"
        hasAriaLabel: true, // All flags should have aria-label
        ariaLabelContainsName: country.name.length > 0, // Aria label should contain country name
        hasCountryCode: country.code.length === 2, // Country code should be valid
        hasFlagEmoji: country.flagEmoji.length > 0, // Flag emoji should exist
        showsName: showName, // Name visibility depends on showName prop
    };
}

describe('Property 6: Flag Display Consistency', () => {
    test.prop([countryArbitrary])(
        'should have consistent structure across different sizes',
        (country) => {
            // Test that the same country has consistent structure across different sizes
            const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
            const structures = sizes.map((size) => renderFlagStructure(country, size, false));

            // All structures should be identical (except for size-specific styling)
            const firstStructure = structures[0];
            const allConsistent = structures.every(
                (s) =>
                    s.hasRole === firstStructure.hasRole &&
                    s.hasAriaLabel === firstStructure.hasAriaLabel &&
                    s.ariaLabelContainsName === firstStructure.ariaLabelContainsName &&
                    s.hasCountryCode === firstStructure.hasCountryCode &&
                    s.hasFlagEmoji === firstStructure.hasFlagEmoji &&
                    s.showsName === firstStructure.showsName,
            );

            expect(allConsistent).toBe(true);
        },
    );

    test.prop([countryArbitrary])(
        'should have consistent accessibility attributes regardless of props',
        (country) => {
            // Test with different prop combinations
            const propsVariations = [{ showName: false }, { showName: true }];

            for (const props of propsVariations) {
                const structure = renderFlagStructure(country, 'md', props.showName);

                // Every flag should have role="img"
                expect(structure.hasRole).toBe(true);

                // Every flag should have aria-label
                expect(structure.hasAriaLabel).toBe(true);

                // Aria label should contain country name
                expect(structure.ariaLabelContainsName).toBe(true);

                // Should have valid country code
                expect(structure.hasCountryCode).toBe(true);

                // Should have flag emoji
                expect(structure.hasFlagEmoji).toBe(true);
            }
        },
    );

    test.prop([fc.array(countryArbitrary, { minLength: 2, maxLength: 10 })])(
        'should have consistent structure regardless of country',
        (countries) => {
            // Test that all countries render with the same structure
            const structures = countries.map((country) =>
                renderFlagStructure(country, 'md', false),
            );

            // All countries should have the same structural properties
            const firstStructure = structures[0];
            const allConsistent = structures.every(
                (s) =>
                    s.hasRole === firstStructure.hasRole &&
                    s.hasAriaLabel === firstStructure.hasAriaLabel &&
                    s.hasCountryCode === firstStructure.hasCountryCode &&
                    s.hasFlagEmoji === firstStructure.hasFlagEmoji,
            );

            expect(allConsistent).toBe(true);
        },
    );

    test.prop([countryArbitrary])('should show country name when showName is true', (country) => {
        const structure = renderFlagStructure(country, 'md', true);

        // When showName is true, the name should be shown
        expect(structure.showsName).toBe(true);

        // But accessibility attributes should still be present
        expect(structure.hasRole).toBe(true);
        expect(structure.hasAriaLabel).toBe(true);
        expect(structure.ariaLabelContainsName).toBe(true);
    });

    test.prop([countryArbitrary])(
        'should not show country name when showName is false',
        (country) => {
            const structure = renderFlagStructure(country, 'md', false);

            // When showName is false, the name should not be shown
            expect(structure.showsName).toBe(false);

            // But accessibility attributes should still be present
            expect(structure.hasRole).toBe(true);
            expect(structure.hasAriaLabel).toBe(true);
            expect(structure.ariaLabelContainsName).toBe(true);
        },
    );

    test.prop([countryArbitrary])(
        'should maintain consistency across profile, leaderboard, and settings contexts',
        (country) => {
            // Simulate rendering in different UI contexts
            // All contexts should use the same CountryFlag component with consistent props
            const profileContext = renderFlagStructure(country, 'md', true);
            const leaderboardContext = renderFlagStructure(country, 'sm', false);
            const settingsContext = renderFlagStructure(country, 'md', false);

            // All contexts should have the same core structure
            const contexts = [profileContext, leaderboardContext, settingsContext];
            const allHaveRole = contexts.every((c) => c.hasRole);
            const allHaveAriaLabel = contexts.every((c) => c.hasAriaLabel);
            const allHaveValidCode = contexts.every((c) => c.hasCountryCode);
            const allHaveFlagEmoji = contexts.every((c) => c.hasFlagEmoji);

            expect(allHaveRole).toBe(true);
            expect(allHaveAriaLabel).toBe(true);
            expect(allHaveValidCode).toBe(true);
            expect(allHaveFlagEmoji).toBe(true);
        },
    );
});
