'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Submission } from '@/lib/types';
import { SubmissionDetails } from '@/components/submission-details';
import type React from 'react';
import { useTranslations } from 'next-intl';
import { platformSans } from '@/lib/platform-fonts';
import { cn } from '@/lib/utils';

interface SubmissionDetailsModalProps {
    submission: Submission;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SubmissionDetailsModal({
    submission,
    open,
    onOpenChange,
}: SubmissionDetailsModalProps) {
    const t = useTranslations('submissionDetails');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    platformSans.className,
                    'max-h-[92dvh] overflow-y-auto rounded-none border-2 border-[oklch(0.62_0.06_287)] bg-[oklch(0.978_0.014_292)] p-0 text-[oklch(0.22_0.055_282)] shadow-[8px_8px_0_oklch(0.43_0.235_291/0.24)] dark:border-[oklch(0.5_0.07_287)] dark:bg-[oklch(0.18_0.038_286)] dark:text-[oklch(0.94_0.016_292)] sm:max-w-4xl [&>button]:grid [&>button]:h-11 [&>button]:w-11 [&>button]:place-items-center [&>button]:rounded-none',
                )}
            >
                <DialogTitle className="sr-only">{t('title')}</DialogTitle>
                <SubmissionDetails submission={submission} onClose={() => onOpenChange(false)} />
            </DialogContent>
        </Dialog>
    );
}
