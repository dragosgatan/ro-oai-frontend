import { describe, expect, it } from 'vitest';

import {
    generateItemListSchema,
    generateProblemSchema,
    generateQuizSchema,
} from '@/lib/seo/structured-data';
import { BASE_URL } from '@/lib/seo/config';
import type { GenericLeaderboardEntry, Problem } from '@/lib/types';

describe('leaderboard structured data', () => {
    it('can describe the full leaderboard while emitting only the supplied top entries', () => {
        const entries: GenericLeaderboardEntry[] = Array.from({ length: 10 }, (_, index) => ({
            rank: index + 1,
            userId: `user-${index + 1}`,
            username: `participant-${index + 1}`,
            totalScore: 100 - index,
        }));

        const schema = generateItemListSchema(entries, 'ro', 674) as {
            numberOfItems: number;
            itemListElement: Array<{ position: number }>;
        };

        expect(schema.numberOfItems).toBe(674);
        expect(schema.itemListElement).toHaveLength(10);
        expect(schema.itemListElement.map((item) => item.position)).toEqual([
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        ]);
    });
});

describe('problem author structured data', () => {
    const problem: Problem = {
        id: 289,
        title: 'Grid Search',
        shortDescription: 'Tune a model.',
        difficulty: 'Medium',
        author: 'Legacy Author',
        authors: [
            {
                userId: 'user-1',
                username: 'pixel-testerson',
                firstName: 'Pixel',
                lastName: 'Testerson',
                displayName: 'old_username',
                displayOrder: 0,
            },
            {
                userId: null,
                firstName: 'Ana',
                lastName: 'Popescu',
                displayName: 'Ana Popescu',
                displayOrder: 1,
            },
        ],
        lastAttemptedScore: null,
        partialTopScore: 0,
        subtasks: null,
        isInOngoingCompetition: false,
        selectedSubmissionIds: [],
        metricPreference: 'BIGGER_IS_BETTER',
    };

    it('emits separate Person entries for linked and named authors', () => {
        const expected = [
            {
                '@type': 'Person',
                name: 'Pixel Testerson',
                url: `${BASE_URL}/ro/profile/pixel-testerson`,
            },
            { '@type': 'Person', name: 'Ana Popescu' },
        ];

        expect(generateQuizSchema(problem, 'ro').author).toEqual(expected);
        expect((generateProblemSchema(problem, 'ro') as { author: unknown }).author).toEqual(
            expected,
        );
    });
});
