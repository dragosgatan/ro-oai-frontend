import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    currentUser: {
        value: {} as Record<string, unknown>,
    },
    handleLogout: vi.fn(),
    refetch: vi.fn(),
    setSentryUser: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
    signIn: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
    setUser: mocks.setSentryUser,
}));

vi.mock('@/lib/auth', () => ({
    handleLogout: mocks.handleLogout,
}));

vi.mock('@/components/providers/current-user-provider', () => ({
    useCurrentUser: () => mocks.currentUser.value,
}));

vi.mock('@/components/comment-notification-provider', () => ({
    useCommentNotificationContext: () => ({ unreadCount: 0 }),
}));

vi.mock('@/components/profile-completion-indicator', () => ({
    ProfileCompletionIndicator: () => null,
}));

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) =>
        ({
            'common.error': 'Error',
            'common.retry': 'Retry',
            'header.userMenu': 'User menu',
            'navigation.logout': 'Sign out',
            'navigation.myQuestions': 'My questions',
            'navigation.myRecentSubmissions': 'Recent submissions',
            'navigation.profile': 'Profile',
            'navigation.settings': 'Settings',
            'settings.errorLoadingSettings': 'Could not load profile',
        })[key] ?? key,
}));

vi.mock('@/i18n/routing', async () => {
    const React = await import('react');

    return {
        Link: React.forwardRef<
            HTMLAnchorElement,
            React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
        >(({ href, ...props }, ref) => <a ref={ref} href={href} {...props} />),
    };
});

import { UserDropdown } from '@/components/user-dropdown';

function expectPageToRemainInteractive() {
    expect(document.body.getAttribute('data-scroll-locked')).toBeNull();
    expect(document.body.style.pointerEvents).not.toBe('none');
}

describe('UserDropdown', () => {
    beforeEach(() => {
        mocks.handleLogout.mockReset();
        mocks.refetch.mockReset();
        mocks.setSentryUser.mockReset();
        mocks.currentUser.value = {
            user: {
                avatar: null,
                email: 'participant@example.com',
                userId: 'participant-1',
                username: 'Participant',
            },
            status: 'authenticated',
            sessionId: 'participant-1',
            profileStatus: 'ready',
            refetch: mocks.refetch,
        };
    });

    afterEach(() => {
        cleanup();
        document.body.removeAttribute('data-scroll-locked');
        document.body.style.pointerEvents = '';
    });

    it('keeps the page interactive while the avatar menu is open', async () => {
        const user = userEvent.setup();
        render(<UserDropdown />);

        const trigger = screen.getByRole('button', { name: 'User menu' });
        await user.click(trigger);

        expect(await screen.findByRole('menu')).toBeTruthy();
        expectPageToRemainInteractive();

        await user.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expect(document.activeElement).toBe(trigger);
        expectPageToRemainInteractive();

        await user.click(trigger);
        await user.click(await screen.findByRole('menuitem', { name: 'Sign out' }));

        expect(mocks.handleLogout).toHaveBeenCalledOnce();
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expectPageToRemainInteractive();
    });

    it('also keeps the fallback account menu non-modal', async () => {
        mocks.currentUser.value = {
            user: null,
            status: 'authenticated',
            sessionId: 'participant-1',
            profileStatus: 'error',
            refetch: mocks.refetch,
        };
        const user = userEvent.setup();
        render(<UserDropdown />);

        await user.click(screen.getByRole('button', { name: 'User menu' }));

        expect(await screen.findByRole('menu')).toBeTruthy();
        expectPageToRemainInteractive();

        await user.click(screen.getByRole('menuitem', { name: 'Retry' }));
        expect(mocks.refetch).toHaveBeenCalledOnce();
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expectPageToRemainInteractive();
    });
});
