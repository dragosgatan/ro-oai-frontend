/**
 * Analytics System
 *
 * Centralized analytics tracking system for the MLCompete platform.
 * Supports multiple analytics providers with privacy-first approach.
 *
 * @example
 * ```typescript
 * import { analytics, AnalyticsEvents } from '@/lib/analytics';
 *
 * // Track a page view
 * analytics.trackPageView({
 *   path: '/problems/123',
 *   title: 'Problem: Two Sum',
 *   locale: 'en',
 * });
 *
 * // Track a custom event
 * analytics.trackEvent({
 *   name: AnalyticsEvents.SOLUTION_SUBMIT,
 *   properties: {
 *     problemId: '123',
 *     difficulty: 'easy',
 *   },
 * });
 * ```
 */

// Export types
export type {
    AnalyticsEvent,
    PageViewEvent,
    UserProperties,
    ConsentPreferences,
    ConsentSettings,
    AnalyticsProvider,
    ProviderStatus,
    ProviderMetadata,
    GoogleAnalyticsConfig,
    GoogleTagManagerConfig,
    ConsentConfig,
    AnalyticsConfig,
    EnvironmentConfig,
    TrackerOptions,
    TrackerState,
} from './types';

// Export event definitions
export {
    AnalyticsEvents,
    createAuthEvent,
    createProblemEvent,
    createSolutionEvent,
    createSocialEvent,
    createNavigationEvent,
    createSettingsEvent,
    createEngagementEvent,
    createErrorEvent,
    isValidEventName,
    isValidEvent,
    sanitizeEventProperties,
    containsPII,
} from './events';

export type {
    AnalyticsEventName,
    AuthEventProperties,
    ProblemEventProperties,
    SolutionEventProperties,
    SocialEventProperties,
    NavigationEventProperties,
    SettingsEventProperties,
    EngagementEventProperties,
    ErrorEventProperties,
    BaseGTMEventProperties,
    NavigationClickEventProperties,
    ButtonClickEventProperties,
    FormSubmitEventProperties,
    ModalInteractionEventProperties,
    UIInteractionEventProperties,
    ContentViewEventProperties,
    ContentCopyEventProperties,
    FileDownloadEventProperties,
    SearchEventProperties,
    FilterApplyEventProperties,
    CompetitionEventProperties,
    ProblemTrackingEventProperties,
    ProfileTrackingEventProperties,
    LeaderboardEventProperties,
    OnboardingEventProperties,
    PerformanceEventProperties,
} from './events';

// Export configuration
export {
    getEnvironment,
    isBrowser,
    isDevelopment,
    isProduction,
    getEnvironmentConfig,
    getAnalyticsConfig,
    validateAnalyticsConfig,
    getConfigSummary,
    analyticsConfig,
    environmentConfig,
    ANALYTICS_CONSTANTS,
    ANALYTICS_FEATURES,
} from './config';

// Export tracker
export { AnalyticsTracker, analytics } from './tracker';

// Export providers
export {
    BaseAnalyticsProvider,
    GoogleAnalyticsProvider,
    GoogleTagManagerProvider,
} from './providers';

export type { HealthCheckResult } from './providers';

// Export consent management
export { ConsentManager, consentManager } from './consent';

// Export web vitals tracking
export {
    initWebVitalsTracking,
    trackWebVital,
    trackLCP,
    trackFID,
    trackINP,
    trackCLS,
    trackTTFB,
    trackFCP,
    trackCustomMetric,
    getWebVitalsSummary,
    getDeviceInfo,
    getConnectionInfo,
    getMetricRating,
} from './web-vitals';

export type {
    WebVitalsMetric,
    DeviceInfo,
    ConnectionInfo,
    WebVitalsEventProperties,
} from './web-vitals';
