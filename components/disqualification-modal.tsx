'use client';

import { useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Calendar, Trophy, FileWarning } from 'lucide-react';
import { platformSans } from '@/lib/platform-fonts';
import { cn } from '@/lib/utils';

/**
 * Props for the DisqualificationModal component
 */
export interface DisqualificationModalProps {
    /** Whether the modal is open */
    open: boolean;
    /** Competition name for display */
    competitionName: string;
    /** Reason for disqualification */
    reason: string;
    /** Timestamp when disqualification occurred */
    timestamp: string;
    /** Callback when user acknowledges the disqualification */
    onAcknowledge: () => void;
}

/**
 * DisqualificationModal component displays a modal when a participant is disqualified.
 *
 * This modal:
 * - Cannot be dismissed without acknowledgment (AlertDialog by default requires action)
 * - Displays warning icon and red styling to indicate severity
 * - Shows competition name, reason, and timestamp
 * - Requires acknowledgment button to dismiss
 * - Blocks background interaction
 *
 * Requirements: 9.1, 9.2, 9.5
 * - Display modal popup that cannot be dismissed without acknowledgment
 * - Display competition name, reason for disqualification, and timestamp
 * - Style distinctively with red border and warning icon
 */
export function DisqualificationModal({
    open,
    competitionName,
    reason,
    timestamp,
    onAcknowledge,
}: DisqualificationModalProps) {
    const t = useTranslations('antiCheat.disqualificationModal');
    const locale = useLocale();

    // Format the timestamp for display
    const formattedTimestamp = new Date(timestamp).toLocaleString(locale);

    const handleAcknowledge = useCallback(() => {
        onAcknowledge();
    }, [onAcknowledge]);

    return (
        <AlertDialog open={open}>
            <AlertDialogContent
                className={cn(
                    platformSans.className,
                    'max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto rounded-none border-2 border-red-600 bg-[oklch(0.978_0.014_292)] p-0 text-[oklch(0.22_0.055_282)] shadow-[8px_8px_0_oklch(0.72_0.18_32/0.28)] dark:border-red-500 dark:bg-[oklch(0.18_0.038_286)] dark:text-[oklch(0.94_0.016_292)]',
                )}
            >
                <AlertDialogHeader className="border-b border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] px-5 py-5 text-start dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)] sm:px-6">
                    <div className="flex items-start gap-4">
                        <span className="grid h-12 w-12 shrink-0 place-items-center bg-red-600 text-white shadow-[3px_3px_0_oklch(0.43_0.235_291)] dark:bg-red-500 dark:text-red-950">
                            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <AlertDialogTitle className="text-xl font-bold tracking-[-0.025em] text-red-800 dark:text-red-300">
                                {t('title')}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="mt-1 text-sm leading-6 text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                                {t('description')}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="space-y-5 px-5 py-5 sm:px-6">
                    <dl className="border border-[oklch(0.79_0.04_289)] dark:border-[oklch(0.34_0.055_287)]">
                        <DetailRow
                            icon={Trophy}
                            label={t('competitionLabel')}
                            value={competitionName}
                        />
                        <DetailRow icon={FileWarning} label={t('reasonLabel')} value={reason} />
                        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 px-4 py-3">
                            <Calendar
                                className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400"
                                aria-hidden="true"
                            />
                            <div className="min-w-0">
                                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                                    {t('timestampLabel')}
                                </dt>
                                <dd className="mt-1 text-sm text-[oklch(0.22_0.055_282)] dark:text-[oklch(0.94_0.016_292)]">
                                    <time dateTime={timestamp}>{formattedTimestamp}</time>
                                </dd>
                            </div>
                        </div>
                    </dl>

                    <p className="border border-red-500/45 bg-red-500/10 px-4 py-3 text-sm font-semibold leading-6 text-red-800 dark:text-red-200">
                        {t('warningMessage')}
                    </p>

                    <p className="text-sm leading-6 text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                        {t('contactSupport')}
                    </p>
                </div>

                <AlertDialogFooter className="border-t border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] px-5 py-4 dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)] sm:px-6">
                    <AlertDialogAction
                        onClick={handleAcknowledge}
                        className="min-h-11 w-full rounded-none bg-red-600 font-semibold text-white shadow-none hover:bg-red-700 dark:bg-red-500 dark:text-red-950 dark:hover:bg-red-400"
                    >
                        {t('acknowledgeButton')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function DetailRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Trophy;
    label: string;
    value: string;
}) {
    return (
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-[oklch(0.79_0.04_289)] px-4 py-3 dark:border-[oklch(0.34_0.055_287)]">
            <Icon className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
            <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                    {label}
                </dt>
                <dd className="mt-1 break-words text-sm leading-6 text-[oklch(0.22_0.055_282)] dark:text-[oklch(0.94_0.016_292)]">
                    {value}
                </dd>
            </div>
        </div>
    );
}

export default DisqualificationModal;
