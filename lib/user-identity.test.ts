import { describe, expect, it } from 'vitest';

import {
    getUsableAvatarUrl,
    getUserAvatarTone,
    getUserDisplayName,
    getUserInitials,
    USER_AVATAR_TONES,
} from '@/lib/user-identity';

describe('user identity', () => {
    it('prefers normalized first and last names for display and initials', () => {
        const identity = {
            firstName: '  Mark ',
            lastName: '  Twain  ',
            displayName: 'mark_twain',
            username: 'mark',
        };

        expect(getUserDisplayName(identity)).toBe('Mark Twain');
        expect(getUserInitials(identity)).toBe('MT');
    });

    it('preserves Romanian diacritics and normalizes decomposed Unicode', () => {
        expect(getUserInitials({ firstName: 'Ștefan', lastName: 'Țîră' })).toBe('ȘȚ');
        expect(
            getUserInitials({
                firstName: 'S\u0326tefan',
                lastName: 'T\u0326îră',
            }),
        ).toBe('ȘȚ');
    });

    it('uses a single username grapheme when public names are unavailable', () => {
        expect(
            getUserInitials({
                firstName: ' ',
                lastName: null,
                username: '  _mark.twain ',
            }),
        ).toBe('M');
        expect(getUserInitials({ username: '🧠coder' })).toBe('🧠');
    });

    it('uses the first and last word of a public display name', () => {
        expect(getUserInitials({ displayName: '  Ana Maria Popescu  ' })).toBe('AP');
        expect(getUserInitials({ displayName: '李 小龍' })).toBe('李小');
    });

    it('accepts explicit initials and has a safe anonymous fallback', () => {
        expect(
            getUserInitials({
                fallbackInitials: ' m ț ',
                firstName: 'Ignored',
                lastName: 'Name',
            }),
        ).toBe('MȚ');
        expect(getUserInitials({})).toBe('?');
    });

    it('filters legacy placeholders and unsafe avatar schemes', () => {
        expect(getUsableAvatarUrl(undefined)).toBeUndefined();
        expect(getUsableAvatarUrl('  /placeholder.svg  ')).toBeUndefined();
        expect(getUsableAvatarUrl('/placeholder-user.jpg?version=2')).toBeUndefined();
        expect(getUsableAvatarUrl('javascript:alert(1)')).toBeUndefined();
        expect(getUsableAvatarUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeUndefined();
        expect(getUsableAvatarUrl('https://images.example/avatar.png')).toBe(
            'https://images.example/avatar.png',
        );
        expect(getUsableAvatarUrl('data:image/png;base64,AA==')).toBe('data:image/png;base64,AA==');
    });

    it('selects a deterministic tone from the supported palette', () => {
        const identity = { userId: 'user-42', username: 'participant' };
        const tone = getUserAvatarTone(identity);

        expect(getUserAvatarTone(identity)).toBe(tone);
        expect(USER_AVATAR_TONES).toContain(tone);
    });
});
