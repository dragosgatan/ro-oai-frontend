import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ArticleInvitationBootstrap } from '@/components/articles/article-invitation-bootstrap';
import type { Locale } from '@/lib/types';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
};

export default async function ArticleInvitationAcceptPage({ params }: Props) {
    const { locale: localeParam } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    return <ArticleInvitationBootstrap locale={locale} />;
}
