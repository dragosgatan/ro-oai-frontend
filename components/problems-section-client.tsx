'use client';

import * as React from 'react';
import { ProblemList } from '@/components/problem-list';
import { LoadMoreButton } from '@/components/load-more-button';
import { ViewAllButton } from '@/components/view-all-button';
import { fetchApi } from '@/lib/api';
import type { Problem } from '@/lib/types';
import { useTranslations } from 'next-intl';

export type ProblemsSectionClientProps = {
    initialProblems: Problem[];
    initialPage: number;
    totalPages: number;
    pageSize: number;
    title?: string;
    subtitle?: string;
    sectionId?: string;
};

type PageResponse<T> = {
    content: T[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
};

/**
 * ProblemsSectionClient Component
 *
 * Client-side wrapper for the problems section that handles progressive loading.
 * Allows users to load more problems without full page navigation.
 *
 * Features:
 * - Progressive loading with "Load More" button
 * - Error handling with retry functionality
 * - Accessibility support with ARIA live regions
 * - Responsive layout with proper spacing
 * - "View All" button for navigation to full problems page
 */
export function ProblemsSectionClient({
    initialProblems,
    initialPage,
    totalPages,
    pageSize,
    title,
    subtitle,
    sectionId = 'problems',
}: ProblemsSectionClientProps) {
    const t = useTranslations();
    const [problems, setProblems] = React.useState<Problem[]>(initialProblems);
    const [currentPage, setCurrentPage] = React.useState(initialPage);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const hasMore = currentPage + 1 < totalPages;

    // Use translations as defaults if not provided
    const displayTitle = title || t('problems.latestProblems');
    const displaySubtitle = subtitle || t('problems.latestSubtitle');

    /**
     * Fetches the next page of problems from the API
     */
    const fetchProblems = React.useCallback(
        async (page: number): Promise<PageResponse<Problem>> => {
            const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/problems`);
            url.searchParams.set('page', String(page));
            url.searchParams.set('size', String(pageSize));

            const response = await fetchApi(url.toString());

            if (!response.ok) {
                throw new Error(t('problems.errorLoading'));
            }

            return response.json();
        },
        [pageSize, t],
    );

    /**
     * Handles loading more problems
     */
    const handleLoadMore = React.useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        setError(null);

        try {
            const nextPage = currentPage + 1;
            const data = await fetchProblems(nextPage);

            // Append new problems without duplicates
            setProblems((prevProblems) => {
                const existingIds = new Set(prevProblems.map((p) => p.id));
                const newProblems = data.content.filter((p) => !existingIds.has(p.id));
                return [...prevProblems, ...newProblems];
            });

            setCurrentPage(nextPage);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('problems.errorLoading');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, currentPage, fetchProblems, t]);

    /**
     * Handles retry after error
     */
    const handleRetry = React.useCallback(() => {
        setError(null);
        void handleLoadMore();
    }, [handleLoadMore]);

    return (
        <section id={sectionId} className="container mx-auto px-4 md:px-6">
            <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 leading-tight">
                    {displayTitle}
                </h2>
                {displaySubtitle && (
                    <p className="text-base sm:text-lg text-muted-foreground leading-normal">
                        {displaySubtitle}
                    </p>
                )}
            </div>

            {/* ARIA live region for announcing loaded content to screen readers */}
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {isLoading && t('problems.loadingMoreAria')}
                {!isLoading &&
                    problems.length > initialProblems.length &&
                    `${problems.length - initialProblems.length} ${t('problems.availableProblems')}`}
            </div>

            {/* Problems List */}
            <ProblemList problems={problems} />

            {/* Action Buttons - 32px gap before buttons, 16px between buttons */}
            <div className="flex flex-col items-center gap-4 mt-8">
                {/* Load More Button - only show when there are more problems */}
                {hasMore && (
                    <LoadMoreButton
                        onClick={handleLoadMore}
                        isLoading={isLoading}
                        disabled={!hasMore || isLoading}
                        error={error}
                        onRetry={handleRetry}
                    />
                )}

                {/* View All Button */}
                <ViewAllButton href="/problems" />
            </div>
        </section>
    );
}
