'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, FilePenLine, Loader2, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';
import type { Locale } from '@/lib/types';

function tokenFromFragment(fragment: string): string | null {
    const value = fragment.startsWith('#') ? fragment.slice(1) : fragment;
    if (!value) return null;
    const parameterToken = new URLSearchParams(value).get('token');
    if (parameterToken) return parameterToken;
    try {
        return decodeURIComponent(value);
    } catch {
        return null;
    }
}

export function ArticleInvitationBootstrap({ locale }: { locale: Locale }) {
    const t = useTranslations('writing.invitation');
    const startedRef = useRef(false);
    const tokenRef = useRef<string | null>(null);
    const [busy, setBusy] = useState(true);
    const [failed, setFailed] = useState(false);

    const exchange = useCallback(async () => {
        const token = tokenRef.current;
        if (!token) {
            setBusy(false);
            setFailed(true);
            return;
        }
        setBusy(true);
        setFailed(false);
        try {
            const response = await fetch('/api/article-invitations/exchange', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ token, locale }),
            });
            const payload = (await response.json().catch(() => null)) as {
                continuationPath?: unknown;
            } | null;
            const continuationPath =
                typeof payload?.continuationPath === 'string' ? payload.continuationPath : '';
            const continuation = new URL(continuationPath, window.location.origin);
            const expectedPrefix = `/${locale}/writing/invitations/continue/`;
            if (
                !response.ok ||
                continuation.origin !== window.location.origin ||
                !continuation.pathname.startsWith(expectedPrefix)
            ) {
                throw new Error('Invitation exchange failed');
            }
            tokenRef.current = null;
            window.location.replace(continuation.pathname);
        } catch {
            setBusy(false);
            setFailed(true);
        }
    }, [locale]);

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;
        tokenRef.current = tokenFromFragment(window.location.hash);
        // Remove the bearer from the address bar before any subsequent user
        // interaction, navigation, screenshot, or browser history sync.
        try {
            window.history.replaceState(
                window.history.state,
                '',
                `${window.location.pathname}${window.location.search}`,
            );
        } catch {
            // The exchange still succeeds in restricted embedded browser modes.
        }
        void exchange();
    }, [exchange]);

    return (
        <div className="platform-page-shell">
            <div className="platform-page-inner">
                <section
                    aria-labelledby="article-invitation-bootstrap-title"
                    className="mx-auto max-w-xl border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-7 text-center shadow-[7px_7px_0_var(--platform-line)] sm:p-10"
                >
                    <span className="mx-auto grid h-16 w-16 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)]">
                        {busy ? (
                            <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
                        ) : (
                            <FilePenLine className="h-7 w-7" aria-hidden="true" />
                        )}
                    </span>
                    <p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-[var(--platform-violet)]">
                        {t('eyebrow')}
                    </p>
                    <h1
                        id="article-invitation-bootstrap-title"
                        className="mt-3 text-balance text-3xl font-bold tracking-[-0.045em] text-[var(--platform-ink)]"
                    >
                        {failed ? t('unavailableTitle') : t('title')}
                    </h1>
                    <p
                        className="mt-4 text-pretty text-sm leading-6 text-[var(--platform-ink-muted)]"
                        role="status"
                    >
                        {failed ? t('errors.generic') : t('accepting')}
                    </p>
                    {failed ? (
                        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                            {tokenRef.current ? (
                                <button
                                    type="button"
                                    onClick={() => void exchange()}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-4 text-sm font-bold text-white dark:text-[var(--platform-on-accent)]"
                                >
                                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                    {t('accept')}
                                </button>
                            ) : null}
                            <Link
                                href="/articles"
                                className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)]"
                            >
                                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                {t('browseArticles')}
                            </Link>
                        </div>
                    ) : null}
                </section>
            </div>
        </div>
    );
}
