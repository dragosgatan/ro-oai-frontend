import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ProblemProposalEditor } from '@/components/problem-proposals/problem-proposal-editor';
import { getCategories } from '@/lib/api';
import { getSession } from '@/lib/auth';
import {
    ProblemProposalApiError,
    getEvaluatorContract,
    getMyProblemProposal,
} from '@/lib/problem-proposals';
import type { Locale } from '@/lib/types';

type Props = {
    params: Promise<{ locale: string; id: string }>;
};

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function EditProblemProposalPage({ params }: Props) {
    const { locale: localeParam, id } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    if (!/^\d+$/.test(id) || Number(id) <= 0) notFound();

    const session = await getSession();
    if (!session) {
        const callbackUrl = encodeURIComponent(`/${locale}/problem-proposals/${id}`);
        redirect(`/${locale}/login?callbackUrl=${callbackUrl}`);
    }

    try {
        const [proposal, evaluatorContract, categories] = await Promise.all([
            getMyProblemProposal(Number(id)),
            getEvaluatorContract(),
            getCategories().catch(() => []),
        ]);
        return (
            <ProblemProposalEditor
                initialProposal={proposal}
                evaluatorContract={evaluatorContract}
                recoveryScope={session.id ?? 'authenticated'}
                defaultAuthorName={session.user?.name}
                categories={categories}
            />
        );
    } catch (error) {
        if (
            error instanceof ProblemProposalApiError &&
            (error.status === 403 || error.status === 404)
        ) {
            notFound();
        }
        throw error;
    }
}
