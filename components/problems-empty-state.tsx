'use client';

import * as React from 'react';
import { FilterX, SearchX } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';

/**
 * Props for the ProblemsEmptyState component
 */
export type ProblemsEmptyStateProps = {
    hasActiveFilters: boolean;
    onClearFilters?: () => void;
    className?: string;
};

/**
 * ProblemsEmptyState component
 *
 * Displays a friendly message when no problems match the current filters.
 * Suggests modifying filters and provides a clear filters button.
 *
 * Requirements: 1.3
 */
export function ProblemsEmptyState({
    hasActiveFilters,
    onClearFilters,
    className,
}: ProblemsEmptyStateProps) {
    const t = useTranslations('filters');
    const StateIcon = hasActiveFilters ? FilterX : SearchX;

    return (
        <div
            className={cn(
                'relative flex min-h-[22rem] flex-col items-center justify-center overflow-hidden border-y border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-5 py-14 text-center',
                className,
            )}
        >
            <span
                className="absolute start-0 top-0 h-2 w-20 bg-[var(--platform-coral)]"
                aria-hidden="true"
            />
            <div role="status" aria-live="polite" aria-atomic="true">
                <span className="mx-auto mb-5 grid h-14 w-14 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[5px_5px_0_var(--platform-violet)]">
                    <StateIcon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 className="text-xl font-semibold tracking-[-0.025em] text-[var(--platform-ink)]">
                    {t('noResults')}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-6 text-[var(--platform-ink-muted)]">
                    {t('noResultsDescription')}
                </p>
            </div>
            {hasActiveFilters && onClearFilters && (
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 py-2 text-sm font-bold text-[var(--platform-ink)] transition-colors duration-150 hover:border-[var(--platform-violet)] hover:bg-[var(--platform-citron)] hover:text-[var(--platform-on-accent)] focus-visible:outline-none"
                    aria-label={t('clearAllAriaLabel')}
                >
                    <FilterX className="h-4 w-4" aria-hidden="true" />
                    {t('clearAll')}
                </button>
            )}
        </div>
    );
}

export default ProblemsEmptyState;
