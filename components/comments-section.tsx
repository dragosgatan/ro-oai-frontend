'use client';

import { AskQuestionForm } from '@/components/ask-question-form';
import { CommentThread } from '@/components/comment-thread';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { getComments } from '@/lib/api';
import type { CommentThread as CommentThreadType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCommentNotificationContext } from '@/components/comment-notification-provider';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';
import { BellIcon, ChevronDownIcon, FilterIcon, MessageSquareIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

type CommentsSectionProps = {
    problemId: number;
};

export function CommentsSection({ problemId }: CommentsSectionProps) {
    const { data: session, status } = useSession();
    const t = useTranslations('myQuestions');
    const tCommon = useTranslations('common');
    const [isOpen, setIsOpen] = useState(true);
    const [threads, setThreads] = useState<CommentThreadType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showMyQuestionsOnly, setShowMyQuestionsOnly] = useState(false);
    const { fetchUnread } = useCommentNotificationContext();
    const { trackProblem } = useGTMTracker();
    const commentsViewTrackedRef = useRef(false);
    const currentUserId = session?.id;

    const fetchComments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setThreads(await getComments(problemId));
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : tCommon('error'));
        } finally {
            setLoading(false);
        }
    }, [problemId, tCommon]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchComments();
        }
    }, [status, fetchComments]);

    const handleQuestionCreated = () => {
        fetchComments();
        fetchUnread();
    };

    const filteredThreads = showMyQuestionsOnly
        ? threads.filter((thread) => thread.question.userId === currentUserId)
        : threads;
    const myQuestionsCount = threads.filter(
        (thread) => thread.question.userId === currentUserId,
    ).length;
    const notMyQuestionsCount = threads.length - myQuestionsCount;
    const ownQuestionsWithoutAnswerCount = threads.filter(
        (thread) => thread.question.userId === currentUserId && !thread.answer,
    ).length;

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);

        if (open && !commentsViewTrackedRef.current) {
            commentsViewTrackedRef.current = true;
            try {
                trackProblem('comments_view', String(problemId), {});
            } catch (trackingError) {
                console.error('[Analytics] Failed to track comments view:', trackingError);
            }
        }
    };

    if (status !== 'authenticated') {
        return null;
    }

    return (
        <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
            <section
                id="comments-section"
                className="border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] shadow-[6px_6px_0_var(--platform-line)]"
                aria-labelledby="questions-title"
            >
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="flex min-h-16 w-full items-center justify-between gap-4 border-0 bg-[var(--platform-paper-strong)] px-5 py-4 text-start transition-colors hover:bg-[color-mix(in_oklch,var(--platform-citron)_18%,var(--platform-paper))] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--platform-coral)] sm:px-7"
                        aria-expanded={isOpen}
                        aria-controls="comments-content"
                    >
                        <span className="flex min-w-0 items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                                <MessageSquareIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <span
                                id="questions-title"
                                className="truncate text-base font-bold tracking-[-0.02em] sm:text-lg"
                            >
                                {t('title')}
                            </span>
                            {ownQuestionsWithoutAnswerCount > 0 && (
                                <Badge
                                    variant="outline"
                                    className="rounded-none border-amber-700/35 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                                    aria-label={
                                        t('tabs.unanswered') + ': ' + ownQuestionsWithoutAnswerCount
                                    }
                                    role="status"
                                >
                                    <BellIcon className="me-1 h-3 w-3" aria-hidden="true" />
                                    {ownQuestionsWithoutAnswerCount}
                                </Badge>
                            )}
                        </span>
                        <ChevronDownIcon
                            className={cn(
                                'h-5 w-5 shrink-0 transition-transform duration-200',
                                isOpen && 'rotate-180',
                            )}
                            aria-hidden="true"
                        />
                    </button>
                </CollapsibleTrigger>

                <CollapsibleContent id="comments-content">
                    <div className="space-y-7 px-5 py-6 sm:px-7 sm:py-8">
                        <section aria-labelledby="ask-question-heading">
                            <h3
                                id="ask-question-heading"
                                className="mb-3 text-sm font-bold text-[var(--platform-ink)]"
                            >
                                {t('askQuestion')}
                            </h3>
                            <AskQuestionForm
                                problemId={problemId}
                                onQuestionCreated={handleQuestionCreated}
                            />
                        </section>

                        <section
                            className="border-t border-[var(--platform-line)] pt-6"
                            aria-labelledby="comments-list-heading"
                        >
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h3
                                    id="comments-list-heading"
                                    className="text-sm font-bold text-[var(--platform-ink)]"
                                >
                                    {t('title')}
                                </h3>
                                {myQuestionsCount > 0 && notMyQuestionsCount > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setShowMyQuestionsOnly((current) => !current)
                                        }
                                        className={cn(
                                            'min-h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-xs text-[var(--platform-ink)]',
                                            showMyQuestionsOnly &&
                                                'bg-[var(--platform-violet)] text-white hover:bg-[var(--platform-violet-strong)] hover:text-white dark:text-[var(--platform-on-accent)] dark:hover:text-[var(--platform-on-accent)]',
                                        )}
                                        aria-pressed={showMyQuestionsOnly}
                                    >
                                        <FilterIcon className="me-2 h-4 w-4" aria-hidden="true" />
                                        {t('title')} ({myQuestionsCount})
                                    </Button>
                                )}
                            </div>

                            {loading ? (
                                <div
                                    className="space-y-3"
                                    role="status"
                                    aria-label={tCommon('loading')}
                                >
                                    {[1, 2, 3].map((item) => (
                                        <div
                                            key={item}
                                            className="space-y-3 border-y border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-4"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-4 w-24 rounded-none" />
                                                <Skeleton className="h-4 w-32 rounded-none" />
                                            </div>
                                            <Skeleton className="h-14 w-full rounded-none" />
                                        </div>
                                    ))}
                                    <span className="sr-only">{tCommon('loading')}</span>
                                </div>
                            ) : error ? (
                                <div
                                    className="border-y border-red-700/30 bg-red-500/10 px-5 py-8 text-center"
                                    role="alert"
                                >
                                    <MessageSquareIcon
                                        className="mx-auto mb-3 h-8 w-8 text-red-700 dark:text-red-300"
                                        aria-hidden="true"
                                    />
                                    <p className="font-semibold text-red-800 dark:text-red-200">
                                        {tCommon('error')}
                                    </p>
                                    <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-muted-foreground">
                                        {error}
                                    </p>
                                    <Button
                                        onClick={fetchComments}
                                        variant="outline"
                                        size="sm"
                                        className="mt-4 min-h-11 rounded-none bg-transparent"
                                    >
                                        {tCommon('retry')}
                                    </Button>
                                </div>
                            ) : threads.length === 0 ? (
                                <div
                                    className="border-y border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-5 py-10 text-center"
                                    role="status"
                                >
                                    <MessageSquareIcon
                                        className="mx-auto mb-3 h-8 w-8 text-[var(--platform-violet)]"
                                        aria-hidden="true"
                                    />
                                    <p className="font-semibold">{t('noQuestions')}</p>
                                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                                        {t('noQuestionsAll')}
                                    </p>
                                </div>
                            ) : filteredThreads.length === 0 ? (
                                <div
                                    className="border-y border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-5 py-8 text-center text-sm text-[var(--platform-ink-muted)]"
                                    role="status"
                                >
                                    {t('noQuestions')}
                                </div>
                            ) : (
                                <div className="space-y-3" role="feed" aria-label={t('title')}>
                                    {filteredThreads.map((thread) => (
                                        <CommentThread
                                            key={thread.question.id}
                                            thread={thread}
                                            isOwn={thread.question.userId === currentUserId}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </CollapsibleContent>
            </section>
        </Collapsible>
    );
}
