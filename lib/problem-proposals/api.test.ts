import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProblemProposal, ProblemProposalDraftInput } from '@/lib/problem-proposals';

const mocks = vi.hoisted(() => ({
    fetchApi: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
    fetchApi: mocks.fetchApi,
}));

import {
    cancelProblemProposalReview,
    createProblemProposalDraft,
    deleteProblemProposalDraft,
    getEvaluatorContract,
    getLatestProblemProposalValidation,
    getMyProblemProposals,
    normalizeProblemProposal,
    normalizeProblemProposalValidationRun,
    resubmitProblemProposal,
    saveProblemProposalDraft,
    startProblemProposalValidation,
    uploadProblemProposalAsset,
} from '@/lib/problem-proposals';

const revision = {
    id: 71,
    revisionNumber: 3,
    title: 'Safe evaluator',
    shortDescription: 'A complete short description for the proposed challenge.',
    longDescription:
        'A complete statement with enough detail for participants to understand the data, output and constraints.',
    difficulty: 'HARD',
    evaluationType: 'ZIP',
    metricPreference: 'SMALLER_IS_BETTER',
    subtasks: [{ subtaskName: 'Overall', metricName: 'Error' }],
    categoryIds: [4, 8],
    authorFirstName: 'Pixel',
    authorLastName: 'Testerson',
};

function detail(overrides: Record<string, unknown> = {}) {
    return {
        id: 42,
        status: 'IN_REVIEW',
        currentRevision: revision,
        assets: [],
        latestReview: {
            id: 91,
            status: 'CHANGES_REQUESTED',
            version: 5,
            reviewerNote: 'Clarify the sample.',
            createdAt: '2026-07-16T10:00:00Z',
            updatedAt: '2026-07-16T11:00:00Z',
        },
        latestValidation: {
            id: 12,
            revisionId: 71,
            assetDigest: 'd'.repeat(64),
            status: 'PASS',
            message: 'Passed safely.',
            createdAt: '2026-07-16T09:00:00Z',
            completedAt: '2026-07-16T09:00:01Z',
            checks: [{ code: 'RETURN_SHAPE', passed: true, message: 'Valid' }],
        },
        approvedProblemId: null,
        createdAt: '2026-07-15T10:00:00Z',
        updatedAt: '2026-07-16T11:00:00Z',
        version: 8,
        ...overrides,
    };
}

const draftInput: ProblemProposalDraftInput = {
    title: revision.title,
    shortDescription: revision.shortDescription,
    longDescription: revision.longDescription,
    difficulty: 'HARD',
    evaluationType: 'ZIP',
    metricPreference: 'SMALLER_IS_BETTER',
    subtasks: revision.subtasks,
    categoryIds: [4, 8],
    authorFirstName: 'Pixel',
    authorLastName: 'Testerson',
    version: 8,
};

describe('problem proposal API adapter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test';
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('normalizes nested revisions and backend status aliases', () => {
        expect(normalizeProblemProposal(detail())).toMatchObject({
            id: 42,
            title: 'Safe evaluator',
            status: 'PENDING',
            revisionId: 71,
            categoryIds: [4, 8],
            authorFirstName: 'Pixel',
            authorLastName: 'Testerson',
            latestValidation: {
                status: 'PASSED',
                revisionId: 71,
                summary: 'Passed safely.',
            },
            latestReview: {
                status: 'CHANGES_REQUESTED',
                reviewerMessage: 'Clarify the sample.',
            },
        });
    });

    it.each(['NPY', 'NPZ'] as const)(
        'preserves the %s proposal evaluation type from the API',
        (evaluationType) => {
            expect(
                normalizeProblemProposal(
                    detail({
                        currentRevision: {
                            ...revision,
                            evaluationType,
                        },
                    }),
                ).evaluationType,
            ).toBe(evaluationType);
        },
    );

    it('derives deletion and active-review cancellation permissions from backend state', () => {
        const freshDraft = normalizeProblemProposal(
            detail({
                status: 'DRAFT',
                latestReview: null,
                latestValidation: null,
            }),
        );
        const returnedForChanges = normalizeProblemProposal(
            detail({ status: 'CHANGES_REQUESTED' }),
        );
        const previouslySubmittedDraft = normalizeProblemProposal(
            detail({
                status: 'DRAFT',
                latestReview: {
                    id: 91,
                    status: 'CANCELLED',
                    version: 6,
                },
            }),
        );

        expect(freshDraft.permissions.canDeleteDraft).toBe(true);
        expect(returnedForChanges.permissions.canCancelReview).toBe(true);
        expect(previouslySubmittedDraft.permissions.canDeleteDraft).toBe(false);
    });

    it('maps the backend originalName field to the displayed asset filename', () => {
        const proposal = normalizeProblemProposal(
            detail({
                assets: [
                    {
                        id: '8e1327fe-5678-4abc-9abc-123456789012',
                        role: 'GROUND_TRUTH',
                        status: 'CONFIRMED',
                        fileName: '   ',
                        originalName: 'private-labels.json',
                        contentType: 'application/json',
                        expectedBytes: 128,
                        confirmedBytes: 128,
                        version: 2,
                    },
                ],
            }),
        );

        expect(proposal.assets[0]?.fileName).toBe('private-labels.json');
    });

    it('marks a backend pending validation stale after its 15-minute timeout', () => {
        vi.useFakeTimers();
        const pendingRun = {
            id: 23,
            status: 'PENDING',
            revisionId: 71,
            createdAt: '2026-07-16T12:00:00.000Z',
        };

        vi.setSystemTime(new Date('2026-07-16T12:14:59.000Z'));
        expect(normalizeProblemProposalValidationRun(pendingRun)).toMatchObject({
            status: 'QUEUED',
        });

        vi.setSystemTime(new Date('2026-07-16T12:15:01.000Z'));
        expect(normalizeProblemProposalValidationRun(pendingRun)).toMatchObject({
            id: 23,
            status: 'STALE',
            queuedAt: '2026-07-16T12:00:00.000Z',
        });
    });

    it('reads the backend items-based page shape', async () => {
        mocks.fetchApi.mockResolvedValue(
            new Response(
                JSON.stringify({
                    items: [
                        {
                            id: 42,
                            title: 'Safe evaluator',
                            difficulty: 'HARD',
                            status: 'DRAFT',
                            validationStatus: 'PENDING',
                            version: 3,
                        },
                    ],
                    page: 2,
                    size: 20,
                    totalElements: 61,
                    totalPages: 4,
                }),
                { status: 200 },
            ),
        );

        await expect(getMyProblemProposals({ page: 2, size: 20 })).resolves.toMatchObject({
            content: [{ id: 42, latestValidation: { status: 'QUEUED' } }],
            page: { number: 2, size: 20, totalElements: 61, totalPages: 4 },
        });
    });

    it('uses the exact save and resubmit version contracts', async () => {
        mocks.fetchApi
            .mockResolvedValueOnce(new Response(JSON.stringify(detail()), { status: 200 }))
            .mockResolvedValueOnce(
                new Response(JSON.stringify({ id: 91, status: 'PENDING', version: 6 }), {
                    status: 200,
                }),
            )
            .mockResolvedValueOnce(
                new Response(JSON.stringify(detail({ status: 'IN_REVIEW' })), {
                    status: 200,
                }),
            );

        await saveProblemProposalDraft(42, draftInput);
        const proposal = normalizeProblemProposal(
            detail({ status: 'CHANGES_REQUESTED' }),
        ) as ProblemProposal;
        await resubmitProblemProposal(proposal);

        expect(String(mocks.fetchApi.mock.calls[0]?.[0])).toContain('/me/problem-proposals/42');
        expect(String(mocks.fetchApi.mock.calls[0]?.[0])).not.toContain('/draft');
        expect(JSON.parse(String(mocks.fetchApi.mock.calls[1]?.[1]?.body))).toEqual({
            version: 5,
            proposalVersion: 8,
        });
    });

    it('deletes only the addressed draft version and cancels a changes-requested review', async () => {
        mocks.fetchApi
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockResolvedValueOnce(
                new Response(JSON.stringify({ id: 91, status: 'CANCELLED', version: 6 }), {
                    status: 200,
                }),
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify(
                        detail({
                            status: 'DRAFT',
                            latestReview: { id: 91, status: 'CANCELLED', version: 6 },
                        }),
                    ),
                    { status: 200 },
                ),
            );

        const freshDraft = normalizeProblemProposal(
            detail({ status: 'DRAFT', latestReview: null }),
        );
        await deleteProblemProposalDraft(freshDraft);

        const changesRequested = normalizeProblemProposal(detail({ status: 'CHANGES_REQUESTED' }));
        await cancelProblemProposalReview(changesRequested);

        expect(String(mocks.fetchApi.mock.calls[0]?.[0])).toContain('/me/problem-proposals/42');
        expect(mocks.fetchApi.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
        expect(JSON.parse(String(mocks.fetchApi.mock.calls[0]?.[1]?.body))).toEqual({
            version: 8,
        });
        expect(String(mocks.fetchApi.mock.calls[1]?.[0])).toContain(
            '/me/problem-proposals/reviews/91/cancel',
        );
        expect(JSON.parse(String(mocks.fetchApi.mock.calls[1]?.[1]?.body))).toEqual({
            version: 5,
            proposalVersion: 8,
        });
    });

    it('creates an early server draft without requiring review-ready content', async () => {
        mocks.fetchApi.mockResolvedValueOnce(
            new Response(
                JSON.stringify(
                    detail({
                        status: 'DRAFT',
                        currentRevision: {
                            ...revision,
                            title: 'Early idea',
                            shortDescription: '',
                            longDescription: '',
                        },
                    }),
                ),
                { status: 200 },
            ),
        );

        const earlyDraft: ProblemProposalDraftInput = {
            ...draftInput,
            title: 'Early idea',
            shortDescription: '',
            longDescription: '',
            categoryIds: [],
        };
        await createProblemProposalDraft(earlyDraft);

        expect(String(mocks.fetchApi.mock.calls[0]?.[0])).toContain('/me/problem-proposals');
        expect(JSON.parse(String(mocks.fetchApi.mock.calls[0]?.[1]?.body))).toEqual(earlyDraft);
    });

    it('links a new proposal to exactly one organizer-owned competition scope', async () => {
        mocks.fetchApi.mockResolvedValueOnce(
            new Response(
                JSON.stringify(
                    detail({
                        status: 'DRAFT',
                        targetCompetitionId: 77,
                        targetName: 'Community AI Cup',
                    }),
                ),
                { status: 200 },
            ),
        );

        const proposal = await createProblemProposalDraft(draftInput, {
            scope: 'MANAGED_COMPETITION',
            competitionId: 77,
        });

        expect(JSON.parse(String(mocks.fetchApi.mock.calls[0]?.[1]?.body))).toEqual({
            ...draftInput,
            targetCompetitionId: 77,
        });
        expect(proposal.target).toEqual({
            scope: 'MANAGED_COMPETITION',
            id: 77,
            name: 'Community AI Cup',
        });
    });

    it('hashes, presigns, uploads with the exact signed headers, and confirms versions', async () => {
        const uploaded = vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));
        mocks.fetchApi
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        asset: {
                            id: '8e1327fe-5678-4abc-9abc-123456789012',
                            role: 'EVALUATOR_SCRIPT',
                            status: 'AWAITING_UPLOAD',
                            originalName: 'evaluator.py',
                            contentType: 'text/x-python',
                            expectedBytes: 3,
                            sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
                            version: 2,
                        },
                        uploadUrl: 'https://storage.example.test/signed',
                        requiredHeaders: {
                            'Content-Type': 'text/x-python',
                            'x-amz-meta-sha256':
                                'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
                            'x-amz-meta-asset-role': 'EVALUATOR_SCRIPT',
                        },
                        proposalVersion: 9,
                    }),
                    { status: 200 },
                ),
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify(
                        detail({
                            status: 'DRAFT',
                            version: 10,
                            assets: [
                                {
                                    id: '8e1327fe-5678-4abc-9abc-123456789012',
                                    role: 'EVALUATOR_SCRIPT',
                                    status: 'CONFIRMED',
                                    originalName: 'evaluator.py',
                                    contentType: 'text/x-python',
                                    expectedBytes: 3,
                                    confirmedBytes: 3,
                                    sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
                                    version: 3,
                                },
                            ],
                        }),
                    ),
                    { status: 200 },
                ),
            );

        const proposal = normalizeProblemProposal(detail({ status: 'DRAFT' }));
        const file = new File(['abc'], 'evaluator.py', { type: 'text/x-python' });
        await uploadProblemProposalAsset(proposal, 'EVALUATOR_SCRIPT', file);

        const presignBody = JSON.parse(String(mocks.fetchApi.mock.calls[0]?.[1]?.body));
        expect(presignBody).toEqual({
            proposalVersion: 8,
            role: 'EVALUATOR_SCRIPT',
            fileName: 'evaluator.py',
            contentType: 'text/x-python',
            byteSize: 3,
            sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        });
        expect(uploaded).toHaveBeenCalledWith(
            'https://storage.example.test/signed',
            expect.objectContaining({
                method: 'PUT',
                credentials: 'omit',
            }),
        );
        const uploadHeaders = new Headers(
            (uploaded.mock.calls[0]?.[1] as RequestInit | undefined)?.headers,
        );
        expect(uploadHeaders.get('content-type')).toBe('text/x-python');
        expect(uploadHeaders.get('x-amz-meta-asset-role')).toBe('EVALUATOR_SCRIPT');
        expect(JSON.parse(String(mocks.fetchApi.mock.calls[1]?.[1]?.body))).toEqual({
            proposalVersion: 9,
            assetVersion: 2,
        });
    });

    it('polls the latest validation and reads the live evaluator contract', async () => {
        mocks.fetchApi
            .mockResolvedValueOnce(
                new Response(JSON.stringify(detail().latestValidation), { status: 200 }),
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        contractVersion: '2',
                        contractHash: 'sha256:live-contract',
                        functionSignature: 'Supported signatures: all four combinations.',
                        returnDescription: 'Four finite values',
                        subtaskFunctionPattern: 'subtask1(...)',
                        routingFlag: 'SUBTASK_ID_ROUTING = False',
                        template: 'def compute_scores(predictions_df, ground_truth_df): pass',
                        signatures: [
                            {
                                submission: 'TABULAR',
                                groundTruth: 'ZIP',
                                signature: 'compute_scores(predictions_df, ground_truth_path)',
                            },
                            {
                                submission: 'UNSUPPORTED',
                                groundTruth: 'ZIP',
                                signature: 'unsafe_signature()',
                            },
                        ],
                        allowedLibraries: ['pandas', 'numpy'],
                        prohibitedCapabilities: ['network access'],
                        limits: {
                            evaluatorScriptBytes: 524288,
                            wallTimeSeconds: 30,
                            stdoutBytes: 100000,
                        },
                        requiredFiles: [
                            'PUBLIC_DATASET',
                            'GROUND_TRUTH',
                            'EVALUATOR_SCRIPT',
                            'SAMPLE_SUBMISSION',
                        ],
                        allowedDataTypes: ['CSV', 'ZIP'],
                        localTestCommand:
                            'python -m py_compile evaluator.py && python -c "import evaluator; assert callable(evaluator.compute_scores)"',
                    }),
                    { status: 200 },
                ),
            );

        await expect(getLatestProblemProposalValidation(42)).resolves.toMatchObject({
            status: 'PASSED',
        });
        await expect(getEvaluatorContract()).resolves.toMatchObject({
            contractVersion: '2',
            contractHash: 'sha256:live-contract',
            functionSignature: 'compute_scores(predictions_df, ground_truth_path)',
            supportedFormats: ['CSV', 'ZIP'],
            signatures: [{ signature: 'compute_scores(predictions_df, ground_truth_path)' }],
            localTestCommand:
                'python -m py_compile evaluator.py && python -c "import evaluator; assert callable(evaluator.compute_scores)"',
            limits: { maxEvaluatorBytes: 524288, timeoutSeconds: 30 },
        });
        expect(String(mocks.fetchApi.mock.calls[0]?.[0])).toContain(
            '/me/problem-proposals/42/validation',
        );
        expect(String(mocks.fetchApi.mock.calls[1]?.[0])).toContain(
            '/problem-proposals/evaluator-contract',
        );
    });

    it('refreshes the proposal after validation starts to absorb a contract-upgrade version', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-07-16T12:01:00Z'));
        const refreshed = detail({
            status: 'DRAFT',
            version: 10,
            currentRevision: { ...revision, id: 72, revisionNumber: 4 },
            latestValidation: {
                id: 33,
                status: 'PENDING',
                revisionId: 72,
                createdAt: '2026-07-16T12:00:00Z',
                version: 1,
            },
        });
        mocks.fetchApi
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        id: 33,
                        status: 'PENDING',
                        revisionId: 72,
                        createdAt: '2026-07-16T12:00:00Z',
                        version: 1,
                    }),
                    { status: 200 },
                ),
            )
            .mockResolvedValueOnce(new Response(JSON.stringify(refreshed), { status: 200 }));

        const result = await startProblemProposalValidation(
            normalizeProblemProposal(detail({ status: 'DRAFT' })),
        );

        expect(JSON.parse(String(mocks.fetchApi.mock.calls[0]?.[1]?.body))).toEqual({
            version: 8,
        });
        expect(String(mocks.fetchApi.mock.calls[1]?.[0])).toContain('/me/problem-proposals/42');
        expect(result).toMatchObject({
            proposal: { version: 10, revisionId: 72 },
            validation: { id: 33, revisionId: 72, status: 'QUEUED' },
        });
    });
});
