/**
 * Google Analytics 4 Provider
 *
 * Analytics provider implementation for Google Analytics 4 (GA4).
 * Handles gtag.js script loading, initialization, and event tracking.
 */

import { BaseAnalyticsProvider } from './base-provider';
import type {
    AnalyticsEvent,
    PageViewEvent,
    UserProperties,
    ConsentSettings,
    GoogleAnalyticsConfig,
} from '../types';

/**
 * Google Analytics 4 gtag.js interface
 */
declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        dataLayer?: any[];
    }
}

/**
 * GA4 consent mode mapping
 */
interface GA4ConsentMode {
    ad_storage: 'granted' | 'denied';
    analytics_storage: 'granted' | 'denied';
    functionality_storage: 'granted' | 'denied';
    personalization_storage: 'granted' | 'denied';
    security_storage: 'granted' | 'denied';
}

/**
 * Google Analytics 4 Provider
 * Implements tracking for GA4 using gtag.js
 */
export class GoogleAnalyticsProvider extends BaseAnalyticsProvider {
    readonly id = 'google-analytics';
    readonly name = 'Google Analytics 4';

    private measurementId: string = '';
    private gtagLoaded: boolean = false;

    /**
     * Initialize Google Analytics 4
     */
    async initialize(config: GoogleAnalyticsConfig): Promise<void> {
        try {
            this.setStatus('initializing');
            this.config = config;

            if (!config.measurementId) {
                throw new Error('Google Analytics measurement ID is required');
            }

            this.measurementId = config.measurementId;
            this.log('Initializing with measurement ID:', this.measurementId);

            if (!this.isBrowser()) {
                throw new Error('Google Analytics can only be initialized in browser environment');
            }

            // Initialize dataLayer
            window.dataLayer = window.dataLayer || [];

            // Define gtag function
            window.gtag = function gtag(...args: any[]) {
                window.dataLayer!.push(args);
            };

            // Set default consent mode (denied until user consents)
            this.gtag('consent', 'default', {
                ad_storage: 'denied',
                analytics_storage: 'denied',
                functionality_storage: 'granted',
                personalization_storage: 'denied',
                security_storage: 'granted',
                wait_for_update: 500,
            });

            // Load gtag.js script
            const scriptSrc = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
            await this.loadScript(scriptSrc, 'google-analytics-script');

            this.gtagLoaded = true;

            // Configure GA4
            this.gtag('js', new Date());
            this.gtag('config', this.measurementId, {
                send_page_view: false, // We'll handle page views manually
                anonymize_ip: true, // Anonymize IP addresses for privacy
                cookie_flags: 'SameSite=None;Secure', // Cookie security
                debug_mode: config.debug || false,
            });

            this.setStatus('ready');
            this.log('Initialized successfully');
        } catch (error) {
            this.logError('Initialization failed', error);
            this.setInitializationError(error as Error);
            throw error;
        }
    }

    /**
     * Track page view in GA4
     */
    trackPageView(event: PageViewEvent): void {
        try {
            if (!this.isReady()) {
                this.log('Provider not ready, skipping page view');
                return;
            }

            if (!this.validatePageView(event)) {
                return;
            }

            this.log('Tracking page view', event);

            // Send page_view event to GA4
            const pageLocation = this.isBrowser()
                ? new URL(event.path, window.location.origin).toString()
                : undefined;
            this.gtag('event', 'page_view', {
                page_path: event.path,
                page_title: event.title,
                page_referrer: event.referrer,
                page_location: pageLocation,
                language: event.locale,
            });
        } catch (error) {
            this.logError('Failed to track page view', error);
        }
    }

    /**
     * Track custom event in GA4
     */
    trackEvent(event: AnalyticsEvent): void {
        try {
            if (!this.isReady()) {
                this.log('Provider not ready, skipping event');
                return;
            }

            if (!this.validateEvent(event)) {
                return;
            }

            this.log('Tracking event', event);

            // Convert event properties to GA4 format
            const eventParams = this.convertEventProperties(event.properties || {});

            // Send event to GA4
            this.gtag('event', event.name, eventParams);
        } catch (error) {
            this.logError('Failed to track event', error);
        }
    }

    /**
     * Set user properties in GA4
     */
    setUserProperties(properties: UserProperties): void {
        try {
            if (!this.isReady()) {
                this.log('Provider not ready, skipping user properties');
                return;
            }

            if (!this.validateUserProperties(properties)) {
                return;
            }

            this.log('Setting user properties', properties);

            // Set user ID if provided
            if (properties.userId) {
                this.gtag('config', this.measurementId, {
                    user_id: properties.userId,
                });
            }

            // Set custom user properties
            const userProps = this.convertUserProperties(properties);
            if (Object.keys(userProps).length > 0) {
                this.gtag('set', 'user_properties', userProps);
            }
        } catch (error) {
            this.logError('Failed to set user properties', error);
        }
    }

    /**
     * Set consent preferences in GA4
     */
    setConsent(consent: ConsentSettings): void {
        try {
            if (!this.validateConsent(consent)) {
                return;
            }

            this.log('Setting consent', consent);

            // Convert to GA4 consent mode format
            const consentMode: GA4ConsentMode = {
                ad_storage: consent.marketing ? 'granted' : 'denied',
                analytics_storage: consent.analytics ? 'granted' : 'denied',
                functionality_storage: consent.functional ? 'granted' : 'denied',
                personalization_storage: consent.marketing ? 'granted' : 'denied',
                security_storage: 'granted', // Always granted for security
            };

            // Update consent mode
            this.gtag('consent', 'update', consentMode);

            this.log('Consent updated', consentMode);
        } catch (error) {
            this.logError('Failed to set consent', error);
        }
    }

    /**
     * Perform health check
     */
    async healthCheck() {
        const baseCheck = await super.healthCheck();

        if (!this.gtagLoaded) {
            return {
                healthy: false,
                message: 'gtag.js script not loaded',
                lastCheck: new Date(),
            };
        }

        if (!window.gtag) {
            return {
                healthy: false,
                message: 'gtag function not available',
                lastCheck: new Date(),
            };
        }

        return baseCheck;
    }

    /**
     * Reset provider state
     */
    reset(): void {
        super.reset();
        this.measurementId = '';
        this.gtagLoaded = false;
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Call gtag function
     */
    private gtag(...args: any[]): void {
        if (!this.isBrowser() || !window.gtag) {
            this.log('gtag not available, skipping call');
            return;
        }

        try {
            window.gtag(...args);
        } catch (error) {
            this.logError('gtag call failed', error);
        }
    }

    /**
     * Convert event properties to GA4 format
     * GA4 has specific naming conventions and limits
     */
    private convertEventProperties(properties: Record<string, any>): Record<string, any> {
        const converted: Record<string, any> = {};

        for (const [key, value] of Object.entries(properties)) {
            // Convert key to GA4 format (lowercase with underscores)
            const ga4Key = this.toGA4ParameterName(key);

            // Convert value to GA4-compatible type
            const ga4Value = this.toGA4ParameterValue(value);

            if (ga4Value !== undefined) {
                converted[ga4Key] = ga4Value;
            }
        }

        return converted;
    }

    /**
     * Convert user properties to GA4 format
     */
    private convertUserProperties(properties: UserProperties): Record<string, any> {
        const converted: Record<string, any> = {};

        for (const [key, value] of Object.entries(properties)) {
            // Skip userId as it's handled separately
            if (key === 'userId') {
                continue;
            }

            // Convert key to GA4 format
            const ga4Key = this.toGA4ParameterName(key);

            // Convert value to GA4-compatible type
            const ga4Value = this.toGA4ParameterValue(value);

            if (ga4Value !== undefined) {
                converted[ga4Key] = ga4Value;
            }
        }

        return converted;
    }

    /**
     * Convert parameter name to GA4 format
     * GA4 parameter names must be lowercase with underscores
     */
    private toGA4ParameterName(name: string): string {
        return name
            .replace(/([A-Z])/g, '_$1') // Convert camelCase to snake_case
            .toLowerCase()
            .replace(/^_/, '') // Remove leading underscore
            .replace(/[^a-z0-9_]/g, '_') // Replace invalid characters
            .substring(0, 40); // GA4 parameter name limit
    }

    /**
     * Convert parameter value to GA4-compatible type
     * GA4 supports: string, number, boolean
     */
    private toGA4ParameterValue(value: any): string | number | boolean | undefined {
        if (value === null || value === undefined) {
            return undefined;
        }

        if (typeof value === 'string') {
            // GA4 parameter value limit is 100 characters
            return value.substring(0, 100);
        }

        if (typeof value === 'number') {
            return value;
        }

        if (typeof value === 'boolean') {
            return value;
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (typeof value === 'object') {
            // Convert objects to JSON string
            try {
                return JSON.stringify(value).substring(0, 100);
            } catch {
                return undefined;
            }
        }

        // Convert other types to string
        return String(value).substring(0, 100);
    }
}
