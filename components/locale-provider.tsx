'use client';

import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';

import { TranslationErrorBoundary } from '@/components/translation-error-boundary';

interface LocaleProviderProps {
    children: ReactNode;
    messages: Record<string, any>;
    locale: string;
}

/** The URL-backed server payload is authoritative; route changes replace this provider. */
export function LocaleProvider({ children, messages, locale }: LocaleProviderProps) {
    const serverError = messages.errors?.serverError ?? {};
    const errorCopy = {
        title: serverError.title ?? 'Something went wrong',
        heading: serverError.heading ?? 'Something went wrong',
        description: serverError.description ?? 'The page could not be displayed.',
        suggestion: serverError.suggestion ?? 'Reload the page to try again.',
        tryAgain: serverError.tryAgain ?? 'Try again',
        goHome: serverError.goHome ?? 'Go to homepage',
        loading: messages.common?.loading ?? 'Loading…',
    };

    return (
        <TranslationErrorBoundary locale={locale} copy={errorCopy}>
            <NextIntlClientProvider
                messages={messages}
                locale={locale}
                timeZone="Europe/Bucharest"
                onError={(error) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('[i18n] Translation error:', error);
                    }
                }}
            >
                {children}
            </NextIntlClientProvider>
        </TranslationErrorBoundary>
    );
}
