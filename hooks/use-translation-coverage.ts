'use client';

import { useEffect } from 'react';
import { generateCoverageReport, logCoverageSummary } from '@/lib/i18n-coverage-report';

/**
 * Hook to automatically log translation coverage in development mode
 * Can be used in the root layout or a development-only component
 */
export function useTranslationCoverage(
    options: {
        enabled?: boolean;
        detailed?: boolean;
    } = {},
) {
    const { enabled = true, detailed = false } = options;

    useEffect(() => {
        if (!enabled || process.env.NODE_ENV !== 'development') return;

        // Run coverage check after a short delay to avoid blocking initial render
        const timeoutId = setTimeout(() => {
            if (detailed) {
                generateCoverageReport();
            } else {
                logCoverageSummary();
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [enabled, detailed]);
}

/**
 * Expose coverage report function to window for manual triggering in dev tools
 */
export function exposeTranslationDevTools(): void {
    if (process.env.NODE_ENV !== 'development') return;

    if (typeof window !== 'undefined') {
        (window as any).__i18n__ = {
            generateCoverageReport,
            logCoverageSummary,
        };

        console.debug(
            '%c[i18n] Dev Tools Available',
            'color: #10b981; font-weight: bold;',
            '\nRun __i18n__.generateCoverageReport() for detailed coverage analysis',
        );
    }
}
