import { MyQuestionsPage } from '@/components/my-questions-page';
import { generateMyQuestionsMetadata } from '@/lib/seo/page-metadata';
import { getServerLocale } from '@/lib/i18n-server';
import { getTranslations } from 'next-intl/server';
import { MessageSquare } from 'lucide-react';
import { PlatformPageHeader, PlatformPageShell } from '@/components/platform-page-shell';

export async function generateMetadata() {
    const locale = await getServerLocale();
    return generateMyQuestionsMetadata(locale);
}

export default async function MyQuestions() {
    const t = await getTranslations('myQuestions');

    return (
        <PlatformPageShell>
            <PlatformPageHeader
                eyebrow={t('tabs.all')}
                icon={MessageSquare}
                title={t('title')}
                description={t('description')}
            />
            <MyQuestionsPage />
        </PlatformPageShell>
    );
}
