import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { HostingRequestEditor } from '@/components/competition-hosting/hosting-request-editor';
import { getSession } from '@/lib/auth';
import {
    CompetitionHostingApiError,
    getHostingRequestProblemProposals,
    getMyCompetitionHostingRequest,
} from '@/lib/competition-hosting';
import type { Locale } from '@/lib/types';

type Props = {
    params: Promise<{ locale: string; requestId: string }>;
    searchParams: Promise<{ problemPage?: string | string[] }>;
};

export const metadata: Metadata = { robots: { index: false, follow: false } };

function parsePage(value: string | string[] | undefined): number {
    const candidate = Array.isArray(value) ? value[0] : value;
    const parsed = /^\d+$/.test(candidate ?? '') ? Number(candidate) : Number.NaN;
    return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, 100_000) : 1;
}

export default async function CompetitionHostingRequestPage({ params, searchParams }: Props) {
    const [{ locale: localeParam, requestId }, query] = await Promise.all([params, searchParams]);
    const locale = localeParam as Locale;
    const problemPage = parsePage(query.problemPage);
    setRequestLocale(locale);
    if (!/^\d+$/.test(requestId) || Number(requestId) <= 0) notFound();
    if (!(await getSession())) {
        redirect(
            `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/my-competitions/requests/${requestId}`)}`,
        );
    }
    try {
        const [request, problems] = await Promise.all([
            getMyCompetitionHostingRequest(Number(requestId)),
            getHostingRequestProblemProposals(Number(requestId)),
        ]);
        const totalProblemPages = Math.max(1, Math.ceil(problems.length / 20));
        if (problemPage > totalProblemPages) {
            redirect(
                `/${locale}/my-competitions/requests/${requestId}?problemPage=${totalProblemPages}`,
            );
        }
        return (
            <HostingRequestEditor
                initialRequest={request}
                problems={problems}
                problemPage={problemPage}
            />
        );
    } catch (error) {
        if (error instanceof CompetitionHostingApiError && [403, 404].includes(error.status)) {
            notFound();
        }
        throw error;
    }
}
