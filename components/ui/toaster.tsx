'use client';

import { useTranslations } from 'next-intl';

import { useToast } from '@/hooks/use-toast';
import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
} from '@/components/ui/toast';

export function Toaster() {
    const { toasts } = useToast();
    const t = useTranslations('common');

    return (
        <ToastProvider>
            {toasts.map(function ({ id, title, description, action, ...props }) {
                return (
                    <Toast key={id} {...props}>
                        <div className="min-w-0 space-y-1">
                            {title && <ToastTitle>{title}</ToastTitle>}
                            {description && <ToastDescription>{description}</ToastDescription>}
                        </div>
                        {action}
                        <ToastClose aria-label={t('close')} />
                    </Toast>
                );
            })}
            <ToastViewport />
        </ToastProvider>
    );
}
