'use client';

import { AlertOctagon, LogOut, ShieldOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useCompetitionData } from '@/components/competition-data-provider';
import { PlatformPageHeader, PlatformPageShell } from '@/components/platform-page-shell';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

export default function DisabledPage() {
    const t = useTranslations('auth');
    const tCommon = useTranslations('common');
    const tNav = useTranslations('navigation');
    const participantAndCompetitionData = useCompetitionData();
    const competitionName = tNav('competitions');
    const participantName = participantAndCompetitionData.participantName ?? tCommon('you');

    return (
        <PlatformPageShell contentClassName="max-w-5xl space-y-8 md:space-y-10">
            <PlatformPageHeader
                eyebrow={`MLCompete / ${t('authentication')}`}
                icon={ShieldOff}
                title={t('accessDisabled')}
                description={t('accessDisabledDesc', { competition: competitionName })}
            />

            <section
                className="platform-panel grid overflow-hidden lg:grid-cols-[0.34fr_0.66fr]"
                role="alert"
            >
                <div className="flex flex-col justify-between gap-10 bg-[var(--platform-coral)] p-6 text-[var(--platform-on-accent)] sm:p-8">
                    <span className="grid h-14 w-14 place-items-center border-2 border-current">
                        <AlertOctagon className="h-7 w-7" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-75">
                            {tCommon('error')}
                        </p>
                        <p className="mt-2 font-mono text-lg font-bold">{t('accessDisabled')}</p>
                    </div>
                </div>

                <div className="flex min-h-72 flex-col justify-between gap-8 bg-[var(--platform-paper)] p-6 sm:p-8 lg:p-10">
                    <div>
                        <h2 className="text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]">
                            {participantName}
                        </h2>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--platform-ink-muted)]">
                            {t('accessDisabledMessage', { name: participantName })}
                        </p>
                    </div>

                    <div className="border-t border-[var(--platform-line)] pt-6">
                        <Button
                            variant="outline"
                            asChild
                            className="min-h-11 rounded-none border-[var(--platform-line-strong)] bg-transparent px-5 text-[var(--platform-ink)] shadow-none hover:bg-[var(--platform-paper-strong)]"
                        >
                            <Link href="/logout">
                                <LogOut className="me-2 h-4 w-4" aria-hidden="true" />
                                {tNav('logout')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </PlatformPageShell>
    );
}
