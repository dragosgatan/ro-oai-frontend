import { ArrowRight, Trophy, UserRound } from 'lucide-react';

import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { Locale, ProblemPreviewImage as ProblemPreviewImageDescriptor } from '@/lib/types';
import { ProblemPreviewImage } from '@/components/problem-preview-image';

export type HomeProblemItem = {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    difficultyLabel: string;
    author: string;
    previewImage?: ProblemPreviewImageDescriptor | null;
    score: string | null;
};

type HomeProblemsSectionProps = {
    locale: Locale;
    problems: HomeProblemItem[];
    title: string;
    subtitle: string;
    viewAllLabel: string;
    authorLabel: string;
    scoreLabel: string;
    problemLabel: string;
    unavailable: boolean;
    errorMessage: string;
};

const difficultyStyles: Record<string, string> = {
    easy: 'bg-emerald-300 text-emerald-950',
    medium: 'bg-[var(--home-citron)] text-[var(--home-on-accent)]',
    hard: 'bg-rose-300 text-rose-950',
};

export function HomeProblemsSection({
    locale,
    problems,
    title,
    subtitle,
    viewAllLabel,
    authorLabel,
    scoreLabel,
    problemLabel,
    unavailable,
    errorMessage,
}: HomeProblemsSectionProps) {
    const [featured, ...remaining] = problems;
    const indexFormatter = new Intl.NumberFormat(locale, {
        minimumIntegerDigits: 2,
        useGrouping: false,
    });

    return (
        <section
            id="problems"
            className="scroll-mt-24 bg-[var(--home-paper-strong)] py-[clamp(5rem,9vw,9rem)]"
        >
            <div className="mx-auto max-w-[90rem] px-5 sm:px-8 xl:px-12">
                <div className="grid gap-7 border-b border-[color:var(--home-line)] pb-9 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div>
                        <p className="text-sm font-semibold text-[var(--home-violet)]">
                            {problemLabel}
                        </p>
                        <h2 className="home-display mt-5 text-balance text-[clamp(2.6rem,5vw,5.4rem)] leading-[0.95] tracking-[-0.06em] text-[var(--home-ink)]">
                            {title}
                        </h2>
                        <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-[color:var(--home-ink-muted)] sm:text-lg">
                            {subtitle}
                        </p>
                    </div>
                    <Link
                        href="/problems"
                        className="group inline-flex min-h-11 items-center gap-2 justify-self-start font-semibold text-[var(--home-ink)] underline decoration-[var(--home-coral)] decoration-2 underline-offset-4 outline-none transition-colors hover:text-[var(--home-violet)] focus-visible:ring-2 focus-visible:ring-[var(--home-violet)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-paper-strong)] lg:justify-self-end"
                    >
                        {viewAllLabel}
                        <ArrowRight
                            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                            aria-hidden="true"
                        />
                    </Link>
                </div>

                {featured ? (
                    <div className="mt-10 grid gap-7 lg:grid-cols-[1.18fr_0.82fr]">
                        <Link
                            href={`/problems/${featured.id}`}
                            className="group flex min-h-[28rem] flex-col bg-[var(--home-violet)] p-6 text-[var(--home-paper)] outline-none transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-[var(--home-coral)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--home-paper-strong)] sm:min-h-[32rem] sm:p-8"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <span className="home-display text-sm tabular-nums">
                                    {indexFormatter.format(1)} /{' '}
                                    {indexFormatter.format(problems.length)}
                                </span>
                                <span
                                    className={cn(
                                        'inline-flex min-h-7 items-center rounded-md px-2.5 text-xs font-bold',
                                        difficultyStyles[featured.difficulty] ??
                                            'bg-[var(--home-paper)] text-[var(--home-ink)]',
                                    )}
                                >
                                    {featured.difficultyLabel}
                                </span>
                            </div>
                            <div className="my-auto py-8">
                                <ProblemPreviewImage
                                    problemId={featured.id}
                                    title={featured.title}
                                    difficulty={featured.difficulty}
                                    previewImage={featured.previewImage}
                                    className="border border-[color:var(--home-paper-line)]"
                                />
                                <h3 className="mt-7 text-pretty text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl">
                                    {featured.title}
                                </h3>
                                <p className="mt-4 line-clamp-3 max-w-2xl text-sm leading-6 text-[color:var(--home-paper-muted)] sm:text-base">
                                    {featured.description}
                                </p>
                            </div>
                            <div className="grid gap-4 border-t border-[color:var(--home-paper-line)] pt-5 text-sm sm:grid-cols-2">
                                <span className="flex items-center gap-2">
                                    <UserRound className="h-4 w-4" aria-hidden="true" />
                                    <span className="text-[color:var(--home-paper-muted)]">
                                        {authorLabel}:
                                    </span>{' '}
                                    <strong className="font-semibold">{featured.author}</strong>
                                </span>
                                {featured.score !== null && (
                                    <span className="flex items-center gap-2 sm:justify-self-end">
                                        <Trophy
                                            className="h-4 w-4 text-[var(--home-citron)]"
                                            aria-hidden="true"
                                        />
                                        <span className="text-[color:var(--home-paper-muted)]">
                                            {scoreLabel}:
                                        </span>{' '}
                                        <strong className="font-semibold tabular-nums">
                                            {featured.score}
                                        </strong>
                                    </span>
                                )}
                            </div>
                        </Link>

                        <ol className="border-y border-[color:var(--home-line)]">
                            {remaining.map((problem, index) => (
                                <li
                                    key={problem.id}
                                    className="border-b border-[color:var(--home-line)] last:border-b-0"
                                >
                                    <Link
                                        href={`/problems/${problem.id}`}
                                        className="group grid min-h-44 grid-cols-[auto_1fr_auto] gap-4 py-6 outline-none transition-[background-color,padding] duration-200 ease-out hover:bg-[var(--home-paper)] focus-visible:bg-[var(--home-paper)] focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[var(--home-coral)] sm:px-5 sm:hover:px-7"
                                    >
                                        <span className="home-display text-xs tabular-nums text-[var(--home-violet)]">
                                            {indexFormatter.format(index + 2)}
                                        </span>
                                        <div className="min-w-0">
                                            <span
                                                className={cn(
                                                    'inline-flex min-h-7 items-center rounded-md px-2.5 text-xs font-bold',
                                                    difficultyStyles[problem.difficulty] ??
                                                        'bg-[var(--home-line)] text-[var(--home-ink)]',
                                                )}
                                            >
                                                {problem.difficultyLabel}
                                            </span>
                                            <h3 className="mt-3 text-pretty text-lg font-semibold leading-tight tracking-[-0.025em] text-[var(--home-ink)] transition-colors group-hover:text-[var(--home-violet)] sm:text-xl">
                                                {problem.title}
                                            </h3>
                                            <p className="mt-2 truncate text-sm text-[color:var(--home-ink-muted)]">
                                                {authorLabel}: {problem.author}
                                            </p>
                                        </div>
                                        <ArrowRight
                                            className="h-5 w-5 text-[var(--home-violet)] transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </div>
                ) : (
                    <div className="border-b border-[color:var(--home-line)] py-14 text-center">
                        <p className="text-sm text-[color:var(--home-ink-muted)]">
                            {unavailable ? errorMessage : subtitle}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
