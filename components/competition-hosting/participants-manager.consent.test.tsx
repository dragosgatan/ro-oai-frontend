import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
    CompetitionHostingPage,
    CompetitionParticipantInvitation,
    HostedCompetition,
    HostedCompetitionParticipant,
} from '@/lib/competition-hosting';

const mocks = vi.hoisted(() => ({
    refresh: vi.fn(),
    removeHostedCompetitionParticipant: vi.fn(),
}));

vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
    Link: ({ href, children, ...props }: ComponentProps<'a'> & { children: ReactNode }) => (
        <a href={typeof href === 'string' ? href : '#'} {...props}>
            {children}
        </a>
    ),
    useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

vi.mock('@/lib/competition-hosting', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/competition-hosting')>()),
    removeHostedCompetitionParticipant: mocks.removeHostedCompetitionParticipant,
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
    participantCount: 2,
    pendingInvitationCount: 1,
    problemCount: 0,
    problems: [],
    permissions: {
        approvedHosting: false,
        canEditContent: false,
        canEditSchedule: false,
        canSubmitProblems: false,
        canManageParticipants: true,
        canInviteParticipants: true,
    },
    version: 1,
    createdAt: null,
    updatedAt: null,
};

const participants: HostedCompetitionParticipant[] = [
    {
        id: 1,
        username: 'private-user',
        displayName: 'Private User',
        sharePersonalDataWithOrganizer: false,
        consentedAt: null,
        decisionUpdatedAt: '2026-07-22T09:00:00Z',
        consentNoticeVersion: '2026-07-22',
        email: 'must-not-render@example.org',
        firstName: 'Must',
        lastName: 'Not Render',
        grade: '10',
        institution: 'Hidden School',
        avatar: null,
        joinedAt: null,
        disabled: false,
        hasSubmissions: false,
        canRemove: true,
    },
    {
        id: 2,
        username: 'sharing-user',
        displayName: 'Sharing User',
        sharePersonalDataWithOrganizer: true,
        consentedAt: '2026-07-22T09:00:00Z',
        decisionUpdatedAt: '2026-07-22T09:00:00Z',
        consentNoticeVersion: '2026-07-22',
        email: 'shared@example.org',
        firstName: 'Shared',
        lastName: 'Participant',
        grade: '11',
        institution: 'Visible School',
        avatar: null,
        joinedAt: null,
        disabled: false,
        hasSubmissions: false,
        canRemove: true,
    },
];

const invitation: CompetitionParticipantInvitation = {
    id: 'invite-1',
    recipientType: 'EMAIL',
    userId: null,
    username: null,
    displayName: null,
    email: null,
    maskedEmail: 'a***@example.org',
    status: 'PENDING',
    expiresAt: null,
    createdAt: null,
    lastSentAt: null,
    deliveryStatus: 'SENT',
    deliveryAttemptedAt: '2026-07-22T09:00:00Z',
    deliveryAttemptCount: 1,
    version: 1,
    canResend: true,
    canRevoke: true,
};

function page<T>(content: T[]): CompetitionHostingPage<T> {
    return {
        content,
        page: { number: 0, size: 20, totalElements: content.length, totalPages: 1 },
    };
}

describe('organizer participant privacy and invitation permissions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.removeHostedCompetitionParticipant.mockResolvedValue(undefined);
    });

    it('hides invitation creation and resend until approved but retains revoke', () => {
        render(
            <ParticipantsManager
                competition={competition}
                participantPage={page(participants)}
                invitationPage={page([invitation])}
            />,
        );

        expect(screen.getByText('participants.invite.locked')).toBeVisible();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'participants.pending.resend' }),
        ).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'participants.pending.revoke' })).toBeVisible();
    });

    it('renders personal fields only for the participant who currently shares them', () => {
        render(
            <ParticipantsManager
                competition={competition}
                participantPage={page(participants)}
                invitationPage={page([])}
            />,
        );

        expect(screen.getByText('participants.list.profileNotShared')).toBeVisible();
        expect(screen.getByText('participants.list.profileShared')).toBeVisible();
        expect(screen.queryByText('must-not-render@example.org')).not.toBeInTheDocument();
        expect(screen.queryByText('Hidden School')).not.toBeInTheDocument();
        expect(screen.getByText('shared@example.org')).toBeVisible();
        expect(screen.getByText('Shared Participant')).toBeVisible();
        expect(screen.getByText('Visible School')).toBeVisible();
    });

    it('removes shared personal fields from the DOM as soon as removal succeeds', async () => {
        render(
            <ParticipantsManager
                competition={competition}
                participantPage={page(participants)}
                invitationPage={page([])}
            />,
        );

        const sharedParticipantRow = screen.getByText('Sharing User').closest('li');
        expect(sharedParticipantRow).not.toBeNull();
        fireEvent.click(
            within(sharedParticipantRow as HTMLElement).getByRole('button', {
                name: 'participants.list.removeLabel',
            }),
        );
        fireEvent.click(await screen.findByRole('button', { name: 'participants.remove.confirm' }));

        await waitFor(() =>
            expect(mocks.removeHostedCompetitionParticipant).toHaveBeenCalledWith(42, 2),
        );
        expect(screen.queryByText('shared@example.org')).not.toBeInTheDocument();
        expect(screen.queryByText('Shared Participant')).not.toBeInTheDocument();
        expect(screen.queryByText('Visible School')).not.toBeInTheDocument();
        expect(screen.getAllByText('participants.list.profileNotShared')).toHaveLength(2);
    });
});
