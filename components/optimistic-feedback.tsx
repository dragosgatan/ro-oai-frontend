'use client';

import * as React from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimisticFeedbackProps {
    /**
     * Whether the optimistic update is in progress
     */
    isOptimistic?: boolean;

    /**
     * Whether the action is pending
     */
    isPending?: boolean;

    /**
     * Whether the action succeeded
     */
    isSuccess?: boolean;

    /**
     * Whether the action failed
     */
    isError?: boolean;

    /**
     * Children to render
     */
    children: React.ReactNode;

    /**
     * Additional className
     */
    className?: string;

    /**
     * Show visual indicator
     */
    showIndicator?: boolean;
}

/**
 * Component that provides visual feedback for optimistic updates
 * Shows loading, success, or error states with smooth transitions
 *
 * @example
 * ```tsx
 * <OptimisticFeedback
 *   isOptimistic={isOptimistic}
 *   isPending={isPending}
 *   showIndicator
 * >
 *   <div>Content that updates optimistically</div>
 * </OptimisticFeedback>
 * ```
 */
export function OptimisticFeedback({
    isOptimistic,
    isPending,
    isSuccess,
    isError,
    children,
    className,
    showIndicator = false,
}: OptimisticFeedbackProps) {
    const [showSuccess, setShowSuccess] = React.useState(false);

    React.useEffect(() => {
        if (isSuccess) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess]);

    return (
        <div
            className={cn(
                'relative transition-all duration-200',
                isOptimistic && 'opacity-70',
                className,
            )}
        >
            {children}

            {showIndicator && (
                <div className="absolute -right-8 top-1/2 -translate-y-1/2">
                    {(isPending || isOptimistic) && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {showSuccess && <Check className="h-4 w-4 text-success animate-scale-in" />}
                    {isError && <AlertCircle className="h-4 w-4 text-destructive animate-shake" />}
                </div>
            )}
        </div>
    );
}

interface OptimisticWrapperProps {
    /**
     * Whether the optimistic update is in progress
     */
    isOptimistic?: boolean;

    /**
     * Children to render
     */
    children: React.ReactNode;

    /**
     * Additional className
     */
    className?: string;
}

/**
 * Simple wrapper that adds opacity during optimistic updates
 *
 * @example
 * ```tsx
 * <OptimisticWrapper isOptimistic={isOptimistic}>
 *   <div>Content</div>
 * </OptimisticWrapper>
 * ```
 */
export function OptimisticWrapper({ isOptimistic, children, className }: OptimisticWrapperProps) {
    return (
        <div
            className={cn(
                'transition-opacity duration-200',
                isOptimistic && 'opacity-60',
                className,
            )}
        >
            {children}
        </div>
    );
}
