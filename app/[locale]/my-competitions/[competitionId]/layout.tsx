import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { HostedCompetitionShell } from '@/components/competition-hosting/hosted-competition-shell';
import { getSession } from '@/lib/auth';
import { CompetitionHostingApiError, getMyHostedCompetition } from '@/lib/competition-hosting';
import type { Locale } from '@/lib/types';

export default async function HostedCompetitionLayout({
    params,
    children,
}: {
    params: Promise<{ locale: string; competitionId: string }>;
    children: React.ReactNode;
}) {
    const { locale: localeParam, competitionId } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    if (!/^\d+$/.test(competitionId) || Number(competitionId) <= 0) notFound();
    if (!(await getSession())) {
        redirect(
            `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/my-competitions/${competitionId}`)}`,
        );
    }
    try {
        const competition = await getMyHostedCompetition(Number(competitionId));
        return (
            <HostedCompetitionShell competition={competition}>{children}</HostedCompetitionShell>
        );
    } catch (error) {
        if (error instanceof CompetitionHostingApiError && [403, 404].includes(error.status)) {
            notFound();
        }
        throw error;
    }
}
