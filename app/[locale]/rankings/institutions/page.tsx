import { Building2 } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { InstitutionRankingsView } from '@/components/institution-rankings-view';
import { PlatformPageHeader, PlatformPageShell } from '@/components/platform-page-shell';
import { generateInstitutionRankingsMetadata } from '@/lib/seo/page-metadata';
import { getServerLocale } from '@/lib/i18n-server';

export async function generateMetadata() {
    const locale = await getServerLocale();
    return generateInstitutionRankingsMetadata(locale);
}

export default async function InstitutionRankingsPage({
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
                icon={Building2}
                title={t('rankings.institutionTitle')}
                description={t('rankings.institutionDescription')}
            />
            <InstitutionRankingsView />
        </PlatformPageShell>
    );
}
