/**
 * Participant problem-proposal contract boundary.
 *
 * Keep transport-facing types isolated here until the backend OpenAPI contract
 * is final. Components should import only from `@/lib/problem-proposals`.
 */

export type ProblemProposalStatus =
    | 'DRAFT'
    | 'PENDING'
    | 'CHANGES_REQUESTED'
    | 'APPROVED'
    | 'REJECTED';

export type ProblemProposalReviewStatus =
    | 'PENDING'
    | 'CHANGES_REQUESTED'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED';

export type ProblemProposalAssetRole =
    | 'PUBLIC_DATASET'
    | 'GROUND_TRUTH'
    | 'EVALUATOR_SCRIPT'
    | 'SAMPLE_SUBMISSION'
    | 'REFERENCE_SUBMISSION'
    | 'SUPPORTING_FILE';

export type ProblemProposalAssetVisibility = 'PUBLIC_AFTER_APPROVAL' | 'REVIEWERS_ONLY';

export type ProblemProposalValidationStatus = 'QUEUED' | 'RUNNING' | 'PASSED' | 'FAILED' | 'STALE';

export type ProblemProposalDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export const PROBLEM_PROPOSAL_EVALUATION_TYPES = [
    'CSV',
    'TXT',
    'JSON',
    'NPY',
    'NPZ',
    'ZIP',
] as const;
export type ProblemProposalEvaluationType = (typeof PROBLEM_PROPOSAL_EVALUATION_TYPES)[number];
export type ProblemProposalMetricPreference =
    | 'SMALLER_IS_BETTER'
    | 'BIGGER_IS_BETTER'
    | 'FASTER_SUBMISSION_IS_BETTER';

export type ProblemProposalScope = 'CATALOG' | 'HOST_REQUEST' | 'MANAGED_COMPETITION';

export type ProblemProposalTarget = {
    scope: ProblemProposalScope;
    id: number | null;
    name: string | null;
};

export type ProblemProposalSubtask = {
    subtaskName: string;
    metricName: string;
};

export type ProblemProposalPermissions = {
    canEdit: boolean;
    canSubmit: boolean;
    canCancelReview: boolean;
    canResubmit: boolean;
    canDeleteDraft: boolean;
    canDeleteAssets: boolean;
    canRunValidation: boolean;
};

export type ProblemProposalReview = {
    id: number;
    status: ProblemProposalReviewStatus;
    version: number;
    submittedAt: string | null;
    updatedAt: string | null;
    reviewerMessage: string | null;
};

export type ProblemProposalAsset = {
    id: string;
    role: ProblemProposalAssetRole;
    visibility: ProblemProposalAssetVisibility;
    status: 'AWAITING_UPLOAD' | 'CONFIRMED' | 'PROMOTED' | 'DELETED';
    fileName: string;
    contentType: string;
    sizeBytes: number;
    confirmedBytes: number | null;
    sha256: string | null;
    version: number;
    uploadedAt: string | null;
    downloadUrl: string | null;
};

export type ProblemProposalValidationRun = {
    id: number;
    status: ProblemProposalValidationStatus;
    proposalVersion: number;
    revisionId: number | null;
    assetDigest: string | null;
    queuedAt: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    summary: string | null;
    stdout: string | null;
    stderr: string | null;
    checks: Array<{
        code: string;
        passed: boolean;
        message: string;
    }>;
};

export type ProblemProposal = {
    id: number;
    title: string;
    shortDescription: string;
    longDescription: string;
    difficulty: ProblemProposalDifficulty;
    evaluationType: ProblemProposalEvaluationType;
    metricPreference: ProblemProposalMetricPreference;
    subtasks: ProblemProposalSubtask[];
    categoryIds: number[];
    authorFirstName: string;
    authorLastName: string;
    revisionId: number | null;
    status: ProblemProposalStatus;
    version: number;
    createdAt: string;
    updatedAt: string;
    importedProblemId: number | null;
    target: ProblemProposalTarget;
    assets: ProblemProposalAsset[];
    latestReview: ProblemProposalReview | null;
    latestValidation: ProblemProposalValidationRun | null;
    permissions: ProblemProposalPermissions;
};

export type ProblemProposalPage = {
    content: ProblemProposal[];
    page: {
        number: number;
        size: number;
        totalElements: number;
        totalPages: number;
    };
};

export type ProblemProposalDraftInput = {
    title: string;
    shortDescription: string;
    longDescription: string;
    difficulty: ProblemProposalDifficulty;
    evaluationType: ProblemProposalEvaluationType;
    metricPreference: ProblemProposalMetricPreference;
    subtasks: ProblemProposalSubtask[];
    categoryIds: number[];
    authorFirstName: string;
    authorLastName: string;
    version?: number;
};

export type ProblemProposalCreationTarget =
    | { scope: 'CATALOG' }
    | { scope: 'HOST_REQUEST'; hostingRequestId: number }
    | { scope: 'MANAGED_COMPETITION'; competitionId: number };

export type ProblemProposalUploadTicket = {
    assetId: string;
    uploadUrl: string;
    method: 'PUT' | 'POST';
    headers: Record<string, string>;
    fields: Record<string, string>;
    proposalVersion: number;
    assetVersion: number;
    expiresAt: string | null;
};

export type EvaluatorContract = {
    contractVersion: string;
    contractHash: string;
    functionName: string;
    functionSignature: string;
    returnDescription: string;
    subtaskFunctionPattern: string;
    routingFlag: string;
    signatures: Array<{
        submission: 'TABULAR' | 'ZIP';
        groundTruth: 'TABULAR' | 'ZIP';
        signature: string;
    }>;
    template: string;
    supportedFormats: string[];
    requiredFiles: string[];
    allowedLibraries: string[];
    prohibitedCapabilities: string[];
    localTestCommand: string | null;
    limits: {
        timeoutSeconds: number;
        maxOutputBytes: number;
        maxEvaluatorBytes: number;
        maxAssetBytes: Partial<Record<ProblemProposalAssetRole, number>>;
    };
};

export const PROBLEM_PROPOSAL_ASSET_VISIBILITY: Record<
    ProblemProposalAssetRole,
    ProblemProposalAssetVisibility
> = {
    PUBLIC_DATASET: 'PUBLIC_AFTER_APPROVAL',
    GROUND_TRUTH: 'REVIEWERS_ONLY',
    EVALUATOR_SCRIPT: 'REVIEWERS_ONLY',
    SAMPLE_SUBMISSION: 'REVIEWERS_ONLY',
    REFERENCE_SUBMISSION: 'REVIEWERS_ONLY',
    SUPPORTING_FILE: 'PUBLIC_AFTER_APPROVAL',
};

export function problemProposalAssetAccept(
    role: ProblemProposalAssetRole,
    evaluationType: ProblemProposalEvaluationType,
): string {
    if (role === 'EVALUATOR_SCRIPT') return '.py,text/x-python,text/plain';
    if (role === 'GROUND_TRUTH') return '.csv,.txt,.json,.zip';
    if (role === 'PUBLIC_DATASET') return '.zip,.csv,.txt,.json';
    if (role === 'SUPPORTING_FILE') {
        return '.zip,.csv,.json,.txt,.md,.png,.jpg,.jpeg,.pdf';
    }
    return `.${evaluationType.toLocaleLowerCase('en-US')}`;
}

export const DEFAULT_EVALUATOR_CONTRACT: EvaluatorContract = {
    contractVersion: '1',
    contractHash: 'local-fallback',
    functionName: 'compute_scores',
    functionSignature: 'compute_scores(predictions_df, ground_truth_df)',
    returnDescription:
        '(partial_score, partial_metric, complete_score, complete_metric), four finite numeric values',
    subtaskFunctionPattern: 'subtask1(predictions_df, ground_truth_df), subtask2(...), ...',
    routingFlag: 'SUBTASK_ID_ROUTING = False',
    signatures: [
        {
            submission: 'TABULAR',
            groundTruth: 'TABULAR',
            signature: 'compute_scores(predictions_df, ground_truth_df)',
        },
        {
            submission: 'TABULAR',
            groundTruth: 'ZIP',
            signature: 'compute_scores(predictions_df, ground_truth_path)',
        },
        {
            submission: 'ZIP',
            groundTruth: 'TABULAR',
            signature: 'compute_scores(extraction_path, ground_truth_df)',
        },
        {
            submission: 'ZIP',
            groundTruth: 'ZIP',
            signature: 'compute_scores(extraction_path, ground_truth_path)',
        },
    ],
    template: `import numpy as np

def compute_scores(predictions_df, ground_truth_df):
    expected = ground_truth_df["target"].to_numpy()
    predicted = predictions_df["target"].to_numpy()
    error = float(np.mean(np.abs(expected - predicted)))
    score = max(0.0, 100.0 - error)
    return score, error, score, error

# Optional:
# def subtask1(predictions_df, ground_truth_df):
#     return partial_score, partial_metric, complete_score, complete_metric
`,
    supportedFormats: [...PROBLEM_PROPOSAL_EVALUATION_TYPES],
    requiredFiles: ['dataset', 'ground truth', 'evaluator.py', 'known-good sample submission'],
    allowedLibraries: ['pandas', 'numpy', 'scikit-learn', 'scipy', 'Pillow', 'OpenCV', 'torch'],
    prohibitedCapabilities: [
        'network access',
        'subprocesses',
        'reading files outside the evaluation workspace',
        'writing outside the evaluation workspace',
        'unbounded background work',
    ],
    localTestCommand: null,
    limits: {
        timeoutSeconds: 30,
        maxOutputBytes: 100 * 1024,
        maxEvaluatorBytes: 512 * 1024,
        maxAssetBytes: {
            PUBLIC_DATASET: 500 * 1024 * 1024,
            GROUND_TRUTH: 100 * 1024 * 1024,
            EVALUATOR_SCRIPT: 512 * 1024,
            SAMPLE_SUBMISSION: 25 * 1024 * 1024,
            REFERENCE_SUBMISSION: 100 * 1024 * 1024,
            SUPPORTING_FILE: 25 * 1024 * 1024,
        },
    },
};
