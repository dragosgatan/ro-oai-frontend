import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ArticleSubmissionOption } from '@/lib/articles';

const mocks = vi.hoisted(() => ({
    getArticleSubmissionOptions: vi.fn(),
}));

vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations: () => (key: string, values?: Record<string, unknown>) =>
        values?.id ? `${key} #${values.id}` : key,
}));

vi.mock('@/lib/articles', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/articles')>()),
    getArticleSubmissionOptions: mocks.getArticleSubmissionOptions,
}));

import { ArticleSubmissionSelector } from '@/components/articles/article-submission-selector';

const best: ArticleSubmissionOption = {
    id: 81,
    submittedAt: '2026-07-17T10:30:00Z',
    status: 'EVALUATED',
    score: 91.2,
    metric: '0.912',
    sourceFileName: 'best.ipynb',
    sourceDownloadUrl: null,
    recommended: true,
};

const alternative: ArticleSubmissionOption = {
    id: 79,
    submittedAt: '2026-07-16T10:30:00Z',
    status: 'EVALUATED',
    score: 88,
    metric: null,
    sourceFileName: 'alternative.py',
    sourceDownloadUrl: null,
    recommended: false,
};

const processing: ArticleSubmissionOption = {
    id: 82,
    submittedAt: '2026-07-18T10:30:00Z',
    status: 'PROCESSING',
    score: null,
    metric: null,
    sourceFileName: 'processing.py',
    sourceDownloadUrl: null,
    recommended: false,
};

function Harness() {
    const [selected, setSelected] = useState<ArticleSubmissionOption | null>(null);
    const [consent, setConsent] = useState(false);
    return (
        <ArticleSubmissionSelector
            problemId={289}
            selectedSubmission={selected}
            selectedSubmissionId={selected?.id ?? null}
            consent={consent}
            onSelect={(submission) => {
                setSelected(submission);
                setConsent(false);
            }}
            onConsentChange={setConsent}
        />
    );
}

describe('ArticleSubmissionSelector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getArticleSubmissionOptions.mockResolvedValue([processing, alternative, best]);
    });

    it('puts the backend recommendation first and requires a separate consent action', async () => {
        render(<Harness />);

        const recommended = await screen.findByText('recommended');
        const bestOption = screen.getByRole('radio', { name: /submission #81/ });
        const alternativeOption = screen.getByRole('radio', { name: /submission #79/ });
        const processingOption = screen.getByRole('radio', { name: /submission #82/ });

        expect(
            recommended.compareDocumentPosition(
                screen.getByText('submission #79', { selector: 'span' }),
            ) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        expect(processingOption).toBeDisabled();

        fireEvent.click(bestOption);
        const consent = screen.getByRole('checkbox');
        expect(consent).not.toBeChecked();
        fireEvent.click(consent);
        expect(consent).toBeChecked();

        fireEvent.click(alternativeOption);
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('offers an accessible retry without discarding the surrounding form', async () => {
        mocks.getArticleSubmissionOptions
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce([best]);
        render(<Harness />);

        const retry = await screen.findByRole('button', { name: 'retry' });
        expect(retry).toHaveClass('min-h-11');
        fireEvent.click(retry);

        expect(await screen.findByRole('radio', { name: /submission #81/ })).toBeEnabled();
        expect(mocks.getArticleSubmissionOptions).toHaveBeenCalledTimes(2);
    });

    it('shows a calm optional empty state', async () => {
        mocks.getArticleSubmissionOptions.mockResolvedValue([]);
        render(<Harness />);

        expect(await screen.findByText('emptyTitle')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole('radio')).not.toBeInTheDocument());
    });

    it('does not let a co-author grant consent for a preserved foreign submission', async () => {
        const foreignSubmission = {
            ...alternative,
            id: 77,
            sourceFileName: 'co-author.py',
        };
        render(
            <ArticleSubmissionSelector
                problemId={289}
                selectedSubmission={foreignSubmission}
                selectedSubmissionId={foreignSubmission.id}
                consent={false}
                onSelect={() => undefined}
                onConsentChange={() => undefined}
            />,
        );

        await screen.findByRole('radio', { name: /submission #81/ });
        expect(screen.getByRole('checkbox')).toBeDisabled();
        expect(screen.getByText('consentOwnerOnly')).toBeVisible();
    });
});
