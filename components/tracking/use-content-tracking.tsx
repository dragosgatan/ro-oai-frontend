'use client';

/**
 * Content Tracking Hooks
 *
 * Hooks for tracking content interactions including:
 * - Scroll-triggered content views
 * - Content copy actions
 * - File downloads
 *
 * @example
 * ```tsx
 * // Scroll tracking
 * const { ref } = useContentViewTracking('hero-section');
 * <section ref={ref}>...</section>
 *
 * // Copy tracking
 * const { trackCopy } = useCopyTracking();
 * <button onClick={() => { copyToClipboard(text); trackCopy('code'); }}>Copy</button>
 *
 * // Download tracking
 * const { trackDownload } = useDownloadTracking();
 * <a href="/file.pdf" onClick={() => trackDownload('pdf', 'guide.pdf')}>Download</a>
 * ```
 */

import * as React from 'react';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';

/**
 * Hook for tracking when content sections come into view
 * Uses Intersection Observer for efficient scroll tracking
 */
export function useContentViewTracking(sectionId: string, options?: IntersectionObserverInit) {
    const { trackContentView } = useGTMTracker();
    const hasTrackedRef = React.useRef(false);
    const elementRef = React.useRef<HTMLElement | null>(null);

    React.useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    // Only track once when element becomes visible
                    if (entry.isIntersecting && !hasTrackedRef.current) {
                        trackContentView(sectionId);
                        hasTrackedRef.current = true;
                    }
                });
            },
            {
                threshold: 0.5, // Track when 50% of element is visible
                ...options,
            },
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [sectionId, trackContentView, options]);

    // Reset tracking when sectionId changes
    React.useEffect(() => {
        hasTrackedRef.current = false;
    }, [sectionId]);

    const setRef = React.useCallback((node: HTMLElement | null) => {
        elementRef.current = node;
    }, []);

    return { ref: setRef };
}

/**
 * Hook for tracking content copy actions
 */
export function useCopyTracking() {
    const { trackContentCopy } = useGTMTracker();

    const trackCopy = React.useCallback(
        (contentType: string) => {
            trackContentCopy(contentType);
        },
        [trackContentCopy],
    );

    return { trackCopy };
}

/**
 * Hook for tracking file downloads
 */
export function useDownloadTracking() {
    const { trackFileDownload } = useGTMTracker();

    const trackDownload = React.useCallback(
        (fileType: string, fileName: string) => {
            trackFileDownload(fileType, fileName);
        },
        [trackFileDownload],
    );

    return { trackDownload };
}

/**
 * Component wrapper for tracking content views
 */
export interface TrackableContentProps {
    children: React.ReactNode;
    sectionId: string;
    className?: string;
    as?: 'div' | 'section' | 'article' | 'main' | 'aside' | 'header' | 'footer' | 'nav';
    threshold?: number;
}

export function TrackableContent({
    children,
    sectionId,
    className,
    as = 'div',
    threshold = 0.5,
}: TrackableContentProps) {
    const { ref } = useContentViewTracking(sectionId, { threshold });

    const Element = as;

    return (
        <Element
            ref={ref as React.Ref<HTMLDivElement>}
            className={className}
            data-tracking-section={sectionId}
        >
            {children}
        </Element>
    );
}
