import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    loadArticleSourcePreview: vi.fn(),
    writeText: vi.fn(),
}));

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values?.id
            ? `${key} #${values.id}`
            : values?.value
              ? `${key}: ${values.value}`
              : values?.number
                ? `${key} ${values.number}`
                : key,
}));

vi.mock('@/lib/articles', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/articles')>()),
    loadArticleSourcePreview: mocks.loadArticleSourcePreview,
}));

import { ArticleSolutionPanel } from '@/components/articles/article-solution-panel';

const submission = {
    id: 81,
    submittedAt: '2026-07-17T10:30:00Z',
    status: 'EVALUATED' as const,
    score: 91.2,
    metric: '0.912',
    sourceFileName: 'solution.py',
    sourceDownloadUrl: 'https://api.example.test/articles/solution/source',
    recommended: true,
};

describe('ArticleSolutionPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: mocks.writeText },
        });
        mocks.writeText.mockResolvedValue(undefined);
    });

    it('loads bounded source only after expansion and supports copy and download', async () => {
        mocks.loadArticleSourcePreview.mockResolvedValue({
            kind: 'text',
            source: 'print(\"hello\")',
        });
        render(<ArticleSolutionPanel submission={submission} locale="en" />);

        expect(mocks.loadArticleSourcePreview).not.toHaveBeenCalled();
        expect(screen.getByRole('link', { name: 'download' })).toHaveAttribute(
            'href',
            submission.sourceDownloadUrl,
        );

        fireEvent.click(screen.getByRole('button', { name: /viewSource/ }));
        expect(await screen.findByText('print("hello")')).toBeInTheDocument();
        expect(mocks.loadArticleSourcePreview).toHaveBeenCalledWith(
            submission.sourceDownloadUrl,
            'solution.py',
        );

        fireEvent.click(screen.getByRole('button', { name: 'copy' }));
        await waitFor(() => expect(mocks.writeText).toHaveBeenCalledWith('print("hello")'));
    });

    it('renders notebook code and markdown cells without exposing notebook outputs', async () => {
        mocks.loadArticleSourcePreview.mockResolvedValue({
            kind: 'notebook',
            cells: [
                { type: 'markdown', source: '# Method' },
                { type: 'code', source: 'model.fit(X, y)' },
            ],
            copySource: '# Method\n\nmodel.fit(X, y)',
        });
        render(
            <ArticleSolutionPanel
                submission={{ ...submission, sourceFileName: 'solution.ipynb' }}
                locale="en"
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /viewSource/ }));

        expect(await screen.findByText('# Method')).toBeInTheDocument();
        expect(screen.getByText('model.fit(X, y)')).toBeInTheDocument();
        expect(screen.getByText('notebook.markdownCell 1')).toBeInTheDocument();
        expect(screen.getByText('notebook.codeCell 2')).toBeInTheDocument();
    });

    it('keeps binary sources download-only', () => {
        render(
            <ArticleSolutionPanel
                submission={{ ...submission, sourceFileName: 'weights.npz' }}
                locale="en"
            />,
        );

        expect(screen.queryByRole('button', { name: /viewSource/ })).not.toBeInTheDocument();
        expect(screen.getByText('downloadOnly')).toBeInTheDocument();
        expect(mocks.loadArticleSourcePreview).not.toHaveBeenCalled();
    });
});
