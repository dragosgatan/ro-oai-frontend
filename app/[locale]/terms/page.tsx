import { Metadata } from 'next';
import { getServerLocale } from '@/lib/i18n-server';
import { generateTermsMetadata } from '@/lib/seo/page-metadata';
import TermsContent from '@/components/legal/terms-content';

/**
 * Generate metadata for terms of service page with full SEO support
 */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getServerLocale();
    const metadata = await generateTermsMetadata(locale);

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

export default async function TermsPage() {
    const locale = await getServerLocale();

    return <TermsContent locale={locale} />;
}
