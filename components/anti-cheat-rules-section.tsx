'use client';

import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

export interface AntiCheatRulesSectionProps {
    enabled: boolean;
    className?: string;
}

export function AntiCheatRulesSection({ enabled, className }: AntiCheatRulesSectionProps) {
    const t = useTranslations('antiCheat');

    if (!enabled) return null;

    const rules = ['rule1', 'rule2', 'rule3', 'rule4', 'rule5'] as const;

    return (
        <section
            className={cn(
                'border border-[var(--platform-line-strong)] bg-[color-mix(in_oklch,var(--platform-violet)_6%,var(--platform-paper))] text-[var(--platform-ink)]',
                className,
            )}
            aria-labelledby="anti-cheat-rules-title"
        >
            <header className="flex items-start gap-3 border-b border-[var(--platform-line)] px-4 py-4 sm:px-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--platform-violet)] text-[oklch(0.98_0.01_292)] shadow-[3px_3px_0_var(--platform-coral)] dark:text-[var(--platform-on-accent)]">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h2 id="anti-cheat-rules-title" className="font-bold tracking-[-0.02em]">
                        {t('rules.title')}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('rules.description')}
                    </p>
                </div>
            </header>

            <ol className="grid gap-px bg-[var(--platform-line)] sm:grid-cols-2">
                {rules.map((rule, index) => (
                    <li
                        key={rule}
                        className="grid min-h-20 grid-cols-[2rem_minmax(0,1fr)] items-start gap-3 bg-[var(--platform-paper)] px-4 py-4 text-sm leading-6 text-[var(--platform-ink-muted)] sm:px-5"
                    >
                        <span className="grid h-8 w-8 place-items-center bg-[var(--platform-citron)] font-mono text-xs font-bold tabular-nums text-[var(--platform-on-accent)] shadow-[2px_2px_0_var(--platform-violet)]">
                            {index + 1}
                        </span>
                        <span className="pt-1">{t(`rules.${rule}`)}</span>
                    </li>
                ))}
            </ol>
        </section>
    );
}

export default AntiCheatRulesSection;
