'use client';

import { Apple, Download, ExternalLink, Monitor, ShieldAlert, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

export interface SebDownloadSectionProps {
    required: boolean;
    competitionId: number;
    className?: string;
}

const SEB_INSTALLERS = {
    windows: {
        url: 'https://github.com/SafeExamBrowser/seb-win-refactoring/releases/download/v3.10.1/SEB_3.10.1.864_SetupBundle.exe',
        icon: Monitor,
    },
    macos: {
        url: 'https://github.com/SafeExamBrowser/seb-mac/releases/download/3.6.1/SafeExamBrowser-3.6.1.dmg',
        icon: Apple,
    },
    ios: {
        url: 'https://apps.apple.com/app/safe-exam-browser/id1161003686',
        icon: Smartphone,
    },
} as const;

export function SebDownloadSection({
    required,
    competitionId,
    className,
}: SebDownloadSectionProps) {
    const t = useTranslations('seb');

    if (!required) return null;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const configDownloadUrl = `${apiBaseUrl}/api/seb/config/${competitionId}`;
    const steps = ['step1', 'step2', 'step3', 'step4'] as const;

    return (
        <section
            className={cn(
                'border border-[var(--platform-line-strong)] bg-[color-mix(in_oklch,var(--platform-citron)_9%,var(--platform-paper))] text-[var(--platform-ink)]',
                className,
            )}
            aria-labelledby="seb-download-title"
        >
            <header className="flex items-start gap-3 border-b border-[var(--platform-line)] px-4 py-4 sm:px-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                    <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h2 id="seb-download-title" className="font-bold tracking-[-0.02em]">
                        {t('download.title')}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('download.description')}
                    </p>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('download.whatIsSeb')}
                    </p>
                </div>
            </header>

            <div className="grid gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)] lg:items-start sm:px-5">
                <section aria-labelledby="seb-steps-title">
                    <h3 id="seb-steps-title" className="text-sm font-bold">
                        {t('download.steps.title')}
                    </h3>
                    <ol className="mt-3 space-y-2">
                        {steps.map((step, index) => (
                            <li
                                key={step}
                                className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3 text-sm leading-6 text-[var(--platform-ink-muted)]"
                            >
                                <span className="grid h-8 w-8 place-items-center border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] font-mono text-xs font-bold tabular-nums text-[var(--platform-violet)]">
                                    {index + 1}
                                </span>
                                <span className="pt-1">{t(`download.steps.${step}`)}</span>
                            </li>
                        ))}
                    </ol>
                </section>

                <section aria-labelledby="seb-installers-title">
                    <h3 id="seb-installers-title" className="text-sm font-bold">
                        {t('download.installers.title')}
                    </h3>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                        {Object.entries(SEB_INSTALLERS).map(([platform, { url, icon: Icon }]) => (
                            <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center justify-between gap-3 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 text-sm font-semibold text-[var(--platform-ink)] transition-colors duration-200 hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <Icon
                                        className="h-4 w-4 shrink-0 text-[var(--platform-violet)]"
                                        aria-hidden="true"
                                    />
                                    <span>{t(`download.installers.${platform}`)}</span>
                                </span>
                                <ExternalLink
                                    className="h-4 w-4 shrink-0 text-[var(--platform-ink-muted)]"
                                    aria-hidden="true"
                                />
                            </a>
                        ))}
                    </div>
                </section>
            </div>

            <footer className="flex flex-col gap-4 border-t border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="max-w-2xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                    {t('download.downloadConfigDescription')}
                </p>
                <a
                    href={configDownloadUrl}
                    download
                    className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 bg-[var(--platform-violet)] px-5 text-sm font-semibold text-[oklch(0.98_0.01_292)] shadow-[4px_4px_0_var(--platform-coral)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[var(--platform-violet-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] active:translate-y-0 active:scale-[0.98] dark:text-[var(--platform-on-accent)] motion-reduce:transform-none sm:w-auto"
                >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {t('download.downloadConfig')}
                </a>
            </footer>
        </section>
    );
}

export default SebDownloadSection;
