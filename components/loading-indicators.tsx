import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Page Loading Indicator
 * Full-page centered loading spinner with optional message
 */
export function PageLoadingIndicator({
    message = 'Se încarcă...',
    className,
}: {
    message?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center min-h-[400px] gap-4',
                className,
            )}
        >
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            {message && (
                <p className="text-muted-foreground text-sm font-medium animate-pulse">{message}</p>
            )}
        </div>
    );
}

/**
 * Inline Loading Indicator
 * Smaller loading spinner for inline use
 */
export function InlineLoadingIndicator({
    message,
    size = 'md',
    className,
}: {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
            {message && <span className="text-muted-foreground text-sm">{message}</span>}
        </div>
    );
}

/**
 * Infinite Scroll Loading Indicator
 * Loading indicator for bottom of lists with infinite scroll
 */
export function InfiniteScrollLoadingIndicator({ className }: { className?: string }) {
    return (
        <div className={cn('flex justify-center py-8', className)}>
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Se încarcă mai multe...</p>
            </div>
        </div>
    );
}

/**
 * Spinner Component
 * Reusable spinner for various contexts
 */
export function Spinner({
    size = 'md',
    className,
}: {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}) {
    const sizeClasses = {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
    };

    return <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />;
}

/**
 * Loading Overlay
 * Semi-transparent overlay with loading spinner
 */
export function LoadingOverlay({
    message = 'Se încarcă...',
    show = true,
}: {
    message?: string;
    show?: boolean;
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 rounded-lg bg-card p-8 shadow-lg border-2">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-foreground font-medium">{message}</p>
            </div>
        </div>
    );
}

/**
 * Dots Loading Indicator
 * Three animated dots for subtle loading states
 */
export function DotsLoadingIndicator({ className }: { className?: string }) {
    return (
        <div className={cn('flex items-center gap-1', className)}>
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-primary animate-bounce" />
        </div>
    );
}

/**
 * Progress Bar Loading Indicator
 * Indeterminate progress bar for loading states
 */
export function ProgressBarLoadingIndicator({ className }: { className?: string }) {
    return (
        <div className={cn('w-full h-1 bg-muted overflow-hidden rounded-full', className)}>
            <div
                className="h-full bg-primary animate-shimmer"
                style={{
                    backgroundImage:
                        'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)',
                    backgroundSize: '200% 100%',
                }}
            />
        </div>
    );
}

/**
 * Card Loading State
 * Loading state for card components
 */
export function CardLoadingState({
    message = 'Se încarcă...',
    className,
}: {
    message?: string;
    className?: string;
}) {
    return (
        <div
            className={cn('flex flex-col items-center justify-center p-12 text-center', className)}
        >
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-sm">{message}</p>
        </div>
    );
}

/**
 * Button Loading Spinner
 * Small spinner for button loading states (already handled by Button component)
 * This is exported for custom use cases
 */
export function ButtonLoadingSpinner({ className }: { className?: string }) {
    return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />;
}
