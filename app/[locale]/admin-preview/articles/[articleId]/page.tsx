import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ArticleDetailView } from '@/components/articles/article-detail-view';
import {
    ArticleApiError,
    getAdminArticlePreview,
    type AdminArticlePreviewRevision,
} from '@/lib/articles';
import { getSession } from '@/lib/auth';
import type { Locale } from '@/lib/types';

type Props = {
    params: Promise<{ locale: string; articleId: string }>;
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

function parseRevision(value: string | string[] | undefined): AdminArticlePreviewRevision {
    const revision = Array.isArray(value) ? value[0] : value;
    return revision === 'published' ? 'published' : 'current';
}

export default async function AdminArticlePreviewPage({ params, searchParams }: Props) {
    const [{ locale: localeParam, articleId }, query] = await Promise.all([params, searchParams]);
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    if (!/^\d+$/.test(articleId) || Number(articleId) <= 0) notFound();

    const session = await getSession();
    if (!session?.accessToken) {
        const callbackUrl = encodeURIComponent(
            `/${locale}/admin-preview/articles/${articleId}?revision=${parseRevision(query.revision)}`,
        );
        redirect(`/${locale}/login?callbackUrl=${callbackUrl}`);
    }

    try {
        const article = await getAdminArticlePreview(
            Number(articleId),
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
