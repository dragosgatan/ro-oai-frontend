import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('settings');
    return {
        title: `${t('profileInfo')} - MLCompete`,
        robots: { index: false, follow: false },
    };
}

export default function ProfileConfirmationLayout({ children }: { children: React.ReactNode }) {
    return children;
}
