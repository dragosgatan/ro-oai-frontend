import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ArticleInvitationPreview } from '@/lib/articles';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string, values?: Record<string, unknown>) => {
        if (key === 'status') return `Invitation status: ${String(values?.status ?? '')}`;
        if (key === 'statuses.EXPIRED') return 'Expired';
        return key;
    },
}));

vi.mock('@/i18n/routing', () => ({
    Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
        <a href={String(href)} {...props}>
            {children}
        </a>
    ),
    useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

import { ArticleInvitation } from '@/components/articles/article-invitation';
import { ArticleInvitationBootstrap } from '@/components/articles/article-invitation-bootstrap';

const expiredInvitation: ArticleInvitationPreview = {
    valid: false,
    status: 'EXPIRED',
    maskedEmail: null,
    problem: null,
    article: null,
    expiresAt: null,
    message: null,
};

describe('Article invitation accessibility and localization', () => {
    it('shows a localized invitation state instead of the backend enum', () => {
        const { container } = render(
            <ArticleInvitation
                invitationHandle="invitation-handle"
                invitation={expiredInvitation}
                locale="en"
                authenticated={false}
            />,
        );

        expect(screen.getByText('Invitation status: Expired')).toBeInTheDocument();
        expect(screen.queryByText(/EXPIRED/)).not.toBeInTheDocument();
        expect(screen.getByRole('region', { name: 'unavailableTitle' })).toBeInTheDocument();
        expect(container.querySelector('main')).not.toBeInTheDocument();
    });

    it('uses a labelled section while securely exchanging the fragment token', () => {
        window.history.replaceState({}, '', '/en/writing/invitations/accept');
        const { container } = render(<ArticleInvitationBootstrap locale="en" />);

        expect(container.querySelector('section[aria-labelledby]')).toBeInTheDocument();
        expect(container.querySelector('main')).not.toBeInTheDocument();
    });
});
