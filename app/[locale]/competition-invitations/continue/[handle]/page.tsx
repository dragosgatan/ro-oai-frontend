import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';

import { CompetitionInvitation } from '@/components/competition-hosting/competition-invitation';
import {
    COMPETITION_INVITATION_PREVIEW_COOKIE,
    CompetitionHostingApiError,
    getCompetitionInvitation,
    getCompetitionInvitationHandle,
    isCompetitionInvitationHandle,
    type CompetitionInvitationPreview,
} from '@/lib/competition-hosting';
import { getSession } from '@/lib/auth';
import type { Locale } from '@/lib/types';

type Props = { params: Promise<{ locale: string; handle: string }> };

export const metadata: Metadata = {
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
};

function unavailableInvitation(status = 'UNAVAILABLE'): CompetitionInvitationPreview {
    return {
        valid: false,
        thirdPartyHosted: false,
        status,
        maskedEmail: null,
        competition: null,
        organizerName: null,
        expiresAt: null,
        message: null,
        consentNoticeVersion: null,
    };
}

export default async function CompetitionInvitationContinuationPage({ params }: Props) {
    const { locale: localeParam, handle } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);

    const token = (await cookies()).get(COMPETITION_INVITATION_PREVIEW_COOKIE)?.value;
    const tokenMatchesHandle =
        isCompetitionInvitationHandle(handle) &&
        Boolean(token) &&
        (await getCompetitionInvitationHandle(token as string)) === handle;
    const [invitation, session] = await Promise.all([
        tokenMatchesHandle
            ? getCompetitionInvitation(token as string).catch(
                  (error): CompetitionInvitationPreview => {
                      if (error instanceof CompetitionHostingApiError && error.status === 410) {
                          return unavailableInvitation('EXPIRED');
                      }
                      if (error instanceof CompetitionHostingApiError && error.status === 404) {
                          return unavailableInvitation('INVALID');
                      }
                      return unavailableInvitation();
                  },
              )
            : Promise.resolve(unavailableInvitation('INVALID')),
        getSession(),
    ]);

    return (
        <CompetitionInvitation
            invitationHandle={handle}
            invitation={invitation}
            locale={locale}
            authenticated={Boolean(session)}
        />
    );
}
