'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import {
    refreshCompetitionProblems,
    getSubmissions,
    getBasicCompetition,
    getProblem,
} from '@/lib/api';
import { Problem, Submission } from '@/lib/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

import { useSession } from 'next-auth/react';
import { platformSans } from '@/lib/platform-fonts';
import { cn } from '@/lib/utils';

interface SelectedSubmissionsModalProps {
    competitionId: number;
    competitionStartTime: string | null | undefined;
    competitionEndTime: string | null | undefined;
    forceOpen?: boolean;
    onClose?: () => void;
    onContinue?: () => void;
}

async function getSelectedSubmissionDetails(problem: Problem): Promise<Submission[]> {
    const selectedIds = problem.selectedSubmissionIds ?? [];
    if (selectedIds.length === 0) return [];

    const selectedIdSet = new Set(selectedIds);
    const submissionsById = new Map<number, Submission>();
    let pageNumber = 0;
    let totalPages = 1;

    while (pageNumber < totalPages && submissionsById.size < selectedIdSet.size) {
        const submissionsPage = await getSubmissions(problem.id, pageNumber, 100);
        totalPages = submissionsPage.page.totalPages;

        for (const submission of submissionsPage.content) {
            if (selectedIdSet.has(submission.id)) submissionsById.set(submission.id, submission);
        }
        pageNumber += 1;
    }

    const missingIds = selectedIds.filter((id) => !submissionsById.has(id));
    if (missingIds.length > 0) {
        throw new Error(`Selected submissions unavailable: ${missingIds.join(', ')}`);
    }

    return selectedIds.map((id) => submissionsById.get(id)!);
}

export function SelectedSubmissionsModal({
    competitionId,
    competitionStartTime,
    competitionEndTime,
    forceOpen = false,
    onClose,
    onContinue,
}: SelectedSubmissionsModalProps) {
    const t = useTranslations('competitions.details.submissionSelection');
    const tCommon = useTranslations('common');
    const tProblems = useTranslations('problems');
    const tSubmissions = useTranslations('submissionDetails');
    const { status: sessionStatus } = useSession();

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [selectedSubmissionsByProblem, setSelectedSubmissionsByProblem] = useState<
        Record<number, Submission[]>
    >({});
    const [error, setError] = useState<string | null>(null);
    const [isJoined, setIsJoined] = useState<boolean | null>(null);
    const hasOpenedRef = useRef(false);

    useEffect(() => {
        if (forceOpen) {
            setIsOpen(true);
        }
    }, [forceOpen]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open && onClose) {
            onClose();
        }
    };

    useEffect(() => {
        if (!competitionEndTime || !competitionStartTime || sessionStatus !== 'authenticated')
            return;

        const start = new Date(competitionStartTime);
        const end = new Date(competitionEndTime);
        const startTimeMs = start.getTime();
        const endTimeMs = end.getTime();
        const fiveMinutesInMs = 5 * 60 * 1000;

        const checkTimeAndJoined = async () => {
            const now = Date.now();

            // The check should run only if the competition has started
            if (now < startTimeMs) {
                return false; // Stop, don't wait for start
            }

            // If the triggering window (end) has passed, no further checks should be made
            if (now > endTimeMs) {
                return false; // Signal to stop interval
            }

            // Only make API calls if within the triggering window [end - 5min, end]
            const isWithinTriggerWindow = now >= endTimeMs - fiveMinutesInMs && now <= endTimeMs;

            if (!isWithinTriggerWindow) {
                return true; // Continue interval, but do nothing
            }

            // If we already opened it once, don't trigger again
            if (hasOpenedRef.current) {
                return true;
            }

            // Fetch joined status if we don't have it yet
            let currentJoined = isJoined;
            if (currentJoined === null) {
                try {
                    const basicData = await getBasicCompetition(competitionId);
                    currentJoined = basicData.joined;
                    setIsJoined(currentJoined);
                } catch (err) {
                    console.error('Failed to fetch joined status for modal trigger', err);
                    return true;
                }
            }

            if (currentJoined && !hasOpenedRef.current) {
                setIsOpen(true);
                hasOpenedRef.current = true;
            }

            return true;
        };

        const runCheck = async () => {
            const shouldContinue = await checkTimeAndJoined();
            if (!shouldContinue) {
                clearInterval(interval);
            }
        };

        const interval = setInterval(runCheck, 10000); // Check every 10 seconds
        runCheck();

        return () => clearInterval(interval);
    }, [competitionStartTime, competitionEndTime, competitionId, sessionStatus, isJoined]);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, competitionId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const competitionData = await refreshCompetitionProblems(competitionId);
            const problemsList = competitionData.problems || [];

            // Full details are required to verify the exact persisted selection. A partial
            // response must not be presented as an empty selection.
            const fullProblemsList = await Promise.all(
                problemsList.map((problem) => getProblem(problem.id)),
            );

            setProblems(fullProblemsList);

            const selections: Record<number, Submission[]> = {};

            await Promise.all(
                fullProblemsList.map(async (problem) => {
                    selections[problem.id] = await getSelectedSubmissionDetails(problem);
                }),
            );

            setSelectedSubmissionsByProblem(selections);
        } catch (err) {
            console.error('Failed to fetch competition problems for modal', err);
            setError(tProblems('errorLoadingProblem'));
        } finally {
            setLoading(false);
        }
    };

    const hasCompleteSelection = problems.every((problem) => {
        const limit = problem.selectionLimit ?? 0;
        return limit <= 0 || (problem.selectedSubmissionIds?.length ?? 0) === limit;
    });

    const handleContinue = () => {
        if (loading || error || !hasCompleteSelection) return;
        setIsOpen(false);
        onContinue?.();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className={cn(
                    platformSans.className,
                    'flex max-h-[92dvh] flex-col gap-0 rounded-none border-2 border-[oklch(0.62_0.06_287)] bg-[oklch(0.978_0.014_292)] p-0 text-[oklch(0.22_0.055_282)] shadow-[8px_8px_0_oklch(0.43_0.235_291/0.24)] dark:border-[oklch(0.5_0.07_287)] dark:bg-[oklch(0.18_0.038_286)] dark:text-[oklch(0.94_0.016_292)] sm:max-w-2xl [&>button]:grid [&>button]:h-11 [&>button]:w-11 [&>button]:place-items-center [&>button]:rounded-none',
                )}
            >
                <DialogHeader className="border-b border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] px-5 py-5 pe-12 dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)] sm:px-7">
                    <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-[-0.03em]">
                        <span className="grid h-9 w-9 place-items-center bg-[oklch(0.89_0.185_116)] text-[oklch(0.2_0.045_282)] shadow-[3px_3px_0_oklch(0.43_0.235_291)]">
                            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                        </span>
                        {t('modalTitle')}
                    </DialogTitle>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-hidden px-5 py-5 sm:px-7">
                    {loading ? (
                        <div
                            className="space-y-3"
                            role="status"
                            aria-busy="true"
                            aria-label={tCommon('loading')}
                        >
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="space-y-3 border border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] p-4 dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)]"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-44 rounded-none" />
                                            <Skeleton className="h-4 w-56 max-w-full rounded-none" />
                                        </div>
                                        <Skeleton className="h-7 w-20 rounded-none" />
                                    </div>
                                    <Skeleton className="h-11 w-full rounded-none" />
                                </div>
                            ))}
                            <span className="sr-only">{tCommon('loading')}</span>
                        </div>
                    ) : error ? (
                        <div
                            className="flex min-h-56 flex-col items-center justify-center gap-4 border-y border-red-700/30 bg-red-500/10 px-5 text-center"
                            role="alert"
                        >
                            <AlertCircle className="h-9 w-9 text-red-700 dark:text-red-300" />
                            <p className="font-medium text-red-800 dark:text-red-200">{error}</p>
                            <Button
                                variant="outline"
                                onClick={fetchData}
                                className="min-h-11 rounded-none bg-transparent"
                            >
                                {tCommon('retry')}
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-full pe-4">
                            <div className="space-y-5">
                                <p className="max-w-[65ch] text-sm leading-6 text-muted-foreground">
                                    {new Date() < new Date(competitionEndTime || 0)
                                        ? tProblems('competitionSubmissionAlert')
                                        : t('modalDescription')}
                                </p>

                                {problems.map((problem) => {
                                    const selectedSubmissions =
                                        selectedSubmissionsByProblem[problem.id] || [];
                                    const limit = problem.selectionLimit || 0;
                                    const isUnderLimit = selectedSubmissions.length < limit;

                                    return (
                                        <section
                                            key={problem.id}
                                            className="space-y-3 border border-[oklch(0.79_0.04_289)] bg-[oklch(0.978_0.014_292)] p-4 dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.18_0.038_286)]"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3
                                                        className="text-base font-bold tracking-[-0.02em] sm:text-lg"
                                                        dir="auto"
                                                    >
                                                        {problem.title}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {tProblems('selectionDetails', {
                                                            selectionLimit: limit,
                                                            selectedSubmissions:
                                                                selectedSubmissions.length,
                                                        })}
                                                    </p>
                                                </div>
                                                {selectedSubmissions.length > 0 ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="rounded-none border-emerald-700/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                                                    >
                                                        {selectedSubmissions.length}{' '}
                                                        {tCommon('selected')}
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="destructive"
                                                        className="rounded-none"
                                                    >
                                                        {tCommon('none')}
                                                    </Badge>
                                                )}
                                            </div>

                                            {selectedSubmissions.length > 0 ? (
                                                <div className="divide-y divide-[oklch(0.79_0.04_289)] border-y border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] px-3 dark:divide-[oklch(0.34_0.055_287)] dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)]">
                                                    {selectedSubmissions.map((sub) => (
                                                        <div
                                                            key={sub.id}
                                                            className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-2 text-sm"
                                                        >
                                                            <span className="font-mono text-xs">
                                                                #{sub.id}
                                                            </span>
                                                            <div className="flex gap-4">
                                                                {sub.score !== null && (
                                                                    <span>
                                                                        {tSubmissions('score')}:{' '}
                                                                        <strong>{sub.score}</strong>
                                                                    </span>
                                                                )}
                                                                {sub.metric !== null && (
                                                                    <span>
                                                                        {tSubmissions('metric')}:{' '}
                                                                        <strong>
                                                                            {sub.metric}
                                                                        </strong>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-destructive flex items-center gap-1">
                                                    <AlertCircle className="w-4 h-4" />
                                                    {t('noSubmissionsSelected')}
                                                </p>
                                            )}

                                            {isUnderLimit && limit > 0 && (
                                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                                                    {t('reminderToSelect', {
                                                        count: limit - selectedSubmissions.length,
                                                    })}
                                                </p>
                                            )}
                                        </section>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter className="items-center gap-3 border-t border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] px-5 py-4 dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)] sm:justify-end sm:px-7">
                    {forceOpen ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            className="min-h-11 rounded-none bg-transparent px-5"
                        >
                            {tCommon('close')}
                        </Button>
                    ) : null}
                    <Button
                        type="button"
                        onClick={forceOpen ? handleContinue : () => handleOpenChange(false)}
                        disabled={forceOpen && (loading || !!error || !hasCompleteSelection)}
                        className="min-h-11 rounded-none bg-[oklch(0.43_0.235_291)] px-5 text-white hover:bg-[oklch(0.36_0.22_291)] disabled:shadow-none"
                    >
                        {forceOpen ? tCommon('continue') : tCommon('close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
