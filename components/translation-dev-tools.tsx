'use client';

import { useEffect } from 'react';
import {
    useTranslationCoverage,
    exposeTranslationDevTools,
} from '@/hooks/use-translation-coverage';

/**
 * Development-only component that provides translation debugging tools
 * Automatically logs coverage summary and exposes dev tools to window
 */
export function TranslationDevTools() {
    // Only render in development
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    // Log coverage summary on mount
    useTranslationCoverage({ enabled: true, detailed: false });

    // Expose dev tools to window
    useEffect(() => {
        exposeTranslationDevTools();
    }, []);

    return null;
}
