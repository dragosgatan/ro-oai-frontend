import { describe, expect, it } from 'vitest';

import {
    PROBLEM_PROPOSAL_ASSET_VISIBILITY,
    buildProblemProposalReadiness,
    type ProblemProposalAsset,
    type ProblemProposalDraftInput,
    type ProblemProposalValidationRun,
} from '@/lib/problem-proposals';

const draft: ProblemProposalDraftInput = {
    title: 'Robust clustering',
    shortDescription: 'Cluster noisy observations into stable, useful groups.',
    longDescription:
        'Participants receive a dataset with noisy observations and must produce stable cluster assignments while documenting the expected output format.',
    difficulty: 'MEDIUM',
    evaluationType: 'CSV',
    metricPreference: 'BIGGER_IS_BETTER',
    subtasks: [{ subtaskName: 'Overall', metricName: 'Adjusted Rand index' }],
    categoryIds: [1],
    authorFirstName: 'Ada',
    authorLastName: 'Ionescu',
};

function asset(
    role: ProblemProposalAsset['role'],
    status: ProblemProposalAsset['status'] = 'CONFIRMED',
): ProblemProposalAsset {
    return {
        id: `${role}-id`,
        role,
        visibility: PROBLEM_PROPOSAL_ASSET_VISIBILITY[role],
        status,
        fileName: `${role}.csv`,
        contentType: 'text/csv',
        sizeBytes: 100,
        confirmedBytes: status === 'CONFIRMED' ? 100 : null,
        sha256: 'a'.repeat(64),
        version: 1,
        uploadedAt: '2026-07-16T10:00:00Z',
        downloadUrl: null,
    };
}

const validation: ProblemProposalValidationRun = {
    id: 9,
    status: 'PASSED',
    proposalVersion: 0,
    revisionId: 7,
    assetDigest: 'b'.repeat(64),
    queuedAt: '2026-07-16T10:00:00Z',
    startedAt: '2026-07-16T10:00:01Z',
    finishedAt: '2026-07-16T10:00:02Z',
    summary: 'Passed',
    stdout: null,
    stderr: null,
    checks: [],
};

describe('problem proposal readiness', () => {
    it('requires only the four backend-required file roles', () => {
        const result = buildProblemProposalReadiness(
            draft,
            [
                asset('PUBLIC_DATASET'),
                asset('GROUND_TRUTH'),
                asset('EVALUATOR_SCRIPT'),
                asset('SAMPLE_SUBMISSION'),
            ],
            validation,
            12,
            7,
        );

        expect(result).toMatchObject({
            idea: true,
            statement: true,
            files: true,
            evaluator: true,
            scoring: true,
            ready: true,
        });
    });

    it('does not count an unconfirmed upload or an old validation', () => {
        const result = buildProblemProposalReadiness(
            draft,
            [
                asset('PUBLIC_DATASET'),
                asset('GROUND_TRUTH'),
                asset('EVALUATOR_SCRIPT', 'AWAITING_UPLOAD'),
                asset('SAMPLE_SUBMISSION'),
            ],
            validation,
            12,
            8,
        );

        expect(result.files).toBe(false);
        expect(result.evaluator).toBe(false);
        expect(result.ready).toBe(false);
    });
});
