import { describe, expect, it } from 'vitest';

import {
    getMissingOnboardingProfileFields,
    isOnboardingProfileComplete,
} from '@/lib/onboarding-profile';
import type { Country, Institution, UserProfile } from '@/lib/types';

const country: Country = {
    code: 'RO',
    name: 'Romania',
    nameRo: 'România',
    flagEmoji: '🇷🇴',
};

const institution = {
    id: 1,
    name: 'Colegiul Național',
    country,
} as Institution;

const completeProfile: UserProfile = {
    userId: 'user-1',
    username: 'student-ml',
    firstName: 'Ana',
    lastName: 'Pop',
    email: 'ana@example.com',
    joinedAt: new Date('2026-01-01'),
    avatar: '',
    bio: 'Learning machine learning.',
    location: 'Timișoara',
    website: null,
    github: null,
    totalScore: 0,
    problemsSolved: 0,
    averageScore: 0,
    rank: 0,
    leaderboardPlaced: false,
    country,
};

describe('onboarding profile completion', () => {
    it('uses one canonical set of required profile fields', () => {
        expect(isOnboardingProfileComplete(completeProfile)).toBe(true);
        expect(
            getMissingOnboardingProfileFields({
                ...completeProfile,
                firstName: ' ',
                bio: null,
            }),
        ).toEqual(['firstName', 'bio']);
    });

    it('requires a country only when the user has no institution', () => {
        expect(
            getMissingOnboardingProfileFields({
                ...completeProfile,
                country: undefined,
            }),
        ).toContain('countryCode');

        expect(
            isOnboardingProfileComplete({
                ...completeProfile,
                country: undefined,
                institution,
            }),
        ).toBe(true);
    });

    it('accepts an unsaved countryCode from the inline form', () => {
        expect(
            isOnboardingProfileComplete({
                ...completeProfile,
                country: undefined,
                countryCode: 'RO',
            }),
        ).toBe(true);
    });
});
