import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ArticleDetail } from '@/lib/articles';

const mocks = vi.hoisted(() => ({
    solutionPanel: vi.fn(({ submission }: { submission: { id: number } }) => (
        <div data-testid="article-solution-panel">submission-{submission.id}</div>
    )),
}));

vi.mock('next-intl/server', () => ({
    getTranslations: vi.fn(async () => (key: string) => key),
}));
vi.mock('@/i18n/routing', () => ({
    Link: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
        <a href={String(href)} {...props}>
            {children}
        </a>
    ),
}));
vi.mock('@/components/platform-page-shell', () => ({
    PlatformPageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/articles/article-authors', () => ({
    ArticleAuthors: () => <div data-testid="authors" />,
}));
vi.mock('@/components/articles/article-content', () => ({
    ArticleContent: () => <div data-testid="article-content" />,
}));
vi.mock('@/components/articles/article-kind-visual', () => ({
    ArticleKindVisual: () => <div data-testid="kind-visual" />,
}));
vi.mock('@/components/articles/article-solution-panel', () => ({
    ArticleSolutionPanel: mocks.solutionPanel,
}));

import { ArticleDetailView } from '@/components/articles/article-detail-view';

function detail(overrides: Partial<ArticleDetail> = {}): ArticleDetail {
    return {
        id: 42,
        slug: 'clear-editorial',
        language: 'en',
        title: 'A clear editorial',
        excerpt: 'A useful introduction',
        kind: 'PROBLEM_EDITORIAL',
        publicationStatus: 'PUBLISHED',
        publishedAt: '2026-07-17T10:30:00Z',
        updatedAt: '2026-07-17T10:30:00Z',
        authors: [],
        problem: {
            id: 289,
            title: 'Grid Search',
            authors: [],
        },
        sanitizedHtml: '<p>Explanation</p>',
        sharedSubmission: null,
        ...overrides,
    };
}

describe('ArticleDetailView shared solution integration', () => {
    beforeEach(() => vi.clearAllMocks());

    it('does not render a solution panel without publication-approved sharing', async () => {
        render(await ArticleDetailView({ article: detail(), locale: 'en' }));

        expect(screen.queryByTestId('article-solution-panel')).not.toBeInTheDocument();
        expect(screen.getByTestId('article-content')).toBeInTheDocument();
    });

    it('places the public solution panel before the article body', async () => {
        render(
            await ArticleDetailView({
                article: detail({
                    sharedSubmission: {
                        id: 81,
                        submittedAt: '2026-07-17T10:30:00Z',
                        status: 'EVALUATED',
                        score: 91.2,
                        metric: '0.912',
                        sourceFileName: 'solution.ipynb',
                        sourceDownloadUrl:
                            'https://api.example.test/articles/clear-editorial/source',
                        recommended: true,
                    },
                }),
                locale: 'en',
            }),
        );

        const panel = screen.getByTestId('article-solution-panel');
        const body = screen.getByTestId('article-content');
        expect(panel).toHaveTextContent('submission-81');
        expect(panel.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
        expect(mocks.solutionPanel.mock.calls[0]?.[0]).toEqual(
            expect.objectContaining({ locale: 'en' }),
        );
    });
});
