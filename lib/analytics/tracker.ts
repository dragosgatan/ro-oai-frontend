/**
 * Analytics Tracker
 *
 * Core analytics tracking system with multi-provider support.
 * Handles initialization, event tracking, consent management, and user properties.
 *
 * @example
 * ```typescript
 * import { analytics, AnalyticsEvents } from '@/lib/analytics';
 *
 * // Initialize
 * await analytics.initialize();
 *
 * // Track page view
 * analytics.trackPageView({
 *   path: '/problems/123',
 *   title: 'Problem: Two Sum',
 *   locale: 'en',
 * });
 *
 * // Track event
 * analytics.trackEvent({
 *   name: AnalyticsEvents.SOLUTION_SUBMIT,
 *   properties: {
 *     problemId: '123',
 *     difficulty: 'easy',
 *   },
 * });
 * ```
 */

import type {
    AnalyticsProvider,
    AnalyticsEvent,
    PageViewEvent,
    UserProperties,
    ConsentSettings,
    AnalyticsConfig,
    ProviderMetadata,
    TrackerState,
} from './types';
import { getAnalyticsConfig, ANALYTICS_CONSTANTS, isDevelopment } from './config';
import { isValidEvent, sanitizeEventProperties } from './events';

// ============================================================================
// AnalyticsTracker Class
// ============================================================================

/**
 * Core analytics tracker with multi-provider support
 */
export class AnalyticsTracker {
    private initialized = false;
    private providers = new Map<string, AnalyticsProvider>();
    private providerStatuses = new Map<string, ProviderMetadata>();
    private consent: ConsentSettings | null = null;
    private userProperties: UserProperties = {};
    private config: AnalyticsConfig;

    constructor() {
        this.config = getAnalyticsConfig();
    }

    // ============================================================================
    // Initialization
    // ============================================================================

    /**
     * Initialize the analytics tracker
     * @param config Optional configuration override
     */
    async initialize(config?: AnalyticsConfig): Promise<void> {
        if (this.initialized) {
            this.log('Tracker already initialized');
            return;
        }

        if (config) {
            this.config = config;
        }

        this.log('Initializing analytics tracker', this.config);

        // Mark as initialized even if providers fail
        // This prevents blocking the app on analytics failures
        this.initialized = true;

        this.log('Analytics tracker initialized');
    }

    /**
     * Add a provider to the tracker
     * @param provider Analytics provider to add
     */
    async addProvider(provider: AnalyticsProvider): Promise<void> {
        if (this.providers.has(provider.id)) {
            this.log(`Provider already registered: ${provider.id}`);
            return;
        }

        this.log(`Adding provider: ${provider.name} (${provider.id})`);

        // Register provider
        this.providers.set(provider.id, provider);
        this.providerStatuses.set(provider.id, {
            id: provider.id,
            name: provider.name,
            status: 'uninitialized',
        });

        // Initialize provider
        await this._initializeProvider(provider);

        // Apply current consent if set
        if (this.consent) {
            this._applyConsentToProvider(provider);
        }

        // Apply current user properties if set
        if (Object.keys(this.userProperties).length > 0) {
            this._applyUserPropertiesToProvider(provider);
        }
    }

    /**
     * Remove a provider from the tracker
     * @param providerId Provider ID to remove
     */
    removeProvider(providerId: string): void {
        if (!this.providers.has(providerId)) {
            this.log(`Provider not found: ${providerId}`);
            return;
        }

        this.log(`Removing provider: ${providerId}`);
        this.providers.delete(providerId);
        this.providerStatuses.delete(providerId);
    }

    /**
     * Get all registered providers
     */
    getProviders(): AnalyticsProvider[] {
        return Array.from(this.providers.values());
    }

    /**
     * Get provider metadata
     * @param providerId Optional provider ID, returns all if not specified
     */
    getProviderMetadata(providerId?: string): ProviderMetadata | ProviderMetadata[] {
        if (providerId) {
            return (
                this.providerStatuses.get(providerId) || {
                    id: providerId,
                    name: 'Unknown',
                    status: 'uninitialized',
                }
            );
        }

        return Array.from(this.providerStatuses.values());
    }

    // ============================================================================
    // Tracking Methods
    // ============================================================================

    /**
     * Track a page view
     * @param event Page view event data
     */
    trackPageView(event: PageViewEvent): void {
        if (!this._isReady()) {
            this.log('Tracker not ready, skipping page view');
            return;
        }

        if (!this._hasConsent()) {
            this.log('No consent for analytics, skipping page view');
            return;
        }

        this.log('Tracking page view', event);

        const providers = this._getReadyProviders();
        providers.forEach((provider) => {
            try {
                provider.trackPageView(event);
            } catch (error) {
                this.logError(`Failed to track page view in ${provider.name}`, error);
            }
        });
    }

    /**
     * Track a custom event
     * @param event Analytics event data
     */
    trackEvent(event: AnalyticsEvent): void {
        if (!this._isReady()) {
            this.log('Tracker not ready, skipping event');
            return;
        }

        if (!this._hasConsent()) {
            this.log('No consent for analytics, skipping event');
            return;
        }

        // Validate event
        if (!isValidEvent(event)) {
            this.logError('Invalid event', event);
            return;
        }

        // Sanitize event properties
        const sanitizedEvent = {
            ...event,
            properties: event.properties ? sanitizeEventProperties(event.properties) : undefined,
        };

        this.log('Tracking event', sanitizedEvent);

        const providers = this._getReadyProviders();
        providers.forEach((provider) => {
            try {
                provider.trackEvent(sanitizedEvent);
            } catch (error) {
                this.logError(`Failed to track event in ${provider.name}`, error);
            }
        });
    }

    /**
     * Set user properties
     * @param properties User properties to set
     */
    setUserProperties(properties: UserProperties): void {
        this.log('Setting user properties', properties);

        // Merge with existing properties
        this.userProperties = {
            ...this.userProperties,
            ...properties,
        };

        // Apply to all ready providers
        const providers = this._getReadyProviders();
        providers.forEach((provider) => {
            this._applyUserPropertiesToProvider(provider);
        });
    }

    /**
     * Get current user properties
     */
    getUserProperties(): UserProperties {
        return { ...this.userProperties };
    }

    /**
     * Clear user properties (e.g., on logout)
     */
    clearUserProperties(): void {
        this.log('Clearing user properties');
        this.userProperties = {};
    }

    /**
     * Set consent preferences
     * @param consent Consent settings
     */
    setConsent(consent: ConsentSettings): void {
        this.log('Setting consent', consent);
        this.consent = consent;

        // Apply to all providers
        const providers = this._getReadyProviders();
        providers.forEach((provider) => {
            this._applyConsentToProvider(provider);
        });
    }

    /**
     * Get current consent settings
     */
    getConsent(): ConsentSettings | null {
        return this.consent ? { ...this.consent } : null;
    }

    // ============================================================================
    // State Management
    // ============================================================================

    /**
     * Check if tracker is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get tracker state for debugging
     */
    getState(): TrackerState {
        return {
            initialized: this.initialized,
            providers: new Map(this.providers),
            consent: this.consent ? { ...this.consent } : null,
            userProperties: { ...this.userProperties },
        };
    }

    /**
     * Reset tracker state (for testing)
     */
    reset(): void {
        this.initialized = false;
        this.providers.clear();
        this.providerStatuses.clear();
        this.consent = null;
        this.userProperties = {};
        this.config = getAnalyticsConfig();
        this.log('Tracker reset');
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Initialize a provider
     */
    private async _initializeProvider(provider: AnalyticsProvider): Promise<void> {
        const metadata = this.providerStatuses.get(provider.id);
        if (!metadata) return;

        try {
            metadata.status = 'initializing';
            this.log(`Initializing provider: ${provider.name}`);

            // Get provider-specific config
            const providerConfig = this._getProviderConfig(provider.id);

            // Initialize with timeout
            await Promise.race([
                provider.initialize(providerConfig),
                this._timeout(ANALYTICS_CONSTANTS.PROVIDER_INIT_TIMEOUT),
            ]);

            metadata.status = 'ready';
            this.log(`Provider initialized: ${provider.name}`);
        } catch (error) {
            metadata.status = 'error';
            metadata.error = error as Error;
            this.logError(`Failed to initialize provider: ${provider.name}`, error);
        }
    }

    /**
     * Get provider-specific configuration
     */
    private _getProviderConfig(providerId: string): any {
        if (providerId === 'google-analytics' && this.config.providers.googleAnalytics) {
            return this.config.providers.googleAnalytics;
        }

        if (providerId === 'google-tag-manager' && this.config.providers.googleTagManager) {
            return this.config.providers.googleTagManager;
        }

        return { debug: this.config.debug };
    }

    /**
     * Check if tracker is ready for tracking
     */
    private _isReady(): boolean {
        if (!this.initialized) {
            return false;
        }

        if (isDevelopment() && !this.config.enabled) {
            return false;
        }

        return true;
    }

    /**
     * Check if consent allows tracking
     */
    private _hasConsent(): boolean {
        // If consent is not required, allow tracking
        if (!this.config.consent.required) {
            return true;
        }

        // If consent is required but not set, use default preferences
        if (!this.consent) {
            const defaults = this.config.consent.defaultPreferences;
            return defaults?.analytics === true;
        }

        // Check if analytics consent is granted
        return this.consent.analytics === true;
    }

    /**
     * Get all ready providers
     */
    private _getReadyProviders(): AnalyticsProvider[] {
        return Array.from(this.providers.values()).filter((provider) => {
            const metadata = this.providerStatuses.get(provider.id);
            return metadata?.status === 'ready';
        });
    }

    /**
     * Apply consent to a specific provider
     */
    private _applyConsentToProvider(provider: AnalyticsProvider): void {
        if (!this.consent) return;

        try {
            provider.setConsent(this.consent);
            this.log(`Applied consent to ${provider.name}`);
        } catch (error) {
            this.logError(`Failed to apply consent to ${provider.name}`, error);
        }
    }

    /**
     * Apply user properties to a specific provider
     */
    private _applyUserPropertiesToProvider(provider: AnalyticsProvider): void {
        if (Object.keys(this.userProperties).length === 0) return;

        try {
            provider.setUserProperties(this.userProperties);
            this.log(`Applied user properties to ${provider.name}`);
        } catch (error) {
            this.logError(`Failed to apply user properties to ${provider.name}`, error);
        }
    }

    /**
     * Create a timeout promise
     */
    private _timeout(ms: number): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), ms);
        });
    }

    /**
     * Log debug message
     */
    private log(message: string, ...args: any[]): void {
        if (this.config.debug) {
            console.debug(`[Analytics] ${message}`, ...args);
        }
    }

    /**
     * Log error message
     */
    private logError(message: string, error?: any): void {
        console.error(`[Analytics] ${message}`, error);
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton instance of AnalyticsTracker
 */
export const analytics = new AnalyticsTracker();
