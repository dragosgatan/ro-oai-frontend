'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AwardIcon, SparklesIcon, TrendingUpIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useFormatter, useTranslations } from 'next-intl';
import {
    useReducedMotion,
    getMotionTransition,
} from '@/components/achievements/use-reduced-motion';
import type { UserLevel } from '@/lib/level/types';
import { TIER_CONFIG } from '@/lib/level/tier-config';
import { LevelBadge } from './level-badge';
import { ExperienceBar } from './experience-bar';

/**
 * Props for the LevelStatsCard component.
 */
export interface LevelStatsCardProps {
    /** User level information */
    userLevel: UserLevel;
    /** Additional CSS classes */
    className?: string;
    /** Whether to show the "View Achievements" link */
    showAchievementsLink?: boolean;
}

/**
 * LevelStatsCard component displays a prominent level stats card.
 *
 * Features:
 * - Displays current level prominently
 * - Shows tier badge with icon
 * - Displays XP progress with visual bar
 * - Adds "View Achievements" link
 *
 * Requirements: 2.1, 2.2, 9.4
 *
 * @example
 * <LevelStatsCard userLevel={userLevel} />
 */
export function LevelStatsCard({
    userLevel,
    className,
    showAchievementsLink = true,
}: LevelStatsCardProps) {
    const t = useTranslations('level');
    const format = useFormatter();
    const tierConfig = TIER_CONFIG[userLevel.tier];

    // Check for reduced motion preference
    const prefersReducedMotion = useReducedMotion();
    const motionTransition = getMotionTransition(prefersReducedMotion);

    const cardContent = (
        <Card
            className={cn(
                'border-2 overflow-hidden',
                'hover:shadow-lg transition-shadow duration-300',
                // GPU acceleration for smooth animations
                'transform-gpu',
                className,
            )}
            style={{
                borderColor: tierConfig.borderColor,
            }}
        >
            <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 md:gap-6">
                    {/* Level Badge - Prominent Display with responsive sizing */}
                    <div className="flex-shrink-0">
                        <LevelBadge
                            level={userLevel.level}
                            tier={userLevel.tier}
                            size="lg"
                            showTierIcon
                        />
                    </div>

                    {/* Level Info */}
                    <div className="flex-1 w-full text-center sm:text-left min-w-0">
                        {/* Level Number and Tier - responsive text sizes */}
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
                                {t('level')} {format.number(userLevel.level)}
                            </h3>
                            <span
                                className="text-base sm:text-lg flex-shrink-0"
                                role="img"
                                aria-label={tierConfig.name}
                            >
                                {tierConfig.icon}
                            </span>
                        </div>

                        {/* Tier Name - responsive text */}
                        <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                            <SparklesIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{userLevel.tierName}</span>
                        </div>

                        {/* XP Progress - responsive layout */}
                        <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                    <TrendingUpIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                    <span className="hidden xs:inline">{t('totalXp')}</span>
                                    <span className="xs:hidden">XP</span>
                                </span>
                                <span className="font-medium">
                                    {format.number(userLevel.totalXp)} XP
                                </span>
                            </div>

                            {/* Experience Bar */}
                            <ExperienceBar
                                level={userLevel.level}
                                tier={userLevel.tier}
                                progress={userLevel.progress}
                                totalXp={userLevel.totalXp}
                                showDetails={false}
                                animate
                            />

                            {/* Progress Text - responsive */}
                            {!userLevel.progress.isMaxLevel && (
                                <div className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-right">
                                    <span className="hidden sm:inline">
                                        {format.number(userLevel.progress.currentXpInLevel)} /{' '}
                                        {format.number(userLevel.progress.xpNeededForNextLevel)} XP
                                    </span>
                                    <span className="sm:hidden">
                                        {format.number(userLevel.progress.currentXpInLevel)}/
                                        {format.number(userLevel.progress.xpNeededForNextLevel)}
                                    </span>
                                    <span className="ml-1">
                                        (
                                        {format.number(userLevel.progress.percentage / 100, {
                                            style: 'percent',
                                            maximumFractionDigits: 0,
                                        })}
                                        )
                                    </span>
                                </div>
                            )}
                            {userLevel.progress.isMaxLevel && (
                                <div className="text-[10px] sm:text-xs text-yellow-500 font-medium text-center sm:text-right">
                                    {t('maxLevel')} 🎉
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* View Achievements Link - touch-friendly */}
                {showAchievementsLink && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                        <Link
                            href="/achievements"
                            className="flex items-center justify-center gap-2 text-xs sm:text-sm text-primary hover:underline transition-colors py-2 -my-2 touch-manipulation"
                        >
                            <AwardIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            {t('viewAchievements')}
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    // Apply hover animation if reduced motion is not preferred
    if (!prefersReducedMotion) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...motionTransition, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
            >
                {cardContent}
            </motion.div>
        );
    }

    return cardContent;
}

export default LevelStatsCard;
