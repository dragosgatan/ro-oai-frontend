'use client';

import { UserAvatar } from '@/components/user-avatar';
import { Badge } from '@/components/ui/badge';
import { LevelBadge } from '@/components/level/level-badge';
import { formatShortDate } from '@/lib/i18n-formatting';
import type { LevelTier } from '@/lib/level/types';
import { getProfileUrl } from '@/lib/profile-utils';
import type { CommentThread as CommentThreadType, Locale } from '@/lib/types';
import { CheckCircle2Icon, Clock3Icon, Globe2Icon, LockIcon, ShieldCheckIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

type CommentThreadProps = {
    thread: CommentThreadType;
    isOwn: boolean;
};

export function CommentThread({ thread, isOwn }: CommentThreadProps) {
    const { question, answer, isPublic } = thread;
    const locale = useLocale() as Locale;
    const tCommon = useTranslations('common');
    const tQuestions = useTranslations('myQuestions');
    const tSettings = useTranslations('settings');
    const tProfile = useTranslations('profile');
    const tInstitutions = useTranslations('institutions');

    return (
        <article
            className="border border-[var(--platform-line)] bg-[var(--platform-paper)]"
            aria-label={isOwn ? tCommon('you') : question.username}
        >
            <div className="space-y-3 p-4 sm:p-5">
                <header className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        {isOwn ? (
                            <span className="font-semibold">{tCommon('you')}</span>
                        ) : (
                            <Link
                                href={getProfileUrl(question.userId, question.username)}
                                className="flex min-h-11 items-center gap-2 font-semibold underline-offset-4 hover:underline"
                            >
                                <UserAvatar
                                    avatar={question.avatar}
                                    userId={question.userId}
                                    username={question.username}
                                    className="h-7 w-7 rounded-none"
                                    imageClassName="rounded-none"
                                    fallbackClassName="rounded-none text-xs"
                                    loading="lazy"
                                />
                                <span className="max-w-52 truncate" dir="auto">
                                    {question.username}
                                </span>
                            </Link>
                        )}
                        {question.level && (
                            <LevelBadge
                                level={question.level}
                                tier={question.tier as LevelTier}
                                size="xs"
                            />
                        )}
                        <time
                            className="font-mono text-xs text-[var(--platform-ink-muted)]"
                            dateTime={question.createdAt.toISOString()}
                        >
                            {formatShortDate(question.createdAt, locale)}
                        </time>
                    </div>
                    <div
                        className="flex flex-wrap items-center gap-2"
                        aria-label={tQuestions('title')}
                    >
                        <Badge
                            variant="outline"
                            className="rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-xs text-[var(--platform-ink-muted-strong)]"
                        >
                            {isPublic ? (
                                <Globe2Icon className="me-1 h-3 w-3" aria-hidden="true" />
                            ) : (
                                <LockIcon className="me-1 h-3 w-3" aria-hidden="true" />
                            )}
                            {isPublic
                                ? tSettings('publicProfile')
                                : isOwn
                                  ? tCommon('you')
                                  : tProfile('privateTitle')}
                        </Badge>
                        <Badge
                            variant="outline"
                            className={
                                answer
                                    ? 'rounded-none border-emerald-700/35 bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-200'
                                    : 'rounded-none border-amber-700/35 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200'
                            }
                        >
                            {answer ? (
                                <CheckCircle2Icon className="me-1 h-3 w-3" aria-hidden="true" />
                            ) : (
                                <Clock3Icon className="me-1 h-3 w-3" aria-hidden="true" />
                            )}
                            {answer ? tQuestions('tabs.answered') : tQuestions('tabs.unanswered')}
                        </Badge>
                    </div>
                </header>
                <p
                    className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--platform-ink)] sm:text-base"
                    dir="auto"
                >
                    {question.content}
                </p>
            </div>

            {answer && (
                <section
                    className="space-y-3 border-t border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4 sm:p-5"
                    aria-label={tQuestions('tabs.answered')}
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant="outline"
                            className="rounded-none border-[var(--platform-violet)]/35 bg-[var(--platform-violet)]/10 text-xs text-[var(--platform-violet)]"
                        >
                            <ShieldCheckIcon className="me-1 h-3 w-3" aria-hidden="true" />
                            {tInstitutions('moderators')}
                        </Badge>
                        <time
                            className="font-mono text-xs text-[var(--platform-ink-muted)]"
                            dateTime={answer.createdAt.toISOString()}
                        >
                            {formatShortDate(answer.createdAt, locale)}
                        </time>
                    </div>
                    <p
                        className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--platform-ink)] sm:text-base"
                        dir="auto"
                    >
                        {answer.content}
                    </p>
                </section>
            )}
        </article>
    );
}
