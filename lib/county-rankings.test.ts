import { describe, expect, it } from 'vitest';

import { normalizeCountyRankingsPayload } from './county-rankings';

describe('normalizeCountyRankingsPayload', () => {
    it('normalizes the flat payload returned by the live API', () => {
        expect(
            normalizeCountyRankingsPayload([
                {
                    rank: 1,
                    countyId: 44,
                    countyName: 'Sector 1',
                    countyCode: 'S1',
                    totalUsers: 88,
                    totalInstitutions: 7,
                    averageUsersPerInstitution: 12.571428571428571,
                },
            ]),
        ).toEqual([
            {
                rank: 1,
                county: { id: 44, name: 'Sector 1', code: 'S1' },
                totalUsers: 88,
                institutionCount: 7,
                averageUsersPerInstitution: 12.571428571428571,
            },
        ]);
    });

    it('keeps compatibility with the legacy nested payload', () => {
        expect(
            normalizeCountyRankingsPayload({
                content: [
                    {
                        rank: 2,
                        county: { id: 32, name: 'Prahova', code: 'PH' },
                        totalUsers: 78,
                        institutionCount: 45,
                        averageUsersPerInstitution: 1.733,
                    },
                ],
            }),
        ).toEqual([
            {
                rank: 2,
                county: { id: 32, name: 'Prahova', code: 'PH' },
                totalUsers: 78,
                institutionCount: 45,
                averageUsersPerInstitution: 1.733,
            },
        ]);
    });

    it('derives optional values, removes duplicates, and skips malformed rows', () => {
        expect(
            normalizeCountyRankingsPayload([
                {
                    countyId: '10',
                    countyName: 'București',
                    totalUsers: '20',
                    totalInstitutions: '4',
                },
                {
                    countyId: 10,
                    countyName: 'Duplicate',
                    totalUsers: 1,
                    totalInstitutions: 1,
                },
                { countyId: null, countyName: 'Missing ID' },
            ]),
        ).toEqual([
            {
                rank: 1,
                county: { id: 10, name: 'București', code: '' },
                totalUsers: 20,
                institutionCount: 4,
                averageUsersPerInstitution: 5,
            },
        ]);
    });

    it('preserves a genuinely empty leaderboard', () => {
        expect(normalizeCountyRankingsPayload([])).toEqual([]);
    });

    it.each([{}, null, [{ countyId: null }]])(
        'rejects a non-empty or malformed payload with no usable rankings',
        (payload) => {
            expect(() => normalizeCountyRankingsPayload(payload)).toThrow(
                'Invalid county rankings response',
            );
        },
    );
});
