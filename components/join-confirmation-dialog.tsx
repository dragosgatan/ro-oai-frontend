'use client';

import { useTranslations } from 'next-intl';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Globe, ShieldAlert, Clock } from 'lucide-react';
import { platformSans } from '@/lib/platform-fonts';
import { cn } from '@/lib/utils';

interface JoinConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    competitionName: string;
}

/**
 * JoinConfirmationDialog - Displays a confirmation dialog before joining a competition
 * with DNS blocking enabled.
 *
 * This dialog explains:
 * - That internet access will be restricted (Requirement 3.2)
 * - Which website categories will be blocked (Requirement 3.3)
 * - That restrictions will be automatically removed when the competition ends (Requirement 3.4)
 */
export function JoinConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    competitionName,
}: JoinConfirmationDialogProps) {
    const t = useTranslations('joinConfirmation');

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent
                className={cn(
                    platformSans.className,
                    'max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto rounded-none border-2 border-[oklch(0.62_0.06_287)] bg-[oklch(0.978_0.014_292)] p-0 text-[oklch(0.22_0.055_282)] shadow-[8px_8px_0_oklch(0.43_0.235_291/0.24)] dark:border-[oklch(0.5_0.07_287)] dark:bg-[oklch(0.18_0.038_286)] dark:text-[oklch(0.94_0.016_292)]',
                )}
            >
                <AlertDialogHeader className="border-b border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] px-5 py-5 text-start dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)] sm:px-6">
                    <div className="flex items-start gap-4">
                        <span className="grid h-11 w-11 shrink-0 place-items-center bg-[oklch(0.72_0.18_32)] text-[oklch(0.2_0.045_282)] shadow-[3px_3px_0_oklch(0.43_0.235_291)]">
                            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <AlertDialogTitle className="text-xl font-bold tracking-[-0.025em]">
                                {t('title')}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="mt-1 text-sm leading-6 text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                                {t('description', { competitionName })}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="space-y-3 px-5 py-5 sm:px-6">
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                            {/* Internet Restrictions Explanation - Requirement 3.2 */}
                            <div className="flex items-start gap-3 border border-amber-500/40 bg-amber-400/10 p-3">
                                <Globe
                                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700 dark:text-amber-300"
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                                        {t('restrictions.title')}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-200">
                                        {t('restrictions.description')}
                                    </p>
                                </div>
                            </div>

                            {/* Blocked Categories Explanation - Requirement 3.3 */}
                            <div className="flex items-start gap-3 border border-red-500/40 bg-red-500/10 p-3">
                                <AlertTriangle
                                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-700 dark:text-red-300"
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="font-semibold text-red-900 dark:text-red-100">
                                        {t('blockedCategories.title')}
                                    </p>
                                    <ul className="mt-2 list-outside list-disc space-y-1 ps-5 text-sm leading-6 text-red-800 dark:text-red-200">
                                        <li>{t('blockedCategories.item1')}</li>
                                        <li>{t('blockedCategories.item2')}</li>
                                        <li>{t('blockedCategories.item3')}</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Automatic Removal Explanation - Requirement 3.4 */}
                            <div className="flex items-start gap-3 border border-sky-500/40 bg-sky-400/10 p-3">
                                <Clock
                                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-sky-700 dark:text-sky-300"
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="font-semibold text-sky-900 dark:text-sky-100">
                                        {t('automaticRemoval.title')}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-sky-800 dark:text-sky-200">
                                        {t('automaticRemoval.description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </div>
                <AlertDialogFooter className="border-t border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] px-5 py-4 dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)] sm:px-6">
                    <AlertDialogCancel className="min-h-11 rounded-none border-[oklch(0.62_0.06_287)] bg-transparent shadow-none dark:border-[oklch(0.5_0.07_287)]">
                        {t('cancel')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="min-h-11 rounded-none bg-[oklch(0.43_0.235_291)] font-semibold text-white shadow-none hover:bg-[oklch(0.36_0.22_291)] dark:bg-[oklch(0.72_0.19_292)] dark:text-[oklch(0.2_0.045_282)] dark:hover:bg-[oklch(0.77_0.17_292)]"
                    >
                        {t('acceptAndJoin')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
