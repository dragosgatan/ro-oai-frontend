import type { Metadata } from 'next';

import { CountyDetailView } from '@/components/county-detail-view';
import { PlatformPageShell } from '@/components/platform-page-shell';
import { getCountyById } from '@/lib/api';
import { getMessages, getServerLocale } from '@/lib/i18n-server';

type CountyDetailPageProps = {
    params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata({ params }: CountyDetailPageProps): Promise<Metadata> {
    const [{ id, locale }, messages] = await Promise.all([
        params,
        getServerLocale().then(getMessages),
    ]);
    const countyId = Number(id);
    const fallbackTitle = messages.counties?.title || 'Counties';

    if (!Number.isInteger(countyId) || countyId <= 0) {
        return {
            title: `${fallbackTitle} - MLCompete`,
            description: messages.counties?.description,
            alternates: { canonical: `/${locale}/counties/${id}` },
        };
    }

    try {
        const county = await getCountyById(countyId);
        return {
            title: `${county.name} - MLCompete`,
            description: `${messages.counties?.detailDescription || fallbackTitle}: ${county.name} (${county.code}).`,
            alternates: { canonical: `/${locale}/counties/${countyId}` },
        };
    } catch {
        return {
            title: `${fallbackTitle} - MLCompete`,
            description: messages.counties?.description,
            alternates: { canonical: `/${locale}/counties/${countyId}` },
        };
    }
}

export default async function CountyDetailPage({ params }: CountyDetailPageProps) {
    const { id } = await params;
    const countyId = Number(id);

    return (
        <PlatformPageShell>
            <CountyDetailView
                countyId={Number.isInteger(countyId) && countyId > 0 ? countyId : null}
            />
        </PlatformPageShell>
    );
}
