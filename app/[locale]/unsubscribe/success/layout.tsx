import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('auth.unsubscribeSuccess');
    return {
        title: `${t('title')} - MLCompete`,
        robots: { index: false, follow: false },
    };
}

export default function UnsubscribeSuccessLayout({ children }: { children: React.ReactNode }) {
    return children;
}
