'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Check, ChevronsUpDown, RefreshCw, SearchX } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    searchArticleProblemOptions,
    type ArticleProblemOption,
    type ArticleProblemReference,
} from '@/lib/articles';
import { formatProblemAuthorList } from '@/lib/problem-authors';
import { cn } from '@/lib/utils';

type SelectedProblem = (ArticleProblemReference & { isCurrentUserAuthor?: boolean }) | null;

export function ProblemSearchCombobox({
    selected,
    onSelect,
    disabled = false,
}: {
    selected: SelectedProblem;
    onSelect: (problem: ArticleProblemOption | null) => void;
    disabled?: boolean;
}) {
    const t = useTranslations('writing.fields.problem');
    const locale = useLocale();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ArticleProblemOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        if (!open) return;
        let active = true;
        const timer = window.setTimeout(async () => {
            setLoading(true);
            setFailed(false);
            try {
                const options = await searchArticleProblemOptions(query, 20);
                if (active) setResults(options);
            } catch {
                if (active) {
                    setResults([]);
                    setFailed(true);
                }
            } finally {
                if (active) setLoading(false);
            }
        }, 250);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [open, query, retry]);

    const [authored, other] = useMemo(() => {
        const unique = Array.from(
            new Map(results.map((problem) => [problem.id, problem])).values(),
        );
        return [
            unique.filter((problem) => problem.isCurrentUserAuthor),
            unique.filter((problem) => !problem.isCurrentUserAuthor),
        ];
    }, [results]);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery('');
    };

    const selectProblem = (problem: ArticleProblemOption) => {
        onSelect(problem);
        handleOpenChange(false);
    };

    const renderProblem = (problem: ArticleProblemOption) => {
        const authorNames = formatProblemAuthorList(problem.authors, locale);
        const selectedProblem = selected?.id === problem.id;

        return (
            <CommandItem
                key={problem.id}
                value={`${problem.id} ${problem.title} ${authorNames}`}
                onSelect={() => selectProblem(problem)}
                className={cn(
                    'min-h-16 cursor-pointer rounded-none border border-transparent px-3 py-2.5 data-[selected=true]:border-[var(--platform-violet)] data-[selected=true]:bg-[var(--platform-paper-strong)]',
                    problem.isCurrentUserAuthor &&
                        'bg-[color-mix(in_oklch,var(--platform-citron)_11%,var(--platform-paper))]',
                )}
            >
                <span className="w-12 shrink-0 self-start pt-0.5 font-mono text-xs font-bold text-[var(--platform-violet)]">
                    #{problem.id}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-semibold leading-5 text-[var(--platform-ink)]">
                        {problem.title}
                    </span>
                    {authorNames ? (
                        <span className="mt-1 block line-clamp-1 text-xs text-[var(--platform-ink-muted)]">
                            {t('authorNames', { names: authorNames })}
                        </span>
                    ) : null}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5 self-center">
                    {problem.isCurrentUserAuthor ? (
                        <span className="inline-flex items-center gap-1 bg-[var(--platform-citron)] px-1.5 py-0.5 text-[0.68rem] font-bold text-[var(--platform-on-accent)]">
                            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            {t('authoredByYou')}
                        </span>
                    ) : null}
                    <Check
                        className={cn(
                            'h-4 w-4 text-[var(--platform-violet)]',
                            selectedProblem ? 'opacity-100' : 'opacity-0',
                        )}
                        aria-hidden="true"
                    />
                </span>
            </CommandItem>
        );
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button
                    id="article-problem"
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    aria-haspopup="listbox"
                    disabled={disabled}
                    className="mt-2 flex min-h-12 w-full items-center justify-between gap-3 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 text-start text-sm text-[var(--platform-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <span className="min-w-0 flex-1">
                        <span
                            className={cn(
                                'block truncate font-semibold',
                                !selected && 'font-normal text-[var(--platform-ink-muted)]',
                            )}
                        >
                            {selected ? `#${selected.id} · ${selected.title}` : t('placeholder')}
                        </span>
                        {selected?.isCurrentUserAuthor ? (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--platform-violet-strong)] dark:text-[var(--platform-violet)]">
                                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                                {t('authoredByYou')}
                            </span>
                        ) : null}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-55" aria-hidden="true" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                collisionPadding={12}
                className="platform-overlay-surface z-[70] max-h-[min(28rem,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-none border-2 border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-0 text-[var(--platform-ink)] shadow-[6px_6px_0_var(--platform-line)] sm:w-[min(30rem,var(--radix-popover-content-available-width))]"
            >
                <Command shouldFilter={false} className="rounded-none bg-[var(--platform-paper)]">
                    <CommandInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder={t('searchPlaceholder')}
                        aria-label={t('searchLabel')}
                        className="rounded-none"
                    />
                    <CommandList className="max-h-[min(22rem,calc(var(--radix-popover-content-available-height)-3.25rem))] overscroll-contain">
                        {loading ? <ProblemResultsSkeleton label={t('searching')} /> : null}
                        {!loading && failed ? (
                            <div
                                className="flex min-h-40 flex-col items-center justify-center gap-3 px-5 py-6 text-center"
                                role="status"
                            >
                                <SearchX
                                    className="h-5 w-5 text-[var(--platform-ink-muted)]"
                                    aria-hidden="true"
                                />
                                <p className="max-w-72 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                    {t('searchError')}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setRetry((current) => current + 1)}
                                    className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-3 text-sm font-bold text-[var(--platform-ink)] hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                                >
                                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                                    {t('retry')}
                                </button>
                            </div>
                        ) : null}
                        {!loading && !failed ? (
                            <>
                                <CommandEmpty>{t('noResults')}</CommandEmpty>
                                {authored.length > 0 ? (
                                    <CommandGroup heading={t('yourProblems')}>
                                        {authored.map(renderProblem)}
                                    </CommandGroup>
                                ) : null}
                                {other.length > 0 ? (
                                    <CommandGroup heading={t('otherProblems')}>
                                        {other.map(renderProblem)}
                                    </CommandGroup>
                                ) : null}
                            </>
                        ) : null}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function ProblemResultsSkeleton({ label }: { label: string }) {
    return (
        <div className="space-y-1 p-2" role="status" aria-label={label}>
            <span className="sr-only">{label}</span>
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="grid min-h-16 grid-cols-[3rem_minmax(0,1fr)] items-center gap-2 px-2 motion-safe:animate-pulse"
                    aria-hidden="true"
                >
                    <span className="h-3 w-9 bg-[var(--platform-line)]" />
                    <span>
                        <span className="block h-4 w-4/5 bg-[var(--platform-line)]" />
                        <span className="mt-2 block h-3 w-2/5 bg-[var(--platform-paper-strong)]" />
                    </span>
                </div>
            ))}
        </div>
    );
}
