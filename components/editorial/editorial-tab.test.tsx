import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { EditorialResponse } from '@/lib/types';
import { EditorialTab } from './editorial-tab';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

vi.mock('./editorial-author-card', () => ({
    EditorialAuthorCard: () => <div data-testid="author-card" />,
}));

vi.mock('./editorial-content', () => ({
    EditorialContent: () => <div data-testid="editorial-content" />,
}));

vi.mock('./featured-solutions-section', () => ({
    FeaturedSolutionsSection: () => <div data-testid="featured-solutions-section" />,
}));

vi.mock('./source-code-modal', () => ({
    SourceCodeModal: () => null,
}));

function createEditorial(authorCount: number): EditorialResponse {
    return {
        authors: Array.from({ length: authorCount }, (_, index) => ({
            id: index + 1,
            userId: `user-${index + 1}`,
            username: `Author ${index + 1}`,
            hasSourceCode: false,
        })),
        content: 'Editorial content',
        featuredSolutions: [],
    } as unknown as EditorialResponse;
}

describe('EditorialTab', () => {
    it.each([1, 2, 5])('renders the authors section before content for %i authors', (count) => {
        render(<EditorialTab editorial={createEditorial(count)} />);

        const authors = screen.getByTestId('authors-section');
        const content = screen.getByTestId('content-section');

        expect(authors.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(screen.getAllByTestId('author-card')).toHaveLength(count);
    });

    it('omits the authors section when the editorial has no authors', () => {
        render(<EditorialTab editorial={createEditorial(0)} />);

        expect(screen.queryByTestId('authors-section')).toBeNull();
        expect(screen.getByTestId('content-section')).toBeTruthy();
    });

    it('renders featured solutions after the editorial content', () => {
        render(<EditorialTab editorial={createEditorial(1)} />);

        const content = screen.getByTestId('content-section');
        const featured = screen.getByTestId('featured-solutions-section');

        expect(content.compareDocumentPosition(featured) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
    });
});
