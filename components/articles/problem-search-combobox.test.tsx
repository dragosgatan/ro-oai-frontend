import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    searchArticleProblemOptions: vi.fn(),
}));

vi.mock('next-intl', () => ({
    useLocale: () => 'ro',
    useTranslations: () => (key: string, values?: Record<string, string>) =>
        values?.names ? `${key}: ${values.names}` : key,
}));

vi.mock('@/lib/articles', () => ({
    searchArticleProblemOptions: mocks.searchArticleProblemOptions,
}));

import { ProblemSearchCombobox } from '@/components/articles/problem-search-combobox';

const ownProblem = {
    id: 289,
    title: 'Grid Search',
    isCurrentUserAuthor: true,
    authors: [
        {
            userId: 'user-1',
            firstName: 'Pixel',
            lastName: 'Testerson',
            displayName: 'Pixel Testerson',
        },
    ],
};

const otherProblem = {
    id: 290,
    title: 'Newsroom Expansion',
    isCurrentUserAuthor: false,
    authors: [
        {
            userId: null,
            firstName: 'Ana',
            lastName: 'Popescu',
            displayName: 'Ana Popescu',
        },
    ],
};

describe('ProblemSearchCombobox', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.searchArticleProblemOptions.mockResolvedValue([otherProblem, ownProblem]);
    });

    it('renders an opaque, viewport-contained portaled surface with authored problems first', async () => {
        render(<ProblemSearchCombobox selected={null} onSelect={vi.fn()} />);

        fireEvent.click(screen.getByRole('combobox'));

        expect(await screen.findByText('yourProblems')).toBeInTheDocument();
        const surface = document.querySelector('.platform-overlay-surface');
        expect(surface).toHaveClass(
            'bg-[var(--platform-paper)]',
            'max-w-[calc(100vw-1.5rem)]',
            'max-h-[min(28rem,var(--radix-popover-content-available-height))]',
        );
        const mine = screen.getByText('yourProblems');
        const others = screen.getByText('otherProblems');
        expect(mine.compareDocumentPosition(others) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(screen.getByText('authorNames: Pixel Testerson')).toBeInTheDocument();
        expect(screen.getByText('authorNames: Ana Popescu')).toBeInTheDocument();
        expect(screen.getByText('authoredByYou')).toBeInTheDocument();
    });

    it('selects a structured problem option and closes the menu', async () => {
        const onSelect = vi.fn();
        render(<ProblemSearchCombobox selected={null} onSelect={onSelect} />);

        fireEvent.click(screen.getByRole('combobox'));
        fireEvent.click(await screen.findByText('Grid Search'));

        expect(onSelect).toHaveBeenCalledWith(ownProblem);
        await waitFor(() => expect(screen.queryByText('yourProblems')).not.toBeInTheDocument());
    });

    it('offers a keyboard-sized retry action after a failed search', async () => {
        mocks.searchArticleProblemOptions
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce([ownProblem]);
        render(<ProblemSearchCombobox selected={null} onSelect={vi.fn()} />);

        fireEvent.click(screen.getByRole('combobox'));
        const retry = await screen.findByRole('button', { name: 'retry' });
        expect(retry).toHaveClass('min-h-11');
        fireEvent.click(retry);

        expect(await screen.findByText('Grid Search')).toBeInTheDocument();
        expect(mocks.searchArticleProblemOptions).toHaveBeenCalledTimes(2);
    });
});
