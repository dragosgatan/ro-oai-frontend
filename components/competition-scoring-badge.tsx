'use client';

import { Eye } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { hasLiveFinalScores } from '@/lib/competition-utils';
import type { CompetitionType } from '@/lib/types';
import { cn } from '@/lib/utils';

type CompetitionScoringBadgeProps = {
    competitionType: CompetitionType | null | undefined;
    size?: 'sm' | 'md';
    className?: string;
};

/**
 * Makes the participant-facing consequence of casual scoring explicit.
 * The backend remains authoritative for which score values are returned.
 */
export function CompetitionScoringBadge({
    competitionType,
    size = 'sm',
    className,
}: CompetitionScoringBadgeProps) {
    const t = useTranslations('competitions.scoring');

    if (!hasLiveFinalScores(competitionType)) return null;

    return (
        <Badge
            variant="outline"
            className={cn(
                'whitespace-nowrap rounded-none border-[color-mix(in_oklch,var(--platform-violet)_35%,transparent)] bg-[color-mix(in_oklch,var(--platform-violet)_10%,var(--platform-paper))] font-semibold text-[var(--platform-violet-strong)] shadow-none',
                size === 'sm' ? 'min-h-7 px-2.5 text-xs' : 'min-h-8 px-3 text-sm',
                className,
            )}
            aria-label={t('visibleDescription')}
        >
            <Eye
                className={cn('me-1.5 shrink-0', size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')}
                aria-hidden="true"
            />
            {t('visible')}
        </Badge>
    );
}
