'use client';

/**
 * Error Tracking Provider
 *
 * Provides global error tracking for JavaScript errors, API errors, and validation errors.
 * Integrates with GTM for analytics tracking.
 *
 * **Validates: Requirements 10.1, 10.2, 10.5**
 */

import { useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';
import { AnalyticsEvents, sanitizeEventProperties } from '@/lib/analytics/events';
import { consentManager } from '@/lib/analytics';

// ============================================================================
// Types
// ============================================================================

export interface ErrorTrackingContextValue {
    /** Track a JavaScript error */
    trackJSError: (error: Error, componentStack?: string) => void;
    /** Track an API error */
    trackAPIError: (endpoint: string, statusCode: number, message: string) => void;
    /** Track a validation error */
    trackValidationError: (field: string, errorType: string, message?: string) => void;
}

export interface ErrorTrackingProviderProps {
    children: ReactNode;
}

// ============================================================================
// Context
// ============================================================================

const ErrorTrackingContext = createContext<ErrorTrackingContextValue | null>(null);

/**
 * Hook to access error tracking functions
 */
export function useErrorTracking(): ErrorTrackingContextValue {
    const context = useContext(ErrorTrackingContext);
    if (!context) {
        throw new Error('useErrorTracking must be used within an ErrorTrackingProvider');
    }
    return context;
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Error Tracking Provider
 *
 * Sets up global error handlers and provides error tracking functions to children.
 */
export function ErrorTrackingProvider({ children }: ErrorTrackingProviderProps) {
    const { trackEvent } = useGTMTracker();

    /**
     * Check if tracking is allowed based on consent
     */
    const canTrack = useCallback(() => {
        return consentManager.hasConsent('analytics');
    }, []);

    /**
     * Track a JavaScript error
     * **Validates: Requirement 10.1**
     */
    const trackJSError = useCallback(
        (error: Error, componentStack?: string) => {
            if (!canTrack()) return;

            try {
                const errorData = {
                    event: AnalyticsEvents.ERROR_OCCURRED,
                    category: 'error',
                    errorType: error.name || 'Error',
                    errorMessage: error.message || 'Unknown error',
                    errorStack: componentStack || error.stack?.substring(0, 500),
                    severity: 'high',
                };

                // Sanitize to remove any PII that might be in error messages
                const sanitizedData = sanitizeEventProperties(errorData);

                trackEvent(sanitizedData);
            } catch (trackingError) {
                // Log but don't break the user experience
                console.error('[ErrorTracking] Failed to track JS error:', trackingError);
            }
        },
        [trackEvent, canTrack],
    );

    /**
     * Track an API error
     * **Validates: Requirement 10.2**
     */
    const trackAPIError = useCallback(
        (endpoint: string, statusCode: number, message: string) => {
            if (!canTrack()) return;

            try {
                // Sanitize endpoint to remove any sensitive data
                const sanitizedEndpoint = endpoint
                    .replace(/\/\d+/g, '/:id') // Replace numeric IDs
                    .replace(/\?.*$/, ''); // Remove query params

                const errorData = {
                    event: AnalyticsEvents.API_ERROR,
                    category: 'error',
                    errorType: `HTTP_${statusCode}`,
                    errorMessage: message || `API request failed with status ${statusCode}`,
                    endpoint: sanitizedEndpoint,
                    statusCode,
                    severity:
                        statusCode >= 500 ? 'critical' : statusCode >= 400 ? 'high' : 'medium',
                };

                // Sanitize to remove any PII
                const sanitizedData = sanitizeEventProperties(errorData);

                trackEvent(sanitizedData);
            } catch (trackingError) {
                // Log but don't break the user experience
                console.error('[ErrorTracking] Failed to track API error:', trackingError);
            }
        },
        [trackEvent, canTrack],
    );

    /**
     * Track a validation error
     * **Validates: Requirement 10.5**
     */
    const trackValidationError = useCallback(
        (field: string, errorType: string, message?: string) => {
            if (!canTrack()) return;

            try {
                const errorData = {
                    event: AnalyticsEvents.VALIDATION_ERROR,
                    category: 'error',
                    errorType,
                    errorMessage: message || `Validation failed for field: ${field}`,
                    field,
                    severity: 'low',
                };

                // Sanitize to remove any PII
                const sanitizedData = sanitizeEventProperties(errorData);

                trackEvent(sanitizedData);
            } catch (trackingError) {
                // Log but don't break the user experience
                console.error('[ErrorTracking] Failed to track validation error:', trackingError);
            }
        },
        [trackEvent, canTrack],
    );

    /**
     * Global error handler for uncaught JavaScript errors
     */
    useEffect(() => {
        const handleGlobalError = (event: ErrorEvent) => {
            trackJSError(
                new Error(event.message),
                `at ${event.filename}:${event.lineno}:${event.colno}`,
            );
        };

        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error =
                event.reason instanceof Error
                    ? event.reason
                    : new Error(String(event.reason) || 'Unhandled promise rejection');

            trackJSError(error, 'Unhandled Promise Rejection');
        };

        // Add global error listeners
        window.addEventListener('error', handleGlobalError);
        window.addEventListener('unhandledrejection', handleUnhandledRejection);

        return () => {
            window.removeEventListener('error', handleGlobalError);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        };
    }, [trackJSError]);

    const contextValue: ErrorTrackingContextValue = {
        trackJSError,
        trackAPIError,
        trackValidationError,
    };

    return (
        <ErrorTrackingContext.Provider value={contextValue}>
            {children}
        </ErrorTrackingContext.Provider>
    );
}

export default ErrorTrackingProvider;
