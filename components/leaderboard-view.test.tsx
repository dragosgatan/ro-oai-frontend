import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    trackLeaderboard: vi.fn(),
    trackEvent: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
    useSession: () => ({ data: { id: 'user-75' } }),
}));

vi.mock('next/font/google', () => ({
    Onest: () => ({ className: 'onest', variable: '--font-onest' }),
    Unbounded: () => ({ className: 'unbounded', variable: '--font-unbounded' }),
}));

vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations:
        (namespace: string) => (key: string, values?: Record<string, number | string>) => {
            if (namespace === 'problems' && key === 'loadMore') return 'Load more';
            if (namespace === 'rankings' && key === 'resultsCount') {
                return `${values?.count ?? 0} results`;
            }
            return key;
        },
}));

vi.mock('@/hooks/use-gtm-tracker', () => ({
    useGTMTracker: () => ({ trackLeaderboard: mocks.trackLeaderboard }),
}));

vi.mock('@/lib/analytics', () => ({
    analytics: { trackEvent: mocks.trackEvent },
    AnalyticsEvents: { LEADERBOARD_VIEW: 'leaderboard_view' },
}));

vi.mock('@/components/country-flag', () => ({
    CountryFlag: () => null,
}));

vi.mock('@/i18n/routing', () => ({
    Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a href={String(href)} {...props}>
            {children}
        </a>
    ),
}));

import { LeaderboardView } from '@/components/leaderboard-view';
import type { GenericLeaderboardEntry } from '@/lib/types';

const leaderboard: GenericLeaderboardEntry[] = Array.from({ length: 75 }, (_, index) => ({
    rank: index + 1,
    userId: `user-${index + 1}`,
    username: `participant-${index + 1}`,
    totalScore: 1000 - index,
    solvedCount: index,
    averageScore: 90,
}));

describe('LeaderboardView progressive rendering', () => {
    beforeEach(() => {
        mocks.trackLeaderboard.mockReset();
        mocks.trackEvent.mockReset();
    });

    it('renders an initial batch, keeps the current participant visible, and reveals more', async () => {
        const user = userEvent.setup();
        render(<LeaderboardView leaderboard={leaderboard} />);

        expect(screen.queryByText('participant-51')).toBeNull();
        expect(screen.getByText('participant-75')).toBeTruthy();
        expect(screen.getByText('51 results / 75')).toBeTruthy();

        await user.click(screen.getByRole('button', { name: 'Load more' }));

        expect(screen.getByText('participant-51')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull();
    });

    it('shows the first full batch when refreshed data replaces an empty result', () => {
        const { rerender } = render(<LeaderboardView leaderboard={[]} />);

        rerender(<LeaderboardView leaderboard={leaderboard} />);

        expect(screen.getByText('participant-50')).toBeTruthy();
        expect(screen.queryByText('participant-51')).toBeNull();
        expect(screen.getByText('51 results / 75')).toBeTruthy();
    });
});
