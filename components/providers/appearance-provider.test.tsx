import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ updateAppearancePreferences: vi.fn() }));

vi.mock('@/lib/appearance-api', () => ({
    updateAppearancePreferences: mocks.updateAppearancePreferences,
}));

import { AppearanceProvider, useAppearance } from '@/components/providers/appearance-provider';

function Consumer() {
    const appearance = useAppearance();
    return (
        <div>
            <output>{`${appearance.uiTheme}:${appearance.colorMode}:${appearance.syncStatus}`}</output>
            <button type="button" onClick={() => void appearance.setInterfaceTheme('onia-v1')}>
                V1
            </button>
            <button type="button" onClick={() => void appearance.setColorMode('dark')}>
                Dark
            </button>
        </div>
    );
}

describe('AppearanceProvider', () => {
    let prefersDark = false;
    let systemListener: (() => void) | null = null;

    beforeEach(() => {
        mocks.updateAppearancePreferences.mockReset();
        window.localStorage.clear();
        document.documentElement.className = '';
        delete document.documentElement.dataset.interfaceTheme;
        delete document.documentElement.dataset.colorMode;
        Object.defineProperty(window, 'matchMedia', {
            configurable: true,
            value: vi.fn().mockImplementation(() => ({
                matches: prefersDark,
                addEventListener: vi.fn((_event: string, listener: () => void) => {
                    systemListener = listener;
                }),
                removeEventListener: vi.fn(),
            })),
        });
        prefersDark = false;
        systemListener = null;
    });

    afterEach(() => cleanup());

    it('applies server preferences before an authenticated user changes them', () => {
        render(
            <AppearanceProvider
                authenticated
                initialPreferences={{ uiTheme: 'onia-v1', colorMode: 'dark' }}
            >
                <Consumer />
            </AppearanceProvider>,
        );

        expect(screen.getByText('onia-v1:dark:idle')).toBeTruthy();
        expect(document.documentElement.dataset.interfaceTheme).toBe('onia-v1');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('persists authenticated changes and keeps both dimensions independent', async () => {
        mocks.updateAppearancePreferences.mockResolvedValue({
            uiTheme: 'onia-v1',
            colorMode: 'system',
        });
        const user = userEvent.setup();
        render(
            <AppearanceProvider
                authenticated
                initialPreferences={{ uiTheme: 'onia-v2', colorMode: 'system' }}
            >
                <Consumer />
            </AppearanceProvider>,
        );

        await user.click(screen.getByRole('button', { name: 'V1' }));

        expect(mocks.updateAppearancePreferences).toHaveBeenCalledWith({ uiTheme: 'onia-v1' });
        await waitFor(() => expect(screen.getByText('onia-v1:system:saved')).toBeTruthy());
        expect(window.localStorage.length).toBe(0);
    });

    it('rolls back the latest failed authenticated change', async () => {
        mocks.updateAppearancePreferences.mockRejectedValue(new Error('offline'));
        const user = userEvent.setup();
        render(
            <AppearanceProvider
                authenticated
                initialPreferences={{ uiTheme: 'onia-v2', colorMode: 'light' }}
            >
                <Consumer />
            </AppearanceProvider>,
        );

        await user.click(screen.getByRole('button', { name: 'V1' }));
        await waitFor(() => expect(screen.getByText('onia-v2:light:error')).toBeTruthy());
        expect(document.documentElement.dataset.interfaceTheme).toBe('onia-v2');
    });

    it('stores anonymous preferences locally without calling the account API', async () => {
        const user = userEvent.setup();
        render(
            <AppearanceProvider
                authenticated={false}
                initialPreferences={{ uiTheme: 'onia-v2', colorMode: 'system' }}
            >
                <Consumer />
            </AppearanceProvider>,
        );

        await user.click(screen.getByRole('button', { name: 'Dark' }));
        expect(window.localStorage.getItem('mlcompete-color-mode')).toBe('dark');
        expect(mocks.updateAppearancePreferences).not.toHaveBeenCalled();
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('reacts when the operating-system color mode changes', () => {
        render(
            <AppearanceProvider
                authenticated={false}
                initialPreferences={{ uiTheme: 'onia-v2', colorMode: 'system' }}
            >
                <Consumer />
            </AppearanceProvider>,
        );

        expect(document.documentElement.classList.contains('dark')).toBe(false);
        prefersDark = true;
        act(() => systemListener?.());
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('serializes rapid partial updates and keeps the latest optimistic choice', async () => {
        let resolveTheme!: (value: { uiTheme: 'onia-v1'; colorMode: 'system' }) => void;
        let resolveColor!: (value: { uiTheme: 'onia-v1'; colorMode: 'dark' }) => void;
        mocks.updateAppearancePreferences
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveTheme = resolve;
                    }),
            )
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveColor = resolve;
                    }),
            );
        const user = userEvent.setup();
        render(
            <AppearanceProvider
                authenticated
                initialPreferences={{ uiTheme: 'onia-v2', colorMode: 'system' }}
            >
                <Consumer />
            </AppearanceProvider>,
        );

        await user.click(screen.getByRole('button', { name: 'V1' }));
        await user.click(screen.getByRole('button', { name: 'Dark' }));
        expect(screen.getByText('onia-v1:dark:saving')).toBeTruthy();
        expect(mocks.updateAppearancePreferences).toHaveBeenCalledTimes(1);

        await act(async () => resolveTheme({ uiTheme: 'onia-v1', colorMode: 'system' }));
        await waitFor(() => expect(mocks.updateAppearancePreferences).toHaveBeenCalledTimes(2));
        expect(screen.getByText('onia-v1:dark:saving')).toBeTruthy();

        await act(async () => resolveColor({ uiTheme: 'onia-v1', colorMode: 'dark' }));
        await waitFor(() => expect(screen.getByText('onia-v1:dark:saved')).toBeTruthy());
    });
});
