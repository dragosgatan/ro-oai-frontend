import { describe, expect, it } from 'vitest';

import {
    formatProblemAuthorNames,
    getProblemAuthorNames,
    getProblemAuthors,
} from '@/lib/problem-authors';

describe('problem author attribution', () => {
    it('uses ordered first-name last-name snapshots instead of usernames', () => {
        const problem = {
            author: 'Legacy Author',
            authors: [
                {
                    userId: null,
                    firstName: 'Ana',
                    lastName: 'Popescu',
                    displayName: 'Ana Popescu',
                    displayOrder: 2,
                },
                {
                    userId: 'user-1',
                    firstName: 'Pixel',
                    lastName: 'Testerson',
                    displayName: 'username_should_not_render',
                    displayOrder: 1,
                },
            ],
        };

        expect(getProblemAuthorNames(problem)).toEqual(['Pixel Testerson', 'Ana Popescu']);
        expect(formatProblemAuthorNames(problem, 'ro')).toContain('Pixel Testerson');
        expect(formatProblemAuthorNames(problem, 'ro')).toContain('Ana Popescu');
    });

    it('keeps the legacy author readable during a rolling backend deployment', () => {
        expect(getProblemAuthors({ author: '  Ion   Ionescu  ', authors: [] })).toEqual([
            expect.objectContaining({ userId: null, displayName: 'Ion Ionescu' }),
        ]);
    });
});
