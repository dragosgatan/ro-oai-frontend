import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { CompetitionInvitationBootstrap } from '@/components/competition-hosting/competition-invitation-bootstrap';
import type { Locale } from '@/lib/types';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
};

export default async function CompetitionInvitationAcceptPage({ params }: Props) {
    const { locale: localeParam } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    return <CompetitionInvitationBootstrap locale={locale} />;
}
