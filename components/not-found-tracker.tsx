'use client';

/**
 * Not Found Tracker Component
 *
 * Client component that tracks 404 page visits.
 * Used within the not-found page to track page not found events.
 *
 * **Validates: Requirement 10.4**
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';
import { AnalyticsEvents, sanitizeEventProperties } from '@/lib/analytics/events';
import { consentManager } from '@/lib/analytics';

/**
 * Not Found Tracker
 *
 * Tracks 404 page visits when mounted.
 * This component renders nothing but triggers tracking on mount.
 */
export function NotFoundTracker() {
    const pathname = usePathname();
    const { trackEvent } = useGTMTracker();

    useEffect(() => {
        // Check consent before tracking
        if (!consentManager.hasConsent('analytics')) {
            return;
        }

        try {
            // Sanitize URL to remove any sensitive data
            const sanitizedUrl = (pathname || '/unknown')
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
            console.error('[NotFoundTracker] Failed to track page not found:', trackingError);
        }
    }, [pathname, trackEvent]);

    // This component renders nothing
    return null;
}

export default NotFoundTracker;
