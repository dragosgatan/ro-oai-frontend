import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    onLocaleChange: vi.fn(),
    setLocale: vi.fn(),
    trackEvent: vi.fn(),
}));

vi.mock('@/hooks/use-locale', () => ({
    useLocale: () => ({
        locale: 'ro',
        setLocale: mocks.setLocale,
        isInitialized: true,
    }),
}));

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) =>
        ({
            'header.changeLanguage': 'Change language',
            'common.selected': 'selected',
        })[key] ?? key,
}));

vi.mock('@/lib/analytics', () => ({
    analytics: { trackEvent: mocks.trackEvent },
    AnalyticsEvents: { LANGUAGE_CHANGE: 'language_change' },
}));

import { LanguageSelector } from '@/components/language-selector';

describe('LanguageSelector', () => {
    beforeEach(() => {
        mocks.onLocaleChange.mockReset();
        mocks.setLocale.mockReset();
        mocks.trackEvent.mockReset();
    });

    afterEach(() => {
        cleanup();
        document.body.removeAttribute('data-scroll-locked');
        document.body.style.pointerEvents = '';
    });

    it('keeps the page interactive while the language menu is open', async () => {
        const user = userEvent.setup();
        render(<LanguageSelector onLocaleChange={mocks.onLocaleChange} />);

        await user.click(screen.getByRole('button', { name: 'Change language: Română' }));

        const menu = await screen.findByRole('menu');
        expect(menu.getAttribute('aria-label')).toBe('Change language');
        expect(document.body.getAttribute('data-scroll-locked')).toBeNull();
        expect(document.body.style.pointerEvents).not.toBe('none');

        await user.click(screen.getByRole('menuitem', { name: 'English' }));

        expect(mocks.onLocaleChange).toHaveBeenCalledOnce();
        expect(mocks.setLocale).toHaveBeenCalledWith('en');
        await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
        expect(document.body.getAttribute('data-scroll-locked')).toBeNull();
        expect(document.body.style.pointerEvents).not.toBe('none');
    });
});
