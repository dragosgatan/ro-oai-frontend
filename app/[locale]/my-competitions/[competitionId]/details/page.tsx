import type { Metadata } from 'next';

import { HostedCompetitionDetailsEditor } from '@/components/competition-hosting/hosted-competition-details-editor';
import { getMyHostedCompetition } from '@/lib/competition-hosting';

type Props = { params: Promise<{ competitionId: string }> };
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function HostedCompetitionDetailsPage({ params }: Props) {
    const { competitionId } = await params;
    const competition = await getMyHostedCompetition(Number(competitionId));
    return <HostedCompetitionDetailsEditor initialCompetition={competition} />;
}
