import { describe, expect, it, vi } from 'vitest';

import { buildCompetitionHostingReadiness } from '@/lib/competition-hosting/readiness';
import type { CompetitionHostingRequestInput } from '@/lib/competition-hosting/types';

function validInput(): CompetitionHostingRequestInput {
    return {
        name: 'Regional AI Challenge',
        shortDescription: 'A practical machine learning challenge for local students.',
        description:
            'Participants solve a reproducible machine learning task using the supplied dataset and submit their predictions for evaluation.',
        rules: 'Work independently and submit only your own results.',
        startTime: '2026-08-01T09:00:00.000Z',
        endTime: '2026-08-01T13:00:00.000Z',
        requestMode: 'COMPETITION_ONLY',
        competitionType: 'CLASSIC',
        access: 'PRIVATE',
        allowPublicQuestions: false,
        commentsEnabled: true,
        selectionLimit: 1,
    };
}

describe('competition hosting readiness', () => {
    it('requires a complete identity, future schedule, description, and rules', () => {
        vi.setSystemTime(new Date('2026-07-21T10:00:00Z'));
        expect(buildCompetitionHostingReadiness(validInput())).toMatchObject({
            identity: true,
            schedule: true,
            details: true,
            ready: true,
        });
        vi.useRealTimers();
    });

    it('rejects past, reversed, and over-180-day schedules', () => {
        vi.setSystemTime(new Date('2026-07-21T10:00:00Z'));
        expect(
            buildCompetitionHostingReadiness({
                ...validInput(),
                startTime: '2026-07-20T09:00:00Z',
            }).schedule,
        ).toBe(false);
        expect(
            buildCompetitionHostingReadiness({
                ...validInput(),
                endTime: '2026-07-31T09:00:00Z',
            }).schedule,
        ).toBe(false);
        expect(
            buildCompetitionHostingReadiness({
                ...validInput(),
                endTime: '2027-03-01T09:00:00Z',
            }).schedule,
        ).toBe(false);
        vi.useRealTimers();
    });
});
