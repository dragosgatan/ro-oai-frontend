import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import enMessages from '@/locales/en.json';
import type { UserAchievement } from '@/lib/types';

import { AchievementNotificationToast } from './achievement-notification-toast';

const userAchievement: UserAchievement = {
    id: 12,
    achievement: {
        id: 7,
        code: 'FIRST_SOLVE',
        name: 'API fallback name',
        description: 'API fallback description',
        category: 'PROBLEM_SOLVING',
        rarity: 'RARE',
        xpReward: 100,
        targetValue: 1,
        isSecret: false,
        unlockedPercentage: 75,
    },
    unlockedAt: new Date('2026-01-01T12:00:00Z'),
    isShowcased: false,
};

function renderNotification(onDismiss = vi.fn()) {
    return render(
        <NextIntlClientProvider locale="en" messages={{ achievements: enMessages.achievements }}>
            <AchievementNotificationToast
                id="achievement-7"
                userAchievement={userAchievement}
                onDismiss={onDismiss}
            />
        </NextIntlClientProvider>,
    );
}

describe('AchievementNotificationToast', () => {
    beforeEach(() => {
        window.matchMedia = vi.fn().mockReturnValue({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('announces localized achievement content without urgent interruption', () => {
        renderNotification();

        const status = screen.getByRole('status');
        expect(status.getAttribute('aria-live')).toBe('polite');
        expect(status.textContent).toContain('Achievement Unlocked!');
        expect(status.textContent).toContain('First Steps');
        expect(status.textContent).toContain('Rare');
        expect(status.textContent).toContain('+100 XP');
    });

    it('provides an explicitly labelled 44px dismiss control', () => {
        renderNotification();

        const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
        expect(dismissButton.classList.contains('h-11')).toBe(true);
        expect(dismissButton.classList.contains('w-11')).toBe(true);
    });
});
