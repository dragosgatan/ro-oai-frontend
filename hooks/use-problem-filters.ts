'use client';

import { useCallback, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { Difficulty, ProblemFilters, AttemptedStatus } from '@/lib/types';

// Re-export types for backward compatibility
export type { Difficulty, ProblemFilters, AttemptedStatus } from '@/lib/types';

/**
 * Return type for the useProblemFilters hook
 */
export type UseProblemFiltersReturn = {
    filters: ProblemFilters;
    setSearch: (search: string) => void;
    toggleDifficulty: (difficulty: Difficulty) => void;
    toggleCategory: (categoryId: number) => void;
    toggleCompetition: (competitionId: number) => void;
    setAttemptedStatus: (status: AttemptedStatus) => void;
    setDifficulties: (difficulties: Difficulty[]) => void;
    setCategoryIds: (categoryIds: number[]) => void;
    setCompetitionIds: (competitionIds: number[]) => void;
    clearFilters: () => void;
    removeFilter: (
        type: 'search' | 'difficulty' | 'category' | 'competition' | 'attemptedStatus',
        value?: string | number,
    ) => void;
    hasActiveFilters: boolean;
    activeFilterCount: number;
    isPending: boolean;
};

/**
 * Default empty filter state
 */
export const DEFAULT_FILTERS: ProblemFilters = {
    search: '',
    difficulty: [],
    categoryIds: [],
    competitionIds: [],
    attemptedStatus: null,
};

/**
 * Hook for managing problem filter state with URL synchronization.
 *
 * Features:
 * - Manages filter state (search, difficulty[], categoryIds[], competitionIds[], attemptedStatus)
 * - Provides setters for each filter type
 * - Implements clearFilters and removeFilter functions
 * - Syncs state with URL query parameters for shareable links
 *
 * @returns Filter state and manipulation functions
 */
export function useProblemFilters(): UseProblemFiltersReturn {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Parse filters from URL query parameters
    const filters = useMemo<ProblemFilters>(() => {
        const search = searchParams.get('search') || '';

        // Parse difficulty array from URL
        const difficultyParam = searchParams.getAll('difficulty');
        const difficulty = difficultyParam.filter(
            (d): d is Difficulty => d === 'Easy' || d === 'Medium' || d === 'Hard',
        );

        // Parse categoryIds array from URL
        const categoryIdsParam = searchParams.getAll('categoryIds');
        const categoryIds = categoryIdsParam
            .map((id) => parseInt(id, 10))
            .filter((id) => !isNaN(id) && id > 0);

        // Parse competitionIds array from URL
        const competitionIdsParam = searchParams.getAll('competitionIds');
        const competitionIds = competitionIdsParam
            .map((id) => parseInt(id, 10))
            .filter((id) => !isNaN(id) && id > 0);

        // Parse attemptedStatus from URL
        const attemptedStatusParam = searchParams.get('attemptedStatus');
        const attemptedStatus: AttemptedStatus =
            attemptedStatusParam === 'attempted' || attemptedStatusParam === 'unattempted'
                ? attemptedStatusParam
                : null;

        return { search, difficulty, categoryIds, competitionIds, attemptedStatus };
    }, [searchParams]);

    // Update URL with new filter state
    const updateUrl = useCallback(
        (newFilters: ProblemFilters) => {
            const params = new URLSearchParams();

            // Add search parameter if not empty
            if (newFilters.search.trim()) {
                params.set('search', newFilters.search.trim());
            }

            // Add difficulty parameters
            newFilters.difficulty.forEach((d) => {
                params.append('difficulty', d);
            });

            // Add categoryIds parameters
            newFilters.categoryIds.forEach((id) => {
                params.append('categoryIds', id.toString());
            });

            // Add competitionIds parameters
            newFilters.competitionIds.forEach((id) => {
                params.append('competitionIds', id.toString());
            });

            // Add attemptedStatus parameter if set
            if (newFilters.attemptedStatus) {
                params.set('attemptedStatus', newFilters.attemptedStatus);
            }

            // Reset to page 0 when filters change
            // (don't include page param, let it default to 0)

            const queryString = params.toString();
            const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

            startTransition(() => {
                router.replace(newUrl, { scroll: false });
            });
        },
        [pathname, router],
    );

    // Set search term
    const setSearch = useCallback(
        (search: string) => {
            updateUrl({ ...filters, search });
        },
        [filters, updateUrl],
    );

    // Toggle a difficulty filter on/off
    const toggleDifficulty = useCallback(
        (difficulty: Difficulty) => {
            const newDifficulty = filters.difficulty.includes(difficulty)
                ? filters.difficulty.filter((d) => d !== difficulty)
                : [...filters.difficulty, difficulty];
            updateUrl({ ...filters, difficulty: newDifficulty });
        },
        [filters, updateUrl],
    );

    // Toggle a category filter on/off
    const toggleCategory = useCallback(
        (categoryId: number) => {
            const newCategoryIds = filters.categoryIds.includes(categoryId)
                ? filters.categoryIds.filter((id) => id !== categoryId)
                : [...filters.categoryIds, categoryId];
            updateUrl({ ...filters, categoryIds: newCategoryIds });
        },
        [filters, updateUrl],
    );

    // Toggle a competition filter on/off
    const toggleCompetition = useCallback(
        (competitionId: number) => {
            const newCompetitionIds = filters.competitionIds.includes(competitionId)
                ? filters.competitionIds.filter((id) => id !== competitionId)
                : [...filters.competitionIds, competitionId];
            updateUrl({ ...filters, competitionIds: newCompetitionIds });
        },
        [filters, updateUrl],
    );

    // Set attempted status filter
    const setAttemptedStatus = useCallback(
        (status: AttemptedStatus) => {
            updateUrl({ ...filters, attemptedStatus: status });
        },
        [filters, updateUrl],
    );

    // Set all difficulties at once
    const setDifficulties = useCallback(
        (difficulties: Difficulty[]) => {
            updateUrl({ ...filters, difficulty: difficulties });
        },
        [filters, updateUrl],
    );

    // Set all category IDs at once
    const setCategoryIds = useCallback(
        (categoryIds: number[]) => {
            updateUrl({ ...filters, categoryIds });
        },
        [filters, updateUrl],
    );

    // Set all competition IDs at once
    const setCompetitionIds = useCallback(
        (competitionIds: number[]) => {
            updateUrl({ ...filters, competitionIds });
        },
        [filters, updateUrl],
    );

    // Clear all filters
    const clearFilters = useCallback(() => {
        updateUrl(DEFAULT_FILTERS);
    }, [updateUrl]);

    // Remove a specific filter
    const removeFilter = useCallback(
        (
            type: 'search' | 'difficulty' | 'category' | 'competition' | 'attemptedStatus',
            value?: string | number,
        ) => {
            switch (type) {
                case 'search':
                    updateUrl({ ...filters, search: '' });
                    break;
                case 'difficulty':
                    if (typeof value === 'string') {
                        const newDifficulty = filters.difficulty.filter((d) => d !== value);
                        updateUrl({ ...filters, difficulty: newDifficulty });
                    }
                    break;
                case 'category':
                    if (typeof value === 'number') {
                        const newCategoryIds = filters.categoryIds.filter((id) => id !== value);
                        updateUrl({ ...filters, categoryIds: newCategoryIds });
                    }
                    break;
                case 'competition':
                    if (typeof value === 'number') {
                        const newCompetitionIds = filters.competitionIds.filter(
                            (id) => id !== value,
                        );
                        updateUrl({ ...filters, competitionIds: newCompetitionIds });
                    }
                    break;
                case 'attemptedStatus':
                    updateUrl({ ...filters, attemptedStatus: null });
                    break;
            }
        },
        [filters, updateUrl],
    );

    // Check if any filters are active
    const hasActiveFilters = useMemo(
        () =>
            filters.search.trim() !== '' ||
            filters.difficulty.length > 0 ||
            filters.categoryIds.length > 0 ||
            filters.competitionIds.length > 0 ||
            filters.attemptedStatus !== null,
        [filters],
    );

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.search.trim()) count += 1;
        count += filters.difficulty.length;
        count += filters.categoryIds.length;
        count += filters.competitionIds.length;
        if (filters.attemptedStatus) count += 1;
        return count;
    }, [filters]);

    return {
        filters,
        setSearch,
        toggleDifficulty,
        toggleCategory,
        toggleCompetition,
        setAttemptedStatus,
        setDifficulties,
        setCategoryIds,
        setCompetitionIds,
        clearFilters,
        removeFilter,
        hasActiveFilters,
        activeFilterCount,
        isPending,
    };
}
