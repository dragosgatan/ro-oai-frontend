import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { SubmissionNotificationToast } from '@/components/submission-notification-toast';
import type { Submission } from '@/lib/types';

const messages = {
    submissionStatus: {
        success: 'Submission evaluated',
        failed: 'Submission failed',
        close: 'Close',
        failedMessage: 'Evaluation failed',
    },
    submissionDetails: {
        score: 'Partial score',
        finalScore: 'Final score',
        metric: 'Partial metric',
        finalMetric: 'Final metric',
        details: 'View details',
    },
};

const submission: Submission = {
    id: 17,
    problemId: 3,
    problemTitle: 'Test problem',
    submittedAt: new Date('2026-07-18T10:00:00Z'),
    status: 'EVALUATED',
    score: 42,
    finalScore: 91,
    metric: 0.42,
    finalMetric: 0.91,
    evaluationMessage: '',
    signedFileUrl: 'https://example.test/submission.csv',
    signedSourceFileUrl: null,
    stdout: null,
    stderr: null,
    subtasks: null,
    subtasksNames: null,
};

function renderToast(result: Submission) {
    return render(
        <NextIntlClientProvider locale="en" messages={messages}>
            <SubmissionNotificationToast
                id={1}
                submissionId={result.id}
                problemId={result.problemId}
                problemTitle={result.problemTitle}
                status="EVALUATED"
                submission={result}
                onDismiss={vi.fn()}
                onViewDetails={vi.fn()}
                autoDismissDuration={60_000}
            />
        </NextIntlClientProvider>,
    );
}

describe('SubmissionNotificationToast', () => {
    it('shows complete evaluator values whenever the backend makes them visible', () => {
        renderToast(submission);

        expect(screen.getByText('Final score')).not.toBeNull();
        expect(screen.getByText('91')).not.toBeNull();
        expect(screen.getByText('Final metric')).not.toBeNull();
        expect(screen.getByText('0.91')).not.toBeNull();
    });

    it('does not create a final-score side channel when complete values are hidden', () => {
        renderToast({ ...submission, finalScore: null, finalMetric: null });

        expect(screen.queryByText('Final score')).toBeNull();
        expect(screen.queryByText('Final metric')).toBeNull();
    });
});
