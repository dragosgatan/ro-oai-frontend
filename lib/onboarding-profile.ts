import type { UserProfile } from '@/lib/types';

export type OnboardingProfileField =
    | 'username'
    | 'firstName'
    | 'lastName'
    | 'bio'
    | 'location'
    | 'countryCode';

export type OnboardingProfileInput = Pick<
    UserProfile,
    'username' | 'firstName' | 'lastName' | 'bio' | 'location' | 'institution' | 'country'
> & {
    countryCode?: string | null;
};

export type OnboardingProfileUpdate = {
    username?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    location?: string;
    countryCode?: string | null;
};

const REQUIRED_TEXT_FIELDS: Exclude<OnboardingProfileField, 'countryCode'>[] = [
    'username',
    'firstName',
    'lastName',
    'bio',
    'location',
];

export function getMissingOnboardingProfileFields(
    profile: OnboardingProfileInput,
): OnboardingProfileField[] {
    const missing: OnboardingProfileField[] = REQUIRED_TEXT_FIELDS.filter((field) => {
        const value = profile[field];
        return typeof value !== 'string' || value.trim().length === 0;
    });

    const hasExplicitCountryCode = Object.prototype.hasOwnProperty.call(profile, 'countryCode');
    const hasCountry = hasExplicitCountryCode
        ? Boolean(profile.countryCode)
        : Boolean(profile.country?.code);
    if (!profile.institution && !hasCountry) {
        missing.push('countryCode');
    }

    return missing;
}

export function isOnboardingProfileComplete(profile: OnboardingProfileInput): boolean {
    return getMissingOnboardingProfileFields(profile).length === 0;
}
