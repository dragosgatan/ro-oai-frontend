'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Code2, FileCode2, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    getArticleSubmissionOptions,
    type ArticleSharedSubmission,
    type ArticleSubmissionOption,
} from '@/lib/articles';
import { cn } from '@/lib/utils';

type ArticleSubmissionSelectorProps = {
    problemId: number;
    selectedSubmission: ArticleSharedSubmission | null;
    selectedSubmissionId: number | null;
    consent: boolean;
    disabled?: boolean;
    onSelect: (submission: ArticleSubmissionOption | null) => void;
    onConsentChange: (consent: boolean) => void;
};

function submissionTime(value: string, locale: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Bucharest',
    }).format(date);
}

function scoreLabel(value: number | null, locale: string, fallback: string): string {
    if (value === null) return fallback;
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(value);
}

function isSelectable(option: ArticleSubmissionOption): boolean {
    return option.status === 'EVALUATED' && Boolean(option.sourceFileName);
}

export function ArticleSubmissionSelector({
    problemId,
    selectedSubmission,
    selectedSubmissionId,
    consent,
    disabled = false,
    onSelect,
    onConsentChange,
}: ArticleSubmissionSelectorProps) {
    const t = useTranslations('writing.fields.solution');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const [options, setOptions] = useState<ArticleSubmissionOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed] = useState(false);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setFailed(false);

        void getArticleSubmissionOptions(problemId)
            .then((items) => {
                if (!active) return;
                setOptions(items);
            })
            .catch(() => {
                if (!active) return;
                setOptions([]);
                setFailed(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [problemId, retry]);

    const orderedOptions = useMemo(() => {
        const unique = Array.from(
            new Map(options.map((submission) => [submission.id, submission])).values(),
        );
        if (
            selectedSubmission &&
            selectedSubmission.id === selectedSubmissionId &&
            !unique.some((submission) => submission.id === selectedSubmission.id)
        ) {
            unique.push(selectedSubmission);
        }

        return unique.sort((left, right) => {
            if (left.recommended !== right.recommended) return left.recommended ? -1 : 1;
            if (isSelectable(left) !== isSelectable(right)) return isSelectable(left) ? -1 : 1;
            return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
        });
    }, [options, selectedSubmission, selectedSubmissionId]);
    const canManageSelectedConsent =
        !loading &&
        !failed &&
        selectedSubmissionId !== null &&
        options.some(
            (submission) => submission.id === selectedSubmissionId && isSelectable(submission),
        );

    const handleValueChange = (value: string) => {
        const submission = orderedOptions.find((candidate) => String(candidate.id) === value);
        if (!submission || !isSelectable(submission)) return;
        onSelect(submission);
    };

    return (
        <section
            className="mb-7 overflow-hidden border border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
            aria-labelledby="article-solution-heading"
        >
            <header className="grid gap-4 border-b border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-4 py-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-5">
                <span className="grid h-11 w-11 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                    <Code2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                    <h2
                        id="article-solution-heading"
                        className="text-lg font-bold tracking-[-0.025em] text-[var(--platform-ink)]"
                    >
                        {t('title')}
                    </h2>
                    <p className="mt-1 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('description')}
                    </p>
                </div>
                {selectedSubmissionId ? (
                    <button
                        type="button"
                        onClick={() => onSelect(null)}
                        disabled={disabled}
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 text-sm font-bold text-[var(--platform-ink)] hover:border-[var(--platform-violet)] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                        {t('remove')}
                    </button>
                ) : null}
            </header>

            <div aria-live="polite">
                {loading ? (
                    <div
                        className="flex min-h-36 items-center justify-center gap-3 px-5 py-8 text-sm text-[var(--platform-ink-muted)]"
                        role="status"
                    >
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        {t('loading')}
                    </div>
                ) : failed ? (
                    <div
                        className="flex min-h-40 flex-col items-center justify-center gap-3 px-5 py-7 text-center"
                        role="status"
                    >
                        <p className="max-w-lg text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {t('error')}
                        </p>
                        <button
                            type="button"
                            onClick={() => setRetry((current) => current + 1)}
                            className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                        >
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            {t('retry')}
                        </button>
                    </div>
                ) : orderedOptions.length === 0 ? (
                    <div className="px-5 py-7">
                        <p className="font-bold text-[var(--platform-ink)]">{t('emptyTitle')}</p>
                        <p className="mt-1 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {t('emptyDescription')}
                        </p>
                    </div>
                ) : (
                    <RadioGroup
                        value={selectedSubmissionId ? String(selectedSubmissionId) : ''}
                        onValueChange={handleValueChange}
                        disabled={disabled}
                        aria-label={t('listLabel')}
                        className="max-h-[26rem] gap-0 divide-y divide-[var(--platform-line)] overflow-y-auto"
                    >
                        {orderedOptions.map((submission) => {
                            const selectable = isSelectable(submission);
                            const inputId = `article-submission-${submission.id}`;
                            return (
                                <label
                                    key={submission.id}
                                    htmlFor={inputId}
                                    className={cn(
                                        'grid min-h-20 gap-3 px-4 py-4 transition-colors sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-5',
                                        selectable &&
                                            'cursor-pointer hover:bg-[var(--platform-paper-strong)]',
                                        submission.recommended &&
                                            'bg-[color-mix(in_oklch,var(--platform-citron)_10%,var(--platform-paper))]',
                                        !selectable && 'cursor-not-allowed opacity-65',
                                    )}
                                >
                                    <RadioGroupItem
                                        id={inputId}
                                        value={String(submission.id)}
                                        disabled={disabled || !selectable}
                                        className="h-5 w-5 border-[var(--platform-line-strong)] text-[var(--platform-violet)] focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                                    />
                                    <span className="min-w-0">
                                        <span className="flex flex-wrap items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-[var(--platform-ink)]">
                                                {t('submission', { id: submission.id })}
                                            </span>
                                            {submission.recommended ? (
                                                <span className="inline-flex items-center gap-1 bg-[var(--platform-citron)] px-2 py-0.5 text-[0.7rem] font-bold text-[var(--platform-on-accent)]">
                                                    <Sparkles
                                                        className="h-3.5 w-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    {t('recommended')}
                                                </span>
                                            ) : null}
                                            {submission.status === 'EVALUATED' ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]">
                                                    <CheckCircle2
                                                        className="h-3.5 w-3.5"
                                                        aria-hidden="true"
                                                    />
                                                    {t('evaluated')}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-semibold text-[var(--platform-ink-muted)]">
                                                    {t(`statuses.${submission.status}`)}
                                                </span>
                                            )}
                                        </span>
                                        <span className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-5 text-[var(--platform-ink-muted)]">
                                            <time dateTime={submission.submittedAt}>
                                                {submissionTime(submission.submittedAt, locale)}
                                            </time>
                                            <span>
                                                {t('score', {
                                                    value: scoreLabel(
                                                        submission.score,
                                                        locale,
                                                        tCommon('na'),
                                                    ),
                                                })}
                                            </span>
                                            {submission.metric !== null ? (
                                                <span>
                                                    {t('metric', {
                                                        value: String(submission.metric),
                                                    })}
                                                </span>
                                            ) : null}
                                        </span>
                                        <span
                                            className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-[var(--platform-ink-muted)]"
                                            dir="ltr"
                                        >
                                            <FileCode2
                                                className="h-3.5 w-3.5 shrink-0"
                                                aria-hidden="true"
                                            />
                                            <span className="truncate">
                                                {submission.sourceFileName ??
                                                    t('sourceUnavailable')}
                                            </span>
                                        </span>
                                    </span>
                                    {!selectable ? (
                                        <span className="text-xs font-semibold text-[var(--platform-ink-muted)] sm:max-w-36 sm:text-end">
                                            {submission.status !== 'EVALUATED'
                                                ? t('notEvaluated')
                                                : t('sourceUnavailable')}
                                        </span>
                                    ) : null}
                                </label>
                            );
                        })}
                    </RadioGroup>
                )}
            </div>

            {selectedSubmissionId ? (
                <div className="border-t border-[var(--platform-line-strong)] bg-[color-mix(in_oklch,var(--platform-violet)_5%,var(--platform-paper))] px-4 py-4 sm:px-5">
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="article-source-sharing-consent"
                            checked={consent}
                            onCheckedChange={(checked) => onConsentChange(checked === true)}
                            disabled={disabled || !canManageSelectedConsent}
                            className="mt-0.5 h-5 w-5 rounded-none border-[var(--platform-line-strong)] data-[state=checked]:bg-[var(--platform-violet)] data-[state=checked]:text-white focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                        />
                        <label
                            htmlFor="article-source-sharing-consent"
                            className={cn(
                                'text-sm leading-6 text-[var(--platform-ink)]',
                                disabled || !canManageSelectedConsent
                                    ? 'cursor-not-allowed opacity-65'
                                    : 'cursor-pointer',
                            )}
                        >
                            {t('consent', { id: selectedSubmissionId })}
                            <span className="mt-1 block text-xs leading-5 text-[var(--platform-ink-muted)]">
                                {canManageSelectedConsent
                                    ? t('consentHelp')
                                    : t('consentOwnerOnly')}
                            </span>
                        </label>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
