'use client';

import { useAppearance } from '@/components/providers/appearance-provider';
import { Toaster as Sonner, toast as sonnerToast } from 'sonner';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    const { resolvedColorMode } = useAppearance();

    return (
        <Sonner
            theme={resolvedColorMode}
            className="toaster group z-[1400]"
            position="top-right"
            offset={{ top: '5.25rem', right: '1rem' }}
            mobileOffset={{ top: '4.75rem', right: '1rem', left: '1rem' }}
            closeButton
            toastOptions={{
                classNames: {
                    toast: 'group toast group-[.toaster]:rounded-[var(--header-menu-radius)] group-[.toaster]:[border-width:var(--header-menu-border-width)] group-[.toaster]:border-[var(--header-line-strong)] group-[.toaster]:bg-[var(--header-surface)] group-[.toaster]:p-4 group-[.toaster]:pe-12 group-[.toaster]:text-[var(--header-ink)] group-[.toaster]:shadow-[var(--header-menu-shadow)]',
                    title: 'group-[.toast]:font-bold group-[.toast]:tracking-[-0.01em]',
                    description:
                        'group-[.toast]:leading-5 group-[.toast]:text-[var(--header-ink-muted)]',
                    closeButton:
                        '!left-auto !right-1 !top-1 !h-11 !w-11 !translate-x-0 !translate-y-0 group-[.toast]:rounded-[var(--header-radius)] group-[.toast]:border-0 group-[.toast]:bg-transparent group-[.toast]:text-current group-[.toast]:shadow-none group-[.toast]:hover:bg-[var(--header-surface-strong)] rtl:!left-1 rtl:!right-auto',
                    actionButton:
                        'group-[.toast]:min-h-11 group-[.toast]:rounded-[var(--header-radius)] group-[.toast]:bg-[var(--header-accent)] group-[.toast]:px-3 group-[.toast]:py-2 group-[.toast]:text-sm group-[.toast]:font-bold group-[.toast]:text-[var(--header-selected-ink)]',
                    cancelButton:
                        'group-[.toast]:min-h-11 group-[.toast]:rounded-[var(--header-radius)] group-[.toast]:border group-[.toast]:border-[var(--header-line-strong)] group-[.toast]:bg-transparent group-[.toast]:px-3 group-[.toast]:py-2 group-[.toast]:text-sm group-[.toast]:font-bold group-[.toast]:text-current',
                    success: 'group-[.toaster]:border-emerald-600/70',
                    error: 'group-[.toaster]:border-[oklch(0.62_0.16_32)]',
                    warning: 'group-[.toaster]:border-amber-600/70',
                    info: 'group-[.toaster]:border-sky-600/70',
                },
                duration: 4000,
            }}
            {...props}
        />
    );
};

// Enhanced toast helper functions with icons
const toast = {
    success: (message: string, description?: string) => {
        return sonnerToast.success(message, {
            description,
            icon: <CheckCircle2 className="h-5 w-5 text-success" />,
        });
    },
    error: (message: string, description?: string) => {
        return sonnerToast.error(message, {
            description,
            icon: <XCircle className="h-5 w-5 text-destructive" />,
        });
    },
    warning: (message: string, description?: string) => {
        return sonnerToast.warning(message, {
            description,
            icon: <AlertCircle className="h-5 w-5 text-warning" />,
        });
    },
    info: (message: string, description?: string) => {
        return sonnerToast.info(message, {
            description,
            icon: <Info className="h-5 w-5 text-info" />,
        });
    },
    message: (message: string, description?: string) => {
        return sonnerToast(message, {
            description,
        });
    },
    promise: <T,>(
        promise: Promise<T>,
        {
            loading,
            success,
            error,
        }: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: Error) => string);
        },
    ) => {
        return sonnerToast.promise(promise, {
            loading,
            success,
            error,
        });
    },
};

export { Toaster, toast };
