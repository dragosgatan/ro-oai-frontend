import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('auth');
    return {
        title: `${t('accessDisabled')} - MLCompete`,
        robots: { index: false, follow: false },
    };
}

export default function DisabledLayout({ children }: { children: React.ReactNode }) {
    return children;
}
