'use client';

import Image from 'next/image';
import { ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ConsentPreferencesTrigger } from '@/components/consent-preferences-trigger';
import { Link } from '@/i18n/routing';
import { platformSans } from '@/lib/platform-fonts';
import { cn } from '@/lib/utils';

const footerLinkClassName =
    'group inline-flex min-h-11 items-center gap-2 rounded-sm border-b border-[oklch(0.79_0.04_289)] px-1 text-sm font-semibold text-[oklch(0.34_0.047_282)] transition-colors duration-150 hover:border-[oklch(0.43_0.235_291)] hover:text-[oklch(0.36_0.22_291)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.72_0.18_32)] dark:border-[oklch(0.34_0.055_287)] dark:text-[oklch(0.82_0.026_290)] dark:hover:border-[oklch(0.72_0.19_292)] dark:hover:text-[oklch(0.94_0.016_292)]';

export function Footer() {
    const t = useTranslations('footer');
    const tCommon = useTranslations('common');
    const tConsent = useTranslations('consent');
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        { href: '/terms', label: t('terms'), index: '01' },
        { href: '/privacy', label: t('privacy'), index: '02' },
        {
            href: 'mailto:contact@olimpiada-ai.ro',
            label: t('contact'),
            index: '03',
            external: true,
        },
    ];

    return (
        <footer
            className={cn(
                'site-footer mt-auto border-t-2 border-[oklch(0.43_0.235_291)] bg-[oklch(0.978_0.014_292)] text-[oklch(0.22_0.055_282)] dark:border-[oklch(0.72_0.19_292)] dark:bg-[oklch(0.18_0.038_286)] dark:text-[oklch(0.94_0.016_292)]',
                platformSans.variable,
                platformSans.className,
            )}
        >
            <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6">
                <div className="grid gap-8 py-8 lg:grid-cols-[minmax(15rem,0.75fr)_minmax(0,1.25fr)] lg:items-end lg:gap-16 lg:py-10">
                    <div className="min-w-0">
                        <Link
                            href="/"
                            aria-label={tCommon('appName')}
                            className="inline-flex min-h-11 items-center rounded-sm focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[oklch(0.72_0.18_32)]"
                        >
                            <span className="relative block w-[9.75rem]">
                                <Image
                                    src="/logo.png"
                                    alt=""
                                    width={174}
                                    height={40}
                                    className="h-auto w-full dark:hidden"
                                />
                                <Image
                                    src="/logo-dark.png"
                                    alt=""
                                    width={174}
                                    height={40}
                                    className="hidden h-auto w-full dark:block"
                                />
                            </span>
                        </Link>
                    </div>

                    <nav
                        aria-label={tCommon('appName')}
                        className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4 lg:justify-self-end"
                    >
                        {footerLinks.map((link) => {
                            const content = (
                                <>
                                    <span
                                        className="font-mono text-[0.6875rem] font-bold tabular-nums text-[oklch(0.43_0.235_291)] dark:text-[oklch(0.72_0.19_292)]"
                                        aria-hidden="true"
                                    >
                                        {link.index}
                                    </span>
                                    <span>{link.label}</span>
                                    {link.external ? (
                                        <ArrowUpRight
                                            className="ms-auto h-4 w-4 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100"
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                </>
                            );

                            return link.external ? (
                                <a key={link.href} href={link.href} className={footerLinkClassName}>
                                    {content}
                                </a>
                            ) : (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={footerLinkClassName}
                                >
                                    {content}
                                </Link>
                            );
                        })}
                        <ConsentPreferencesTrigger className={footerLinkClassName}>
                            <span
                                className="font-mono text-[0.6875rem] font-bold tabular-nums text-[oklch(0.43_0.235_291)] dark:text-[oklch(0.72_0.19_292)]"
                                aria-hidden="true"
                            >
                                04
                            </span>
                            <span>{tConsent('customize')}</span>
                            <SlidersHorizontal className="ms-auto h-4 w-4" aria-hidden="true" />
                        </ConsentPreferencesTrigger>
                    </nav>
                </div>

                <div className="flex min-h-16 items-center border-t border-[oklch(0.79_0.04_289)] py-3 dark:border-[oklch(0.34_0.055_287)]">
                    <p className="text-xs leading-5 text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                        {t('copyright', { year: currentYear })}
                    </p>
                </div>
            </div>
        </footer>
    );
}
