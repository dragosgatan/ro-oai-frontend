import type { Metadata } from 'next';
import { getServerLocale } from '@/lib/i18n-server';
import { generateAchievementsMetadata } from '@/lib/seo/page-metadata';

/**
 * Generate metadata for achievements page with full SEO support
 */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getServerLocale();
    const metadata = await generateAchievementsMetadata(locale);

    return {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        openGraph: metadata.openGraph,
        twitter: metadata.twitter,
        alternates: metadata.alternates,
        robots: metadata.robots,
    };
}

export default function AchievementsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
