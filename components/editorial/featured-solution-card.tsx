'use client';

import { useState } from 'react';
import { Link } from '@/i18n/routing';
import { UserAvatar } from '@/components/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDownIcon, CodeIcon, DownloadIcon, TrophyIcon } from 'lucide-react';
import type { FeaturedSolutionResponse, SourceFileResponse } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { formatRankBadge } from './editorial-author-utils';
import { getProfileUrl } from '@/lib/profile-utils';

type FeaturedSolutionCardProps = {
    solution: FeaturedSolutionResponse;
    defaultExpanded?: boolean;
};

/**
 * FeaturedSolutionCard displays a featured solution from a top performer
 * with their rank badge, description, and expandable source code blocks.
 *
 * Requirements: 7.2, 7.3
 */
export function FeaturedSolutionCard({
    solution,
    defaultExpanded = false,
}: FeaturedSolutionCardProps) {
    const t = useTranslations('editorial');
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const hasSourceFiles = solution.sourceFiles && solution.sourceFiles.length > 0;
    const sourceRegionId = `featured-solution-${solution.id}-files`;

    return (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded} asChild>
            <article className="bg-[var(--platform-paper)] transition-colors duration-200 hover:bg-[color-mix(in_oklch,var(--platform-paper-strong)_72%,var(--platform-paper))]">
                <header className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link
                            href={getProfileUrl(solution.userId, solution.username)}
                            aria-label={solution.username}
                            className="shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] focus-visible:ring-offset-2"
                        >
                            <UserAvatar
                                avatar={solution.avatar}
                                userId={solution.userId}
                                username={solution.username}
                                className="h-11 w-11 rounded-none border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)]"
                                imageClassName="rounded-none"
                                fallbackClassName="rounded-none text-sm font-bold"
                                loading="lazy"
                            />
                        </Link>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href={getProfileUrl(solution.userId, solution.username)}
                                    className="inline-flex min-h-11 min-w-0 items-center truncate font-semibold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)]"
                                    data-testid="solution-author-link"
                                >
                                    {solution.username}
                                </Link>

                                {/* Rank badge */}
                                {solution.competitionRank != null && (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-none border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-xs text-[var(--platform-ink)] shadow-none"
                                        data-testid="solution-rank-badge"
                                    >
                                        <TrophyIcon className="h-3 w-3" aria-hidden="true" />
                                        {formatRankBadge(solution.competitionRank)}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {hasSourceFiles && (
                        <CollapsibleTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                aria-controls={sourceRegionId}
                                className="min-h-11 w-full shrink-0 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 text-[var(--platform-ink)] shadow-none hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] active:scale-[0.98] sm:w-auto"
                                data-testid="toggle-code-button"
                            >
                                <CodeIcon className="h-4 w-4" aria-hidden="true" />
                                <span>{isExpanded ? t('hideCode') : t('showCode')}</span>
                                <ChevronDownIcon
                                    className={`h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${isExpanded ? 'rotate-180' : ''}`}
                                    aria-hidden="true"
                                />
                            </Button>
                        </CollapsibleTrigger>
                    )}
                </header>

                {solution.description && (
                    <p
                        className="max-w-[70ch] px-4 pb-5 text-sm leading-6 text-[var(--platform-ink-muted)] sm:px-6"
                        data-testid="solution-description"
                    >
                        {solution.description}
                    </p>
                )}

                {hasSourceFiles && (
                    <CollapsibleContent
                        id={sourceRegionId}
                        className="border-t border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-4 sm:p-6"
                    >
                        <div className="space-y-3">
                            {solution.sourceFiles.map((file) => (
                                <SourceFileBlock key={file.id} file={file} />
                            ))}
                        </div>
                    </CollapsibleContent>
                )}
            </article>
        </Collapsible>
    );
}

type SourceFileBlockProps = {
    file: SourceFileResponse;
};

/**
 * SourceFileBlock displays file metadata and an honest download action.
 */
function SourceFileBlock({ file }: SourceFileBlockProps) {
    const t = useTranslations('editorial');

    return (
        <div className="border border-[var(--platform-line-strong)] bg-[var(--platform-paper)]">
            <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                <div className="flex min-w-0 items-center gap-2">
                    <CodeIcon
                        className="h-4 w-4 shrink-0 text-[var(--platform-violet)]"
                        aria-hidden="true"
                    />
                    <span className="min-w-0 truncate text-sm font-semibold text-[var(--platform-ink)]">
                        {file.fileLabel || file.fileName}
                    </span>
                    <Badge
                        variant="outline"
                        className="shrink-0 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-xs text-[var(--platform-ink-muted)]"
                    >
                        {file.language}
                    </Badge>
                </div>
                <a
                    href={file.downloadUrl}
                    download={file.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 text-sm font-semibold text-[var(--platform-violet-strong)] transition-colors duration-200 hover:border-[var(--platform-violet)] hover:bg-[var(--platform-paper-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)] sm:w-auto"
                    data-testid="download-source-link"
                >
                    <DownloadIcon className="h-4 w-4" aria-hidden="true" />
                    {t('download')}
                </a>
            </div>
            <p className="border-t border-[var(--platform-line)] px-3 py-3 text-xs leading-5 text-[var(--platform-ink-muted)] sm:px-4">
                {t('clickDownloadToView')}
            </p>
        </div>
    );
}
