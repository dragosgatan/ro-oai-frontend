import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CompetitionOrganizerDataConsent } from '@/lib/competition-hosting';

const mocks = vi.hoisted(() => ({
    updateCompetitionOrganizerDataConsent: vi.fn(),
}));

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string, values?: Record<string, string>) =>
        values?.organizer ? `${key} ${values.organizer}` : key,
}));

vi.mock('@/lib/competition-hosting', () => ({
    updateCompetitionOrganizerDataConsent: mocks.updateCompetitionOrganizerDataConsent,
}));

import {
    OrganizerDataConsentChoice,
    OrganizerDataConsentSettings,
} from '@/components/competition-organizer-data-consent';

const initialConsent: CompetitionOrganizerDataConsent = {
    thirdPartyHosted: true,
    organizerDisplayName: 'Community Foundation',
    noticeVersion: '2026-07-22',
    joined: true,
    sharePersonalDataWithOrganizer: false,
    consentedAt: null,
    decisionUpdatedAt: '2026-07-22T09:00:00Z',
};

function ChoiceHarness() {
    const [checked, setChecked] = useState(false);
    return (
        <OrganizerDataConsentChoice
            organizerName="Community Foundation"
            checked={checked}
            onCheckedChange={setChecked}
        />
    );
}

describe('organizer personal-data consent', () => {
    beforeEach(() => vi.clearAllMocks());

    it('is optional and unchecked by default while naming every shared field', () => {
        render(<ChoiceHarness />);

        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).not.toBeChecked();
        expect(screen.getByText('title Community Foundation')).toBeVisible();
        expect(screen.getByText('thirdPartyExplanation Community Foundation')).toBeVisible();
        expect(screen.getByText('fields.email')).toBeVisible();
        expect(screen.getByText('fields.name')).toBeVisible();
        expect(screen.getByText('fields.grade')).toBeVisible();
        expect(screen.getByText('fields.institution')).toBeVisible();
        expect(screen.getByText('publicIdentityNotice')).toBeVisible();
        expect(screen.getByText('optionalAndReversible')).toBeVisible();

        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();
    });

    it('lets a participant grant consent later from the competition page', async () => {
        mocks.updateCompetitionOrganizerDataConsent.mockResolvedValue({
            ...initialConsent,
            sharePersonalDataWithOrganizer: true,
            consentedAt: '2026-07-22T10:00:00Z',
        });
        render(<OrganizerDataConsentSettings competitionId={42} initialConsent={initialConsent} />);

        fireEvent.click(screen.getByRole('switch'));

        await waitFor(() =>
            expect(mocks.updateCompetitionOrganizerDataConsent).toHaveBeenCalledWith(42, true),
        );
        expect(await screen.findByText('settings.shared')).toBeVisible();
    });

    it('restores the previous choice when an update fails', async () => {
        mocks.updateCompetitionOrganizerDataConsent.mockRejectedValue(new Error('offline'));
        render(<OrganizerDataConsentSettings competitionId={42} initialConsent={initialConsent} />);

        fireEvent.click(screen.getByRole('switch'));

        expect(await screen.findByRole('alert')).toHaveTextContent('settings.error');
        expect(screen.getByRole('switch')).not.toBeChecked();
    });
});
