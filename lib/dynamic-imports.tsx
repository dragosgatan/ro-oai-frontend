/**
 * Centralized dynamic imports for code splitting
 * Reduces initial bundle size by lazy loading heavy components
 */

import dynamic from 'next/dynamic';

/**
 * Lazy-loaded animation components
 * These are loaded on-demand to reduce initial bundle size
 */

export const DynamicScrollReveal = dynamic(
    () => import('@/components/scroll-reveal').then((mod) => ({ default: mod.ScrollReveal })),
    {
        ssr: false,
        loading: () => <div />,
    },
);

export const DynamicPageTransition = dynamic(
    () => import('@/components/page-transition').then((mod) => ({ default: mod.PageTransition })),
    {
        ssr: false,
        loading: () => <div />,
    },
);

export const DynamicHeroSection = dynamic(
    () => import('@/components/hero-section').then((mod) => ({ default: mod.HeroSection })),
    {
        ssr: true, // Keep SSR for SEO
    },
);

export const DynamicStatsCounter = dynamic(
    () => import('@/components/stats-counter').then((mod) => ({ default: mod.StatsCounter })),
    {
        ssr: false,
        loading: () => (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="flex flex-col items-center text-center p-6 rounded-lg bg-card border animate-pulse"
                    >
                        <div className="mb-4 p-3 rounded-full bg-muted h-14 w-14" />
                        <div className="h-12 w-24 bg-muted rounded mb-2" />
                        <div className="h-4 w-32 bg-muted rounded" />
                    </div>
                ))}
            </div>
        ),
    },
);

/**
 * Lazy-loaded form components
 * These are typically used in modals or below-the-fold content
 */

export const DynamicAvatarCropper = dynamic(
    () => import('@/components/avatar-cropper').then((mod) => ({ default: mod.default })),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        ),
    },
);

/**
 * Lazy-loaded chart/visualization components
 * These are heavy and should only be loaded when needed
 */

export const DynamicLeaderboardView = dynamic(
    () => import('@/components/leaderboard-view').then((mod) => ({ default: mod.LeaderboardView })),
    {
        ssr: true, // Keep SSR for content
        loading: () => (
            <div className="space-y-4">
                <div className="h-48 bg-muted animate-pulse rounded-lg" />
                <div className="h-96 bg-muted animate-pulse rounded-lg" />
            </div>
        ),
    },
);

export const DynamicProfileView = dynamic(
    () => import('@/components/profile-view').then((mod) => ({ default: mod.ProfileView })),
    {
        ssr: true,
        loading: () => (
            <div className="space-y-6">
                <div className="h-64 bg-muted animate-pulse rounded-lg" />
                <div className="h-96 bg-muted animate-pulse rounded-lg" />
            </div>
        ),
    },
);

/**
 * Preload functions for better UX
 * Call these when you know a component will be needed soon
 */

export function preloadAnimationComponents() {
    import('@/components/scroll-reveal');
    import('@/components/page-transition');
    import('framer-motion');
}

export function preloadFormComponents() {
    import('@/components/avatar-cropper');
}

export function preloadVisualizationComponents() {
    import('@/components/leaderboard-view');
    import('@/components/profile-view');
}

/**
 * Preload all heavy components
 * Use this sparingly, only when you know the user will need them
 */
export function preloadAllHeavyComponents() {
    preloadAnimationComponents();
    preloadFormComponents();
    preloadVisualizationComponents();
}
