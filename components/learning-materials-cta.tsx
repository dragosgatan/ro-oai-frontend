import { ArrowRight, BookOpen, Route } from 'lucide-react';

import { Link } from '@/i18n/routing';
import type { Locale } from '@/lib/types';

type LearningMaterialsCTAProps = {
    locale: Locale;
    title: string;
    description: string;
    eyebrow: string;
    ctaLabel: string;
    steps: { title: string; description: string }[];
};

export function LearningMaterialsCTA({
    locale,
    title,
    description,
    eyebrow,
    ctaLabel,
    steps,
}: LearningMaterialsCTAProps) {
    const indexFormatter = new Intl.NumberFormat(locale, {
        minimumIntegerDigits: 2,
        useGrouping: false,
    });

    return (
        <section
            id="learning"
            className="home-accent-panel bg-[var(--home-citron)] text-[var(--home-ink)]"
        >
            <div className="mx-auto grid max-w-[90rem] gap-12 px-5 py-[clamp(4rem,7vw,6.5rem)] sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center xl:px-12">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-3 text-sm font-semibold">
                        <Route className="h-5 w-5" aria-hidden="true" />
                        <span>{eyebrow}</span>
                    </div>
                    <h2 className="home-display mt-7 text-balance text-[clamp(2.4rem,5.5vw,5rem)] leading-[0.98] tracking-[-0.055em]">
                        {title}
                    </h2>
                    <p className="mt-6 max-w-[62ch] text-pretty text-base leading-7 text-[color:var(--home-ink-muted-strong)] sm:text-lg sm:leading-8">
                        {description}
                    </p>
                    <Link
                        href="/roadmap"
                        className="group mt-9 inline-flex min-h-12 items-center gap-3 bg-[var(--home-ink)] px-6 py-3 font-semibold text-[var(--home-citron)] outline-none transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[var(--home-coral)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-citron)] active:translate-y-0"
                    >
                        {ctaLabel}
                        <ArrowRight
                            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                            aria-hidden="true"
                        />
                    </Link>
                </div>

                <div className="relative hidden border-y-2 border-[var(--home-ink)] py-7 sm:block lg:ms-auto lg:w-full lg:max-w-xl">
                    <div className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-7">
                        {steps.slice(0, 3).map((step, index) => (
                            <div key={`${index}-${step.title}`} className="contents">
                                <span className="home-display text-lg tabular-nums">
                                    {indexFormatter.format(index + 1)}
                                </span>
                                <div
                                    className={
                                        index < 2 ? 'border-b border-[var(--home-ink)] pb-7' : ''
                                    }
                                >
                                    <p className="font-semibold">{step.title}</p>
                                    <p className="mt-1 text-sm leading-6 text-[color:var(--home-ink-muted-strong)]">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <BookOpen
                        className="absolute -end-2 -top-7 h-12 w-12 rotate-6 bg-[var(--home-coral)] p-2"
                        aria-hidden="true"
                    />
                </div>
            </div>
        </section>
    );
}
