import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ProblemProposalEditor } from '@/components/problem-proposals/problem-proposal-editor';
import { getCategories } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { CompetitionHostingApiError, getMyHostedCompetition } from '@/lib/competition-hosting';
import {
    ProblemProposalApiError,
    getEvaluatorContract,
    getMyProblemProposal,
} from '@/lib/problem-proposals';
import type { Locale } from '@/lib/types';

type Props = { params: Promise<{ locale: string; competitionId: string; id: string }> };
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function HostedCompetitionProblemPage({ params }: Props) {
    const { locale: localeParam, competitionId, id } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    if (!/^\d+$/.test(competitionId) || !/^\d+$/.test(id)) notFound();
    const session = await getSession();
    if (!session) {
        redirect(
            `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/my-competitions/${competitionId}/problems/${id}`)}`,
        );
    }
    try {
        const [competition, proposal, evaluatorContract, categories] = await Promise.all([
            getMyHostedCompetition(Number(competitionId)),
            getMyProblemProposal(Number(id)),
            getEvaluatorContract(),
            getCategories().catch(() => []),
        ]);
        if (
            proposal.target.scope !== 'MANAGED_COMPETITION' ||
            proposal.target.id !== competition.id
        ) {
            notFound();
        }
        return (
            <ProblemProposalEditor
                initialProposal={proposal}
                evaluatorContract={evaluatorContract}
                recoveryScope={session.id ?? 'authenticated'}
                defaultAuthorName={session.user?.name}
                categories={categories}
                context={{
                    target: { scope: 'MANAGED_COMPETITION', competitionId: competition.id },
                    targetName: competition.name,
                    backHref: `/my-competitions/${competition.id}/problems`,
                    detailBaseHref: `/my-competitions/${competition.id}/problems`,
                }}
            />
        );
    } catch (error) {
        if (
            (error instanceof CompetitionHostingApiError ||
                error instanceof ProblemProposalApiError) &&
            [403, 404].includes(error.status)
        ) {
            notFound();
        }
        throw error;
    }
}
