'use client';

import { useMemo, useState } from 'react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Check,
    Clock3,
    FilePlus2,
    Loader2,
    Save,
    Send,
    ShieldCheck,
    Trash2,
    Trophy,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

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
    CompetitionHostingApiError,
    buildCompetitionHostingReadiness,
    cancelCompetitionHostingRequestReview,
    createCompetitionHostingRequest,
    deleteCompetitionHostingRequest,
    resubmitCompetitionHostingRequest,
    saveCompetitionHostingRequest,
    submitCompetitionHostingRequest,
    type CompetitionHostingRequest,
    type CompetitionHostingRequestInput,
} from '@/lib/competition-hosting';
import type { ProblemProposal } from '@/lib/problem-proposals';
import { cn } from '@/lib/utils';

type Busy = 'save' | 'submit' | 'cancel' | 'delete' | 'save-and-problem' | null;

function blankRequest(): CompetitionHostingRequestInput {
    const start = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    start.setMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    return {
        name: '',
        shortDescription: '',
        description: '',
        rules: '',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        requestMode: 'COMPETITION_ONLY',
        competitionType: 'CLASSIC',
        access: 'PRIVATE',
        allowPublicQuestions: false,
        commentsEnabled: true,
        selectionLimit: 1,
    };
}

function fieldsFromRequest(
    request: CompetitionHostingRequest | null,
): CompetitionHostingRequestInput {
    if (!request) return blankRequest();
    return {
        name: request.name,
        shortDescription: request.shortDescription,
        description: request.description,
        rules: request.rules,
        startTime: request.startTime,
        endTime: request.endTime,
        requestMode: request.requestMode,
        competitionType: request.competitionType,
        access: request.access,
        allowPublicQuestions: request.allowPublicQuestions,
        commentsEnabled: request.commentsEnabled,
        selectionLimit: request.selectionLimit,
        version: request.version,
    };
}

function dateInputValue(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function dateFromInput(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function submittedProblems(problems: ProblemProposal[]): number {
    return problems.filter((problem) =>
        ['PENDING', 'CHANGES_REQUESTED', 'APPROVED'].includes(problem.status),
    ).length;
}

export function HostingRequestEditor({
    initialRequest,
    problems,
    problemPage,
}: {
    initialRequest: CompetitionHostingRequest | null;
    problems: ProblemProposal[];
    problemPage: number;
}) {
    const t = useTranslations('competitionHosting');
    const router = useRouter();
    const [request, setRequest] = useState(initialRequest);
    const [fields, setFields] = useState<CompetitionHostingRequestInput>(() =>
        fieldsFromRequest(initialRequest),
    );
    const [busy, setBusy] = useState<Busy>(null);
    const [error, setError] = useState<string | null>(null);
    const readiness = useMemo(() => buildCompetitionHostingReadiness(fields), [fields]);
    const hasSubmittedProblem = submittedProblems(problems) > 0;
    const problemPageSize = 20;
    const totalProblemPages = Math.max(1, Math.ceil(problems.length / problemPageSize));
    const visibleProblems = problems.slice(
        (problemPage - 1) * problemPageSize,
        problemPage * problemPageSize,
    );
    const readyToSubmit =
        readiness.ready && (fields.requestMode === 'COMPETITION_ONLY' || hasSubmittedProblem);
    const locked = Boolean(request && !request.permissions.canEdit);

    const update = <K extends keyof CompetitionHostingRequestInput>(
        key: K,
        value: CompetitionHostingRequestInput[K],
    ) => {
        setFields((current) => ({ ...current, [key]: value }));
        setError(null);
    };

    const handleError = (caught: unknown, fallback: string) => {
        if (caught instanceof CompetitionHostingApiError && caught.status === 409) {
            setError(t('errors.conflict'));
            return;
        }
        setError(caught instanceof Error ? caught.message : fallback);
    };

    const save = async (mode: Busy = 'save') => {
        if (locked) {
            if (mode === 'save-and-problem' && request?.permissions.canAddProblems) {
                router.push(`/my-competitions/requests/${request.id}/problems/new`);
            }
            return request;
        }
        if (fields.name.trim().length < 3) {
            setError(t('validation.name'));
            return null;
        }
        setBusy(mode);
        setError(null);
        try {
            const saved = request
                ? await saveCompetitionHostingRequest(request.id, {
                      ...fields,
                      version: request.version,
                  })
                : await createCompetitionHostingRequest(fields);
            setRequest(saved);
            setFields(fieldsFromRequest(saved));
            if (!request) {
                if (mode === 'save-and-problem') {
                    router.replace(`/my-competitions/requests/${saved.id}/problems/new`);
                } else {
                    router.replace(`/my-competitions/requests/${saved.id}`);
                }
            } else if (mode === 'save-and-problem') {
                router.push(`/my-competitions/requests/${saved.id}/problems/new`);
            }
            toast.success(t('toasts.saved'));
            return saved;
        } catch (caught) {
            handleError(caught, t('errors.save'));
            return null;
        } finally {
            setBusy(null);
        }
    };

    const reviewAction = async (action: 'submit' | 'resubmit' | 'cancel') => {
        let target = request;
        if (action !== 'cancel') {
            target = await save('save');
            if (!target) return;
            if (!readyToSubmit) {
                setError(
                    fields.requestMode === 'WITH_PROBLEMS' && !hasSubmittedProblem
                        ? t('validation.problemRequired')
                        : t('validation.notReady'),
                );
                return;
            }
        }
        if (!target) return;
        setBusy(action === 'cancel' ? 'cancel' : 'submit');
        setError(null);
        try {
            const updated =
                action === 'cancel'
                    ? await cancelCompetitionHostingRequestReview(target)
                    : action === 'resubmit'
                      ? await resubmitCompetitionHostingRequest(target)
                      : await submitCompetitionHostingRequest(target);
            setRequest(updated);
            setFields(fieldsFromRequest(updated));
            toast.success(action === 'cancel' ? t('toasts.cancelled') : t('toasts.submitted'));
            router.refresh();
        } catch (caught) {
            handleError(caught, t('errors.action'));
        } finally {
            setBusy(null);
        }
    };

    const removeDraft = async () => {
        if (!request?.permissions.canDeleteDraft) return;
        setBusy('delete');
        try {
            await deleteCompetitionHostingRequest(request);
            toast.success(t('toasts.deleted'));
            router.replace('/my-competitions');
            router.refresh();
        } catch (caught) {
            handleError(caught, t('errors.delete'));
            setBusy(null);
        }
    };

    return (
        <div className="platform-page-shell">
            <div className="platform-page-inner space-y-8">
                <header className="border-b border-[var(--platform-line-strong)] pb-8">
                    <Link
                        href="/my-competitions"
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 dark:text-[var(--platform-violet)]"
                    >
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                        {t('requestEditor.back')}
                    </Link>
                    <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--platform-violet)]">
                                <Trophy className="h-4 w-4" aria-hidden="true" />
                                {request
                                    ? t('requestEditor.editEyebrow')
                                    : t('requestEditor.newEyebrow')}
                            </p>
                            <h1 className="mt-3 max-w-[22ch] text-balance text-3xl font-bold tracking-[-0.045em] text-[var(--platform-ink)] sm:text-4xl">
                                {fields.name || t('requestEditor.untitled')}
                            </h1>
                        </div>
                        {request ? (
                            <span className="inline-flex min-h-9 w-fit items-center border border-[var(--platform-line-strong)] px-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--platform-ink)]">
                                {t(`status.${request.status}`)}
                            </span>
                        ) : null}
                    </div>
                </header>

                {error ? (
                    <p
                        role="alert"
                        className="flex items-start gap-2 border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
                    >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        {error}
                    </p>
                ) : null}

                {request?.reviewerMessage ? (
                    <section className="border-y border-[var(--platform-coral)] bg-[color-mix(in_oklch,var(--platform-coral)_10%,var(--platform-paper))] p-5">
                        <h2 className="text-sm font-bold text-[var(--platform-ink)]">
                            {t('requestEditor.feedback')}
                        </h2>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--platform-ink-muted-strong)]">
                            {request.reviewerMessage}
                        </p>
                    </section>
                ) : null}

                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <main className="min-w-0 space-y-10">
                        <section className="space-y-5" aria-labelledby="hosting-format-title">
                            <div className="border-b border-[var(--platform-line)] pb-4">
                                <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                                    01
                                </p>
                                <h2
                                    id="hosting-format-title"
                                    className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                                >
                                    {t('requestEditor.format.title')}
                                </h2>
                                <p className="mt-2 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                                    {t('requestEditor.format.description')}
                                </p>
                            </div>
                            <div className="grid border-y border-[var(--platform-line-strong)] sm:grid-cols-2">
                                {(['COMPETITION_ONLY', 'WITH_PROBLEMS'] as const).map((mode) => (
                                    <label
                                        key={mode}
                                        className={cn(
                                            'flex min-h-32 cursor-pointer gap-3 p-5 sm:border-e sm:last:border-e-0',
                                            fields.requestMode === mode
                                                ? 'bg-[var(--platform-citron)] text-[var(--platform-on-accent)]'
                                                : 'bg-[var(--platform-paper)] text-[var(--platform-ink)]',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="request-mode"
                                            value={mode}
                                            checked={fields.requestMode === mode}
                                            disabled={locked}
                                            onChange={() => update('requestMode', mode)}
                                            className="mt-1 h-5 w-5 accent-[var(--platform-violet)]"
                                        />
                                        <span>
                                            <span className="block font-bold">
                                                {t(`requestMode.${mode}.title`)}
                                            </span>
                                            <span className="mt-1 block text-sm leading-6 opacity-80">
                                                {t(`requestMode.${mode}.description`)}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-5" aria-labelledby="hosting-details-title">
                            <div className="border-b border-[var(--platform-line)] pb-4">
                                <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                                    02
                                </p>
                                <h2
                                    id="hosting-details-title"
                                    className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                                >
                                    {t('requestEditor.details.title')}
                                </h2>
                            </div>
                            <div>
                                <label htmlFor="hosting-name" className="text-sm font-bold">
                                    {t('fields.name')}
                                </label>
                                <Input
                                    id="hosting-name"
                                    value={fields.name}
                                    maxLength={255}
                                    disabled={locked}
                                    onChange={(event) => update('name', event.target.value)}
                                    className="mt-2 min-h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-base focus-visible:scale-100"
                                />
                            </div>
                            <div>
                                <label htmlFor="hosting-summary" className="text-sm font-bold">
                                    {t('fields.shortDescription')}
                                </label>
                                <Textarea
                                    id="hosting-summary"
                                    value={fields.shortDescription}
                                    maxLength={2000}
                                    disabled={locked}
                                    onChange={(event) =>
                                        update('shortDescription', event.target.value)
                                    }
                                    className="mt-2 min-h-28 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
                                />
                            </div>
                            <div>
                                <label htmlFor="hosting-description" className="text-sm font-bold">
                                    {t('fields.description')}
                                </label>
                                <Textarea
                                    id="hosting-description"
                                    value={fields.description}
                                    maxLength={100000}
                                    disabled={locked}
                                    onChange={(event) => update('description', event.target.value)}
                                    className="mt-2 min-h-52 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
                                />
                            </div>
                            <div>
                                <label htmlFor="hosting-rules" className="text-sm font-bold">
                                    {t('fields.rules')}
                                </label>
                                <Textarea
                                    id="hosting-rules"
                                    value={fields.rules}
                                    maxLength={100000}
                                    disabled={locked}
                                    onChange={(event) => update('rules', event.target.value)}
                                    className="mt-2 min-h-40 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
                                />
                            </div>
                        </section>

                        <section className="space-y-5" aria-labelledby="hosting-settings-title">
                            <div className="border-b border-[var(--platform-line)] pb-4">
                                <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                                    03
                                </p>
                                <h2
                                    id="hosting-settings-title"
                                    className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                                >
                                    {t('requestEditor.settings.title')}
                                </h2>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="hosting-start" className="text-sm font-bold">
                                        {t('fields.startTime')}
                                    </label>
                                    <Input
                                        id="hosting-start"
                                        type="datetime-local"
                                        value={dateInputValue(fields.startTime)}
                                        disabled={locked}
                                        onChange={(event) =>
                                            update('startTime', dateFromInput(event.target.value))
                                        }
                                        className="mt-2 min-h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] focus-visible:scale-100"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="hosting-end" className="text-sm font-bold">
                                        {t('fields.endTime')}
                                    </label>
                                    <Input
                                        id="hosting-end"
                                        type="datetime-local"
                                        value={dateInputValue(fields.endTime)}
                                        disabled={locked}
                                        onChange={(event) =>
                                            update('endTime', dateFromInput(event.target.value))
                                        }
                                        className="mt-2 min-h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] focus-visible:scale-100"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="hosting-type" className="text-sm font-bold">
                                        {t('fields.competitionType')}
                                    </label>
                                    <select
                                        id="hosting-type"
                                        value={fields.competitionType}
                                        disabled={locked}
                                        onChange={(event) =>
                                            update(
                                                'competitionType',
                                                event.target.value as 'CLASSIC' | 'CASUAL',
                                            )
                                        }
                                        className="mt-2 min-h-12 w-full border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 text-sm"
                                    >
                                        <option value="CLASSIC">
                                            {t('competitionType.CLASSIC')}
                                        </option>
                                        <option value="CASUAL">
                                            {t('competitionType.CASUAL')}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="hosting-access" className="text-sm font-bold">
                                        {t('fields.access')}
                                    </label>
                                    <select
                                        id="hosting-access"
                                        value={fields.access}
                                        disabled={locked}
                                        onChange={(event) =>
                                            update(
                                                'access',
                                                event.target.value as 'PRIVATE' | 'PUBLIC',
                                            )
                                        }
                                        className="mt-2 min-h-12 w-full border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 text-sm"
                                    >
                                        <option value="PRIVATE">{t('access.PRIVATE')}</option>
                                        <option value="PUBLIC">{t('access.PUBLIC')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        htmlFor="hosting-selection-limit"
                                        className="text-sm font-bold"
                                    >
                                        {t('fields.selectionLimit')}
                                    </label>
                                    <Input
                                        id="hosting-selection-limit"
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={fields.selectionLimit}
                                        disabled={locked}
                                        onChange={(event) =>
                                            update(
                                                'selectionLimit',
                                                Math.max(1, Number(event.target.value) || 1),
                                            )
                                        }
                                        className="mt-2 min-h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] focus-visible:scale-100"
                                    />
                                </div>
                            </div>
                            <div className="divide-y divide-[var(--platform-line)] border-y border-[var(--platform-line-strong)]">
                                <label className="flex min-h-16 cursor-pointer items-center gap-3 py-3">
                                    <input
                                        type="checkbox"
                                        checked={fields.commentsEnabled}
                                        disabled={locked}
                                        onChange={(event) =>
                                            update('commentsEnabled', event.target.checked)
                                        }
                                        className="h-5 w-5 accent-[var(--platform-violet)]"
                                    />
                                    <span>
                                        <span className="block text-sm font-bold">
                                            {t('fields.commentsEnabled')}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-[var(--platform-ink-muted)]">
                                            {t('fields.commentsEnabledHelp')}
                                        </span>
                                    </span>
                                </label>
                                <label className="flex min-h-16 cursor-pointer items-center gap-3 py-3">
                                    <input
                                        type="checkbox"
                                        checked={fields.allowPublicQuestions}
                                        disabled={locked}
                                        onChange={(event) =>
                                            update('allowPublicQuestions', event.target.checked)
                                        }
                                        className="h-5 w-5 accent-[var(--platform-violet)]"
                                    />
                                    <span>
                                        <span className="block text-sm font-bold">
                                            {t('fields.allowPublicQuestions')}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-[var(--platform-ink-muted)]">
                                            {t('fields.allowPublicQuestionsHelp')}
                                        </span>
                                    </span>
                                </label>
                            </div>
                        </section>

                        <section className="space-y-5" aria-labelledby="hosting-problems-title">
                            <div className="flex flex-col gap-4 border-b border-[var(--platform-line)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                                        04
                                    </p>
                                    <h2
                                        id="hosting-problems-title"
                                        className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                                    >
                                        {t('requestEditor.problems.title')}
                                    </h2>
                                    <p className="mt-2 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                                        {fields.requestMode === 'WITH_PROBLEMS'
                                            ? t('requestEditor.problems.withProblems')
                                            : t('requestEditor.problems.later')}
                                    </p>
                                </div>
                                {fields.requestMode === 'WITH_PROBLEMS' &&
                                (request?.permissions.canAddProblems ?? true) ? (
                                    <button
                                        type="button"
                                        disabled={Boolean(busy)}
                                        onClick={() => void save('save-and-problem')}
                                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)]"
                                    >
                                        {busy === 'save-and-problem' ? (
                                            <Loader2
                                                className="h-4 w-4 animate-spin"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                                        )}
                                        {t('requestEditor.problems.add')}
                                    </button>
                                ) : null}
                            </div>
                            {fields.requestMode === 'WITH_PROBLEMS' ? (
                                problems.length > 0 ? (
                                    <div>
                                        <ol className="border-y border-[var(--platform-line-strong)]">
                                            {visibleProblems.map((problem, index) => (
                                                <li
                                                    key={problem.id}
                                                    className="border-b border-[var(--platform-line)] last:border-b-0"
                                                >
                                                    <Link
                                                        href={
                                                            request
                                                                ? `/my-competitions/requests/${request.id}/problems/${problem.id}`
                                                                : '/my-competitions'
                                                        }
                                                        className="group grid min-h-24 gap-3 px-2 py-4 hover:bg-[var(--platform-paper-strong)] sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:items-center"
                                                    >
                                                        <span className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                                                            {String(
                                                                (problemPage - 1) *
                                                                    problemPageSize +
                                                                    index +
                                                                    1,
                                                            ).padStart(2, '0')}
                                                        </span>
                                                        <span>
                                                            <span className="block font-bold text-[var(--platform-ink)]">
                                                                {problem.title ||
                                                                    t(
                                                                        'requestEditor.problems.untitled',
                                                                    )}
                                                            </span>
                                                            <span className="mt-1 block text-xs text-[var(--platform-ink-muted)]">
                                                                {t(
                                                                    `problemStatus.${problem.status}`,
                                                                )}
                                                            </span>
                                                        </span>
                                                        <span className="inline-flex min-h-8 items-center border border-[var(--platform-line-strong)] px-2.5 text-xs font-bold">
                                                            {problem.evaluationType}
                                                        </span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ol>
                                        {request && totalProblemPages > 1 ? (
                                            <nav
                                                aria-label={t('pagination.label', {
                                                    section: t('requestEditor.problems.title'),
                                                })}
                                                className="flex flex-col items-center justify-between gap-4 border-t border-[var(--platform-line-strong)] pt-6 sm:flex-row"
                                            >
                                                <Link
                                                    href={`/my-competitions/requests/${request.id}?problemPage=${Math.max(1, problemPage - 1)}`}
                                                    aria-disabled={problemPage === 1}
                                                    tabIndex={problemPage === 1 ? -1 : undefined}
                                                    className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
                                                >
                                                    <ArrowLeft
                                                        className="h-4 w-4 rtl:rotate-180"
                                                        aria-hidden="true"
                                                    />
                                                    {t('pagination.previous')}
                                                </Link>
                                                <p className="font-mono text-sm font-semibold tabular-nums text-[var(--platform-ink-muted)]">
                                                    {t('pagination.page', {
                                                        page: problemPage,
                                                        pages: totalProblemPages,
                                                    })}
                                                </p>
                                                <Link
                                                    href={`/my-competitions/requests/${request.id}?problemPage=${Math.min(totalProblemPages, problemPage + 1)}`}
                                                    aria-disabled={problemPage >= totalProblemPages}
                                                    tabIndex={
                                                        problemPage >= totalProblemPages
                                                            ? -1
                                                            : undefined
                                                    }
                                                    className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
                                                >
                                                    {t('pagination.next')}
                                                    <ArrowRight
                                                        className="h-4 w-4 rtl:rotate-180"
                                                        aria-hidden="true"
                                                    />
                                                </Link>
                                            </nav>
                                        ) : null}
                                    </div>
                                ) : (
                                    <p className="border-y border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-5 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                        {t('requestEditor.problems.empty')}
                                    </p>
                                )
                            ) : null}
                        </section>
                    </main>

                    <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
                        <div className="border border-[var(--platform-line-strong)] p-5">
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink)]">
                                <ShieldCheck
                                    className="h-4 w-4 text-[var(--platform-violet)]"
                                    aria-hidden="true"
                                />
                                {t('requestEditor.readiness.title')}
                            </p>
                            <ol className="mt-4 space-y-3">
                                {(['identity', 'schedule', 'details'] as const).map((key) => (
                                    <li
                                        key={key}
                                        className="flex items-center gap-2 text-sm text-[var(--platform-ink-muted)]"
                                    >
                                        {readiness[key] ? (
                                            <Check
                                                className="h-4 w-4 text-[var(--platform-violet)]"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <Clock3 className="h-4 w-4" aria-hidden="true" />
                                        )}
                                        {t(`requestEditor.readiness.${key}`)}
                                    </li>
                                ))}
                                {fields.requestMode === 'WITH_PROBLEMS' ? (
                                    <li className="flex items-center gap-2 text-sm text-[var(--platform-ink-muted)]">
                                        {hasSubmittedProblem ? (
                                            <Check
                                                className="h-4 w-4 text-[var(--platform-violet)]"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <Clock3 className="h-4 w-4" aria-hidden="true" />
                                        )}
                                        {t('requestEditor.readiness.problem')}
                                    </li>
                                ) : null}
                            </ol>
                        </div>
                        {!locked ? (
                            <button
                                type="button"
                                disabled={Boolean(busy)}
                                onClick={() => void save()}
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold"
                            >
                                {busy === 'save' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Save className="h-4 w-4" aria-hidden="true" />
                                )}
                                {t('actions.save')}
                            </button>
                        ) : null}
                        {request?.status === 'PENDING' && request.permissions.canCancelReview ? (
                            <button
                                type="button"
                                disabled={Boolean(busy)}
                                onClick={() => void reviewAction('cancel')}
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold"
                            >
                                {busy === 'cancel' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : null}
                                {t('actions.cancelReview')}
                            </button>
                        ) : request?.status === 'APPROVED' && request.approvedCompetitionId ? (
                            <Link
                                href={`/my-competitions/${request.approvedCompetitionId}`}
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[var(--platform-violet)] px-4 text-sm font-bold text-white dark:text-[var(--platform-on-accent)]"
                            >
                                <Trophy className="h-4 w-4" aria-hidden="true" />
                                {t('actions.manageCompetition')}
                            </Link>
                        ) : request &&
                          (request.permissions.canSubmit || request.permissions.canResubmit) ? (
                            <button
                                type="button"
                                disabled={Boolean(busy) || !readyToSubmit}
                                onClick={() =>
                                    void reviewAction(
                                        request.permissions.canResubmit ? 'resubmit' : 'submit',
                                    )
                                }
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[var(--platform-violet)] px-4 text-sm font-bold text-white disabled:opacity-45 dark:text-[var(--platform-on-accent)]"
                            >
                                {busy === 'submit' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Send className="h-4 w-4" aria-hidden="true" />
                                )}
                                {request.permissions.canResubmit
                                    ? t('actions.resubmit')
                                    : t('actions.submit')}
                            </button>
                        ) : !request ? (
                            <button
                                type="button"
                                disabled={Boolean(busy) || !readyToSubmit}
                                onClick={() => void save()}
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[var(--platform-violet)] px-4 text-sm font-bold text-white disabled:opacity-45 dark:text-[var(--platform-on-accent)]"
                            >
                                <Save className="h-4 w-4" aria-hidden="true" />
                                {t('actions.createDraft')}
                            </button>
                        ) : null}
                        {request?.permissions.canDeleteDraft ? (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-bold text-red-700 dark:text-red-300"
                                    >
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                        {t('actions.delete')}
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)]">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            {t('deleteDialog.title')}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {t('deleteDialog.description')}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-none">
                                            {t('deleteDialog.cancel')}
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => void removeDraft()}
                                            className="rounded-none bg-red-700 text-white hover:bg-red-800"
                                        >
                                            {busy === 'delete' ? (
                                                <Loader2
                                                    className="me-2 h-4 w-4 animate-spin"
                                                    aria-hidden="true"
                                                />
                                            ) : null}
                                            {t('deleteDialog.confirm')}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : null}
                    </aside>
                </div>
            </div>
        </div>
    );
}
