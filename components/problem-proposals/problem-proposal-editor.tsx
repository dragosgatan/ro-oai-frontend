'use client';

import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Beaker,
    Check,
    CheckCircle2,
    ChevronRight,
    Circle,
    Clock3,
    Code2,
    Download,
    FileArchive,
    FileCheck2,
    FileText,
    Info,
    Lightbulb,
    Loader2,
    LockKeyhole,
    Plus,
    RotateCcw,
    Save,
    Send,
    ShieldCheck,
    Trash2,
    Unlock,
    Upload,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { ArticleRichTextEditor } from '@/components/articles/article-rich-text-editor';
import { ApprovedProblemProposalNotice } from '@/components/problem-proposals/approved-problem-proposal-notice';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link, useRouter } from '@/i18n/routing';
import {
    ProblemProposalApiError,
    PROBLEM_PROPOSAL_ASSET_VISIBILITY,
    PROBLEM_PROPOSAL_EVALUATION_TYPES,
    buildProblemProposalReadiness,
    cancelProblemProposalReview,
    computeProblemProposalAssetDigest,
    createProblemProposalDraft,
    deleteProblemProposalDraft,
    deleteProblemProposalAsset,
    getLatestProblemProposalValidation,
    problemProposalAssetAccept,
    resubmitProblemProposal,
    saveProblemProposalDraft,
    startProblemProposalValidation,
    submitProblemProposal,
    uploadProblemProposalAsset,
    type EvaluatorContract,
    type ProblemProposal,
    type ProblemProposalAsset,
    type ProblemProposalAssetRole,
    type ProblemProposalDraftInput,
    type ProblemProposalCreationTarget,
    type ProblemProposalSubtask,
    type ProblemProposalValidationRun,
} from '@/lib/problem-proposals';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

type StepId = 'idea' | 'statement' | 'files' | 'evaluator' | 'scoring' | 'review';
type BusyState =
    | 'save'
    | 'action'
    | 'validation'
    | 'delete-proposal'
    | `upload:${string}`
    | `delete:${string}`
    | null;

type RecoveryDraft = {
    baseVersion: number | null;
    fields: ProblemProposalDraftInput;
    activeStep: StepId;
};

type ProblemProposalEditorContext = {
    target: ProblemProposalCreationTarget;
    targetName: string;
    backHref: string;
    detailBaseHref: string;
};

const CATALOG_EDITOR_CONTEXT: ProblemProposalEditorContext = {
    target: { scope: 'CATALOG' },
    targetName: '',
    backHref: '/problem-proposals',
    detailBaseHref: '/problem-proposals',
};

const STEPS: Array<{
    id: StepId;
    icon: typeof Lightbulb;
    readinessKey?: 'idea' | 'statement' | 'files' | 'evaluator' | 'scoring';
}> = [
    { id: 'idea', icon: Lightbulb, readinessKey: 'idea' },
    { id: 'statement', icon: FileText, readinessKey: 'statement' },
    { id: 'files', icon: FileArchive, readinessKey: 'files' },
    { id: 'evaluator', icon: Beaker, readinessKey: 'evaluator' },
    { id: 'scoring', icon: FileCheck2, readinessKey: 'scoring' },
    { id: 'review', icon: ShieldCheck },
];

const ASSET_ROLES: ProblemProposalAssetRole[] = [
    'PUBLIC_DATASET',
    'GROUND_TRUTH',
    'EVALUATOR_SCRIPT',
    'SAMPLE_SUBMISSION',
    'REFERENCE_SUBMISSION',
    'SUPPORTING_FILE',
];

function splitDisplayName(displayName?: string | null): [string, string] {
    const parts = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
    return [parts[0] ?? '', parts.slice(1).join(' ')];
}

function blankFields(defaultAuthorName?: string | null): ProblemProposalDraftInput {
    const [authorFirstName, authorLastName] = splitDisplayName(defaultAuthorName);
    return {
        title: '',
        shortDescription: '',
        longDescription: '',
        difficulty: 'MEDIUM',
        evaluationType: 'CSV',
        metricPreference: 'BIGGER_IS_BETTER',
        subtasks: [{ subtaskName: 'Overall', metricName: 'Score' }],
        categoryIds: [],
        authorFirstName,
        authorLastName,
    };
}

function fieldsFromProposal(
    proposal: ProblemProposal | null,
    defaultAuthorName?: string | null,
): ProblemProposalDraftInput {
    if (!proposal) return blankFields(defaultAuthorName);
    return {
        title: proposal.title,
        shortDescription: proposal.shortDescription,
        longDescription: proposal.longDescription,
        difficulty: proposal.difficulty,
        evaluationType: proposal.evaluationType,
        metricPreference: proposal.metricPreference,
        subtasks:
            proposal.subtasks.length > 0
                ? proposal.subtasks
                : [{ subtaskName: 'Overall', metricName: 'Score' }],
        categoryIds: proposal.categoryIds,
        authorFirstName: proposal.authorFirstName,
        authorLastName: proposal.authorLastName,
        version: proposal.version,
    };
}

function serializeFields(fields: ProblemProposalDraftInput): string {
    return JSON.stringify({ ...fields, version: undefined });
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

function isRecoveryDraft(value: unknown): value is RecoveryDraft {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Partial<RecoveryDraft>;
    const fields = candidate.fields as Partial<ProblemProposalDraftInput> | undefined;
    return Boolean(
        fields &&
            typeof fields.title === 'string' &&
            typeof fields.shortDescription === 'string' &&
            typeof fields.longDescription === 'string' &&
            typeof fields.authorFirstName === 'string' &&
            typeof fields.authorLastName === 'string' &&
            Array.isArray(fields.categoryIds) &&
            Array.isArray(fields.subtasks) &&
            STEPS.some((step) => step.id === candidate.activeStep),
    );
}

function assetsForRole(assets: ProblemProposalAsset[], role: ProblemProposalAssetRole) {
    return assets.filter((asset) => asset.role === role);
}

export function ProblemProposalEditor({
    initialProposal,
    evaluatorContract,
    recoveryScope,
    defaultAuthorName,
    categories = [],
    context,
}: {
    initialProposal: ProblemProposal | null;
    evaluatorContract: EvaluatorContract;
    recoveryScope: string;
    defaultAuthorName?: string | null;
    categories?: Category[];
    context?: ProblemProposalEditorContext;
}) {
    const t = useTranslations('problemProposals');
    const hostingT = useTranslations('competitionHosting.problemEditor');
    const locale = useLocale();
    const router = useRouter();
    const editorContext = useMemo<ProblemProposalEditorContext>(() => {
        if (context) return context;
        const target = initialProposal?.target;
        if (target?.scope === 'HOST_REQUEST' && target.id) {
            return {
                target: { scope: 'HOST_REQUEST', hostingRequestId: target.id },
                targetName: target.name ?? `#${target.id}`,
                backHref: `/my-competitions/requests/${target.id}`,
                detailBaseHref: `/my-competitions/requests/${target.id}/problems`,
            };
        }
        if (target?.scope === 'MANAGED_COMPETITION' && target.id) {
            return {
                target: { scope: 'MANAGED_COMPETITION', competitionId: target.id },
                targetName: target.name ?? `#${target.id}`,
                backHref: `/my-competitions/${target.id}/problems`,
                detailBaseHref: `/my-competitions/${target.id}/problems`,
            };
        }
        return CATALOG_EDITOR_CONTEXT;
    }, [context, initialProposal?.target]);
    const [proposal, setProposal] = useState(initialProposal);
    const [fields, setFields] = useState<ProblemProposalDraftInput>(() =>
        fieldsFromProposal(initialProposal, defaultAuthorName),
    );
    const [activeStep, setActiveStep] = useState<StepId>('idea');
    const [validation, setValidation] = useState<ProblemProposalValidationRun | null>(
        initialProposal?.latestValidation ?? null,
    );
    const [busy, setBusy] = useState<BusyState>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasConflict, setHasConflict] = useState(false);
    const [reviewerNote, setReviewerNote] = useState('');
    const [uploadProgress, setUploadProgress] = useState<{
        role: ProblemProposalAssetRole;
        percent: number;
    } | null>(null);
    const [recoveryReady, setRecoveryReady] = useState(false);
    const savedSnapshotRef = useRef(serializeFields(fields));
    const fieldsRef = useRef(fields);
    const proposalRef = useRef(initialProposal);
    const saveRequestRef = useRef<Promise<ProblemProposal | null> | null>(null);
    const recoveryKeyRef = useRef(
        `problem-proposal-recovery:${recoveryScope}:${editorContext.target.scope}:${editorContext.target.scope === 'CATALOG' ? 'catalog' : editorContext.target.scope === 'HOST_REQUEST' ? editorContext.target.hostingRequestId : editorContext.target.competitionId}:${initialProposal?.id ?? 'new'}`,
    );
    const dirty = savedSnapshotRef.current !== serializeFields(fields);
    const locked =
        proposal?.status === 'PENDING' ||
        proposal?.status === 'APPROVED' ||
        Boolean(proposal && !proposal.permissions.canEdit);
    const validationIsRunning = validation?.status === 'QUEUED' || validation?.status === 'RUNNING';
    const readiness = useMemo(
        () =>
            buildProblemProposalReadiness(
                fields,
                proposal?.assets ?? [],
                validation,
                dirty ? -1 : proposal?.version,
                dirty ? -1 : proposal?.revisionId,
            ),
        [dirty, fields, proposal?.assets, proposal?.revisionId, proposal?.version, validation],
    );
    const currentStepIndex = STEPS.findIndex((step) => step.id === activeStep);

    useEffect(() => {
        proposalRef.current = proposal;
    }, [proposal]);

    useEffect(() => {
        fieldsRef.current = fields;
    }, [fields]);

    const clearRecovery = useCallback(() => {
        try {
            sessionStorage.removeItem(recoveryKeyRef.current);
        } catch {
            // Private browsing modes may disable storage.
        }
    }, []);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(recoveryKeyRef.current);
            if (!raw) return;
            const recovered = JSON.parse(raw) as unknown;
            if (
                !isRecoveryDraft(recovered) ||
                recovered.baseVersion !== (initialProposal?.version ?? null)
            ) {
                sessionStorage.removeItem(recoveryKeyRef.current);
                return;
            }
            if (serializeFields(recovered.fields) !== savedSnapshotRef.current) {
                setFields(recovered.fields);
                setActiveStep(recovered.activeStep);
            }
        } catch {
            clearRecovery();
        } finally {
            setRecoveryReady(true);
        }
    }, [clearRecovery, initialProposal?.version]);

    useEffect(() => {
        if (!recoveryReady) return;
        if (!dirty) {
            clearRecovery();
            return;
        }
        const timer = window.setTimeout(() => {
            try {
                const payload: RecoveryDraft = {
                    baseVersion: proposal?.version ?? null,
                    fields,
                    activeStep,
                };
                sessionStorage.setItem(recoveryKeyRef.current, JSON.stringify(payload));
            } catch {
                // The server save remains the durable persistence path.
            }
        }, 350);
        return () => window.clearTimeout(timer);
    }, [activeStep, clearRecovery, dirty, fields, proposal?.version, recoveryReady]);

    const setField = <K extends keyof ProblemProposalDraftInput>(
        key: K,
        value: ProblemProposalDraftInput[K],
    ) => {
        setFields((current) => ({ ...current, [key]: value }));
        setError(null);
        setHasConflict(false);
    };

    const handleApiError = useCallback(
        (caught: unknown, fallbackKey: string) => {
            const conflictCodes = new Set([
                'PROBLEM_PROPOSAL_VERSION_CONFLICT',
                'PROPOSAL_OPTIMISTIC_LOCK_CONFLICT',
                'OPTIMISTIC_LOCK_CONFLICT',
            ]);
            if (
                caught instanceof ProblemProposalApiError &&
                caught.status === 409 &&
                (conflictCodes.has(caught.code ?? '') || !caught.code)
            ) {
                setHasConflict(true);
                setError(t('errors.conflict'));
                return;
            }
            if (caught instanceof ProblemProposalApiError && caught.status === 403) {
                setError(t('errors.forbidden'));
                return;
            }
            if (
                caught instanceof ProblemProposalApiError &&
                (caught.status === 429 || caught.code === 'PROBLEM_PROPOSAL_PENDING_LIMIT_REACHED')
            ) {
                setError(t('errors.pendingLimit'));
                return;
            }
            setError(caught instanceof Error ? caught.message : t(fallbackKey));
        },
        [t],
    );

    const validateFirstSave = useCallback((): string | null => {
        if (fields.title.trim().length < 3) return t('validation.title');
        return null;
    }, [fields.title, t]);

    const persistDraft = useCallback(
        async (quiet = false): Promise<ProblemProposal | null> => {
            if (locked) return proposal;
            const validationMessage = validateFirstSave();
            if (validationMessage) {
                setError(validationMessage);
                return null;
            }
            if (saveRequestRef.current) return saveRequestRef.current;

            const capturedFields = {
                ...fields,
                title: fields.title.trim(),
                shortDescription: fields.shortDescription.trim(),
                subtasks: fields.subtasks.map((subtask) => ({
                    subtaskName: subtask.subtaskName.trim(),
                    metricName: subtask.metricName.trim(),
                })),
                authorFirstName: fields.authorFirstName.trim(),
                authorLastName: fields.authorLastName.trim(),
                version: proposal?.version,
            };
            const capturedSnapshot = serializeFields(fields);
            setBusy('save');
            setError(null);
            const request = (
                proposal
                    ? saveProblemProposalDraft(proposal.id, capturedFields)
                    : createProblemProposalDraft(capturedFields, editorContext.target)
            )
                .then((saved) => {
                    setProposal(saved);
                    proposalRef.current = saved;
                    setValidation((current) => saved.latestValidation ?? current);
                    if (serializeFields(fieldsRef.current) === capturedSnapshot) {
                        const normalizedFields = fieldsFromProposal(saved, defaultAuthorName);
                        fieldsRef.current = normalizedFields;
                        setFields(normalizedFields);
                        savedSnapshotRef.current = serializeFields(normalizedFields);
                        clearRecovery();
                    } else {
                        savedSnapshotRef.current = capturedSnapshot;
                    }
                    setHasConflict(false);
                    if (!proposal) {
                        router.replace(`${editorContext.detailBaseHref}/${saved.id}`);
                    }
                    if (!quiet) toast.success(t('toasts.saved'));
                    return saved;
                })
                .catch((caught: unknown) => {
                    handleApiError(caught, 'errors.save');
                    return null;
                })
                .finally(() => {
                    setBusy((current) => (current === 'save' ? null : current));
                    saveRequestRef.current = null;
                });
            saveRequestRef.current = request;
            return request;
        },
        [
            clearRecovery,
            defaultAuthorName,
            fields,
            handleApiError,
            editorContext.detailBaseHref,
            editorContext.target,
            locked,
            proposal,
            router,
            t,
            validateFirstSave,
        ],
    );

    useEffect(() => {
        if (!dirty || locked || busy || fields.title.trim().length < 3) return;
        const timer = window.setTimeout(() => void persistDraft(true), 1400);
        return () => window.clearTimeout(timer);
    }, [busy, dirty, fields.title, locked, persistDraft]);

    useEffect(() => {
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!dirty) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [dirty]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                if (!busy && !locked) void persistDraft();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [busy, locked, persistDraft]);

    useEffect(() => {
        if (!proposal || !validationIsRunning) return;
        let active = true;
        const poll = async () => {
            try {
                const latest = await getLatestProblemProposalValidation(proposal.id);
                if (!active || !latest) return;
                setValidation(latest);
            } catch {
                // Keep the last known state; the user can retry without losing the draft.
            }
        };
        const timer = window.setInterval(() => void poll(), 2200);
        void poll();
        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, [proposal, validationIsRunning]);

    useEffect(() => {
        if (
            !proposal ||
            validation?.status !== 'PASSED' ||
            !validation.assetDigest ||
            proposal.assets.some(
                (asset) =>
                    asset.status === 'CONFIRMED' &&
                    (!asset.sha256 || asset.confirmedBytes === null),
            )
        ) {
            return;
        }
        let active = true;
        void computeProblemProposalAssetDigest(proposal.assets).then((currentDigest) => {
            if (!active || currentDigest === validation.assetDigest) return;
            setValidation((current) =>
                current?.id === validation.id ? { ...current, status: 'STALE' } : current,
            );
        });
        return () => {
            active = false;
        };
    }, [proposal, validation]);

    const goToStep = async (step: StepId) => {
        if (!locked && dirty && fields.title.trim().length >= 3) {
            await persistDraft(true);
        }
        setActiveStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const moveStep = async (direction: -1 | 1) => {
        const target = STEPS[currentStepIndex + direction];
        if (target) await goToStep(target.id);
    };

    const handleAssetUpload = async (
        role: ProblemProposalAssetRole,
        event: ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.item(0);
        event.target.value = '';
        if (!file || locked) return;
        const maxBytes =
            evaluatorContract.limits.maxAssetBytes[role] ??
            (role === 'EVALUATOR_SCRIPT'
                ? evaluatorContract.limits.maxEvaluatorBytes
                : 20 * 1024 * 1024);
        if (file.size > maxBytes) {
            setError(
                t('files.tooLarge', {
                    size: formatBytes(maxBytes),
                }),
            );
            return;
        }

        let target = proposal;
        if (!target || dirty) target = await persistDraft(true);
        if (!target) return;
        setBusy(`upload:${role}`);
        setUploadProgress({ role, percent: 0 });
        setError(null);
        try {
            const updated = await uploadProblemProposalAsset(target, role, file, {
                onHashProgress: (completedBytes, totalBytes) => {
                    setUploadProgress({
                        role,
                        percent:
                            totalBytes > 0
                                ? Math.min(100, Math.round((completedBytes / totalBytes) * 100))
                                : 100,
                    });
                },
            });
            setProposal(updated);
            proposalRef.current = updated;
            setValidation((current) => updated.latestValidation ?? current);
            toast.success(t('toasts.fileUploaded'));
        } catch (caught) {
            handleApiError(caught, 'errors.upload');
        } finally {
            setUploadProgress(null);
            setBusy(null);
        }
    };

    const handleAssetDelete = async (asset: ProblemProposalAsset) => {
        const target = proposalRef.current;
        if (!target || locked) return;
        setBusy(`delete:${asset.id}`);
        setError(null);
        try {
            const updated = await deleteProblemProposalAsset(target, asset.id);
            setProposal(updated);
            proposalRef.current = updated;
            setValidation((current) => updated.latestValidation ?? current);
        } catch (caught) {
            handleApiError(caught, 'errors.deleteAsset');
        } finally {
            setBusy(null);
        }
    };

    const handleValidation = async () => {
        let target = proposal;
        if (!target || dirty) target = await persistDraft(true);
        if (!target) return;
        setBusy('validation');
        setError(null);
        try {
            const result = await startProblemProposalValidation(target);
            const refreshedFields = fieldsFromProposal(result.proposal, defaultAuthorName);
            setProposal(result.proposal);
            proposalRef.current = result.proposal;
            setFields(refreshedFields);
            fieldsRef.current = refreshedFields;
            savedSnapshotRef.current = serializeFields(refreshedFields);
            setValidation(result.validation);
            clearRecovery();
            toast.success(t('toasts.validationStarted'));
        } catch (caught) {
            handleApiError(caught, 'errors.validation');
        } finally {
            setBusy(null);
        }
    };

    const handleDeleteProposal = async () => {
        const target = proposalRef.current;
        if (!target?.permissions.canDeleteDraft) return;
        setBusy('delete-proposal');
        setError(null);
        try {
            await deleteProblemProposalDraft(target);
            clearRecovery();
            toast.success(t('toasts.deleted'));
            router.replace(editorContext.backHref);
            router.refresh();
        } catch (caught) {
            handleApiError(caught, 'errors.deleteProposal');
            setBusy(null);
        }
    };

    const handleReviewAction = async (action: 'submit' | 'resubmit' | 'cancel') => {
        let target = proposal;
        if (action !== 'cancel') {
            if (!target || dirty) target = await persistDraft(true);
            if (!target) return;
            const finalReadiness = buildProblemProposalReadiness(
                fields,
                target.assets,
                validation,
                target.version,
                target.revisionId,
            );
            if (!finalReadiness.ready) {
                setError(t('validation.notReady'));
                return;
            }
        }
        if (!target) return;
        setBusy('action');
        setError(null);
        try {
            const updated =
                action === 'cancel'
                    ? await cancelProblemProposalReview(target)
                    : action === 'resubmit'
                      ? await resubmitProblemProposal(target, reviewerNote)
                      : await submitProblemProposal(target, reviewerNote);
            setProposal(updated);
            proposalRef.current = updated;
            const updatedFields = fieldsFromProposal(updated, defaultAuthorName);
            fieldsRef.current = updatedFields;
            setFields(updatedFields);
            savedSnapshotRef.current = serializeFields(updatedFields);
            setValidation((current) => updated.latestValidation ?? current);
            setReviewerNote('');
            clearRecovery();
            toast.success(action === 'cancel' ? t('toasts.cancelled') : t('toasts.submitted'));
            router.refresh();
        } catch (caught) {
            handleApiError(caught, 'errors.action');
        } finally {
            setBusy(null);
        }
    };

    const updateSubtask = (index: number, key: keyof ProblemProposalSubtask, value: string) => {
        setField(
            'subtasks',
            fields.subtasks.map((subtask, candidateIndex) =>
                candidateIndex === index ? { ...subtask, [key]: value } : subtask,
            ),
        );
    };

    const addSubtask = () =>
        setField('subtasks', [
            ...fields.subtasks,
            {
                subtaskName: t('scoring.defaultSubtask', {
                    number: fields.subtasks.length + 1,
                }),
                metricName: '',
            },
        ]);

    const removeSubtask = (index: number) =>
        setField(
            'subtasks',
            fields.subtasks.filter((_, candidateIndex) => candidateIndex !== index),
        );

    const toggleCategory = (categoryId: number) => {
        setField(
            'categoryIds',
            fields.categoryIds.includes(categoryId)
                ? fields.categoryIds.filter((id) => id !== categoryId)
                : [...fields.categoryIds, categoryId].slice(0, 20),
        );
    };

    const renderIdeaStep = () => (
        <section aria-labelledby="proposal-step-title" className="space-y-7">
            <StepHeading
                number="01"
                title={t('steps.idea.title')}
                description={t('steps.idea.description')}
            />
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="proposal-title" className="text-sm font-bold">
                        {t('fields.title.label')}
                    </label>
                    <Input
                        id="proposal-title"
                        value={fields.title}
                        maxLength={180}
                        disabled={locked}
                        onChange={(event) => setField('title', event.target.value)}
                        placeholder={t('fields.title.placeholder')}
                        className="mt-2 min-h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-base focus-visible:scale-100"
                    />
                    <p className="mt-1 text-end font-mono text-xs text-[var(--platform-ink-muted)]">
                        {fields.title.length}/180
                    </p>
                </div>
                <div className="sm:col-span-2">
                    <label htmlFor="proposal-summary" className="text-sm font-bold">
                        {t('fields.summary.label')}
                    </label>
                    <Textarea
                        id="proposal-summary"
                        value={fields.shortDescription}
                        maxLength={500}
                        disabled={locked}
                        onChange={(event) => setField('shortDescription', event.target.value)}
                        placeholder={t('fields.summary.placeholder')}
                        className="mt-2 min-h-32 resize-y rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] focus-visible:scale-100"
                    />
                    <p className="mt-1 flex items-center justify-between gap-3 text-xs text-[var(--platform-ink-muted)]">
                        <span>{t('fields.summary.help')}</span>
                        <span className="shrink-0 font-mono">
                            {fields.shortDescription.length}/500
                        </span>
                    </p>
                </div>
                <div className="sm:col-span-2">
                    <div className="border-b border-[var(--platform-line)] pb-3">
                        <h3 className="text-sm font-bold text-[var(--platform-ink)]">
                            {t('fields.author.title')}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-[var(--platform-ink-muted)]">
                            {t('fields.author.help')}
                        </p>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="proposal-author-first-name"
                                className="text-sm font-bold"
                            >
                                {t('fields.author.firstName')}
                            </label>
                            <Input
                                id="proposal-author-first-name"
                                value={fields.authorFirstName}
                                maxLength={255}
                                disabled={locked}
                                autoComplete="given-name"
                                onChange={(event) =>
                                    setField('authorFirstName', event.target.value)
                                }
                                className="mt-2 min-h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] focus-visible:scale-100"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="proposal-author-last-name"
                                className="text-sm font-bold"
                            >
                                {t('fields.author.lastName')}
                            </label>
                            <Input
                                id="proposal-author-last-name"
                                value={fields.authorLastName}
                                maxLength={255}
                                disabled={locked}
                                autoComplete="family-name"
                                onChange={(event) => setField('authorLastName', event.target.value)}
                                className="mt-2 min-h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] focus-visible:scale-100"
                            />
                        </div>
                    </div>
                </div>
                <div>
                    <label htmlFor="proposal-difficulty" className="text-sm font-bold">
                        {t('fields.difficulty.label')}
                    </label>
                    <select
                        id="proposal-difficulty"
                        value={fields.difficulty}
                        disabled={locked}
                        onChange={(event) =>
                            setField(
                                'difficulty',
                                event.target.value as ProblemProposalDraftInput['difficulty'],
                            )
                        }
                        className="mt-2 min-h-12 w-full border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 text-sm"
                    >
                        {(['EASY', 'MEDIUM', 'HARD'] as const).map((difficulty) => (
                            <option key={difficulty} value={difficulty}>
                                {t(`difficulty.${difficulty}`)}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="proposal-format" className="text-sm font-bold">
                        {t('fields.evaluationType.label')}
                    </label>
                    <select
                        id="proposal-format"
                        value={fields.evaluationType}
                        disabled={locked}
                        onChange={(event) =>
                            setField(
                                'evaluationType',
                                event.target.value as ProblemProposalDraftInput['evaluationType'],
                            )
                        }
                        className="mt-2 min-h-12 w-full border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 font-mono text-sm"
                    >
                        {PROBLEM_PROPOSAL_EVALUATION_TYPES.map((format) => (
                            <option key={format} value={format}>
                                {format}
                            </option>
                        ))}
                    </select>
                    <p className="mt-2 text-xs leading-5 text-[var(--platform-ink-muted)]">
                        {t('fields.evaluationType.help')}
                    </p>
                </div>
                {categories.length > 0 ? (
                    <fieldset className="sm:col-span-2">
                        <legend className="text-sm font-bold">
                            {t('fields.categories.label')}
                        </legend>
                        <p className="mt-1 text-xs leading-5 text-[var(--platform-ink-muted)]">
                            {t('fields.categories.help')}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {categories.map((category) => {
                                const selected = fields.categoryIds.includes(category.id);
                                return (
                                    <label
                                        key={category.id}
                                        className={cn(
                                            'inline-flex min-h-11 cursor-pointer items-center gap-2 border px-3 text-sm font-bold transition-colors',
                                            selected
                                                ? 'border-[var(--platform-violet)] bg-[var(--platform-citron)] text-[var(--platform-on-accent)]'
                                                : 'border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink-muted-strong)] hover:border-[var(--platform-violet)]',
                                            locked && 'cursor-not-allowed opacity-55',
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            disabled={locked}
                                            onChange={() => toggleCategory(category.id)}
                                            className="h-4 w-4 accent-[var(--platform-violet)]"
                                        />
                                        {category.name}
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>
                ) : null}
            </div>
        </section>
    );

    const renderStatementStep = () => (
        <section aria-labelledby="proposal-step-title" className="space-y-7">
            <StepHeading
                number="02"
                title={t('steps.statement.title')}
                description={t('steps.statement.description')}
            />
            <div>
                <div className="flex flex-col gap-2 border-b border-[var(--platform-line)] pb-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <label id="proposal-statement-label" className="text-sm font-bold">
                            {t('fields.statement.label')}
                        </label>
                        <p className="mt-1 text-xs leading-5 text-[var(--platform-ink-muted)]">
                            {t('fields.statement.help')}
                        </p>
                    </div>
                    <span className="font-mono text-xs text-[var(--platform-ink-muted)]">
                        {t('fields.statement.characters', {
                            count: fields.longDescription.length,
                        })}
                    </span>
                </div>
                <div className="mt-4">
                    <ArticleRichTextEditor
                        markdown={fields.longDescription}
                        onChange={(markdown) => setField('longDescription', markdown)}
                        imageUploadHandler={async () => {
                            throw new Error(t('files.statementImages'));
                        }}
                        allowImages={false}
                        disabled={locked}
                        labelId="proposal-statement-label"
                        placeholder={t('fields.statement.placeholder')}
                        locale={locale}
                        onError={() => setError(t('errors.editorParse'))}
                    />
                </div>
            </div>
        </section>
    );

    const renderFilesStep = () => (
        <section aria-labelledby="proposal-step-title" className="space-y-7">
            <StepHeading
                number="03"
                title={t('steps.files.title')}
                description={t('steps.files.description')}
            />
            <div className="flex items-start gap-3 border-y border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-4 text-sm leading-6 text-[var(--platform-ink-muted)]">
                <LockKeyhole
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--platform-violet)]"
                    aria-hidden="true"
                />
                <p>{t('files.privacyNotice')}</p>
            </div>
            <div className="divide-y divide-[var(--platform-line)] border-y border-[var(--platform-line-strong)]">
                {ASSET_ROLES.map((role) => {
                    const assets = assetsForRole(proposal?.assets ?? [], role);
                    const isPrivate = PROBLEM_PROPOSAL_ASSET_VISIBILITY[role] === 'REVIEWERS_ONLY';
                    const uploadBusy = busy === `upload:${role}`;
                    const canAdd = role === 'SUPPORTING_FILE' || assets.length === 0;
                    const maxBytes =
                        evaluatorContract.limits.maxAssetBytes[role] ??
                        evaluatorContract.limits.maxEvaluatorBytes;
                    return (
                        <div key={role} className="py-5">
                            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-[var(--platform-ink)]">
                                            {t(`files.roles.${role}.title`)}
                                        </h3>
                                        <span
                                            className={cn(
                                                'inline-flex min-h-7 items-center gap-1.5 border px-2 text-[0.7rem] font-bold uppercase tracking-[0.08em]',
                                                isPrivate
                                                    ? 'border-[var(--platform-coral)] bg-[color-mix(in_oklch,var(--platform-coral)_12%,var(--platform-paper))] text-[var(--platform-ink)]'
                                                    : 'border-[var(--platform-violet)] bg-[color-mix(in_oklch,var(--platform-violet)_10%,var(--platform-paper))] text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]',
                                            )}
                                        >
                                            {isPrivate ? (
                                                <LockKeyhole
                                                    className="h-3 w-3"
                                                    aria-hidden="true"
                                                />
                                            ) : (
                                                <Unlock className="h-3 w-3" aria-hidden="true" />
                                            )}
                                            {isPrivate
                                                ? t('files.reviewersOnly')
                                                : t('files.publicAfterApproval')}
                                        </span>
                                    </div>
                                    <p className="mt-1 max-w-[65ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                                        {t(`files.roles.${role}.description`)}
                                    </p>
                                    <p className="mt-1 font-mono text-xs text-[var(--platform-ink-muted)]">
                                        {t('files.maxSize', {
                                            size: formatBytes(maxBytes),
                                        })}
                                    </p>
                                </div>
                                {canAdd && !locked ? (
                                    <label
                                        className={cn(
                                            'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 text-sm font-bold text-[var(--platform-ink)] hover:border-[var(--platform-violet)]',
                                            uploadBusy && 'pointer-events-none opacity-55',
                                        )}
                                    >
                                        {uploadBusy ? (
                                            <Loader2
                                                className="h-4 w-4 animate-spin"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <Upload className="h-4 w-4" aria-hidden="true" />
                                        )}
                                        {uploadBusy
                                            ? uploadProgress?.role === role &&
                                              uploadProgress.percent < 100
                                                ? t('files.hashing', {
                                                      percent: uploadProgress.percent,
                                                  })
                                                : t('files.uploading')
                                            : t('files.choose')}
                                        <input
                                            type="file"
                                            className="sr-only"
                                            accept={problemProposalAssetAccept(
                                                role,
                                                fields.evaluationType,
                                            )}
                                            disabled={Boolean(busy)}
                                            onChange={(event) =>
                                                void handleAssetUpload(role, event)
                                            }
                                        />
                                    </label>
                                ) : null}
                            </div>
                            {assets.length > 0 ? (
                                <ul className="mt-4 space-y-2">
                                    {assets.map((asset) => (
                                        <li
                                            key={asset.id}
                                            className="flex flex-col gap-3 border border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-3 sm:flex-row sm:items-center"
                                        >
                                            <FileCheck2
                                                className="h-5 w-5 shrink-0 text-[var(--platform-violet)]"
                                                aria-hidden="true"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-[var(--platform-ink)]">
                                                    {asset.fileName}
                                                </p>
                                                <p className="mt-0.5 font-mono text-xs text-[var(--platform-ink-muted)]">
                                                    {formatBytes(asset.sizeBytes)} ·{' '}
                                                    {asset.contentType}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {asset.downloadUrl ? (
                                                    <a
                                                        href={asset.downloadUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex min-h-11 min-w-11 items-center justify-center text-[var(--platform-violet)]"
                                                        aria-label={t('files.open', {
                                                            name: asset.fileName,
                                                        })}
                                                    >
                                                        <Download
                                                            className="h-4 w-4"
                                                            aria-hidden="true"
                                                        />
                                                    </a>
                                                ) : null}
                                                {!locked ? (
                                                    <button
                                                        type="button"
                                                        disabled={Boolean(busy)}
                                                        onClick={() =>
                                                            void handleAssetDelete(asset)
                                                        }
                                                        className="inline-flex min-h-11 min-w-11 items-center justify-center text-red-700 disabled:opacity-45 dark:text-red-300"
                                                        aria-label={t('files.delete', {
                                                            name: asset.fileName,
                                                        })}
                                                    >
                                                        {busy === `delete:${asset.id}` ? (
                                                            <Loader2
                                                                className="h-4 w-4 animate-spin"
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <Trash2
                                                                className="h-4 w-4"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-3 text-xs font-semibold text-[var(--platform-ink-muted)]">
                                    {t('files.missing')}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );

    const validationPrerequisites = [
        'PUBLIC_DATASET',
        'GROUND_TRUTH',
        'EVALUATOR_SCRIPT',
        'SAMPLE_SUBMISSION',
    ].every((role) =>
        (proposal?.assets ?? []).some(
            (asset) =>
                asset.role === role &&
                (asset.status === 'CONFIRMED' || asset.status === 'PROMOTED'),
        ),
    );

    const renderEvaluatorStep = () => (
        <section aria-labelledby="proposal-step-title" className="space-y-7">
            <StepHeading
                number="04"
                title={t('steps.evaluator.title')}
                description={t('steps.evaluator.description')}
            />
            <div className="grid gap-5 border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div>
                    <p className="flex items-center gap-2 font-mono text-sm font-bold text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]">
                        <Code2 className="h-4 w-4" aria-hidden="true" />
                        {evaluatorContract.functionSignature}
                    </p>
                    <p className="mt-2 max-w-[64ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('evaluator.contractSummary', {
                            seconds: evaluatorContract.limits.timeoutSeconds,
                        })}
                    </p>
                </div>
                <Link
                    href="/problem-proposals/evaluator-guide"
                    target="_blank"
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 text-sm font-bold text-[var(--platform-ink)] hover:border-[var(--platform-violet)]"
                >
                    {t('evaluator.openGuide')}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div>
                    <h3 className="text-lg font-bold text-[var(--platform-ink)]">
                        {t('evaluator.validationTitle')}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('evaluator.validationDescription')}
                    </p>
                    <div className="mt-5 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)]">
                        <div className="flex flex-col gap-3 border-b border-[var(--platform-line)] p-4 sm:flex-row sm:items-center sm:justify-between">
                            <ValidationStatus run={validation} t={t} />
                            {!locked ? (
                                <button
                                    type="button"
                                    disabled={
                                        Boolean(busy) ||
                                        validationIsRunning ||
                                        !validationPrerequisites
                                    }
                                    onClick={() => void handleValidation()}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-4 text-sm font-bold text-white disabled:opacity-45 dark:text-[var(--platform-on-accent)]"
                                >
                                    {busy === 'validation' || validationIsRunning ? (
                                        <Loader2
                                            className="h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Beaker className="h-4 w-4" aria-hidden="true" />
                                    )}
                                    {validationIsRunning
                                        ? t('evaluator.running')
                                        : validation?.status === 'STALE'
                                          ? t('evaluator.retry')
                                          : t('evaluator.run')}
                                </button>
                            ) : null}
                        </div>
                        {validation?.checks.length ? (
                            <ul className="divide-y divide-[var(--platform-line)]">
                                {validation.checks.map((check) => (
                                    <li
                                        key={`${check.code}:${check.message}`}
                                        className="flex items-start gap-3 p-4 text-sm"
                                    >
                                        {check.passed ? (
                                            <CheckCircle2
                                                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--platform-violet)]"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <AlertCircle
                                                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--platform-coral)]"
                                                aria-hidden="true"
                                            />
                                        )}
                                        <div>
                                            <p className="font-mono text-xs font-bold text-[var(--platform-ink)]">
                                                {check.code}
                                            </p>
                                            <p className="mt-1 leading-6 text-[var(--platform-ink-muted)]">
                                                {check.message}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                        {validation?.summary || validation?.stderr ? (
                            <div className="border-t border-[var(--platform-line)] p-4">
                                {validation.summary ? (
                                    <p className="text-sm leading-6 text-[var(--platform-ink-muted)]">
                                        {validation.summary}
                                    </p>
                                ) : null}
                                {validation.stderr ? (
                                    <pre className="mt-3 max-h-64 overflow-auto border border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-3 text-xs leading-5 text-red-800 dark:text-red-200">
                                        <code>{validation.stderr}</code>
                                    </pre>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
                <aside className="border-y border-[var(--platform-line-strong)] py-5 lg:border lg:p-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.11em] text-[var(--platform-ink)]">
                        {t('evaluator.requiredFiles')}
                    </h3>
                    <ul className="mt-4 space-y-3">
                        {(
                            [
                                'PUBLIC_DATASET',
                                'GROUND_TRUTH',
                                'EVALUATOR_SCRIPT',
                                'SAMPLE_SUBMISSION',
                            ] as ProblemProposalAssetRole[]
                        ).map((role) => {
                            const present = (proposal?.assets ?? []).some(
                                (asset) =>
                                    asset.role === role &&
                                    (asset.status === 'CONFIRMED' || asset.status === 'PROMOTED'),
                            );
                            return (
                                <li
                                    key={role}
                                    className="flex items-center gap-2 text-sm text-[var(--platform-ink-muted)]"
                                >
                                    {present ? (
                                        <Check
                                            className="h-4 w-4 text-[var(--platform-violet)]"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Circle className="h-4 w-4" aria-hidden="true" />
                                    )}
                                    {t(`files.roles.${role}.title`)}
                                </li>
                            );
                        })}
                    </ul>
                    {!validationPrerequisites ? (
                        <button
                            type="button"
                            onClick={() => setActiveStep('files')}
                            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-3 text-sm font-bold"
                        >
                            {t('evaluator.addFiles')}
                        </button>
                    ) : null}
                </aside>
            </div>
        </section>
    );

    const renderScoringStep = () => (
        <section aria-labelledby="proposal-step-title" className="space-y-7">
            <StepHeading
                number="05"
                title={t('steps.scoring.title')}
                description={t('steps.scoring.description')}
            />
            <div>
                <label htmlFor="proposal-metric-preference" className="text-sm font-bold">
                    {t('fields.metricPreference.label')}
                </label>
                <select
                    id="proposal-metric-preference"
                    value={fields.metricPreference}
                    disabled={locked}
                    onChange={(event) =>
                        setField(
                            'metricPreference',
                            event.target.value as ProblemProposalDraftInput['metricPreference'],
                        )
                    }
                    className="mt-2 min-h-12 w-full border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 text-sm sm:max-w-xl"
                >
                    {(
                        [
                            'BIGGER_IS_BETTER',
                            'SMALLER_IS_BETTER',
                            'FASTER_SUBMISSION_IS_BETTER',
                        ] as const
                    ).map((preference) => (
                        <option key={preference} value={preference}>
                            {t(`metricPreference.${preference}`)}
                        </option>
                    ))}
                </select>
                <p className="mt-2 max-w-[65ch] text-xs leading-5 text-[var(--platform-ink-muted)]">
                    {t('fields.metricPreference.help')}
                </p>
            </div>
            <div>
                <div className="flex flex-col gap-3 border-b border-[var(--platform-line)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-[var(--platform-ink)]">
                            {t('scoring.subtasksTitle')}
                        </h3>
                        <p className="mt-1 text-sm text-[var(--platform-ink-muted)]">
                            {t('scoring.subtasksDescription')}
                        </p>
                    </div>
                    {!locked ? (
                        <button
                            type="button"
                            onClick={addSubtask}
                            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold"
                        >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            {t('scoring.addSubtask')}
                        </button>
                    ) : null}
                </div>
                <ol className="divide-y divide-[var(--platform-line)] border-b border-[var(--platform-line-strong)]">
                    {fields.subtasks.map((subtask, index) => (
                        <li
                            key={index}
                            className="grid gap-4 py-5 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
                        >
                            <span className="font-mono text-sm font-bold text-[var(--platform-violet)]">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <div>
                                <label
                                    htmlFor={`subtask-name-${index}`}
                                    className="text-xs font-bold text-[var(--platform-ink)]"
                                >
                                    {t('scoring.name')}
                                </label>
                                <Input
                                    id={`subtask-name-${index}`}
                                    value={subtask.subtaskName}
                                    disabled={locked}
                                    onChange={(event) =>
                                        updateSubtask(index, 'subtaskName', event.target.value)
                                    }
                                    className="mt-2 min-h-11 rounded-none border-[var(--platform-line-strong)] focus-visible:scale-100"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor={`subtask-metric-${index}`}
                                    className="text-xs font-bold text-[var(--platform-ink)]"
                                >
                                    {t('scoring.metric')}
                                </label>
                                <Input
                                    id={`subtask-metric-${index}`}
                                    value={subtask.metricName}
                                    disabled={locked}
                                    onChange={(event) =>
                                        updateSubtask(index, 'metricName', event.target.value)
                                    }
                                    placeholder={t('scoring.metricPlaceholder')}
                                    className="mt-2 min-h-11 rounded-none border-[var(--platform-line-strong)] focus-visible:scale-100"
                                />
                            </div>
                            {!locked && fields.subtasks.length > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => removeSubtask(index)}
                                    className="inline-flex min-h-11 min-w-11 items-center justify-center text-red-700 dark:text-red-300"
                                    aria-label={t('scoring.removeSubtask', {
                                        number: index + 1,
                                    })}
                                >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                            ) : null}
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );

    const checklist = [
        ['idea', readiness.idea],
        ['statement', readiness.statement],
        ['files', readiness.files],
        ['evaluator', readiness.evaluator],
        ['scoring', readiness.scoring],
    ] as const;

    const renderReviewStep = () => (
        <section aria-labelledby="proposal-step-title" className="space-y-7">
            <StepHeading
                number="06"
                title={t('steps.review.title')}
                description={t('steps.review.description')}
            />
            {proposal?.latestReview?.reviewerMessage ? (
                <div className="border-y border-[var(--platform-coral)] bg-[color-mix(in_oklch,var(--platform-coral)_10%,var(--platform-paper))] p-5">
                    <p className="flex items-center gap-2 text-sm font-bold text-[var(--platform-ink)]">
                        <Info className="h-4 w-4" aria-hidden="true" />
                        {t('review.feedbackTitle')}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--platform-ink-muted-strong)]">
                        {proposal.latestReview.reviewerMessage}
                    </p>
                </div>
            ) : null}
            {proposal?.status === 'CHANGES_REQUESTED' && proposal.permissions.canCancelReview ? (
                <div className="grid gap-4 border-y border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div>
                        <p className="text-sm font-bold text-[var(--platform-ink)]">
                            {t('review.cancelChangesTitle')}
                        </p>
                        <p className="mt-1 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {t('review.cancelChangesDescription')}
                        </p>
                    </div>
                    <button
                        type="button"
                        disabled={Boolean(busy)}
                        onClick={() => void handleReviewAction('cancel')}
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] disabled:opacity-45"
                    >
                        {busy === 'action' ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : null}
                        {t('review.cancelChangesAction')}
                    </button>
                </div>
            ) : null}
            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div>
                    <h3 className="text-lg font-bold text-[var(--platform-ink)]">
                        {t('review.checklistTitle')}
                    </h3>
                    <ol className="mt-4 divide-y divide-[var(--platform-line)] border-y border-[var(--platform-line-strong)]">
                        {checklist.map(([key, complete], index) => (
                            <li
                                key={key}
                                className="grid gap-3 py-4 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center"
                            >
                                <span className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div>
                                    <p className="font-bold text-[var(--platform-ink)]">
                                        {t(`review.checks.${key}.title`)}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                        {t(`review.checks.${key}.description`)}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        'inline-flex min-h-8 w-fit items-center gap-2 border px-2.5 text-xs font-bold',
                                        complete
                                            ? 'border-[var(--platform-violet)] text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]'
                                            : 'border-[var(--platform-line-strong)] text-[var(--platform-ink-muted)]',
                                    )}
                                >
                                    {complete ? (
                                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                    ) : (
                                        <Circle className="h-3.5 w-3.5" aria-hidden="true" />
                                    )}
                                    {complete ? t('review.complete') : t('review.incomplete')}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
                <aside className="border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] py-5 lg:border lg:p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.11em] text-[var(--platform-violet)]">
                        {t('review.status')}
                    </p>
                    <p className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[var(--platform-ink)]">
                        {readiness.completedCount}/{readiness.totalCount}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {readiness.ready ? t('review.ready') : t('review.notReady')}
                    </p>
                    <div
                        className="mt-4 h-2 bg-[var(--platform-line)]"
                        role="progressbar"
                        aria-label={t('readiness.label')}
                        aria-valuemin={0}
                        aria-valuemax={readiness.totalCount}
                        aria-valuenow={readiness.completedCount}
                    >
                        <span
                            className="block h-full bg-[var(--platform-violet)]"
                            style={{
                                width: `${(readiness.completedCount / readiness.totalCount) * 100}%`,
                            }}
                        />
                    </div>
                </aside>
            </div>
            {!proposal || proposal.status === 'DRAFT' ? (
                <div className="border-t border-[var(--platform-line-strong)] pt-6">
                    <label htmlFor="proposal-reviewer-note" className="text-sm font-bold">
                        {t('review.noteLabel')}
                    </label>
                    <Textarea
                        id="proposal-reviewer-note"
                        value={reviewerNote}
                        maxLength={1000}
                        onChange={(event) => setReviewerNote(event.target.value)}
                        placeholder={t('review.notePlaceholder')}
                        className="mt-2 min-h-32 resize-y rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] focus-visible:scale-100"
                    />
                    <p className="mt-2 text-xs leading-5 text-[var(--platform-ink-muted)]">
                        {t('review.noteHelp')}
                    </p>
                </div>
            ) : null}
            {proposal?.permissions.canDeleteDraft ? (
                <div className="flex flex-col gap-4 border-t border-red-300 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-red-900">
                    <div>
                        <p className="text-sm font-bold text-[var(--platform-ink)]">
                            {t('review.deleteDraftTitle')}
                        </p>
                        <p className="mt-1 max-w-[64ch] text-xs leading-5 text-[var(--platform-ink-muted)]">
                            {t('review.deleteDraftDescription')}
                        </p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <button
                                type="button"
                                disabled={Boolean(busy)}
                                className="inline-flex min-h-11 items-center justify-center gap-2 border border-red-400 px-4 text-sm font-bold text-red-800 disabled:opacity-45 dark:border-red-800 dark:text-red-200"
                            >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                                {t('review.deleteDraftAction')}
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)]">
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {t('review.deleteConfirmTitle')}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="leading-6 text-[var(--platform-ink-muted)]">
                                    {t('review.deleteConfirmDescription')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-none">
                                    {t('review.deleteConfirmCancel')}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    disabled={busy === 'delete-proposal'}
                                    onClick={() => void handleDeleteProposal()}
                                    className="rounded-none bg-red-700 text-white hover:bg-red-800"
                                >
                                    {busy === 'delete-proposal' ? (
                                        <Loader2
                                            className="me-2 h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                    {t('review.deleteConfirmAction')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ) : null}
            {proposal?.status === 'APPROVED' ? (
                <ApprovedProblemProposalNotice
                    title={
                        editorContext.target.scope === 'CATALOG'
                            ? undefined
                            : hostingT('approvedTitle')
                    }
                    description={
                        editorContext.target.scope === 'CATALOG'
                            ? undefined
                            : hostingT('approvedDescription', {
                                  competition: editorContext.targetName,
                              })
                    }
                />
            ) : null}
        </section>
    );

    const stepContent: Record<StepId, () => React.ReactNode> = {
        idea: renderIdeaStep,
        statement: renderStatementStep,
        files: renderFilesStep,
        evaluator: renderEvaluatorStep,
        scoring: renderScoringStep,
        review: renderReviewStep,
    };

    return (
        <div className="platform-page-shell">
            <div className="platform-page-inner space-y-7">
                <header className="border-b border-[var(--platform-line-strong)] pb-7">
                    <Link
                        href={editorContext.backHref}
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 dark:text-[var(--platform-violet)]"
                    >
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                        {editorContext.target.scope === 'CATALOG'
                            ? t('editor.back')
                            : hostingT('back', { competition: editorContext.targetName })}
                    </Link>
                    <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--platform-violet)]">
                                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                                {proposal ? t('editor.editEyebrow') : t('editor.newEyebrow')}
                            </p>
                            <h1 className="mt-3 text-balance text-3xl font-bold tracking-[-0.045em] text-[var(--platform-ink)] sm:text-4xl">
                                {fields.title || t('untitled')}
                            </h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--platform-ink-muted)]">
                            <span className="inline-flex min-h-8 items-center gap-2 border border-[var(--platform-line-strong)] px-2.5">
                                {busy === 'save' ? (
                                    <Loader2
                                        className="h-3.5 w-3.5 animate-spin text-[var(--platform-violet)]"
                                        aria-hidden="true"
                                    />
                                ) : dirty ? (
                                    <Clock3
                                        className="h-3.5 w-3.5 text-[var(--platform-coral)]"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <Check
                                        className="h-3.5 w-3.5 text-[var(--platform-violet)]"
                                        aria-hidden="true"
                                    />
                                )}
                                {busy === 'save'
                                    ? t('editor.saving')
                                    : dirty
                                      ? proposal
                                          ? t('editor.autosavePending')
                                          : t('editor.savedLocally')
                                      : t('editor.saved')}
                            </span>
                            {proposal ? (
                                <span className="inline-flex min-h-8 items-center border border-[var(--platform-line-strong)] px-2.5">
                                    {t(`status.${proposal.status}`)}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </header>

                {editorContext.target.scope !== 'CATALOG' ? (
                    <div className="grid gap-3 border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                        <span className="inline-flex min-h-8 w-fit items-center border border-[var(--platform-violet)] px-2.5 font-mono text-xs font-bold text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]">
                            {hostingT('scopeLabel')}
                        </span>
                        <p className="text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {hostingT('scopeDescription', {
                                competition: editorContext.targetName,
                            })}
                        </p>
                    </div>
                ) : null}

                {error ? (
                    <div
                        className="flex flex-col gap-4 border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between"
                        role="alert"
                    >
                        <p className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            {error}
                        </p>
                        {hasConflict ? (
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-red-300 px-3 font-bold dark:border-red-700"
                            >
                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                {t('errors.reload')}
                            </button>
                        ) : null}
                    </div>
                ) : null}

                {proposal?.status === 'PENDING' ? (
                    <div className="grid gap-4 border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div>
                            <p className="font-bold text-[var(--platform-ink)]">
                                {t('editor.reviewLockedTitle')}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                {t('editor.reviewLockedDescription')}
                            </p>
                        </div>
                        {proposal.permissions.canCancelReview ? (
                            <button
                                type="button"
                                disabled={Boolean(busy)}
                                onClick={() => void handleReviewAction('cancel')}
                                className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold"
                            >
                                {busy === 'action' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : null}
                                {t('editor.cancelReview')}
                            </button>
                        ) : null}
                    </div>
                ) : null}

                <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
                    <nav
                        aria-label={t('steps.label')}
                        className="mb-7 overflow-x-auto border-y border-[var(--platform-line-strong)] py-2 lg:sticky lg:top-28 lg:mb-0 lg:self-start lg:overflow-visible lg:border lg:p-2"
                    >
                        <ol className="flex min-w-max gap-1 lg:min-w-0 lg:flex-col">
                            {STEPS.map((step, index) => {
                                const Icon = step.icon;
                                const active = step.id === activeStep;
                                const complete = step.readinessKey
                                    ? readiness[step.readinessKey]
                                    : readiness.ready;
                                return (
                                    <li key={step.id} className="lg:w-full">
                                        <button
                                            type="button"
                                            onClick={() => void goToStep(step.id)}
                                            aria-current={active ? 'step' : undefined}
                                            className={cn(
                                                'group flex min-h-12 w-full items-center gap-3 border px-3 text-start text-sm transition-colors',
                                                active
                                                    ? 'border-[var(--platform-violet)] bg-[var(--platform-citron)] text-[var(--platform-on-accent)]'
                                                    : 'border-transparent text-[var(--platform-ink-muted)] hover:border-[var(--platform-line)] hover:bg-[var(--platform-paper-strong)]',
                                            )}
                                        >
                                            <span className="font-mono text-[0.7rem] font-bold">
                                                {String(index + 1).padStart(2, '0')}
                                            </span>
                                            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                                            <span className="font-bold">
                                                {t(`steps.${step.id}.short`)}
                                            </span>
                                            {complete ? (
                                                <Check
                                                    className="ms-auto h-4 w-4"
                                                    aria-hidden="true"
                                                />
                                            ) : (
                                                <ChevronRight
                                                    className="ms-auto hidden h-4 w-4 opacity-45 lg:block rtl:rotate-180"
                                                    aria-hidden="true"
                                                />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>

                    <main className="min-w-0 pb-28 lg:pb-0">{stepContent[activeStep]()}</main>
                </div>

                <div className="sticky bottom-0 z-20 -mx-4 border-t border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-3 shadow-[0_-8px_24px_color-mix(in_oklch,var(--platform-ink)_10%,transparent)] sm:mx-0 sm:p-4">
                    <div className="mx-auto flex max-w-[80rem] flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {currentStepIndex > 0 ? (
                                <button
                                    type="button"
                                    disabled={Boolean(busy)}
                                    onClick={() => void moveStep(-1)}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold"
                                >
                                    <ArrowLeft
                                        className="h-4 w-4 rtl:rotate-180"
                                        aria-hidden="true"
                                    />
                                    <span className="hidden sm:inline">{t('editor.previous')}</span>
                                </button>
                            ) : null}
                            {!locked ? (
                                <button
                                    type="button"
                                    disabled={Boolean(busy) || !dirty}
                                    onClick={() => void persistDraft()}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold disabled:opacity-45"
                                >
                                    {busy === 'save' ? (
                                        <Loader2
                                            className="h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <Save className="h-4 w-4" aria-hidden="true" />
                                    )}
                                    {t('editor.save')}
                                </button>
                            ) : null}
                        </div>

                        {activeStep !== 'review' ? (
                            <button
                                type="button"
                                disabled={Boolean(busy)}
                                onClick={() => void moveStep(1)}
                                className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-5 text-sm font-bold text-white disabled:opacity-45 dark:text-[var(--platform-on-accent)]"
                            >
                                {t('editor.next')}
                                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                            </button>
                        ) : proposal?.status === 'PENDING' ? (
                            <span className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink-muted)]">
                                <Clock3 className="h-4 w-4" aria-hidden="true" />
                                {t('editor.inReview')}
                            </span>
                        ) : proposal?.status === 'APPROVED' ? (
                            <span className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-violet)] px-4 text-sm font-bold text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]">
                                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                {t('editor.approved')}
                            </span>
                        ) : (
                            <button
                                type="button"
                                disabled={Boolean(busy) || !readiness.ready}
                                onClick={() =>
                                    void handleReviewAction(
                                        proposal?.permissions.canResubmit ? 'resubmit' : 'submit',
                                    )
                                }
                                className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45 dark:text-[var(--platform-on-accent)]"
                            >
                                {busy === 'action' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Send className="h-4 w-4" aria-hidden="true" />
                                )}
                                {proposal?.permissions.canResubmit
                                    ? t('editor.resubmit')
                                    : editorContext.target.scope === 'CATALOG'
                                      ? t('editor.submit')
                                      : hostingT('submit')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepHeading({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description: string;
}) {
    return (
        <div className="border-b border-[var(--platform-line)] pb-5">
            <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">{number}</p>
            <h2
                id="proposal-step-title"
                className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--platform-ink)]"
            >
                {title}
            </h2>
            <p className="mt-2 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                {description}
            </p>
        </div>
    );
}

function ValidationStatus({
    run,
    t,
}: {
    run: ProblemProposalValidationRun | null;
    t: ReturnType<typeof useTranslations>;
}) {
    if (!run) {
        return (
            <p className="inline-flex items-center gap-2 text-sm font-bold text-[var(--platform-ink-muted)]">
                <Circle className="h-4 w-4" aria-hidden="true" />
                {t('validationStatus.NOT_RUN')}
            </p>
        );
    }
    const running = run.status === 'QUEUED' || run.status === 'RUNNING';
    const passed = run.status === 'PASSED';
    return (
        <div role="status" aria-live="polite">
            <p
                className={cn(
                    'inline-flex items-center gap-2 text-sm font-bold',
                    passed
                        ? 'text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]'
                        : run.status === 'FAILED'
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-[var(--platform-ink-muted)]',
                )}
            >
                {running ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : passed ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                )}
                {t(`validationStatus.${run.status}`)}
            </p>
            {run.status === 'STALE' ? (
                <p className="mt-1 max-w-[52ch] text-xs leading-5 text-[var(--platform-ink-muted)]">
                    {t('evaluator.staleGuidance')}
                </p>
            ) : null}
        </div>
    );
}
