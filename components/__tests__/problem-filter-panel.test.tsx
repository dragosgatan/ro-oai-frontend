/**
 * Problem Filter Panel Unit Tests
 *
 * Unit tests for task 12.4: Filter Panel Components
 *
 * Tests:
 * - Search input debouncing
 * - Checkbox interactions
 * - Clear all functionality
 *
 * **Validates: Requirements 1.4, 5.2, 5.4, 5.5**
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import type { ProblemFilters, Difficulty } from '@/hooks/use-problem-filters';
import type { Category, CompetitionFilterOption } from '@/lib/types';

vi.mock('next/font/google', () => ({
    Onest: () => ({ className: 'platform-sans', variable: '--font-home-sans' }),
    Unbounded: () => ({ className: 'platform-display', variable: '--font-home-display' }),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
    useTranslations: () => (key: string, values?: Record<string, number>) => {
        const translations: Record<string, string> = {
            'filters.title': 'Filters',
            'filters.filters': 'Filters',
            'filters.search': 'Search',
            'filters.searchPlaceholder': 'Search problems...',
            'filters.searchAriaLabel': 'Search problems by name',
            'filters.clearSearch': 'Clear search',
            'filters.difficulty': 'Difficulty',
            'filters.categories': 'Categories',
            'filters.noCategories': 'No categories available',
            'filters.competitions': 'Competitions',
            'filters.noCompetitions': 'No competitions available',
            'filters.loadingCompetitions': 'Loading competitions...',
            'filters.attemptedStatus': 'Attempted Status',
            'filters.allProblems': 'All Problems',
            'filters.attempted': 'Attempted',
            'filters.unattempted': 'Not Attempted',
            'filters.clearAll': 'Clear all filters',
            'filters.clearAllAriaLabel': 'Clear all active filters',
            'filters.openFilters': 'Open filters',
            'filters.panelAriaLabel': 'Problem filters panel',
            'filters.activeFilters': 'Active filters',
            'filters.applyingFilters': 'Applying filters...',
            'filters.removeFilter': 'Remove filter',
            'filters.problemsCount': 'problems',
            'common.loading': 'Loading...',
            'common.close': 'Close',
            'difficulty.easy': 'Easy',
            'difficulty.medium': 'Medium',
            'difficulty.hard': 'Hard',
        };

        if (key === 'filters.activeFiltersCount') {
            const count = values?.count ?? 0;
            return `${count} active ${count === 1 ? 'filter' : 'filters'}`;
        }

        if (key === 'filters.resultsCount') {
            const count = values?.count ?? 0;
            return `${count} ${count === 1 ? 'problem' : 'problems'}`;
        }

        return translations[key] ?? key;
    },
}));

// Mock use-mobile hook
vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => false, // Default to desktop view
}));

// Mock use-debounce hook - return value immediately for testing
vi.mock('@/hooks/use-debounce', () => ({
    useDebounce: (value: string) => value,
}));

// Import after mocking
import { ProblemFilterPanel } from '../problem-filter-panel';
import { ActiveFilters } from '../active-filters';

// Test data
const mockCategories: Category[] = [
    { id: 1, name: 'Machine Learning', description: 'ML problems', problemCount: 10 },
    { id: 2, name: 'Computer Vision', description: 'CV problems', problemCount: 5 },
    { id: 3, name: 'NLP', description: 'Natural Language Processing', problemCount: 8 },
];

const mockDifficultyCounts: Record<Difficulty, number> = {
    Easy: 15,
    Medium: 20,
    Hard: 10,
};

const mockCategoryCounts: Record<number, number> = {
    1: 10,
    2: 5,
    3: 8,
};

const mockCompetitions: CompetitionFilterOption[] = [];

const mockCompetitionCounts: Record<number, number> = {};

const emptyFilters: ProblemFilters = {
    search: '',
    difficulty: [],
    categoryIds: [],
    competitionIds: [],
    attemptedStatus: null,
};

describe('ProblemFilterPanel', () => {
    afterEach(() => {
        cleanup();
    });

    describe('Search Input', () => {
        it('should render search input with placeholder', () => {
            const onSearchChange = vi.fn();

            render(
                <ProblemFilterPanel
                    filters={emptyFilters}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={onSearchChange}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            const searchInput = screen.getByPlaceholderText('Search problems...');
            expect(searchInput).toBeInTheDocument();
        });

        it('should call onSearchChange when user types', async () => {
            const user = userEvent.setup();
            const onSearchChange = vi.fn();

            render(
                <ProblemFilterPanel
                    filters={emptyFilters}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={onSearchChange}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            const searchInput = screen.getByPlaceholderText('Search problems...');
            await user.type(searchInput, 'a');

            // The debounced search should trigger the callback
            expect(onSearchChange).toHaveBeenCalled();
        });

        it('should show clear button when search has value', () => {
            const onSearchChange = vi.fn();
            const filtersWithSearch: ProblemFilters = {
                ...emptyFilters,
                search: 'test',
            };

            render(
                <ProblemFilterPanel
                    filters={filtersWithSearch}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={onSearchChange}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            const clearButton = screen.getByLabelText('Clear search');
            expect(clearButton).toBeInTheDocument();
        });

        it('should clear search input when clear button is clicked', () => {
            const onSearchChange = vi.fn();
            const filtersWithSearch: ProblemFilters = {
                ...emptyFilters,
                search: 'test',
            };

            render(
                <ProblemFilterPanel
                    filters={filtersWithSearch}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={onSearchChange}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            const searchInput = screen.getByPlaceholderText('Search problems...');
            expect(searchInput).toHaveValue('test');

            const clearButton = screen.getByLabelText('Clear search');
            fireEvent.click(clearButton);

            // The clear button should trigger the search change callback with empty string
            // after debounce (which is mocked to be immediate)
            expect(onSearchChange).toHaveBeenCalledWith('');
        });
    });

    describe('Difficulty Checkboxes', () => {
        it('should render all difficulty checkboxes', () => {
            render(
                <ProblemFilterPanel
                    filters={emptyFilters}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            expect(screen.getByText('Easy')).toBeInTheDocument();
            expect(screen.getByText('Medium')).toBeInTheDocument();
            expect(screen.getByText('Hard')).toBeInTheDocument();
        });

        it('should call onDifficultyToggle when checkbox is clicked', () => {
            const onDifficultyToggle = vi.fn();

            render(
                <ProblemFilterPanel
                    filters={emptyFilters}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={onDifficultyToggle}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            const easyCheckbox = screen.getByRole('checkbox', { name: /easy/i });
            fireEvent.click(easyCheckbox);

            expect(onDifficultyToggle).toHaveBeenCalledWith('Easy');
        });

        it('should show checked state for selected difficulties', () => {
            const filtersWithDifficulty: ProblemFilters = {
                ...emptyFilters,
                difficulty: ['Easy', 'Hard'],
            };

            render(
                <ProblemFilterPanel
                    filters={filtersWithDifficulty}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            const easyCheckbox = screen.getByRole('checkbox', { name: /easy/i });
            const mediumCheckbox = screen.getByRole('checkbox', { name: /medium/i });
            const hardCheckbox = screen.getByRole('checkbox', { name: /hard/i });

            expect(easyCheckbox).toBeChecked();
            expect(mediumCheckbox).not.toBeChecked();
            expect(hardCheckbox).toBeChecked();
        });
    });

    describe('Category Checkboxes', () => {
        it('should render all category checkboxes', () => {
            render(
                <ProblemFilterPanel
                    filters={emptyFilters}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            expect(screen.getByText('Machine Learning')).toBeInTheDocument();
            expect(screen.getByText('Computer Vision')).toBeInTheDocument();
            expect(screen.getByText('NLP')).toBeInTheDocument();
        });

        it('should call onCategoryToggle when checkbox is clicked', () => {
            const onCategoryToggle = vi.fn();

            render(
                <ProblemFilterPanel
                    filters={emptyFilters}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={onCategoryToggle}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            const mlCheckbox = screen.getByRole('checkbox', { name: /machine learning/i });
            fireEvent.click(mlCheckbox);

            expect(onCategoryToggle).toHaveBeenCalledWith(1);
        });

        it('should show no categories message when categories array is empty', () => {
            render(
                <ProblemFilterPanel
                    filters={emptyFilters}
                    categories={[]}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={{}}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            expect(screen.getByText('No categories available')).toBeInTheDocument();
        });
    });

    describe('Clear All Button', () => {
        it('should show clear all button when filters are active', () => {
            const filtersWithValues: ProblemFilters = {
                search: 'test',
                difficulty: ['Easy'],
                categoryIds: [1],
                competitionIds: [],
                attemptedStatus: null,
            };

            render(
                <ProblemFilterPanel
                    filters={filtersWithValues}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            expect(screen.getByText('Clear all filters')).toBeInTheDocument();
        });

        it('should not show clear all button when no filters are active', () => {
            render(
                <ProblemFilterPanel
                    filters={emptyFilters}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            expect(screen.queryByText('Clear all filters')).not.toBeInTheDocument();
        });

        it('should call onClearAll when clear all button is clicked', () => {
            const onClearAll = vi.fn();
            const filtersWithValues: ProblemFilters = {
                search: 'test',
                difficulty: ['Easy'],
                categoryIds: [1],
                competitionIds: [],
                attemptedStatus: null,
            };

            render(
                <ProblemFilterPanel
                    filters={filtersWithValues}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={onClearAll}
                />,
            );

            const clearAllButton = screen.getByText('Clear all filters');
            fireEvent.click(clearAllButton);

            expect(onClearAll).toHaveBeenCalled();
        });
    });

    describe('Filter Count Badge', () => {
        it('should show active filter count in header', () => {
            const filtersWithValues: ProblemFilters = {
                search: 'test',
                difficulty: ['Easy', 'Medium'],
                categoryIds: [1],
                competitionIds: [],
                attemptedStatus: null,
            };

            render(
                <ProblemFilterPanel
                    filters={filtersWithValues}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            // 1 search + 2 difficulties + 1 category = 4
            expect(screen.getByText('4')).toBeInTheDocument();
        });
    });

    describe('Scrollable filter content', () => {
        const filtersWithValues: ProblemFilters = {
            ...emptyFilters,
            difficulty: ['Easy'],
        };

        it('keeps every filter in the scroll region and the clear action fixed outside it', () => {
            render(
                <ProblemFilterPanel
                    filters={filtersWithValues}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                    isAuthenticated
                />,
            );

            const scrollRegion = screen.getByTestId('problem-filter-scroll-region');
            const finalFilter = screen.getByRole('radio', { name: 'Not Attempted' });
            const clearAction = screen.getByRole('button', { name: 'Clear all active filters' });

            expect(scrollRegion).toHaveClass(
                'min-h-0',
                'flex-1',
                'overflow-y-auto',
                'overscroll-contain',
            );
            expect(scrollRegion).toContainElement(finalFilter);
            expect(scrollRegion).not.toContainElement(clearAction);
        });

        it('uses the same scroll contract in the mobile filter sheet', async () => {
            const user = userEvent.setup();

            render(
                <ProblemFilterPanel
                    filters={filtersWithValues}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                    isAuthenticated
                    variant="mobile"
                    showSearch={false}
                    resultCount={42}
                />,
            );

            const trigger = screen.getByRole('button', { name: /open filters/i });
            expect(trigger).toHaveAccessibleName('Open filters (1 active filter)');
            expect(trigger).toHaveClass('w-full', 'sm:w-auto');
            await user.click(trigger);

            const dialog = screen.getByRole('dialog', { name: 'Filters' });
            const scrollRegion = within(dialog).getByTestId('problem-filter-scroll-region');
            const header = within(dialog).getByTestId('mobile-filter-header');
            const actions = within(dialog).getByTestId('mobile-filter-actions');
            const finalFilter = within(dialog).getByRole('radio', { name: 'Not Attempted' });
            const clearAction = within(dialog).getByRole('button', {
                name: 'Clear all active filters',
            });
            const closeAction = within(actions).getByRole('button', {
                name: 'Close: 42 problems',
            });
            const selectedDifficulty = within(dialog).getByRole('checkbox', {
                name: /Easy/,
            });
            const selectedRow = selectedDifficulty.closest('[data-selected]');

            expect(trigger).toHaveAttribute('aria-expanded', 'true');
            expect(scrollRegion).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
            expect(dialog).toHaveClass(
                'platform-overlay-surface',
                'gap-0',
                'overflow-hidden',
                'rounded-none',
            );
            expect(header).toHaveTextContent('1 active filter');
            expect(header).not.toContainElement(scrollRegion);
            expect(actions).toHaveClass('shrink-0', 'grid', 'grid-cols-2');
            expect(actions.className).toContain('safe-area-inset-bottom');
            expect(scrollRegion).toContainElement(finalFilter);
            expect(scrollRegion).not.toContainElement(clearAction);
            expect(scrollRegion).not.toContainElement(closeAction);
            expect(clearAction).toBeEnabled();
            expect(closeAction).toHaveClass('min-h-11');
            expect(selectedRow).toHaveAttribute('data-selected', 'true');
            expect(selectedRow).toHaveClass('border-[var(--platform-violet)]');

            await user.click(closeAction);
            expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument();
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
            expect(trigger).toHaveFocus();
        });

        it('keeps the mobile action bar stable when no filters are active', async () => {
            const user = userEvent.setup();

            render(
                <ProblemFilterPanel
                    filters={emptyFilters}
                    categories={mockCategories}
                    competitions={mockCompetitions}
                    difficultyCounts={mockDifficultyCounts}
                    categoryCounts={mockCategoryCounts}
                    competitionCounts={mockCompetitionCounts}
                    onSearchChange={vi.fn()}
                    onDifficultyToggle={vi.fn()}
                    onCategoryToggle={vi.fn()}
                    onCompetitionToggle={vi.fn()}
                    onAttemptedStatusChange={vi.fn()}
                    onClearAll={vi.fn()}
                    variant="mobile"
                    showSearch={false}
                    resultCount={42}
                />,
            );

            const trigger = screen.getByRole('button', { name: 'Open filters' });
            await user.click(trigger);

            const dialog = screen.getByRole('dialog', { name: 'Filters' });
            const actions = within(dialog).getByTestId('mobile-filter-actions');
            const header = within(dialog).getByTestId('mobile-filter-header');

            expect(
                within(actions).getByRole('button', { name: 'Clear all active filters' }),
            ).toBeDisabled();
            expect(within(header).getByRole('status')).toHaveTextContent('42 problems');
        });
    });
});

describe('ActiveFilters', () => {
    afterEach(() => {
        cleanup();
    });

    describe('Chip Display', () => {
        it('should display search filter chip', () => {
            const filters: ProblemFilters = {
                search: 'machine learning',
                difficulty: [],
                categoryIds: [],
                competitionIds: [],
                attemptedStatus: null,
            };

            render(
                <ActiveFilters
                    filters={filters}
                    categories={[]}
                    competitions={[]}
                    onRemoveFilter={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            expect(screen.getByText('machine learning')).toBeInTheDocument();
            expect(screen.getByText('Search:')).toBeInTheDocument();
        });

        it('should display difficulty filter chips', () => {
            const filters: ProblemFilters = {
                search: '',
                difficulty: ['Easy', 'Hard'],
                categoryIds: [],
                competitionIds: [],
                attemptedStatus: null,
            };

            render(
                <ActiveFilters
                    filters={filters}
                    categories={[]}
                    competitions={[]}
                    onRemoveFilter={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            expect(screen.getByText('Easy')).toBeInTheDocument();
            expect(screen.getByText('Hard')).toBeInTheDocument();
        });

        it('should display category filter chips', () => {
            const filters: ProblemFilters = {
                search: '',
                difficulty: [],
                categoryIds: [1, 2],
                competitionIds: [],
                attemptedStatus: null,
            };

            render(
                <ActiveFilters
                    filters={filters}
                    categories={mockCategories}
                    competitions={[]}
                    onRemoveFilter={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            expect(screen.getByText('Machine Learning')).toBeInTheDocument();
            expect(screen.getByText('Computer Vision')).toBeInTheDocument();
        });
    });

    describe('Remove Filter', () => {
        it('should call onRemoveFilter when search chip X button is clicked', () => {
            const onRemoveFilter = vi.fn();
            const filters: ProblemFilters = {
                search: 'test',
                difficulty: [],
                categoryIds: [],
                competitionIds: [],
                attemptedStatus: null,
            };

            render(
                <ActiveFilters
                    filters={filters}
                    categories={[]}
                    competitions={[]}
                    onRemoveFilter={onRemoveFilter}
                    onClearAll={vi.fn()}
                />,
            );

            // Find the X button inside the search chip
            const xButtons = screen.getAllByRole('button');
            const searchXButton = xButtons.find((btn) =>
                btn.getAttribute('aria-label')?.includes('Search'),
            );

            expect(searchXButton).toBeDefined();
            fireEvent.click(searchXButton!);

            expect(onRemoveFilter).toHaveBeenCalledWith('search');
        });

        it('should call onRemoveFilter when difficulty chip is clicked', () => {
            const onRemoveFilter = vi.fn();
            const filters: ProblemFilters = {
                search: '',
                difficulty: ['Easy'],
                categoryIds: [],
                competitionIds: [],
                attemptedStatus: null,
            };

            render(
                <ActiveFilters
                    filters={filters}
                    categories={[]}
                    competitions={[]}
                    onRemoveFilter={onRemoveFilter}
                    onClearAll={vi.fn()}
                />,
            );

            // Find the difficulty chip (the div with role="button")
            const chips = screen.getAllByRole('button');
            const easyChip = chips.find(
                (chip) =>
                    chip.getAttribute('aria-label')?.includes('Easy') && chip.tagName === 'DIV',
            );

            expect(easyChip).toBeDefined();
            fireEvent.click(easyChip!);

            expect(onRemoveFilter).toHaveBeenCalledWith('difficulty', 'Easy');
        });

        it('should call onRemoveFilter when category chip is clicked', () => {
            const onRemoveFilter = vi.fn();
            const filters: ProblemFilters = {
                search: '',
                difficulty: [],
                categoryIds: [1],
                competitionIds: [],
                attemptedStatus: null,
            };

            render(
                <ActiveFilters
                    filters={filters}
                    categories={mockCategories}
                    competitions={[]}
                    onRemoveFilter={onRemoveFilter}
                    onClearAll={vi.fn()}
                />,
            );

            // Find the category chip (the div with role="button")
            const chips = screen.getAllByRole('button');
            const categoryChip = chips.find(
                (chip) =>
                    chip.getAttribute('aria-label')?.includes('Machine Learning') &&
                    chip.tagName === 'DIV',
            );

            expect(categoryChip).toBeDefined();
            fireEvent.click(categoryChip!);

            expect(onRemoveFilter).toHaveBeenCalledWith('category', 1);
        });
    });

    describe('Clear All', () => {
        it('should show clear all button when multiple filters are active', () => {
            const filters: ProblemFilters = {
                search: 'test',
                difficulty: ['Easy'],
                categoryIds: [],
                competitionIds: [],
                attemptedStatus: null,
            };

            render(
                <ActiveFilters
                    filters={filters}
                    categories={[]}
                    competitions={[]}
                    onRemoveFilter={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            expect(screen.getByLabelText(/clear all/i)).toBeInTheDocument();
        });

        it('should not show clear all button when only one filter is active', () => {
            const filters: ProblemFilters = {
                search: 'test',
                difficulty: [],
                categoryIds: [],
                competitionIds: [],
                attemptedStatus: null,
            };

            render(
                <ActiveFilters
                    filters={filters}
                    categories={[]}
                    competitions={[]}
                    onRemoveFilter={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            expect(screen.queryByLabelText(/clear all/i)).not.toBeInTheDocument();
        });

        it('should call onClearAll when clear all button is clicked', () => {
            const onClearAll = vi.fn();
            const filters: ProblemFilters = {
                search: 'test',
                difficulty: ['Easy'],
                categoryIds: [],
                competitionIds: [],
                attemptedStatus: null,
            };

            render(
                <ActiveFilters
                    filters={filters}
                    categories={[]}
                    competitions={[]}
                    onRemoveFilter={vi.fn()}
                    onClearAll={onClearAll}
                />,
            );

            const clearAllButton = screen.getByLabelText(/clear all/i);
            fireEvent.click(clearAllButton);

            expect(onClearAll).toHaveBeenCalled();
        });
    });

    describe('Empty State', () => {
        it('should not render when no filters are active', () => {
            const { container } = render(
                <ActiveFilters
                    filters={emptyFilters}
                    categories={[]}
                    competitions={[]}
                    onRemoveFilter={vi.fn()}
                    onClearAll={vi.fn()}
                />,
            );

            expect(container.firstChild).toBeNull();
        });
    });
});
