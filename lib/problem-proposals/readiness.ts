import type {
    ProblemProposal,
    ProblemProposalAssetRole,
    ProblemProposalDraftInput,
    ProblemProposalValidationRun,
} from '@/lib/problem-proposals/types';

export const REQUIRED_PROBLEM_PROPOSAL_ASSET_ROLES: ProblemProposalAssetRole[] = [
    'PUBLIC_DATASET',
    'GROUND_TRUTH',
    'EVALUATOR_SCRIPT',
    'SAMPLE_SUBMISSION',
];

export type ProblemProposalReadiness = {
    idea: boolean;
    statement: boolean;
    files: boolean;
    evaluator: boolean;
    scoring: boolean;
    ready: boolean;
    completedCount: number;
    totalCount: number;
};

export function buildProblemProposalReadiness(
    draft: Pick<
        ProblemProposalDraftInput,
        | 'title'
        | 'shortDescription'
        | 'longDescription'
        | 'subtasks'
        | 'authorFirstName'
        | 'authorLastName'
    >,
    assets: ProblemProposal['assets'],
    validation: ProblemProposalValidationRun | null,
    currentVersion?: number,
    currentRevisionId?: number | null,
): ProblemProposalReadiness {
    const roles = new Set(
        assets
            .filter((asset) => asset.status === 'CONFIRMED' || asset.status === 'PROMOTED')
            .map((asset) => asset.role),
    );
    const idea =
        draft.title.trim().length >= 3 &&
        draft.shortDescription.trim().length >= 20 &&
        draft.authorFirstName.trim().length > 0 &&
        draft.authorLastName.trim().length > 0;
    const statement = draft.longDescription.trim().length >= 80;
    const files = REQUIRED_PROBLEM_PROPOSAL_ASSET_ROLES.every((role) => roles.has(role));
    const evaluator =
        validation?.status === 'PASSED' &&
        (currentRevisionId && validation.revisionId
            ? currentRevisionId === validation.revisionId
            : currentVersion === undefined ||
              validation.proposalVersion === 0 ||
              validation.proposalVersion === currentVersion);
    const scoring =
        draft.subtasks.length > 0 &&
        draft.subtasks.every(
            (subtask) =>
                subtask.subtaskName.trim().length > 0 && subtask.metricName.trim().length > 0,
        );
    const checks = [idea, statement, files, evaluator, scoring];
    return {
        idea,
        statement,
        files,
        evaluator,
        scoring,
        ready: checks.every(Boolean),
        completedCount: checks.filter(Boolean).length,
        totalCount: checks.length,
    };
}
