import type { Metadata } from 'next';
import { generateSettingsMetadata } from '@/lib/seo/page-metadata';
import { SettingsViewNoSsr } from '@/components/settings-view-no-ssr';
import { Locale } from '@/lib/types';
import { isValidLocale } from '@/lib/i18n-config';
import { DEFAULT_LOCALE } from '@/lib/types';

/**
 * Generate metadata for settings page
 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const validLocale = isValidLocale(locale) ? (locale as Locale) : DEFAULT_LOCALE;
    const metadata = await generateSettingsMetadata(validLocale);

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

export default async function SettingsPage() {
    return <SettingsViewNoSsr />;
}
