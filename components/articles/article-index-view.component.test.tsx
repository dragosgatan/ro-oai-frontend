import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/i18n/routing', () => ({
    Link: ({
        href,
        locale,
        children,
        ...props
    }: React.ComponentProps<'a'> & { locale?: string }) => (
        <a href={String(href)} data-locale={locale} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('@/lib/platform-fonts', () => ({
    platformSans: { className: 'platform-sans', variable: '--font-platform-sans' },
    platformDisplay: { className: 'platform-display', variable: '--font-platform-display' },
}));

vi.mock('@/components/articles/editorial-opportunities', () => ({
    EditorialOpportunities: () => null,
}));

import {
    ArticleIndexView,
    type ArticleIndexLabels,
} from '@/components/articles/article-index-view';
import type { ArticlePage } from '@/lib/articles';

const labels: ArticleIndexLabels = {
    eyebrow: 'Community knowledge',
    title: 'Ideas worth putting into practice',
    description: 'Practical explanations written by the community.',
    count: 'Published',
    featured: 'Start here',
    general: 'Article',
    editorial: 'Problem editorial',
    authors: 'Written by',
    authorFallback: 'Contributor',
    published: 'Published',
    linkedProblem: 'For problem',
    readArticle: 'Read article',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    paginationLabel: 'Article pages',
    pageLabel: 'Page {page} of {pages}',
    emptyTitle: 'The first article is being written',
    emptyDescription: 'Fresh explanations will appear here.',
    writeArticle: 'Write an article',
};

const emptyPage: ArticlePage = {
    content: [],
    page: {
        number: 0,
        size: 12,
        totalElements: 0,
        totalPages: 0,
    },
};

const publishedPage: ArticlePage = {
    content: [
        {
            id: 1,
            slug: 'english-article',
            language: 'en',
            title: 'English article',
            excerpt: 'A useful English article.',
            kind: 'GENERAL',
            publicationStatus: 'PUBLISHED',
            publishedAt: '2026-07-15T08:00:00Z',
            updatedAt: '2026-07-15T08:00:00Z',
            authors: [],
            problem: null,
        },
        {
            id: 2,
            slug: 'romanian-editorial',
            language: 'ro',
            title: 'Romanian editorial',
            excerpt: 'A useful Romanian editorial.',
            kind: 'PROBLEM_EDITORIAL',
            publicationStatus: 'PUBLISHED',
            publishedAt: '2026-07-14T08:00:00Z',
            updatedAt: '2026-07-14T08:00:00Z',
            authors: [],
            problem: { id: 289, title: 'Grid Search', authors: [] },
        },
    ],
    page: {
        number: 0,
        size: 12,
        totalElements: 2,
        totalPages: 1,
    },
};

describe('ArticleIndexView contribution action', () => {
    it('keeps the writing entry point visible even before articles are published', () => {
        render(<ArticleIndexView articles={emptyPage} locale="en" labels={labels} />);

        expect(screen.getByRole('link', { name: 'Write an article' })).toHaveAttribute(
            'href',
            '/writing/new',
        );
    });

    it('links each article through its authored locale instead of the current UI locale', () => {
        render(<ArticleIndexView articles={publishedPage} locale="ro" labels={labels} />);

        expect(screen.getByRole('link', { name: /English article/ })).toHaveAttribute(
            'data-locale',
            'en',
        );
        expect(screen.getByRole('link', { name: /Romanian editorial/ })).toHaveAttribute(
            'data-locale',
            'ro',
        );
    });
});
