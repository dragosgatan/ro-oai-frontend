import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { HostingRequestEditor } from '@/components/competition-hosting/hosting-request-editor';
import { getSession } from '@/lib/auth';
import type { Locale } from '@/lib/types';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NewCompetitionHostingRequestPage({ params }: Props) {
    const { locale: localeParam } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    if (!(await getSession())) {
        redirect(
            `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/my-competitions/new`)}`,
        );
    }
    return <HostingRequestEditor initialRequest={null} problems={[]} problemPage={1} />;
}
