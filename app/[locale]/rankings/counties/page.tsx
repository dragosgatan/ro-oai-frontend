import { MapPinned } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { CountyRankingsView } from '@/components/county-rankings-view';
import { PlatformPageHeader, PlatformPageShell } from '@/components/platform-page-shell';
import { generateCountyRankingsMetadata } from '@/lib/seo/page-metadata';
import { getServerLocale } from '@/lib/i18n-server';

export async function generateMetadata() {
    const locale = await getServerLocale();
    return generateCountyRankingsMetadata(locale);
}

export default async function CountyRankingsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations();

    return (
        <PlatformPageShell>
            <PlatformPageHeader
                eyebrow={t('hero.platformTitle')}
                icon={MapPinned}
                title={t('rankings.countyTitle')}
                description={t('rankings.countyDescription')}
            />
            <CountyRankingsView />
        </PlatformPageShell>
    );
}
