'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck } from 'lucide-react';

export interface AntiCheatBadgeProps {
    /** Whether anti-cheat is enabled for the competition */
    enabled: boolean;
    /** Whether to show the tooltip explaining monitoring scope */
    showTooltip?: boolean;
    /** Optional additional CSS classes */
    className?: string;
    /** Size variant for the badge */
    size?: 'sm' | 'md';
}

/**
 * AntiCheatBadge component displays a shield icon with "Anti-Cheat" label
 * for competitions that have anti-cheat monitoring enabled.
 *
 * Requirements: 11.1, 11.3
 * - Display shield icon with "Anti-Cheat" label
 * - Add tooltip explaining monitoring scope
 * - Style with appropriate colors (blue/purple for security)
 */
export function AntiCheatBadge({
    enabled,
    showTooltip = true,
    className = '',
    size = 'sm',
}: AntiCheatBadgeProps) {
    const t = useTranslations('antiCheat');

    // Don't render anything if anti-cheat is not enabled
    if (!enabled) {
        return null;
    }

    const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

    const badge = (
        <Badge
            variant="outline"
            className={`
                whitespace-nowrap rounded-none font-semibold shadow-none transition-colors duration-200
                bg-indigo-100 dark:bg-indigo-950 
                text-indigo-700 dark:text-indigo-300 
                border-indigo-200 dark:border-indigo-800
                hover:bg-indigo-200 dark:hover:bg-indigo-900
                ${sizeClasses}
                ${className}
            `}
            aria-label={t('badge.ariaLabel')}
        >
            <ShieldCheck className={`${iconSize} mr-1`} aria-hidden="true" />
            {t('badge.label')}
        </Badge>
    );

    if (!showTooltip) {
        return badge;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{badge}</TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm" side="bottom">
                    <p className="font-medium mb-1">{t('badge.tooltipTitle')}</p>
                    <p className="text-muted-foreground">{t('badge.tooltipDescription')}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default AntiCheatBadge;
