import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { CompetitionDateDisplay } from './competition-date-display';

const messages = {
    common: { na: 'N/A' },
    competitions: {
        dates: {
            starts: 'Începe',
            ends: 'Se încheie',
        },
    },
};

function renderDateDisplay(props: ComponentProps<typeof CompetitionDateDisplay>, locale = 'ro') {
    return render(
        <NextIntlClientProvider locale={locale} messages={messages}>
            <CompetitionDateDisplay {...props} />
        </NextIntlClientProvider>,
    );
}

describe('CompetitionDateDisplay', () => {
    it('uses the active locale for Romanian date and time formatting', () => {
        const { container } = renderDateDisplay({
            startTime: '2026-05-24T09:25:00.000Z',
            endTime: '2026-05-24T11:30:00.000Z',
        });

        expect(container.textContent).toMatch(/24 mai 2026/u);
        expect(container.textContent).not.toMatch(/\b(?:AM|PM)\b/u);
        expect(container.querySelectorAll('time')).toHaveLength(4);
    });

    it('renders semantic start and end values in the compact variant', () => {
        const startTime = '2026-05-24T09:25:00.000Z';
        const endTime = '2026-05-25T11:30:00.000Z';
        const { container } = renderDateDisplay({ startTime, endTime, variant: 'compact' });
        const dateTimes = Array.from(container.querySelectorAll('time')).map((element) =>
            element.getAttribute('datetime'),
        );

        expect(dateTimes).toEqual([startTime, endTime, startTime, endTime]);
    });

    it('shows a stable fallback for invalid or reversed ranges', () => {
        const { getByText } = renderDateDisplay({
            startTime: '2026-05-25T11:30:00.000Z',
            endTime: '2026-05-24T09:25:00.000Z',
        });

        expect(getByText('N/A')).toBeTruthy();
    });
});
