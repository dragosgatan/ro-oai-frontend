import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
    CompetitionHostingPage,
    CompetitionParticipantInvitation,
    HostedCompetition,
} from '@/lib/competition-hosting';

const mocks = vi.hoisted(() => ({
    invite: vi.fn(),
    reloadInvitations: vi.fn(),
    replace: vi.fn(),
    resend: vi.fn(),
    refresh: vi.fn(),
    search: vi.fn(),
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
}));

vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations: () => (key: string, values?: Record<string, string>) =>
        values?.date ? `${key} ${values.date}` : key,
}));

vi.mock('@/i18n/routing', () => ({
    Link: ({ href, children, ...props }: ComponentProps<'a'> & { children: ReactNode }) => (
        <a href={typeof href === 'string' ? href : '#'} {...props}>
            {children}
        </a>
    ),
    useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }),
}));

vi.mock('sonner', () => ({
    toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

vi.mock('@/lib/competition-hosting', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/competition-hosting')>()),
    getHostedCompetitionInvitations: mocks.reloadInvitations,
    inviteHostedCompetitionParticipant: mocks.invite,
    resendHostedCompetitionInvitation: mocks.resend,
    searchCompetitionInvitees: mocks.search,
}));

import { ParticipantsManager } from '@/components/competition-hosting/participants-manager';

const competition: HostedCompetition = {
    id: 42,
    name: 'Community AI Cup',
    shortDescription: 'A competition',
    description: 'Description',
    rules: 'Rules',
    startTime: '2026-08-01T09:00:00Z',
    endTime: '2026-08-01T13:00:00Z',
    competitionType: 'CLASSIC',
    access: 'PRIVATE',
    lifecycle: 'UPCOMING',
    allowPublicQuestions: true,
    commentsEnabled: true,
    selectionLimit: 1,
    participantCount: 0,
    pendingInvitationCount: 0,
    problemCount: 0,
    problems: [],
    permissions: {
        approvedHosting: true,
        canEditContent: true,
        canEditSchedule: true,
        canSubmitProblems: true,
        canManageParticipants: true,
        canInviteParticipants: true,
    },
    version: 1,
    createdAt: null,
    updatedAt: null,
};

function page<T>(content: T[], number = 0): CompetitionHostingPage<T> {
    return {
        content,
        page: {
            number,
            size: 20,
            totalElements: content.length,
            totalPages: Math.max(1, number + 1),
        },
    };
}

function emailInvitation(
    overrides: Partial<CompetitionParticipantInvitation> = {},
): CompetitionParticipantInvitation {
    return {
        id: 'invite-email-1',
        recipientType: 'EMAIL',
        userId: null,
        username: null,
        displayName: null,
        email: null,
        maskedEmail: 'a***@example.org',
        status: 'PENDING',
        expiresAt: '2026-07-29T10:00:00Z',
        createdAt: '2026-07-22T10:00:00Z',
        lastSentAt: '2026-07-22T10:00:00Z',
        deliveryStatus: 'QUEUED',
        deliveryAttemptedAt: '2026-07-22T10:00:00Z',
        deliveryAttemptCount: 1,
        version: 1,
        canResend: true,
        canRevoke: true,
        ...overrides,
    };
}

function renderManager(invitations: CompetitionParticipantInvitation[] = [], invitationPage = 0) {
    return render(
        <ParticipantsManager
            competition={competition}
            participantPage={page([])}
            invitationPage={page(invitations, invitationPage)}
        />,
    );
}

function selectEmailMode() {
    fireEvent.click(screen.getByRole('radio', { name: 'participants.invite.mode.EMAIL' }));
}

describe('hosted competition email invitations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.reloadInvitations.mockResolvedValue(page([]));
        mocks.search.mockResolvedValue([]);
    });

    it('uses semantic recipient radios and clears an invalid email error while it is corrected', () => {
        renderManager();

        const platformMode = screen.getByRole('radio', {
            name: 'participants.invite.mode.PLATFORM_USER',
        });
        expect(platformMode).toBeChecked();
        selectEmailMode();
        const email = screen.getByRole('textbox', {
            name: 'participants.invite.emailLabel',
        });
        fireEvent.change(email, { target: { value: 'not-an-email' } });
        fireEvent.click(screen.getByRole('button', { name: 'participants.invite.send' }));

        expect(mocks.invite).not.toHaveBeenCalled();
        expect(screen.getByRole('alert')).toHaveTextContent('participants.errors.email');
        expect(email).toHaveAttribute('aria-invalid', 'true');

        fireEvent.change(email, { target: { value: 'ana@example.org' } });
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(email).toHaveAttribute('aria-invalid', 'false');
    });

    it('submits a normalized email, then reconciles its queued response to sent', async () => {
        let resolveInvite: (invitation: CompetitionParticipantInvitation) => void = () => undefined;
        mocks.invite.mockImplementation(
            () =>
                new Promise<CompetitionParticipantInvitation>((resolve) => {
                    resolveInvite = resolve;
                }),
        );
        mocks.reloadInvitations.mockResolvedValue(
            page([
                emailInvitation({
                    deliveryStatus: 'SENT',
                    deliveryAttemptedAt: '2026-07-22T10:05:00Z',
                }),
            ]),
        );
        renderManager();
        selectEmailMode();
        const email = screen.getByRole('textbox', {
            name: 'participants.invite.emailLabel',
        });
        const message = screen.getByRole('textbox', {
            name: 'participants.invite.messageLabel',
        });
        const send = screen.getByRole('button', { name: 'participants.invite.send' });
        fireEvent.change(email, { target: { value: '  ANA@Example.ORG  ' } });
        fireEvent.change(message, { target: { value: ' Welcome ' } });
        fireEvent.submit(send.closest('form') as HTMLFormElement);

        await waitFor(() =>
            expect(mocks.invite).toHaveBeenCalledWith(42, {
                email: 'ana@example.org',
                message: 'Welcome',
            }),
        );
        expect(send).toBeDisabled();

        resolveInvite(emailInvitation());
        await waitFor(() => expect(send).not.toBeDisabled());
        expect(mocks.toastSuccess).toHaveBeenCalledWith('participants.toasts.emailQueued');
        expect(mocks.reloadInvitations).toHaveBeenCalledWith(42, { page: 0, size: 20 });
        expect(screen.getByText('participants.pending.delivery.SENT')).toBeVisible();
        expect(mocks.toastSuccess).not.toHaveBeenCalledWith('participants.toasts.emailSent');
        expect(screen.getAllByText('a***@example.org').length).toBeGreaterThan(0);
        expect(email).toHaveValue('');
        expect(message).toHaveValue('');
    });

    it('retains the email and message when invitation creation fails', async () => {
        mocks.invite.mockRejectedValue(new Error('Invitation service unavailable'));
        renderManager();
        selectEmailMode();
        const email = screen.getByRole('textbox', {
            name: 'participants.invite.emailLabel',
        });
        const message = screen.getByRole('textbox', {
            name: 'participants.invite.messageLabel',
        });
        fireEvent.change(email, { target: { value: 'ana@example.org' } });
        fireEvent.change(message, { target: { value: 'Please join us' } });
        fireEvent.click(screen.getByRole('button', { name: 'participants.invite.send' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Invitation service unavailable',
        );
        expect(email).toHaveValue('ana@example.org');
        expect(message).toHaveValue('Please join us');
        expect(mocks.reloadInvitations).not.toHaveBeenCalled();
    });

    it('keeps a created invitation visible when queued delivery reconciles to failed', async () => {
        mocks.invite.mockResolvedValue(emailInvitation());
        mocks.reloadInvitations.mockResolvedValue(
            page([
                emailInvitation({
                    deliveryStatus: 'FAILED',
                    deliveryAttemptCount: 1,
                }),
            ]),
        );
        renderManager();
        selectEmailMode();
        fireEvent.change(screen.getByRole('textbox', { name: 'participants.invite.emailLabel' }), {
            target: { value: 'ana@example.org' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'participants.invite.send' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'participants.errors.emailDeliveryFailed',
        );
        expect(mocks.toastSuccess).toHaveBeenCalledWith('participants.toasts.emailQueued');
        expect(mocks.toastError).toHaveBeenCalledWith('participants.toasts.emailFailed');
        expect(screen.getByText('participants.pending.delivery.FAILED')).toBeVisible();
        expect(
            screen.getByRole('button', { name: 'participants.pending.retryEmail' }),
        ).toBeVisible();
    });

    it('reconciles a new invitation from page zero while viewing later invitation history', async () => {
        mocks.invite.mockResolvedValue(emailInvitation());
        mocks.reloadInvitations.mockResolvedValue(
            page([
                emailInvitation({
                    deliveryStatus: 'FAILED',
                    deliveryAttemptCount: 1,
                }),
            ]),
        );
        renderManager([], 2);
        selectEmailMode();
        fireEvent.change(screen.getByRole('textbox', { name: 'participants.invite.emailLabel' }), {
            target: { value: 'ana@example.org' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'participants.invite.send' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'participants.errors.emailDeliveryFailed',
        );
        expect(mocks.reloadInvitations).toHaveBeenCalledWith(42, { page: 0, size: 20 });
        expect(mocks.toastError).toHaveBeenCalledWith('participants.toasts.emailFailed');
        expect(mocks.replace).toHaveBeenCalledWith('/my-competitions/42/participants');
        expect(mocks.refresh).not.toHaveBeenCalled();
    });

    it('reconciles a queued platform-user resend to sent without a second success toast', async () => {
        const platformRecipient = {
            recipientType: 'PLATFORM_USER' as const,
            userId: 'user-1',
            username: 'ana',
            displayName: 'Nova Testperson',
            email: null,
            maskedEmail: null,
        };
        mocks.resend.mockResolvedValue(
            emailInvitation({
                ...platformRecipient,
                deliveryStatus: 'QUEUED',
                deliveryAttemptedAt: null,
                deliveryAttemptCount: 1,
                version: 2,
            }),
        );
        mocks.reloadInvitations.mockResolvedValue(
            page([
                emailInvitation({
                    ...platformRecipient,
                    deliveryStatus: 'SENT',
                    deliveryAttemptedAt: '2026-07-22T10:10:00Z',
                    deliveryAttemptCount: 2,
                    version: 3,
                }),
            ]),
        );
        renderManager([
            emailInvitation({
                ...platformRecipient,
                deliveryStatus: 'FAILED',
                deliveryAttemptedAt: '2026-07-22T10:10:00Z',
                deliveryAttemptCount: 1,
            }),
        ]);

        expect(screen.getByText('participants.pending.status.PENDING')).toBeVisible();
        expect(screen.getByText('participants.pending.delivery.FAILED')).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'participants.pending.retryEmail' }));

        await waitFor(() => expect(mocks.resend).toHaveBeenCalledTimes(1));
        await waitFor(() =>
            expect(screen.getByText('participants.pending.delivery.SENT')).toBeVisible(),
        );
        expect(mocks.reloadInvitations).toHaveBeenCalledWith(42, { page: 0, size: 20 });
        expect(screen.queryByText('participants.pending.delivery.FAILED')).not.toBeInTheDocument();
        expect(mocks.toastSuccess).toHaveBeenCalledWith('participants.toasts.emailQueued');
        expect(mocks.toastSuccess).not.toHaveBeenCalledWith('participants.toasts.emailSent');
    });
});
