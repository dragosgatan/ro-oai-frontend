import type { Metadata } from 'next';
import { SignIn } from '@/components/sign-in';
import { getServerLocale } from '@/lib/i18n-server';
import { generateLoginMetadata } from '@/lib/seo/page-metadata';

/**
 * Generate metadata for login page
 */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getServerLocale();
    const metadata = await generateLoginMetadata(locale);

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

export default async function LoginPage() {
    return <SignIn />;
}
