'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    useReducedMotion,
    getMotionTransition,
} from '@/components/achievements/use-reduced-motion';
import type { LevelTier } from '@/lib/level/types';
import { TIER_CONFIG, getTierForLevel } from '@/lib/level/tier-config';

/**
 * Size configuration for the LevelBadge component.
 * Each size has specific dimensions, font sizes, and icon sizes.
 * Responsive variants adapt to mobile viewports automatically.
 * Requirements: 10.1, 10.2
 */
const sizeStyles = {
    xs: {
        container: 'w-5 h-5 text-[10px]',
        icon: 'text-[8px]',
        padding: 'p-0',
    },
    sm: {
        container: 'w-6 h-6 text-[11px] sm:w-7 sm:h-7 sm:text-xs',
        icon: 'text-[8px] sm:text-[10px]',
        padding: 'p-0.5',
    },
    md: {
        container: 'w-8 h-8 text-xs sm:w-9 sm:h-9 sm:text-sm',
        icon: 'text-[10px] sm:text-xs',
        padding: 'p-0.5 sm:p-1',
    },
    lg: {
        container: 'w-10 h-10 text-sm sm:w-12 sm:h-12 sm:text-base',
        icon: 'text-xs sm:text-sm',
        padding: 'p-1 sm:p-1.5',
    },
} as const;

export type LevelBadgeSize = keyof typeof sizeStyles;

export interface LevelBadgeProps {
    /** The user's level (1-50) */
    level: number;
    /** The level tier (optional - will be calculated from level if not provided) */
    tier?: LevelTier;
    /** Size variant of the badge */
    size?: LevelBadgeSize;
    /** Whether to show the tier icon */
    showTierIcon?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * LevelBadge component displays a user's level with tier-appropriate styling.
 *
 * Features:
 * - Size variants (xs, sm, md, lg) for different contexts
 * - Tier-specific styling (colors, gradients, borders)
 * - Optional tier icon display
 * - Hover animations with reduced-motion support
 * - ARIA labels for accessibility
 * - Tooltip with tier name on hover
 *
 * Requirements: 1.1, 1.2, 1.4, 7.3, 8.1
 *
 * @example
 * // Basic usage
 * <LevelBadge level={15} />
 *
 * // With tier icon and large size
 * <LevelBadge level={42} showTierIcon size="lg" />
 *
 * // Compact for leaderboards
 * <LevelBadge level={7} size="xs" />
 */
export function LevelBadge({
    level,
    tier: providedTier,
    size = 'md',
    showTierIcon = false,
    className,
}: LevelBadgeProps) {
    // Calculate tier from level if not provided
    const tier = providedTier ?? getTierForLevel(level);
    const tierConfig = TIER_CONFIG[tier];
    const sizeStyle = sizeStyles[size];

    // Check for reduced motion preference
    const prefersReducedMotion = useReducedMotion();
    const motionTransition = getMotionTransition(prefersReducedMotion);

    // Determine if this is a compact size (xs or sm)
    const isCompact = size === 'xs' || size === 'sm';

    // Calculate glow size based on tier intensity
    const glowSize = Math.round(8 + tierConfig.glowIntensity * 12);
    const hoverGlowSize = Math.round(12 + tierConfig.glowIntensity * 16);

    // Build the badge content
    const badgeContent = (
        <div
            className={cn(
                // Base styles
                'relative inline-flex items-center justify-center rounded-full font-bold',
                'border-2',
                sizeStyle.container,
                sizeStyle.padding,
                // Tier-specific gradient background
                'bg-gradient-to-br',
                tierConfig.bgGradient,
                // Border color
                `border-[${tierConfig.borderColor}]`,
                // Text color
                tierConfig.textColor === '#FFFFFF' ? 'text-white' : 'text-black',
                // Shadow for depth
                'shadow-sm',
                // Touch-friendly: ensure minimum touch target size on mobile
                'min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0',
                // GPU acceleration for smooth animations
                'transform-gpu',
                // Smooth transitions for all state changes (60fps performance)
                'transition-[box-shadow,transform] duration-200 ease-out',
                // Add pulsing glow for higher tiers (Expert, Master, Legend)
                tierConfig.hasAnimatedEffects && !prefersReducedMotion && 'level-glow-pulse',
                // Add prismatic effect for Legend tier
                tier === 'LEGEND' && !prefersReducedMotion && 'animate-prismatic',
                className,
            )}
            style={{
                borderColor: tierConfig.borderColor,
                boxShadow: `0 0 ${glowSize}px ${tierConfig.glowColor}`,
                // CSS variable for glow animation
                ['--level-glow-color' as string]: tierConfig.glowColor,
            }}
            role="img"
            aria-label={`Level ${level} - ${tierConfig.name} tier`}
            onMouseEnter={(e) => {
                if (!prefersReducedMotion) {
                    e.currentTarget.style.boxShadow = `0 0 ${hoverGlowSize}px ${tierConfig.glowColor}`;
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `0 0 ${glowSize}px ${tierConfig.glowColor}`;
            }}
        >
            {/* Level number */}
            <span className="relative z-10 leading-none select-none">{level}</span>

            {/* Tier icon (shown above the badge for larger sizes) */}
            {showTierIcon && !isCompact && (
                <span
                    className={cn('absolute -top-1 -right-1 z-20', sizeStyle.icon)}
                    aria-hidden="true"
                >
                    {tierConfig.icon}
                </span>
            )}
        </div>
    );

    // Wrap with tooltip for tier information
    const badgeWithTooltip = (
        <Tooltip>
            <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
            <TooltipContent>
                <div className="flex items-center gap-1.5">
                    <span aria-hidden="true">{tierConfig.icon}</span>
                    <span>
                        Level {level} • {tierConfig.name}
                    </span>
                </div>
            </TooltipContent>
        </Tooltip>
    );

    // Apply hover animation if reduced motion is not preferred
    if (!prefersReducedMotion) {
        return (
            <motion.div
                className="inline-flex"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={motionTransition}
            >
                {badgeWithTooltip}
            </motion.div>
        );
    }

    // For reduced motion, return without animation wrapper
    return <div className="inline-flex">{badgeWithTooltip}</div>;
}

/**
 * Helper function to get tier configuration for external use.
 * @param level - The level (1-50)
 * @returns The tier configuration
 */
export function getLevelBadgeConfig(level: number) {
    const tier = getTierForLevel(level);
    return TIER_CONFIG[tier];
}

export default LevelBadge;
