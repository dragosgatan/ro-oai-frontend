import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { EvaluatorGuide } from '@/components/problem-proposals/evaluator-guide';
import { getSession } from '@/lib/auth';
import { getEvaluatorContract } from '@/lib/problem-proposals';
import type { Locale } from '@/lib/types';

type Props = {
    params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
    title: 'Custom evaluator guide | MLCompete',
    description:
        'The supported evaluator contract, templates, file roles, and validation rules for MLCompete problem proposals.',
};

export default async function ProblemProposalEvaluatorGuidePage({ params }: Props) {
    const { locale: localeParam } = await params;
    setRequestLocale(localeParam as Locale);
    const [session, contract] = await Promise.all([getSession(), getEvaluatorContract()]);
    if (!session) {
        const callbackUrl = encodeURIComponent(`/${localeParam}/problem-proposals/evaluator-guide`);
        redirect(`/${localeParam}/login?callbackUrl=${callbackUrl}`);
    }
    return <EvaluatorGuide contract={contract} />;
}
