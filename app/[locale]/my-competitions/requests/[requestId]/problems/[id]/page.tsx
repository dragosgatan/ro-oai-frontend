import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ProblemProposalEditor } from '@/components/problem-proposals/problem-proposal-editor';
import { getCategories } from '@/lib/api';
import { getSession } from '@/lib/auth';
import {
    CompetitionHostingApiError,
    getMyCompetitionHostingRequest,
} from '@/lib/competition-hosting';
import {
    ProblemProposalApiError,
    getEvaluatorContract,
    getMyProblemProposal,
} from '@/lib/problem-proposals';
import type { Locale } from '@/lib/types';

type Props = { params: Promise<{ locale: string; requestId: string; id: string }> };
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function HostingRequestProblemPage({ params }: Props) {
    const { locale: localeParam, requestId, id } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    if (!/^\d+$/.test(requestId) || !/^\d+$/.test(id) || Number(id) <= 0) notFound();
    const session = await getSession();
    if (!session) {
        redirect(
            `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/my-competitions/requests/${requestId}/problems/${id}`)}`,
        );
    }
    try {
        const [request, proposal, evaluatorContract, categories] = await Promise.all([
            getMyCompetitionHostingRequest(Number(requestId)),
            getMyProblemProposal(Number(id)),
            getEvaluatorContract(),
            getCategories().catch(() => []),
        ]);
        const matchesRequest =
            proposal.target.scope === 'HOST_REQUEST' && proposal.target.id === request.id;
        const matchesApprovedCompetition =
            request.approvedCompetitionId &&
            proposal.target.scope === 'MANAGED_COMPETITION' &&
            proposal.target.id === request.approvedCompetitionId;
        if (!matchesRequest && !matchesApprovedCompetition) notFound();
        return (
            <ProblemProposalEditor
                initialProposal={proposal}
                evaluatorContract={evaluatorContract}
                recoveryScope={session.id ?? 'authenticated'}
                defaultAuthorName={session.user?.name}
                categories={categories}
                context={{
                    target: { scope: 'HOST_REQUEST', hostingRequestId: request.id },
                    targetName: request.name,
                    backHref: `/my-competitions/requests/${request.id}`,
                    detailBaseHref: `/my-competitions/requests/${request.id}/problems`,
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
