import '@testing-library/jest-dom/vitest';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HomeArticlesSection } from '@/components/home-articles-section';
import type { ArticleSummary } from '@/lib/articles';

vi.mock('@/i18n/routing', () => ({
    Link: ({
        href,
        locale,
        children,
        ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
        locale?: string;
        children: ReactNode;
    }) => (
        <a href={href} data-locale={locale} {...props}>
            {children}
        </a>
    ),
}));

const labels = {
    locale: 'ro' as const,
    eyebrow: 'Nou din comunitate',
    title: 'Învață din modul în care gândesc ceilalți',
    description: 'Explicații riguroase din comunitate.',
    readLabel: 'Citește articolul',
    viewAllLabel: 'Explorează toate articolele',
    authorsLabel: 'Scris de',
    authorFallback: 'Contributor MLCompete',
    editorialLabel: 'Editorial de problemă',
    generalLabel: 'Articol',
    emptyTitle: 'Prima explicație bună poate porni de la tine',
    emptyDescription: 'Împărtășește o tehnică utilă.',
    unavailableTitle: 'Biblioteca nu a putut fi încărcată',
    unavailableDescription: 'Articolele sunt indisponibile temporar.',
    contributeEyebrow: 'Construit de comunitate',
    contributeTitle: 'Ai ceva util de explicat? Dă mai departe.',
    contributeDescription: 'Publică un articol sau propune o problemă.',
    writeLabel: 'Scrie un articol sau editorial',
    proposeLabel: 'Propune o problemă',
    reviewNote: 'Contribuțiile sunt publicate numai după verificare.',
};

function article(id: number, overrides: Partial<ArticleSummary> = {}): ArticleSummary {
    return {
        id,
        slug: `article-${id}`,
        language: 'ro',
        title: `Articolul ${id}`,
        excerpt: `Rezumatul articolului ${id}`,
        kind: id === 1 ? 'PROBLEM_EDITORIAL' : 'GENERAL',
        publicationStatus: 'PUBLISHED',
        publishedAt: '2026-07-17T09:00:00Z',
        updatedAt: '2026-07-17T09:00:00Z',
        authors: [{ userId: `user-${id}`, displayName: `Autor ${id}` }],
        problem: id === 1 ? { id: 289, title: 'GridSearch', authors: [] } : null,
        ...overrides,
    };
}

describe('HomeArticlesSection', () => {
    it('shows up to three recent articles and keeps both contribution paths visible', () => {
        render(
            <HomeArticlesSection
                {...labels}
                articles={[article(1), article(2), article(3), article(4)]}
            />,
        );

        expect(screen.getByRole('heading', { name: labels.title })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Articolul 1/ })).toHaveAttribute(
            'href',
            '/articles/article-1',
        );
        expect(screen.getByRole('link', { name: /Articolul 2/ })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Articolul 3/ })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Articolul 4/ })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: labels.writeLabel })).toHaveAttribute(
            'href',
            '/writing/new',
        );
        expect(screen.getByRole('link', { name: labels.proposeLabel })).toHaveAttribute(
            'href',
            '/problem-proposals/new',
        );
    });

    it('turns an empty library into a useful invitation instead of hiding the section', () => {
        render(<HomeArticlesSection {...labels} articles={[]} />);

        expect(screen.getByRole('heading', { name: labels.emptyTitle })).toBeInTheDocument();
        expect(screen.getByText(labels.emptyDescription)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: labels.writeLabel })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: labels.proposeLabel })).toBeInTheDocument();
    });

    it('distinguishes an unavailable library from a legitimately empty one', () => {
        render(<HomeArticlesSection {...labels} articles={[]} unavailable />);

        expect(screen.getByRole('status')).toHaveTextContent(labels.unavailableTitle);
        expect(screen.queryByText(labels.emptyTitle)).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: labels.writeLabel })).toBeInTheDocument();
    });

    it('uses an author fallback and omits invalid publication dates', () => {
        const { container } = render(
            <HomeArticlesSection
                {...labels}
                articles={[
                    article(1, {
                        authors: [],
                        publishedAt: 'not-a-date',
                    }),
                ]}
            />,
        );

        expect(screen.getByText(labels.authorFallback)).toBeInTheDocument();
        expect(container.querySelector('time')).toBeNull();
    });

    it('uses the contrast-safe accent token on the inverted article surface', () => {
        render(<HomeArticlesSection {...labels} articles={[article(1), article(2)]} />);

        const featuredLink = screen.getByRole('link', { name: /Articolul 1/ });
        expect(featuredLink).toHaveClass('focus-visible:ring-[var(--home-on-ink-accent)]');
        expect(within(featuredLink).getByRole('heading', { name: 'Articolul 1' })).toHaveClass(
            'group-hover:text-[var(--home-on-ink-accent)]',
        );
        expect(within(featuredLink).getByText(labels.readLabel)).toHaveClass(
            'text-[var(--home-on-ink-accent)]',
        );

        const secondaryLink = screen.getByRole('link', { name: /Articolul 2/ });
        expect(within(secondaryLink).getByText('Articolul 2')).toHaveClass(
            'group-hover:text-[var(--home-on-ink-accent)]',
        );
    });
});
