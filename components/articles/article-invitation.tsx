'use client';

import { useState } from 'react';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock3,
    FilePenLine,
    Loader2,
    LockKeyhole,
    Mail,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link, useRouter } from '@/i18n/routing';
import {
    ArticleApiError,
    redeemStoredArticleInvitation,
    type ArticleInvitationPreview,
} from '@/lib/articles';
import type { Locale } from '@/lib/types';

function formatExpiry(value: string | null, locale: Locale): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(locale, {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'Europe/Bucharest',
    }).format(date);
}

function invitationStatusTranslationKey(status: string) {
    switch (status.toLocaleUpperCase('en-US')) {
        case 'ACTIVE':
        case 'PENDING':
        case 'SENT':
            return 'statuses.ACTIVE' as const;
        case 'REDEEMED':
            return 'statuses.REDEEMED' as const;
        case 'REVOKED':
            return 'statuses.REVOKED' as const;
        case 'EXPIRED':
            return 'statuses.EXPIRED' as const;
        case 'INVALID':
            return 'statuses.INVALID' as const;
        default:
            return 'statuses.UNAVAILABLE' as const;
    }
}

export function ArticleInvitation({
    invitationHandle,
    invitation,
    locale,
    authenticated,
}: {
    invitationHandle: string;
    invitation: ArticleInvitationPreview;
    locale: Locale;
    authenticated: boolean;
}) {
    const t = useTranslations('writing.invitation');
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const expiry = formatExpiry(invitation.expiresAt, locale);
    const callbackPath = `/${locale}/writing/invitations/continue/${invitationHandle}`;

    const redeem = async () => {
        setBusy(true);
        setError(null);
        try {
            const article = await redeemStoredArticleInvitation(invitationHandle);
            router.replace(`/writing/${article.id}`);
            router.refresh();
        } catch (caught) {
            if (caught instanceof ArticleApiError && caught.status === 410) {
                setError(t('errors.unavailable'));
            } else if (caught instanceof ArticleApiError && caught.status === 403) {
                setError(t('errors.accountMismatch'));
            } else {
                setError(caught instanceof Error ? caught.message : t('errors.generic'));
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="platform-page-shell">
            <div className="platform-page-inner">
                <section
                    aria-labelledby="article-invitation-title"
                    className="mx-auto max-w-4xl border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] shadow-[8px_8px_0_var(--platform-line)]"
                >
                    <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
                        <div className="relative min-h-52 overflow-hidden border-b border-[var(--platform-line-strong)] bg-[var(--platform-violet)] text-white lg:min-h-[33rem] lg:border-b-0 lg:border-e dark:text-[var(--platform-on-accent)]">
                            <svg
                                viewBox="0 0 240 520"
                                preserveAspectRatio="none"
                                className="absolute inset-0 h-full w-full"
                                aria-hidden="true"
                            >
                                <path
                                    d="M0 72H240M0 176H240M0 280H240M0 384H240M48 0V520M120 0V520M192 0V520"
                                    stroke="currentColor"
                                    strokeOpacity="0.14"
                                />
                                <path
                                    d="M22 408C62 340 69 224 119 273C169 322 177 91 222 126"
                                    fill="none"
                                    stroke="var(--platform-citron)"
                                    strokeWidth="7"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute start-5 top-5 grid h-14 w-14 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)]">
                                <FilePenLine className="h-6 w-6" aria-hidden="true" />
                            </span>
                            {invitation.problem ? (
                                <span className="absolute bottom-5 end-5 font-mono text-sm font-bold">
                                    #{invitation.problem.id}
                                </span>
                            ) : null}
                        </div>

                        <div className="flex min-w-0 flex-col p-6 sm:p-9 lg:p-11">
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--platform-violet)]">
                                {t('eyebrow')}
                            </p>
                            <h1
                                id="article-invitation-title"
                                className="mt-4 text-balance text-3xl font-bold leading-tight tracking-[-0.045em] text-[var(--platform-ink)] sm:text-4xl"
                            >
                                {invitation.valid ? t('title') : t('unavailableTitle')}
                            </h1>
                            <p className="mt-4 text-pretty text-base leading-7 text-[var(--platform-ink-muted)]">
                                {invitation.valid
                                    ? invitation.message || t('description')
                                    : t('unavailableDescription')}
                            </p>

                            {invitation.valid ? (
                                <dl className="mt-8 border-y border-[var(--platform-line-strong)] py-2">
                                    {invitation.article ? (
                                        <div className="grid gap-1 border-b border-[var(--platform-line)] py-4 sm:grid-cols-[9rem_1fr]">
                                            <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]">
                                                {t('article')}
                                            </dt>
                                            <dd className="font-semibold text-[var(--platform-ink)]">
                                                {invitation.article.title}
                                            </dd>
                                        </div>
                                    ) : null}
                                    {invitation.problem ? (
                                        <div className="grid gap-1 border-b border-[var(--platform-line)] py-4 sm:grid-cols-[9rem_1fr]">
                                            <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]">
                                                {t('problem')}
                                            </dt>
                                            <dd className="font-semibold text-[var(--platform-ink)]">
                                                #{invitation.problem.id} {invitation.problem.title}
                                            </dd>
                                        </div>
                                    ) : null}
                                    {invitation.maskedEmail ? (
                                        <div className="grid gap-1 border-b border-[var(--platform-line)] py-4 sm:grid-cols-[9rem_1fr]">
                                            <dt className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]">
                                                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                                                {t('recipient')}
                                            </dt>
                                            <dd className="font-mono text-sm text-[var(--platform-ink)]">
                                                {invitation.maskedEmail}
                                            </dd>
                                        </div>
                                    ) : null}
                                    {expiry ? (
                                        <div className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr]">
                                            <dt className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--platform-ink-muted)]">
                                                <Clock3
                                                    className="h-3.5 w-3.5"
                                                    aria-hidden="true"
                                                />
                                                {t('expires')}
                                            </dt>
                                            <dd className="text-sm text-[var(--platform-ink)]">
                                                {expiry}
                                            </dd>
                                        </div>
                                    ) : null}
                                </dl>
                            ) : (
                                <p className="mt-8 inline-flex items-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4 text-sm text-[var(--platform-ink-muted)]">
                                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                                    {t('status', {
                                        status: t(
                                            invitationStatusTranslationKey(invitation.status),
                                        ),
                                    })}
                                </p>
                            )}

                            {error ? (
                                <p
                                    role="alert"
                                    className="mt-5 flex items-start gap-2 text-sm text-red-700 dark:text-red-300"
                                >
                                    <AlertCircle
                                        className="mt-0.5 h-4 w-4 shrink-0"
                                        aria-hidden="true"
                                    />
                                    {error}
                                </p>
                            ) : null}

                            <div className="mt-8">
                                {!invitation.valid ? (
                                    <Link
                                        href="/articles"
                                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)]"
                                    >
                                        {t('browseArticles')}
                                        <ArrowRight
                                            className="h-4 w-4 rtl:rotate-180"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                ) : authenticated ? (
                                    <button
                                        type="button"
                                        onClick={() => void redeem()}
                                        disabled={busy}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-5 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-line)] disabled:opacity-50 dark:text-[var(--platform-on-accent)]"
                                    >
                                        {busy ? (
                                            <Loader2
                                                className="h-4 w-4 animate-spin"
                                                aria-hidden="true"
                                            />
                                        ) : (
                                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                        )}
                                        {busy ? t('accepting') : t('accept')}
                                    </button>
                                ) : (
                                    <Link
                                        href={`/login?callbackUrl=${encodeURIComponent(callbackPath)}`}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-5 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-line)] dark:text-[var(--platform-on-accent)]"
                                    >
                                        <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                                        {t('signIn')}
                                    </Link>
                                )}
                            </div>
                            {invitation.valid ? (
                                <p className="mt-5 text-xs leading-5 text-[var(--platform-ink-muted)]">
                                    {t('accountNotice')}
                                </p>
                            ) : null}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
