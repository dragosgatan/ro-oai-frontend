/**
 * Lazy-loaded Framer Motion components
 * Reduces initial bundle size by code-splitting animation library
 */

'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import type { MotionProps, AnimatePresenceProps } from 'framer-motion';

/**
 * Lazy-loaded motion.div component
 * Use this for non-critical animations that can be loaded after initial render
 */
export const LazyMotionDiv = dynamic(
    () => import('framer-motion').then((mod) => mod.motion.div as ComponentType<MotionProps>),
    {
        ssr: false,
        loading: () => <div />,
    },
);

/**
 * Lazy-loaded AnimatePresence component
 * Use this for exit animations that can be loaded after initial render
 */
export const LazyAnimatePresence = dynamic(
    () =>
        import('framer-motion').then(
            (mod) => mod.AnimatePresence as ComponentType<AnimatePresenceProps>,
        ),
    {
        ssr: false,
        loading: () => null,
    },
);

/**
 * Preload Framer Motion for better UX
 * Call this when you know animations will be needed soon
 */
export function preloadFramerMotion() {
    import('framer-motion');
}
