'use client';

import { ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PlatformPageHeader, PlatformPageShell } from '@/components/platform-page-shell';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

export default function UnsubscribeSuccessPage() {
    const t = useTranslations('auth.unsubscribeSuccess');
    const tCommon = useTranslations('common');

    return (
        <PlatformPageShell contentClassName="max-w-5xl space-y-8 md:space-y-10">
            <PlatformPageHeader
                eyebrow={`MLCompete / ${tCommon('success')}`}
                icon={CheckCircle2}
                title={t('title')}
                description={t('description')}
            />

            <section
                className="platform-panel grid overflow-hidden lg:grid-cols-[0.34fr_0.66fr]"
                role="status"
                aria-live="polite"
            >
                <div className="flex min-h-56 flex-col justify-between bg-[var(--platform-citron)] p-6 text-[var(--platform-on-accent)] sm:p-8">
                    <span className="grid h-14 w-14 place-items-center border-2 border-current">
                        <Check className="h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    <p className="text-xs font-bold uppercase tracking-[0.16em]">
                        {tCommon('success')}
                    </p>
                </div>

                <div className="flex min-h-72 flex-col justify-between gap-8 bg-[var(--platform-paper)] p-6 sm:p-8 lg:p-10">
                    <p className="max-w-2xl text-lg leading-8 text-[var(--platform-ink-muted-strong)]">
                        {t('message')}
                    </p>

                    <div className="border-t border-[var(--platform-line)] pt-6">
                        <Button
                            asChild
                            className="min-h-11 rounded-none bg-[var(--platform-violet)] px-5 text-white shadow-none hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]"
                        >
                            <Link href="/">
                                {t('goHome')}
                                <ArrowRight className="ms-2 h-4 w-4" aria-hidden="true" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </PlatformPageShell>
    );
}
