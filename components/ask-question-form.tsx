'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { createQuestion } from '@/lib/api';
import type { Comment } from '@/lib/types';
import { MessageSquarePlus } from 'lucide-react';
import { analytics, AnalyticsEvents } from '@/lib/analytics';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';
import { useTranslations } from 'next-intl';

const MAX_CHARS = 5000;

type AskQuestionFormProps = {
    problemId: number;
    onQuestionCreated?: (comment: Comment) => void;
};

export function AskQuestionForm({ problemId, onQuestionCreated }: AskQuestionFormProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { trackProblem } = useGTMTracker();
    const t = useTranslations('myQuestions');
    const tCommon = useTranslations('common');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!content.trim()) {
            toast.error(tCommon('error'), t('askQuestion'));
            return;
        }

        if (content.length > MAX_CHARS) {
            toast.error(tCommon('error'), `${content.length.toLocaleString()} / ${MAX_CHARS}`);
            return;
        }

        try {
            setIsSubmitting(true);

            const newComment = await createQuestion(problemId, { content: content.trim() });

            // Track question_ask event using GTM tracker
            try {
                trackProblem('question_ask', String(problemId), {
                    commentId: newComment.id,
                    contentLength: content.trim().length,
                });

                // Also track via legacy analytics for backward compatibility
                analytics.trackEvent({
                    name: AnalyticsEvents.COMMENT_POST,
                    properties: {
                        problemId,
                        commentId: newComment.id,
                        contentLength: content.trim().length,
                        timestamp: new Date().toISOString(),
                    },
                });
            } catch (error) {
                console.error('[Analytics] Failed to track question ask:', error);
            }

            // Show success
            toast.success(tCommon('success'), t('askQuestion'));

            // Clear form
            setContent('');

            // Notify parent component
            if (onQuestionCreated) {
                onQuestionCreated(newComment);
            }
        } catch (error) {
            toast.error(
                tCommon('error'),
                error instanceof Error ? error.message : tCommon('retry'),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const remainingChars = MAX_CHARS - content.length;
    const isNearLimit = remainingChars < 100;

    return (
        <form onSubmit={handleSubmit} className="space-y-3" aria-label={t('askQuestion')}>
            <div className="space-y-2">
                <label htmlFor="question-content" className="sr-only">
                    {t('askQuestion')}
                </label>
                <Textarea
                    id="question-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('askQuestion')}
                    className="min-h-32 resize-y rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-sm text-[var(--platform-ink)] placeholder:text-[var(--platform-ink-muted)] focus-visible:ring-[var(--platform-coral)] sm:text-base"
                    disabled={isSubmitting}
                    maxLength={MAX_CHARS}
                    aria-label={t('askQuestion')}
                    aria-describedby="question-char-count"
                    aria-required="true"
                />
                <div className="flex justify-end text-xs text-[var(--platform-ink-muted)]">
                    <span
                        id="question-char-count"
                        className={`font-mono tabular-nums ${isNearLimit ? 'font-semibold text-amber-700 dark:text-amber-300' : ''}`}
                    >
                        {remainingChars.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                    </span>
                </div>
            </div>
            <Button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="min-h-11 w-full rounded-none bg-[var(--platform-citron)] font-bold text-[var(--platform-on-accent)] shadow-[4px_4px_0_var(--platform-violet)] hover:bg-[var(--platform-citron)] hover:brightness-95 active:translate-y-px active:shadow-[2px_2px_0_var(--platform-violet)] sm:w-auto"
                size="default"
                aria-label={isSubmitting ? tCommon('loading') : t('askQuestion')}
                aria-busy={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <span
                            className="me-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent"
                            aria-hidden="true"
                        />
                        {tCommon('loading')}
                    </>
                ) : (
                    <>
                        <MessageSquarePlus className="me-2 h-4 w-4" aria-hidden="true" />
                        {t('askQuestion')}
                    </>
                )}
            </Button>
        </form>
    );
}
