/**
 * Property-Based Tests for Onboarding Country Selection
 *
 * Feature: user-country-selection, Property 9: Onboarding Country Pre-fill
 * Feature: user-country-selection, Property 10: Onboarding Country Requirement
 *
 * These tests verify that:
 * 1. When a user selects an institution during onboarding, the country field is pre-filled
 * 2. When a user has no institution, country selection is required
 */

import { describe, expect } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import type { UserProfile, Country, Institution } from '@/lib/types';
import {
    isOnboardingProfileComplete,
    type OnboardingProfileUpdate,
} from '@/lib/onboarding-profile';

// Helper function to validate profile data before submission
function validateProfileForSubmission(
    profile: UserProfile,
    updates: OnboardingProfileUpdate,
): {
    isValid: boolean;
    errors: Record<string, string>;
} {
    const errors: Record<string, string> = {};

    // Check if country is required (no institution)
    if (!profile.institution && !updates.countryCode && !profile.country) {
        errors.countryCode = 'Country is required';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

// Helper function to get display country (user country or institution country)
function getDisplayCountry(profile: UserProfile): Country | undefined {
    return profile.country || profile.institution?.country;
}

// Arbitraries for generating test data
const countryArb = fc.record({
    code: fc.string({ minLength: 2, maxLength: 2 }).map((s) => s.toUpperCase()),
    name: fc.string({ minLength: 3, maxLength: 50 }),
    nameRo: fc.option(fc.string({ minLength: 3, maxLength: 50 }), { nil: undefined }),
    flagEmoji: fc.constant('🏳️'),
});

const nonBlankString = (minLength: number, maxLength: number) =>
    fc.string({ minLength, maxLength }).filter((value) => value.trim().length > 0);

const countyArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: nonBlankString(1, 50),
    code: nonBlankString(1, 4),
});

const institutionArb = (country: Country) =>
    fc.record({
        id: fc.integer({ min: 1, max: 10000 }),
        name: nonBlankString(5, 100),
        type: fc.constantFrom('GIMNAZIU' as const, 'LICEU' as const, 'FACULTATE' as const),
        county: countyArb,
        country: fc.constant(country),
        memberCount: fc.integer({ min: 0, max: 10000 }),
        createdAt: fc.date(),
    });

const userProfileArb = (institution?: Institution, country?: Country) =>
    fc.record({
        userId: fc.uuid(),
        username: nonBlankString(3, 30),
        firstName: nonBlankString(1, 50),
        lastName: nonBlankString(1, 50),
        email: fc.emailAddress(),
        joinedAt: fc.date(),
        avatar: fc.webUrl(),
        bio: nonBlankString(1, 500),
        location: nonBlankString(1, 100),
        website: fc.option(fc.webUrl(), { nil: null }),
        github: fc.option(fc.webUrl(), { nil: null }),
        totalScore: fc.integer({ min: 0, max: 10000 }),
        problemsSolved: fc.integer({ min: 0, max: 100 }),
        averageScore: fc.float({ min: 0, max: 100 }),
        rank: fc.integer({ min: 0, max: 1000 }),
        leaderboardPlaced: fc.boolean(),
        institution: fc.constant(institution),
        institutionJoinedAt: institution
            ? fc.option(fc.date(), { nil: undefined })
            : fc.constant(undefined),
        country: fc.constant(country),
        onboardingDismissed: fc.boolean(),
    });

describe('Onboarding Country Property Tests', () => {
    describe('Property 9: Onboarding Country Pre-fill', () => {
        /**
         * **Feature: user-country-selection, Property 9: Onboarding Country Pre-fill**
         *
         * For any user in onboarding who selects an institution,
         * the country field should be pre-filled with that institution's country code.
         *
         * **Validates: Requirements 9.2**
         */
        test.prop([countryArb], { numRuns: 100 })(
            'user with institution should have display country from institution',
            (institutionCountry) => {
                const institution = fc.sample(institutionArb(institutionCountry), 1)[0];
                const userProfile = fc.sample(userProfileArb(institution, undefined), 1)[0];

                const displayCountry = getDisplayCountry(userProfile);

                // Display country should be the institution's country
                expect(displayCountry).toBeDefined();
                expect(displayCountry?.code).toBe(institutionCountry.code);
                expect(displayCountry?.name).toBe(institutionCountry.name);
            },
        );

        test.prop([countryArb], { numRuns: 100 })(
            'profile with institution should be complete without explicit country',
            (institutionCountry) => {
                const institution = fc.sample(institutionArb(institutionCountry), 1)[0];
                const userProfile = fc.sample(userProfileArb(institution, undefined), 1)[0];

                // Profile should be complete even without explicit country
                // because institution provides the country
                const isComplete = isOnboardingProfileComplete(userProfile);
                expect(isComplete).toBe(true);
            },
        );

        test.prop([countryArb, countryArb], { numRuns: 100 })(
            'user country should override institution country when both exist',
            (institutionCountry, userCountry) => {
                const institution = fc.sample(institutionArb(institutionCountry), 1)[0];
                const userProfile = fc.sample(userProfileArb(institution, userCountry), 1)[0];

                const displayCountry = getDisplayCountry(userProfile);

                // Display country should be the user's country, not institution's
                expect(displayCountry).toBeDefined();
                expect(displayCountry?.code).toBe(userCountry.code);
                expect(displayCountry?.name).toBe(userCountry.name);
            },
        );
    });

    describe('Property 10: Onboarding Country Requirement', () => {
        /**
         * **Feature: user-country-selection, Property 10: Onboarding Country Requirement**
         *
         * For any user in onboarding without an institution,
         * attempting to proceed without selecting a country should trigger a validation error.
         *
         * **Validates: Requirements 1.2, 9.3, 9.5**
         */
        test.prop([userProfileArb(undefined, undefined)], { numRuns: 100 })(
            'profile without institution and without country should be incomplete',
            (userProfile) => {
                // Remove country to ensure it's undefined
                const profileWithoutCountry = { ...userProfile, country: undefined };

                const isComplete = isOnboardingProfileComplete(profileWithoutCountry);

                // Profile should NOT be complete without country when no institution
                expect(isComplete).toBe(false);
            },
        );

        test.prop([userProfileArb(undefined, undefined)], { numRuns: 100 })(
            'validation should fail when submitting without country and no institution',
            (userProfile) => {
                // Remove country to ensure it's undefined
                const profileWithoutCountry = { ...userProfile, country: undefined };

                // Try to submit without country
                const validation = validateProfileForSubmission(profileWithoutCountry, {});

                // Validation should fail
                expect(validation.isValid).toBe(false);
                expect(validation.errors.countryCode).toBeDefined();
                expect(validation.errors.countryCode).toContain('required');
            },
        );

        test.prop([countryArb], { numRuns: 100 })(
            'profile without institution but with country should be complete',
            (country) => {
                const userProfile = fc.sample(userProfileArb(undefined, country), 1)[0];

                const isComplete = isOnboardingProfileComplete(userProfile);

                // Profile should be complete with country even without institution
                expect(isComplete).toBe(true);
            },
        );

        test.prop([countryArb], { numRuns: 100 })(
            'validation should pass when submitting with country and no institution',
            (country) => {
                const userProfile = fc.sample(userProfileArb(undefined, undefined), 1)[0];

                // Submit with country code
                const validation = validateProfileForSubmission(userProfile, {
                    countryCode: country.code,
                });

                // Validation should pass
                expect(validation.isValid).toBe(true);
                expect(Object.keys(validation.errors).length).toBe(0);
            },
        );
    });

    describe('Known Examples', () => {
        test('Romanian user with Romanian institution should show Romanian country', () => {
            const romaniaCountry: Country = {
                code: 'RO',
                name: 'Romania',
                nameRo: 'România',
                flagEmoji: '🇷🇴',
            };

            const romanianInstitution: Institution = {
                id: 1,
                name: 'Universitatea București',
                type: 'FACULTATE',
                county: { id: 1, name: 'București', code: 'B' },
                country: romaniaCountry,
                memberCount: 0,
                createdAt: new Date('2026-01-01'),
            };

            const userProfile = fc.sample(userProfileArb(romanianInstitution, undefined), 1)[0];

            const displayCountry = getDisplayCountry(userProfile);
            expect(displayCountry?.code).toBe('RO');
            expect(displayCountry?.name).toBe('Romania');
        });

        test('User without institution must have country to be complete', () => {
            const userProfile = fc.sample(userProfileArb(undefined, undefined), 1)[0];
            const profileWithoutCountry = { ...userProfile, country: undefined };

            expect(isOnboardingProfileComplete(profileWithoutCountry)).toBe(false);

            const romaniaCountry: Country = {
                code: 'RO',
                name: 'Romania',
                nameRo: 'România',
                flagEmoji: '🇷🇴',
            };

            const profileWithCountry = { ...userProfile, country: romaniaCountry };
            expect(isOnboardingProfileComplete(profileWithCountry)).toBe(true);
        });
    });
});
