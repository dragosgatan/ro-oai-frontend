'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, AlertTriangle, XIcon } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type DismissibleAlertProps = {
    message: string;
    type?: 'warning' | 'info';
    className?: string;
    dismissible?: boolean;
    glow?: boolean;
    onDismiss?: () => void;
    onLoad?: (arg: string) => void;
    storageKey?: string;
    storageValue?: string;
};

export function DismissibleAlert({
    message,
    type = 'warning',
    className,
    dismissible = true,
    glow = false,
    onDismiss,
    onLoad,
    storageKey,
    storageValue = 'true',
}: DismissibleAlertProps) {
    const tCommon = useTranslations('common');
    const [isMounted, setIsMounted] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const onLoadRef = useRef(onLoad);

    useEffect(() => {
        onLoadRef.current = onLoad;
    }, [onLoad]);

    useEffect(() => {
        setIsMounted(true);
        setIsDismissed(false);

        if (!dismissible || !storageKey) return;

        try {
            const saved = localStorage.getItem(storageKey);
            if (saved === storageValue) setIsDismissed(true);
            if (saved) onLoadRef.current?.(saved);
        } catch (error) {
            // Storage can be unavailable in strict privacy modes. The alert remains usable.
            console.warn('Unable to restore dismissed alert state', error);
        }
    }, [dismissible, storageKey, storageValue]);

    if (!isMounted || isDismissed) return null;

    const handleDismiss = () => {
        if (storageKey) {
            try {
                localStorage.setItem(storageKey, storageValue);
            } catch (error) {
                console.warn('Unable to persist dismissed alert state', error);
            }
        }

        setIsDismissed(true);
        onDismiss?.();
    };

    const isWarning = type === 'warning';
    const Icon = isWarning ? AlertTriangle : AlertCircle;

    return (
        <Alert
            className={cn(
                'flex min-h-16 w-full items-center gap-3 rounded-none border px-3 py-2.5 text-[var(--platform-ink)] sm:gap-4 sm:px-4',
                isWarning ? 'border-warning/35 bg-warning/10' : 'border-info/35 bg-info/10',
                glow &&
                    'border-[var(--platform-violet)]/40 bg-[var(--platform-paper)] shadow-[4px_4px_0_var(--platform-line)]',
                className,
            )}
        >
            <span
                className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center border',
                    isWarning
                        ? 'border-warning/35 bg-warning/15 text-amber-800 dark:text-amber-200'
                        : 'border-info/35 bg-info/15 text-blue-800 dark:text-blue-200',
                )}
                aria-hidden="true"
            >
                <Icon className="h-[1.125rem] w-[1.125rem]" />
            </span>
            <AlertDescription className="min-w-0 flex-1 break-words py-0.5 text-sm font-medium leading-5 text-current sm:text-[0.9375rem] sm:leading-6">
                {message}
            </AlertDescription>
            {dismissible && (
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="grid h-11 w-11 shrink-0 place-items-center self-center border border-transparent text-[var(--platform-ink-muted)] transition-colors duration-150 hover:border-[var(--platform-line-strong)] hover:bg-[var(--platform-paper)] hover:text-[var(--platform-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--platform-coral)] focus-visible:ring-offset-2"
                    aria-label={tCommon('close')}
                >
                    <XIcon className="h-5 w-5" aria-hidden="true" />
                </button>
            )}
        </Alert>
    );
}
