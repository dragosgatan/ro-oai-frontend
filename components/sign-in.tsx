'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getProviders, signIn, useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { PlatformPageHeader, PlatformPageShell } from '@/components/platform-page-shell';
import { Button } from '@/components/ui/button';
import { getLocaleHomePath, getSafeReturnPath } from '@/lib/safe-navigation';

type SignInPhase = 'loading' | 'redirecting' | 'error' | 'no-provider';

const AUTH_REQUEST_TIMEOUT_MS = 15_000;

class AuthRequestTimeoutError extends Error {
    constructor() {
        super('Authentication request timed out');
        this.name = 'AuthRequestTimeoutError';
    }
}

function withAuthRequestTimeout<T>(request: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(
            () => reject(new AuthRequestTimeoutError()),
            AUTH_REQUEST_TIMEOUT_MS,
        );

        request.then(resolve, reject).finally(() => window.clearTimeout(timeout));
    });
}

const authCopy = {
    ro: {
        eyebrow: 'Acces securizat',
        title: 'Autentificare',
        description:
            'Conectează-te în siguranță pentru a continua exact de unde ai rămas pe platformă.',
        secureTitle: 'O singură autentificare. Tot parcursul tău.',
        secureDescription:
            'Problemele, competițiile și progresul tău rămân legate de același cont.',
        errorTitle: 'Autentificarea nu a putut fi finalizată',
        errorDescription:
            'Conexiunea cu furnizorul de identitate a fost întreruptă. Poți relua în siguranță.',
        deniedDescription:
            'Accesul a fost anulat sau refuzat. Încearcă din nou când ești pregătit.',
        noProviderTitle: 'Serviciul de autentificare nu este disponibil',
        noProviderDescription:
            'Nu am găsit niciun furnizor de autentificare configurat. Reîncearcă în câteva momente.',
        destination: 'După autentificare',
    },
    en: {
        eyebrow: 'Secure access',
        title: 'Sign in',
        description: 'Sign in securely and continue exactly where you left off on the platform.',
        secureTitle: 'One sign-in. Your entire learning journey.',
        secureDescription:
            'Your problems, competitions, and progress stay connected to the same account.',
        errorTitle: 'Sign-in could not be completed',
        errorDescription:
            'The connection to the identity provider was interrupted. It is safe to try again.',
        deniedDescription: 'Access was cancelled or denied. Try again whenever you are ready.',
        noProviderTitle: 'The sign-in service is unavailable',
        noProviderDescription:
            'No authentication provider is currently configured. Please try again in a moment.',
        destination: 'After sign-in',
    },
} as const;

function isAuthenticationLoop(path: string): boolean {
    const pathname = path.split(/[?#]/, 1)[0];
    return /\/(?:login|logout)$/.test(pathname);
}

export function SignIn() {
    const t = useTranslations('auth');
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const signInAttempted = useRef(false);
    const queryError = searchParams.get('error');
    const copy = locale === 'ro' ? authCopy.ro : authCopy.en;
    const [phase, setPhase] = useState<SignInPhase>(queryError ? 'error' : 'loading');
    const [errorCode, setErrorCode] = useState<string | null>(queryError);

    const callbackPath = useMemo(() => {
        const fallback = getLocaleHomePath(pathname);
        const candidate = searchParams.get('callbackUrl') ?? searchParams.get('returnTo');
        const safePath = getSafeReturnPath(
            candidate,
            fallback,
            typeof window === 'undefined' ? undefined : window.location.origin,
        );

        return isAuthenticationLoop(safePath) ? fallback : safePath;
    }, [pathname, searchParams]);

    const beginSignIn = useCallback(async () => {
        setErrorCode(null);
        setPhase('loading');

        try {
            const providers = await withAuthRequestTimeout(getProviders());
            const provider = providers?.keycloak ?? Object.values(providers ?? {})[0];

            if (!provider) {
                setPhase('no-provider');
                return;
            }

            setPhase('redirecting');
            await withAuthRequestTimeout(signIn(provider.id, { callbackUrl: callbackPath }));
        } catch (error) {
            setErrorCode(
                error instanceof AuthRequestTimeoutError
                    ? 'AuthenticationRequestTimedOut'
                    : 'ProviderRequestFailed',
            );
            setPhase('error');
        }
    }, [callbackPath]);

    useEffect(() => {
        if (status !== 'loading' || queryError) return;

        const timeout = window.setTimeout(() => {
            setErrorCode('SessionRequestTimedOut');
            setPhase('error');
        }, AUTH_REQUEST_TIMEOUT_MS);

        return () => window.clearTimeout(timeout);
    }, [queryError, status]);

    useEffect(() => {
        if (status === 'authenticated' && session) {
            router.replace(callbackPath);
            return;
        }

        if (status !== 'unauthenticated' || signInAttempted.current || queryError) {
            return;
        }

        signInAttempted.current = true;
        void beginSignIn();
    }, [beginSignIn, callbackPath, queryError, router, session, status]);

    const retry = () => {
        signInAttempted.current = true;
        void beginSignIn();
    };

    const isBusy = phase === 'loading' || phase === 'redirecting';
    const isError = phase === 'error' || phase === 'no-provider';
    const statusTitle =
        phase === 'no-provider'
            ? copy.noProviderTitle
            : phase === 'error'
              ? copy.errorTitle
              : t('signingIn');
    const statusDescription =
        phase === 'no-provider'
            ? copy.noProviderDescription
            : phase === 'error'
              ? errorCode === 'AccessDenied'
                  ? copy.deniedDescription
                  : copy.errorDescription
              : t('redirecting');

    return (
        <PlatformPageShell contentClassName="max-w-5xl space-y-8 md:space-y-10">
            <PlatformPageHeader
                eyebrow={copy.eyebrow}
                icon={ShieldCheck}
                title={copy.title}
                description={copy.description}
            />

            <section className="platform-panel grid overflow-hidden lg:grid-cols-[0.8fr_1.2fr]">
                <div className="relative overflow-hidden bg-[var(--platform-violet-strong)] p-6 text-white dark:text-[var(--platform-on-accent)] sm:p-8 lg:p-10">
                    <div
                        className="absolute -end-8 -top-8 h-32 w-32 border-[18px] border-[var(--platform-citron)] opacity-90"
                        aria-hidden="true"
                    />
                    <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-[var(--platform-citron)]">
                        MLCompete / ID
                    </p>
                    <h2 className="relative mt-8 max-w-sm text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
                        {copy.secureTitle}
                    </h2>
                    <p className="relative mt-4 max-w-md text-sm leading-6 text-white/75">
                        {copy.secureDescription}
                    </p>
                </div>

                <div className="flex min-h-72 flex-col justify-between gap-8 bg-[var(--platform-paper)] p-6 sm:p-8 lg:p-10">
                    <div
                        className="flex items-start gap-4"
                        role={isError ? 'alert' : 'status'}
                        aria-live={isError ? 'assertive' : 'polite'}
                        aria-busy={isBusy}
                    >
                        <span
                            className={`grid h-12 w-12 shrink-0 place-items-center border ${
                                isError
                                    ? 'border-[var(--platform-coral)] bg-[color-mix(in_oklch,var(--platform-coral)_14%,transparent)] text-[var(--platform-coral)]'
                                    : 'border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-[var(--platform-violet)]'
                            }`}
                        >
                            {isError ? (
                                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                            ) : (
                                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                            )}
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--platform-ink)]">
                                {statusTitle}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                {statusDescription}
                            </p>
                            {errorCode && phase === 'error' ? (
                                <p className="mt-3 font-mono text-xs text-[var(--platform-ink-muted)]">
                                    {tCommon('error')}: {errorCode}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="border-t border-[var(--platform-line)] pt-5">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--platform-ink-muted)]">
                            {copy.destination}
                        </p>
                        <p className="mt-2 break-all font-mono text-sm text-[var(--platform-ink)]">
                            {callbackPath}
                        </p>
                        {isError ? (
                            <Button
                                type="button"
                                onClick={retry}
                                className="mt-5 min-h-11 rounded-none bg-[var(--platform-violet)] px-5 text-white shadow-none hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]"
                            >
                                {tCommon('retry')}
                                <ArrowRight className="ms-2 h-4 w-4" aria-hidden="true" />
                            </Button>
                        ) : null}
                    </div>
                </div>
            </section>
        </PlatformPageShell>
    );
}
