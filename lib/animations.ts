/**
 * Animation utilities and variants for Framer Motion
 * Provides reusable animation configurations and helper functions
 */

import { Variants, Transition } from 'framer-motion';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Animation duration constants (in seconds)
 */
export const DURATION = {
    fast: 0.15,
    normal: 0.3,
    slow: 0.5,
    slower: 0.8,
} as const;

/**
 * Custom easing functions
 */
export const EASING = {
    easeInOut: [0.4, 0, 0.2, 1] as number[],
    easeOut: [0, 0, 0.2, 1] as number[],
    easeIn: [0.4, 0, 1, 1] as number[],
    spring: [0.34, 1.56, 0.64, 1] as number[],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if user prefers reduced motion
 * @returns true if user has prefers-reduced-motion enabled
 */
export const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation configuration respecting user's motion preferences
 * @param animation - The animation configuration
 * @returns Animation config or disabled animation if user prefers reduced motion
 */
export const getAnimationConfig = <T extends Record<string, any>>(animation: T): T => {
    if (prefersReducedMotion()) {
        // Return a version without animations
        return {
            ...animation,
            initial: false,
            animate: false,
            exit: false,
        } as T;
    }
    return animation;
};

/**
 * Create a transition with default easing
 * @param duration - Duration in seconds
 * @param delay - Delay in seconds
 * @param easing - Easing function
 * @returns Transition configuration
 */
export const createTransition = (
    duration: number = DURATION.normal,
    delay: number = 0,
    easing: number[] = EASING.easeInOut,
): Transition => ({
    duration,
    delay,
    ease: easing as any,
});

/**
 * Create a spring transition
 * @param stiffness - Spring stiffness
 * @param damping - Spring damping
 * @param mass - Spring mass
 * @returns Spring transition configuration
 */
export const createSpringTransition = (
    stiffness: number = 100,
    damping: number = 10,
    mass: number = 1,
): Transition => ({
    type: 'spring',
    stiffness,
    damping,
    mass,
});

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

/**
 * Fade animation variants
 */
export const fadeVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
};

/**
 * Fade up animation variants (element slides up while fading in)
 * Uses transform for GPU acceleration
 */
export const fadeUpVariants: Variants = {
    hidden: { opacity: 0, y: 20, willChange: 'transform, opacity' },
    visible: {
        opacity: 1,
        y: 0,
        willChange: 'auto',
        transition: createTransition(DURATION.normal),
    },
    exit: {
        opacity: 0,
        y: 20,
        willChange: 'transform, opacity',
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Fade down animation variants (element slides down while fading in)
 * Uses transform for GPU acceleration
 */
export const fadeDownVariants: Variants = {
    hidden: { opacity: 0, y: -20, willChange: 'transform, opacity' },
    visible: {
        opacity: 1,
        y: 0,
        willChange: 'auto',
        transition: createTransition(DURATION.normal),
    },
    exit: {
        opacity: 0,
        y: -20,
        willChange: 'transform, opacity',
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Fade left animation variants (element slides from right while fading in)
 * Uses transform for GPU acceleration
 */
export const fadeLeftVariants: Variants = {
    hidden: { opacity: 0, x: 20, willChange: 'transform, opacity' },
    visible: {
        opacity: 1,
        x: 0,
        willChange: 'auto',
        transition: createTransition(DURATION.normal),
    },
    exit: {
        opacity: 0,
        x: 20,
        willChange: 'transform, opacity',
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Fade right animation variants (element slides from left while fading in)
 * Uses transform for GPU acceleration
 */
export const fadeRightVariants: Variants = {
    hidden: { opacity: 0, x: -20, willChange: 'transform, opacity' },
    visible: {
        opacity: 1,
        x: 0,
        willChange: 'auto',
        transition: createTransition(DURATION.normal),
    },
    exit: {
        opacity: 0,
        x: -20,
        willChange: 'transform, opacity',
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Scale animation variants (element scales up while fading in)
 * Uses transform for GPU acceleration
 */
export const scaleVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, willChange: 'transform, opacity' },
    visible: {
        opacity: 1,
        scale: 1,
        willChange: 'auto',
        transition: createTransition(DURATION.normal),
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        willChange: 'transform, opacity',
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Scale up animation variants (element scales from small)
 * Uses transform for GPU acceleration
 */
export const scaleUpVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8, willChange: 'transform, opacity' },
    visible: {
        opacity: 1,
        scale: 1,
        willChange: 'auto',
        transition: createSpringTransition(100, 10),
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        willChange: 'transform, opacity',
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Slide up animation variants (element slides up from bottom)
 */
export const slideUpVariants: Variants = {
    hidden: { y: '100%' },
    visible: {
        y: 0,
        transition: createTransition(DURATION.normal, 0, EASING.easeOut),
    },
    exit: {
        y: '100%',
        transition: createTransition(DURATION.fast, 0, EASING.easeIn),
    },
};

/**
 * Slide down animation variants (element slides down from top)
 */
export const slideDownVariants: Variants = {
    hidden: { y: '-100%' },
    visible: {
        y: 0,
        transition: createTransition(DURATION.normal, 0, EASING.easeOut),
    },
    exit: {
        y: '-100%',
        transition: createTransition(DURATION.fast, 0, EASING.easeIn),
    },
};

/**
 * Slide left animation variants (element slides from right)
 */
export const slideLeftVariants: Variants = {
    hidden: { x: '100%' },
    visible: {
        x: 0,
        transition: createTransition(DURATION.normal, 0, EASING.easeOut),
    },
    exit: {
        x: '100%',
        transition: createTransition(DURATION.fast, 0, EASING.easeIn),
    },
};

/**
 * Slide right animation variants (element slides from left)
 */
export const slideRightVariants: Variants = {
    hidden: { x: '-100%' },
    visible: {
        x: 0,
        transition: createTransition(DURATION.normal, 0, EASING.easeOut),
    },
    exit: {
        x: '-100%',
        transition: createTransition(DURATION.fast, 0, EASING.easeIn),
    },
};

/**
 * Stagger container variants for animating children sequentially
 */
export const staggerContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            staggerChildren: 0.05,
            staggerDirection: -1,
        },
    },
};

/**
 * Stagger item variants (to be used with staggerContainerVariants)
 * Uses transform for GPU acceleration
 */
export const staggerItemVariants: Variants = {
    hidden: { opacity: 0, y: 20, willChange: 'transform, opacity' },
    visible: {
        opacity: 1,
        y: 0,
        willChange: 'auto',
        transition: createTransition(DURATION.normal),
    },
    exit: {
        opacity: 0,
        y: 20,
        willChange: 'transform, opacity',
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Rotate animation variants
 */
export const rotateVariants: Variants = {
    hidden: { opacity: 0, rotate: -10 },
    visible: {
        opacity: 1,
        rotate: 0,
        transition: createTransition(DURATION.normal),
    },
    exit: {
        opacity: 0,
        rotate: 10,
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Bounce animation variants
 */
export const bounceVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: createSpringTransition(200, 10),
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Shake animation (for error states)
 */
export const shakeVariants: Variants = {
    shake: {
        x: [-10, 10, -10, 10, 0],
        transition: {
            duration: 0.4,
        },
    },
};

/**
 * Pulse animation (for highlighting)
 */
export const pulseVariants: Variants = {
    pulse: {
        scale: [1, 1.05, 1],
        transition: {
            duration: 0.6,
            repeat: Infinity,
            repeatType: 'loop' as const,
        },
    },
};

// ============================================================================
// PRESET ANIMATIONS
// ============================================================================

/**
 * Get animation variants by direction
 * @param direction - Animation direction
 * @returns Animation variants
 */
export const getDirectionalVariants = (direction: 'up' | 'down' | 'left' | 'right'): Variants => {
    switch (direction) {
        case 'up':
            return fadeUpVariants;
        case 'down':
            return fadeDownVariants;
        case 'left':
            return fadeLeftVariants;
        case 'right':
            return fadeRightVariants;
        default:
            return fadeUpVariants;
    }
};

/**
 * Page transition variants
 * Uses transform for GPU acceleration
 */
export const pageTransitionVariants: Variants = {
    hidden: { opacity: 0, y: 20, willChange: 'transform, opacity' },
    visible: {
        opacity: 1,
        y: 0,
        willChange: 'auto',
        transition: createTransition(DURATION.normal),
    },
    exit: {
        opacity: 0,
        y: -20,
        willChange: 'transform, opacity',
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Modal/Dialog animation variants
 * Uses transform for GPU acceleration
 */
export const modalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20, willChange: 'transform, opacity' },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        willChange: 'auto',
        transition: createTransition(DURATION.normal),
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        willChange: 'transform, opacity',
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Overlay/Backdrop animation variants
 */
export const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: createTransition(DURATION.fast),
    },
    exit: {
        opacity: 0,
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Drawer animation variants (slide from side)
 */
export const drawerVariants: Variants = {
    hidden: { x: '100%' },
    visible: {
        x: 0,
        transition: createTransition(DURATION.normal, 0, EASING.easeOut),
    },
    exit: {
        x: '100%',
        transition: createTransition(DURATION.normal, 0, EASING.easeIn),
    },
};

/**
 * Toast notification animation variants
 * Uses transform for GPU acceleration
 */
export const toastVariants: Variants = {
    hidden: { opacity: 0, y: -20, scale: 0.95, willChange: 'transform, opacity' },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        willChange: 'auto',
        transition: createSpringTransition(150, 15),
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        willChange: 'transform, opacity',
        transition: createTransition(DURATION.fast),
    },
};

/**
 * Language switch animation variants
 * Smooth fade transition for text content changes
 * Uses opacity for smooth transitions without layout shift
 */
export const languageSwitchVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: createTransition(DURATION.normal),
    },
    exit: {
        opacity: 0,
        transition: createTransition(DURATION.fast),
    },
};

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Debounce function for performance optimization
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

/**
 * Throttle function for performance optimization
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number,
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

/**
 * Request animation frame wrapper for smooth animations
 * @param callback - Callback function
 * @returns Cancel function
 */
export const rafThrottle = <T extends (...args: any[]) => any>(
    callback: T,
): ((...args: Parameters<T>) => void) => {
    let rafId: number | null = null;

    return (...args: Parameters<T>) => {
        if (rafId !== null) return;

        rafId = requestAnimationFrame(() => {
            callback(...args);
            rafId = null;
        });
    };
};

// ============================================================================
// TABLE SCROLL UTILITIES
// ============================================================================

/**
 * Utility to handle horizontal scroll indicators for tables on mobile
 * Adds/removes classes based on scroll position
 */
export const handleTableScroll = (element: HTMLElement) => {
    if (!element) return;

    const isScrolledToStart = element.scrollLeft <= 5;
    const isScrolledToEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 5;

    if (isScrolledToStart) {
        element.classList.remove('scrolled-start');
    } else {
        element.classList.add('scrolled-start');
    }

    if (isScrolledToEnd) {
        element.classList.add('scrolled-end');
    } else {
        element.classList.remove('scrolled-end');
    }
};

/**
 * Setup scroll listener for table containers with debouncing
 * Returns cleanup function
 */
export const setupTableScrollListener = (element: HTMLElement): (() => void) => {
    if (!element) return () => {};

    // Use RAF throttle for smooth performance
    const handleScroll = rafThrottle(() => handleTableScroll(element));

    // Initial check
    handleTableScroll(element);

    // Add listener with passive flag for better scroll performance
    element.addEventListener('scroll', handleScroll, { passive: true });

    // Return cleanup function
    return () => {
        element.removeEventListener('scroll', handleScroll);
    };
};
