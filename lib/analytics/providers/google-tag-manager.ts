/**
 * Google Tag Manager Provider
 *
 * Analytics provider implementation for Google Tag Manager (GTM).
 * Handles GTM script loading, dataLayer initialization, and event pushing.
 */

import { BaseAnalyticsProvider } from './base-provider';
import type {
    AnalyticsEvent,
    PageViewEvent,
    UserProperties,
    ConsentSettings,
    GoogleTagManagerConfig,
} from '../types';

/**
 * Google Tag Manager dataLayer interface
 */
declare global {
    interface Window {
        dataLayer?: any[];
    }
}

/**
 * GTM dataLayer event structure
 */
interface GTMEvent {
    event: string;
    [key: string]: any;
}

/**
 * Google Tag Manager Provider
 * Implements tracking for GTM using dataLayer
 */
export class GoogleTagManagerProvider extends BaseAnalyticsProvider {
    readonly id = 'google-tag-manager';
    readonly name = 'Google Tag Manager';

    private containerId: string = '';
    private gtmLoaded: boolean = false;

    /**
     * Initialize Google Tag Manager
     */
    async initialize(config: GoogleTagManagerConfig): Promise<void> {
        try {
            this.setStatus('initializing');
            this.config = config;

            if (!config.containerId) {
                throw new Error('Google Tag Manager container ID is required');
            }

            this.containerId = config.containerId;
            this.log('Initializing with container ID:', this.containerId);

            if (!this.isBrowser()) {
                throw new Error(
                    'Google Tag Manager can only be initialized in browser environment',
                );
            }

            // Initialize dataLayer
            window.dataLayer = window.dataLayer || [];

            // Push GTM initialization event
            this.pushToDataLayer({
                'gtm.start': new Date().getTime(),
                event: 'gtm.js',
            });

            // Load GTM script
            const scriptSrc = `https://www.googletagmanager.com/gtm.js?id=${this.containerId}${
                config.debug ? '&gtm_debug=true' : ''
            }`;
            await this.loadScript(scriptSrc, 'google-tag-manager-script');

            this.gtmLoaded = true;

            // Add noscript iframe for GTM (best practice)
            this.addNoScriptIframe();

            this.setStatus('ready');
            this.log('Initialized successfully');
        } catch (error) {
            this.logError('Initialization failed', error);
            this.setInitializationError(error as Error);
            throw error;
        }
    }

    /**
     * Track page view in GTM
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

            const pageLocation = this.isBrowser()
                ? new URL(event.path, window.location.origin).toString()
                : undefined;

            // Push page view event to dataLayer
            this.pushToDataLayer({
                event: 'page_view',
                page: {
                    path: event.path,
                    title: event.title,
                    referrer: event.referrer,
                    location: pageLocation,
                    locale: event.locale,
                },
            });
        } catch (error) {
            this.logError('Failed to track page view', error);
        }
    }

    /**
     * Track custom event in GTM
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

            // Create GTM event object
            const gtmEvent: GTMEvent = {
                event: event.name,
                ...this.convertEventProperties(event.properties || {}),
                timestamp: event.timestamp?.toISOString() || new Date().toISOString(),
            };

            // Push event to dataLayer
            this.pushToDataLayer(gtmEvent);
        } catch (error) {
            this.logError('Failed to track event', error);
        }
    }

    /**
     * Set user properties in GTM
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

            // Push user properties to dataLayer
            this.pushToDataLayer({
                event: 'user_properties_set',
                user: this.convertUserProperties(properties),
            });
        } catch (error) {
            this.logError('Failed to set user properties', error);
        }
    }

    /**
     * Set consent preferences in GTM
     */
    setConsent(consent: ConsentSettings): void {
        try {
            if (!this.validateConsent(consent)) {
                return;
            }

            this.log('Setting consent', consent);

            // Push consent update to dataLayer
            this.pushToDataLayer({
                event: 'consent_update',
                consent: {
                    analytics: consent.analytics,
                    marketing: consent.marketing,
                    functional: consent.functional,
                },
            });

            this.log('Consent updated');
        } catch (error) {
            this.logError('Failed to set consent', error);
        }
    }

    /**
     * Push custom variables to dataLayer
     * Allows setting custom GTM variables
     */
    setCustomVariable(key: string, value: any): void {
        try {
            if (!this.isReady()) {
                this.log('Provider not ready, skipping custom variable');
                return;
            }

            this.log('Setting custom variable', { key, value });

            this.pushToDataLayer({
                [key]: value,
            });
        } catch (error) {
            this.logError('Failed to set custom variable', error);
        }
    }

    /**
     * Push multiple custom variables to dataLayer
     */
    setCustomVariables(variables: Record<string, any>): void {
        try {
            if (!this.isReady()) {
                this.log('Provider not ready, skipping custom variables');
                return;
            }

            this.log('Setting custom variables', variables);

            this.pushToDataLayer(variables);
        } catch (error) {
            this.logError('Failed to set custom variables', error);
        }
    }

    /**
     * Perform health check
     */
    async healthCheck() {
        const baseCheck = await super.healthCheck();

        if (!this.gtmLoaded) {
            return {
                healthy: false,
                message: 'GTM script not loaded',
                lastCheck: new Date(),
            };
        }

        if (!window.dataLayer) {
            return {
                healthy: false,
                message: 'dataLayer not available',
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
        this.containerId = '';
        this.gtmLoaded = false;
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Push data to GTM dataLayer
     */
    private pushToDataLayer(data: any): void {
        if (!this.isBrowser() || !window.dataLayer) {
            this.log('dataLayer not available, skipping push');
            return;
        }

        try {
            window.dataLayer.push(data);
            this.log('Pushed to dataLayer', data);
        } catch (error) {
            this.logError('Failed to push to dataLayer', error);
        }
    }

    /**
     * Add noscript iframe for GTM
     * Required for GTM to work when JavaScript is disabled
     */
    private addNoScriptIframe(): void {
        try {
            if (!this.isBrowser()) {
                return;
            }

            // Check if iframe already exists
            if (document.getElementById('google-tag-manager-noscript')) {
                return;
            }

            // Create noscript element
            const noscript = document.createElement('noscript');
            noscript.id = 'google-tag-manager-noscript';

            // Create iframe
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.googletagmanager.com/ns.html?id=${this.containerId}`;
            iframe.height = '0';
            iframe.width = '0';
            iframe.style.display = 'none';
            iframe.style.visibility = 'hidden';

            noscript.appendChild(iframe);

            // Insert at the beginning of body
            if (document.body) {
                document.body.insertBefore(noscript, document.body.firstChild);
            }
        } catch (error) {
            this.logError('Failed to add noscript iframe', error);
        }
    }

    /**
     * Convert event properties to GTM format
     */
    private convertEventProperties(properties: Record<string, any>): Record<string, any> {
        const converted: Record<string, any> = {};

        for (const [key, value] of Object.entries(properties)) {
            // Convert key to GTM format (camelCase)
            const gtmKey = this.toGTMParameterName(key);

            // Convert value to GTM-compatible type
            const gtmValue = this.toGTMParameterValue(value);

            if (gtmValue !== undefined) {
                converted[gtmKey] = gtmValue;
            }
        }

        return converted;
    }

    /**
     * Convert user properties to GTM format
     */
    private convertUserProperties(properties: UserProperties): Record<string, any> {
        const converted: Record<string, any> = {};

        for (const [key, value] of Object.entries(properties)) {
            // Convert key to GTM format
            const gtmKey = this.toGTMParameterName(key);

            // Convert value to GTM-compatible type
            const gtmValue = this.toGTMParameterValue(value);

            if (gtmValue !== undefined) {
                converted[gtmKey] = gtmValue;
            }
        }

        return converted;
    }

    /**
     * Convert parameter name to GTM format
     * GTM typically uses camelCase
     */
    private toGTMParameterName(name: string): string {
        // If already camelCase, return as is
        if (/^[a-z][a-zA-Z0-9]*$/.test(name)) {
            return name;
        }

        // Convert snake_case to camelCase
        return name
            .toLowerCase()
            .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
            .replace(/[^a-zA-Z0-9]/g, '');
    }

    /**
     * Convert parameter value to GTM-compatible type
     * GTM supports: string, number, boolean, object, array
     */
    private toGTMParameterValue(value: any): any {
        if (value === null || value === undefined) {
            return undefined;
        }

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            return value;
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        if (Array.isArray(value)) {
            return value.map((item) => this.toGTMParameterValue(item));
        }

        if (typeof value === 'object') {
            const converted: Record<string, any> = {};
            for (const [key, val] of Object.entries(value)) {
                const convertedValue = this.toGTMParameterValue(val);
                if (convertedValue !== undefined) {
                    converted[key] = convertedValue;
                }
            }
            return converted;
        }

        // Convert other types to string
        return String(value);
    }
}
