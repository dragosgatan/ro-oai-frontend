'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2, LogOut, RotateCcw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';

import { PlatformPageHeader, PlatformPageShell } from '@/components/platform-page-shell';
import { Button } from '@/components/ui/button';
import { handleLogout } from '@/lib/auth';
import { getLocaleHomePath, getSafeReturnPath } from '@/lib/safe-navigation';

const logoutCopy = {
    ro: {
        eyebrow: 'Sesiune',
        description: 'Închidem sesiunea locală și conexiunea cu furnizorul de identitate.',
        inProgress: 'Deconectare în curs',
        inProgressDescription: 'Te redirecționăm în siguranță către pagina principală.',
        errorTitle: 'Deconectarea nu a putut fi finalizată',
        errorDescription:
            'Sesiunea nu a fost închisă complet. Reîncearcă pentru a evita să rămâi conectat.',
    },
    en: {
        eyebrow: 'Session',
        description: 'We are closing both the local session and the identity provider session.',
        inProgress: 'Signing you out',
        inProgressDescription: 'You will be returned safely to the platform home page.',
        errorTitle: 'Sign-out could not be completed',
        errorDescription:
            'The session was not fully closed. Try again to make sure you are signed out.',
    },
} as const;

export function LogoutLoading() {
    const t = useTranslations('auth');
    const locale = useLocale();
    const copy = locale === 'ro' ? logoutCopy.ro : logoutCopy.en;

    return (
        <PlatformPageShell contentClassName="max-w-4xl space-y-8" aria-busy="true">
            <PlatformPageHeader
                eyebrow={copy.eyebrow}
                icon={LogOut}
                title={t('signOut')}
                description={copy.description}
            />
            <LogoutState />
        </PlatformPageShell>
    );
}

function LogoutState({ failed = false, onRetry }: { failed?: boolean; onRetry?: () => void }) {
    const tCommon = useTranslations('common');
    const locale = useLocale();
    const copy = locale === 'ro' ? logoutCopy.ro : logoutCopy.en;

    return (
        <section
            className="platform-panel flex min-h-64 flex-col justify-between gap-8 bg-[var(--platform-paper)] p-6 sm:p-8"
            role={failed ? 'alert' : 'status'}
            aria-live={failed ? 'assertive' : 'polite'}
        >
            <div className="flex items-start gap-4">
                <span
                    className={`grid h-12 w-12 shrink-0 place-items-center border ${
                        failed
                            ? 'border-[var(--platform-coral)] text-[var(--platform-coral)]'
                            : 'border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-[var(--platform-violet)]'
                    }`}
                >
                    {failed ? (
                        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                    ) : (
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    )}
                </span>
                <div>
                    <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--platform-ink)]">
                        {failed ? copy.errorTitle : copy.inProgress}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {failed ? copy.errorDescription : copy.inProgressDescription}
                    </p>
                </div>
            </div>
            {failed ? (
                <div className="border-t border-[var(--platform-line)] pt-5">
                    <Button
                        type="button"
                        onClick={onRetry}
                        className="min-h-11 rounded-none bg-[var(--platform-violet)] px-5 text-white shadow-none hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]"
                    >
                        <RotateCcw className="me-2 h-4 w-4" aria-hidden="true" />
                        {tCommon('retry')}
                    </Button>
                </div>
            ) : null}
        </section>
    );
}

export function Logout() {
    const t = useTranslations('auth');
    const locale = useLocale();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const attempted = useRef(false);
    const inFlight = useRef(false);
    const [failed, setFailed] = useState(false);
    const copy = locale === 'ro' ? logoutCopy.ro : logoutCopy.en;

    const returnPath = useMemo(() => {
        const fallback = getLocaleHomePath(pathname);
        return getSafeReturnPath(
            searchParams.get('callbackUrl') ?? searchParams.get('returnTo'),
            fallback,
            typeof window === 'undefined' ? undefined : window.location.origin,
        );
    }, [pathname, searchParams]);

    const performLogout = useCallback(async () => {
        if (inFlight.current) return;

        inFlight.current = true;
        setFailed(false);

        try {
            await handleLogout(returnPath);
        } catch {
            setFailed(true);
        } finally {
            inFlight.current = false;
        }
    }, [returnPath]);

    useEffect(() => {
        if (attempted.current) return;

        attempted.current = true;
        void performLogout();
    }, [performLogout]);

    return (
        <PlatformPageShell contentClassName="max-w-4xl space-y-8">
            <PlatformPageHeader
                eyebrow={copy.eyebrow}
                icon={LogOut}
                title={t('signOut')}
                description={copy.description}
            />
            <LogoutState failed={failed} onRetry={performLogout} />
        </PlatformPageShell>
    );
}
