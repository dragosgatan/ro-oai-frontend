'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldAlert } from 'lucide-react';

export interface SebRequiredBadgeProps {
    /** Whether SEB is required for the competition */
    required: boolean;
    /** Whether to show the tooltip explaining SEB requirement */
    showTooltip?: boolean;
    /** Optional additional CSS classes */
    className?: string;
    /** Size variant for the badge */
    size?: 'sm' | 'md';
}

/**
 * SebRequiredBadge component displays a shield icon with "SEB Required" label
 * for competitions that require Safe Exam Browser.
 *
 * - Display shield icon with "SEB Required" label
 * - Add tooltip explaining what SEB is and why it's required
 * - Style with purple/violet colors to differentiate from anti-cheat
 */
export function SebRequiredBadge({
    required,
    showTooltip = true,
    className = '',
    size = 'sm',
}: SebRequiredBadgeProps) {
    const t = useTranslations('seb');

    // Don't render anything if SEB is not required
    if (!required) {
        return null;
    }

    const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

    const badge = (
        <Badge
            variant="outline"
            className={`
                whitespace-nowrap rounded-none font-semibold shadow-none transition-colors duration-200
                bg-violet-100 dark:bg-violet-950 
                text-violet-700 dark:text-violet-300 
                border-violet-200 dark:border-violet-800
                hover:bg-violet-200 dark:hover:bg-violet-900
                ${sizeClasses}
                ${className}
            `}
            aria-label={t('badge.ariaLabel')}
        >
            <ShieldAlert className={`${iconSize} mr-1`} aria-hidden="true" />
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

export default SebRequiredBadge;
