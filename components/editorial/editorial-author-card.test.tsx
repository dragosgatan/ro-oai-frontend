/**
 * Property-based tests for EditorialAuthorCard component
 *
 * **Feature: competition-editorial, Property 8: Author profile link correctness**
 * **Validates: Requirements 3.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getProfileUrl } from '@/lib/profile-utils';
import { formatRankBadge } from './editorial-author-utils';

// Arbitrary for generating valid user IDs (alphanumeric strings)
const userIdArbitrary = fc.stringMatching(/^[a-zA-Z0-9_-]{1,36}$/);

describe('EditorialAuthorCard', () => {
    describe('Property 8: Author profile link correctness', () => {
        /**
         * **Feature: competition-editorial, Property 8: Author profile link correctness**
         * **Validates: Requirements 3.1**
         *
         * For any editorial author, the rendered profile link uses the encoded
         * username when available and safely falls back to the user ID.
         */
        it('uses the user ID when no username is available', () => {
            fc.assert(
                fc.property(userIdArbitrary, (userId) => {
                    const url = getProfileUrl(userId);
                    expect(url).toBe(`/profile/${userId}`);
                }),
            );
        });

        it('uses and safely encodes the username shown by the author card', () => {
            fc.assert(
                fc.property(
                    userIdArbitrary,
                    fc.string({ minLength: 1 }).filter((username) => username.trim().length > 0),
                    (userId, username) => {
                        const normalizedUsername = username.trim();
                        expect(getProfileUrl(userId, username)).toBe(
                            `/profile/${encodeURIComponent(normalizedUsername)}`,
                        );
                    },
                ),
            );
        });
    });

    describe('formatRankBadge', () => {
        it('should return gold medal for rank 1', () => {
            expect(formatRankBadge(1)).toBe('🥇 1st');
        });

        it('should return silver medal for rank 2', () => {
            expect(formatRankBadge(2)).toBe('🥈 2nd');
        });

        it('should return bronze medal for rank 3', () => {
            expect(formatRankBadge(3)).toBe('🥉 3rd');
        });

        it('should return #N format for ranks > 3', () => {
            fc.assert(
                fc.property(fc.integer({ min: 4, max: 10000 }), (rank) => {
                    const badge = formatRankBadge(rank);
                    expect(badge).toBe(`#${rank}`);
                }),
            );
        });
    });
});
