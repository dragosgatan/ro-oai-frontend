import { describe, it, expect } from 'vitest';
import {
    toProfileSlug,
    getProfileUrl,
    getProfileUrlWithTab,
    isUsernameSlugFriendly,
    getUsernameSlugValidationMessage,
} from './profile-utils';

describe('profile-utils', () => {
    describe('toProfileSlug', () => {
        it('should convert username to lowercase', () => {
            expect(toProfileSlug('JohnDoe')).toBe('johndoe');
            expect(toProfileSlug('UPPERCASE')).toBe('uppercase');
        });

        it('should replace spaces with dashes', () => {
            expect(toProfileSlug('John Doe')).toBe('john-doe');
            expect(toProfileSlug('First Middle Last')).toBe('first-middle-last');
        });

        it('should replace underscores with dashes', () => {
            expect(toProfileSlug('john_doe')).toBe('john-doe');
            expect(toProfileSlug('first_middle_last')).toBe('first-middle-last');
        });

        it('should remove special characters', () => {
            expect(toProfileSlug('john@doe')).toBe('johndoe');
            expect(toProfileSlug('user!name#123')).toBe('username123');
            expect(toProfileSlug('test.user')).toBe('testuser');
        });

        it('should normalize unicode characters (remove accents)', () => {
            expect(toProfileSlug('Oepeling')).toBe('oepeling');
            expect(toProfileSlug('Ștefan')).toBe('stefan');
            expect(toProfileSlug('Ăăâîșț')).toBe('aaaist'); // â normalizes to a
            expect(toProfileSlug('José García')).toBe('jose-garcia');
        });

        it('should collapse multiple dashes into one', () => {
            expect(toProfileSlug('john--doe')).toBe('john-doe');
            expect(toProfileSlug('a   b   c')).toBe('a-b-c');
        });

        it('should trim leading and trailing dashes', () => {
            expect(toProfileSlug('-john-')).toBe('john');
            expect(toProfileSlug('--test--')).toBe('test');
        });

        it('should handle empty or null input', () => {
            expect(toProfileSlug('')).toBe('');
            expect(toProfileSlug(null)).toBe('');
            expect(toProfileSlug(undefined)).toBe('');
            expect(toProfileSlug('   ')).toBe('');
        });

        it('should keep numbers', () => {
            expect(toProfileSlug('user123')).toBe('user123');
            expect(toProfileSlug('123user')).toBe('123user');
            expect(toProfileSlug('user 123 test')).toBe('user-123-test');
        });
    });

    describe('isUsernameSlugFriendly', () => {
        it('should return true for slug-friendly usernames', () => {
            expect(isUsernameSlugFriendly('johndoe')).toBe(true);
            expect(isUsernameSlugFriendly('john-doe')).toBe(true);
            expect(isUsernameSlugFriendly('user123')).toBe(true);
        });

        it('should return false for non-slug-friendly usernames', () => {
            expect(isUsernameSlugFriendly('Radu_')).toBe(false);
            expect(isUsernameSlugFriendly('john_doe')).toBe(false);
            expect(isUsernameSlugFriendly('test.user')).toBe(false);
            expect(isUsernameSlugFriendly('John Doe')).toBe(false);
        });

        it('should handle empty or null input', () => {
            expect(isUsernameSlugFriendly('')).toBe(false);
            expect(isUsernameSlugFriendly(null)).toBe(false);
            expect(isUsernameSlugFriendly(undefined)).toBe(false);
        });
    });

    describe('getUsernameSlugValidationMessage', () => {
        it('should return null for slug-friendly usernames', () => {
            expect(getUsernameSlugValidationMessage('johndoe')).toBe(null);
            expect(getUsernameSlugValidationMessage('john-doe')).toBe(null);
        });

        it('should return message for usernames with underscores', () => {
            const message = getUsernameSlugValidationMessage('john_doe');
            expect(message).toContain('underscore');
            expect(message).toContain('john-doe');
        });

        it('should return message for usernames ending with special char', () => {
            const message = getUsernameSlugValidationMessage('Radu_');
            expect(message).not.toBe(null);
        });

        it('should handle empty or null input', () => {
            expect(getUsernameSlugValidationMessage('')).toBe(null);
            expect(getUsernameSlugValidationMessage(null)).toBe(null);
        });
    });

    describe('getProfileUrl', () => {
        it('should use username directly when username is provided', () => {
            expect(getProfileUrl('uuid-123', 'JohnDoe')).toBe('/profile/JohnDoe');
            expect(getProfileUrl('uuid-456', 'Radu_')).toBe('/profile/Radu_');
        });

        it('should URL-encode special characters in username', () => {
            expect(getProfileUrl('uuid-123', 'John Doe')).toBe('/profile/John%20Doe');
        });

        it('should fall back to userId when username is empty', () => {
            expect(getProfileUrl('uuid-123', '')).toBe('/profile/uuid-123');
            expect(getProfileUrl('uuid-123', null)).toBe('/profile/uuid-123');
            expect(getProfileUrl('uuid-123', undefined)).toBe('/profile/uuid-123');
        });

        it('should fall back to userId when username is whitespace only', () => {
            expect(getProfileUrl('uuid-123', '   ')).toBe('/profile/uuid-123');
        });
    });

    describe('getProfileUrlWithTab', () => {
        it('should append tab query parameter', () => {
            expect(getProfileUrlWithTab('uuid-123', 'JohnDoe', 'submissions')).toBe(
                '/profile/JohnDoe?tab=submissions',
            );
            expect(getProfileUrlWithTab('uuid-123', null, 'achievements')).toBe(
                '/profile/uuid-123?tab=achievements',
            );
        });

        it('should return base URL when tab is not provided', () => {
            expect(getProfileUrlWithTab('uuid-123', 'JohnDoe')).toBe('/profile/JohnDoe');
            expect(getProfileUrlWithTab('uuid-123', 'JohnDoe', undefined)).toBe('/profile/JohnDoe');
        });
    });
});
