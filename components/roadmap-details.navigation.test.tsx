import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RoadmapDetails, {
    type RoadmapPagePublicResponse,
    type RoadmapTreeEntry,
} from '@/components/roadmap-details';

vi.mock('next-intl', () => ({
    useLocale: () => 'ro',
    useTranslations:
        (namespace: string) =>
        (key: string): string => {
            if (namespace === 'navigation' && key === 'roadmap') {
                return 'Plan de învățare';
            }

            return key;
        },
}));

const tree: RoadmapTreeEntry[] = [
    {
        id: 1,
        title: 'Plan de învățare',
        slug: 'roadmap',
        children: [
            {
                id: 2,
                title: 'Materiale lot',
                slug: 'lot-restrans',
                children: [
                    {
                        id: 3,
                        title: 'Antrenament avansat',
                        slug: 'antrenament-avansat',
                        children: [],
                    },
                ],
            },
        ],
    },
];

const page: RoadmapPagePublicResponse = {
    title: 'Materiale lot',
    slug: 'lot-restrans',
    html: '<p>Resurse pentru lot.</p>',
};

describe('RoadmapDetails navigation', () => {
    it('links a parent node and its child to their own roadmap detail pages', () => {
        render(<RoadmapDetails page={page} tree={tree} />);

        const lotLinks = screen.getAllByRole('link', { name: 'Materiale lot' });
        expect(lotLinks).toHaveLength(2);
        lotLinks.forEach((link) => {
            expect(link).toHaveAttribute('href', '/ro/roadmap/lot-restrans');
            expect(link).toHaveAttribute('aria-current', 'page');
        });

        const childLinks = screen.getAllByRole('link', { name: 'Antrenament avansat' });
        expect(childLinks).toHaveLength(2);
        childLinks.forEach((link) => {
            expect(link).toHaveAttribute('href', '/ro/roadmap/antrenament-avansat');
            expect(link).not.toHaveAttribute('aria-current');
        });
    });

    it('closes and resets the mobile navigation when the selected page changes', () => {
        const { container, rerender } = render(<RoadmapDetails page={page} tree={tree} />);
        const mobileNavigation = container.querySelector('details');

        expect(mobileNavigation).not.toBeNull();
        mobileNavigation!.open = true;

        fireEvent.click(
            within(mobileNavigation!).getByRole('link', { name: 'Antrenament avansat' }),
        );
        expect(mobileNavigation).not.toHaveAttribute('open');

        mobileNavigation!.open = true;
        rerender(
            <RoadmapDetails
                page={{
                    title: 'Antrenament avansat',
                    slug: 'antrenament-avansat',
                    html: '<p>Conținut avansat.</p>',
                }}
                tree={tree}
            />,
        );

        const nextMobileNavigation = container.querySelector('details');
        expect(nextMobileNavigation).not.toBe(mobileNavigation);
        expect(nextMobileNavigation).not.toHaveAttribute('open');
    });

    it('renders a malformed node without a slug as a label instead of an index link', () => {
        render(
            <RoadmapDetails
                page={page}
                tree={[
                    {
                        id: 10,
                        title: 'Categorie fără rută',
                        slug: null,
                        children: [
                            {
                                id: 11,
                                title: 'Material valid',
                                slug: 'material-valid',
                                children: [],
                            },
                        ],
                    },
                ]}
            />,
        );

        expect(screen.queryByRole('link', { name: 'Categorie fără rută' })).toBeNull();
        expect(screen.getAllByText('Categorie fără rută')).toHaveLength(2);
        screen.getAllByRole('link', { name: 'Material valid' }).forEach((link) => {
            expect(link).toHaveAttribute('href', '/ro/roadmap/material-valid');
        });
    });
});
