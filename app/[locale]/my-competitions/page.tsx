import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { MyCompetitionsHub } from '@/components/competition-hosting/my-competitions-hub';
import { getSession } from '@/lib/auth';
import {
    getMyCompetitionHostingRequests,
    getMyHostedCompetitions,
} from '@/lib/competition-hosting';
import type { Locale } from '@/lib/types';

type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{
        competitionPage?: string | string[];
        requestPage?: string | string[];
    }>;
};

function parsePage(value: string | string[] | undefined): number {
    const candidate = Array.isArray(value) ? value[0] : value;
    const parsed = /^\d+$/.test(candidate ?? '') ? Number(candidate) : Number.NaN;
    return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 100_000) : 1;
}

function hubHref(locale: Locale, competitionPage: number, requestPage: number): string {
    const query = new URLSearchParams();
    if (competitionPage > 1) query.set('competitionPage', String(competitionPage));
    if (requestPage > 1) query.set('requestPage', String(requestPage));
    const suffix = query.toString();
    return `/${locale}/my-competitions${suffix ? `?${suffix}` : ''}`;
}

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function MyCompetitionsPage({ params, searchParams }: Props) {
    const [{ locale: localeParam }, query] = await Promise.all([params, searchParams]);
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    const session = await getSession();
    if (!session) {
        redirect(
            `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/my-competitions`)}`,
        );
    }
    const competitionPage = parsePage(query.competitionPage);
    const requestPage = parsePage(query.requestPage);
    const [requests, competitions] = await Promise.all([
        getMyCompetitionHostingRequests({ page: requestPage - 1, size: 20 }),
        getMyHostedCompetitions({ page: competitionPage - 1, size: 20 }),
    ]);
    const lastCompetitionPage = Math.max(1, competitions.page.totalPages);
    const lastRequestPage = Math.max(1, requests.page.totalPages);
    if (competitionPage > lastCompetitionPage || requestPage > lastRequestPage) {
        redirect(
            hubHref(
                locale,
                Math.min(competitionPage, lastCompetitionPage),
                Math.min(requestPage, lastRequestPage),
            ),
        );
    }
    return <MyCompetitionsHub requests={requests} competitions={competitions} locale={locale} />;
}
