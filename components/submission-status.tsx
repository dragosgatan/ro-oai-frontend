'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/i18n-formatting';
import type { Locale, Submission } from '@/lib/types';
import {
    AlertCircleIcon,
    CheckCircle2Icon,
    Clock3Icon,
    FileCheck2Icon,
    XCircleIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

type SubmissionStatusProps = {
    submission: Submission | undefined;
    error?: string;
    onCloseAction: () => void;
};

export function SubmissionStatus({ submission, error, onCloseAction }: SubmissionStatusProps) {
    const isSuccess = !!submission;
    const t = useTranslations('submissionStatus');
    const locale = useLocale() as Locale;

    return (
        <article>
            <header className="border-b border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] px-6 py-7 pe-12 text-center dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)]">
                <span
                    className={
                        isSuccess
                            ? 'mx-auto mb-4 grid h-14 w-14 place-items-center bg-[oklch(0.89_0.185_116)] text-[oklch(0.2_0.045_282)] shadow-[4px_4px_0_oklch(0.43_0.235_291)]'
                            : 'mx-auto mb-4 grid h-14 w-14 place-items-center bg-red-500/10 text-red-700 shadow-[4px_4px_0_oklch(0.72_0.18_32)] dark:text-red-300'
                    }
                    aria-hidden="true"
                >
                    {isSuccess ? (
                        <FileCheck2Icon className="h-7 w-7" />
                    ) : (
                        <XCircleIcon className="h-7 w-7" />
                    )}
                </span>
                <h2 className="text-xl font-bold tracking-[-0.03em]">
                    {isSuccess ? t('success') : t('failed')}
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                    {isSuccess ? t('successMessage') : t('failedMessage')}
                </p>
            </header>

            <div className="space-y-5 px-6 py-6">
                {isSuccess ? (
                    <Alert className="rounded-none border-emerald-700/30 bg-emerald-500/10">
                        <CheckCircle2Icon
                            className="h-4 w-4 text-emerald-700 dark:text-emerald-300"
                            aria-hidden="true"
                        />
                        <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                            {t('uploadSuccess')}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert variant="destructive" className="rounded-none bg-red-500/10">
                        <AlertCircleIcon className="h-4 w-4" aria-hidden="true" />
                        <AlertDescription>{error || t('uploadError')}</AlertDescription>
                    </Alert>
                )}

                {!!submission && (
                    <dl className="grid grid-cols-2 divide-x divide-[oklch(0.79_0.04_289)] border-y border-[oklch(0.79_0.04_289)] dark:divide-[oklch(0.34_0.055_287)] dark:border-[oklch(0.34_0.055_287)]">
                        <div className="px-3 py-3">
                            <dt className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                                {t('submissionId')}
                            </dt>
                            <dd className="mt-1 font-mono font-bold tabular-nums">
                                #{submission.id}
                            </dd>
                        </div>
                        <div className="px-3 py-3">
                            <dt className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                                {t('submittedAt')}
                            </dt>
                            <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                                <Clock3Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                {formatTime(submission.submittedAt, locale)}
                            </dd>
                        </div>
                    </dl>
                )}

                <Button
                    onClick={onCloseAction}
                    className={
                        isSuccess
                            ? 'min-h-11 w-full rounded-none bg-[oklch(0.43_0.235_291)] text-white hover:bg-[oklch(0.36_0.22_291)]'
                            : 'min-h-11 w-full rounded-none'
                    }
                    variant={isSuccess ? 'default' : 'secondary'}
                >
                    {t('close')}
                </Button>
            </div>
        </article>
    );
}
