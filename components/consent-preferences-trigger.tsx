'use client';

import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

export const CONSENT_PREFERENCES_EVENT = 'mlcompete:open-consent-preferences';

export function openConsentPreferences(): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new Event(CONSENT_PREFERENCES_EVENT));
}

export type ConsentPreferencesTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>;

/**
 * Reusable entry point for reopening cookie preferences from persistent UI,
 * such as the footer. ConsentBanner owns the dialog and storage behavior.
 */
export function ConsentPreferencesTrigger({
    children,
    className,
    onClick,
    ...props
}: ConsentPreferencesTriggerProps) {
    const t = useTranslations('consent');
    const label = t('customize');

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
            openConsentPreferences();
        }
    };

    return (
        <button
            type="button"
            className={cn(
                'inline-flex min-h-11 items-center justify-center text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                className,
            )}
            onClick={handleClick}
            aria-label={props['aria-label'] ?? label}
            {...props}
        >
            {children ?? label}
        </button>
    );
}
