'use client';

import * as React from 'react';
import { Edit2, Plus, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import type { AchievementRarity, UserAchievement } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getRarityStyles } from './achievement-card';

const raritySurfaceStyles: Record<AchievementRarity, string> = {
    COMMON: 'bg-[var(--platform-paper-strong)]',
    UNCOMMON: 'bg-[color-mix(in_oklch,var(--platform-citron)_18%,var(--platform-paper))]',
    RARE: 'bg-[color-mix(in_oklch,var(--platform-violet)_10%,var(--platform-paper))]',
    EPIC: 'bg-[color-mix(in_oklch,var(--platform-coral)_13%,var(--platform-paper))]',
    LEGENDARY: 'bg-[var(--platform-citron)] text-[var(--platform-on-accent)]',
};

export interface AchievementShowcaseProps {
    achievements: UserAchievement[];
    isOwnProfile: boolean;
    onEditShowcase?: () => void;
    editButtonRef?: React.Ref<HTMLButtonElement>;
    className?: string;
}

export function AchievementShowcase({
    achievements,
    isOwnProfile,
    onEditShowcase,
    editButtonRef,
    className,
}: AchievementShowcaseProps) {
    const t = useTranslations('achievements');

    const slots = React.useMemo(() => {
        const sorted = [...achievements].sort(
            (a, b) => (a.showcaseOrder ?? 0) - (b.showcaseOrder ?? 0),
        );
        return Array.from({ length: 5 }, (_, index) => sorted[index] ?? null);
    }, [achievements]);

    return (
        <div className={cn('space-y-5', className)} role="region" aria-label={t('showcase')}>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--platform-line)] pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Trophy
                            className="h-5 w-5 text-[var(--platform-violet)]"
                            aria-hidden="true"
                        />
                        <h2 className="text-lg font-semibold tracking-[-0.025em] text-[var(--platform-ink)]">
                            {t('showcase')}
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-[var(--platform-ink-muted)]">
                        {achievements.length}/5 {t('selected')}
                    </p>
                </div>
                {isOwnProfile && onEditShowcase ? (
                    <Button
                        ref={editButtonRef}
                        variant="outline"
                        size="sm"
                        onClick={onEditShowcase}
                        className="min-h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 text-[var(--platform-ink)] shadow-none hover:bg-[var(--platform-citron)] hover:text-[var(--platform-on-accent)]"
                        aria-label={t('editShowcase')}
                    >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                        {t('editShowcase')}
                    </Button>
                ) : null}
            </div>

            <div
                className="grid grid-cols-5 gap-2 sm:gap-3"
                role="list"
                aria-label={`${t('showcase')}: ${achievements.length}/5`}
            >
                {slots.map((achievement, index) => (
                    <ShowcaseSlot
                        key={achievement?.id ?? `empty-${index}`}
                        achievement={achievement}
                        index={index}
                    />
                ))}
            </div>

            {achievements.length === 0 ? (
                <p className="text-sm leading-6 text-[var(--platform-ink-muted)]">
                    {isOwnProfile ? t('showcaseEmptyOwn') : t('showcaseEmpty')}
                </p>
            ) : null}
        </div>
    );
}

function ShowcaseSlot({
    achievement,
    index,
}: {
    achievement: UserAchievement | null;
    index: number;
}) {
    const t = useTranslations('achievements');

    if (!achievement) {
        return (
            <div
                className="grid aspect-square min-h-12 place-items-center border border-dashed border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-[var(--platform-ink-muted)] sm:min-h-24"
                role="listitem"
                aria-label={`${t('noAchievementsSelected')} ${index + 1}`}
            >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </div>
        );
    }

    const achievementDetails = achievement.achievement;
    const rarityStyle = getRarityStyles(achievementDetails.rarity);
    const rarityText = t.has(`rarities.${achievementDetails.rarity}`)
        ? t(`rarities.${achievementDetails.rarity}`)
        : rarityStyle.badgeText;

    return (
        <div
            className={cn(
                'group relative flex aspect-square min-h-12 flex-col items-center justify-center gap-1.5 overflow-hidden border border-[var(--platform-line-strong)] p-1.5 text-center transition-colors hover:border-[var(--platform-violet)] sm:min-h-24 sm:gap-2 sm:p-3',
                raritySurfaceStyles[achievementDetails.rarity],
            )}
            role="listitem"
            aria-label={`${achievementDetails.name}, ${rarityText}`}
            title={`${achievementDetails.name}, ${rarityText}`}
        >
            <span className="absolute start-1.5 top-1.5 text-[9px] font-semibold tabular-nums opacity-55 sm:start-2 sm:top-2 sm:text-[10px]">
                {String(index + 1).padStart(2, '0')}
            </span>
            <div className="grid h-7 w-7 place-items-center sm:h-10 sm:w-10">
                {achievementDetails.iconUrl ? (
                    <img
                        src={achievementDetails.iconUrl}
                        alt=""
                        className="h-full w-full object-contain"
                        aria-hidden="true"
                    />
                ) : (
                    <Trophy className="h-5 w-5 sm:h-7 sm:w-7" aria-hidden="true" />
                )}
            </div>
            <span className="hidden max-w-full text-[11px] font-semibold leading-tight text-[var(--platform-ink)] sm:line-clamp-2">
                {achievementDetails.name}
            </span>
            <span
                className="absolute bottom-1.5 end-1.5 h-2 w-2 bg-current opacity-55 sm:bottom-2 sm:end-2"
                aria-hidden="true"
            />
        </div>
    );
}

export default AchievementShowcase;
