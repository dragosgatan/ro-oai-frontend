import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ArticleDetailView } from '@/components/articles/article-detail-view';
import {
    ArticleApiError,
    getAdminArticleReviewPreview,
    type AdminArticleReviewPreviewRevision,
} from '@/lib/articles';
import { getSession } from '@/lib/auth';
import type { Locale } from '@/lib/types';

type Props = {
    params: Promise<{ locale: string; requestId: string }>;
    searchParams: Promise<{ revision?: string | string[] }>;
};

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
        nocache: true,
        noarchive: true,
        nosnippet: true,
        noimageindex: true,
    },
};

function parseRevision(value: string | string[] | undefined): AdminArticleReviewPreviewRevision {
    const revision = Array.isArray(value) ? value[0] : value;
    return revision === 'current' ? 'current' : 'proposed';
}

export default async function AdminArticleReviewPreviewPage({ params, searchParams }: Props) {
    const [{ locale: localeParam, requestId }, query] = await Promise.all([params, searchParams]);
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    if (!/^\d+$/.test(requestId) || Number(requestId) <= 0) notFound();

    const session = await getSession();
    if (!session?.accessToken) {
        const callbackUrl = encodeURIComponent(
            `/${locale}/admin-preview/article-reviews/${requestId}?revision=${parseRevision(query.revision)}`,
        );
        redirect(`/${locale}/login?callbackUrl=${callbackUrl}`);
    }

    try {
        const article = await getAdminArticleReviewPreview(
            Number(requestId),
            parseRevision(query.revision),
        );
        return <ArticleDetailView article={article} locale={locale} />;
    } catch (error) {
        if (
            error instanceof ArticleApiError &&
            (error.status === 401 || error.status === 403 || error.status === 404)
        ) {
            notFound();
        }
        throw error;
    }
}
