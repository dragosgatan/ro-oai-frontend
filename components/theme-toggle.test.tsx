import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    setInterfaceTheme: vi.fn(),
    setColorMode: vi.fn(),
    trackEvent: vi.fn(),
    toastError: vi.fn(),
}));

vi.mock('@/components/providers/appearance-provider', () => ({
    useAppearance: () => ({
        uiTheme: 'onia-v2',
        colorMode: 'light',
        resolvedColorMode: 'light',
        syncStatus: 'idle',
        setInterfaceTheme: mocks.setInterfaceTheme,
        setColorMode: mocks.setColorMode,
    }),
}));

vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations: () => (key: string) =>
        ({
            themeLabel: 'Theme',
            themeLight: 'Light',
            themeDark: 'Dark',
            themeSystem: 'System',
            appearanceMenuLabel: 'Appearance',
            interfaceStyleLabel: 'Platform style',
            colorModeLabel: 'Color mode',
            oniaV2Name: 'ONIA v2',
            oniaV1Name: 'ONIA v1',
        })[key] ?? key,
}));

vi.mock('@/lib/analytics', () => ({
    analytics: { trackEvent: mocks.trackEvent },
    AnalyticsEvents: { THEME_CHANGE: 'theme_change' },
}));

vi.mock('@/components/ui/sonner', () => ({
    toast: { error: mocks.toastError },
}));

import { ThemeToggle } from '@/components/theme-toggle';

describe('ThemeToggle', () => {
    beforeEach(() => {
        mocks.setInterfaceTheme.mockReset();
        mocks.setColorMode.mockReset();
        mocks.trackEvent.mockReset();
        mocks.toastError.mockReset();
        mocks.setInterfaceTheme.mockResolvedValue(true);
        mocks.setColorMode.mockResolvedValue(true);
    });

    afterEach(() => {
        cleanup();
        document.body.removeAttribute('data-scroll-locked');
        document.body.style.pointerEvents = '';
    });

    it('keeps the page interactive while the theme menu is open', async () => {
        const user = userEvent.setup();
        render(<ThemeToggle />);

        const trigger = await screen.findByRole('button', { name: 'Appearance' });
        await user.click(trigger);

        expect(await screen.findByRole('menu')).toBeTruthy();
        expect(
            screen.getByRole('menuitemradio', { name: 'ONIA v2' }).getAttribute('aria-checked'),
        ).toBe('true');
        expect(document.body.getAttribute('data-scroll-locked')).toBeNull();
        expect(document.body.style.pointerEvents).not.toBe('none');

        await user.click(screen.getByRole('menuitemradio', { name: 'Dark' }));

        expect(mocks.setColorMode).toHaveBeenCalledWith('dark');
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expect(document.body.getAttribute('data-scroll-locked')).toBeNull();
        expect(document.body.style.pointerEvents).not.toBe('none');
    });

    it('shows a visible error after a failed save closes the menu', async () => {
        mocks.setColorMode.mockResolvedValue(false);
        const user = userEvent.setup();
        render(<ThemeToggle />);

        await user.click(await screen.findByRole('button', { name: 'Appearance' }));
        await user.click(screen.getByRole('menuitemradio', { name: 'Dark' }));

        await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith('appearanceSaveError'));
    });
});
