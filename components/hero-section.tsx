import { ArrowRight, CornerDownRight, Database } from 'lucide-react';

import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { Locale, ProblemPreviewImage as ProblemPreviewImageDescriptor } from '@/lib/types';
import { ProblemPreviewImage } from '@/components/problem-preview-image';

export type HeroSpotlight = {
    problemId: number;
    href: string;
    overline: string;
    title: string;
    description: string;
    status: string;
    metaLabel: string;
    metaValue: string;
    tone: 'easy' | 'medium' | 'hard' | 'neutral';
    previewImage?: ProblemPreviewImageDescriptor | null;
};

type HeroSectionProps = {
    ariaLabel: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string | null;
    secondaryHref: string | null;
    locale: Locale;
    totalProblems: number;
    totalCompetitions: number;
    problemsLabel: string;
    competitionsLabel: string;
    spotlight: HeroSpotlight | null;
};

const toneStyles: Record<HeroSpotlight['tone'], string> = {
    easy: 'bg-emerald-300 text-emerald-950',
    medium: 'bg-[var(--home-citron)] text-[var(--home-on-accent)]',
    hard: 'bg-rose-300 text-rose-950',
    neutral: 'bg-[var(--home-paper)] text-[var(--home-ink)]',
};

function SignalPlot() {
    return (
        <svg viewBox="0 0 480 190" className="h-auto w-full" fill="none" aria-hidden="true">
            <path
                d="M1 32.5H479M1 95H479M1 157.5H479M80 1V189M160 1V189M240 1V189M320 1V189M400 1V189"
                stroke="currentColor"
                strokeOpacity="0.13"
            />
            <path
                d="M12 146C51 143 68 120 100 123C139 126 144 79 187 88C224 96 239 119 274 95C303 75 321 25 359 37C399 50 415 92 468 48"
                stroke="var(--home-citron)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="home-signal-line"
            />
            {[
                [12, 146],
                [100, 123],
                [187, 88],
                [274, 95],
                [359, 37],
                [468, 48],
            ].map(([cx, cy], index) => (
                <circle
                    key={`${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={index === 4 ? 8 : 5}
                    fill={index === 4 ? 'var(--home-coral)' : 'var(--home-paper)'}
                    stroke="var(--home-violet)"
                    strokeWidth="3"
                />
            ))}
        </svg>
    );
}

function SpotlightBoard({ spotlight }: { spotlight: HeroSpotlight | null }) {
    if (!spotlight) {
        return (
            <div className="relative isolate min-h-[22rem] overflow-hidden bg-[var(--home-violet)] p-6 text-[var(--home-paper)] shadow-[12px_12px_0_var(--home-citron)] sm:min-h-[25rem] sm:p-8 sm:shadow-[18px_18px_0_var(--home-citron)] lg:min-h-[28rem]">
                <div className="home-board-grid absolute inset-0 opacity-50" aria-hidden="true" />
                <div className="relative flex h-full min-h-[18rem] flex-col justify-between sm:min-h-[21rem] lg:min-h-[24rem]">
                    <div className="home-letterspaced flex items-center justify-between text-xs font-semibold tracking-[0.18em]">
                        <span>ML / 001</span>
                        <span className="h-2.5 w-2.5 bg-[var(--home-citron)]" />
                    </div>
                    <SignalPlot />
                    <div className="flex items-end justify-between gap-4">
                        <p className="home-display max-w-sm text-2xl leading-tight sm:text-3xl">
                            MLCompete
                        </p>
                        <CornerDownRight className="h-6 w-6" aria-hidden="true" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Link
            href={spotlight.href}
            className="group relative isolate block min-h-[22rem] overflow-hidden bg-[var(--home-violet)] p-6 text-[var(--home-paper)] shadow-[12px_12px_0_var(--home-citron)] outline-none transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-[var(--home-coral)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-paper)] sm:min-h-[25rem] sm:p-8 sm:shadow-[18px_18px_0_var(--home-citron)] lg:min-h-[28rem]"
        >
            <div className="home-board-grid absolute inset-0 opacity-50" aria-hidden="true" />
            <div className="relative flex h-full min-h-[18rem] flex-col sm:min-h-[21rem] lg:min-h-[24rem]">
                <div className="flex items-start justify-between gap-4">
                    <div className="home-letterspaced flex items-center gap-2 text-xs font-semibold tracking-[0.15em]">
                        <Database className="h-4 w-4" aria-hidden="true" />
                        <span>{spotlight.overline}</span>
                    </div>
                    <span
                        className={cn(
                            'inline-flex min-h-7 items-center rounded-md px-2.5 text-xs font-bold',
                            toneStyles[spotlight.tone],
                        )}
                    >
                        {spotlight.status}
                    </span>
                </div>

                <div className="my-auto py-8">
                    <ProblemPreviewImage
                        problemId={spotlight.problemId}
                        title={spotlight.title}
                        difficulty={spotlight.tone}
                        previewImage={spotlight.previewImage}
                        priority
                        className="border border-[color:var(--home-paper-line)]"
                    />
                    <h2 className="mt-6 max-w-lg text-pretty text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">
                        {spotlight.title}
                    </h2>
                    <p className="mt-3 line-clamp-2 max-w-lg text-sm leading-6 text-[color:var(--home-paper-muted)] sm:text-base">
                        {spotlight.description}
                    </p>
                </div>

                <div className="flex items-end justify-between gap-4 border-t border-[color:var(--home-paper-line)] pt-4">
                    <div>
                        <p className="text-xs text-[color:var(--home-paper-muted)]">
                            {spotlight.metaLabel}
                        </p>
                        <p className="mt-1 text-sm font-semibold">{spotlight.metaValue}</p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center bg-[var(--home-citron)] text-[var(--home-on-accent)] transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1">
                        <ArrowRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

export function HeroSection({
    ariaLabel,
    eyebrow,
    title,
    subtitle,
    primaryLabel,
    primaryHref,
    secondaryLabel,
    secondaryHref,
    locale,
    totalProblems,
    totalCompetitions,
    problemsLabel,
    competitionsLabel,
    spotlight,
}: HeroSectionProps) {
    const numberFormatter = new Intl.NumberFormat(locale);

    return (
        <section
            className="home-grid-paper relative isolate overflow-hidden bg-[var(--home-paper)]"
            aria-label={ariaLabel}
        >
            <div
                className="home-hero-decoration absolute -start-20 top-20 hidden h-40 w-40 rotate-12 bg-[var(--home-coral)] opacity-90 sm:block sm:h-56 sm:w-56"
                aria-hidden="true"
            />
            <div
                className="absolute -end-16 bottom-12 hidden h-32 w-32 -rotate-12 bg-[var(--home-citron)] sm:block sm:h-44 sm:w-44"
                aria-hidden="true"
            />

            <div className="relative mx-auto grid max-w-[90rem] items-center gap-12 px-5 py-[clamp(4rem,8vw,7rem)] sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 xl:px-12">
                <div className="min-w-0 max-w-3xl">
                    <p className="home-hero-eyebrow mb-6 flex items-center gap-3 text-sm font-semibold text-[var(--home-violet)]">
                        <span className="h-2.5 w-2.5 bg-[var(--home-coral)]" aria-hidden="true" />
                        {eyebrow}
                    </p>
                    <h1 className="home-display text-balance text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.92] tracking-[-0.065em] text-[var(--home-ink)]">
                        {title}
                    </h1>
                    <p className="mt-8 max-w-[62ch] text-pretty text-lg leading-8 text-[color:var(--home-ink-muted)] sm:text-xl">
                        {subtitle}
                    </p>

                    <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                        <Link
                            href={primaryHref}
                            className="group inline-flex min-h-12 items-center gap-3 bg-[var(--home-violet)] px-6 py-3 text-base font-semibold text-[var(--home-paper)] outline-none transition-[transform,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--home-violet-strong)] focus-visible:ring-4 focus-visible:ring-[var(--home-coral)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-paper)] active:translate-y-0"
                        >
                            {primaryLabel}
                            <ArrowRight
                                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                                aria-hidden="true"
                            />
                        </Link>
                        {secondaryLabel && secondaryHref && (
                            <Link
                                href={secondaryHref}
                                className="group inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--home-ink)] underline decoration-[var(--home-coral)] decoration-2 underline-offset-4 outline-none transition-colors hover:text-[var(--home-violet)] focus-visible:ring-2 focus-visible:ring-[var(--home-violet)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-paper)]"
                            >
                                {secondaryLabel}
                                <CornerDownRight
                                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 rtl:-rotate-90"
                                    aria-hidden="true"
                                />
                            </Link>
                        )}
                    </div>

                    {(totalProblems > 0 || totalCompetitions > 0) && (
                        <dl className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-[color:var(--home-line)] pt-5 text-sm">
                            {totalProblems > 0 && (
                                <div className="flex items-baseline gap-2">
                                    <dt className="text-[color:var(--home-ink-muted)]">
                                        {problemsLabel}
                                    </dt>
                                    <dd className="home-display text-lg tabular-nums text-[var(--home-ink)]">
                                        {numberFormatter.format(totalProblems)}
                                    </dd>
                                </div>
                            )}
                            {totalCompetitions > 0 && (
                                <div className="flex items-baseline gap-2">
                                    <dt className="text-[color:var(--home-ink-muted)]">
                                        {competitionsLabel}
                                    </dt>
                                    <dd className="home-display text-lg tabular-nums text-[var(--home-ink)]">
                                        {numberFormatter.format(totalCompetitions)}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    )}
                </div>

                <div className="mx-auto w-full max-w-2xl pe-4 pb-4 sm:pe-5 sm:pb-5">
                    <SpotlightBoard spotlight={spotlight} />
                </div>
            </div>
        </section>
    );
}
