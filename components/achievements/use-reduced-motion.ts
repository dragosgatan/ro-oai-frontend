'use client';

import { useState, useEffect } from 'react';

import { subscribeToMediaQuery } from '@/lib/media-query';

/**
 * Custom hook to detect user's reduced motion preference.
 *
 * This hook listens to the `prefers-reduced-motion` media query and returns
 * whether the user prefers reduced motion. It updates automatically when
 * the user changes their system preference.
 *
 * Usage:
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 *
 * if (prefersReducedMotion) {
 *   // Skip or simplify animations
 * }
 * ```
 *
 * Requirements: 12.4 - Respect user's reduced motion preferences
 *
 * @returns {boolean} True if user prefers reduced motion, false otherwise
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            return false;
        }
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    useEffect(() => {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            return;
        }

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        // Update state when preference changes
        const handleChange = (event: MediaQueryListEvent) => {
            setPrefersReducedMotion(event.matches);
        };

        return subscribeToMediaQuery(mediaQuery, handleChange);
    }, []);

    return prefersReducedMotion;
}

/**
 * Get animation duration based on reduced motion preference.
 * Returns 0 for reduced motion, otherwise returns the provided duration.
 *
 * @param duration - The normal animation duration in milliseconds
 * @param prefersReducedMotion - Whether user prefers reduced motion
 * @returns The adjusted duration
 */
export function getAnimationDuration(duration: number, prefersReducedMotion: boolean): number {
    return prefersReducedMotion ? 0 : duration;
}

/**
 * Get animation config for framer-motion based on reduced motion preference.
 * Returns instant transition for reduced motion, otherwise returns normal config.
 *
 * @param prefersReducedMotion - Whether user prefers reduced motion
 * @returns Framer motion transition config
 */
export function getMotionTransition(prefersReducedMotion: boolean): {
    duration: number;
    ease?: [number, number, number, number];
} {
    if (prefersReducedMotion) {
        return { duration: 0 };
    }
    // Using cubic-bezier values for 'easeOut' to satisfy TypeScript
    return { duration: 0.3, ease: [0, 0, 0.2, 1] };
}

export default useReducedMotion;
