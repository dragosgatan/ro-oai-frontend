import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ArticleEditor } from '@/components/articles/article-editor';
import { ArticleApiError, getMyArticle } from '@/lib/articles';
import { getSession } from '@/lib/auth';
import type { Locale } from '@/lib/types';

type Props = { params: Promise<{ locale: string; id: string }> };

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function EditArticlePage({ params }: Props) {
    const { locale: localeParam, id } = await params;
    const locale = localeParam as Locale;
    setRequestLocale(locale);
    const session = await getSession();
    if (!session) {
        const callbackUrl = encodeURIComponent(`/${locale}/writing/${id}`);
        redirect(`/${locale}/login?callbackUrl=${callbackUrl}`);
    }
    if (!/^\d+$/.test(id) || Number(id) <= 0) notFound();

    try {
        const article = await getMyArticle(Number(id));
        return (
            <ArticleEditor
                initialArticle={article}
                recoveryScope={session.id ?? 'authenticated'}
                currentUserId={session.id}
            />
        );
    } catch (error) {
        if (error instanceof ArticleApiError && (error.status === 403 || error.status === 404)) {
            notFound();
        }
        throw error;
    }
}
