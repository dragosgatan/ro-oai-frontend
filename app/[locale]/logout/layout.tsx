import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('navigation');
    return {
        title: `${t('logout')} - MLCompete`,
        robots: { index: false, follow: false },
    };
}

export default function LogoutLayout({ children }: { children: React.ReactNode }) {
    return children;
}
