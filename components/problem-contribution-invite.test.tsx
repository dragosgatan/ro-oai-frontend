import '@testing-library/jest-dom/vitest';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
    ProblemContributionInvite,
    shouldShowProblemContributionInvite,
} from '@/components/problem-contribution-invite';

const messages: Record<string, string> = {
    eyebrow: 'Contribuie la catalog',
    title: 'Construiește provocarea pe care ai vrea să o rezolvi',
    description: 'Adună enunțul, datele și evaluatorul într-o schiță privată.',
    reviewNote: 'Schița și evaluatorul rămân private în timpul verificării.',
    primaryAction: 'Începe o propunere',
    guideAction: 'Citește ghidul evaluatorului',
};

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => messages[key] ?? key,
}));

vi.mock('@/i18n/routing', () => ({
    Link: ({
        href,
        children,
        ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
        children: ReactNode;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

describe('ProblemContributionInvite', () => {
    it('explains the review flow and links to proposal creation and evaluator guidance', () => {
        render(<ProblemContributionInvite />);

        expect(screen.getByRole('heading', { name: messages.title })).toBeInTheDocument();
        expect(screen.getByText(messages.reviewNote)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: messages.primaryAction })).toHaveAttribute(
            'href',
            '/problem-proposals/new',
        );
        expect(screen.getByRole('link', { name: messages.guideAction })).toHaveAttribute(
            'href',
            '/problem-proposals/evaluator-guide',
        );
    });

    it('only appears for the first unfiltered page with results', () => {
        expect(
            shouldShowProblemContributionInvite({
                currentPage: 0,
                hasActiveFilters: false,
                resultCount: 9,
            }),
        ).toBe(true);
        expect(
            shouldShowProblemContributionInvite({
                currentPage: 1,
                hasActiveFilters: false,
                resultCount: 9,
            }),
        ).toBe(false);
        expect(
            shouldShowProblemContributionInvite({
                currentPage: 0,
                hasActiveFilters: true,
                resultCount: 9,
            }),
        ).toBe(false);
        expect(
            shouldShowProblemContributionInvite({
                currentPage: 0,
                hasActiveFilters: false,
                resultCount: 0,
            }),
        ).toBe(false);
    });
});
