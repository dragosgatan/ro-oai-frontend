/**
 * Analytics Configuration
 *
 * Environment-based configuration for analytics tracking system.
 * Supports different settings for development, staging, and production.
 */

import type { AnalyticsConfig, EnvironmentConfig } from './types';

// ============================================================================
// Environment Detection
// ============================================================================

/**
 * Get current environment
 */
export function getEnvironment(): 'development' | 'staging' | 'production' {
    const nodeEnv = process.env.NODE_ENV;
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;

    if (nodeEnv === 'development') {
        return 'development';
    }

    if (vercelEnv === 'production') {
        return 'production';
    }

    if (vercelEnv === 'preview') {
        return 'staging';
    }

    return nodeEnv === 'production' ? 'production' : 'development';
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
    return typeof window !== 'undefined';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
    return getEnvironment() === 'development';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
    return getEnvironment() === 'production';
}

// ============================================================================
// Environment Configurations
// ============================================================================

/**
 * Development environment configuration
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const stagingGoogleAnalytics = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID_STAGING;
const stagingGoogleTagManager = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID_STAGING;
const productionGoogleAnalytics = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const productionGoogleTagManager = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;

const DEVELOPMENT_CONFIG: EnvironmentConfig = {
    siteUrl,
    analyticsEnabled: false, // Disable analytics in development
    debug: true,
    noindex: true, // Prevent indexing in development
};

/**
 * Staging environment configuration
 */
const STAGING_CONFIG: EnvironmentConfig = {
    siteUrl,
    analyticsEnabled: Boolean(stagingGoogleAnalytics || stagingGoogleTagManager),
    debug: true,
    googleAnalytics: stagingGoogleAnalytics,
    googleTagManager: stagingGoogleTagManager,
    noindex: true, // Prevent indexing in staging
};

/**
 * Production environment configuration
 */
const PRODUCTION_CONFIG: EnvironmentConfig = {
    siteUrl,
    analyticsEnabled: Boolean(productionGoogleAnalytics || productionGoogleTagManager),
    debug: false,
    googleAnalytics: productionGoogleAnalytics,
    googleTagManager: productionGoogleTagManager,
    noindex: false,
};

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
    const env = getEnvironment();

    switch (env) {
        case 'development':
            return DEVELOPMENT_CONFIG;
        case 'staging':
            return STAGING_CONFIG;
        case 'production':
            return PRODUCTION_CONFIG;
        default:
            return DEVELOPMENT_CONFIG;
    }
}

// ============================================================================
// Analytics Configuration
// ============================================================================

/**
 * Get analytics configuration based on environment
 */
export function getAnalyticsConfig(): AnalyticsConfig {
    const envConfig = getEnvironmentConfig();

    // Check for Do Not Track browser setting
    const respectDoNotTrack =
        isBrowser() &&
        (navigator.doNotTrack === '1' ||
            (window as any).doNotTrack === '1' ||
            (navigator as any).msDoNotTrack === '1');

    // Disable analytics if DNT is enabled
    const analyticsEnabled = envConfig.analyticsEnabled && !respectDoNotTrack;

    return {
        enabled: analyticsEnabled,
        debug: envConfig.debug,
        providers: {
            googleAnalytics: envConfig.googleAnalytics
                ? {
                      measurementId: envConfig.googleAnalytics,
                      enabled: true,
                      debug: envConfig.debug,
                  }
                : undefined,
            googleTagManager: envConfig.googleTagManager
                ? {
                      containerId: envConfig.googleTagManager,
                      enabled: true,
                      debug: envConfig.debug,
                  }
                : undefined,
        },
        consent: {
            required: isProduction(), // Only require consent in production
            defaultPreferences: {
                analytics: false,
                marketing: false,
                functional: true, // Functional cookies are essential
            },
        },
    };
}

// ============================================================================
// Configuration Validation
// ============================================================================

/**
 * Validate analytics configuration
 */
export function validateAnalyticsConfig(config: AnalyticsConfig): boolean {
    // Check if at least one provider is configured when enabled
    if (config.enabled) {
        const hasProvider =
            config.providers.googleAnalytics?.enabled || config.providers.googleTagManager?.enabled;

        if (!hasProvider) {
            console.warn('[Analytics] Analytics enabled but no providers configured');
            return false;
        }
    }

    return true;
}

/**
 * Get configuration summary for debugging
 */
export function getConfigSummary(): string {
    const env = getEnvironment();
    const config = getAnalyticsConfig();

    const providers = [];
    if (config.providers.googleAnalytics?.enabled) {
        providers.push('Google Analytics 4');
    }
    if (config.providers.googleTagManager?.enabled) {
        providers.push('Google Tag Manager');
    }

    return `
Analytics Configuration:
  Environment: ${env}
  Enabled: ${config.enabled}
  Debug: ${config.debug}
  Providers: ${providers.length > 0 ? providers.join(', ') : 'None'}
  Consent Required: ${config.consent.required}
  `.trim();
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Analytics system constants
 */
export const ANALYTICS_CONSTANTS = {
    // Storage keys
    CONSENT_STORAGE_KEY: 'mlcompete_analytics_consent',
    USER_ID_STORAGE_KEY: 'mlcompete_user_id',
    SESSION_ID_STORAGE_KEY: 'mlcompete_session_id',

    // Cookie names
    CONSENT_COOKIE_NAME: 'mlcompete_consent',

    // Timeouts
    PROVIDER_INIT_TIMEOUT: 5000, // 5 seconds
    EVENT_BATCH_DELAY: 1000, // 1 second

    // Limits
    MAX_EVENT_PROPERTIES: 50,
    MAX_PROPERTY_VALUE_LENGTH: 500,
    MAX_EVENTS_PER_BATCH: 20,

    // Retry settings
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
} as const;

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Analytics feature flags
 */
export const ANALYTICS_FEATURES = {
    // Core features
    PAGE_VIEW_TRACKING: true,
    EVENT_TRACKING: true,
    USER_PROPERTIES: true,

    // Advanced features
    SCROLL_DEPTH_TRACKING: true,
    TIME_ON_PAGE_TRACKING: true,
    ERROR_TRACKING: true,
    PERFORMANCE_TRACKING: true,

    // Privacy features
    IP_ANONYMIZATION: true,
    RESPECT_DO_NOT_TRACK: true,
    CONSENT_MODE: true,

    // Development features
    DEBUG_LOGGING: isDevelopment(),
    MOCK_PROVIDERS: isDevelopment(),
} as const;

// ============================================================================
// Export Default Configuration
// ============================================================================

/**
 * Default analytics configuration
 * Can be imported and used directly
 */
export const analyticsConfig = getAnalyticsConfig();

/**
 * Environment configuration
 */
export const environmentConfig = getEnvironmentConfig();
