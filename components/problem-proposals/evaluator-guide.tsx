'use client';

import { useState } from 'react';
import {
    ArrowLeft,
    Check,
    Clipboard,
    Clock3,
    Code2,
    FileCheck2,
    LockKeyhole,
    ShieldAlert,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PlatformPageShell } from '@/components/platform-page-shell';
import { Link } from '@/i18n/routing';
import type { EvaluatorContract } from '@/lib/problem-proposals';

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

export function EvaluatorGuide({ contract }: { contract: EvaluatorContract }) {
    const t = useTranslations('problemProposals.guide');
    const [copied, setCopied] = useState(false);

    const copyTemplate = async () => {
        await navigator.clipboard.writeText(contract.template);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <PlatformPageShell contentClassName="space-y-10 md:space-y-14">
            <header className="border-b border-[var(--platform-line-strong)] pb-9">
                <Link
                    href="/problem-proposals"
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 dark:text-[var(--platform-violet)]"
                >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                    {t('back')}
                </Link>
                <p className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[var(--platform-violet)]">
                    <Code2 className="h-4 w-4" aria-hidden="true" />
                    {t('eyebrow', { version: contract.contractVersion })}
                </p>
                <h1 className="mt-4 max-w-[16ch] text-balance text-4xl font-bold leading-[1.02] tracking-[-0.05em] text-[var(--platform-ink)] sm:text-5xl">
                    {t('title')}
                </h1>
                <p className="mt-5 max-w-[70ch] text-base leading-7 text-[var(--platform-ink-muted)] sm:text-lg">
                    {t('description')}
                </p>
            </header>

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
                <main className="min-w-0 space-y-12">
                    <section aria-labelledby="evaluator-contract-title">
                        <div className="border-b border-[var(--platform-line)] pb-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-violet)]">
                                01
                            </p>
                            <h2
                                id="evaluator-contract-title"
                                className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                            >
                                {t('contract.title')}
                            </h2>
                        </div>
                        <dl className="mt-6 divide-y divide-[var(--platform-line)] border-y border-[var(--platform-line-strong)]">
                            <div className="grid gap-2 py-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
                                <dt className="text-sm font-bold text-[var(--platform-ink)]">
                                    {t('contract.hash')}
                                </dt>
                                <dd className="break-all font-mono text-xs leading-5 text-[var(--platform-ink-muted-strong)]">
                                    {contract.contractHash}
                                </dd>
                            </div>
                            <div className="grid gap-2 py-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
                                <dt className="text-sm font-bold text-[var(--platform-ink)]">
                                    {t('contract.entrypoint')}
                                </dt>
                                <dd className="font-mono text-sm text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]">
                                    {contract.functionSignature}
                                </dd>
                            </div>
                            <div className="grid gap-2 py-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
                                <dt className="text-sm font-bold text-[var(--platform-ink)]">
                                    {t('contract.returns')}
                                </dt>
                                <dd className="text-sm leading-6 text-[var(--platform-ink-muted)]">
                                    {contract.returnDescription}
                                </dd>
                            </div>
                            <div className="grid gap-2 py-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
                                <dt className="text-sm font-bold text-[var(--platform-ink)]">
                                    {t('contract.subtasks')}
                                </dt>
                                <dd className="font-mono text-sm text-[var(--platform-ink-muted-strong)]">
                                    {contract.subtaskFunctionPattern}
                                </dd>
                            </div>
                            <div className="grid gap-2 py-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
                                <dt className="text-sm font-bold text-[var(--platform-ink)]">
                                    {t('contract.routing')}
                                </dt>
                                <dd className="font-mono text-sm text-[var(--platform-ink-muted-strong)]">
                                    {contract.routingFlag}
                                </dd>
                            </div>
                        </dl>
                        <div className="mt-6">
                            <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--platform-ink)]">
                                {t('contract.signatures')}
                            </h3>
                            <ol className="mt-3 grid gap-3 sm:grid-cols-2">
                                {contract.signatures.map((signature, index) => (
                                    <li
                                        key={signature.signature}
                                        className="border border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-3"
                                    >
                                        <p className="text-xs font-bold text-[var(--platform-ink-muted)]">
                                            {t('contract.signatureCase', {
                                                number: index + 1,
                                                submission: t(
                                                    `contract.inputKind.${signature.submission}`,
                                                ),
                                                groundTruth: t(
                                                    `contract.inputKind.${signature.groundTruth}`,
                                                ),
                                            })}
                                        </p>
                                        <code className="mt-2 block overflow-x-auto font-mono text-xs leading-5 text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]">
                                            {signature.signature}
                                        </code>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </section>

                    <section aria-labelledby="evaluator-template-title">
                        <div className="flex flex-col gap-4 border-b border-[var(--platform-line)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-violet)]">
                                    02
                                </p>
                                <h2
                                    id="evaluator-template-title"
                                    className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                                >
                                    {t('template.title')}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => void copyTemplate()}
                                className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 text-sm font-bold text-[var(--platform-ink)] hover:border-[var(--platform-violet)]"
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                    <Clipboard className="h-4 w-4" aria-hidden="true" />
                                )}
                                {copied ? t('template.copied') : t('template.copy')}
                            </button>
                        </div>
                        <pre className="mt-6 max-h-[36rem] overflow-auto border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4 text-sm leading-6 text-[var(--platform-ink)] shadow-[5px_5px_0_var(--platform-line)]">
                            <code>{contract.template}</code>
                        </pre>
                    </section>

                    <section aria-labelledby="evaluator-files-title">
                        <div className="border-b border-[var(--platform-line)] pb-4">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-violet)]">
                                03
                            </p>
                            <h2
                                id="evaluator-files-title"
                                className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                            >
                                {t('files.title')}
                            </h2>
                        </div>
                        <ol className="mt-6 divide-y divide-[var(--platform-line)] border-y border-[var(--platform-line-strong)]">
                            {(
                                [
                                    'dataset',
                                    'evaluator',
                                    'groundTruth',
                                    'sample',
                                    'reference',
                                ] as const
                            ).map((key, index) => (
                                <li
                                    key={key}
                                    className="grid gap-3 py-5 sm:grid-cols-[3rem_minmax(0,1fr)]"
                                >
                                    <span className="font-mono text-sm font-bold text-[var(--platform-violet)]">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <div>
                                        <h3 className="font-bold text-[var(--platform-ink)]">
                                            {t(`files.${key}.title`)}
                                            {key === 'reference' ? (
                                                <span className="ms-2 border border-[var(--platform-line-strong)] px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[var(--platform-ink-muted)]">
                                                    {t('files.optional')}
                                                </span>
                                            ) : null}
                                        </h3>
                                        <p className="mt-1 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                            {t(`files.${key}.description`)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        {contract.localTestCommand ? (
                            <div className="mt-5 border border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--platform-ink)]">
                                    {t('files.localTest')}
                                </p>
                                <code className="mt-2 block overflow-x-auto font-mono text-xs leading-5 text-[var(--platform-ink-muted-strong)]">
                                    {contract.localTestCommand}
                                </code>
                            </div>
                        ) : null}
                    </section>

                    <section
                        aria-labelledby="evaluator-security-title"
                        className="border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-5 sm:p-6"
                    >
                        <div className="flex items-start gap-3">
                            <ShieldAlert
                                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--platform-coral)]"
                                aria-hidden="true"
                            />
                            <div>
                                <h2
                                    id="evaluator-security-title"
                                    className="text-xl font-bold tracking-[-0.025em] text-[var(--platform-ink)]"
                                >
                                    {t('security.title')}
                                </h2>
                                <p className="mt-2 max-w-[66ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                                    {t('security.description')}
                                </p>
                            </div>
                        </div>
                        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                            {contract.prohibitedCapabilities.map((capability) => (
                                <li
                                    key={capability}
                                    className="flex items-start gap-2 border border-[var(--platform-line)] bg-[var(--platform-paper)] p-3 text-sm text-[var(--platform-ink-muted-strong)]"
                                >
                                    <LockKeyhole
                                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--platform-violet)]"
                                        aria-hidden="true"
                                    />
                                    {capability}
                                </li>
                            ))}
                        </ul>
                    </section>
                </main>

                <aside className="space-y-6 border-y border-[var(--platform-line-strong)] py-6 lg:sticky lg:top-28 lg:border lg:p-5">
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--platform-ink)]">
                            {t('limits.title')}
                        </h2>
                        <dl className="mt-4 space-y-4 text-sm">
                            <div className="flex items-start gap-3">
                                <Clock3
                                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--platform-violet)]"
                                    aria-hidden="true"
                                />
                                <div>
                                    <dt className="font-bold text-[var(--platform-ink)]">
                                        {t('limits.timeout')}
                                    </dt>
                                    <dd className="text-[var(--platform-ink-muted)]">
                                        {t('limits.seconds', {
                                            count: contract.limits.timeoutSeconds,
                                        })}
                                    </dd>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <FileCheck2
                                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--platform-violet)]"
                                    aria-hidden="true"
                                />
                                <div>
                                    <dt className="font-bold text-[var(--platform-ink)]">
                                        {t('limits.script')}
                                    </dt>
                                    <dd className="text-[var(--platform-ink-muted)]">
                                        {formatBytes(contract.limits.maxEvaluatorBytes)}
                                    </dd>
                                </div>
                            </div>
                        </dl>
                    </div>
                    <div className="border-t border-[var(--platform-line)] pt-5">
                        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--platform-ink)]">
                            {t('formats.title')}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {contract.supportedFormats.map((format) => (
                                <span
                                    key={format}
                                    className="border border-[var(--platform-violet)] px-2 py-1 font-mono text-xs font-bold text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]"
                                >
                                    {format}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="border-t border-[var(--platform-line)] pt-5">
                        <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--platform-ink)]">
                            {t('libraries.title')}
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {contract.allowedLibraries.map((library) => (
                                <span
                                    key={library}
                                    className="border border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-2 py-1 font-mono text-xs text-[var(--platform-ink-muted-strong)]"
                                >
                                    {library}
                                </span>
                            ))}
                        </div>
                    </div>
                    <Link
                        href="/problem-proposals/new"
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[var(--platform-violet)] px-4 text-sm font-bold text-white dark:text-[var(--platform-on-accent)]"
                    >
                        {t('start')}
                    </Link>
                </aside>
            </div>
        </PlatformPageShell>
    );
}
