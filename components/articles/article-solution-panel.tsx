'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    CalendarDays,
    Check,
    ChevronDown,
    Clipboard,
    Code2,
    Download,
    FileCode2,
    Loader2,
    ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
    ArticleSourcePreviewError,
    canPreviewArticleSource,
    loadArticleSourcePreview,
    type ArticleSharedSubmission,
    type ArticleSourcePreview,
} from '@/lib/articles';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Locale } from '@/lib/types';

type PreviewState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; preview: ArticleSourcePreview }
    | { status: 'error'; reason: 'binary' | 'tooLarge' | 'unavailable' };

function formatDate(value: string, locale: Locale): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Bucharest',
    }).format(date);
}

function formatScore(value: number, locale: Locale): string {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(value);
}

export function ArticleSolutionPanel({
    submission,
    locale,
}: {
    submission: ArticleSharedSubmission;
    locale: Locale;
}) {
    const t = useTranslations('articles.detail.solution');
    const [open, setOpen] = useState(false);
    const [previewState, setPreviewState] = useState<PreviewState>({ status: 'idle' });
    const [copied, setCopied] = useState(false);
    const requestedSourceRef = useRef<string | null>(null);
    const fileName = submission.sourceFileName ?? t('fileFallback');
    const canPreview = Boolean(submission.sourceDownloadUrl && canPreviewArticleSource(fileName));
    const sourceRegionId = `article-solution-source-${submission.id}`;

    useEffect(() => {
        setOpen(false);
        setPreviewState({ status: 'idle' });
        setCopied(false);
        requestedSourceRef.current = null;
    }, [submission.id, submission.sourceDownloadUrl]);

    useEffect(() => {
        if (
            !open ||
            !canPreview ||
            !submission.sourceDownloadUrl ||
            requestedSourceRef.current === submission.sourceDownloadUrl
        ) {
            return;
        }

        let active = true;
        let settled = false;
        const requestedUrl = submission.sourceDownloadUrl;
        requestedSourceRef.current = submission.sourceDownloadUrl;
        setPreviewState({ status: 'loading' });
        void loadArticleSourcePreview(submission.sourceDownloadUrl, fileName)
            .then((preview) => {
                if (active) setPreviewState({ status: 'ready', preview });
            })
            .catch((caught: unknown) => {
                if (!active) return;
                setPreviewState({
                    status: 'error',
                    reason:
                        caught instanceof ArticleSourcePreviewError ? caught.reason : 'unavailable',
                });
            })
            .finally(() => {
                settled = true;
            });

        return () => {
            active = false;
            if (!settled && requestedSourceRef.current === requestedUrl) {
                requestedSourceRef.current = null;
            }
        };
    }, [canPreview, fileName, open, submission.sourceDownloadUrl]);

    const copySource = useMemo(() => {
        if (previewState.status !== 'ready') return '';
        return previewState.preview.kind === 'notebook'
            ? previewState.preview.copySource
            : previewState.preview.source;
    }, [previewState]);

    const handleCopy = async () => {
        if (!copySource) return;
        try {
            await navigator.clipboard.writeText(copySource);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    return (
        <Collapsible open={open} onOpenChange={setOpen} asChild>
            <section
                className="overflow-hidden border border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
                aria-labelledby="article-solution-heading"
            >
                <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
                    <span className="grid h-12 w-12 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                        <Code2 className="h-5 w-5" aria-hidden="true" />
                    </span>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-violet)]">
                                {t('eyebrow')}
                            </p>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--platform-ink-muted)]">
                                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                {t('sharedWithConsent')}
                            </span>
                        </div>
                        <h2
                            id="article-solution-heading"
                            className="mt-2 text-xl font-bold tracking-[-0.03em] text-[var(--platform-ink)]"
                        >
                            {t('title')}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--platform-ink-muted)]">
                            <span className="font-mono font-bold text-[var(--platform-ink)]">
                                {t('submission', { id: submission.id })}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                                <time dateTime={submission.submittedAt}>
                                    {formatDate(submission.submittedAt, locale)}
                                </time>
                            </span>
                            {submission.score !== null ? (
                                <span>
                                    {t('score', {
                                        value: formatScore(submission.score, locale),
                                    })}
                                </span>
                            ) : null}
                            {submission.metric !== null ? (
                                <span>{t('metric', { value: String(submission.metric) })}</span>
                            ) : null}
                        </div>
                        <p
                            className="mt-3 flex min-w-0 items-center gap-2 text-sm text-[var(--platform-ink-muted)]"
                            dir="ltr"
                        >
                            <FileCode2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="truncate">{fileName}</span>
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                        {canPreview ? (
                            <CollapsibleTrigger asChild>
                                <button
                                    type="button"
                                    aria-controls={sourceRegionId}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-4 text-sm font-bold text-white hover:bg-[var(--platform-violet-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-on-accent)]"
                                >
                                    <Code2 className="h-4 w-4" aria-hidden="true" />
                                    {open ? t('hideSource') : t('viewSource')}
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
                                        aria-hidden="true"
                                    />
                                </button>
                            </CollapsibleTrigger>
                        ) : null}
                        {submission.sourceDownloadUrl ? (
                            <a
                                href={submission.sourceDownloadUrl}
                                download={submission.sourceFileName ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                referrerPolicy="no-referrer"
                                className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 text-sm font-bold text-[var(--platform-ink)] hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                            >
                                <Download className="h-4 w-4" aria-hidden="true" />
                                {t('download')}
                            </a>
                        ) : null}
                    </div>
                </div>

                {!canPreview ? (
                    <p className="border-t border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-5 py-3 text-xs leading-5 text-[var(--platform-ink-muted)] sm:px-6">
                        {t('downloadOnly')}
                    </p>
                ) : null}

                {canPreview ? (
                    <CollapsibleContent
                        id={sourceRegionId}
                        className="border-t border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)]"
                    >
                        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-[var(--platform-line)] px-4 py-2 sm:px-5">
                            <p className="text-sm font-bold text-[var(--platform-ink)]">
                                {t('previewTitle')}
                            </p>
                            {previewState.status === 'ready' ? (
                                <button
                                    type="button"
                                    onClick={() => void handleCopy()}
                                    className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-bold text-[var(--platform-violet-strong)] hover:bg-[var(--platform-paper)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)]"
                                    aria-live="polite"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4" aria-hidden="true" />
                                    ) : (
                                        <Clipboard className="h-4 w-4" aria-hidden="true" />
                                    )}
                                    {copied ? t('copied') : t('copy')}
                                </button>
                            ) : null}
                        </div>

                        {previewState.status === 'idle' || previewState.status === 'loading' ? (
                            <div
                                className="flex min-h-52 items-center justify-center gap-3 px-5 py-10 text-sm text-[var(--platform-ink-muted)]"
                                role="status"
                            >
                                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                                {t('loading')}
                            </div>
                        ) : previewState.status === 'error' ? (
                            <div className="px-5 py-8" role="status">
                                <p className="font-bold text-[var(--platform-ink)]">
                                    {t('previewUnavailableTitle')}
                                </p>
                                <p className="mt-1 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                                    {t(`errors.${previewState.reason}`)}
                                </p>
                            </div>
                        ) : previewState.preview.kind === 'notebook' ? (
                            <div
                                className="max-h-[65dvh] space-y-4 overflow-auto p-4 sm:p-5"
                                dir="ltr"
                            >
                                {previewState.preview.cells.map((cell, index) => (
                                    <section
                                        key={`${cell.type}-${index}`}
                                        className="border border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
                                    >
                                        <h3 className="border-b border-[var(--platform-line)] px-3 py-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--platform-ink-muted)]">
                                            {cell.type === 'code'
                                                ? t('notebook.codeCell', {
                                                      number: index + 1,
                                                  })
                                                : t('notebook.markdownCell', {
                                                      number: index + 1,
                                                  })}
                                        </h3>
                                        <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-[var(--platform-ink)]">
                                            <code>{cell.source || t('notebook.emptyCell')}</code>
                                        </pre>
                                    </section>
                                ))}
                            </div>
                        ) : (
                            <pre
                                className="max-h-[65dvh] overflow-auto p-5 font-mono text-xs leading-6 text-[var(--platform-ink)]"
                                dir="ltr"
                            >
                                <code>{previewState.preview.source}</code>
                            </pre>
                        )}
                    </CollapsibleContent>
                ) : null}
            </section>
        </Collapsible>
    );
}
