'use client';

/**
 * GTM Event Tracker Hook
 *
 * Centralized React hook for tracking user interactions via Google Tag Manager.
 * Automatically includes timestamp, page path, and authentication status with every event.
 *
 * @example
 * ```typescript
 * import { useGTMTracker } from '@/hooks/use-gtm-tracker';
 *
 * function MyComponent() {
 *   const { trackEvent, trackNavigation, trackButtonClick } = useGTMTracker();
 *
 *   const handleClick = () => {
 *     trackButtonClick('submit-btn', 'form-context');
 *   };
 *
 *   return <button onClick={handleClick}>Submit</button>;
 * }
 * ```
 */

import { useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { analytics, AnalyticsEvents, consentManager } from '@/lib/analytics';
import { sanitizeEventProperties } from '@/lib/analytics/events';

// ============================================================================
// Types
// ============================================================================

export interface GTMEvent {
    event: string;
    category?: string;
    action?: string;
    label?: string;
    value?: number;
    timestamp: string;
    pagePath: string;
    isAuthenticated: boolean;
    [key: string]: any;
}

export interface UseGTMTrackerReturn {
    /** Track a generic event */
    trackEvent: (event: Omit<GTMEvent, 'timestamp' | 'pagePath' | 'isAuthenticated'>) => void;
    /** Track navigation between pages */
    trackNavigation: (from: string, to: string, label?: string, context?: string) => void;
    /** Track button clicks */
    trackButtonClick: (buttonId: string, context?: string) => void;
    /** Track form submissions */
    trackFormSubmit: (formType: string, success: boolean) => void;
    /** Track modal interactions */
    trackModalInteraction: (modalType: string, action: 'open' | 'close') => void;
    /** Track UI interactions (tabs, accordions, etc.) */
    trackUIInteraction: (componentType: string, value: string) => void;
    /** Track content views (scroll-triggered sections) */
    trackContentView: (sectionId: string) => void;
    /** Track content copy actions */
    trackContentCopy: (contentType: string) => void;
    /** Track file downloads */
    trackFileDownload: (fileType: string, fileName: string) => void;
    /** Track search queries */
    trackSearch: (query: string, resultCount: number) => void;
    /** Track filter applications */
    trackFilter: (filterType: string, value: string) => void;
    /** Track errors */
    trackError: (errorType: string, message: string, severity?: string) => void;
    /** Track competition events */
    trackCompetition: (
        action: 'view' | 'join' | 'leave' | 'share' | 'leaderboard_view' | 'submission',
        competitionId: string,
        additionalProps?: Record<string, any>,
    ) => void;
    /** Track problem events */
    trackProblem: (
        action: 'view' | 'start' | 'submit' | 'editorial_view' | 'question_ask' | 'comments_view',
        problemId: string,
        additionalProps?: Record<string, any>,
    ) => void;
    /** Track leaderboard events */
    trackLeaderboard: (
        action: 'view' | 'tab_change' | 'profile_click' | 'filter' | 'paginate',
        leaderboardType: string,
        additionalProps?: Record<string, any>,
    ) => void;
    /** Track onboarding events */
    trackOnboarding: (
        action: 'start' | 'step_complete' | 'complete' | 'abandon',
        additionalProps?: Record<string, any>,
    ) => void;
    /** Track profile events */
    trackProfile: (
        action:
            | 'view'
            | 'settings_update'
            | 'avatar_change'
            | 'institution_membership'
            | 'achievements_view'
            | 'showcase_update',
        additionalProps?: Record<string, any>,
    ) => void;
    /** Track authentication events */
    trackAuth: (
        action: 'login' | 'logout' | 'sign_up',
        additionalProps?: Record<string, any>,
    ) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for tracking GTM events with automatic context enrichment
 */
export function useGTMTracker(): UseGTMTrackerReturn {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    const isAuthenticated = status === 'authenticated';
    const userId = (session as any)?.id as string | undefined;

    /**
     * Get base event properties that are included with every event
     */
    const getBaseProperties = useCallback(() => {
        return {
            timestamp: new Date().toISOString(),
            pagePath: pathname || '/',
            isAuthenticated,
            ...(userId && { userId }),
        };
    }, [pathname, isAuthenticated, userId]);

    /**
     * Check if tracking is allowed based on consent
     */
    const canTrack = useCallback(() => {
        return consentManager.hasConsent('analytics');
    }, []);

    /**
     * Push event to dataLayer and analytics tracker
     */
    const pushEvent = useCallback(
        (eventData: GTMEvent) => {
            // Check consent before tracking
            if (!canTrack()) {
                return;
            }

            try {
                // Sanitize event properties to remove PII
                const sanitizedEvent = {
                    ...eventData,
                    ...sanitizeEventProperties(eventData),
                };

                // Push to dataLayer for GTM
                if (typeof window !== 'undefined' && window.dataLayer) {
                    window.dataLayer.push(sanitizedEvent);
                }

                // Also track via analytics tracker
                analytics.trackEvent({
                    name: sanitizedEvent.event,
                    properties: sanitizedEvent,
                    timestamp: new Date(),
                });
            } catch (error) {
                // Log error but don't break the user experience
                console.error('[GTM Tracker] Failed to push event:', error);
            }
        },
        [canTrack],
    );

    // ============================================================================
    // Tracking Methods
    // ============================================================================

    const trackEvent = useCallback(
        (event: Omit<GTMEvent, 'timestamp' | 'pagePath' | 'isAuthenticated'>) => {
            pushEvent({
                ...getBaseProperties(),
                ...event,
            } as GTMEvent);
        },
        [pushEvent, getBaseProperties],
    );

    const trackNavigation = useCallback(
        (from: string, to: string, label?: string, context?: string) => {
            pushEvent({
                event: AnalyticsEvents.NAVIGATION_CLICK,
                category: 'navigation',
                navigationSource: from,
                navigationDestination: to,
                ...(label ? { navigationLabel: label } : {}),
                ...(context ? { navigationContext: context } : {}),
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackButtonClick = useCallback(
        (buttonId: string, context?: string) => {
            pushEvent({
                event: AnalyticsEvents.BUTTON_CLICK,
                category: 'ui',
                buttonId,
                buttonContext: context,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackFormSubmit = useCallback(
        (formType: string, success: boolean) => {
            pushEvent({
                event: AnalyticsEvents.FORM_SUBMIT,
                category: 'form',
                formType,
                success,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackModalInteraction = useCallback(
        (modalType: string, action: 'open' | 'close') => {
            pushEvent({
                event: AnalyticsEvents.MODAL_INTERACTION,
                category: 'ui',
                modalType,
                action,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackUIInteraction = useCallback(
        (componentType: string, value: string) => {
            pushEvent({
                event: AnalyticsEvents.UI_INTERACTION,
                category: 'ui',
                componentType,
                selectedValue: value,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackContentView = useCallback(
        (sectionId: string) => {
            pushEvent({
                event: AnalyticsEvents.CONTENT_VIEW,
                category: 'content',
                sectionId,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackContentCopy = useCallback(
        (contentType: string) => {
            pushEvent({
                event: AnalyticsEvents.CONTENT_COPY,
                category: 'content',
                contentType,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackFileDownload = useCallback(
        (fileType: string, fileName: string) => {
            pushEvent({
                event: AnalyticsEvents.FILE_DOWNLOAD,
                category: 'content',
                fileType,
                fileName,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackSearch = useCallback(
        (query: string, resultCount: number) => {
            pushEvent({
                event: AnalyticsEvents.SEARCH,
                category: 'engagement',
                query,
                resultCount,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackFilter = useCallback(
        (filterType: string, value: string) => {
            pushEvent({
                event: AnalyticsEvents.FILTER_APPLY,
                category: 'engagement',
                filterType,
                filterValue: value,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackError = useCallback(
        (errorType: string, message: string, severity?: string) => {
            pushEvent({
                event: AnalyticsEvents.ERROR_OCCURRED,
                category: 'error',
                errorType,
                errorMessage: message,
                severity: severity || 'medium',
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackCompetition = useCallback(
        (
            action: 'view' | 'join' | 'leave' | 'share' | 'leaderboard_view' | 'submission',
            competitionId: string,
            additionalProps?: Record<string, any>,
        ) => {
            const eventMap: Record<string, string> = {
                view: AnalyticsEvents.COMPETITION_VIEW,
                join: AnalyticsEvents.COMPETITION_JOIN,
                leave: AnalyticsEvents.COMPETITION_LEAVE,
                share: AnalyticsEvents.COMPETITION_SHARE,
                leaderboard_view: AnalyticsEvents.COMPETITION_LEADERBOARD_VIEW,
                submission: AnalyticsEvents.COMPETITION_SUBMISSION,
            };

            pushEvent({
                event: eventMap[action],
                category: 'competition',
                competitionId,
                ...additionalProps,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackProblem = useCallback(
        (
            action:
                | 'view'
                | 'start'
                | 'submit'
                | 'editorial_view'
                | 'question_ask'
                | 'comments_view',
            problemId: string,
            additionalProps?: Record<string, any>,
        ) => {
            const eventMap: Record<string, string> = {
                view: AnalyticsEvents.PROBLEM_VIEW,
                start: AnalyticsEvents.PROBLEM_START,
                submit: AnalyticsEvents.SOLUTION_SUBMIT,
                editorial_view: AnalyticsEvents.EDITORIAL_VIEW,
                question_ask: AnalyticsEvents.QUESTION_ASK,
                comments_view: AnalyticsEvents.COMMENTS_VIEW,
            };

            pushEvent({
                event: eventMap[action],
                category: 'problem',
                problemId,
                ...additionalProps,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackLeaderboard = useCallback(
        (
            action: 'view' | 'tab_change' | 'profile_click' | 'filter' | 'paginate',
            leaderboardType: string,
            additionalProps?: Record<string, any>,
        ) => {
            const eventMap: Record<string, string> = {
                view: AnalyticsEvents.LEADERBOARD_VIEW,
                tab_change: AnalyticsEvents.LEADERBOARD_TAB_CHANGE,
                profile_click: AnalyticsEvents.LEADERBOARD_PROFILE_CLICK,
                filter: AnalyticsEvents.LEADERBOARD_FILTER,
                paginate: AnalyticsEvents.LEADERBOARD_PAGINATE,
            };

            pushEvent({
                event: eventMap[action],
                category: 'leaderboard',
                leaderboardType,
                ...additionalProps,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackOnboarding = useCallback(
        (
            action: 'start' | 'step_complete' | 'complete' | 'abandon',
            additionalProps?: Record<string, any>,
        ) => {
            const eventMap: Record<string, string> = {
                start: AnalyticsEvents.ONBOARDING_START,
                step_complete: AnalyticsEvents.ONBOARDING_STEP_COMPLETE,
                complete: AnalyticsEvents.ONBOARDING_COMPLETE,
                abandon: AnalyticsEvents.ONBOARDING_ABANDON,
            };

            pushEvent({
                event: eventMap[action],
                category: 'onboarding',
                ...additionalProps,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackProfile = useCallback(
        (
            action:
                | 'view'
                | 'settings_update'
                | 'avatar_change'
                | 'institution_membership'
                | 'achievements_view'
                | 'showcase_update',
            additionalProps?: Record<string, any>,
        ) => {
            const eventMap: Record<string, string> = {
                view: AnalyticsEvents.PROFILE_VIEW,
                settings_update: AnalyticsEvents.SETTINGS_UPDATE,
                avatar_change: AnalyticsEvents.AVATAR_CHANGE,
                institution_membership: AnalyticsEvents.INSTITUTION_MEMBERSHIP,
                achievements_view: AnalyticsEvents.ACHIEVEMENTS_VIEW,
                showcase_update: AnalyticsEvents.SHOWCASE_UPDATE,
            };

            pushEvent({
                event: eventMap[action],
                category: 'profile',
                ...additionalProps,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    const trackAuth = useCallback(
        (action: 'login' | 'logout' | 'sign_up', additionalProps?: Record<string, any>) => {
            const eventMap: Record<string, string> = {
                login: AnalyticsEvents.LOGIN,
                logout: AnalyticsEvents.LOGOUT,
                sign_up: AnalyticsEvents.SIGN_UP,
            };

            pushEvent({
                event: eventMap[action],
                category: 'authentication',
                ...additionalProps,
                ...getBaseProperties(),
            });
        },
        [pushEvent, getBaseProperties],
    );

    return useMemo(
        () => ({
            trackEvent,
            trackNavigation,
            trackButtonClick,
            trackFormSubmit,
            trackModalInteraction,
            trackUIInteraction,
            trackContentView,
            trackContentCopy,
            trackFileDownload,
            trackSearch,
            trackFilter,
            trackError,
            trackCompetition,
            trackProblem,
            trackLeaderboard,
            trackOnboarding,
            trackProfile,
            trackAuth,
        }),
        [
            trackEvent,
            trackNavigation,
            trackButtonClick,
            trackFormSubmit,
            trackModalInteraction,
            trackUIInteraction,
            trackContentView,
            trackContentCopy,
            trackFileDownload,
            trackSearch,
            trackFilter,
            trackError,
            trackCompetition,
            trackProblem,
            trackLeaderboard,
            trackOnboarding,
            trackProfile,
            trackAuth,
        ],
    );
}

// ============================================================================
// Type Augmentation for Window
// ============================================================================

declare global {
    interface Window {
        dataLayer?: any[];
    }
}
