import '@testing-library/jest-dom/vitest';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { EditorialOpportunityOverview } from '@/lib/articles';

const mocks = vi.hoisted(() => ({
    getMyEditorialOpportunities: vi.fn(),
    sessionStatus: 'authenticated' as 'authenticated' | 'loading' | 'unauthenticated',
}));

vi.mock('next-auth/react', () => ({
    useSession: () => ({ status: mocks.sessionStatus, data: null }),
}));

vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations: () => (key: string, values?: Record<string, string | number>) => {
        const labels: Record<string, string> = {
            eyebrow: 'For problems you authored',
            title: 'Turn your problems into explanations',
            description: 'Your published problems and their editorials.',
            loading: 'Loading your published problems',
            'without.title': 'Waiting for an editorial',
            'without.description': 'These problems need an editorial.',
            'without.empty': 'Every problem has an editorial.',
            'with.title': 'Editorial published',
            'with.description': 'These problems have an editorial.',
            'with.empty': 'Your first editorial will appear here.',
            writeEditorial: 'Write editorial',
            showLess: 'Show fewer',
            'empty.title': 'No published problems yet',
            'empty.description': 'Attributed problems will appear here.',
            'error.title': 'Your problems could not be loaded',
            'error.description': 'Try again later.',
            'error.retry': 'Try again',
        };
        if (key === 'total') return `${values?.count} published problems`;
        if (key === 'without.count') return `${values?.count} without editorial`;
        if (key === 'with.count') return `${values?.count} with editorial`;
        if (key === 'showAll') return `Show all ${values?.count}`;
        if (key === 'writeFor') return `Write an editorial for ${values?.title}`;
        if (key === 'openProblem') return `Open problem ${values?.title}`;
        return labels[key] ?? key;
    },
}));

vi.mock('@/i18n/routing', () => ({
    Link: ({
        href,
        locale,
        children,
        ...props
    }: React.ComponentProps<'a'> & { locale?: string }) => (
        <a href={String(href)} data-locale={locale} {...props}>
            {children}
        </a>
    ),
}));

vi.mock('@/lib/articles', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/articles')>()),
    getMyEditorialOpportunities: mocks.getMyEditorialOpportunities,
}));

import { EditorialOpportunities } from '@/components/articles/editorial-opportunities';

function overview(): EditorialOpportunityOverview {
    return {
        totalProblems: 7,
        withoutPublishedEditorialCount: 6,
        withPublishedEditorialCount: 1,
        withoutPublishedEditorial: Array.from({ length: 6 }, (_, index) => ({
            id: 101 + index,
            title: `Problem ${index + 1}`,
            authors: [],
            publishedEditorials: [],
        })),
        withPublishedEditorial: [
            {
                id: 289,
                title: 'Grid Search',
                authors: [],
                publishedEditorials: [
                    {
                        id: 77,
                        slug: 'grid-search-explained',
                        language: 'ro',
                        title: 'Grid Search explained',
                        publishedAt: '2026-07-15T08:00:00Z',
                        updatedAt: '2026-07-15T09:00:00Z',
                    },
                ],
            },
        ],
    };
}

describe('EditorialOpportunities', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.sessionStatus = 'authenticated';
        mocks.getMyEditorialOpportunities.mockResolvedValue(overview());
    });

    it('stays out of the public article index for signed-out visitors', () => {
        mocks.sessionStatus = 'unauthenticated';

        const { container } = render(<EditorialOpportunities />);

        expect(container).toBeEmptyDOMElement();
        expect(mocks.getMyEditorialOpportunities).not.toHaveBeenCalled();
    });

    it('links authored problems, editorials, and a preselected writing action', async () => {
        render(<EditorialOpportunities />);

        expect(
            await screen.findByRole('heading', { name: 'Waiting for an editorial' }),
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Open problem Problem 1' })).toHaveAttribute(
            'href',
            '/problems/101',
        );
        expect(
            screen.getByRole('link', { name: 'Write an editorial for Problem 1' }),
        ).toHaveAttribute('href', '/writing/new?problemId=101');
        expect(screen.getByRole('link', { name: /Grid Search explained/ })).toHaveAttribute(
            'href',
            '/articles/grid-search-explained',
        );
        expect(screen.getByRole('link', { name: /Grid Search explained/ })).toHaveAttribute(
            'data-locale',
            'ro',
        );
    });

    it('keeps long problem lists compact until the user expands them', async () => {
        const user = userEvent.setup();
        render(<EditorialOpportunities />);

        await screen.findByText('Problem 1');
        expect(screen.queryByText('Problem 5')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Show all 6' }));

        expect(screen.getByText('Problem 5')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Show fewer' })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
    });

    it('offers an in-place retry without hiding the public article library', async () => {
        const user = userEvent.setup();
        mocks.getMyEditorialOpportunities
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce(overview());
        render(<EditorialOpportunities />);

        await user.click(await screen.findByRole('button', { name: 'Try again' }));

        await waitFor(() => expect(mocks.getMyEditorialOpportunities).toHaveBeenCalledTimes(2));
        expect(
            await screen.findByRole('heading', { name: 'Waiting for an editorial' }),
        ).toBeInTheDocument();
    });
});
