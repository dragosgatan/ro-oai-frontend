import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_EVALUATOR_CONTRACT } from '@/lib/problem-proposals';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
    Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
        <a href={String(href)} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('@/components/platform-page-shell', () => ({
    PlatformPageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { EvaluatorGuide } from '@/components/problem-proposals/evaluator-guide';

describe('problem proposal evaluator guide', () => {
    it('documents every supported signature and the complete file bundle', () => {
        render(<EvaluatorGuide contract={DEFAULT_EVALUATOR_CONTRACT} />);

        expect(
            screen.getAllByText('compute_scores(predictions_df, ground_truth_df)').length,
        ).toBeGreaterThanOrEqual(1);
        expect(
            screen.getByText('compute_scores(predictions_df, ground_truth_path)'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('compute_scores(extraction_path, ground_truth_df)'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('compute_scores(extraction_path, ground_truth_path)'),
        ).toBeInTheDocument();
        expect(screen.getByText('files.dataset.title')).toBeInTheDocument();
        expect(screen.getByText('files.evaluator.title')).toBeInTheDocument();
        expect(screen.getByText('files.reference.title')).toBeInTheDocument();
        expect(screen.getByText('files.optional')).toBeInTheDocument();
        expect(screen.getByText('NPY')).toBeInTheDocument();
        expect(screen.getByText('NPZ')).toBeInTheDocument();
    });

    it('renders the live contract fingerprint, structured signatures, and test command', () => {
        render(
            <EvaluatorGuide
                contract={{
                    ...DEFAULT_EVALUATOR_CONTRACT,
                    contractHash: 'sha256:live-contract',
                    signatures: [
                        {
                            submission: 'TABULAR',
                            groundTruth: 'ZIP',
                            signature: 'compute_scores(predictions_df, ground_truth_path)',
                        },
                    ],
                    localTestCommand:
                        'python -m py_compile evaluator.py && python -c "import evaluator; assert callable(evaluator.compute_scores)"',
                }}
            />,
        );

        expect(screen.getByText('sha256:live-contract')).toBeInTheDocument();
        expect(
            screen.getByText('compute_scores(predictions_df, ground_truth_path)'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'python -m py_compile evaluator.py && python -c "import evaluator; assert callable(evaluator.compute_scores)"',
            ),
        ).toBeInTheDocument();
        expect(screen.queryByText(/evaluator_contract_test\.py/)).not.toBeInTheDocument();
    });
});
