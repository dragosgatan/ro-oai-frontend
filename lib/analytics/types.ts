/**
 * Analytics System Types
 *
 * Type definitions for the analytics tracking system including events,
 * providers, configuration, and consent management.
 */

// ============================================================================
// Event Types
// ============================================================================

/**
 * Base analytics event structure
 */
export interface AnalyticsEvent {
    name: string;
    properties?: Record<string, any>;
    timestamp?: Date;
}

/**
 * Page view event data
 */
export interface PageViewEvent {
    path: string;
    title: string;
    referrer?: string;
    locale?: string;
}

/**
 * User properties for identification and segmentation
 */
export interface UserProperties {
    userId?: string;
    locale?: string;
    theme?: string;
    [key: string]: any;
}

// ============================================================================
// Consent Types
// ============================================================================

/**
 * User consent preferences for different tracking categories
 */
export interface ConsentPreferences {
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
    timestamp: Date;
}

/**
 * Consent settings for analytics providers
 */
export interface ConsentSettings {
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
}

// ============================================================================
// Provider Types
// ============================================================================

/**
 * Base interface for analytics providers
 */
export interface AnalyticsProvider {
    id: string;
    name: string;

    initialize(config: any): Promise<void>;
    trackPageView(event: PageViewEvent): void;
    trackEvent(event: AnalyticsEvent): void;
    setUserProperties(properties: UserProperties): void;
    setConsent(consent: ConsentSettings): void;
}

/**
 * Provider initialization status
 */
export type ProviderStatus = 'uninitialized' | 'initializing' | 'ready' | 'error';

/**
 * Provider metadata
 */
export interface ProviderMetadata {
    id: string;
    name: string;
    status: ProviderStatus;
    error?: Error;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Google Analytics 4 configuration
 */
export interface GoogleAnalyticsConfig {
    measurementId: string;
    enabled: boolean;
    debug?: boolean;
}

/**
 * Google Tag Manager configuration
 */
export interface GoogleTagManagerConfig {
    containerId: string;
    enabled: boolean;
    debug?: boolean;
}

/**
 * Consent configuration
 */
export interface ConsentConfig {
    required: boolean;
    defaultPreferences?: Partial<ConsentPreferences>;
}

/**
 * Main analytics configuration
 */
export interface AnalyticsConfig {
    enabled: boolean;
    debug: boolean;
    providers: {
        googleAnalytics?: GoogleAnalyticsConfig;
        googleTagManager?: GoogleTagManagerConfig;
    };
    consent: ConsentConfig;
}

/**
 * Environment-specific configuration
 */
export interface EnvironmentConfig {
    siteUrl: string;
    analyticsEnabled: boolean;
    debug: boolean;
    googleAnalytics?: string;
    googleTagManager?: string;
    noindex?: boolean;
}

// ============================================================================
// Tracker Types
// ============================================================================

/**
 * Analytics tracker initialization options
 */
export interface TrackerOptions {
    config: AnalyticsConfig;
    autoTrackPageViews?: boolean;
    respectDoNotTrack?: boolean;
}

/**
 * Tracker state
 */
export interface TrackerState {
    initialized: boolean;
    providers: Map<string, AnalyticsProvider>;
    consent: ConsentSettings | null;
    userProperties: UserProperties;
}
