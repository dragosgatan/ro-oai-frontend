'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    MessageSquarePlus,
    PartyPopper,
    RefreshCw,
    Scale,
    Send,
    Trash2,
    XCircle,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { createAppeals, getMyAppeals, type AppealResponse } from '@/lib/api';
import { platformSans } from '@/lib/platform-fonts';
import type { CompetitionUserResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
import { subscribeToMediaQuery } from '@/lib/media-query';

interface AppealSectionProps {
    competition: CompetitionUserResponse;
}

interface DraftAppeal {
    problemId: number;
    explanation: string;
}

type AppealStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

const MIN_EXPLANATION_LENGTH = 10;

const primaryButtonClassName =
    'min-h-11 rounded-none bg-[var(--platform-violet)] px-5 text-white shadow-[4px_4px_0_var(--platform-coral)] hover:-translate-y-0.5 hover:bg-[var(--platform-violet-strong)] active:translate-y-0 active:scale-[0.98] dark:text-[var(--platform-on-accent)]';

const secondaryButtonClassName =
    'min-h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 text-[var(--platform-ink)] shadow-none hover:-translate-y-0.5 hover:bg-[var(--platform-paper-strong)] active:translate-y-0 active:scale-[0.98]';

const portalPlatformThemeClassName =
    '[--platform-paper:oklch(0.978_0.014_292)] [--platform-paper-strong:oklch(0.952_0.026_292)] [--platform-ink:oklch(0.22_0.055_282)] [--platform-ink-muted:oklch(0.46_0.044_282)] [--platform-ink-muted-strong:oklch(0.34_0.047_282)] [--platform-violet:oklch(0.43_0.235_291)] [--platform-violet-strong:oklch(0.36_0.22_291)] [--platform-citron:oklch(0.89_0.185_116)] [--platform-coral:oklch(0.72_0.18_32)] [--platform-on-accent:oklch(0.2_0.045_282)] [--platform-line:oklch(0.79_0.04_289)] [--platform-line-strong:oklch(0.62_0.06_287)] dark:[--platform-paper:oklch(0.18_0.038_286)] dark:[--platform-paper-strong:oklch(0.215_0.046_286)] dark:[--platform-ink:oklch(0.94_0.016_292)] dark:[--platform-ink-muted:oklch(0.73_0.034_290)] dark:[--platform-ink-muted-strong:oklch(0.82_0.026_290)] dark:[--platform-violet:oklch(0.72_0.19_292)] dark:[--platform-violet-strong:oklch(0.77_0.17_292)] dark:[--platform-citron:oklch(0.86_0.17_116)] dark:[--platform-coral:oklch(0.74_0.17_32)] dark:[--platform-line:oklch(0.34_0.055_287)] dark:[--platform-line-strong:oklch(0.5_0.07_287)]';

const portalSurfaceClassName =
    'rounded-none border-2 border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)] shadow-[8px_8px_0_color-mix(in_oklch,var(--platform-violet)_24%,transparent)] sm:rounded-none';

const STATUS_CONFIG: Record<
    AppealStatus,
    {
        icon: typeof Clock;
        labelKey: 'pending' | 'accepted' | 'rejected';
        tone: string;
        surface: string;
        iconSurface: string;
    }
> = {
    PENDING: {
        icon: Clock,
        labelKey: 'pending',
        tone: 'text-amber-800 dark:text-amber-200',
        surface: 'bg-[color-mix(in_oklch,var(--platform-citron)_13%,var(--platform-paper))]',
        iconSurface:
            'bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]',
    },
    ACCEPTED: {
        icon: CheckCircle2,
        labelKey: 'accepted',
        tone: 'text-emerald-800 dark:text-emerald-200',
        surface: 'bg-emerald-50/70 dark:bg-emerald-950/25',
        iconSurface: 'bg-emerald-700 text-white dark:bg-emerald-400 dark:text-emerald-950',
    },
    REJECTED: {
        icon: XCircle,
        labelKey: 'rejected',
        tone: 'text-red-800 dark:text-red-200',
        surface: 'bg-[color-mix(in_oklch,var(--platform-coral)_10%,var(--platform-paper))]',
        iconSurface:
            'bg-[var(--platform-coral)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]',
    },
};

function useReducedMotion() {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduced(mediaQuery.matches);
        const handleChange = (event: MediaQueryListEvent) => setReduced(event.matches);
        return subscribeToMediaQuery(mediaQuery, handleChange);
    }, []);

    return reduced;
}

function useCountdown(deadline: Date | null) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (!deadline) return;
        const interval = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(interval);
    }, [deadline]);

    if (!deadline) return null;
    const difference = deadline.getTime() - now.getTime();
    if (difference <= 0) return null;

    const hours = Math.floor(difference / 3_600_000);
    const minutes = Math.floor((difference % 3_600_000) / 60_000);
    const seconds = Math.floor((difference % 60_000) / 1000);
    return {
        h: hours,
        m: minutes,
        s: seconds,
        total: difference,
        urgent: difference < 600_000,
    };
}

type CountdownValue = NonNullable<ReturnType<typeof useCountdown>>;

function CountdownTimer({
    countdown,
    reducedMotion,
}: {
    countdown: CountdownValue;
    reducedMotion: boolean;
}) {
    const t = useTranslations('appeals');
    const time = `${String(countdown.h).padStart(2, '0')}:${String(countdown.m).padStart(
        2,
        '0',
    )}:${String(countdown.s).padStart(2, '0')}`;

    return (
        <span
            role="timer"
            aria-label={t('countdownLabel', { time })}
            className={cn(
                'inline-flex min-h-9 items-center gap-2 border px-3 font-mono text-xs font-semibold tabular-nums',
                countdown.urgent
                    ? 'border-red-600 bg-red-50 text-red-800 dark:border-red-400 dark:bg-red-950/35 dark:text-red-200'
                    : 'border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-[var(--platform-ink-muted-strong)]',
                countdown.urgent && !reducedMotion && 'motion-safe:animate-pulse',
            )}
        >
            <Clock className="h-4 w-4" aria-hidden="true" />
            {time}
        </span>
    );
}

function ConfettiCelebration({ count = 18 }: { count?: number }) {
    const colors = [
        'bg-[var(--platform-coral)]',
        'bg-[var(--platform-citron)]',
        'bg-[var(--platform-violet)]',
    ];

    return (
        <div
            className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
            aria-hidden="true"
        >
            <div className="absolute left-1/2 top-1/2">
                {Array.from({ length: count }).map((_, index) => (
                    <motion.span
                        key={index}
                        className={cn('absolute block h-2 w-2', colors[index % colors.length])}
                        initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
                        animate={{
                            opacity: [1, 1, 0],
                            scale: [0, 1, 0.55],
                            x: ((index * 83) % 260) - 130,
                            y: -40 - ((index * 61) % 170),
                            rotate: (index % 2 === 0 ? 1 : -1) * 160,
                        }}
                        transition={{
                            duration: 1.2,
                            delay: index * 0.025,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function SubmittedAppealRow({
    appeal,
    index,
    reducedMotion,
}: {
    appeal: AppealResponse;
    index: number;
    reducedMotion: boolean;
}) {
    const t = useTranslations('appeals');
    const [expanded, setExpanded] = useState(false);
    const config = STATUS_CONFIG[appeal.status];
    const StatusIcon = config.icon;
    const detailsId = `appeal-${appeal.id}-details`;

    return (
        <motion.article
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className={cn('border-b border-[var(--platform-line)] last:border-b-0', config.surface)}
        >
            <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                aria-controls={detailsId}
                className="grid min-h-20 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-[color-mix(in_oklch,var(--platform-paper-strong)_80%,transparent)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[var(--platform-coral)] sm:px-6"
            >
                <span
                    className={cn('grid h-10 w-10 shrink-0 place-items-center', config.iconSurface)}
                >
                    <StatusIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[var(--platform-ink)] sm:text-base">
                        {appeal.problemTitle ?? t('problemFallback', { id: appeal.problemId })}
                    </span>
                    <span className={cn('mt-1 block text-xs font-semibold', config.tone)}>
                        {t(`status.${config.labelKey}`)}
                    </span>
                </span>
                <motion.span
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.18 }}
                    className="grid h-11 w-11 place-items-center text-[var(--platform-ink-muted)]"
                    aria-hidden="true"
                >
                    <ChevronDown className="h-5 w-5" />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        id={detailsId}
                        role="region"
                        initial={reducedMotion ? false : { opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
                        transition={{ duration: reducedMotion ? 0 : 0.18 }}
                        className="border-t border-[var(--platform-line)] bg-[var(--platform-paper)] px-4 py-4 sm:px-6"
                    >
                        <p
                            className="whitespace-pre-wrap text-sm leading-6 text-[var(--platform-ink-muted-strong)]"
                            dir="auto"
                        >
                            {appeal.explanation}
                        </p>
                        {appeal.adminResponse && (
                            <div className="mt-4 border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4">
                                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--platform-violet)]">
                                    {t('committeeResponse')}
                                </p>
                                <p
                                    className="whitespace-pre-wrap text-sm leading-6 text-[var(--platform-ink)]"
                                    dir="auto"
                                >
                                    {appeal.adminResponse}
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.article>
    );
}

function DraftProblemRow({
    problemId,
    problemTitle,
    explanation,
    onChange,
    onRemove,
    index,
    autoFocus,
    reducedMotion,
}: {
    problemId: number;
    problemTitle: string;
    explanation: string;
    onChange: (value: string) => void;
    onRemove: () => void;
    index: number;
    autoFocus: boolean;
    reducedMotion: boolean;
}) {
    const t = useTranslations('appeals');
    const characterCount = explanation.trim().length;
    const isValid = characterCount >= MIN_EXPLANATION_LENGTH;
    const showError = characterCount > 0 && !isValid;
    const inputId = `appeal-explanation-${problemId}`;
    const helpId = `${inputId}-help`;

    return (
        <motion.article
            layout={!reducedMotion}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.985, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.985, y: -6 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="group border border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
        >
            <header className="grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-3 py-2 sm:px-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center bg-[var(--platform-citron)] text-xs font-bold tabular-nums text-[var(--platform-on-accent)] shadow-[2px_2px_0_var(--platform-violet)]">
                    {index + 1}
                </span>
                <h4 className="min-w-0 truncate text-sm font-semibold text-[var(--platform-ink)]">
                    {problemTitle}
                </h4>
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={onRemove}
                                aria-label={t('removeAppealAria', { problem: problemTitle })}
                                className="grid h-11 w-11 place-items-center text-[var(--platform-ink-muted)] transition-colors hover:bg-red-100 hover:text-red-700 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:hover:bg-red-950/40 dark:hover:text-red-300 sm:opacity-70 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                            >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent
                            className={cn(
                                platformSans.className,
                                portalPlatformThemeClassName,
                                'rounded-none border border-[var(--platform-line-strong)] bg-[var(--platform-ink)] text-[var(--platform-paper)]',
                            )}
                        >
                            {t('removeProblem')}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </header>

            <div className="space-y-2 p-3 sm:p-4">
                <Label
                    htmlFor={inputId}
                    className="text-sm font-semibold text-[var(--platform-ink)]"
                >
                    {t('reasonLabel')}
                </Label>
                <Textarea
                    id={inputId}
                    placeholder={t('reasonPlaceholder')}
                    value={explanation}
                    onChange={(event) => onChange(event.target.value)}
                    rows={4}
                    autoFocus={autoFocus}
                    aria-label={t('explanationAria', { problem: problemTitle })}
                    aria-describedby={helpId}
                    aria-invalid={showError}
                    className="min-h-28 resize-y rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-sm text-[var(--platform-ink)] shadow-none placeholder:text-[var(--platform-ink-muted)] focus-visible:scale-100 focus-visible:ring-0"
                />
                <div className="flex min-h-6 items-center justify-between gap-3">
                    <p
                        id={helpId}
                        className={cn(
                            'text-xs leading-5 transition-colors',
                            showError
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-[var(--platform-ink-muted)]',
                        )}
                    >
                        {showError
                            ? t('minimumCharacters', {
                                  minimum: MIN_EXPLANATION_LENGTH,
                                  count: characterCount,
                              })
                            : t('characterCount', { count: characterCount })}
                    </p>
                    {isValid && (
                        <span className="grid h-6 w-6 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)]">
                            <Check className="h-4 w-4" aria-hidden="true" />
                            <span className="sr-only">{t('completed')}</span>
                        </span>
                    )}
                </div>
            </div>
        </motion.article>
    );
}

export function AppealSection({ competition }: AppealSectionProps) {
    const t = useTranslations('appeals');
    const { status } = useSession();
    const reducedMotion = useReducedMotion();
    const [appeals, setAppeals] = useState<AppealResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [loadRevision, setLoadRevision] = useState(0);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<DraftAppeal[]>([]);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showDiscardAlert, setShowDiscardAlert] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const isAuthenticated = status === 'authenticated';
    const deadline = useMemo(
        () => (competition.appealDeadline ? new Date(competition.appealDeadline) : null),
        [competition.appealDeadline],
    );
    const countdown = useCountdown(deadline);
    const isExpired = !countdown;

    const attemptedProblems = useMemo(
        () => (competition.problems ?? []).filter((problem) => problem.lastAttemptedScore !== null),
        [competition.problems],
    );

    const appealedProblemIds = useMemo(
        () => new Set(appeals.map((appeal) => appeal.problemId)),
        [appeals],
    );

    const availableProblems = useMemo(
        () => attemptedProblems.filter((problem) => !appealedProblemIds.has(problem.id)),
        [attemptedProblems, appealedProblemIds],
    );

    const draftProblemIds = useMemo(
        () => new Set(drafts.map((draft) => draft.problemId)),
        [drafts],
    );
    const addableProblems = useMemo(
        () => availableProblems.filter((problem) => !draftProblemIds.has(problem.id)),
        [availableProblems, draftProblemIds],
    );

    const completedDrafts = useMemo(
        () => drafts.filter((draft) => draft.explanation.trim().length >= MIN_EXPLANATION_LENGTH),
        [drafts],
    );
    const canSubmitDrafts = drafts.length > 0 && completedDrafts.length === drafts.length;
    const progressPercent = drafts.length > 0 ? (completedDrafts.length / drafts.length) * 100 : 0;

    useEffect(() => {
        let active = true;

        if (!competition.appealDeadline) {
            setLoading(false);
            return;
        }

        if (status === 'loading') {
            setLoading(true);
            return;
        }

        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setLoadError(false);
        void getMyAppeals(competition.id)
            .then((result) => {
                if (active) setAppeals(result);
            })
            .catch(() => {
                if (!active) return;
                setLoadError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [competition.appealDeadline, competition.id, isAuthenticated, loadRevision, status]);

    useEffect(() => {
        if (!showCelebration) return;
        const timeout = window.setTimeout(() => setShowCelebration(false), 2000);
        return () => window.clearTimeout(timeout);
    }, [showCelebration]);

    if (!competition.appealDeadline || !competition.joined) return null;

    if (loading) {
        return (
            <section
                className="platform-panel flex min-h-28 items-center gap-4 p-4 sm:p-5"
                aria-busy="true"
            >
                <span className="sr-only" role="status">
                    {t('loading')}
                </span>
                <Skeleton className="h-11 w-11 shrink-0 rounded-none bg-[var(--platform-paper-strong)] motion-reduce:animate-none" />
                <div className="min-w-0 flex-1">
                    <Skeleton className="h-5 w-40 rounded-none bg-[var(--platform-paper-strong)] motion-reduce:animate-none" />
                    <Skeleton className="mt-3 h-4 w-full max-w-lg rounded-none bg-[var(--platform-paper-strong)] motion-reduce:animate-none" />
                </div>
            </section>
        );
    }

    if (loadError) {
        return (
            <section
                className="platform-panel flex flex-col gap-4 border-[var(--platform-coral)] bg-[color-mix(in_oklch,var(--platform-coral)_9%,var(--platform-paper))] p-4 sm:flex-row sm:items-center sm:p-5"
                role="alert"
            >
                <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--platform-coral)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                    <AlertCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-[var(--platform-ink)]">
                        {t('loadErrorTitle')}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('loadErrorDescription')}
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(secondaryButtonClassName, 'w-full sm:w-auto')}
                    onClick={() => setLoadRevision((revision) => revision + 1)}
                >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {t('retry')}
                </Button>
            </section>
        );
    }

    const canSubmitNew = !isExpired && addableProblems.length > 0;
    const hasSubmitted = appeals.length > 0 || competition.hasAppeal;

    const addProblem = (problemId: number) => {
        setSubmitError(null);
        setDrafts((previous) => [...previous, { problemId, explanation: '' }]);
    };

    const addAllProblems = () => {
        setSubmitError(null);
        setDrafts((previous) => [
            ...previous,
            ...addableProblems.map((problem) => ({ problemId: problem.id, explanation: '' })),
        ]);
    };

    const removeDraft = (problemId: number) => {
        setSubmitError(null);
        setDrafts((previous) => previous.filter((draft) => draft.problemId !== problemId));
    };

    const updateDraft = (problemId: number, explanation: string) => {
        setSubmitError(null);
        setDrafts((previous) =>
            previous.map((draft) =>
                draft.problemId === problemId ? { ...draft, explanation } : draft,
            ),
        );
    };

    const handleSubmit = async () => {
        if (!canSubmitDrafts) return;
        setSubmitting(true);
        setSubmitError(null);

        try {
            const results = await createAppeals(
                competition.id,
                drafts.map((draft) => ({
                    problemId: draft.problemId,
                    explanation: draft.explanation.trim(),
                })),
            );
            setSubmitSuccess(true);
            await new Promise((resolve) => window.setTimeout(resolve, 1200));
            setAppeals((previous) => [...previous, ...results]);
            setDrafts([]);
            setSubmitSuccess(false);
            setDialogOpen(false);
            if (!reducedMotion) setShowCelebration(true);
            toast.success(t('submitSuccess', { count: results.length }), {
                icon: <PartyPopper className="h-4 w-4" />,
            });
        } catch {
            const message = t('submitError');
            setSubmitError(message);
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const requestClose = () => {
        if (submitting) return;
        if (drafts.some((draft) => draft.explanation.trim().length > 0)) {
            setShowDiscardAlert(true);
        } else {
            setDialogOpen(false);
            setDrafts([]);
            setSubmitError(null);
        }
    };

    const confirmDiscard = () => {
        setShowDiscardAlert(false);
        setDialogOpen(false);
        setDrafts([]);
        setSubmitError(null);
    };

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setSubmitError(null);
            setDialogOpen(true);
        } else {
            requestClose();
        }
    };

    const countdownTimer = countdown ? (
        <CountdownTimer countdown={countdown} reducedMotion={reducedMotion} />
    ) : null;

    function renderDialog() {
        if (submitSuccess) {
            return (
                <DialogContent
                    className={cn(
                        platformSans.variable,
                        platformSans.className,
                        portalPlatformThemeClassName,
                        portalSurfaceClassName,
                        'w-[calc(100vw-2rem)] max-w-md p-0',
                    )}
                >
                    <motion.div
                        initial={reducedMotion ? false : { scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center justify-center px-6 py-12 text-center"
                    >
                        <motion.span
                            initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                duration: reducedMotion ? 0 : 0.22,
                                delay: reducedMotion ? 0 : 0.08,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            className="mb-5 grid h-16 w-16 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[5px_5px_0_var(--platform-violet)]"
                        >
                            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
                        </motion.span>
                        <DialogTitle className="text-xl font-bold tracking-[-0.03em] text-[var(--platform-ink)]">
                            {t('successTitle')}
                        </DialogTitle>
                        <DialogDescription className="mt-2 max-w-sm text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {t('successDescription')}
                        </DialogDescription>
                    </motion.div>
                </DialogContent>
            );
        }

        const allProblems = attemptedProblems.filter(
            (problem) => !appealedProblemIds.has(problem.id),
        );

        return (
            <DialogContent
                className={cn(
                    platformSans.variable,
                    platformSans.className,
                    portalPlatformThemeClassName,
                    portalSurfaceClassName,
                    'flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0',
                )}
            >
                <DialogHeader className="border-b border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] px-4 py-5 text-start sm:px-6">
                    <div className="flex items-start gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                            <Scale className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <DialogTitle className="text-xl font-bold tracking-[-0.03em] text-[var(--platform-ink)]">
                                {t('title')}
                            </DialogTitle>
                            <DialogDescription className="mt-1 max-w-xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                                {t('description')}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
                    {allProblems.length > 0 && (
                        <section aria-labelledby="appeal-problems-title">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <h3
                                    id="appeal-problems-title"
                                    className="text-sm font-semibold text-[var(--platform-ink)]"
                                >
                                    {t('problemsTitle')}
                                </h3>
                                {allProblems.length > 1 && drafts.length < allProblems.length && (
                                    <button
                                        type="button"
                                        onClick={addAllProblems}
                                        className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-semibold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)] sm:justify-start"
                                    >
                                        {t('selectAll', { count: addableProblems.length })}
                                    </button>
                                )}
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {allProblems.map((problem) => {
                                    const isSelected = draftProblemIds.has(problem.id);
                                    return (
                                        <motion.button
                                            key={problem.id}
                                            type="button"
                                            whileHover={
                                                reducedMotion ? undefined : { translateY: -2 }
                                            }
                                            whileTap={reducedMotion ? undefined : { scale: 0.985 }}
                                            onClick={() =>
                                                isSelected
                                                    ? removeDraft(problem.id)
                                                    : addProblem(problem.id)
                                            }
                                            aria-pressed={isSelected}
                                            className={cn(
                                                'grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border px-3 py-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[var(--platform-coral)]',
                                                isSelected
                                                    ? 'border-[var(--platform-violet)] bg-[color-mix(in_oklch,var(--platform-citron)_16%,var(--platform-paper))] text-[var(--platform-ink)] shadow-[3px_3px_0_color-mix(in_oklch,var(--platform-violet)_24%,transparent)]'
                                                    : 'border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)] hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)]',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'grid h-8 w-8 place-items-center border',
                                                    isSelected
                                                        ? 'border-[var(--platform-violet)] bg-[var(--platform-violet)] text-white dark:text-[var(--platform-on-accent)]'
                                                        : 'border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-[var(--platform-ink-muted)]',
                                                )}
                                            >
                                                {isSelected ? (
                                                    <Check className="h-4 w-4" aria-hidden="true" />
                                                ) : (
                                                    <MessageSquarePlus
                                                        className="h-4 w-4"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </span>
                                            <span className="min-w-0 truncate text-sm font-semibold">
                                                {problem.title}
                                            </span>
                                            {problem.lastAttemptedScore !== null && (
                                                <span className="text-xs font-semibold tabular-nums text-[var(--platform-ink-muted)]">
                                                    ({problem.lastAttemptedScore}p)
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {drafts.length > 0 && (
                        <section aria-labelledby="appeal-drafts-title">
                            <h3
                                id="appeal-drafts-title"
                                className="mb-3 text-sm font-semibold text-[var(--platform-ink)]"
                            >
                                {t('draftsTitle', { count: drafts.length })}
                            </h3>
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {drafts.map((draft, index) => {
                                        const problem = attemptedProblems.find(
                                            (candidate) => candidate.id === draft.problemId,
                                        );
                                        return (
                                            <DraftProblemRow
                                                key={draft.problemId}
                                                problemId={draft.problemId}
                                                problemTitle={
                                                    problem?.title ??
                                                    t('problemFallback', {
                                                        id: draft.problemId,
                                                    })
                                                }
                                                explanation={draft.explanation}
                                                onChange={(value) =>
                                                    updateDraft(draft.problemId, value)
                                                }
                                                onRemove={() => removeDraft(draft.problemId)}
                                                index={index}
                                                autoFocus={index === drafts.length - 1}
                                                reducedMotion={reducedMotion}
                                            />
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </section>
                    )}

                    {drafts.length === 0 && addableProblems.length > 0 && (
                        <motion.div
                            initial={reducedMotion ? false : { opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex min-h-36 flex-col items-center justify-center border-y border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-5 py-8 text-center"
                        >
                            <span className="mb-4 grid h-12 w-12 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[4px_4px_0_var(--platform-violet)]">
                                <MessageSquarePlus className="h-6 w-6" aria-hidden="true" />
                            </span>
                            <p className="text-sm leading-6 text-[var(--platform-ink-muted)]">
                                {t('selectPrompt')}
                            </p>
                        </motion.div>
                    )}

                    {addableProblems.length === 0 && drafts.length === 0 && (
                        <div className="flex min-h-36 flex-col items-center justify-center border-y border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-5 py-8 text-center">
                            <span className="mb-4 grid h-12 w-12 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[4px_4px_0_var(--platform-violet)]">
                                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                            </span>
                            <p className="text-sm leading-6 text-[var(--platform-ink-muted)]">
                                {t('allAppealed')}
                            </p>
                        </div>
                    )}

                    {submitError && (
                        <div
                            role="alert"
                            className="flex items-start gap-3 border border-red-600 bg-red-50 p-3 text-sm leading-6 text-red-900 dark:border-red-400 dark:bg-red-950/35 dark:text-red-100"
                        >
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                            <span>{submitError}</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-0 border-t border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4 sm:flex-col sm:space-x-0 sm:p-5">
                    {drafts.length > 0 && (
                        <div className="mb-4 w-full space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[var(--platform-ink-muted)]">
                                <span>
                                    {t('completedCount', {
                                        completed: completedDrafts.length,
                                        total: drafts.length,
                                    })}
                                </span>
                                {countdownTimer}
                            </div>
                            <Progress
                                value={progressPercent}
                                aria-label={t('completedProgress', {
                                    completed: completedDrafts.length,
                                    total: drafts.length,
                                })}
                                className="h-2 rounded-none bg-[var(--platform-line)] [&>div]:bg-[var(--platform-violet)]"
                            />
                        </div>
                    )}
                    {drafts.length === 0 && countdownTimer && (
                        <div className="mb-4 flex w-full justify-start">{countdownTimer}</div>
                    )}
                    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={requestClose}
                            disabled={submitting}
                            className={cn(secondaryButtonClassName, 'w-full sm:w-auto')}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => void handleSubmit()}
                            loading={submitting}
                            disabled={submitting || !canSubmitDrafts}
                            className={cn(primaryButtonClassName, 'w-full sm:min-w-48 sm:w-auto')}
                        >
                            {!submitting && <Send className="h-4 w-4" aria-hidden="true" />}
                            {submitting
                                ? t('submitting')
                                : t('submitCount', { count: drafts.length })}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        );
    }

    const submittedView =
        appeals.length > 0 ? (
            <div className="relative">
                {showCelebration && <ConfettiCelebration />}
                <section className="platform-panel overflow-hidden" aria-labelledby="appeals-title">
                    <header className="flex flex-col gap-4 border-b border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                                <Scale className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2
                                        id="appeals-title"
                                        className="text-lg font-bold tracking-[-0.03em] text-[var(--platform-ink)]"
                                    >
                                        {t('yourAppeals')}
                                    </h2>
                                    <span className="grid h-7 min-w-7 place-items-center border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-1 text-xs font-bold tabular-nums text-[var(--platform-violet)]">
                                        {appeals.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {countdownTimer}
                    </header>

                    <div>
                        {appeals.map((appeal, index) => (
                            <SubmittedAppealRow
                                key={appeal.id}
                                appeal={appeal}
                                index={index}
                                reducedMotion={reducedMotion}
                            />
                        ))}
                    </div>

                    {canSubmitNew && (
                        <div className="border-t border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4 sm:p-5">
                            <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
                                <DialogTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className={cn(secondaryButtonClassName, 'w-full')}
                                    >
                                        <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                                        {t('appealOther')}
                                    </Button>
                                </DialogTrigger>
                                {renderDialog()}
                            </Dialog>
                        </div>
                    )}
                </section>
            </div>
        ) : null;

    const triggerView =
        !hasSubmitted && !isExpired ? (
            <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
                <section className="platform-panel overflow-hidden" aria-labelledby="appeal-title">
                    <div className="grid gap-4 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-5">
                        <span className="grid h-12 w-12 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[4px_4px_0_var(--platform-violet)]">
                            <Scale className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <h2
                                id="appeal-title"
                                className="text-lg font-bold tracking-[-0.03em] text-[var(--platform-ink)]"
                            >
                                {t('title')}
                            </h2>
                            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                                {t('description')}
                            </p>
                        </div>
                        <div className="flex flex-col items-stretch gap-3 sm:items-end">
                            {countdownTimer}
                            <DialogTrigger asChild>
                                <Button
                                    type="button"
                                    className={cn(primaryButtonClassName, 'w-full sm:w-auto')}
                                >
                                    <Scale className="h-4 w-4" aria-hidden="true" />
                                    {t('submitAppeal')}
                                </Button>
                            </DialogTrigger>
                        </div>
                    </div>
                </section>
                {renderDialog()}
            </Dialog>
        ) : null;

    const registeredView =
        appeals.length === 0 && hasSubmitted ? (
            <section className="platform-panel flex items-start gap-4 p-4 sm:p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h2 className="font-semibold text-[var(--platform-ink)]">
                        {t('registeredTitle')}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('registeredDescription')}
                    </p>
                </div>
            </section>
        ) : null;

    const expiredView =
        appeals.length === 0 && !hasSubmitted && isExpired ? (
            <section className="platform-panel flex items-start gap-4 bg-[var(--platform-paper-strong)] p-4 sm:p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink-muted)]">
                    <Clock className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h2 className="font-semibold text-[var(--platform-ink)]">{t('title')}</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('expiredDescription')}
                    </p>
                </div>
            </section>
        ) : null;

    return (
        <>
            {submittedView}
            {triggerView}
            {registeredView}
            {expiredView}

            <AlertDialog open={showDiscardAlert} onOpenChange={setShowDiscardAlert}>
                <AlertDialogContent
                    className={cn(
                        platformSans.variable,
                        platformSans.className,
                        portalPlatformThemeClassName,
                        portalSurfaceClassName,
                        'w-[calc(100vw-2rem)] max-w-lg',
                    )}
                >
                    <AlertDialogHeader className="text-start">
                        <AlertDialogTitle className="text-xl font-bold tracking-[-0.03em] text-[var(--platform-ink)]">
                            {t('discardTitle')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {t('discardDescription')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:space-x-0">
                        <AlertDialogCancel className={cn(secondaryButtonClassName, 'mt-0')}>
                            {t('continueEditing')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDiscard}
                            className="min-h-11 rounded-none bg-red-700 text-white hover:bg-red-800 active:scale-[0.98] dark:bg-red-500 dark:text-red-950 dark:hover:bg-red-400"
                        >
                            {t('discard')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
