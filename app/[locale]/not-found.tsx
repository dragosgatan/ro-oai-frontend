import type { Metadata } from 'next';
import { FileQuestion, Home, Trophy } from 'lucide-react';

import { Link } from '@/i18n/routing';
import { getMessages, getServerLocale } from '@/lib/i18n-server';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { MetadataConfig } from '@/lib/seo/types';
import { getCanonicalUrl } from '@/lib/seo/canonical';
import { NotFoundTracker } from '@/components/not-found-tracker';
import { PlatformPageShell } from '@/components/platform-page-shell';

const primaryLinkClassName =
    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-[var(--platform-violet)] bg-[var(--platform-violet)] px-4 py-2.5 text-sm font-bold text-white shadow-[4px_4px_0_var(--platform-citron)] transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-[var(--platform-violet-strong)] focus-visible:outline-none active:translate-y-px sm:w-auto dark:text-[var(--platform-on-accent)]';

const secondaryLinkClassName =
    'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 py-2.5 text-sm font-bold text-[var(--platform-ink)] transition-colors duration-150 hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none sm:w-auto';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getServerLocale();
    const messages = await getMessages(locale);

    const title = messages.errors?.notFound?.title || 'Page Not Found';
    const description =
        messages.errors?.notFound?.description ||
        "The page you're looking for doesn't exist or has been moved.";

    const config: MetadataConfig = {
        title,
        description,
        locale,
        noindex: true,
        nofollow: true,
        canonicalUrl: getCanonicalUrl('/404', locale),
    };

    return generateSEOMetadata(config);
}

export default async function NotFound() {
    const locale = await getServerLocale();
    const messages = await getMessages(locale);

    const errorMessages = messages.errors?.notFound || {
        title: 'Page Not Found',
        description: "The page you're looking for doesn't exist or has been moved.",
        suggestion: 'You might have mistyped the address, or the page may have been removed.',
        goHome: 'Go to Homepage',
        viewProblems: 'View Problems',
        viewLeaderboard: 'View Leaderboard',
    };

    return (
        <PlatformPageShell contentClassName="flex min-h-[calc(100dvh-9rem)] items-center">
            <NotFoundTracker />
            <section className="grid w-full items-center gap-10 py-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
                <div className="min-w-0">
                    <p className="platform-page-eyebrow">
                        <FileQuestion className="h-4 w-4" aria-hidden="true" />
                        <span>404</span>
                    </p>
                    <h1 className="platform-page-title">{errorMessages.title}</h1>
                    <div className="mt-6 max-w-2xl space-y-2 text-pretty text-[var(--platform-ink-muted)]">
                        <p className="text-base leading-7 sm:text-lg">
                            {errorMessages.description}
                        </p>
                        <p className="text-sm leading-6">{errorMessages.suggestion}</p>
                    </div>

                    <nav
                        className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
                        aria-label={errorMessages.title}
                    >
                        <Link href="/" locale={locale} className={primaryLinkClassName}>
                            <Home className="h-4 w-4" aria-hidden="true" />
                            {errorMessages.goHome}
                        </Link>
                        <Link href="/problems" locale={locale} className={secondaryLinkClassName}>
                            <FileQuestion className="h-4 w-4" aria-hidden="true" />
                            {errorMessages.viewProblems}
                        </Link>
                        <Link
                            href="/leaderboard"
                            locale={locale}
                            className={secondaryLinkClassName}
                        >
                            <Trophy className="h-4 w-4" aria-hidden="true" />
                            {errorMessages.viewLeaderboard}
                        </Link>
                    </nav>
                </div>

                <div
                    className="relative hidden min-h-72 border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] lg:grid lg:place-items-center"
                    aria-hidden="true"
                >
                    <span className="absolute start-0 top-0 h-3 w-24 bg-[var(--platform-citron)]" />
                    <span className="font-mono text-7xl font-bold tracking-[-0.08em] text-[var(--platform-violet)]">
                        404
                    </span>
                    <span className="absolute bottom-0 end-0 h-12 w-12 bg-[var(--platform-coral)]" />
                </div>
            </section>
        </PlatformPageShell>
    );
}
