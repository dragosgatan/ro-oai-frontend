'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

function StatusPillInner({ startIso, endIso }: { startIso: string; endIso: string }) {
    const t = useTranslations('competitions.status');
    const now = new Date();
    const start = new Date(startIso);
    const end = new Date(endIso);

    if (now < start) {
        return (
            <Badge
                variant="outline"
                className="min-h-7 whitespace-nowrap rounded-none border-lime-600/40 bg-lime-300/45 px-2.5 text-xs font-semibold text-lime-950 shadow-none dark:border-lime-400/40 dark:bg-lime-400/20 dark:text-lime-100"
                aria-label={t('future')}
            >
                {t('future')}
            </Badge>
        );
    }
    if (now > end) {
        return (
            <Badge
                variant="outline"
                className="min-h-7 whitespace-nowrap rounded-none border-slate-500/35 bg-slate-500/10 px-2.5 text-xs font-semibold text-slate-700 shadow-none dark:border-slate-400/40 dark:bg-slate-300/10 dark:text-slate-200"
                aria-label={t('ended')}
            >
                {t('ended')}
            </Badge>
        );
    }
    return (
        <Badge
            variant="outline"
            className="min-h-7 whitespace-nowrap rounded-none border-orange-600/35 bg-orange-400/20 px-2.5 text-xs font-semibold text-orange-800 shadow-none dark:border-orange-400/40 dark:bg-orange-400/20 dark:text-orange-100"
            aria-label={t('ongoing')}
        >
            {t('ongoing')}
        </Badge>
    );
}

export default StatusPillInner;
