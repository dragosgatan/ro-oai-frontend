import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const messages: Record<string, string> = {
    eyebrow: 'Problem authorship',
    title: 'Published problems',
    description: 'Public problems credited to this author.',
    count: '{count} published problems',
    countUnavailable: 'Count unavailable',
    listLabel: 'Problems published by this author',
    openProblem: 'Open {title}',
    emptyTitle: 'No published problems yet',
    emptyDescription: 'Attributed problems will appear here.',
    errorTitle: 'Problems could not be loaded',
    errorDescription: 'Try loading this profile again.',
    retry: 'Try again',
};

vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations: () => (key: string, values?: Record<string, string | number>) => {
        let message = messages[key] ?? key;
        Object.entries(values ?? {}).forEach(([name, value]) => {
            message = message.replace(`{${name}}`, String(value));
        });
        return message;
    },
}));

vi.mock('@/i18n/routing', () => ({
    Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
        <a href={String(href)} {...props}>
            {children}
        </a>
    ),
}));

import { ProfilePublishedProblems } from '@/components/profile-published-problems';

describe('ProfilePublishedProblems', () => {
    it('shows the complete count and links every published problem', () => {
        render(
            <ProfilePublishedProblems
                problems={[
                    { id: 289, title: 'Grid Search' },
                    { id: 301, title: 'Newsroom' },
                ]}
                totalCount={2}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Published problems' })).toBeInTheDocument();
        expect(screen.getByText('2 published problems')).toBeInTheDocument();
        expect(
            screen.getByRole('list', { name: 'Problems published by this author' }),
        ).toBeVisible();
        expect(screen.getByRole('link', { name: 'Open Grid Search' })).toHaveAttribute(
            'href',
            '/problems/289',
        );
        expect(screen.getByRole('link', { name: 'Open Newsroom' })).toHaveAttribute(
            'href',
            '/problems/301',
        );
    });

    it('keeps zero-problem profiles informative instead of hiding attribution', () => {
        render(<ProfilePublishedProblems problems={[]} totalCount={0} />);

        expect(screen.getByText('0 published problems')).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'No published problems yet' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    it('offers an accessible retry when the profile endpoint fails', () => {
        render(
            <ProfilePublishedProblems
                problems={[]}
                totalCount={0}
                status="error"
                retryHref="/profile/author-one"
            />,
        );

        expect(
            screen.getByRole('heading', { name: 'Problems could not be loaded' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Count unavailable')).toBeInTheDocument();
        expect(screen.queryByText('0 published problems')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Try again' })).toHaveAttribute(
            'href',
            '/en/profile/author-one',
        );
    });

    it('announces loading and renders placeholders without fake links', () => {
        const { container } = render(
            <ProfilePublishedProblems problems={[]} totalCount={0} status="loading" />,
        );

        expect(container.querySelector('section')).toHaveAttribute('aria-busy', 'true');
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });
});
