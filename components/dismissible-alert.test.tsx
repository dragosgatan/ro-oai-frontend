import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DismissibleAlert } from '@/components/dismissible-alert';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => (key === 'close' ? 'Close' : key),
}));

describe('DismissibleAlert', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('keeps the icon, message, and dismiss control in a non-overlapping flex layout', async () => {
        render(
            <DismissibleAlert
                message="Select your best submissions for the final leaderboard."
                storageKey="competition-reminder"
            />,
        );

        const alert = await screen.findByRole('alert');
        const dismissButton = screen.getByRole('button', { name: 'Close' });

        expect(alert.classList.contains('flex')).toBe(true);
        expect(alert.firstElementChild?.tagName).toBe('SPAN');
        expect(alert.firstElementChild?.classList.contains('shrink-0')).toBe(true);
        expect(screen.getByText(/Select your best submissions/).classList.contains('flex-1')).toBe(
            true,
        );
        expect(dismissButton.classList.contains('h-11')).toBe(true);
        expect(dismissButton.classList.contains('w-11')).toBe(true);
        expect(dismissButton.classList.contains('shrink-0')).toBe(true);
    });

    it('persists dismissal and removes the reminder from the page', async () => {
        const user = userEvent.setup();
        render(
            <DismissibleAlert
                message="Select your best submissions."
                storageKey="competition-reminder"
            />,
        );

        await user.click(await screen.findByRole('button', { name: 'Close' }));

        await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
        expect(localStorage.getItem('competition-reminder')).toBe('true');
    });

    it('renders a stable non-dismissible reminder without an empty close affordance', async () => {
        render(<DismissibleAlert message="Selection is required." dismissible={false} />);

        expect(await screen.findByRole('alert')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    });
});
