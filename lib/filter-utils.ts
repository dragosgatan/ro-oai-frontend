import type { ProblemFilters, Difficulty, AttemptedStatus } from '@/lib/types';

/**
 * URL Parameter Keys for problem filters
 */
export const FILTER_PARAM_KEYS = {
    SEARCH: 'search',
    DIFFICULTY: 'difficulty',
    CATEGORY_IDS: 'categoryIds',
    COMPETITION_IDS: 'competitionIds',
    ATTEMPTED_STATUS: 'attemptedStatus',
} as const;

/**
 * Valid difficulty values
 */
export const VALID_DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard'];

/**
 * Serialize filter state to URL search params string.
 *
 * @param filters - The filter state to serialize
 * @returns URL search params string (without leading '?')
 */
export function serializeFiltersToUrl(filters: ProblemFilters): string {
    const params = new URLSearchParams();

    if (filters.search.trim()) {
        params.set(FILTER_PARAM_KEYS.SEARCH, filters.search.trim());
    }

    filters.difficulty.forEach((d) => {
        params.append(FILTER_PARAM_KEYS.DIFFICULTY, d);
    });

    filters.categoryIds.forEach((id) => {
        params.append(FILTER_PARAM_KEYS.CATEGORY_IDS, id.toString());
    });

    filters.competitionIds.forEach((id) => {
        params.append(FILTER_PARAM_KEYS.COMPETITION_IDS, id.toString());
    });

    if (filters.attemptedStatus) {
        params.set(FILTER_PARAM_KEYS.ATTEMPTED_STATUS, filters.attemptedStatus);
    }

    return params.toString();
}

/**
 * Deserialize URL search params to filter state.
 *
 * @param searchParams - URLSearchParams or string to parse
 * @returns Parsed filter state
 */
export function deserializeFiltersFromUrl(searchParams: URLSearchParams | string): ProblemFilters {
    const params =
        typeof searchParams === 'string' ? new URLSearchParams(searchParams) : searchParams;

    const search = params.get(FILTER_PARAM_KEYS.SEARCH) || '';

    const difficultyParams = params.getAll(FILTER_PARAM_KEYS.DIFFICULTY);
    const difficulty = difficultyParams.filter((d): d is Difficulty =>
        VALID_DIFFICULTIES.includes(d as Difficulty),
    );

    const categoryIdsParams = params.getAll(FILTER_PARAM_KEYS.CATEGORY_IDS);
    const categoryIds = categoryIdsParams
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id) && id > 0);

    const competitionIdsParams = params.getAll(FILTER_PARAM_KEYS.COMPETITION_IDS);
    const competitionIds = competitionIdsParams
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id) && id > 0);

    const attemptedStatusParam = params.get(FILTER_PARAM_KEYS.ATTEMPTED_STATUS);
    const attemptedStatus: AttemptedStatus =
        attemptedStatusParam === 'attempted' || attemptedStatusParam === 'unattempted'
            ? attemptedStatusParam
            : null;

    return { search, difficulty, categoryIds, competitionIds, attemptedStatus };
}

/**
 * Check if two filter states are equal.
 *
 * @param a - First filter state
 * @param b - Second filter state
 * @returns True if filters are equal
 */
export function areFiltersEqual(a: ProblemFilters, b: ProblemFilters): boolean {
    // Compare search
    if (a.search.trim() !== b.search.trim()) {
        return false;
    }

    // Compare difficulty arrays (order-independent)
    if (a.difficulty.length !== b.difficulty.length) {
        return false;
    }
    const sortedDiffA = [...a.difficulty].sort();
    const sortedDiffB = [...b.difficulty].sort();
    if (!sortedDiffA.every((d, i) => d === sortedDiffB[i])) {
        return false;
    }

    // Compare categoryIds arrays (order-independent)
    if (a.categoryIds.length !== b.categoryIds.length) {
        return false;
    }
    const sortedCatA = [...a.categoryIds].sort((x, y) => x - y);
    const sortedCatB = [...b.categoryIds].sort((x, y) => x - y);
    if (!sortedCatA.every((id, i) => id === sortedCatB[i])) {
        return false;
    }

    if (a.competitionIds.length !== b.competitionIds.length) {
        return false;
    }
    const sortedCompetitionA = [...a.competitionIds].sort((x, y) => x - y);
    const sortedCompetitionB = [...b.competitionIds].sort((x, y) => x - y);
    if (!sortedCompetitionA.every((id, i) => id === sortedCompetitionB[i])) {
        return false;
    }

    return a.attemptedStatus === b.attemptedStatus;
}

/**
 * Check if filters have any active values.
 *
 * @param filters - Filter state to check
 * @returns True if any filter is active
 */
export function hasActiveFilters(filters: ProblemFilters): boolean {
    return (
        filters.search.trim() !== '' ||
        filters.difficulty.length > 0 ||
        filters.categoryIds.length > 0 ||
        filters.competitionIds.length > 0 ||
        filters.attemptedStatus !== null
    );
}

/**
 * Count the number of active filter values.
 *
 * @param filters - Filter state to count
 * @returns Number of active filter values
 */
export function countActiveFilters(filters: ProblemFilters): number {
    let count = 0;
    if (filters.search.trim()) count += 1;
    count += filters.difficulty.length;
    count += filters.categoryIds.length;
    count += filters.competitionIds.length;
    if (filters.attemptedStatus) count += 1;
    return count;
}

/**
 * Create a debounced version of a function.
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds (default: 300ms per requirement 1.4)
 * @returns Debounced function with cancel method
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delay: number = 300,
): T & { cancel: () => void } {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debouncedFn = ((...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, delay);
    }) as T & { cancel: () => void };

    debouncedFn.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debouncedFn;
}

/**
 * Merge partial filter updates with existing filters.
 *
 * @param current - Current filter state
 * @param updates - Partial updates to apply
 * @returns New filter state with updates applied
 */
export function mergeFilters(
    current: ProblemFilters,
    updates: Partial<ProblemFilters>,
): ProblemFilters {
    return {
        search: updates.search !== undefined ? updates.search : current.search,
        difficulty: updates.difficulty !== undefined ? updates.difficulty : current.difficulty,
        categoryIds: updates.categoryIds !== undefined ? updates.categoryIds : current.categoryIds,
        competitionIds:
            updates.competitionIds !== undefined ? updates.competitionIds : current.competitionIds,
        attemptedStatus:
            updates.attemptedStatus !== undefined
                ? updates.attemptedStatus
                : current.attemptedStatus,
    };
}

/**
 * Create empty/default filter state.
 *
 * @returns Empty filter state
 */
export function createEmptyFilters(): ProblemFilters {
    return {
        search: '',
        difficulty: [],
        categoryIds: [],
        competitionIds: [],
        attemptedStatus: null,
    };
}

/**
 * Validate if a string is a valid difficulty value.
 *
 * @param value - String to validate
 * @returns True if valid difficulty
 */
export function isValidDifficulty(value: string): value is Difficulty {
    return VALID_DIFFICULTIES.includes(value as Difficulty);
}

/**
 * Build API query parameters from filter state.
 *
 * @param filters - Filter state
 * @param page - Page number (optional)
 * @param size - Page size (optional)
 * @returns URLSearchParams for API request
 */
export function buildApiQueryParams(
    filters: ProblemFilters,
    page?: number,
    size?: number,
): URLSearchParams {
    const params = new URLSearchParams();

    if (filters.search.trim()) {
        params.set('search', filters.search.trim());
    }

    filters.difficulty.forEach((d) => {
        params.append('difficulty', d);
    });

    filters.categoryIds.forEach((id) => {
        params.append('categoryIds', id.toString());
    });

    filters.competitionIds.forEach((id) => {
        params.append('competitionIds', id.toString());
    });

    if (filters.attemptedStatus) {
        params.set('attemptedStatus', filters.attemptedStatus);
    }

    if (page !== undefined) {
        params.set('page', page.toString());
    }

    if (size !== undefined) {
        params.set('size', size.toString());
    }

    return params;
}
