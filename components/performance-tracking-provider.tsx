'use client';

/**
 * Performance Tracking Provider
 *
 * Provides performance tracking for slow page loads and 404 pages.
 * Integrates with GTM for analytics tracking.
 *
 * **Validates: Requirements 10.3, 10.4**
 */

import { useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';
import { AnalyticsEvents, sanitizeEventProperties } from '@/lib/analytics/events';
import { consentManager } from '@/lib/analytics';

// ============================================================================
// Constants
// ============================================================================

/**
 * Performance thresholds in milliseconds
 */
export const PERFORMANCE_THRESHOLDS = {
    /** Slow page load threshold (3 seconds) */
    SLOW_PAGE_LOAD: 3000,
    /** Very slow page load threshold (5 seconds) */
    VERY_SLOW_PAGE_LOAD: 5000,
    /** Critical page load threshold (10 seconds) */
    CRITICAL_PAGE_LOAD: 10000,
} as const;

// ============================================================================
// Types
// ============================================================================

export interface PerformanceTrackingContextValue {
    /** Track a slow page load */
    trackSlowPageLoad: (loadTime: number, url?: string) => void;
    /** Track a 404 page not found */
    trackPageNotFound: (attemptedUrl: string) => void;
}

export interface PerformanceTrackingProviderProps {
    children: ReactNode;
    /** Custom slow page load threshold in ms (default: 3000) */
    slowLoadThreshold?: number;
}

// ============================================================================
// Context
// ============================================================================

const PerformanceTrackingContext = createContext<PerformanceTrackingContextValue | null>(null);

/**
 * Hook to access performance tracking functions
 */
export function usePerformanceTracking(): PerformanceTrackingContextValue {
    const context = useContext(PerformanceTrackingContext);
    if (!context) {
        throw new Error('usePerformanceTracking must be used within a PerformanceTrackingProvider');
    }
    return context;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get severity based on load time
 */
function getLoadTimeSeverity(loadTime: number): 'low' | 'medium' | 'high' | 'critical' {
    if (loadTime >= PERFORMANCE_THRESHOLDS.CRITICAL_PAGE_LOAD) {
        return 'critical';
    }
    if (loadTime >= PERFORMANCE_THRESHOLDS.VERY_SLOW_PAGE_LOAD) {
        return 'high';
    }
    if (loadTime >= PERFORMANCE_THRESHOLDS.SLOW_PAGE_LOAD) {
        return 'medium';
    }
    return 'low';
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Performance Tracking Provider
 *
 * Sets up performance monitoring and provides tracking functions to children.
 */
export function PerformanceTrackingProvider({
    children,
    slowLoadThreshold = PERFORMANCE_THRESHOLDS.SLOW_PAGE_LOAD,
}: PerformanceTrackingProviderProps) {
    const { trackEvent } = useGTMTracker();
    const pathname = usePathname();

    /**
     * Check if tracking is allowed based on consent
     */
    const canTrack = useCallback(() => {
        return consentManager.hasConsent('analytics');
    }, []);

    /**
     * Track a slow page load
     * **Validates: Requirement 10.3**
     */
    const trackSlowPageLoad = useCallback(
        (loadTime: number, url?: string) => {
            if (!canTrack()) return;

            try {
                const performanceData = {
                    event: AnalyticsEvents.SLOW_PAGE_LOAD,
                    category: 'performance',
                    errorType: 'slow_page_load',
                    errorMessage: `Page load exceeded ${slowLoadThreshold}ms threshold`,
                    loadTime,
                    attemptedUrl: url || pathname || '/',
                    severity: getLoadTimeSeverity(loadTime),
                    threshold: slowLoadThreshold,
                };

                // Sanitize to remove any PII
                const sanitizedData = sanitizeEventProperties(performanceData);

                trackEvent(sanitizedData);
            } catch (trackingError) {
                // Log but don't break the user experience
                console.error(
                    '[PerformanceTracking] Failed to track slow page load:',
                    trackingError,
                );
            }
        },
        [trackEvent, canTrack, pathname, slowLoadThreshold],
    );

    /**
     * Track a 404 page not found
     * **Validates: Requirement 10.4**
     */
    const trackPageNotFound = useCallback(
        (attemptedUrl: string) => {
            if (!canTrack()) return;

            try {
                // Sanitize URL to remove any sensitive data
                const sanitizedUrl = attemptedUrl
                    .replace(/\/\d+/g, '/:id') // Replace numeric IDs
                    .replace(/\?.*$/, ''); // Remove query params

                const notFoundData = {
                    event: AnalyticsEvents.PAGE_NOT_FOUND,
                    category: 'error',
                    errorType: 'page_not_found',
                    errorMessage: `Page not found: ${sanitizedUrl}`,
                    attemptedUrl: sanitizedUrl,
                    severity: 'medium',
                };

                // Sanitize to remove any PII
                const sanitizedData = sanitizeEventProperties(notFoundData);

                trackEvent(sanitizedData);
            } catch (trackingError) {
                // Log but don't break the user experience
                console.error(
                    '[PerformanceTracking] Failed to track page not found:',
                    trackingError,
                );
            }
        },
        [trackEvent, canTrack],
    );

    /**
     * Monitor page load performance using Performance API
     */
    useEffect(() => {
        if (typeof window === 'undefined' || !window.performance) return;

        const measurePageLoad = () => {
            // Use Navigation Timing API
            const navigation = performance.getEntriesByType(
                'navigation',
            )[0] as PerformanceNavigationTiming;

            if (navigation) {
                const loadTime = navigation.loadEventEnd - navigation.startTime;

                // Only track if load time exceeds threshold
                if (loadTime > slowLoadThreshold) {
                    trackSlowPageLoad(Math.round(loadTime), pathname || '/');
                }
            }
        };

        // Check if page is already loaded
        if (document.readyState === 'complete') {
            // Use setTimeout to ensure navigation timing is available
            setTimeout(measurePageLoad, 0);
        } else {
            // Wait for page load
            window.addEventListener('load', measurePageLoad);
            return () => window.removeEventListener('load', measurePageLoad);
        }
    }, [pathname, slowLoadThreshold, trackSlowPageLoad]);

    const contextValue: PerformanceTrackingContextValue = {
        trackSlowPageLoad,
        trackPageNotFound,
    };

    return (
        <PerformanceTrackingContext.Provider value={contextValue}>
            {children}
        </PerformanceTrackingContext.Provider>
    );
}

export default PerformanceTrackingProvider;
