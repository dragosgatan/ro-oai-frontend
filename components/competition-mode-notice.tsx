'use client';

import { useCompetitionData } from '@/components/competition-data-provider';
import { Info, Lock, ShieldCheck } from 'lucide-react';

/**
 * Displays a notice when competition mode is active, explaining
 * why certain features (problems list, roadmap) are restricted.
 */
export function CompetitionModeNotice() {
    const { isAnyCompetitionOngoing } = useCompetitionData();

    if (!isAnyCompetitionOngoing) return null;

    return (
        <aside className="border border-[var(--platform-line-strong)] bg-[color-mix(in_oklch,var(--platform-citron)_16%,var(--platform-paper))] p-4 shadow-[4px_4px_0_color-mix(in_oklch,var(--platform-violet)_25%,transparent)] sm:p-5">
            <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--platform-violet)] text-[var(--platform-paper)]">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-sm font-bold text-[var(--platform-ink)]">
                            Mod competiție activ
                        </h2>
                        <span className="inline-flex min-h-6 items-center gap-1.5 bg-[var(--platform-coral)] px-2 text-[10px] font-bold tracking-[0.12em] text-[var(--platform-on-accent)]">
                            <span className="h-1.5 w-1.5 bg-current" aria-hidden="true" />
                            LIVE
                        </span>
                    </div>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                        Pe durata competiției, accesul la lista de probleme și la roadmap este
                        restricționat pentru a asigura corectitudinea concursului. Poți accesa doar
                        problemele din competițiile active.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-[var(--platform-ink-muted-strong)]">
                        <span className="flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                            Probleme: restricționat
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                            Roadmap: restricționat
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5" aria-hidden="true" />
                            Competiții: disponibil
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
