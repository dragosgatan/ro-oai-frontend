import { describe, expect, it } from 'vitest';

import {
    getHomepageCompetitionPreview,
    getHomepageCompetitionCount,
    getNextCompetitionBoundary,
    getOngoingCompetitions,
    isHomepageCompetition,
    shouldUseHomepageCompetitionMode,
} from '@/lib/homepage';
import type { CompetitionUserListResponse } from '@/lib/types';

function competition(
    overrides: Partial<CompetitionUserListResponse> = {},
): CompetitionUserListResponse {
    return {
        id: 1,
        name: 'Olimpiada Națională de Inteligență Artificială',
        startTime: '2026-07-13T08:00:00.000Z',
        endTime: '2026-07-13T12:00:00.000Z',
        competitionType: 'CLASSIC',
        joined: false,
        shortDescription: 'Etapa națională',
        highlighted: false,
        ...overrides,
    };
}

describe('homepage competition curation', () => {
    it('filters competitions carrying the explicit public fixture sentinel', () => {
        expect(
            isHomepageCompetition(
                competition({
                    name: 'Test competition [NOT A REAL COMPETITION] [DO NOT ATTEND]',
                }),
            ),
        ).toBe(false);
    });

    it('keeps legitimate competitions and excludes disabled records', () => {
        expect(isHomepageCompetition(competition())).toBe(true);
        expect(isHomepageCompetition(competition({ disabled: true }))).toBe(false);
    });

    it('removes known non-public records from the displayed competition total', () => {
        const competitions = [
            competition({ id: 1 }),
            competition({ id: 2, disabled: true }),
            competition({ id: 3, name: 'Fixture [NOT A REAL COMPETITION]' }),
        ];

        expect(getHomepageCompetitionCount(competitions, 14)).toBe(12);
    });

    it('prioritizes current and future competitions, then caps the preview', () => {
        const now = new Date('2026-07-13T10:00:00.000Z');
        const preview = getHomepageCompetitionPreview(
            [
                competition({
                    id: 1,
                    startTime: '2026-01-01T08:00:00.000Z',
                    endTime: '2026-01-01T12:00:00.000Z',
                }),
                competition({ id: 2, highlighted: true }),
                competition({
                    id: 3,
                    startTime: '2026-08-01T08:00:00.000Z',
                    endTime: '2026-08-01T12:00:00.000Z',
                }),
                competition({ id: 4, name: 'Test competition' }),
            ],
            now,
            2,
        );

        expect(preview.map(({ id }) => id)).toEqual([2, 3]);
    });

    it('finds active competitions and the next transition boundary', () => {
        const now = new Date('2026-07-13T10:00:00.000Z');
        const competitions = [
            competition({ id: 1 }),
            competition({
                id: 2,
                startTime: '2026-07-14T08:00:00.000Z',
                endTime: '2026-07-14T12:00:00.000Z',
            }),
        ];

        expect(getOngoingCompetitions(competitions, now).map(({ id }) => id)).toEqual([1]);
        expect(getNextCompetitionBoundary(competitions, now)).toBe('2026-07-13T12:00:00.000Z');
    });

    it('never lets an active fixture or disabled event trigger homepage competition mode', () => {
        const now = new Date('2026-07-13T10:00:00.000Z');
        const competitions = [
            competition({
                id: 1,
                name: 'Test competition [NOT A REAL COMPETITION]',
                endTime: '2026-07-13T10:30:00.000Z',
            }),
            competition({ id: 2, disabled: true, endTime: '2026-07-13T11:00:00.000Z' }),
            competition({ id: 3, name: 'Official active round' }),
        ];

        expect(getOngoingCompetitions(competitions, now).map(({ id }) => id)).toEqual([3]);
        expect(getNextCompetitionBoundary(competitions, now)).toBe('2026-07-13T12:00:00.000Z');
    });

    it('uses the authoritative gate only when catalog details are unavailable', () => {
        expect(
            shouldUseHomepageCompetitionMode({
                publicOngoingCount: 0,
                authoritativeCompetitionMode: true,
                competitionCatalogUnavailable: true,
            }),
        ).toBe(true);
        expect(
            shouldUseHomepageCompetitionMode({
                publicOngoingCount: 0,
                authoritativeCompetitionMode: true,
                competitionCatalogUnavailable: false,
            }),
        ).toBe(false);
        expect(
            shouldUseHomepageCompetitionMode({
                publicOngoingCount: 1,
                authoritativeCompetitionMode: false,
                competitionCatalogUnavailable: false,
            }),
        ).toBe(true);
    });
});
