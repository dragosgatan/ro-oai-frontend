'use client';

import * as React from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type {
    Achievement,
    UserAchievement,
    AchievementProgress,
    AchievementRarity,
} from '@/lib/types';

/**
 * Rarity styling configuration
 * Each rarity has a distinct swatch, badge style, and non-color indicator.
 *
 * Non-color indicators for colorblind accessibility:
 * - COMMON: Circle (○) - single outline, no pattern
 * - UNCOMMON: Diamond outline (◇) - single shape
 * - RARE: Filled diamond (◆) - filled shape
 * - EPIC: Star (★) - 5-pointed star
 * - LEGENDARY: Sparkle (✦) - 4-pointed star with extra detail
 *
 */
const rarityStyles: Record<
    AchievementRarity,
    {
        border: string;
        glow: string;
        badge: string;
        badgeText: string;
        icon: string;
        pattern: string;
        swatch: string;
        /** Number of indicator dots/marks for visual hierarchy */
        indicatorCount: number;
    }
> = {
    COMMON: {
        border: 'border-slate-300 dark:border-slate-600',
        glow: 'hover:shadow-slate-300/40 dark:hover:shadow-slate-700/30',
        badge: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
        badgeText: 'Common',
        icon: '○',
        pattern: 'rarity-common',
        swatch: 'bg-slate-400',
        indicatorCount: 1,
    },
    UNCOMMON: {
        border: 'border-emerald-400 dark:border-emerald-600',
        glow: 'hover:shadow-emerald-300/40 dark:hover:shadow-emerald-800/30',
        badge: 'bg-green-100 text-green-800 border-green-400 dark:bg-green-900/30 dark:text-green-300 dark:border-green-500',
        badgeText: 'Uncommon',
        icon: '◇',
        pattern: 'rarity-uncommon',
        swatch: 'bg-emerald-500',
        indicatorCount: 2,
    },
    RARE: {
        border: 'border-sky-400 dark:border-sky-600',
        glow: 'hover:shadow-sky-300/40 dark:hover:shadow-sky-800/30',
        badge: 'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500',
        badgeText: 'Rare',
        icon: '◆',
        pattern: 'rarity-rare',
        swatch: 'bg-sky-500',
        indicatorCount: 3,
    },
    EPIC: {
        border: 'border-violet-400 dark:border-violet-600',
        glow: 'hover:shadow-violet-300/40 dark:hover:shadow-violet-800/30',
        badge: 'bg-purple-100 text-purple-800 border-purple-400 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500',
        badgeText: 'Epic',
        icon: '★',
        pattern: 'rarity-epic',
        swatch: 'bg-violet-500',
        indicatorCount: 4,
    },
    LEGENDARY: {
        border: 'border-amber-400 dark:border-amber-600',
        glow: 'hover:shadow-amber-300/40 dark:hover:shadow-amber-800/30',
        badge: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-500',
        badgeText: 'Legendary',
        icon: '✦',
        pattern: 'rarity-legendary',
        swatch: 'bg-amber-400',
        indicatorCount: 5,
    },
};

const sizeStyles = {
    sm: {
        card: 'p-3',
        icon: 'w-10 h-10 text-2xl',
        title: 'text-sm font-medium',
        description: 'text-xs',
        badge: 'text-[10px] px-1.5 py-0.5',
    },
    md: {
        card: 'p-4',
        icon: 'w-14 h-14 text-3xl',
        title: 'text-base font-semibold',
        description: 'text-sm',
        badge: 'text-xs px-2 py-0.5',
    },
    lg: {
        card: 'p-5',
        icon: 'w-18 h-18 text-4xl',
        title: 'text-lg font-bold',
        description: 'text-base',
        badge: 'text-sm px-2.5 py-1',
    },
};

export interface AchievementCardProps {
    /** The achievement definition */
    achievement: Achievement;
    /** User's achievement data if earned */
    userAchievement?: UserAchievement;
    /** Progress data for locked achievements */
    progress?: AchievementProgress;
    /** Card size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Whether to show progress bar for locked achievements */
    showProgress?: boolean;
    /** Click handler for selection */
    onSelect?: () => void;
    /** Whether the card is currently selected */
    isSelected?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * AchievementCard component displays an achievement with rarity-based styling.
 *
 * Features:
 * - Distinct swatches and non-color indicators for every rarity
 * - Compact, stable interaction feedback without decorative animation
 * - Progress bar for locked achievements
 * - "Almost There" indicator for progress >= 80%
 * - Lock icon overlay for unearned achievements
 * - Responsive size variants (sm, md, lg)
 * - Accessibility support with proper ARIA attributes
 *
 * @example
 * <AchievementCard
 *   achievement={achievement}
 *   userAchievement={userAchievement}
 *   progress={progress}
 *   size="md"
 *   showProgress
 * />
 */
export function AchievementCard({
    achievement,
    userAchievement,
    progress,
    size = 'md',
    showProgress = true,
    onSelect,
    isSelected = false,
    className,
}: AchievementCardProps) {
    const t = useTranslations('achievements');
    const format = useFormatter();
    const isUnlocked = !!userAchievement;
    const rarity = achievement.rarity;
    const styles = rarityStyles[rarity];
    const sizeStyle = sizeStyles[size];

    // Get translated name and description, fallback to API values
    const achievementName = t.has(`names.${achievement.code}`)
        ? t(`names.${achievement.code}`)
        : achievement.name;
    const achievementDescription = t.has(`descriptions.${achievement.code}`)
        ? t(`descriptions.${achievement.code}`)
        : achievement.description;
    const rarityText = t.has(`rarities.${rarity}`) ? t(`rarities.${rarity}`) : styles.badgeText;

    // Calculate progress percentage
    const progressPercent = progress?.percentComplete ?? 0;
    const isAlmostThere = !isUnlocked && progressPercent >= 80;
    const accessibleLabel = `${achievementName}, ${rarityText}, ${isUnlocked ? t('unlocked') : t('locked')}`;
    const cardClassName = cn(
        'achievement-register-card relative h-full border bg-card text-card-foreground transition-[border-color,box-shadow,transform] duration-200',
        sizeStyle.card,
        !isUnlocked && 'border-dashed',
        isSelected && 'ring-2 ring-[var(--platform-violet,hsl(var(--primary)))] ring-offset-2',
        onSelect &&
            'w-full cursor-pointer text-start hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--platform-coral,hsl(var(--ring)))]',
        className,
    );

    const cardBody = (
        <>
            <span
                className={cn('absolute inset-x-0 top-0 h-1', styles.swatch)}
                aria-hidden="true"
            />
            {/* Lock overlay for unearned achievements */}
            {!isUnlocked && (
                <div className="absolute end-2 top-3 z-10" aria-hidden="true">
                    <Lock className="h-4 w-4 text-[var(--platform-ink-muted)]" />
                </div>
            )}

            <div className="flex gap-3 pt-1">
                {/* Achievement Icon */}
                <div
                    className={cn(
                        'flex shrink-0 items-center justify-center border border-border bg-muted/40',
                        sizeStyle.icon,
                        !isUnlocked && 'grayscale',
                    )}
                >
                    {achievement.iconUrl ? (
                        <img
                            src={achievement.iconUrl}
                            alt=""
                            className="h-full w-full object-contain"
                            aria-hidden="true"
                        />
                    ) : (
                        <span aria-hidden="true">🏆</span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                    {/* Header with name and rarity badge */}
                    <div className="flex items-start justify-between gap-2">
                        <h3 className={cn(sizeStyle.title, 'truncate')}>{achievementName}</h3>
                        <Badge
                            variant="outline"
                            className={cn(sizeStyle.badge, styles.badge, 'flex-shrink-0')}
                            aria-label={rarityText}
                        >
                            {/* Non-color rarity indicator: icon */}
                            <span className="me-1" aria-hidden="true">
                                {styles.icon}
                            </span>
                            {/* Non-color rarity indicator: dots showing tier level */}
                            <span className="me-1 flex items-center gap-0.5" aria-hidden="true">
                                {Array.from({ length: styles.indicatorCount }).map((_, i) => (
                                    <span
                                        key={i}
                                        className="h-1 w-1 rounded-full bg-current opacity-70"
                                    />
                                ))}
                            </span>
                            <span>{rarityText}</span>
                        </Badge>
                    </div>

                    {/* Description */}
                    <p
                        className={cn(
                            sizeStyle.description,
                            'line-clamp-2 text-[var(--platform-ink-muted)]',
                        )}
                    >
                        {achievementDescription}
                    </p>

                    {/* Progress section for locked achievements */}
                    {!isUnlocked && showProgress && progress && (
                        <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-[var(--platform-ink-muted)]">
                                    {format.number(progress.currentValue)} /{' '}
                                    {format.number(progress.targetValue)}
                                </span>
                                {isAlmostThere && (
                                    <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
                                        <Sparkles className="h-3 w-3" />
                                        {t('almostThere')}
                                    </span>
                                )}
                            </div>
                            <Progress
                                value={progressPercent}
                                className="h-2"
                                aria-label={`${t('progress')}: ${format.number(
                                    progressPercent / 100,
                                    {
                                        style: 'percent',
                                        maximumFractionDigits: 0,
                                    },
                                )}`}
                            />
                        </div>
                    )}

                    {/* XP reward */}
                    {achievement.xpReward > 0 && (
                        <div
                            className={cn(
                                sizeStyle.description,
                                'pt-1 text-[var(--platform-ink-muted)]',
                            )}
                        >
                            {t('xpReward', { xp: format.number(achievement.xpReward) })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    if (onSelect) {
        return (
            <button
                type="button"
                className={cardClassName}
                onClick={onSelect}
                aria-label={accessibleLabel}
                aria-pressed={isSelected}
            >
                {cardBody}
            </button>
        );
    }

    return (
        <article className={cardClassName} aria-label={accessibleLabel}>
            {cardBody}
        </article>
    );
}

/**
 * Helper function to get rarity styling for external use
 */
export function getRarityStyles(rarity: AchievementRarity) {
    return rarityStyles[rarity];
}

/**
 * Helper function to check if progress is near completion
 */
export function isNearCompletion(progress: AchievementProgress | undefined): boolean {
    if (!progress) return false;
    return progress.percentComplete >= 80;
}
