'use client';

import { forwardRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { platformDisplay, platformSans } from '@/lib/platform-fonts';
import { cn } from '@/lib/utils';

interface WizardBannerProps {
    children: ReactNode;
    onClose: () => void;
    busy?: boolean;
    className?: string;
}

export const WizardBanner = forwardRef<HTMLDivElement, WizardBannerProps>(function WizardBanner(
    { children, onClose, busy = false, className },
    ref,
) {
    const t = useTranslations('onboarding');

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open && !busy) onClose();
            }}
        >
            <DialogContent
                ref={ref}
                className={cn(
                    'platform-overlay-surface flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden rounded-none border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-0 text-[var(--platform-ink)] shadow-[10px_10px_0_color-mix(in_oklch,var(--platform-violet)_28%,transparent)] sm:rounded-none',
                    platformSans.variable,
                    platformDisplay.variable,
                    platformSans.className,
                    className,
                )}
                onPointerDownOutside={(event) => event.preventDefault()}
            >
                <header className="relative shrink-0 border-b border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-5 pe-16 sm:p-7 sm:pe-52">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--platform-violet)]">
                        MLCompete / Setup
                    </p>
                    <DialogTitle className="font-[family-name:var(--font-home-display)] text-xl font-bold leading-tight tracking-[-0.04em] text-[var(--platform-ink)] sm:text-2xl">
                        {t('wizardTitle')}
                    </DialogTitle>
                    <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('wizardDescription')}
                    </DialogDescription>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="absolute end-3 top-3 inline-flex min-h-11 items-center justify-center gap-2 border border-transparent px-3 text-sm font-bold text-[var(--platform-ink-muted)] transition-colors hover:border-[var(--platform-line-strong)] hover:bg-[var(--platform-paper)] hover:text-[var(--platform-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--platform-coral)] disabled:cursor-wait disabled:opacity-50 sm:end-5 sm:top-5"
                        aria-label={t('dismissAriaLabel')}
                        title={t('dismissTooltip')}
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">{t('dismiss')}</span>
                    </button>
                </header>

                <div
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8"
                    role="region"
                    aria-label={t('wizardContentLabel')}
                >
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
});
