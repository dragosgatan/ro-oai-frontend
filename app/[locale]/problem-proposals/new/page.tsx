import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ProblemProposalEditor } from '@/components/problem-proposals/problem-proposal-editor';
import { getCategories } from '@/lib/api';
import { getSession } from '@/lib/auth';
import { getEvaluatorContract } from '@/lib/problem-proposals';
import type { Locale } from '@/lib/types';

type Props = {
    params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function NewProblemProposalPage({ params }: Props) {
    const { locale: localeParam } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    const [session, evaluatorContract, categories] = await Promise.all([
        getSession(),
        getEvaluatorContract(),
        getCategories().catch(() => []),
    ]);
    if (!session) {
        const callbackUrl = encodeURIComponent(`/${locale}/problem-proposals/new`);
        redirect(`/${locale}/login?callbackUrl=${callbackUrl}`);
    }

    return (
        <ProblemProposalEditor
            initialProposal={null}
            evaluatorContract={evaluatorContract}
            recoveryScope={session.id ?? 'authenticated'}
            defaultAuthorName={session.user?.name}
            categories={categories}
        />
    );
}
