import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh: mocks.refresh }),
}));

import { HomeBoundaryRefresh } from '@/components/home-boundary-refresh';

describe('HomeBoundaryRefresh', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mocks.refresh.mockReset();
        window.sessionStorage.clear();
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
    });

    it('uses the server clock when the device clock is ahead', () => {
        vi.setSystemTime(new Date('2026-07-15T14:00:00.000Z'));

        render(
            <HomeBoundaryRefresh
                serverNow="2026-07-15T12:00:00.000Z"
                nextBoundary="2026-07-15T12:00:10.000Z"
            />,
        );

        expect(mocks.refresh).not.toHaveBeenCalled();

        vi.advanceTimersByTime(11_000);

        expect(mocks.refresh).toHaveBeenCalledTimes(1);
    });

    it('refreshes a boundary only once across remounts', () => {
        vi.setSystemTime(new Date('2026-07-15T15:00:00.000Z'));
        const props = {
            serverNow: '2026-07-15T12:00:01.000Z',
            nextBoundary: '2026-07-15T12:00:00.000Z',
        };

        const firstRender = render(<HomeBoundaryRefresh {...props} />);
        expect(mocks.refresh).toHaveBeenCalledTimes(1);

        firstRender.unmount();
        render(<HomeBoundaryRefresh {...props} />);

        expect(mocks.refresh).toHaveBeenCalledTimes(1);
    });

    it('allows a later competition boundary to refresh', () => {
        vi.setSystemTime(new Date('2026-07-15T16:00:00.000Z'));

        const firstRender = render(
            <HomeBoundaryRefresh
                serverNow="2026-07-15T13:00:01.000Z"
                nextBoundary="2026-07-15T13:00:00.000Z"
            />,
        );
        firstRender.unmount();

        render(
            <HomeBoundaryRefresh
                serverNow="2026-07-15T13:05:01.000Z"
                nextBoundary="2026-07-15T13:05:00.000Z"
            />,
        );

        expect(mocks.refresh).toHaveBeenCalledTimes(2);
    });
});
