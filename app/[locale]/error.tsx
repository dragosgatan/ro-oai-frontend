'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, Home, Mail, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';
import { consentManager } from '@/lib/analytics';
import { AnalyticsEvents, sanitizeEventProperties } from '@/lib/analytics/events';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';
import { PlatformPageShell } from '@/components/platform-page-shell';

const primaryActionClassName =
    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-[var(--platform-violet)] bg-[var(--platform-violet)] px-4 py-2.5 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-citron)] transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-[var(--platform-violet-strong)] focus-visible:outline-none active:translate-y-px sm:w-auto dark:text-[var(--platform-on-accent)]';

const secondaryActionClassName =
    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 py-2.5 text-sm font-bold text-[var(--platform-ink)] transition-colors duration-150 hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none sm:w-auto';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations('errors.serverError');
    const { trackEvent } = useGTMTracker();

    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.error('[Error Page]', error);
        }

        if (consentManager.hasConsent('analytics')) {
            try {
                const errorData = {
                    event: AnalyticsEvents.ERROR_OCCURRED,
                    category: 'error',
                    errorType: error.name || 'RuntimeError',
                    errorMessage: error.message || 'Unknown error',
                    errorStack: error.stack?.substring(0, 500),
                    errorDigest: error.digest,
                    severity: 'critical',
                };

                trackEvent(sanitizeEventProperties(errorData));
            } catch (trackingError) {
                console.error('[Error Page] Failed to track error:', trackingError);
            }
        }
    }, [error, trackEvent]);

    return (
        <PlatformPageShell contentClassName="flex min-h-[calc(100dvh-9rem)] items-center">
            <section className="grid w-full items-center gap-10 py-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
                <div className="min-w-0">
                    <p className="platform-page-eyebrow">
                        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                        <span>{t('title')}</span>
                    </p>
                    <h1 className="platform-page-title">{t('heading')}</h1>
                    <div className="mt-6 max-w-2xl space-y-2 text-pretty text-[var(--platform-ink-muted)]">
                        <p className="text-base leading-7 sm:text-lg">{t('description')}</p>
                        <p className="text-sm leading-6">{t('suggestion')}</p>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <button type="button" onClick={reset} className={primaryActionClassName}>
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                            {t('tryAgain')}
                        </button>
                        <Link href="/" className={secondaryActionClassName}>
                            <Home className="h-4 w-4" aria-hidden="true" />
                            {t('goHome')}
                        </Link>
                        <a
                            href="mailto:contact@olimpiada-ai.ro"
                            className={secondaryActionClassName}
                        >
                            <Mail className="h-4 w-4" aria-hidden="true" />
                            {t('contactSupport')}
                        </a>
                    </div>

                    {process.env.NODE_ENV === 'development' ? (
                        <details className="mt-8 max-w-2xl border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] px-4 py-3 text-sm text-[var(--platform-ink-muted-strong)]">
                            <summary className="min-h-11 cursor-pointer py-3 font-semibold text-[var(--platform-ink)]">
                                Development details
                            </summary>
                            <pre className="overflow-x-auto whitespace-pre-wrap break-words border-t border-[var(--platform-line)] py-4 font-mono text-xs leading-5">
                                {error.message}
                            </pre>
                        </details>
                    ) : null}

                    {error.digest ? (
                        <code className="mt-6 inline-block font-mono text-xs tabular-nums text-[var(--platform-ink-muted)]">
                            {error.digest}
                        </code>
                    ) : null}
                </div>

                <div
                    className="relative hidden min-h-72 border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] lg:grid lg:place-items-center"
                    aria-hidden="true"
                >
                    <span className="absolute start-0 top-0 h-3 w-24 bg-[var(--platform-citron)]" />
                    <span className="font-mono text-7xl font-bold tracking-[-0.08em] text-[var(--platform-violet)]">
                        500
                    </span>
                    <span className="absolute bottom-0 end-0 h-12 w-12 bg-[var(--platform-coral)]" />
                </div>
            </section>
        </PlatformPageShell>
    );
}
