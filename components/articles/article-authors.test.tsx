import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/i18n/routing', () => ({
    Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
        <a href={String(href)} {...props}>
            {children}
        </a>
    ),
}));

import { ArticleAuthors } from '@/components/articles/article-authors';

describe('ArticleAuthors', () => {
    it('renders a safe localized fallback when the backend author username is null', () => {
        render(
            <ArticleAuthors
                authors={[{ userId: 'user-1', username: null, avatar: null }]}
                label="Written by"
                fallbackName="Community contributor"
            />,
        );

        expect(screen.getByText('Community contributor')).toBeInTheDocument();
        expect(screen.getByText('CC')).toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute('href', '/profile/user-1');
    });

    it('clearly identifies only article authors who also authored the linked problem', () => {
        render(
            <ArticleAuthors
                authors={[
                    {
                        userId: 'problem-author',
                        displayName: 'Pixel Testerson',
                        isProblemAuthor: true,
                    },
                    {
                        userId: 'contributor',
                        displayName: 'Ana Popescu',
                        isProblemAuthor: false,
                    },
                ]}
                label="Written by"
                problemAuthorLabel="Problem author"
            />,
        );

        expect(screen.getByText('Problem author')).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /Pixel Testerson Problem author/ }),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Ana Popescu' })).toBeInTheDocument();
    });
});
