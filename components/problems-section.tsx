'use client';

import { Link } from '@/i18n/routing';
import { ProblemList } from '@/components/problem-list';
import { ProblemsSectionClient } from '@/components/problems-section-client';
import type { Problem } from '@/lib/types';
import { useTranslations } from 'next-intl';

export type ProblemsSectionProps = {
    title: string;
    subtitle: string;
    problems: Problem[];
    // Pagination
    currentPage?: number; // zero-based
    totalPages?: number;
    size?: number;
    basePath?: string; // e.g. '/', '/problems'
    showNavigation?: boolean; // whether to show pagination controls
    enableLoadMore?: boolean; // whether to enable client-side progressive loading
    sectionId?: string;
};

export function ProblemsSection({
    title,
    subtitle,
    problems,
    currentPage = 0,
    totalPages = 1,
    size = 9,
    basePath = '/',
    showNavigation = false,
    enableLoadMore = false,
    sectionId = 'problems',
}: ProblemsSectionProps) {
    const t = useTranslations();
    const displayTitle = title;
    const displaySubtitle = subtitle;

    // If enableLoadMore is true, render the client-side version
    if (enableLoadMore) {
        return (
            <ProblemsSectionClient
                initialProblems={problems}
                initialPage={currentPage}
                totalPages={totalPages}
                pageSize={size}
                title={displayTitle}
                subtitle={displaySubtitle}
                sectionId={sectionId}
            />
        );
    }

    // Otherwise, render the server-side version with traditional pagination
    const hasNext = currentPage + 1 < totalPages;
    const hasPrev = currentPage > 0;

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

            <ProblemList problems={problems} />

            {showNavigation && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t">
                    <div className="text-sm font-medium text-muted-foreground">
                        {t('pagination.page')}{' '}
                        <span className="text-foreground font-semibold">{currentPage + 1}</span>{' '}
                        {t('pagination.of')}{' '}
                        <span className="text-foreground font-semibold">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        {hasPrev ? (
                            <Link
                                href={{
                                    pathname: basePath,
                                    query: { page: Math.max(currentPage - 1, 0), size },
                                }}
                                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105 hover:shadow-md"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="mr-2"
                                >
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                                {t('pagination.previous')}
                            </Link>
                        ) : (
                            <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-input bg-muted text-muted-foreground cursor-not-allowed opacity-60">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="mr-2"
                                >
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                                {t('pagination.previous')}
                            </span>
                        )}
                        {hasNext ? (
                            <Link
                                href={{
                                    pathname: basePath,
                                    query: { page: currentPage + 1, size },
                                }}
                                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105 hover:shadow-md"
                            >
                                {t('pagination.next')}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="ml-2"
                                >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </Link>
                        ) : (
                            <span className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-input bg-muted text-muted-foreground cursor-not-allowed opacity-60">
                                {t('pagination.next')}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="ml-2"
                                >
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
