'use client';

/**
 * Search and Filter Tracking Hooks
 *
 * Hooks for tracking search queries and filter applications.
 *
 * @example
 * ```tsx
 * // Search tracking
 * const { trackSearch } = useSearchTracking();
 * const handleSearch = (query: string, results: any[]) => {
 *   trackSearch(query, results.length);
 * };
 *
 * // Filter tracking
 * const { trackFilter } = useFilterTracking();
 * const handleFilterChange = (filterType: string, value: string) => {
 *   trackFilter(filterType, value);
 * };
 * ```
 */

import * as React from 'react';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';

/**
 * Hook for tracking search queries
 */
export function useSearchTracking() {
    const { trackSearch } = useGTMTracker();

    const trackSearchQuery = React.useCallback(
        (query: string, resultCount: number) => {
            trackSearch(query, resultCount);
        },
        [trackSearch],
    );

    return { trackSearch: trackSearchQuery };
}

/**
 * Hook for tracking filter applications
 */
export function useFilterTracking() {
    const { trackFilter } = useGTMTracker();

    const trackFilterApply = React.useCallback(
        (filterType: string, value: string) => {
            trackFilter(filterType, value);
        },
        [trackFilter],
    );

    return { trackFilter: trackFilterApply };
}

/**
 * Combined hook for search and filter tracking
 * Useful for components that have both search and filter functionality
 */
export function useSearchAndFilterTracking() {
    const { trackSearch, trackFilter } = useGTMTracker();

    const trackSearchQuery = React.useCallback(
        (query: string, resultCount: number) => {
            trackSearch(query, resultCount);
        },
        [trackSearch],
    );

    const trackFilterApply = React.useCallback(
        (filterType: string, value: string) => {
            trackFilter(filterType, value);
        },
        [trackFilter],
    );

    return {
        trackSearch: trackSearchQuery,
        trackFilter: trackFilterApply,
    };
}

/**
 * Debounced search tracking hook
 * Useful for search inputs that fire on every keystroke
 */
export function useDebouncedSearchTracking(debounceMs: number = 500) {
    const { trackSearch } = useGTMTracker();
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const trackSearchQuery = React.useCallback(
        (query: string, resultCount: number) => {
            // Clear any pending tracking
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Debounce the tracking
            timeoutRef.current = setTimeout(() => {
                trackSearch(query, resultCount);
            }, debounceMs);
        },
        [trackSearch, debounceMs],
    );

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { trackSearch: trackSearchQuery };
}
