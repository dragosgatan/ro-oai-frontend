import type { LucideIcon } from 'lucide-react';

import { PlatformPageHeader, PlatformPageShell } from '@/components/platform-page-shell';

type LegalDocumentShellProps = {
    title: string;
    description: string;
    eyebrow: string;
    icon: LucideIcon;
    contentLanguage: string;
    showEnglishNotice: boolean;
    children: React.ReactNode;
};

export function LegalDocumentShell({
    title,
    description,
    eyebrow,
    icon,
    contentLanguage,
    showEnglishNotice,
    children,
}: LegalDocumentShellProps) {
    return (
        <PlatformPageShell contentClassName="max-w-5xl">
            <PlatformPageHeader
                title={title}
                description={description}
                eyebrow={eyebrow}
                icon={icon}
            />

            {showEnglishNotice ? (
                <aside
                    className="mb-6 border-2 border-[oklch(0.62_0.06_287)] bg-[oklch(0.952_0.026_292)] px-4 py-3 text-sm leading-6 text-[var(--platform-ink-muted)] dark:border-[oklch(0.5_0.07_287)] dark:bg-[oklch(0.215_0.046_286)]"
                    lang="en"
                >
                    This legal document is currently available in English. For clarification or an
                    accessible copy, contact{' '}
                    <a
                        href="mailto:contact@olimpiada-ai.ro"
                        className="font-bold text-[var(--platform-violet)] underline decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--platform-violet)]"
                    >
                        contact@olimpiada-ai.ro
                    </a>
                    .
                </aside>
            ) : null}

            <article
                className="border-2 border-[oklch(0.62_0.06_287)] bg-[oklch(0.978_0.014_292)] shadow-[7px_7px_0_oklch(0.43_0.235_291/0.2)] dark:border-[oklch(0.5_0.07_287)] dark:bg-[oklch(0.18_0.038_286)] [&>div]:mx-0 [&>div]:max-w-none [&>div]:px-5 [&>div]:py-6 sm:[&>div]:px-9 sm:[&>div]:py-8 [&_.prose]:mx-auto [&_.prose]:max-w-[72ch] [&_.rounded-lg]:rounded-none [&_.bg-muted]:border [&_.bg-muted]:border-[oklch(0.79_0.04_289)] [&_.bg-muted]:bg-[oklch(0.952_0.026_292)] dark:[&_.bg-muted]:border-[oklch(0.34_0.055_287)] dark:[&_.bg-muted]:bg-[oklch(0.215_0.046_286)] [&_a]:font-semibold [&_a]:text-[var(--platform-violet)] [&_a]:underline [&_a]:decoration-2 [&_a]:underline-offset-4 [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-[var(--platform-violet)] [&_h2]:mb-4 [&_h2]:font-[var(--font-platform-display)] [&_h2]:text-xl [&_h2]:font-black [&_h2]:tracking-[-0.03em] sm:[&_h2]:text-2xl [&_h3]:mb-3 [&_h3]:font-bold [&_h3]:tracking-[-0.02em] [&_li]:leading-7 [&_p]:leading-7 [&_section]:mb-0 [&_section]:scroll-mt-28 [&_section]:border-t [&_section]:border-[oklch(0.79_0.04_289)] [&_section]:py-7 first:[&_section]:border-t-0 dark:[&_section]:border-[oklch(0.34_0.055_287)] [&_ul]:pe-0 [&_ul]:ps-6"
                lang={contentLanguage}
            >
                {children}
            </article>
        </PlatformPageShell>
    );
}
