'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export type LoadMoreButtonProps = {
    onClick: () => void;
    isLoading: boolean;
    disabled: boolean;
    error?: string | null;
    onRetry?: () => void;
    className?: string;
};

/**
 * LoadMoreButton Component
 *
 * A button component for progressive content loading with loading states,
 * error handling, and full accessibility support.
 *
 * Features:
 * - Loading spinner state
 * - Error state with retry functionality
 * - Full keyboard navigation support
 * - ARIA labels for screen readers
 * - Responsive design (full-width on mobile, auto on desktop)
 * - Hover and focus visual effects
 */
export function LoadMoreButton({
    onClick,
    isLoading,
    disabled,
    error,
    onRetry,
    className,
}: LoadMoreButtonProps) {
    const t = useTranslations();
    const hasError = error !== null && error !== undefined;
    const isDisabled = disabled || isLoading;

    // Handle button click
    const handleClick = () => {
        if (isDisabled) return;
        onClick();
    };

    // Handle retry click
    const handleRetry = () => {
        if (!onRetry) return;
        onRetry();
    };

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            {/* Main Load More Button */}
            <Button
                variant="outline"
                size="default"
                onClick={handleClick}
                disabled={isDisabled}
                className={cn(
                    'w-full sm:w-auto min-w-[200px] min-h-[44px] transition-all duration-200',
                    'hover:scale-[1.02] hover:shadow-md',
                    'focus-visible:scale-[1.02] focus-visible:shadow-md',
                    isDisabled && 'cursor-not-allowed',
                    className,
                )}
                aria-label={isLoading ? t('problems.loadingMoreAria') : t('problems.loadMoreAria')}
                aria-busy={isLoading}
                aria-disabled={isDisabled}
            >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {isLoading ? t('problems.loadingMore') : t('problems.loadMore')}
            </Button>

            {/* Error State with Retry */}
            {hasError && (
                <div className="text-center py-2 w-full" role="alert" aria-live="assertive">
                    <p className="text-sm text-destructive mb-2">{error}</p>
                    {onRetry && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRetry}
                            className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                            aria-label={t('problems.retryLoadAria')}
                        >
                            {t('common.retry')}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
