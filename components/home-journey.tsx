import { ArrowUpRight } from 'lucide-react';

import { Link } from '@/i18n/routing';
import type { Locale } from '@/lib/types';

type JourneyStep = {
    href: string;
    title: string;
    description: string;
};

export function HomeJourney({
    ariaLabel,
    locale,
    steps,
}: {
    ariaLabel: string;
    locale: Locale;
    steps: JourneyStep[];
}) {
    const indexFormatter = new Intl.NumberFormat(locale, {
        minimumIntegerDigits: 2,
        useGrouping: false,
    });

    return (
        <nav
            aria-label={ariaLabel}
            className="border-y border-[color:var(--home-line)] bg-[var(--home-paper-strong)]"
        >
            <ol className="mx-auto grid max-w-[90rem] lg:grid-cols-[0.95fr_1.25fr_1fr]">
                {steps.map((step, index) => (
                    <li
                        key={step.href}
                        className="border-b border-[color:var(--home-line)] last:border-b-0 lg:border-b-0 lg:border-e"
                    >
                        <Link
                            href={step.href}
                            className="group grid min-h-36 grid-cols-[auto_1fr_auto] gap-5 px-5 py-7 outline-none transition-colors duration-200 hover:bg-[var(--home-paper)] focus-visible:bg-[var(--home-paper)] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--home-coral)] sm:px-8 lg:min-h-48 lg:grid-cols-[auto_1fr] lg:content-between xl:px-10"
                        >
                            <span className="home-display text-sm tabular-nums text-[var(--home-violet)]">
                                {indexFormatter.format(index + 1)}
                            </span>
                            <ArrowUpRight
                                className="col-start-3 h-5 w-5 text-[var(--home-violet)] transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 rtl:-rotate-90 lg:col-start-2 lg:justify-self-end"
                                aria-hidden="true"
                            />
                            <div className="col-start-2 row-start-1 self-center lg:col-span-2 lg:row-start-2">
                                <h2 className="text-xl font-semibold tracking-[-0.025em] text-[var(--home-ink)]">
                                    {step.title}
                                </h2>
                                <p className="mt-2 max-w-[48ch] text-sm leading-6 text-[color:var(--home-ink-muted)]">
                                    {step.description}
                                </p>
                            </div>
                        </Link>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
