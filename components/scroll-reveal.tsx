'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
    getDirectionalVariants,
    getAnimationConfig,
    staggerContainerVariants,
    staggerItemVariants,
    DURATION,
} from '@/lib/animations';

export interface ScrollRevealProps {
    children: React.ReactNode;
    /**
     * Animation direction
     * @default 'up'
     */
    direction?: 'up' | 'down' | 'left' | 'right';
    /**
     * Delay before animation starts (in seconds)
     * @default 0
     */
    delay?: number;
    /**
     * Animation duration (in seconds)
     * @default DURATION.normal
     */
    duration?: number;
    /**
     * Whether to animate only once or every time element enters viewport
     * @default true
     */
    once?: boolean;
    /**
     * Enable stagger animation for children
     * @default false
     */
    stagger?: boolean;
    /**
     * Stagger delay between children (in seconds)
     * @default 0.1
     */
    staggerDelay?: number;
    /**
     * Threshold for Intersection Observer (0-1)
     * @default 0.1
     */
    threshold?: number;
    /**
     * Root margin for Intersection Observer
     * @default '0px'
     */
    rootMargin?: string;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Custom animation variants (overrides direction-based variants)
     */
    variants?: Variants;
    /**
     * ARIA role for semantic HTML
     */
    role?: string;
    /**
     * ARIA label for screen readers
     */
    'aria-label'?: string;
}

/**
 * ScrollReveal component that animates children when they enter the viewport
 * Uses Intersection Observer for performance and respects prefers-reduced-motion
 */
export function ScrollReveal({
    children,
    direction = 'up',
    delay = 0,
    duration = DURATION.normal,
    once = true,
    stagger = false,
    staggerDelay = 0.1,
    threshold = 0.1,
    rootMargin = '0px',
    className,
    variants: customVariants,
    role,
    'aria-label': ariaLabel,
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Create Intersection Observer
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        if (once && !hasAnimated) {
                            setHasAnimated(true);
                        }
                    } else if (!once) {
                        setIsInView(false);
                    }
                });
            },
            {
                threshold,
                rootMargin,
            },
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [threshold, rootMargin, once, hasAnimated]);

    // Get animation variants
    const baseVariants = customVariants || getDirectionalVariants(direction);

    // Apply animation config respecting reduced motion preference
    const animationConfig = getAnimationConfig({
        initial: 'hidden',
        animate: isInView || (once && hasAnimated) ? 'visible' : 'hidden',
        variants: stagger ? staggerContainerVariants : baseVariants,
    });

    // If stagger is enabled, wrap children
    if (stagger) {
        return (
            <motion.div
                ref={ref}
                className={className}
                {...animationConfig}
                transition={{
                    staggerChildren: staggerDelay,
                    delayChildren: delay,
                }}
                role={role}
                aria-label={ariaLabel}
            >
                {Array.isArray(children)
                    ? children.map((child, index) => (
                          <motion.div
                              key={index}
                              variants={getAnimationConfig(staggerItemVariants)}
                              transition={{ duration }}
                          >
                              {child}
                          </motion.div>
                      ))
                    : children}
            </motion.div>
        );
    }

    // Regular reveal without stagger
    return (
        <motion.div
            ref={ref}
            className={className}
            {...animationConfig}
            transition={{
                duration,
                delay,
            }}
            role={role}
            aria-label={ariaLabel}
        >
            {children}
        </motion.div>
    );
}

/**
 * Convenience component for fade-up reveal
 */
export function FadeUp(props: Omit<ScrollRevealProps, 'direction'>) {
    return <ScrollReveal {...props} direction="up" />;
}

/**
 * Convenience component for fade-down reveal
 */
export function FadeDown(props: Omit<ScrollRevealProps, 'direction'>) {
    return <ScrollReveal {...props} direction="down" />;
}

/**
 * Convenience component for fade-left reveal
 */
export function FadeLeft(props: Omit<ScrollRevealProps, 'direction'>) {
    return <ScrollReveal {...props} direction="left" />;
}

/**
 * Convenience component for fade-right reveal
 */
export function FadeRight(props: Omit<ScrollRevealProps, 'direction'>) {
    return <ScrollReveal {...props} direction="right" />;
}

/**
 * Convenience component for staggered children reveal
 */
export function StaggerReveal(props: Omit<ScrollRevealProps, 'stagger'>) {
    return <ScrollReveal {...props} stagger />;
}
