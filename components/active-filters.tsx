'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Difficulty, ProblemFilters } from '@/hooks/use-problem-filters';
import type { Category, CompetitionFilterOption } from '@/lib/types';

/**
 * Props for the ActiveFilters component
 */
export type ActiveFiltersProps = {
    filters: ProblemFilters;
    categories: Category[];
    competitions: CompetitionFilterOption[];
    onRemoveFilter: (
        type: 'search' | 'difficulty' | 'category' | 'competition' | 'attemptedStatus',
        value?: string | number,
    ) => void;
    onClearAll: () => void;
    className?: string;
    isLoading?: boolean;
};

/**
 * Get display color class for difficulty badge
 */
function getDifficultyColorClass(difficulty: Difficulty): string {
    switch (difficulty) {
        case 'Easy':
            return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300';
        case 'Medium':
            return 'border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-300';
        case 'Hard':
            return 'border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300';
        default:
            return '';
    }
}

/**
 * ActiveFilters component
 *
 * Displays chips/badges for each active filter with the ability to remove them.
 * Shows a "Clear all" button when multiple filters are active.
 *
 * Accessibility features:
 * - Keyboard navigation with Tab and Enter/Space
 * - ARIA labels for screen readers
 * - Live region for filter changes
 * - Focus management after filter removal
 *
 * Requirements: 5.3, 5.4, 10.4, 10.5
 */
export function ActiveFilters({
    filters,
    categories,
    competitions,
    onRemoveFilter,
    onClearAll,
    className,
    isLoading = false,
}: ActiveFiltersProps) {
    const t = useTranslations();
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Check if there are any active filters
    const hasSearch = filters.search.trim() !== '';
    const hasDifficulty = filters.difficulty.length > 0;
    const hasCategories = filters.categoryIds.length > 0;
    const hasCompetitions = filters.competitionIds.length > 0;
    const hasAttemptedStatus = filters.attemptedStatus !== null;
    const hasActiveFilters =
        hasSearch || hasDifficulty || hasCategories || hasCompetitions || hasAttemptedStatus;

    // Count total active filter values
    const activeFilterCount =
        (hasSearch ? 1 : 0) +
        filters.difficulty.length +
        filters.categoryIds.length +
        filters.competitionIds.length +
        (hasAttemptedStatus ? 1 : 0);

    // Don't render if no active filters
    if (!hasActiveFilters) {
        return null;
    }

    // Get category name by ID
    const getCategoryName = (categoryId: number): string => {
        const category = categories.find((c) => c.id === categoryId);
        return category?.name ?? `Category ${categoryId}`;
    };

    // Get competition name by ID
    const getCompetitionName = (competitionId: number): string => {
        const competition = competitions.find((c) => c.id === competitionId);
        return competition?.name ?? `Competition ${competitionId}`;
    };

    // Handle keyboard interaction for filter badges
    const handleBadgeKeyDown = (
        e: React.KeyboardEvent,
        type: 'search' | 'difficulty' | 'category' | 'competition' | 'attemptedStatus',
        value?: string | number,
    ) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            onRemoveFilter(type, value);
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn('flex flex-wrap items-center gap-2', className)}
            role="region"
            aria-label={t('filters.activeFilters')}
            aria-live="polite"
            aria-atomic="false"
        >
            {/* Screen reader announcement for filter count */}
            <span className="sr-only">
                {t('filters.activeFiltersCount', { count: activeFilterCount })}
            </span>

            {/* Search filter chip */}
            {hasSearch && (
                <Badge
                    variant="secondary"
                    className={cn(
                        'min-h-11 cursor-pointer gap-1 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] pr-2 shadow-none hover:bg-[var(--platform-paper-strong)]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    )}
                    onClick={() => onRemoveFilter('search')}
                    onKeyDown={(e) => handleBadgeKeyDown(e, 'search')}
                    role="button"
                    tabIndex={0}
                    aria-label={`${t('filters.removeFilter')}: ${t('filters.search')} "${filters.search}"`}
                >
                    <span className="text-muted-foreground mr-1" aria-hidden="true">
                        {t('filters.search')}:
                    </span>
                    <span className="max-w-[150px] truncate">{filters.search}</span>
                    <span
                        className="ml-1 inline-flex items-center justify-center p-1 hover:bg-[var(--platform-line)]"
                        aria-hidden="true"
                    >
                        <X className="h-3 w-3" />
                    </span>
                </Badge>
            )}

            {/* Difficulty filter chips */}
            {filters.difficulty.map((difficulty) => (
                <Badge
                    key={`difficulty-${difficulty}`}
                    variant="outline"
                    className={cn(
                        'min-h-11 cursor-pointer gap-1 rounded-none pr-2 shadow-none',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                        getDifficultyColorClass(difficulty),
                    )}
                    onClick={() => onRemoveFilter('difficulty', difficulty)}
                    onKeyDown={(e) => handleBadgeKeyDown(e, 'difficulty', difficulty)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${t('filters.removeFilter')}: ${t(`difficulty.${difficulty.toLowerCase()}`)}`}
                >
                    {t(`difficulty.${difficulty.toLowerCase()}`)}
                    <span
                        className="ml-1 inline-flex items-center justify-center p-1 hover:bg-black/10 dark:hover:bg-white/10"
                        aria-hidden="true"
                    >
                        <X className="h-3 w-3" />
                    </span>
                </Badge>
            ))}

            {/* Category filter chips */}
            {filters.categoryIds.map((categoryId) => (
                <Badge
                    key={`category-${categoryId}`}
                    variant="secondary"
                    className={cn(
                        'min-h-11 cursor-pointer gap-1 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] pr-2 shadow-none hover:bg-[var(--platform-paper-strong)]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    )}
                    onClick={() => onRemoveFilter('category', categoryId)}
                    onKeyDown={(e) => handleBadgeKeyDown(e, 'category', categoryId)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${t('filters.removeFilter')}: ${getCategoryName(categoryId)}`}
                >
                    <span className="max-w-[150px] truncate">{getCategoryName(categoryId)}</span>
                    <span
                        className="ml-1 inline-flex items-center justify-center p-1 hover:bg-[var(--platform-line)]"
                        aria-hidden="true"
                    >
                        <X className="h-3 w-3" />
                    </span>
                </Badge>
            ))}

            {/* Competition filter chips */}
            {filters.competitionIds.map((competitionId) => (
                <Badge
                    key={`competition-${competitionId}`}
                    variant="secondary"
                    className={cn(
                        'min-h-11 cursor-pointer gap-1 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] pr-2 text-[var(--platform-ink)] shadow-none hover:bg-[var(--platform-paper-strong)]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    )}
                    onClick={() => onRemoveFilter('competition', competitionId)}
                    onKeyDown={(e) => handleBadgeKeyDown(e, 'competition', competitionId)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${t('filters.removeFilter')}: ${getCompetitionName(competitionId)}`}
                >
                    <span className="max-w-[150px] truncate">
                        {getCompetitionName(competitionId)}
                    </span>
                    <span
                        className="ml-1 inline-flex items-center justify-center rounded p-0.5 hover:bg-muted"
                        aria-hidden="true"
                    >
                        <X className="h-3 w-3" />
                    </span>
                </Badge>
            ))}

            {/* Attempted status filter chip */}
            {hasAttemptedStatus && (
                <Badge
                    variant="secondary"
                    className={cn(
                        'gap-1 pr-1 cursor-pointer',
                        'min-h-11 cursor-pointer gap-1 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] pr-2 text-[var(--platform-ink)] shadow-none hover:bg-[var(--platform-paper-strong)]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    )}
                    onClick={() => onRemoveFilter('attemptedStatus')}
                    onKeyDown={(e) => handleBadgeKeyDown(e, 'attemptedStatus')}
                    role="button"
                    tabIndex={0}
                    aria-label={`${t('filters.removeFilter')}: ${t(`filters.${filters.attemptedStatus}`)}`}
                >
                    {t(`filters.${filters.attemptedStatus}`)}
                    <span
                        className="ml-1 inline-flex items-center justify-center p-1 hover:bg-black/10 dark:hover:bg-white/10"
                        aria-hidden="true"
                    >
                        <X className="h-3 w-3" />
                    </span>
                </Badge>
            )}

            {/* Clear all button - show when multiple filters are active */}
            {activeFilterCount > 1 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    disabled={isLoading}
                    className="min-h-11 rounded-none px-3 text-xs text-[var(--platform-ink-muted)] hover:bg-[var(--platform-paper-strong)] hover:text-[var(--platform-ink)] focus-visible:ring-2 focus-visible:ring-[var(--platform-violet)] focus-visible:ring-offset-2"
                    aria-label={t('filters.clearAllAriaLabel')}
                >
                    <X className="h-3 w-3 mr-1" aria-hidden="true" />
                    {t('filters.clearAll')}
                </Button>
            )}
        </div>
    );
}

export default ActiveFilters;
