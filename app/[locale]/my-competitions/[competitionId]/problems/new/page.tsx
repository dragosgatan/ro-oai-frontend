import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ProblemProposalEditor } from '@/components/problem-proposals/problem-proposal-editor';
import { getCategories } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { CompetitionHostingApiError, getMyHostedCompetition } from '@/lib/competition-hosting';
import { getEvaluatorContract } from '@/lib/problem-proposals';
import type { Locale } from '@/lib/types';

type Props = { params: Promise<{ locale: string; competitionId: string }> };
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NewHostedCompetitionProblemPage({ params }: Props) {
    const { locale: localeParam, competitionId } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    if (!/^\d+$/.test(competitionId) || Number(competitionId) <= 0) notFound();
    const session = await getSession();
    if (!session) {
        redirect(
            `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/my-competitions/${competitionId}/problems/new`)}`,
        );
    }
    try {
        const [competition, evaluatorContract, categories] = await Promise.all([
            getMyHostedCompetition(Number(competitionId)),
            getEvaluatorContract(),
            getCategories().catch(() => []),
        ]);
        if (!competition.permissions.canSubmitProblems) notFound();
        return (
            <ProblemProposalEditor
                initialProposal={null}
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
        if (error instanceof CompetitionHostingApiError && [403, 404].includes(error.status)) {
            notFound();
        }
        throw error;
    }
}
