'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useFormatter } from 'next-intl';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    useReducedMotion,
    getMotionTransition,
} from '@/components/achievements/use-reduced-motion';
import type { LevelTier, LevelProgress } from '@/lib/level/types';
import { TIER_CONFIG, getTierForLevel } from '@/lib/level/tier-config';

/**
 * Props for the ExperienceBar component.
 */
export interface ExperienceBarProps {
    /** The user's current level (1-50) */
    level: number;
    /** The level tier (optional - will be calculated from level if not provided) */
    tier?: LevelTier;
    /** Progress information within the current level */
    progress: LevelProgress;
    /** The user's total XP earned */
    totalXp: number;
    /** Whether to show detailed XP information below the bar */
    showDetails?: boolean;
    /** Whether to animate the progress bar fill */
    animate?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Format a number with thousands separators.
 * @param num - The number to format
 * @returns Formatted string with commas
 */
/**
 * ExperienceBar component displays a user's XP progress toward the next level.
 *
 * Features:
 * - Progress bar with tier-appropriate gradient fill
 * - Display of current XP, XP needed, and percentage
 * - "Max Level" indicator for level 50
 * - Smooth fill animation with reduced-motion support
 * - Tooltip with detailed XP breakdown
 * - ARIA attributes for accessibility (aria-valuenow, aria-valuemax, aria-label)
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 8.2
 *
 * @example
 * // Basic usage
 * <ExperienceBar
 *   level={15}
 *   progress={{ currentXpInLevel: 500, xpNeededForNextLevel: 1000, percentage: 50, isMaxLevel: false }}
 *   totalXp={5500}
 * />
 *
 * // With details shown
 * <ExperienceBar
 *   level={42}
 *   progress={{ currentXpInLevel: 0, xpNeededForNextLevel: 0, percentage: 100, isMaxLevel: true }}
 *   totalXp={100000}
 *   showDetails
 * />
 */
export function ExperienceBar({
    level,
    tier: providedTier,
    progress,
    totalXp,
    showDetails = true,
    animate = true,
    className,
}: ExperienceBarProps) {
    const format = useFormatter();

    // Calculate tier from level if not provided
    const tier = providedTier ?? getTierForLevel(level);
    const tierConfig = TIER_CONFIG[tier];

    // Check for reduced motion preference
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = animate && !prefersReducedMotion;
    const motionTransition = getMotionTransition(prefersReducedMotion);

    // Calculate display values
    const displayPercentage = Math.min(100, Math.max(0, progress.percentage));
    const isMaxLevel = progress.isMaxLevel;
    const formattedLevel = format.number(level);
    const formattedNextLevel = format.number(level + 1);
    const formattedTotalXp = format.number(totalXp);
    const formattedCurrentXp = format.number(progress.currentXpInLevel);
    const formattedXpNeeded = format.number(progress.xpNeededForNextLevel);
    const formattedPrecisePercentage = format.number(displayPercentage / 100, {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
    const formattedWholePercentage = format.number(displayPercentage / 100, {
        style: 'percent',
        maximumFractionDigits: 0,
    });

    // Calculate glow size based on tier intensity for enhanced visual polish
    const glowSize = Math.round(6 + tierConfig.glowIntensity * 10);

    // Build the tooltip content
    const tooltipContent = (
        <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 font-medium">
                <span aria-hidden="true">{tierConfig.icon}</span>
                <span>
                    Level {formattedLevel} • {tierConfig.name}
                </span>
            </div>
            <div className="text-muted-foreground">
                <div>Total XP: {formattedTotalXp}</div>
                {!isMaxLevel && (
                    <>
                        <div>
                            Progress: {formattedCurrentXp} / {formattedXpNeeded} XP
                        </div>
                        <div>
                            {formattedPrecisePercentage} to Level {formattedNextLevel}
                        </div>
                    </>
                )}
                {isMaxLevel && (
                    <div className="text-yellow-500 font-medium">Maximum Level Achieved! 🎉</div>
                )}
            </div>
        </div>
    );

    // Progress bar fill component
    const ProgressFill = shouldAnimate ? motion.div : 'div';
    const fillProps = shouldAnimate
        ? {
              initial: { width: 0 },
              animate: { width: `${displayPercentage}%` },
              transition: {
                  ...motionTransition,
                  duration: 0.8,
                  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
              },
          }
        : {};

    return (
        <div className={cn('w-full', className)}>
            {/* Progress bar container - responsive height */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            // Responsive height: smaller on mobile, larger on desktop
                            'relative h-3 sm:h-4 w-full overflow-hidden rounded-full',
                            'bg-secondary/50 border border-border/50',
                            'cursor-help',
                            // Touch-friendly: ensure minimum touch target
                            'min-h-[44px] sm:min-h-0',
                            // GPU acceleration for smooth animations
                            'transform-gpu',
                        )}
                        role="progressbar"
                        aria-valuenow={isMaxLevel ? 100 : progress.currentXpInLevel}
                        aria-valuemin={0}
                        aria-valuemax={isMaxLevel ? 100 : progress.xpNeededForNextLevel}
                        aria-label={
                            isMaxLevel
                                ? `Level ${formattedLevel} - Maximum level achieved with ${formattedTotalXp} total XP`
                                : `Level ${formattedLevel} progress: ${formattedCurrentXp} of ${formattedXpNeeded} XP (${formattedWholePercentage})`
                        }
                    >
                        {/* Gradient fill with smooth transition and tier-based glow */}
                        <ProgressFill
                            className={cn(
                                'h-full rounded-full',
                                'bg-gradient-to-r',
                                tierConfig.bgGradient,
                                // Add subtle glow effect
                                'shadow-sm',
                                // Smooth transition for non-animated state changes (60fps)
                                'transition-[width,box-shadow] duration-300 ease-out',
                                // Add pulsing glow for higher tiers
                                tierConfig.hasAnimatedEffects &&
                                    !prefersReducedMotion &&
                                    'level-glow-pulse',
                            )}
                            style={{
                                width: shouldAnimate ? undefined : `${displayPercentage}%`,
                                boxShadow: `0 0 ${glowSize}px ${tierConfig.glowColor}`,
                                // CSS variable for glow animation
                                ['--level-glow-color' as string]: tierConfig.glowColor,
                            }}
                            {...fillProps}
                        />

                        {/* Max level indicator - responsive text */}
                        {isMaxLevel && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] sm:text-xs font-bold text-white drop-shadow-md">
                                    MAX LEVEL
                                </span>
                            </div>
                        )}

                        {/* Shimmer effect for Legend tier */}
                        {tier === 'LEGEND' && !prefersReducedMotion && (
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                                style={{
                                    width: `${displayPercentage}%`,
                                }}
                            />
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                    {tooltipContent}
                </TooltipContent>
            </Tooltip>

            {/* Details section below the bar - responsive layout */}
            {showDetails && (
                <div className="mt-1 sm:mt-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-0.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <span aria-hidden="true">{tierConfig.icon}</span>
                        <span>{tierConfig.name}</span>
                    </div>
                    <div className="w-full sm:w-auto text-right">
                        {isMaxLevel ? (
                            <span className="font-medium text-yellow-500">
                                {formattedTotalXp} XP • Max Level
                            </span>
                        ) : (
                            <span>
                                {formattedCurrentXp} / {formattedXpNeeded} XP (
                                {formattedWholePercentage})
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ExperienceBar;
