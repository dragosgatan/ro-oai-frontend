import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ParticipantsManager } from '@/components/competition-hosting/participants-manager';
import {
    getHostedCompetitionInvitations,
    getHostedCompetitionParticipants,
    getMyHostedCompetition,
} from '@/lib/competition-hosting';

type Props = {
    params: Promise<{ locale: string; competitionId: string }>;
    searchParams: Promise<{
        participantPage?: string | string[];
        invitationPage?: string | string[];
    }>;
};
export const metadata: Metadata = { robots: { index: false, follow: false } };

function parsePage(value: string | string[] | undefined): number {
    const candidate = Array.isArray(value) ? value[0] : value;
    const parsed = /^\d+$/.test(candidate ?? '') ? Number(candidate) : Number.NaN;
    return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 100_000) : 1;
}

function participantsHref(
    locale: string,
    competitionId: number,
    participantPage: number,
    invitationPage: number,
): string {
    const query = new URLSearchParams();
    if (participantPage > 1) query.set('participantPage', String(participantPage));
    if (invitationPage > 1) query.set('invitationPage', String(invitationPage));
    const suffix = query.toString();
    return `/${locale}/my-competitions/${competitionId}/participants${suffix ? `?${suffix}` : ''}`;
}

export default async function HostedCompetitionParticipantsPage({ params, searchParams }: Props) {
    const [{ locale, competitionId }, query] = await Promise.all([params, searchParams]);
    const id = Number(competitionId);
    const participantPage = parsePage(query.participantPage);
    const invitationPage = parsePage(query.invitationPage);
    const [competition, participants, invitations] = await Promise.all([
        getMyHostedCompetition(id),
        getHostedCompetitionParticipants(id, { page: participantPage - 1, size: 20 }),
        getHostedCompetitionInvitations(id, { page: invitationPage - 1, size: 20 }),
    ]);
    const lastParticipantPage = Math.max(1, participants.page.totalPages);
    const lastInvitationPage = Math.max(1, invitations.page.totalPages);
    if (participantPage > lastParticipantPage || invitationPage > lastInvitationPage) {
        redirect(
            participantsHref(
                locale,
                id,
                Math.min(participantPage, lastParticipantPage),
                Math.min(invitationPage, lastInvitationPage),
            ),
        );
    }
    return (
        <ParticipantsManager
            competition={competition}
            participantPage={participants}
            invitationPage={invitations}
        />
    );
}
