import type { CompetitionHostingRequestInput } from '@/lib/competition-hosting/types';

export type CompetitionHostingReadiness = {
    identity: boolean;
    schedule: boolean;
    details: boolean;
    ready: boolean;
    completedCount: number;
    totalCount: number;
};

export function buildCompetitionHostingReadiness(
    input: CompetitionHostingRequestInput,
): CompetitionHostingReadiness {
    const start = Date.parse(input.startTime);
    const end = Date.parse(input.endTime);
    const identity = input.name.trim().length >= 3 && input.shortDescription.trim().length >= 20;
    const schedule =
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        start > Date.now() &&
        end > start &&
        end - start <= 180 * 24 * 60 * 60 * 1000;
    const details = input.description.trim().length >= 80 && input.rules.trim().length >= 20;
    const checks = [identity, schedule, details];

    return {
        identity,
        schedule,
        details,
        ready: checks.every(Boolean),
        completedCount: checks.filter(Boolean).length,
        totalCount: checks.length,
    };
}
