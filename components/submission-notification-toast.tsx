'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, X, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { Submission } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface SubmissionNotificationToastProps {
    id: number;
    submissionId: number;
    problemId: number;
    problemTitle: string;
    status: 'EVALUATED' | 'ERROR';
    submission?: Submission;
    onDismiss: (id: number) => void;
    onViewDetails: (submissionId: number) => void;
    autoDismissDuration?: number;
    zIndex?: number;
}

/**
 * A persistent-enough, non-blocking result notice for long-running submissions.
 * Its single timer pauses for pointer, keyboard focus, and background tabs.
 */
export const SubmissionNotificationToast = React.memo<SubmissionNotificationToastProps>(
    function SubmissionNotificationToast({
        id,
        submissionId,
        problemId,
        problemTitle,
        status,
        submission,
        onDismiss,
        onViewDetails,
        autoDismissDuration = 10000,
        zIndex = 70,
    }) {
        const tStatus = useTranslations('submissionStatus');
        const tDetails = useTranslations('submissionDetails');
        const [isHovered, setIsHovered] = useState(false);
        const [hasFocus, setHasFocus] = useState(false);
        const [documentHidden, setDocumentHidden] = useState(false);
        const [isVisible, setIsVisible] = useState(false);
        const [isExiting, setIsExiting] = useState(false);
        const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
        const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
        const remainingTimeRef = useRef(autoDismissDuration);
        const timerStartedAtRef = useRef(0);

        const isSuccess = status === 'EVALUATED';
        const isPaused = isHovered || hasFocus || documentHidden;
        const statusTitle = isSuccess ? tStatus('success') : tStatus('failed');

        const handleDismiss = useCallback(() => {
            if (isExiting) return;

            if (timerRef.current) clearTimeout(timerRef.current);
            setIsExiting(true);
            exitTimerRef.current = setTimeout(() => onDismiss(id), 200);
        }, [id, isExiting, onDismiss]);

        useEffect(() => {
            remainingTimeRef.current = autoDismissDuration;
        }, [autoDismissDuration]);

        useEffect(() => {
            setIsVisible(true);

            const handleVisibilityChange = () => setDocumentHidden(document.hidden);
            handleVisibilityChange();
            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                if (timerRef.current) clearTimeout(timerRef.current);
                if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
            };
        }, []);

        useEffect(() => {
            if (isPaused || isExiting || remainingTimeRef.current <= 0) return;

            timerStartedAtRef.current = Date.now();
            timerRef.current = setTimeout(handleDismiss, remainingTimeRef.current);

            return () => {
                if (!timerRef.current) return;

                clearTimeout(timerRef.current);
                timerRef.current = null;
                remainingTimeRef.current = Math.max(
                    0,
                    remainingTimeRef.current - (Date.now() - timerStartedAtRef.current),
                );
            };
        }, [handleDismiss, isExiting, isPaused]);

        return (
            <article
                className={cn(
                    'relative w-full overflow-hidden border-2 bg-[oklch(0.978_0.014_292)] text-[oklch(0.22_0.055_282)] shadow-[5px_5px_0_oklch(0.43_0.235_291/0.28)] transition-[opacity,transform] duration-200 dark:bg-[oklch(0.18_0.038_286)] dark:text-[oklch(0.94_0.016_292)]',
                    isSuccess
                        ? 'border-emerald-700/45 dark:border-emerald-400/50'
                        : 'border-red-700/50 dark:border-red-400/55',
                    isVisible && !isExiting
                        ? 'translate-y-0 opacity-100'
                        : '-translate-y-2 opacity-0',
                    'motion-reduce:transform-none motion-reduce:transition-none',
                )}
                style={{ zIndex }}
                data-problem-id={problemId}
                role={isSuccess ? 'status' : 'alert'}
                aria-live={isSuccess ? 'polite' : 'assertive'}
                aria-atomic="true"
                aria-label={`${statusTitle}: ${problemTitle}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onFocusCapture={() => setHasFocus(true)}
                onBlurCapture={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setHasFocus(false);
                    }
                }}
            >
                <div
                    className={cn(
                        'h-1.5 w-full',
                        isSuccess ? 'bg-[oklch(0.74_0.17_151)]' : 'bg-red-600 dark:bg-red-400',
                    )}
                    aria-hidden="true"
                />

                <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] gap-3 p-4">
                    <span
                        className={cn(
                            'grid h-11 w-11 place-items-center border',
                            isSuccess
                                ? 'border-emerald-800/30 bg-[oklch(0.89_0.185_116)] text-emerald-950'
                                : 'border-red-800/30 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
                        )}
                        aria-hidden="true"
                    >
                        {isSuccess ? (
                            <CheckCircle2 className="h-5 w-5" />
                        ) : (
                            <XCircle className="h-5 w-5" />
                        )}
                    </span>

                    <div className="min-w-0 pt-0.5">
                        <p className="text-sm font-extrabold tracking-[-0.015em]">{statusTitle}</p>
                        <p
                            className="mt-1 truncate text-sm font-medium text-[oklch(0.39_0.045_285)] dark:text-[oklch(0.76_0.028_292)]"
                            title={problemTitle}
                        >
                            {problemTitle}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="grid h-11 w-11 place-items-center border border-transparent text-current transition-colors hover:border-current/20 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.43_0.235_291)] focus-visible:ring-offset-2 dark:hover:bg-white/10"
                        aria-label={`${tStatus('close')}: ${problemTitle}`}
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <div className="col-start-2 col-span-2 min-w-0">
                        {submission &&
                            isSuccess &&
                            (submission.score != null ||
                                submission.finalScore != null ||
                                submission.metric != null ||
                                submission.finalMetric != null) && (
                                <dl className="mb-3 flex flex-wrap gap-x-4 gap-y-1 border-y border-[oklch(0.79_0.04_289)] py-2 text-xs dark:border-[oklch(0.34_0.055_287)]">
                                    {submission.score != null ? (
                                        <div className="flex gap-1.5">
                                            <dt className="font-semibold text-muted-foreground">
                                                {tDetails('score')}
                                            </dt>
                                            <dd className="font-mono font-bold tabular-nums">
                                                {submission.score}
                                            </dd>
                                        </div>
                                    ) : null}
                                    {submission.finalScore != null ? (
                                        <div className="flex gap-1.5">
                                            <dt className="font-semibold text-muted-foreground">
                                                {tDetails('finalScore')}
                                            </dt>
                                            <dd className="font-mono font-bold tabular-nums">
                                                {submission.finalScore}
                                            </dd>
                                        </div>
                                    ) : null}
                                    {submission.metric != null ? (
                                        <div className="flex gap-1.5">
                                            <dt className="font-semibold text-muted-foreground">
                                                {tDetails('metric')}
                                            </dt>
                                            <dd className="font-mono font-bold tabular-nums">
                                                {submission.metric}
                                            </dd>
                                        </div>
                                    ) : null}
                                    {submission.finalMetric != null ? (
                                        <div className="flex gap-1.5">
                                            <dt className="font-semibold text-muted-foreground">
                                                {tDetails('finalMetric')}
                                            </dt>
                                            <dd className="font-mono font-bold tabular-nums">
                                                {submission.finalMetric}
                                            </dd>
                                        </div>
                                    ) : null}
                                </dl>
                            )}

                        {submission?.evaluationMessage ? (
                            <p
                                className="mb-3 line-clamp-2 text-xs leading-5 text-muted-foreground"
                                title={submission.evaluationMessage}
                            >
                                {submission.evaluationMessage}
                            </p>
                        ) : !isSuccess ? (
                            <p className="mb-3 text-xs leading-5 text-red-700 dark:text-red-300">
                                {tStatus('failedMessage')}
                            </p>
                        ) : null}

                        <button
                            type="button"
                            onClick={() => onViewDetails(submissionId)}
                            className="inline-flex min-h-11 items-center gap-2 border-b-2 border-current px-1 text-sm font-bold text-[oklch(0.43_0.235_291)] transition-colors hover:text-[oklch(0.34_0.22_291)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.43_0.235_291)] focus-visible:ring-offset-2 dark:text-[oklch(0.78_0.12_292)]"
                            aria-label={`${tDetails('details')}: ${problemTitle}`}
                        >
                            {tDetails('details')}
                            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </article>
        );
    },
);
