'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { getProblemContent, type TranslatableProblem } from '@/lib/problem-translations';
import type { Locale, Submission } from '@/lib/types';
import { cn } from '@/lib/utils';
import { BarChart3Icon, CheckCircle2Icon, DownloadIcon, LogsIcon, XIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

type SubmissionDetailsProps = {
    submission: Submission;
    onClose: () => void;
};

function metricValue(value: number | string | null | undefined, fallback: string) {
    return value === null || value === undefined ? fallback : String(value);
}

export function SubmissionDetails({ submission, onClose }: SubmissionDetailsProps) {
    const t = useTranslations('submissionDetails');
    const tCommon = useTranslations('common');
    const locale = useLocale() as Locale;
    const problemContent = getProblemContent(submission as unknown as TranslatableProblem, locale);
    const hasLogs = submission.stdout !== null || submission.stderr !== null;
    const hasSubtasks =
        !!submission.subtasksNames?.length &&
        !!submission.subtasks &&
        submission.subtasks.length > 0;
    const tabCount = 1 + (hasLogs ? 1 : 0) + (hasSubtasks ? 1 : 0);
    const statusLabel =
        submission.status === 'EVALUATED'
            ? t('evaluated')
            : submission.status === 'ERROR'
              ? t('error')
              : submission.status === 'PROCESSING'
                ? t('processing')
                : submission.status;

    return (
        <article className="min-w-0">
            <header className="border-b border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] px-5 py-5 pe-12 dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)] sm:px-7">
                <p className="mb-2 font-mono text-xs font-bold tracking-[0.1em] text-[oklch(0.43_0.235_291)] dark:text-[oklch(0.72_0.19_292)]">
                    #{submission.id}
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-xl font-bold tracking-[-0.03em] sm:text-2xl">
                            {t('title')}
                        </h2>
                        <p
                            className="mt-1 truncate text-sm text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]"
                            dir="auto"
                        >
                            {problemContent.title}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {submission.signedSourceFileUrl && (
                            <Button
                                asChild
                                className="min-h-11 rounded-none bg-[oklch(0.43_0.235_291)] px-4 text-white hover:bg-[oklch(0.36_0.22_291)]"
                            >
                                <a
                                    href={submission.signedSourceFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                >
                                    <DownloadIcon className="me-2 h-4 w-4" aria-hidden="true" />
                                    {t('downloadSource')}
                                </a>
                            </Button>
                        )}
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="min-h-11 rounded-none border-[oklch(0.62_0.06_287)] bg-transparent px-4 dark:border-[oklch(0.5_0.07_287)]"
                        >
                            <XIcon className="me-2 h-4 w-4" aria-hidden="true" />
                            {t('close')}
                        </Button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 border-b border-[oklch(0.79_0.04_289)] dark:border-[oklch(0.34_0.055_287)] sm:grid-cols-3">
                <div className="border-b border-[oklch(0.79_0.04_289)] px-5 py-4 dark:border-[oklch(0.34_0.055_287)] sm:border-b-0 sm:border-e sm:px-7">
                    <p className="text-xs font-bold uppercase tracking-[0.09em] text-muted-foreground">
                        {t('score')}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[oklch(0.43_0.235_291)] dark:text-[oklch(0.72_0.19_292)]">
                        {submission.score?.toFixed(2) ?? tCommon('na')}
                    </p>
                </div>
                <div className="border-b border-[oklch(0.79_0.04_289)] px-5 py-4 dark:border-[oklch(0.34_0.055_287)] sm:border-b-0 sm:border-e sm:px-7">
                    <p className="text-xs font-bold uppercase tracking-[0.09em] text-muted-foreground">
                        {t('finalScore')}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[oklch(0.43_0.235_291)] dark:text-[oklch(0.72_0.19_292)]">
                        {submission.finalScore?.toFixed(2) ?? tCommon('na')}
                    </p>
                </div>
                <div className="px-5 py-4 sm:px-7">
                    <p className="text-xs font-bold uppercase tracking-[0.09em] text-muted-foreground">
                        {t('state')}
                    </p>
                    <Badge
                        variant="outline"
                        className="mt-2 min-h-7 rounded-none border-[oklch(0.62_0.06_287)] bg-transparent font-mono text-xs dark:border-[oklch(0.5_0.07_287)]"
                    >
                        <CheckCircle2Icon className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        {statusLabel}
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="details" className="p-5 sm:p-7">
                <TabsList
                    className={cn(
                        'grid h-auto min-h-12 w-full rounded-none border border-[oklch(0.62_0.06_287)] bg-[oklch(0.952_0.026_292)] p-1 dark:border-[oklch(0.5_0.07_287)] dark:bg-[oklch(0.215_0.046_286)]',
                        tabCount === 1
                            ? 'grid-cols-1'
                            : tabCount === 2
                              ? 'grid-cols-2'
                              : 'grid-cols-3',
                    )}
                >
                    <TabsTrigger
                        value="details"
                        className="min-h-11 rounded-none data-[state=active]:bg-[oklch(0.43_0.235_291)] data-[state=active]:text-white"
                    >
                        <BarChart3Icon className="me-2 h-4 w-4" aria-hidden="true" />
                        <span className="sr-only sm:not-sr-only">{t('details')}</span>
                    </TabsTrigger>
                    {hasLogs && (
                        <TabsTrigger
                            value="logs"
                            className="min-h-11 rounded-none data-[state=active]:bg-[oklch(0.43_0.235_291)] data-[state=active]:text-white"
                        >
                            <LogsIcon className="me-2 h-4 w-4" aria-hidden="true" />
                            <span className="sr-only sm:not-sr-only">{t('logs')}</span>
                        </TabsTrigger>
                    )}
                    {hasSubtasks && (
                        <TabsTrigger
                            value="subtasks"
                            className="min-h-11 rounded-none data-[state=active]:bg-[oklch(0.43_0.235_291)] data-[state=active]:text-white"
                        >
                            <CheckCircle2Icon className="me-2 h-4 w-4" aria-hidden="true" />
                            <span className="sr-only sm:not-sr-only">{t('subtasks')}</span>
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="details" className="mt-5 focus-visible:outline-none">
                    <section className="border border-[oklch(0.79_0.04_289)] dark:border-[oklch(0.34_0.055_287)]">
                        <div className="border-b border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] px-4 py-3 dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)]">
                            <h3 className="font-semibold">{t('details')}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('detailedMetrics')}
                            </p>
                        </div>
                        <dl className="divide-y divide-[oklch(0.79_0.04_289)] dark:divide-[oklch(0.34_0.055_287)]">
                            {submission.metric !== undefined && submission.metric !== null && (
                                <div className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr]">
                                    <dt className="text-sm text-muted-foreground">{t('metric')}</dt>
                                    <dd className="font-mono text-sm tabular-nums">
                                        {metricValue(submission.metric, tCommon('na'))}
                                    </dd>
                                </div>
                            )}
                            {submission.finalMetric !== undefined &&
                                submission.finalMetric !== null && (
                                    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr]">
                                        <dt className="text-sm text-muted-foreground">
                                            {t('finalMetric')}
                                        </dt>
                                        <dd className="font-mono text-sm tabular-nums">
                                            {metricValue(submission.finalMetric, tCommon('na'))}
                                        </dd>
                                    </div>
                                )}
                            {!!submission.evaluationMessage && (
                                <div className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr]">
                                    <dt className="text-sm text-muted-foreground">
                                        {t('evaluationMessage')}
                                    </dt>
                                    <dd className="text-sm leading-6" dir="auto">
                                        {submission.evaluationMessage}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </section>
                </TabsContent>

                {hasLogs && (
                    <TabsContent value="logs" className="mt-5 space-y-4 focus-visible:outline-none">
                        {submission.stdout !== null && (
                            <section>
                                <h3 className="mb-2 text-sm font-semibold">{t('stdout')}</h3>
                                <pre
                                    className="max-h-72 overflow-auto border border-[oklch(0.62_0.06_287)] bg-[oklch(0.22_0.055_282)] p-4 text-xs leading-6 text-[oklch(0.94_0.016_292)]"
                                    dir="ltr"
                                >
                                    <code>{submission.stdout || t('noOutput')}</code>
                                </pre>
                            </section>
                        )}
                        {submission.stderr !== null && (
                            <section>
                                <h3 className="mb-2 text-sm font-semibold">{t('stderr')}</h3>
                                <pre
                                    className="max-h-72 overflow-auto border border-red-500/35 bg-[oklch(0.22_0.055_282)] p-4 text-xs leading-6 text-[oklch(0.94_0.016_292)]"
                                    dir="ltr"
                                >
                                    <code>{submission.stderr || t('noErrors')}</code>
                                </pre>
                            </section>
                        )}
                    </TabsContent>
                )}

                {hasSubtasks && (
                    <TabsContent value="subtasks" className="mt-5 focus-visible:outline-none">
                        <section className="border border-[oklch(0.79_0.04_289)] dark:border-[oklch(0.34_0.055_287)]">
                            <h3 className="border-b border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] px-4 py-3 font-semibold dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)]">
                                {t('subtaskResults')}
                            </h3>
                            <div className="overflow-x-auto">
                                <Table className="min-w-[760px]">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('subtaskName')}</TableHead>
                                            <TableHead>{t('metricName')}</TableHead>
                                            <TableHead>{t('metric')}</TableHead>
                                            <TableHead>{t('finalMetric')}</TableHead>
                                            <TableHead>{t('score')}</TableHead>
                                            <TableHead>{t('finalScore')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {submission.subtasks?.map((subtask, index) => {
                                            const names = submission.subtasksNames?.[index];
                                            return (
                                                <TableRow key={names?.subtaskName ?? index}>
                                                    <TableCell>
                                                        {names?.subtaskName ??
                                                            t('subtask') + ' ' + (index + 1)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {names?.metricName ??
                                                            t('metric') + ' ' + (index + 1)}
                                                    </TableCell>
                                                    <TableCell className="font-mono tabular-nums">
                                                        {metricValue(subtask.metric, tCommon('na'))}
                                                    </TableCell>
                                                    <TableCell className="font-mono tabular-nums">
                                                        {metricValue(
                                                            subtask.finalMetric,
                                                            tCommon('na'),
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-mono font-semibold tabular-nums">
                                                        {subtask.score?.toFixed(2) ?? tCommon('na')}
                                                    </TableCell>
                                                    <TableCell className="font-mono font-semibold tabular-nums">
                                                        {subtask.finalScore?.toFixed(2) ??
                                                            tCommon('na')}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </section>
                    </TabsContent>
                )}
            </Tabs>
        </article>
    );
}
