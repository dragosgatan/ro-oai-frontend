'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';
import { ProblemList } from '@/components/problem-list';
import {
    ProblemContributionInvite,
    shouldShowProblemContributionInvite,
} from '@/components/problem-contribution-invite';
import {
    ProblemFilterPanel,
    ProblemSearchBar,
    type Category,
} from '@/components/problem-filter-panel';
import { ActiveFilters } from '@/components/active-filters';
import { ProblemsEmptyState } from '@/components/problems-empty-state';
import { useProblemFilters, type Difficulty } from '@/hooks/use-problem-filters';
import type { Problem, CompetitionFilterOption } from '@/lib/types';

export type ProblemsPageClientProps = {
    initialProblems: Problem[];
    categories: Category[];
    competitions: CompetitionFilterOption[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
    difficultyCounts: Record<Difficulty, number>;
    categoryCounts: Record<number, number>;
    competitionCounts: Record<number, number>;
    isLoading?: boolean;
    isCategoriesLoading?: boolean;
    isCompetitionsLoading?: boolean;
    isAuthenticated?: boolean;
};

export function ProblemsPageClient({
    initialProblems,
    categories,
    competitions,
    totalElements,
    totalPages,
    currentPage,
    size,
    difficultyCounts,
    categoryCounts,
    competitionCounts,
    isLoading = false,
    isCategoriesLoading = false,
    isCompetitionsLoading = false,
    isAuthenticated = false,
}: ProblemsPageClientProps) {
    const tFilters = useTranslations('filters');
    const tProblems = useTranslations('problems');
    const tPagination = useTranslations('pagination');

    const {
        filters,
        setSearch,
        toggleDifficulty,
        toggleCategory,
        toggleCompetition,
        setAttemptedStatus,
        clearFilters,
        removeFilter,
        hasActiveFilters,
        isPending,
    } = useProblemFilters();

    const [searchInput, setSearchInput] = React.useState(filters.search);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const setSearchRef = React.useRef(setSearch);

    React.useEffect(() => {
        setSearchRef.current = setSearch;
    }, [setSearch]);

    const handleSearchInputChange = React.useCallback((value: string) => {
        setSearchInput(value);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setSearchRef.current(value), 350);
    }, []);

    const handleClearFilters = React.useCallback(() => {
        setSearchInput('');
        clearTimeout(debounceRef.current);
        clearFilters();
    }, [clearFilters]);

    const handleRemoveFilter = React.useCallback(
        (
            type: 'search' | 'difficulty' | 'category' | 'competition' | 'attemptedStatus',
            value?: string | number,
        ) => {
            if (type === 'search') {
                setSearchInput('');
                clearTimeout(debounceRef.current);
            }
            removeFilter(type, value);
        },
        [removeFilter],
    );

    React.useEffect(() => () => clearTimeout(debounceRef.current), []);

    React.useEffect(() => {
        setSearchInput(filters.search);
    }, [filters.search]);

    const hasNext = currentPage + 1 < totalPages;
    const hasPrev = currentPage > 0;
    const showContributionInvite = shouldShowProblemContributionInvite({
        currentPage,
        hasActiveFilters,
        resultCount: initialProblems.length,
    });

    const buildPaginationQuery = (page: number) => {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('size', size.toString());

        if (filters.search.trim()) params.set('search', filters.search.trim());
        filters.difficulty.forEach((difficulty) => params.append('difficulty', difficulty));
        filters.categoryIds.forEach((id) => params.append('categoryIds', id.toString()));
        filters.competitionIds.forEach((id) => params.append('competitionIds', id.toString()));
        if (filters.attemptedStatus) {
            params.set('attemptedStatus', filters.attemptedStatus);
        }

        return params.toString();
    };

    const filterPanelProps = {
        filters,
        categories,
        competitions,
        difficultyCounts,
        categoryCounts,
        competitionCounts,
        onSearchChange: setSearch,
        onDifficultyToggle: toggleDifficulty,
        onCategoryToggle: toggleCategory,
        onCompetitionToggle: toggleCompetition,
        onAttemptedStatusChange: setAttemptedStatus,
        onClearAll: handleClearFilters,
        isLoading,
        isCategoriesLoading,
        isCompetitionsLoading,
        isAuthenticated,
        resultCount: totalElements,
        isApplying: isPending,
        showSearch: false,
    };

    return (
        <section className="mt-8" aria-label={tProblems('availableProblems')}>
            <div className="platform-toolbar grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-4">
                <ProblemSearchBar
                    value={searchInput}
                    onValueChange={handleSearchInputChange}
                    isLoading={isPending}
                    className="min-w-0"
                />
                <div className="lg:hidden">
                    <ProblemFilterPanel {...filterPanelProps} variant="mobile" />
                </div>
            </div>

            <div className="mt-8 grid items-start gap-7 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-9">
                <ProblemFilterPanel
                    {...filterPanelProps}
                    variant="desktop"
                    className="hidden lg:flex"
                />

                <div className="min-w-0">
                    <div className="mb-5 flex min-h-11 flex-wrap items-center justify-between gap-3 border-b border-[var(--platform-line)] pb-3">
                        <p
                            className="text-sm font-semibold tabular-nums text-[var(--platform-ink)]"
                            role="status"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {tFilters('resultsCount', { count: totalElements })}
                        </p>
                        {isPending && (
                            <span className="flex items-center gap-2 text-xs font-semibold text-[var(--platform-violet)]">
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                {tFilters('applyingFilters')}
                            </span>
                        )}
                    </div>

                    <ActiveFilters
                        filters={filters}
                        categories={categories}
                        competitions={competitions}
                        onRemoveFilter={handleRemoveFilter}
                        onClearAll={handleClearFilters}
                        isLoading={isLoading}
                        className="mb-5 border-b border-[var(--platform-line)] pb-4 [&_[role=button]]:rounded-none"
                    />

                    <div
                        className={`transition-opacity duration-200 ease-out ${isPending ? 'opacity-50' : 'opacity-100'}`}
                        aria-busy={isPending}
                    >
                        {initialProblems.length === 0 ? (
                            <ProblemsEmptyState
                                hasActiveFilters={hasActiveFilters}
                                onClearFilters={handleClearFilters}
                                className="rounded-none border-x-0 border-[var(--platform-line)] bg-[var(--platform-paper-strong)] shadow-none"
                            />
                        ) : (
                            <ProblemList
                                problems={initialProblems}
                                startIndex={currentPage * size}
                                variant="ledger"
                            />
                        )}
                    </div>

                    {totalPages > 1 && (
                        <nav
                            className="mt-10 flex flex-col gap-4 border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                            aria-label={tPagination('page')}
                        >
                            <p className="text-sm font-medium text-[var(--platform-ink-muted)]">
                                {tPagination('page')}{' '}
                                <span className="font-mono font-semibold tabular-nums text-[var(--platform-ink)]">
                                    {currentPage + 1}
                                </span>{' '}
                                {tPagination('of')}{' '}
                                <span className="font-mono font-semibold tabular-nums text-[var(--platform-ink)]">
                                    {totalPages}
                                </span>
                            </p>

                            <div className="grid grid-cols-2 gap-2" role="group">
                                {hasPrev ? (
                                    <Link
                                        href={`/problems?${buildPaginationQuery(currentPage - 1)}`}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-none border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 text-sm font-semibold text-[var(--platform-ink)] hover:bg-[var(--platform-citron)] hover:text-[var(--platform-on-accent)]"
                                        aria-label={`${tPagination('previous')} (${tPagination('page')} ${currentPage})`}
                                    >
                                        <ArrowLeft
                                            className="h-4 w-4 rtl:rotate-180"
                                            aria-hidden="true"
                                        />
                                        {tPagination('previous')}
                                    </Link>
                                ) : (
                                    <span
                                        className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-none border border-[var(--platform-line)] px-4 text-sm font-semibold text-[var(--platform-ink-muted)] opacity-55"
                                        aria-disabled="true"
                                    >
                                        <ArrowLeft
                                            className="h-4 w-4 rtl:rotate-180"
                                            aria-hidden="true"
                                        />
                                        {tPagination('previous')}
                                    </span>
                                )}

                                {hasNext ? (
                                    <Link
                                        href={`/problems?${buildPaginationQuery(currentPage + 1)}`}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-none bg-[var(--platform-violet)] px-4 text-sm font-semibold text-white hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]"
                                        aria-label={`${tPagination('next')} (${tPagination('page')} ${currentPage + 2})`}
                                    >
                                        {tPagination('next')}
                                        <ArrowRight
                                            className="h-4 w-4 rtl:rotate-180"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                ) : (
                                    <span
                                        className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-none bg-[var(--platform-line)] px-4 text-sm font-semibold text-[var(--platform-ink-muted)] opacity-60"
                                        aria-disabled="true"
                                    >
                                        {tPagination('next')}
                                        <ArrowRight
                                            className="h-4 w-4 rtl:rotate-180"
                                            aria-hidden="true"
                                        />
                                    </span>
                                )}
                            </div>
                        </nav>
                    )}
                </div>
            </div>

            {showContributionInvite ? <ProblemContributionInvite /> : null}
        </section>
    );
}

export default ProblemsPageClient;
