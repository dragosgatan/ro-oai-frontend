import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { OwnedArticlePage } from '@/lib/articles';

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
    PlatformPageShell: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    PlatformEmptyState: () => <div>empty</div>,
}));

import { WritingWorkspace } from '@/components/articles/writing-workspace';

function articlePage(): OwnedArticlePage {
    return {
        content: [
            {
                id: 42,
                slug: 'published-with-feedback',
                language: 'ro',
                kind: 'GENERAL',
                publicationStatus: 'PUBLISHED',
                problem: null,
                title: 'Published with feedback',
                excerpt: 'A published article with a terminal review decision.',
                markdown: '# Article',
                authors: [],
                publishedAt: '2026-07-10T08:00:00Z',
                updatedAt: '2026-07-12T08:00:00Z',
                version: 4,
                structureLocked: true,
                hasUnpublishedChanges: true,
                latestChangeRequest: {
                    id: 9,
                    version: 2,
                    operation: 'UPDATE',
                    status: 'REJECTED',
                    submittedAt: '2026-07-11T08:00:00Z',
                    reviewerMessage: 'Add a reproducible example.',
                },
                permissions: {
                    canEdit: true,
                    canSubmit: true,
                    canRequestDelete: true,
                    canCancelRequest: false,
                    canResubmit: false,
                },
            },
        ],
        page: {
            number: 0,
            size: 20,
            totalElements: 1,
            totalPages: 1,
        },
    };
}

describe('WritingWorkspace article states', () => {
    it('keeps publication state visible and presents the latest review as a second badge', () => {
        render(<WritingWorkspace articlePage={articlePage()} locale="en" />);

        expect(screen.getByText('publicationStatus.PUBLISHED')).toBeInTheDocument();
        expect(screen.getByText('reviewStatus.REJECTED')).toBeInTheDocument();
    });
});
