'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Status types for the anti-cheat companion app connection
 */
export type AntiCheatStatus = 'connected' | 'disconnected' | 'monitoring' | 'interrupted';

export interface AntiCheatStatusIndicatorProps {
    /** Current status of the anti-cheat companion app */
    status: AntiCheatStatus;
    /** Whether to show the tooltip with additional information */
    showTooltip?: boolean;
    /** Optional additional CSS classes */
    className?: string;
    /** Size variant for the indicator */
    size?: 'sm' | 'md' | 'lg';
}

/**
 * AntiCheatStatusIndicator component displays the current connection status
 * of the anti-cheat companion app with a colored dot and status text.
 *
 * Requirements: 11.1
 * - Show green dot for connected/monitoring
 * - Show yellow dot for interrupted
 * - Show red dot for disconnected
 * - Display status text
 */
export function AntiCheatStatusIndicator({
    status,
    showTooltip = true,
    className = '',
    size = 'md',
}: AntiCheatStatusIndicatorProps) {
    const t = useTranslations('antiCheat.statusIndicator');

    // Size configurations
    const sizeConfig = {
        sm: {
            dot: 'h-2 w-2',
            text: 'text-xs',
            container: 'gap-1.5',
        },
        md: {
            dot: 'h-2.5 w-2.5',
            text: 'text-sm',
            container: 'gap-2',
        },
        lg: {
            dot: 'h-3 w-3',
            text: 'text-base',
            container: 'gap-2.5',
        },
    };

    // Status configurations with colors and animations
    const statusConfig: Record<
        AntiCheatStatus,
        {
            dotColor: string;
            textColor: string;
            bgColor: string;
            animate: boolean;
            labelKey: string;
            tooltipKey: string;
        }
    > = {
        connected: {
            dotColor: 'bg-green-500 dark:bg-green-400',
            textColor: 'text-green-700 dark:text-green-300',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            animate: false,
            labelKey: 'connected',
            tooltipKey: 'connectedTooltip',
        },
        monitoring: {
            dotColor: 'bg-green-500 dark:bg-green-400',
            textColor: 'text-green-700 dark:text-green-300',
            bgColor: 'bg-green-100 dark:bg-green-900/30',
            animate: true,
            labelKey: 'monitoring',
            tooltipKey: 'monitoringTooltip',
        },
        interrupted: {
            dotColor: 'bg-yellow-500 dark:bg-yellow-400',
            textColor: 'text-yellow-700 dark:text-yellow-300',
            bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
            animate: true,
            labelKey: 'interrupted',
            tooltipKey: 'interruptedTooltip',
        },
        disconnected: {
            dotColor: 'bg-red-500 dark:bg-red-400',
            textColor: 'text-red-700 dark:text-red-300',
            bgColor: 'bg-red-100 dark:bg-red-900/30',
            animate: false,
            labelKey: 'disconnected',
            tooltipKey: 'disconnectedTooltip',
        },
    };

    const config = statusConfig[status];
    const sizes = sizeConfig[size];

    const indicator = (
        <div
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1',
                config.bgColor,
                sizes.container,
                className,
            )}
            role="status"
            aria-label={t(config.labelKey)}
        >
            {/* Status dot */}
            <span className="relative flex">
                <span
                    className={cn(
                        'rounded-full',
                        sizes.dot,
                        config.dotColor,
                        config.animate && 'animate-pulse',
                    )}
                    aria-hidden="true"
                />
                {/* Ping animation for active states */}
                {config.animate && (
                    <span
                        className={cn(
                            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                            config.dotColor,
                        )}
                        aria-hidden="true"
                    />
                )}
            </span>
            {/* Status text */}
            <span className={cn('font-medium', sizes.text, config.textColor)}>
                {t(config.labelKey)}
            </span>
        </div>
    );

    if (!showTooltip) {
        return indicator;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{indicator}</TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm" side="bottom">
                    <p>{t(config.tooltipKey)}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default AntiCheatStatusIndicator;
