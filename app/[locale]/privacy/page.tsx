import { Metadata } from 'next';
import { getServerLocale } from '@/lib/i18n-server';
import { generatePrivacyMetadata } from '@/lib/seo/page-metadata';
import PrivacyContent from '@/components/legal/privacy-content';

/**
 * Generate metadata for privacy policy page with full SEO support
 */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getServerLocale();
    const metadata = await generatePrivacyMetadata(locale);

    return {
        title: { absolute: metadata.title },
        description: metadata.description,
        keywords: metadata.keywords,
        openGraph: metadata.openGraph,
        twitter: metadata.twitter,
        alternates: metadata.alternates,
        robots: metadata.robots,
    };
}

export default async function PrivacyPage() {
    const locale = await getServerLocale();

    return <PrivacyContent locale={locale} />;
}
