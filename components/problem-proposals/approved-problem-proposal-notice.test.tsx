import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

import { ApprovedProblemProposalNotice } from '@/components/problem-proposals/approved-problem-proposal-notice';

describe('approved problem proposal notice', () => {
    it('shows publication-pending guidance without linking to the hidden problem draft', () => {
        render(<ApprovedProblemProposalNotice />);

        expect(screen.getByText('review.acceptedTitle')).toBeInTheDocument();
        expect(screen.getByText('review.publicationPending')).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
});
