'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';
import { pageTransitionVariants, getAnimationConfig, DURATION } from '@/lib/animations';
import { Skeleton } from '@/components/ui/skeleton';

export interface PageTransitionProps {
    children: ReactNode;
    /**
     * Animation variant type
     * @default 'fade'
     */
    variant?: 'fade' | 'slide' | 'scale';
    /**
     * Custom animation variants
     */
    variants?: Variants;
    /**
     * Show loading skeleton during transition
     * @default false
     */
    showLoadingSkeleton?: boolean;
    /**
     * Custom loading component
     */
    loadingComponent?: ReactNode;
    /**
     * Additional CSS classes for the wrapper
     */
    className?: string;
}

/**
 * Get animation variants based on variant type
 */
const getVariantsByType = (variant: 'fade' | 'slide' | 'scale'): Variants => {
    switch (variant) {
        case 'fade':
            return {
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: { duration: DURATION.normal },
                },
                exit: {
                    opacity: 0,
                    transition: { duration: DURATION.fast },
                },
            };
        case 'slide':
            return {
                hidden: { opacity: 0, y: 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: DURATION.normal },
                },
                exit: {
                    opacity: 0,
                    y: -20,
                    transition: { duration: DURATION.fast },
                },
            };
        case 'scale':
            return {
                hidden: { opacity: 0, scale: 0.95 },
                visible: {
                    opacity: 1,
                    scale: 1,
                    transition: { duration: DURATION.normal },
                },
                exit: {
                    opacity: 0,
                    scale: 0.95,
                    transition: { duration: DURATION.fast },
                },
            };
        default:
            return pageTransitionVariants;
    }
};

/**
 * Default loading skeleton component
 */
function DefaultLoadingSkeleton() {
    return (
        <div className="space-y-4 p-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    );
}

/**
 * PageTransition component that wraps page content with smooth transitions
 * Uses AnimatePresence from Framer Motion and respects prefers-reduced-motion
 */
export function PageTransition({
    children,
    variant = 'fade',
    variants: customVariants,
    showLoadingSkeleton = false,
    loadingComponent,
    className = '',
}: PageTransitionProps) {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);

    // Get animation variants
    const animationVariants = customVariants || getVariantsByType(variant);
    const animationConfig = getAnimationConfig({
        initial: 'hidden',
        animate: 'visible',
        exit: 'exit',
        variants: animationVariants,
    });

    // Handle loading state
    useEffect(() => {
        if (showLoadingSkeleton) {
            setIsLoading(true);
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 100); // Brief loading state for skeleton

            return () => clearTimeout(timer);
        }
    }, [pathname, showLoadingSkeleton]);

    return (
        <>
            {/* Screen reader announcement for page changes */}
            <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                {isLoading ? 'Loading page content' : 'Page content loaded'}
            </div>

            <AnimatePresence mode="wait" initial={false}>
                <motion.div key={pathname} className={className} {...animationConfig}>
                    {isLoading && showLoadingSkeleton
                        ? loadingComponent || <DefaultLoadingSkeleton />
                        : children}
                </motion.div>
            </AnimatePresence>
        </>
    );
}

/**
 * Convenience component for fade transition
 */
export function FadeTransition(props: Omit<PageTransitionProps, 'variant'>) {
    return <PageTransition {...props} variant="fade" />;
}

/**
 * Convenience component for slide transition
 */
export function SlideTransition(props: Omit<PageTransitionProps, 'variant'>) {
    return <PageTransition {...props} variant="slide" />;
}

/**
 * Convenience component for scale transition
 */
export function ScaleTransition(props: Omit<PageTransitionProps, 'variant'>) {
    return <PageTransition {...props} variant="scale" />;
}

/**
 * PageTransitionLayout component for use in layout files
 * Automatically wraps children with page transitions
 */
export function PageTransitionLayout({ children, ...props }: PageTransitionProps) {
    return (
        <PageTransition {...props}>
            <div className="min-h-screen">{children}</div>
        </PageTransition>
    );
}
