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
import { getEvaluatorContract } from '@/lib/problem-proposals';
import type { Locale } from '@/lib/types';

type Props = { params: Promise<{ locale: string; requestId: string }> };
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NewHostingRequestProblemPage({ params }: Props) {
    const { locale: localeParam, requestId } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    if (!/^\d+$/.test(requestId) || Number(requestId) <= 0) notFound();
    const session = await getSession();
    if (!session) {
        redirect(
            `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/my-competitions/requests/${requestId}/problems/new`)}`,
        );
    }
    try {
        const [request, evaluatorContract, categories] = await Promise.all([
            getMyCompetitionHostingRequest(Number(requestId)),
            getEvaluatorContract(),
            getCategories().catch(() => []),
        ]);
        if (!request.permissions.canAddProblems) notFound();
        return (
            <ProblemProposalEditor
                initialProposal={null}
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
        if (error instanceof CompetitionHostingApiError && [403, 404].includes(error.status)) {
            notFound();
        }
        throw error;
    }
}
