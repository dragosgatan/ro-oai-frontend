'use client';

import type { Comment } from '@/lib/types';
import { CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';
import { useLocale } from '@/hooks/use-locale';

type QuestionCardProps = {
    question: Comment;
    answer: Comment | null;
    problemTitle?: string;
};

export function QuestionCard({ question, answer, problemTitle }: QuestionCardProps) {
    const t = useTranslations('myQuestions');
    const { locale } = useLocale();
    const isAnswered = answer !== null;
    const createdAt = new Date(question.createdAt);
    const formattedDate = new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(createdAt);

    return (
        <article className="px-4 py-5 sm:px-6 sm:py-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span
                    className={
                        isAnswered
                            ? 'inline-flex min-h-8 w-fit items-center gap-2 border border-emerald-500/35 bg-emerald-500/10 px-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-200'
                            : 'inline-flex min-h-8 w-fit items-center gap-2 border border-amber-500/35 bg-amber-500/10 px-2.5 text-xs font-bold text-amber-900 dark:text-amber-100'
                    }
                >
                    {isAnswered ? (
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    ) : (
                        <Clock className="h-4 w-4" aria-hidden="true" />
                    )}
                    {isAnswered ? t('tabs.answered') : t('tabs.unanswered')}
                </span>
                <time
                    dateTime={createdAt.toISOString()}
                    className="text-xs tabular-nums text-[var(--platform-ink-muted)]"
                >
                    {formattedDate}
                </time>
            </header>

            {problemTitle ? (
                <Link
                    href={`/problems/${question.problemId}`}
                    className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--platform-violet)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 hover:text-[var(--platform-violet-strong)]"
                >
                    <span dir="auto">{problemTitle}</span>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
            ) : null}

            <blockquote className="mt-4 whitespace-pre-wrap break-words border border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-4 text-sm leading-6 text-[var(--platform-ink)]">
                {question.content}
            </blockquote>

            {answer ? (
                <section className="mt-5 border-t border-[var(--platform-line)] pt-5">
                    <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink-muted)]">
                        {t('tabs.answered')}
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--platform-ink)]">
                        {answer.content}
                    </p>
                </section>
            ) : null}
        </article>
    );
}
