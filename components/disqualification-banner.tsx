'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocale } from '@/hooks/use-locale';
import { formatDateTime } from '@/lib/i18n-formatting';

interface DisqualificationBannerProps {
    reason: string | null | undefined;
    disqualifiedAt: string | null | undefined;
    className?: string;
}

/**
 * Banner component to display disqualification status persistently.
 * Shows in description and problems tabs when a participant is disqualified.
 */
export function DisqualificationBanner({
    reason,
    disqualifiedAt,
    className = '',
}: DisqualificationBannerProps) {
    const t = useTranslations('antiCheat.disqualification');
    const { locale } = useLocale();

    return (
        <div
            className={`mb-6 border-2 border-red-500 bg-red-50 p-4 shadow-[4px_4px_0_rgb(239_68_68_/_0.2)] dark:bg-red-950/30 ${className}`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">
                        {t('bannerTitle')}
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400">
                        {t('bannerDescription')}
                    </p>
                    {reason && (
                        <div className="mt-2 border border-red-500/25 bg-red-100 p-3 dark:bg-red-900/30">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                {t('reason')}: {reason}
                            </p>
                        </div>
                    )}
                    {disqualifiedAt && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-2">
                            {t('disqualifiedAt')}:{' '}
                            {formatDateTime(new Date(disqualifiedAt), locale)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DisqualificationBanner;
