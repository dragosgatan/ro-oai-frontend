import { fetchApi } from '@/lib/api';
import { sha256Blob, sha256Text } from '@/lib/problem-proposals/sha256';
import {
    DEFAULT_EVALUATOR_CONTRACT,
    PROBLEM_PROPOSAL_ASSET_VISIBILITY,
    PROBLEM_PROPOSAL_EVALUATION_TYPES,
    type EvaluatorContract,
    type ProblemProposal,
    type ProblemProposalAsset,
    type ProblemProposalAssetRole,
    type ProblemProposalDifficulty,
    type ProblemProposalDraftInput,
    type ProblemProposalCreationTarget,
    type ProblemProposalEvaluationType,
    type ProblemProposalMetricPreference,
    type ProblemProposalPage,
    type ProblemProposalPermissions,
    type ProblemProposalReview,
    type ProblemProposalStatus,
    type ProblemProposalSubtask,
    type ProblemProposalUploadTicket,
    type ProblemProposalValidationRun,
    type ProblemProposalValidationStatus,
} from '@/lib/problem-proposals/types';

type UnknownRecord = Record<string, unknown>;

type SpringPage<T> = {
    content?: T[];
    items?: T[];
    page?:
        | number
        | {
              number?: number;
              size?: number;
              totalElements?: number;
              totalPages?: number;
          };
    number?: number;
    size?: number;
    totalElements?: number;
    totalPages?: number;
};

const PROPOSAL_STATUSES = new Set<ProblemProposalStatus>([
    'DRAFT',
    'PENDING',
    'CHANGES_REQUESTED',
    'APPROVED',
    'REJECTED',
]);
const VALIDATION_STATUSES = new Set<ProblemProposalValidationStatus>([
    'QUEUED',
    'RUNNING',
    'PASSED',
    'FAILED',
    'STALE',
]);
const DIFFICULTIES = new Set<ProblemProposalDifficulty>(['EASY', 'MEDIUM', 'HARD']);
const EVALUATION_TYPES = new Set<ProblemProposalEvaluationType>(PROBLEM_PROPOSAL_EVALUATION_TYPES);
const METRIC_PREFERENCES = new Set<ProblemProposalMetricPreference>([
    'SMALLER_IS_BETTER',
    'BIGGER_IS_BETTER',
    'FASTER_SUBMISSION_IS_BETTER',
]);
const VALIDATION_PENDING_TIMEOUT_MS = 15 * 60 * 1000;

export class ProblemProposalApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly code?: string,
    ) {
        super(message);
        this.name = 'ProblemProposalApiError';
    }
}

function asRecord(value: unknown): UnknownRecord | null {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as UnknownRecord)
        : null;
}

function asString(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

function stringArray(value: unknown, fallback: string[]): string[] {
    return Array.isArray(value)
        ? value.filter((candidate): candidate is string => typeof candidate === 'string')
        : fallback;
}

function normalizeEvaluatorSignatures(value: unknown): EvaluatorContract['signatures'] {
    if (!Array.isArray(value)) return DEFAULT_EVALUATOR_CONTRACT.signatures;
    const signatures = value.flatMap((candidate): EvaluatorContract['signatures'] => {
        const row = asRecord(candidate);
        if (!row) return [];
        const submission = asString(row.submission ?? row.submissionType).toUpperCase();
        const groundTruth = asString(
            row.groundTruth ?? row.groundTruthType ?? row.ground_truth,
        ).toUpperCase();
        const signature = asNullableString(row.signature);
        if (
            (submission !== 'TABULAR' && submission !== 'ZIP') ||
            (groundTruth !== 'TABULAR' && groundTruth !== 'ZIP') ||
            !signature
        ) {
            return [];
        }
        return [
            {
                submission,
                groundTruth,
                signature,
            },
        ];
    });
    return signatures.length > 0 ? signatures : DEFAULT_EVALUATOR_CONTRACT.signatures;
}

function enumValue<T extends string>(value: unknown, choices: Set<T>, fallback: T): T {
    const normalized = typeof value === 'string' ? value.toUpperCase() : '';
    return choices.has(normalized as T) ? (normalized as T) : fallback;
}

function normalizeProposalStatus(value: unknown): ProblemProposalStatus {
    const normalized = asString(value).toUpperCase();
    if (normalized === 'IN_REVIEW') return 'PENDING';
    return enumValue(normalized, PROPOSAL_STATUSES, 'DRAFT');
}

function normalizeValidationStatus(value: unknown): ProblemProposalValidationStatus {
    const normalized = asString(value).toUpperCase();
    if (normalized === 'PENDING') return 'QUEUED';
    if (normalized === 'PASS') return 'PASSED';
    if (normalized === 'FAIL') return 'FAILED';
    return enumValue(normalized, VALIDATION_STATUSES, 'FAILED');
}

function backendAssetRole(role: ProblemProposalAssetRole): string {
    return role;
}

function apiUrl(path: string): URL {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!base) throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured');
    return new URL(path.replace(/^\//, ''), `${base.replace(/\/$/, '')}/`);
}

async function parseError(response: Response, fallback: string): Promise<ProblemProposalApiError> {
    const payload = asRecord(await response.json().catch(() => null));
    const message =
        asNullableString(payload?.publicErrorMessage) ??
        asNullableString(payload?.message) ??
        asNullableString(payload?.error) ??
        fallback;
    const code =
        asNullableString(payload?.errorCode) ?? asNullableString(payload?.code) ?? undefined;
    return new ProblemProposalApiError(response.status, message, code);
}

function normalizeSubtasks(value: unknown): ProblemProposalSubtask[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((candidate): ProblemProposalSubtask[] => {
        const row = asRecord(candidate);
        if (!row) return [];
        return [
            {
                subtaskName: asString(row.subtaskName ?? row.name),
                metricName: asString(row.metricName ?? row.metric),
            },
        ];
    });
}

function normalizeAssetRole(value: unknown): ProblemProposalAssetRole | null {
    const normalized = asString(value).toUpperCase();
    const aliases: Record<string, ProblemProposalAssetRole> = {
        DATASET: 'PUBLIC_DATASET',
        PUBLIC_DATASET: 'PUBLIC_DATASET',
        GROUND_TRUTH: 'GROUND_TRUTH',
        EVALUATOR: 'EVALUATOR_SCRIPT',
        EVALUATOR_SCRIPT: 'EVALUATOR_SCRIPT',
        SAMPLE: 'SAMPLE_SUBMISSION',
        SAMPLE_SUBMISSION: 'SAMPLE_SUBMISSION',
        REFERENCE: 'REFERENCE_SUBMISSION',
        REFERENCE_SUBMISSION: 'REFERENCE_SUBMISSION',
        SUPPORTING: 'SUPPORTING_FILE',
        SUPPORTING_FILE: 'SUPPORTING_FILE',
        EXTRA: 'SUPPORTING_FILE',
    };
    return aliases[normalized] ?? null;
}

function normalizeAssets(value: unknown): ProblemProposalAsset[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((candidate): ProblemProposalAsset[] => {
        const row = asRecord(candidate);
        const role = normalizeAssetRole(row?.role ?? row?.assetRole ?? row?.type);
        const id = asNullableString(row?.id ?? row?.assetId);
        if (!row || !role || !id) return [];
        const backendVisibility = asString(row.visibility).toUpperCase();
        const status = asString(row.status, 'CONFIRMED').toUpperCase();
        return [
            {
                id,
                role,
                visibility:
                    backendVisibility === 'REVIEWERS_ONLY' ||
                    backendVisibility === 'PRIVATE' ||
                    backendVisibility === 'ADMIN_ONLY'
                        ? 'REVIEWERS_ONLY'
                        : PROBLEM_PROPOSAL_ASSET_VISIBILITY[role],
                status:
                    status === 'AWAITING_UPLOAD' || status === 'PROMOTED' || status === 'DELETED'
                        ? status
                        : 'CONFIRMED',
                fileName:
                    asNullableString(row.fileName) ??
                    asNullableString(row.filename) ??
                    asNullableString(row.originalName) ??
                    asNullableString(row.originalFileName) ??
                    `${role.toLocaleLowerCase('en-US')}-${id.slice(0, 8)}`,
                contentType:
                    asNullableString(row.contentType ?? row.mimeType) ?? 'application/octet-stream',
                sizeBytes: Math.max(
                    0,
                    asNumber(
                        row.sizeBytes ??
                            row.byteSize ??
                            row.expectedBytes ??
                            row.confirmedBytes ??
                            row.size,
                    ),
                ),
                confirmedBytes:
                    asNumber(row.confirmedBytes, -1) >= 0 ? asNumber(row.confirmedBytes) : null,
                sha256: asNullableString(row.sha256),
                version: asNumber(row.version),
                uploadedAt: asNullableString(row.uploadedAt ?? row.createdAt),
                downloadUrl: asNullableString(row.downloadUrl ?? row.url ?? row.previewUrl),
            },
        ];
    });
}

function normalizeReview(value: unknown): ProblemProposalReview | null {
    const row = asRecord(value);
    if (!row) return null;
    const status = asString(row.status).toUpperCase();
    const reviewStatuses = new Set([
        'PENDING',
        'CHANGES_REQUESTED',
        'APPROVED',
        'REJECTED',
        'CANCELLED',
    ]);
    if (!reviewStatuses.has(status)) return null;
    return {
        id: asNumber(row.id ?? row.reviewId ?? row.requestId),
        status: status as ProblemProposalReview['status'],
        version: asNumber(row.version ?? row.proposalVersion),
        submittedAt: asNullableString(row.submittedAt ?? row.createdAt),
        updatedAt: asNullableString(row.updatedAt),
        reviewerMessage:
            asNullableString(row.reviewerMessage) ??
            asNullableString(row.reviewMessage) ??
            asNullableString(row.reviewerNote),
    };
}

export function normalizeProblemProposalValidationRun(
    value: unknown,
    currentRevisionId?: number | null,
): ProblemProposalValidationRun | null {
    const row = asRecord(value);
    if (!row) return null;
    const revisionId = asNumber(row.revisionId, -1) >= 0 ? asNumber(row.revisionId) : null;
    const queuedAt = asNullableString(row.queuedAt ?? row.createdAt);
    const backendStatus = asString(row.status).toUpperCase();
    let status = normalizeValidationStatus(row.status);
    const queuedAtMillis = queuedAt ? Date.parse(queuedAt) : Number.NaN;
    if (
        backendStatus === 'PENDING' &&
        Number.isFinite(queuedAtMillis) &&
        Date.now() - queuedAtMillis > VALIDATION_PENDING_TIMEOUT_MS
    ) {
        status = 'STALE';
    }
    if (currentRevisionId && revisionId && currentRevisionId !== revisionId) {
        status = 'STALE';
    }
    const checksValue = Array.isArray(row.checks) ? row.checks : [];
    return {
        id: asNumber(row.id ?? row.runId),
        status,
        proposalVersion: asNumber(row.proposalVersion ?? row.version),
        revisionId,
        assetDigest: asNullableString(row.assetDigest),
        queuedAt,
        startedAt: asNullableString(row.startedAt),
        finishedAt: asNullableString(row.finishedAt ?? row.completedAt),
        summary: asNullableString(row.summary ?? row.message),
        stdout: asNullableString(row.stdout ?? row.standardOutput),
        stderr: asNullableString(row.stderr ?? row.standardError),
        checks: checksValue.flatMap((candidate) => {
            const check = asRecord(candidate);
            if (!check) return [];
            return [
                {
                    code: asString(check.code ?? check.name, 'CHECK'),
                    passed: asBoolean(check.passed ?? check.success),
                    message: asString(check.message ?? check.description),
                },
            ];
        }),
    };
}

function defaultPermissions(
    status: ProblemProposalStatus,
    latestReview: ProblemProposalReview | null,
): ProblemProposalPermissions {
    const editable = status === 'DRAFT' || status === 'CHANGES_REQUESTED';
    return {
        canEdit: editable,
        canSubmit: editable,
        canCancelReview: status === 'PENDING' || status === 'CHANGES_REQUESTED',
        canResubmit: status === 'CHANGES_REQUESTED',
        canDeleteDraft: status === 'DRAFT' && latestReview === null,
        canDeleteAssets: editable,
        canRunValidation: editable,
    };
}

export function normalizeProblemProposal(value: unknown): ProblemProposal {
    const row = asRecord(value) ?? {};
    const revision = asRecord(row.currentRevision ?? row.revision) ?? row;
    const revisionId =
        asNumber(revision.id ?? row.revisionId, -1) >= 0
            ? asNumber(revision.id ?? row.revisionId)
            : null;
    const status = normalizeProposalStatus(row.status);
    const permissionsValue = asRecord(row.permissions);
    const latestReview =
        normalizeReview(
            row.latestReview ?? row.latestReviewRequest ?? row.review ?? row.pendingReview,
        ) ??
        normalizeReview(
            row.reviewStatus
                ? {
                      id: 0,
                      status: row.reviewStatus,
                      version: 0,
                  }
                : null,
        );
    const defaults = defaultPermissions(status, latestReview);
    return {
        id: asNumber(row.id ?? row.proposalId),
        title: asString(revision.title ?? row.title),
        shortDescription: asString(
            revision.shortDescription ?? row.shortDescription ?? row.summary,
        ),
        longDescription: asString(
            revision.longDescription ??
                row.longDescription ??
                row.statementMarkdown ??
                row.statement,
        ),
        difficulty: enumValue(revision.difficulty ?? row.difficulty, DIFFICULTIES, 'MEDIUM'),
        evaluationType: enumValue(
            revision.evaluationType ?? row.evaluationType ?? row.submissionFormat,
            EVALUATION_TYPES,
            'CSV',
        ),
        metricPreference: enumValue(
            revision.metricPreference ?? row.metricPreference,
            METRIC_PREFERENCES,
            'BIGGER_IS_BETTER',
        ),
        subtasks: normalizeSubtasks(revision.subtasks ?? row.subtasks),
        categoryIds: Array.isArray(revision.categoryIds)
            ? revision.categoryIds.flatMap((id) => {
                  const parsed = asNumber(id);
                  return parsed > 0 ? [parsed] : [];
              })
            : [],
        authorFirstName: asString(revision.authorFirstName),
        authorLastName: asString(revision.authorLastName),
        revisionId,
        status,
        version: asNumber(row.version),
        createdAt: asString(row.createdAt, new Date(0).toISOString()),
        updatedAt: asString(row.updatedAt ?? row.createdAt, new Date(0).toISOString()),
        importedProblemId:
            asNumber(row.importedProblemId ?? row.approvedProblemId ?? row.problemId) > 0
                ? asNumber(row.importedProblemId ?? row.approvedProblemId ?? row.problemId)
                : null,
        target: (() => {
            const hostingRequestId = asNumber(row.targetHostingRequestId, -1);
            const competitionId = asNumber(row.targetCompetitionId, -1);
            if (hostingRequestId > 0) {
                return {
                    scope: 'HOST_REQUEST' as const,
                    id: hostingRequestId,
                    name: asNullableString(row.targetName),
                };
            }
            if (competitionId > 0) {
                return {
                    scope: 'MANAGED_COMPETITION' as const,
                    id: competitionId,
                    name: asNullableString(row.targetName),
                };
            }
            return {
                scope: 'CATALOG' as const,
                id: null,
                name: null,
            };
        })(),
        assets: normalizeAssets(row.assets ?? row.files),
        latestReview,
        latestValidation: normalizeProblemProposalValidationRun(
            row.latestValidation ??
                row.latestValidationRun ??
                row.validation ??
                (row.validationStatus ? { status: row.validationStatus } : null),
            revisionId,
        ),
        permissions: permissionsValue
            ? {
                  canEdit: asBoolean(permissionsValue.canEdit, defaults.canEdit),
                  canSubmit: asBoolean(permissionsValue.canSubmit, defaults.canSubmit),
                  canCancelReview: asBoolean(
                      permissionsValue.canCancelReview ?? permissionsValue.canCancel,
                      defaults.canCancelReview,
                  ),
                  canResubmit: asBoolean(permissionsValue.canResubmit, defaults.canResubmit),
                  canDeleteDraft: asBoolean(
                      permissionsValue.canDeleteDraft ?? permissionsValue.canDelete,
                      defaults.canDeleteDraft,
                  ),
                  canDeleteAssets: asBoolean(
                      permissionsValue.canDeleteAssets,
                      defaults.canDeleteAssets,
                  ),
                  canRunValidation: asBoolean(
                      permissionsValue.canRunValidation,
                      defaults.canRunValidation,
                  ),
              }
            : defaults,
    };
}

export async function getMyProblemProposals({
    page = 0,
    size = 20,
}: {
    page?: number;
    size?: number;
} = {}): Promise<ProblemProposalPage> {
    const url = apiUrl('/me/problem-proposals');
    url.searchParams.set('page', String(Math.max(0, page)));
    url.searchParams.set('size', String(Math.max(1, Math.min(size, 50))));
    const response = await fetchApi(url);
    if (!response.ok) throw await parseError(response, 'Unable to load your problem proposals');
    const payload = (await response.json()) as unknown[] | SpringPage<unknown>;
    const rows = Array.isArray(payload) ? payload : (payload.content ?? payload.items ?? []);
    const content = rows.map(normalizeProblemProposal);
    if (Array.isArray(payload)) {
        return {
            content,
            page: {
                number: 0,
                size: content.length,
                totalElements: content.length,
                totalPages: content.length > 0 ? 1 : 0,
            },
        };
    }
    const nestedPage = typeof payload.page === 'object' ? payload.page : undefined;
    return {
        content,
        page: {
            number:
                (typeof payload.page === 'number' ? payload.page : nestedPage?.number) ??
                payload.number ??
                page,
            size: nestedPage?.size ?? payload.size ?? size,
            totalElements: nestedPage?.totalElements ?? payload.totalElements ?? content.length,
            totalPages:
                nestedPage?.totalPages ?? payload.totalPages ?? (content.length > 0 ? 1 : 0),
        },
    };
}

export async function getMyProblemProposal(id: number): Promise<ProblemProposal> {
    const response = await fetchApi(apiUrl(`/me/problem-proposals/${encodeURIComponent(id)}`));
    if (!response.ok) throw await parseError(response, 'Unable to load this problem proposal');
    return normalizeProblemProposal(await response.json());
}

export async function createProblemProposalDraft(
    input: ProblemProposalDraftInput,
    target: ProblemProposalCreationTarget = { scope: 'CATALOG' },
): Promise<ProblemProposal> {
    const response = await fetchApi(apiUrl('/me/problem-proposals'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            ...input,
            ...(target.scope === 'HOST_REQUEST'
                ? { targetHostingRequestId: target.hostingRequestId }
                : {}),
            ...(target.scope === 'MANAGED_COMPETITION'
                ? { targetCompetitionId: target.competitionId }
                : {}),
        }),
    });
    if (!response.ok) throw await parseError(response, 'Unable to create the problem proposal');
    return normalizeProblemProposal(await response.json());
}

export async function saveProblemProposalDraft(
    id: number,
    input: ProblemProposalDraftInput,
): Promise<ProblemProposal> {
    const response = await fetchApi(apiUrl(`/me/problem-proposals/${encodeURIComponent(id)}`), {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input),
    });
    if (!response.ok) throw await parseError(response, 'Unable to save the problem proposal');
    return normalizeProblemProposal(await response.json());
}

export async function deleteProblemProposalDraft(proposal: ProblemProposal): Promise<void> {
    const response = await fetchApi(
        apiUrl(`/me/problem-proposals/${encodeURIComponent(proposal.id)}`),
        {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ version: proposal.version }),
        },
    );
    if (!response.ok) throw await parseError(response, 'Unable to delete the problem proposal');
}

async function runReviewAction(
    proposal: ProblemProposal,
    action: 'submit' | 'cancel' | 'resubmit',
    reviewerNote?: string,
): Promise<ProblemProposal> {
    const reviewId = proposal.latestReview?.id;
    if ((action === 'cancel' || action === 'resubmit') && !reviewId) {
        throw new ProblemProposalApiError(409, 'This proposal has no active review request');
    }
    const path =
        action === 'submit'
            ? `/me/problem-proposals/${encodeURIComponent(proposal.id)}/submit`
            : `/me/problem-proposals/reviews/${encodeURIComponent(reviewId ?? '')}/${action}`;
    const response = await fetchApi(apiUrl(path), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            version: action === 'submit' ? proposal.version : (proposal.latestReview?.version ?? 0),
            ...(action === 'submit' && reviewerNote?.trim()
                ? { rationale: reviewerNote.trim() }
                : {}),
            ...(action !== 'submit' ? { proposalVersion: proposal.version } : {}),
        }),
    });
    if (!response.ok) throw await parseError(response, 'Unable to update the review request');
    await response.json().catch(() => null);
    return getMyProblemProposal(proposal.id);
}

export const submitProblemProposal = (proposal: ProblemProposal, reviewerNote?: string) =>
    runReviewAction(proposal, 'submit', reviewerNote);

export const cancelProblemProposalReview = (proposal: ProblemProposal) =>
    runReviewAction(proposal, 'cancel');

export const resubmitProblemProposal = (proposal: ProblemProposal, reviewerNote?: string) =>
    runReviewAction(proposal, 'resubmit', reviewerNote);

export async function sha256Hex(file: Blob): Promise<string> {
    return sha256Blob(file);
}

export async function computeProblemProposalAssetDigest(
    assets: ProblemProposalAsset[],
): Promise<string> {
    const source = assets
        .filter((asset) => asset.status === 'CONFIRMED')
        .sort((left, right) => {
            const roleOrder = backendAssetRole(left.role).localeCompare(
                backendAssetRole(right.role),
            );
            return roleOrder || left.id.localeCompare(right.id);
        })
        .map(
            (asset) =>
                `${backendAssetRole(asset.role)}:${asset.id}:${asset.sha256 ?? ''}:${asset.confirmedBytes ?? asset.sizeBytes}\n`,
        )
        .join('');
    return sha256Text(source);
}

export async function requestProblemProposalAssetUpload(
    proposal: ProblemProposal,
    role: ProblemProposalAssetRole,
    file: File,
    onHashProgress?: (completedBytes: number, totalBytes: number) => void,
): Promise<ProblemProposalUploadTicket> {
    const contentType = file.type || 'application/octet-stream';
    const sha256 = await sha256Blob(file, { onProgress: onHashProgress });
    const response = await fetchApi(
        apiUrl(`/me/problem-proposals/${encodeURIComponent(proposal.id)}/assets/presign`),
        {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                proposalVersion: proposal.version,
                role: backendAssetRole(role),
                fileName: file.name,
                contentType,
                byteSize: file.size,
                sha256,
            }),
        },
    );
    if (!response.ok) throw await parseError(response, 'Unable to prepare this file upload');
    const payload = asRecord(await response.json()) ?? {};
    const asset = asRecord(payload.asset) ?? asRecord(payload.upload) ?? payload;
    const assetId = asNullableString(asset.assetId ?? asset.id);
    const uploadUrl = asNullableString(
        payload.uploadUrl ??
            payload.presignedUrl ??
            payload.url ??
            asset.uploadUrl ??
            asset.presignedUrl ??
            asset.url,
    );
    if (!assetId || !uploadUrl) {
        throw new ProblemProposalApiError(502, 'The upload service returned an invalid response');
    }
    return {
        assetId,
        uploadUrl,
        method: asString(payload.method ?? asset.method).toUpperCase() === 'POST' ? 'POST' : 'PUT',
        headers: Object.fromEntries(
            Object.entries(
                asRecord(payload.requiredHeaders ?? payload.headers ?? asset.headers) ?? {},
            ).flatMap(([key, value]) => (typeof value === 'string' ? [[key, value]] : [])),
        ),
        fields: Object.fromEntries(
            Object.entries(asRecord(payload.fields ?? asset.fields) ?? {}).flatMap(
                ([key, value]) => (typeof value === 'string' ? [[key, value]] : []),
            ),
        ),
        proposalVersion: asNumber(payload.proposalVersion, proposal.version),
        assetVersion: asNumber(asset.version),
        expiresAt: asNullableString(payload.expiresAt ?? asset.expiresAt),
    };
}

async function uploadToPresignedTarget(
    ticket: ProblemProposalUploadTicket,
    file: File,
): Promise<void> {
    let body: BodyInit = file;
    const headers = new Headers(ticket.headers);
    if (ticket.method === 'POST' && Object.keys(ticket.fields).length > 0) {
        const form = new FormData();
        for (const [key, value] of Object.entries(ticket.fields)) form.append(key, value);
        form.append('file', file, file.name);
        body = form;
        headers.delete('content-type');
    } else if (!headers.has('content-type') && file.type) {
        headers.set('content-type', file.type);
    }
    const response = await fetch(ticket.uploadUrl, {
        method: ticket.method,
        headers,
        body,
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
    });
    if (!response.ok) {
        throw new ProblemProposalApiError(response.status, 'The file could not be uploaded');
    }
}

export async function uploadProblemProposalAsset(
    proposal: ProblemProposal,
    role: ProblemProposalAssetRole,
    file: File,
    options: {
        onHashProgress?: (completedBytes: number, totalBytes: number) => void;
    } = {},
): Promise<ProblemProposal> {
    const ticket = await requestProblemProposalAssetUpload(
        proposal,
        role,
        file,
        options.onHashProgress,
    );
    await uploadToPresignedTarget(ticket, file);
    const response = await fetchApi(
        apiUrl(
            `/me/problem-proposals/${encodeURIComponent(proposal.id)}/assets/${encodeURIComponent(ticket.assetId)}/confirm`,
        ),
        {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                proposalVersion: ticket.proposalVersion,
                assetVersion: ticket.assetVersion,
            }),
        },
    );
    if (!response.ok) throw await parseError(response, 'Unable to confirm this file upload');
    return normalizeProblemProposal(await response.json());
}

export async function deleteProblemProposalAsset(
    proposal: ProblemProposal,
    assetId: string,
): Promise<ProblemProposal> {
    const asset = proposal.assets.find((candidate) => candidate.id === assetId);
    if (!asset) throw new ProblemProposalApiError(404, 'This file is no longer available');
    const response = await fetchApi(
        apiUrl(
            `/me/problem-proposals/${encodeURIComponent(proposal.id)}/assets/${encodeURIComponent(assetId)}`,
        ),
        {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                proposalVersion: proposal.version,
                assetVersion: asset.version,
            }),
        },
    );
    if (!response.ok) throw await parseError(response, 'Unable to remove this file');
    return normalizeProblemProposal(await response.json());
}

export async function startProblemProposalValidation(
    proposal: ProblemProposal,
): Promise<{ validation: ProblemProposalValidationRun; proposal: ProblemProposal }> {
    const response = await fetchApi(
        apiUrl(`/me/problem-proposals/${encodeURIComponent(proposal.id)}/validation-request`),
        {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ version: proposal.version }),
        },
    );
    if (!response.ok) throw await parseError(response, 'Unable to start evaluator validation');
    const run = normalizeProblemProposalValidationRun(await response.json(), proposal.revisionId);
    if (!run) throw new ProblemProposalApiError(502, 'Validation returned an invalid response');
    const refreshedProposal = await getMyProblemProposal(proposal.id);
    return {
        validation: refreshedProposal.latestValidation ?? run,
        proposal: refreshedProposal,
    };
}

export async function getLatestProblemProposalValidation(
    proposalId: number,
): Promise<ProblemProposalValidationRun | null> {
    const response = await fetchApi(
        apiUrl(`/me/problem-proposals/${encodeURIComponent(proposalId)}/validation`),
    );
    if (response.status === 404) return null;
    if (!response.ok) throw await parseError(response, 'Unable to load evaluator validation');
    return normalizeProblemProposalValidationRun(await response.json());
}

export async function getEvaluatorContract(): Promise<EvaluatorContract> {
    try {
        const response = await fetchApi(apiUrl('/problem-proposals/evaluator-contract'), {
            next: { revalidate: 300, tags: ['problem-proposal-evaluator-contract'] },
        } as RequestInit);
        if (!response.ok) return DEFAULT_EVALUATOR_CONTRACT;
        const payload = asRecord(await response.json());
        if (!payload) return DEFAULT_EVALUATOR_CONTRACT;
        const limits = asRecord(payload.limits);
        const assetLimits = asRecord(limits?.maxAssetBytes ?? limits?.assetLimits);
        const entryPoint =
            asNullableString(payload.entryPoint) ??
            asNullableString(payload.functionSignature ?? payload.signature);
        const minimalExample =
            asNullableString(payload.minimalExample) ??
            asNullableString(payload.template ?? payload.pythonTemplate);
        const subtaskExample = asNullableString(payload.subtaskExample);
        const signatures = normalizeEvaluatorSignatures(payload.signatures);
        return {
            contractVersion:
                asNullableString(payload.contractVersion ?? payload.version) ??
                DEFAULT_EVALUATOR_CONTRACT.contractVersion,
            contractHash:
                asNullableString(payload.contractHash ?? payload.hash) ??
                DEFAULT_EVALUATOR_CONTRACT.contractHash,
            functionName:
                asNullableString(payload.functionName) ?? DEFAULT_EVALUATOR_CONTRACT.functionName,
            functionSignature: entryPoint?.startsWith('Supported signatures:')
                ? (signatures[0]?.signature ?? DEFAULT_EVALUATOR_CONTRACT.functionSignature)
                : (entryPoint ?? DEFAULT_EVALUATOR_CONTRACT.functionSignature),
            returnDescription:
                asNullableString(
                    payload.returnDescription ?? payload.returnShape ?? payload.returns,
                ) ?? DEFAULT_EVALUATOR_CONTRACT.returnDescription,
            subtaskFunctionPattern:
                asNullableString(payload.subtaskFunctionPattern ?? payload.subtaskPattern) ??
                subtaskExample
                    ?.split('\n')
                    .find((line) => line.includes('def subtask'))
                    ?.trim() ??
                DEFAULT_EVALUATOR_CONTRACT.subtaskFunctionPattern,
            routingFlag:
                asNullableString(payload.routingFlag) ??
                subtaskExample
                    ?.split('\n')
                    .find((line) => line.includes('SUBTASK_ID_ROUTING'))
                    ?.trim() ??
                DEFAULT_EVALUATOR_CONTRACT.routingFlag,
            signatures,
            template:
                [minimalExample, subtaskExample].filter(Boolean).join('\n\n') ||
                DEFAULT_EVALUATOR_CONTRACT.template,
            supportedFormats: stringArray(
                payload.supportedFormats ?? payload.allowedDataTypes,
                DEFAULT_EVALUATOR_CONTRACT.supportedFormats,
            ),
            requiredFiles: stringArray(
                payload.requiredFiles,
                DEFAULT_EVALUATOR_CONTRACT.requiredFiles,
            ),
            allowedLibraries: stringArray(
                payload.allowedLibraries,
                DEFAULT_EVALUATOR_CONTRACT.allowedLibraries,
            ),
            prohibitedCapabilities: stringArray(
                payload.prohibitedCapabilities ?? payload.securityRules,
                DEFAULT_EVALUATOR_CONTRACT.prohibitedCapabilities,
            ),
            localTestCommand:
                asNullableString(payload.localTestCommand) ??
                DEFAULT_EVALUATOR_CONTRACT.localTestCommand,
            limits: {
                timeoutSeconds: Math.max(
                    1,
                    asNumber(
                        limits?.timeoutSeconds ?? limits?.wallTimeSeconds,
                        DEFAULT_EVALUATOR_CONTRACT.limits.timeoutSeconds,
                    ),
                ),
                maxOutputBytes: Math.max(
                    1,
                    asNumber(
                        limits?.maxOutputBytes ?? limits?.stdoutBytes,
                        DEFAULT_EVALUATOR_CONTRACT.limits.maxOutputBytes,
                    ),
                ),
                maxEvaluatorBytes: Math.max(
                    1,
                    asNumber(
                        limits?.maxEvaluatorBytes ?? limits?.evaluatorScriptBytes,
                        DEFAULT_EVALUATOR_CONTRACT.limits.maxEvaluatorBytes,
                    ),
                ),
                maxAssetBytes: Object.fromEntries(
                    Object.entries(DEFAULT_EVALUATOR_CONTRACT.limits.maxAssetBytes).map(
                        ([role, fallback]) => [
                            role,
                            Math.max(1, asNumber(assetLimits?.[role], fallback)),
                        ],
                    ),
                ),
            },
        };
    } catch {
        return DEFAULT_EVALUATOR_CONTRACT;
    }
}
