'use client';

/**
 * Skip to Main Content Link
 * Provides keyboard users with a way to skip navigation and jump directly to main content
 * Meets WCAG 2.1 AA requirement 2.4.1 (Bypass Blocks)
 */
export function SkipToContent() {
    return (
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-all"
        >
            Skip to main content
        </a>
    );
}
