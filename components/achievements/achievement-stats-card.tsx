'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Flame, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatter, useTranslations } from 'next-intl';
import type { AchievementStats, AchievementRarity } from '@/lib/types';

/**
 * Rarity colors for the distribution chart
 */
const rarityColors: Record<AchievementRarity, string> = {
    COMMON: 'bg-gray-400 dark:bg-gray-500',
    UNCOMMON: 'bg-green-500 dark:bg-green-400',
    RARE: 'bg-blue-500 dark:bg-blue-400',
    EPIC: 'bg-purple-500 dark:bg-purple-400',
    LEGENDARY: 'bg-yellow-500 dark:bg-yellow-400',
};

export interface AchievementStatsCardProps {
    /** User's achievement statistics */
    stats: AchievementStats;
    /** Additional CSS classes */
    className?: string;
}

/**
 * AchievementStatsCard displays user's achievement statistics including:
 * - Total earned and completion percentage
 * - Total XP earned
 * - Rarity distribution chart
 * - Current and longest streak
 *
 * Requirements: 8.2, 11.1, 11.4
 */
export function AchievementStatsCard({ stats, className }: AchievementStatsCardProps) {
    const t = useTranslations('achievements');
    const format = useFormatter();

    // Calculate total achievements by rarity for the distribution
    const totalByRarity = React.useMemo(() => {
        const rarities: AchievementRarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
        return rarities.map((rarity) => ({
            rarity,
            count: stats.byRarity[rarity] || 0,
            label: t(`rarities.${rarity}`),
            color: rarityColors[rarity],
        }));
    }, [stats.byRarity, t]);

    const maxRarityCount = Math.max(...totalByRarity.map((r) => r.count), 1);

    return (
        <Card className={cn('border-2', className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    {t('statistics')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Total Earned */}
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-center mb-1">
                            <Star className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-2xl font-bold text-primary">
                            {format.number(stats.totalEarned)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {t('of')} {format.number(stats.totalAvailable)}
                        </div>
                        <div className="text-xs font-medium mt-1">{t('earned')}</div>
                    </div>

                    {/* Completion Percentage */}
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-center mb-1">
                            <Trophy className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {format.number(stats.completionPercentage / 100, {
                                style: 'percent',
                                maximumFractionDigits: 0,
                            })}
                        </div>
                        <div className="text-xs text-muted-foreground">{t('complete')}</div>
                        <Progress value={stats.completionPercentage} className="h-1.5 mt-2" />
                    </div>

                    {/* Total XP */}
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-center mb-1">
                            <Zap className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {format.number(stats.totalXp)}
                        </div>
                        <div className="text-xs text-muted-foreground">{t('totalXp')}</div>
                    </div>

                    {/* Streak */}
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-center mb-1">
                            <Flame className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {format.number(stats.currentStreak)}
                        </div>
                        <div className="text-xs text-muted-foreground">{t('dayStreak')}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {t('bestStreak')}: {format.number(stats.longestStreak)}
                        </div>
                    </div>
                </div>

                {/* Rarity Distribution */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                        {t('rarityDistribution')}
                    </h4>
                    <div className="space-y-2">
                        {totalByRarity.map(({ rarity, count, label, color }) => (
                            <div key={rarity} className="flex items-center gap-3">
                                <span className="text-xs w-20 text-muted-foreground">{label}</span>
                                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all duration-500',
                                            color,
                                        )}
                                        style={{
                                            width: `${(count / maxRarityCount) * 100}%`,
                                            minWidth: count > 0 ? '8px' : '0',
                                        }}
                                    />
                                </div>
                                <span className="text-xs font-medium w-8 text-right">
                                    {format.number(count)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default AchievementStatsCard;
