'use client';

import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, Home, Mail, RefreshCw } from 'lucide-react';

import './globals.css';
import { DEFAULT_LOCALE, RTL_LOCALES, SUPPORTED_LOCALES, type Locale } from '@/lib/types';

type ErrorCopy = {
    title: string;
    heading: string;
    description: string;
    suggestion: string;
    tryAgain: string;
    goHome: string;
    contactSupport: string;
};

const fallbackCopy: ErrorCopy = {
    title: 'Ceva nu a mers bine',
    heading: 'Ups! Ceva nu a mers bine',
    description: 'Am întâmpinat o eroare neașteptată în procesarea cererii tale.',
    suggestion:
        'Te rugăm să încerci din nou în câteva momente. Dacă problema persistă, contactează suportul.',
    tryAgain: 'Încearcă din nou',
    goHome: 'Mergi la pagina principală',
    contactSupport: 'Contactează suportul',
};

function getPathLocale(): Locale {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;

    const candidate = window.location.pathname.split('/').filter(Boolean)[0];
    return SUPPORTED_LOCALES.includes(candidate as Locale) ? (candidate as Locale) : DEFAULT_LOCALE;
}

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
    const [copy, setCopy] = useState<ErrorCopy>(fallbackCopy);

    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    useEffect(() => {
        const nextLocale = getPathLocale();
        setLocale(nextLocale);

        let active = true;
        import(`@/locales/${nextLocale}.json`)
            .then((module) => {
                const translatedCopy = module.default?.errors?.serverError as
                    | Partial<ErrorCopy>
                    | undefined;

                if (active && translatedCopy) {
                    setCopy((current) => ({ ...current, ...translatedCopy }));
                }
            })
            .catch(() => {
                // The global boundary must remain usable even when locale loading caused the error.
            });

        return () => {
            active = false;
        };
    }, []);

    const direction = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={direction} suppressHydrationWarning>
            <body className="min-h-screen bg-[oklch(0.978_0.014_292)] text-[oklch(0.22_0.055_282)] dark:bg-[oklch(0.18_0.038_286)] dark:text-[oklch(0.94_0.016_292)]">
                <main className="platform-page-shell min-h-screen">
                    <div className="platform-page-inner flex min-h-screen items-center">
                        <section className="grid w-full items-center gap-10 py-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
                            <div className="min-w-0">
                                <p className="platform-page-eyebrow">
                                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                                    <span>{copy.title}</span>
                                </p>
                                <h1 className="platform-page-title">{copy.heading}</h1>
                                <div className="mt-6 max-w-2xl space-y-2 text-pretty text-[var(--platform-ink-muted)]">
                                    <p className="text-base leading-7 sm:text-lg">
                                        {copy.description}
                                    </p>
                                    <p className="text-sm leading-6">{copy.suggestion}</p>
                                </div>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                    <button
                                        type="button"
                                        onClick={reset}
                                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-[var(--platform-violet)] bg-[var(--platform-violet)] px-4 py-2.5 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-citron)] transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-[var(--platform-violet-strong)] focus-visible:outline-none active:translate-y-px sm:w-auto dark:text-[var(--platform-on-accent)]"
                                    >
                                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                        {copy.tryAgain}
                                    </button>
                                    <a
                                        href={`/${locale}`}
                                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 py-2.5 text-sm font-bold text-[var(--platform-ink)] transition-colors duration-150 hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none sm:w-auto"
                                    >
                                        <Home className="h-4 w-4" aria-hidden="true" />
                                        {copy.goHome}
                                    </a>
                                    <a
                                        href="mailto:contact@olimpiada-ai.ro"
                                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 py-2.5 text-sm font-bold text-[var(--platform-ink)] transition-colors duration-150 hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none sm:w-auto"
                                    >
                                        <Mail className="h-4 w-4" aria-hidden="true" />
                                        {copy.contactSupport}
                                    </a>
                                </div>

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
                    </div>
                </main>
            </body>
        </html>
    );
}
