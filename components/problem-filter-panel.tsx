'use client';

import * as React from 'react';
import { Search, X, Filter, SlidersHorizontal, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useDebounce } from '@/hooks/use-debounce';
import type { Difficulty, ProblemFilters, AttemptedStatus } from '@/hooks/use-problem-filters';
import type { Category, CompetitionFilterOption } from '@/lib/types';
import { platformSans } from '@/lib/platform-fonts';

// Re-export Category for backward compatibility
export type { Category } from '@/lib/types';

/**
 * Props for the ProblemFilterPanel component
 */
export type ProblemFilterPanelProps = {
    filters: ProblemFilters;
    categories: Category[];
    competitions: CompetitionFilterOption[];
    difficultyCounts: Record<Difficulty, number>;
    categoryCounts: Record<number, number>;
    competitionCounts: Record<number, number>;
    onSearchChange: (search: string) => void;
    onDifficultyToggle: (difficulty: Difficulty) => void;
    onCategoryToggle: (categoryId: number) => void;
    onCompetitionToggle: (competitionId: number) => void;
    onAttemptedStatusChange: (status: AttemptedStatus) => void;
    onClearAll: () => void;
    className?: string;
    isLoading?: boolean;
    isCategoriesLoading?: boolean;
    isCompetitionsLoading?: boolean;
    isAuthenticated?: boolean;
    showSearch?: boolean;
    variant?: 'desktop' | 'mobile';
    resultCount?: number;
    isApplying?: boolean;
};

/**
 * Difficulty levels with their display properties
 */
const DIFFICULTIES: { value: Difficulty; colorClass: string }[] = [
    { value: 'Easy', colorClass: 'text-green-600 dark:text-green-400' },
    { value: 'Medium', colorClass: 'text-yellow-600 dark:text-yellow-400' },
    { value: 'Hard', colorClass: 'text-red-600 dark:text-red-400' },
];

export type ProblemSearchBarProps = {
    value: string;
    onValueChange: (value: string) => void;
    isLoading?: boolean;
    className?: string;
};

export function ProblemSearchBar({
    value,
    onValueChange,
    isLoading = false,
    className,
}: ProblemSearchBarProps) {
    const t = useTranslations();
    const inputRef = React.useRef<HTMLInputElement>(null);

    return (
        <div className={cn('relative', className)} role="search">
            <Search
                className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--platform-violet)]"
                aria-hidden="true"
            />
            <Input
                ref={inputRef}
                type="search"
                placeholder={t('filters.searchPlaceholder')}
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                className="h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] pe-12 ps-12 text-base text-[var(--platform-ink)] shadow-none placeholder:text-[var(--platform-ink-muted)] hover:border-[var(--platform-violet)] focus-visible:border-[var(--platform-violet)] focus-visible:ring-[var(--platform-violet)] sm:h-14"
                aria-label={t('filters.searchAriaLabel')}
                autoComplete="off"
                spellCheck="false"
            />
            {isLoading ? (
                <Loader2
                    className="absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--platform-violet)]"
                    aria-label={t('common.loading')}
                />
            ) : value ? (
                <button
                    type="button"
                    onClick={() => {
                        onValueChange('');
                        inputRef.current?.focus();
                    }}
                    className="absolute end-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-none text-[var(--platform-ink-muted)] hover:bg-[var(--platform-paper-strong)] hover:text-[var(--platform-ink)]"
                    aria-label={t('filters.clearSearch')}
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            ) : null}
        </div>
    );
}

/**
 * Filter panel content - shared between desktop sidebar and mobile drawer
 */
function FilterPanelContent({
    filters,
    categories,
    competitions,
    difficultyCounts,
    categoryCounts,
    competitionCounts,
    onDifficultyToggle,
    onCategoryToggle,
    onCompetitionToggle,
    onAttemptedStatusChange,
    onClearAll,
    searchValue,
    onSearchInputChange,
    isLoading = false,
    isCategoriesLoading = false,
    isCompetitionsLoading = false,
    isAuthenticated = false,
    showSearch = true,
    variant = 'desktop',
    resultCount,
    isApplying = false,
}: ProblemFilterPanelProps & {
    searchValue: string;
    onSearchInputChange: (value: string) => void;
}) {
    const t = useTranslations();
    const difficultyGroupRef = React.useRef<HTMLDivElement>(null);
    const categoryGroupRef = React.useRef<HTMLDivElement>(null);
    const competitionGroupRef = React.useRef<HTMLDivElement>(null);
    const attemptedGroupRef = React.useRef<HTMLDivElement>(null);
    const controlIdPrefix = React.useId();
    const isMobile = variant === 'mobile';

    const hasActiveFilters =
        filters.search.trim() !== '' ||
        filters.difficulty.length > 0 ||
        filters.categoryIds.length > 0 ||
        filters.competitionIds.length > 0 ||
        filters.attemptedStatus !== null;
    const isBusy = isLoading || isApplying;

    const optionRowClassName = (isSelected: boolean, hasVerticalPadding = false) =>
        cn(
            'group -mx-2 flex min-h-11 items-center gap-2 border border-transparent px-2 transition-colors',
            hasVerticalPadding && 'py-1.5',
            'hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)]',
            isMobile &&
                'mx-0 min-h-12 gap-3 border-[var(--platform-line)] px-3 py-1.5 active:bg-[var(--platform-paper-strong)]',
            isMobile &&
                isSelected &&
                'border-[var(--platform-violet)] bg-[color-mix(in_oklch,var(--platform-violet)_10%,var(--platform-paper))]',
        );

    const countClassName = cn(
        'shrink-0 text-xs tabular-nums text-[var(--platform-ink-muted)]',
        isMobile &&
            'bg-[var(--platform-paper-strong)] px-2 py-1 font-mono font-semibold text-[var(--platform-ink-muted-strong)]',
    );

    const sectionClassName = cn('space-y-3 p-4', isMobile && 'space-y-4 px-4 py-5');
    const controlClassName = cn(
        'border-[var(--platform-violet)] data-[state=checked]:bg-[var(--platform-violet)] data-[state=checked]:text-white dark:data-[state=checked]:text-[var(--platform-on-accent)]',
        isMobile && 'h-5 w-5 shrink-0',
    );

    // Handle keyboard navigation within filter groups
    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent, items: HTMLElement[], currentIndex: number) => {
            let nextIndex = currentIndex;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    nextIndex = Math.min(currentIndex + 1, items.length - 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    nextIndex = Math.max(currentIndex - 1, 0);
                    break;
                case 'Home':
                    e.preventDefault();
                    nextIndex = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    nextIndex = items.length - 1;
                    break;
                default:
                    return;
            }

            items[nextIndex]?.focus();
        },
        [],
    );

    // Get focusable checkboxes in a group
    const getCheckboxes = (container: HTMLElement | null): HTMLElement[] => {
        if (!container) return [];
        return Array.from(container.querySelectorAll('[role="checkbox"]'));
    };

    return (
        <div
            className="flex h-full min-h-0 flex-col text-[var(--platform-ink)]"
            role={showSearch ? 'search' : undefined}
            aria-label={showSearch ? t('filters.panelAriaLabel') : undefined}
        >
            {showSearch && (
                <div className="shrink-0 space-y-3 border-b border-[var(--platform-line)] p-4">
                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink-muted)]">
                        {t('filters.search')}
                    </h3>
                    <ProblemSearchBar
                        value={searchValue}
                        onValueChange={onSearchInputChange}
                        isLoading={isLoading}
                    />
                </div>
            )}

            <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--platform-coral)] sm:[scrollbar-gutter:stable]"
                data-testid="problem-filter-scroll-region"
                role="group"
                aria-label={`${t('filters.title')}: ${t('filters.difficulty')}, ${t('filters.categories')}, ${t('filters.competitions')}`}
                tabIndex={0}
            >
                <div className="divide-y divide-[var(--platform-line)]">
                    {/* Difficulty Section */}
                    <fieldset className={sectionClassName}>
                        <legend className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink-muted)]">
                            {t('filters.difficulty')}
                        </legend>
                        <div
                            ref={difficultyGroupRef}
                            className="space-y-2"
                            role="group"
                            aria-label={t('filters.difficulty')}
                        >
                            {DIFFICULTIES.map(({ value, colorClass }, index) => {
                                const count = difficultyCounts[value] ?? 0;
                                const isChecked = filters.difficulty.includes(value);
                                const checkboxId = `${controlIdPrefix}-difficulty-${value}`;

                                return (
                                    <div
                                        key={value}
                                        className={optionRowClassName(isChecked)}
                                        data-selected={isChecked}
                                    >
                                        <Checkbox
                                            id={checkboxId}
                                            checked={isChecked}
                                            onCheckedChange={() => onDifficultyToggle(value)}
                                            className={controlClassName}
                                            aria-label={`${t(`difficulty.${value.toLowerCase()}`)} (${count} ${t('filters.problemsCount', { count })})`}
                                            onKeyDown={(e) => {
                                                const checkboxes = getCheckboxes(
                                                    difficultyGroupRef.current,
                                                );
                                                handleKeyDown(e, checkboxes, index);
                                            }}
                                        />
                                        <Label
                                            htmlFor={checkboxId}
                                            className={cn(
                                                'flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 self-stretch py-2 text-sm font-semibold',
                                                colorClass,
                                            )}
                                        >
                                            <span>{t(`difficulty.${value.toLowerCase()}`)}</span>
                                            <span className={countClassName} aria-hidden="true">
                                                {count}
                                            </span>
                                        </Label>
                                    </div>
                                );
                            })}
                        </div>
                    </fieldset>

                    {/* Categories Section */}
                    <fieldset className={sectionClassName}>
                        <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink-muted)]">
                            {t('filters.categories')}
                            {isCategoriesLoading && (
                                <Loader2
                                    className="h-3 w-3 animate-spin text-[var(--platform-violet)]"
                                    aria-label={t('filters.loadingCategories')}
                                />
                            )}
                        </legend>
                        {categories.length === 0 ? (
                            <p className="text-sm text-[var(--platform-ink-muted)]" role="status">
                                {isCategoriesLoading
                                    ? t('filters.loadingCategories')
                                    : t('filters.noCategories')}
                            </p>
                        ) : (
                            <div
                                ref={categoryGroupRef}
                                className="space-y-2"
                                role="group"
                                aria-label={t('filters.categories')}
                            >
                                {categories.map((category, index) => {
                                    const count =
                                        categoryCounts[category.id] ?? category.problemCount;
                                    const isChecked = filters.categoryIds.includes(category.id);
                                    const checkboxId = `${controlIdPrefix}-category-${category.id}`;

                                    return (
                                        <div
                                            key={category.id}
                                            className={optionRowClassName(isChecked)}
                                            data-selected={isChecked}
                                        >
                                            <Checkbox
                                                id={checkboxId}
                                                checked={isChecked}
                                                onCheckedChange={() =>
                                                    onCategoryToggle(category.id)
                                                }
                                                className={controlClassName}
                                                aria-label={`${category.name} (${count} ${t('filters.problemsCount', { count })})`}
                                                onKeyDown={(e) => {
                                                    const checkboxes = getCheckboxes(
                                                        categoryGroupRef.current,
                                                    );
                                                    handleKeyDown(e, checkboxes, index);
                                                }}
                                            />
                                            <Label
                                                htmlFor={checkboxId}
                                                className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 self-stretch py-2 text-sm font-semibold leading-snug"
                                            >
                                                <span className="min-w-0">{category.name}</span>
                                                <span className={countClassName} aria-hidden="true">
                                                    {count}
                                                </span>
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </fieldset>

                    {/* Competitions Section */}
                    <fieldset className={sectionClassName}>
                        <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink-muted)]">
                            {t('filters.competitions')}
                            {isCompetitionsLoading && (
                                <Loader2
                                    className="h-3 w-3 animate-spin text-[var(--platform-violet)]"
                                    aria-label={t('filters.loadingCompetitions')}
                                />
                            )}
                        </legend>
                        {competitions.length === 0 ? (
                            <p className="text-sm text-[var(--platform-ink-muted)]" role="status">
                                {isCompetitionsLoading
                                    ? t('filters.loadingCompetitions')
                                    : t('filters.noCompetitions')}
                            </p>
                        ) : (
                            <div
                                ref={competitionGroupRef}
                                className="space-y-2"
                                role="group"
                                aria-label={t('filters.competitions')}
                            >
                                {competitions.map((competition, index) => {
                                    const count = competitionCounts[competition.id] ?? 0;
                                    const isChecked = filters.competitionIds.includes(
                                        competition.id,
                                    );
                                    const checkboxId = `${controlIdPrefix}-competition-${competition.id}`;

                                    return (
                                        <div
                                            key={competition.id}
                                            className={optionRowClassName(isChecked, true)}
                                            data-selected={isChecked}
                                        >
                                            <Checkbox
                                                id={checkboxId}
                                                checked={isChecked}
                                                onCheckedChange={() =>
                                                    onCompetitionToggle(competition.id)
                                                }
                                                className={controlClassName}
                                                aria-label={`${competition.name} (${count} ${t('filters.problemsCount', { count })})`}
                                                onKeyDown={(e) => {
                                                    const checkboxes = getCheckboxes(
                                                        competitionGroupRef.current,
                                                    );
                                                    handleKeyDown(e, checkboxes, index);
                                                }}
                                            />
                                            <Label
                                                htmlFor={checkboxId}
                                                className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 self-stretch py-2 text-sm font-semibold leading-snug"
                                            >
                                                <span className="min-w-0">{competition.name}</span>
                                                <span className={countClassName} aria-hidden="true">
                                                    {count}
                                                </span>
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </fieldset>

                    {/* Attempted Status Section - Only show when authenticated */}
                    {isAuthenticated && (
                        <fieldset className={sectionClassName}>
                            <legend className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--platform-ink-muted)]">
                                {t('filters.attemptedStatus')}
                            </legend>
                            <RadioGroup
                                ref={attemptedGroupRef}
                                value={filters.attemptedStatus ?? 'all'}
                                onValueChange={(value) =>
                                    onAttemptedStatusChange(
                                        value === 'attempted' || value === 'unattempted'
                                            ? value
                                            : null,
                                    )
                                }
                                className="gap-1"
                                aria-label={t('filters.attemptedStatus')}
                            >
                                <div
                                    className={optionRowClassName(filters.attemptedStatus === null)}
                                    data-selected={filters.attemptedStatus === null}
                                >
                                    <RadioGroupItem
                                        id={`${controlIdPrefix}-attempted-all`}
                                        value="all"
                                        className={cn(
                                            'border-[var(--platform-violet)] text-[var(--platform-violet)]',
                                            isMobile && 'h-5 w-5 shrink-0',
                                        )}
                                        aria-label={t('filters.allProblems')}
                                    />
                                    <Label
                                        htmlFor={`${controlIdPrefix}-attempted-all`}
                                        className="flex flex-1 cursor-pointer items-center self-stretch py-2 text-sm font-semibold"
                                    >
                                        {t('filters.allProblems')}
                                    </Label>
                                </div>
                                <div
                                    className={optionRowClassName(
                                        filters.attemptedStatus === 'attempted',
                                    )}
                                    data-selected={filters.attemptedStatus === 'attempted'}
                                >
                                    <RadioGroupItem
                                        id={`${controlIdPrefix}-attempted-yes`}
                                        value="attempted"
                                        className={cn(
                                            'border-[var(--platform-violet)] text-[var(--platform-violet)]',
                                            isMobile && 'h-5 w-5 shrink-0',
                                        )}
                                        aria-label={t('filters.attempted')}
                                    />
                                    <Label
                                        htmlFor={`${controlIdPrefix}-attempted-yes`}
                                        className="flex flex-1 cursor-pointer items-center self-stretch py-2 text-sm font-semibold"
                                    >
                                        {t('filters.attempted')}
                                    </Label>
                                </div>
                                <div
                                    className={optionRowClassName(
                                        filters.attemptedStatus === 'unattempted',
                                    )}
                                    data-selected={filters.attemptedStatus === 'unattempted'}
                                >
                                    <RadioGroupItem
                                        id={`${controlIdPrefix}-attempted-no`}
                                        value="unattempted"
                                        className={cn(
                                            'border-[var(--platform-violet)] text-[var(--platform-violet)]',
                                            isMobile && 'h-5 w-5 shrink-0',
                                        )}
                                        aria-label={t('filters.unattempted')}
                                    />
                                    <Label
                                        htmlFor={`${controlIdPrefix}-attempted-no`}
                                        className="flex flex-1 cursor-pointer items-center self-stretch py-2 text-sm font-semibold"
                                    >
                                        {t('filters.unattempted')}
                                    </Label>
                                </div>
                            </RadioGroup>
                        </fieldset>
                    )}
                </div>
            </div>

            {(hasActiveFilters || isMobile) && (
                <div
                    className={cn(
                        'shrink-0 border-t border-[var(--platform-line)] p-4',
                        isMobile &&
                            'grid grid-cols-2 gap-3 border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
                    )}
                    data-testid={isMobile ? 'mobile-filter-actions' : undefined}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearAll}
                        className="h-auto min-h-11 w-full rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 py-2 text-xs font-bold leading-tight whitespace-normal text-[var(--platform-ink)] shadow-none hover:border-[var(--platform-violet)] hover:bg-[var(--platform-citron)] hover:text-[var(--platform-on-accent)] disabled:opacity-45 sm:text-sm"
                        aria-label={t('filters.clearAllAriaLabel')}
                        disabled={isBusy || !hasActiveFilters}
                    >
                        {isBusy ? (
                            <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        ) : (
                            <X className="me-2 h-4 w-4" />
                        )}
                        {t('filters.clearAll')}
                    </Button>

                    {isMobile && (
                        <SheetClose asChild>
                            <Button
                                type="button"
                                size="sm"
                                className="h-auto min-h-11 w-full rounded-none bg-[var(--platform-violet)] px-3 py-2 text-sm font-bold text-white shadow-[3px_3px_0_var(--platform-citron)] hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]"
                                aria-label={
                                    resultCount === undefined
                                        ? t('common.close')
                                        : `${t('common.close')}: ${t('filters.resultsCount', { count: resultCount })}`
                                }
                            >
                                <span>{t('common.close')}</span>
                                {resultCount !== undefined && (
                                    <span
                                        className="ms-2 bg-[var(--platform-citron)] px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums text-[var(--platform-on-accent)]"
                                        aria-hidden="true"
                                    >
                                        {resultCount}
                                    </span>
                                )}
                            </Button>
                        </SheetClose>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * ProblemFilterPanel component
 *
 * A filter panel for problems with search, difficulty, and category filters.
 * Displays as a sidebar on desktop and a drawer/sheet on mobile.
 *
 * Accessibility features:
 * - Full keyboard navigation with arrow keys within filter groups
 * - ARIA labels and roles for screen readers
 * - Focus management for clear buttons
 * - Loading states with appropriate announcements
 *
 * Requirements: 5.1, 5.2, 5.5, 10.1, 10.2, 10.3, 10.4
 */
export function ProblemFilterPanel(props: ProblemFilterPanelProps) {
    const {
        filters,
        onSearchChange,
        className,
        isLoading,
        isCategoriesLoading,
        isApplying = false,
        resultCount,
        variant = 'desktop',
    } = props;
    const t = useTranslations();

    // Local state for search input - initialized from filters
    const [searchValue, setSearchValue] = React.useState(filters.search);

    // Track the last value we sent to parent to avoid loops
    const lastSentValue = React.useRef(filters.search);

    // Debounce the search value
    const debouncedSearch = useDebounce(searchValue, 300);

    // Send debounced value to parent only if it's different from what we last sent
    React.useEffect(() => {
        if (debouncedSearch !== lastSentValue.current) {
            lastSentValue.current = debouncedSearch;
            onSearchChange(debouncedSearch);
        }
    }, [debouncedSearch, onSearchChange]);

    // Only sync from parent when it's a "clear all" or external change
    // (i.e., when parent value differs from both local and last sent)
    React.useEffect(() => {
        if (filters.search !== lastSentValue.current && filters.search !== searchValue) {
            setSearchValue(filters.search);
            lastSentValue.current = filters.search;
        }
    }, [filters.search, searchValue]);

    const handleSearchInputChange = (value: string) => {
        setSearchValue(value);
    };

    const activeFilterCount =
        (filters.search.trim() ? 1 : 0) +
        filters.difficulty.length +
        filters.categoryIds.length +
        filters.competitionIds.length +
        (filters.attemptedStatus ? 1 : 0);

    // Mobile: bottom sheet. Explicit rendering avoids a hydration-time sidebar flash.
    if (variant === 'mobile') {
        return (
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            'h-12 w-full min-w-28 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 font-semibold text-[var(--platform-ink)] shadow-none hover:border-[var(--platform-violet)] hover:bg-[var(--platform-citron)] hover:text-[var(--platform-on-accent)] sm:h-14 sm:w-auto',
                            className,
                        )}
                        aria-label={`${t('filters.openFilters')}${activeFilterCount > 0 ? ` (${t('filters.activeFiltersCount', { count: activeFilterCount })})` : ''}`}
                        aria-haspopup="dialog"
                    >
                        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                        {t('filters.filters')}
                        {activeFilterCount > 0 && (
                            <span
                                className="ms-1 rounded-none bg-[var(--platform-violet)] px-1.5 py-0.5 text-xs font-bold tabular-nums text-white dark:text-[var(--platform-on-accent)]"
                                aria-hidden="true"
                            >
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent
                    side="bottom"
                    closeLabel={t('common.close')}
                    className={cn(
                        'platform-overlay-surface flex h-[92dvh] max-h-[50rem] min-h-0 flex-col gap-0 overflow-hidden rounded-none border-t-2 border-[var(--platform-violet)] bg-[var(--platform-paper)] p-0 text-[var(--platform-ink)] shadow-[0_-12px_36px_color-mix(in_oklch,var(--platform-ink)_18%,transparent)] data-[state=closed]:duration-200 data-[state=open]:duration-200 [&>button:last-child]:hidden',
                        platformSans.className,
                    )}
                >
                    <SheetHeader
                        className="platform-toolbar shrink-0 space-y-0 border-b border-[var(--platform-line-strong)] px-4 py-4 text-start"
                        data-testid="mobile-filter-header"
                    >
                        <div className="flex min-h-11 items-center gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                                <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <SheetTitle className="text-lg font-bold tracking-[-0.025em] text-[var(--platform-ink)]">
                                    {t('filters.title')}
                                </SheetTitle>
                                {(resultCount !== undefined || activeFilterCount > 0) && (
                                    <p
                                        className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-[var(--platform-ink-muted)]"
                                        role="status"
                                        aria-live="polite"
                                        aria-atomic="true"
                                    >
                                        {isApplying && (
                                            <Loader2
                                                className="h-3.5 w-3.5 animate-spin text-[var(--platform-violet)]"
                                                aria-hidden="true"
                                            />
                                        )}
                                        {isApplying
                                            ? t('filters.applyingFilters')
                                            : activeFilterCount > 0
                                              ? t('filters.activeFiltersCount', {
                                                    count: activeFilterCount,
                                                })
                                              : t('filters.resultsCount', {
                                                    count: resultCount ?? 0,
                                                })}
                                    </p>
                                )}
                            </div>
                            {activeFilterCount > 0 && (
                                <span
                                    className="grid h-7 min-w-7 shrink-0 place-items-center bg-[var(--platform-citron)] px-1.5 font-mono text-xs font-bold tabular-nums text-[var(--platform-on-accent)]"
                                    aria-hidden="true"
                                >
                                    {activeFilterCount}
                                </span>
                            )}
                            <SheetClose asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-11 w-11 shrink-0 rounded-none border border-transparent p-0 text-[var(--platform-ink-muted)] shadow-none hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper)] hover:text-[var(--platform-ink)] focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                                    aria-label={t('common.close')}
                                >
                                    <X className="h-5 w-5" aria-hidden="true" />
                                </Button>
                            </SheetClose>
                        </div>
                        <SheetDescription className="sr-only">
                            {t('filters.panelAriaLabel')}
                        </SheetDescription>
                    </SheetHeader>
                    <FilterPanelContent
                        {...props}
                        searchValue={searchValue}
                        onSearchInputChange={handleSearchInputChange}
                        isLoading={isLoading}
                        isCategoriesLoading={isCategoriesLoading}
                    />
                </SheetContent>
            </Sheet>
        );
    }

    // Desktop: sticky filter index.
    return (
        <aside
            className={cn(
                'platform-panel sticky top-24 flex max-h-[calc(100dvh-7rem)] min-h-0 w-[18rem] shrink-0 self-start flex-col overflow-hidden bg-[var(--platform-paper)]',
                className,
            )}
            aria-label={t('filters.panelAriaLabel')}
            role="complementary"
        >
            <div className="flex min-h-14 shrink-0 items-center gap-2 border-b border-[var(--platform-line-strong)] px-4 py-3.5">
                <Filter className="h-4 w-4 text-[var(--platform-violet)]" aria-hidden="true" />
                <h2
                    className="text-sm font-bold tracking-[-0.01em] text-[var(--platform-ink)]"
                    id="filter-panel-title"
                >
                    {t('filters.title')}
                </h2>
                {activeFilterCount > 0 && (
                    <span
                        className="ms-auto rounded-none bg-[var(--platform-citron)] px-2 py-1 text-xs font-bold tabular-nums text-[var(--platform-on-accent)]"
                        aria-label={t('filters.activeFiltersCount', {
                            count: activeFilterCount,
                        })}
                    >
                        {activeFilterCount}
                    </span>
                )}
            </div>
            <FilterPanelContent
                {...props}
                searchValue={searchValue}
                onSearchInputChange={handleSearchInputChange}
                isLoading={isLoading}
                isCategoriesLoading={isCategoriesLoading}
            />
        </aside>
    );
}

export default ProblemFilterPanel;
