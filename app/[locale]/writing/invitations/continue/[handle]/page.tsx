import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';

import { ArticleInvitation } from '@/components/articles/article-invitation';
import {
    ArticleApiError,
    getArticleInvitation,
    type ArticleInvitationPreview,
} from '@/lib/articles';
import {
    ARTICLE_INVITATION_PREVIEW_COOKIE,
    getArticleInvitationHandle,
    isArticleInvitationHandle,
} from '@/lib/articles/invitation-session';
import { getSession } from '@/lib/auth';
import type { Locale } from '@/lib/types';

type Props = { params: Promise<{ locale: string; handle: string }> };

export const metadata: Metadata = {
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
};

function unavailableInvitation(status: ArticleInvitationPreview['status'] = 'UNAVAILABLE') {
    return {
        valid: false,
        status,
        maskedEmail: null,
        problem: null,
        article: null,
        expiresAt: null,
        message: null,
    } satisfies ArticleInvitationPreview;
}

export default async function ArticleInvitationContinuationPage({ params }: Props) {
    const { locale: localeParam, handle } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);

    const token = (await cookies()).get(ARTICLE_INVITATION_PREVIEW_COOKIE)?.value;
    const tokenMatchesHandle =
        isArticleInvitationHandle(handle) &&
        Boolean(token) &&
        (await getArticleInvitationHandle(token as string)) === handle;
    const [invitation, session] = await Promise.all([
        tokenMatchesHandle
            ? getArticleInvitation(token as string).catch((error): ArticleInvitationPreview => {
                  if (error instanceof ArticleApiError && error.status === 410) {
                      return unavailableInvitation('EXPIRED');
                  }
                  if (error instanceof ArticleApiError && error.status === 404) {
                      return unavailableInvitation('INVALID');
                  }
                  return unavailableInvitation();
              })
            : Promise.resolve(unavailableInvitation('INVALID')),
        getSession(),
    ]);

    return (
        <ArticleInvitation
            invitationHandle={handle}
            invitation={invitation}
            locale={locale}
            authenticated={Boolean(session)}
        />
    );
}
