import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingGate } from '../onboarding-gate';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
    Link: 'a',
}));

vi.mock('@/lib/platform-fonts', () => ({
    platformSans: { className: '', variable: '' },
}));

const STORAGE_KEY = 'mlcompete-onboarding-progress';

type StoredProgress = {
    steps: {
        download: boolean;
        install: boolean;
        connect: boolean;
        scan: boolean;
        consent: boolean;
    };
    completedAt?: string;
};

function readStoredProgress(competitionId: number): StoredProgress | undefined {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return undefined;

    return (JSON.parse(value) as Record<string, StoredProgress>)[competitionId.toString()];
}

async function advanceToConsent(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'steps.sebDownload.confirmButton' }));
    await user.click(screen.getByRole('button', { name: 'steps.install.confirmButton' }));
    await user.click(screen.getByRole('button', { name: 'steps.sebConfig.confirmButton' }));
}

describe('OnboardingGate Safe Exam Browser flow', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('does not render a gate for competitions that do not require Safe Exam Browser', () => {
        const { container } = render(
            <OnboardingGate
                competitionId={100}
                competitionName="Open competition"
                sebRequired={false}
                onComplete={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('guides participants through all four steps in order', async () => {
        const user = userEvent.setup();
        const onComplete = vi.fn().mockResolvedValue(undefined);

        render(
            <OnboardingGate
                competitionId={101}
                competitionName="SEB competition"
                sebRequired
                onComplete={onComplete}
                onCancel={vi.fn()}
            />,
        );

        expect(
            screen.getByRole('heading', { level: 3, name: 'steps.sebDownload.title' }),
        ).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'steps.sebDownload.confirmButton' }));

        expect(screen.getByRole('heading', { level: 3, name: 'steps.install.title' })).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'steps.install.confirmButton' }));

        expect(
            screen.getByRole('heading', { level: 3, name: 'steps.sebConfig.title' }),
        ).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'steps.sebConfig.confirmButton' }));

        expect(screen.getByRole('heading', { level: 3, name: 'steps.consent.title' })).toBeTruthy();
        const joinButton = screen.getByRole('button', { name: 'steps.consent.joinButton' });
        expect(joinButton).toBeDisabled();

        await user.click(screen.getByRole('checkbox'));
        expect(joinButton).toBeEnabled();
        await user.click(joinButton);

        await waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
        await waitFor(() => {
            expect(readStoredProgress(101)).toMatchObject({
                steps: {
                    download: true,
                    install: true,
                    connect: true,
                    scan: true,
                    consent: true,
                },
            });
            expect(readStoredProgress(101)?.completedAt).toBeDefined();
        });
    });

    it('restores partial progress and resumes at the first incomplete step', async () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                102: {
                    steps: {
                        download: true,
                        install: true,
                        connect: false,
                        scan: false,
                        consent: false,
                    },
                },
            }),
        );

        render(
            <OnboardingGate
                competitionId={102}
                competitionName="Resumed competition"
                sebRequired
                onComplete={vi.fn()}
                onCancel={vi.fn()}
            />,
        );

        await waitFor(() => {
            expect(
                screen.getByRole('button', { name: 'steps.sebConfig.confirmButton' }),
            ).toBeTruthy();
        });
    });

    it('preserves progress but does not mark consent complete when joining fails', async () => {
        const user = userEvent.setup();
        const onComplete = vi.fn().mockRejectedValue(new Error('Request failed'));

        render(
            <OnboardingGate
                competitionId={103}
                competitionName="Failing competition"
                sebRequired
                onComplete={onComplete}
                onCancel={vi.fn()}
            />,
        );

        await advanceToConsent(user);
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: 'steps.consent.joinButton' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('errors.joinFailed');
        expect(readStoredProgress(103)?.steps).toEqual({
            download: true,
            install: true,
            connect: true,
            scan: true,
            consent: false,
        });
    });

    it('notifies the parent when a participant cancels', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();

        render(
            <OnboardingGate
                competitionId={104}
                competitionName="Cancelled competition"
                sebRequired
                onComplete={vi.fn()}
                onCancel={onCancel}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'cancelButton' }));
        expect(onCancel).toHaveBeenCalledOnce();
    });
});
