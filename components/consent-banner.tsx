'use client';

import { useCallback, useEffect, useState } from 'react';
import { Cookie, Settings, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { CONSENT_PREFERENCES_EVENT } from '@/components/consent-preferences-trigger';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Link } from '@/i18n/routing';
import { consentManager } from '@/lib/analytics/consent';
import type { ConsentSettings } from '@/lib/analytics/types';
import { platformDisplay, platformSans } from '@/lib/platform-fonts';
import { cn } from '@/lib/utils';

interface ConsentBannerProps {
    onAccept?: () => void;
    onDecline?: () => void;
    onCustomize?: () => void;
    className?: string;
}

const REQUIRED_PREFERENCES: ConsentSettings = {
    analytics: false,
    marketing: false,
    functional: true,
};

export function ConsentBanner({ onAccept, onDecline, onCustomize, className }: ConsentBannerProps) {
    const t = useTranslations('consent');
    const tCommon = useTranslations('common');
    const [isVisible, setIsVisible] = useState(false);
    const [isReopened, setIsReopened] = useState(false);
    const [showCustomize, setShowCustomize] = useState(false);
    const [preferences, setPreferences] = useState<ConsentSettings>(REQUIRED_PREFERENCES);

    const closeDialog = useCallback(() => {
        setIsVisible(false);
        setShowCustomize(false);
    }, []);

    const handleDeclineAll = useCallback(() => {
        consentManager.setConsent(REQUIRED_PREFERENCES);
        closeDialog();
        onDecline?.();
    }, [closeDialog, onDecline]);

    const handleDismiss = useCallback(() => {
        if (isReopened) {
            closeDialog();
            return;
        }

        handleDeclineAll();
    }, [closeDialog, handleDeclineAll, isReopened]);

    useEffect(() => {
        const existingPreferences = consentManager.getConsentSettings();

        if (consentManager.isConsentRequired()) {
            setPreferences(REQUIRED_PREFERENCES);
            setIsReopened(false);
            setIsVisible(true);
        } else if (existingPreferences) {
            setPreferences(existingPreferences);
        }

        const openPreferences = () => {
            const savedPreferences = consentManager.getConsentSettings();
            setPreferences(savedPreferences ?? REQUIRED_PREFERENCES);
            setIsReopened(Boolean(savedPreferences));
            setShowCustomize(true);
            setIsVisible(true);
            onCustomize?.();
        };

        window.addEventListener(CONSENT_PREFERENCES_EVENT, openPreferences);
        return () => window.removeEventListener(CONSENT_PREFERENCES_EVENT, openPreferences);
    }, [onCustomize]);

    const handleAcceptAll = () => {
        consentManager.setConsent({
            analytics: true,
            marketing: true,
            functional: true,
        });
        closeDialog();
        onAccept?.();
    };

    const handleCustomizeClick = () => {
        setShowCustomize(true);
        onCustomize?.();
    };

    const handleSavePreferences = () => {
        consentManager.setConsent({ ...preferences, functional: true });
        closeDialog();
    };

    const togglePreference = (key: 'analytics' | 'marketing') => {
        setPreferences((current) => ({ ...current, [key]: !current[key] }));
    };

    return (
        <Dialog
            open={isVisible}
            onOpenChange={(open) => {
                if (!open) handleDismiss();
            }}
        >
            <DialogContent
                className={cn(
                    platformSans.variable,
                    platformDisplay.variable,
                    platformSans.className,
                    'flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-none border border-[oklch(0.62_0.06_287)] bg-[oklch(0.978_0.014_292)] p-0 text-[oklch(0.22_0.055_282)] shadow-[8px_8px_0_oklch(0.22_0.055_282_/_0.28)] sm:rounded-none dark:border-[oklch(0.5_0.07_287)] dark:bg-[oklch(0.18_0.038_286)] dark:text-[oklch(0.94_0.016_292)]',
                    className,
                )}
                onPointerDownOutside={(event) => event.preventDefault()}
            >
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <header className="relative border-b border-[oklch(0.79_0.04_289)] p-5 pe-16 sm:p-7 sm:pe-20 dark:border-[oklch(0.34_0.055_287)]">
                        <div className="flex items-start gap-4">
                            <span className="grid h-11 w-11 shrink-0 place-items-center bg-[oklch(0.89_0.185_116)] text-[oklch(0.2_0.045_282)]">
                                <Cookie className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[oklch(0.43_0.235_291)] dark:text-[oklch(0.72_0.19_292)]">
                                    MLCompete / Privacy
                                </p>
                                <DialogTitle className="font-[family-name:var(--font-home-display)] text-xl font-bold leading-tight tracking-[-0.035em] sm:text-2xl">
                                    {t('title')}
                                </DialogTitle>
                                <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                                    {t('description')}
                                </DialogDescription>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="absolute end-3 top-3 grid h-11 w-11 place-items-center border border-transparent text-[oklch(0.46_0.044_282)] transition-colors hover:border-[oklch(0.62_0.06_287)] hover:bg-[oklch(0.952_0.026_292)] hover:text-[oklch(0.22_0.055_282)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.43_0.235_291)] sm:end-5 sm:top-5 dark:text-[oklch(0.73_0.034_290)] dark:hover:border-[oklch(0.5_0.07_287)] dark:hover:bg-[oklch(0.215_0.046_286)] dark:hover:text-[oklch(0.94_0.016_292)]"
                            aria-label={tCommon('close')}
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </header>

                    {showCustomize ? (
                        <div className="p-5 sm:p-7">
                            <div className="space-y-3">
                                <PreferenceSwitch
                                    title={t('analytics')}
                                    description={t('analyticsDesc')}
                                    checked={preferences.analytics}
                                    onToggle={() => togglePreference('analytics')}
                                />
                                <PreferenceSwitch
                                    title={t('marketing')}
                                    description={t('marketingDesc')}
                                    checked={preferences.marketing}
                                    onToggle={() => togglePreference('marketing')}
                                />
                                <div className="flex min-h-20 items-center justify-between gap-4 border border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] p-4 opacity-75 dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)]">
                                    <div className="min-w-0">
                                        <p className="font-bold">{t('functional')}</p>
                                        <p className="mt-1 text-sm leading-5 text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                                            {t('functionalDesc')}
                                        </p>
                                    </div>
                                    <span
                                        role="switch"
                                        aria-checked="true"
                                        aria-disabled="true"
                                        aria-label={t('functional')}
                                        className="relative h-7 w-12 shrink-0 bg-[oklch(0.43_0.235_291)] dark:bg-[oklch(0.72_0.19_292)]"
                                    >
                                        <span className="absolute end-1 top-1 h-5 w-5 bg-white" />
                                    </span>
                                </div>
                            </div>

                            <p className="mt-5 text-sm leading-6 text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                                {t('learnMore')}{' '}
                                <Link
                                    href="/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-[oklch(0.43_0.235_291)] underline decoration-2 underline-offset-4 hover:text-[oklch(0.36_0.22_291)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.43_0.235_291)] dark:text-[oklch(0.72_0.19_292)]"
                                >
                                    {t('privacyPolicy')}
                                </Link>
                            </p>
                        </div>
                    ) : null}
                </div>

                <footer className="shrink-0 border-t border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] p-4 sm:p-5 dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)]">
                    {showCustomize ? (
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                            <ConsentAction
                                variant="secondary"
                                onClick={() => setShowCustomize(false)}
                            >
                                {tCommon('back')}
                            </ConsentAction>
                            <ConsentAction onClick={handleSavePreferences}>
                                {t('savePreferences')}
                            </ConsentAction>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-[auto_auto_1fr]">
                            <ConsentAction variant="secondary" onClick={handleDeclineAll}>
                                {t('declineAll')}
                            </ConsentAction>
                            <ConsentAction variant="secondary" onClick={handleCustomizeClick}>
                                <Settings className="me-2 h-4 w-4" aria-hidden="true" />
                                {t('customize')}
                            </ConsentAction>
                            <ConsentAction
                                onClick={handleAcceptAll}
                                className="sm:justify-self-end"
                            >
                                {t('acceptAll')}
                            </ConsentAction>
                        </div>
                    )}
                </footer>
            </DialogContent>
        </Dialog>
    );
}

function PreferenceSwitch({
    title,
    description,
    checked,
    onToggle,
}: {
    title: string;
    description: string;
    checked: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={title}
            onClick={onToggle}
            className="flex min-h-20 w-full items-center justify-between gap-4 border border-[oklch(0.79_0.04_289)] bg-transparent p-4 text-start transition-colors hover:border-[oklch(0.62_0.06_287)] hover:bg-[oklch(0.952_0.026_292)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.43_0.235_291)] dark:border-[oklch(0.34_0.055_287)] dark:hover:border-[oklch(0.5_0.07_287)] dark:hover:bg-[oklch(0.215_0.046_286)]"
        >
            <span className="min-w-0">
                <span className="block font-bold">{title}</span>
                <span className="mt-1 block text-sm leading-5 text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                    {description}
                </span>
            </span>
            <span
                aria-hidden="true"
                className={cn(
                    'relative h-7 w-12 shrink-0 border border-[oklch(0.62_0.06_287)] transition-colors dark:border-[oklch(0.5_0.07_287)]',
                    checked
                        ? 'bg-[oklch(0.43_0.235_291)] dark:bg-[oklch(0.72_0.19_292)]'
                        : 'bg-[oklch(0.952_0.026_292)] dark:bg-[oklch(0.215_0.046_286)]',
                )}
            >
                <span
                    className={cn(
                        'absolute top-1 h-5 w-5 bg-white shadow-sm transition-transform',
                        checked
                            ? 'translate-x-6 rtl:-translate-x-6'
                            : 'translate-x-1 rtl:-translate-x-1',
                    )}
                />
            </span>
        </button>
    );
}

function ConsentAction({
    children,
    className,
    variant = 'primary',
    onClick,
}: {
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary';
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex min-h-11 w-full items-center justify-center px-5 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.43_0.235_291)] sm:w-auto',
                variant === 'primary'
                    ? 'bg-[oklch(0.43_0.235_291)] text-white hover:bg-[oklch(0.36_0.22_291)] dark:bg-[oklch(0.72_0.19_292)] dark:text-[oklch(0.18_0.038_286)] dark:hover:bg-[oklch(0.77_0.17_292)]'
                    : 'border border-[oklch(0.62_0.06_287)] bg-transparent text-[oklch(0.22_0.055_282)] hover:bg-[oklch(0.978_0.014_292)] dark:border-[oklch(0.5_0.07_287)] dark:text-[oklch(0.94_0.016_292)] dark:hover:bg-[oklch(0.18_0.038_286)]',
                className,
            )}
        >
            {children}
        </button>
    );
}
