/**
 * Base Analytics Provider
 *
 * Abstract base class for analytics providers with common functionality
 * and health check methods.
 */

import type {
    AnalyticsProvider,
    AnalyticsEvent,
    PageViewEvent,
    UserProperties,
    ConsentSettings,
    ProviderStatus,
} from '../types';

/**
 * Provider health check result
 */
export interface HealthCheckResult {
    healthy: boolean;
    message?: string;
    lastCheck: Date;
}

/**
 * Abstract base class for analytics providers
 * Provides common functionality and enforces interface implementation
 */
export abstract class BaseAnalyticsProvider implements AnalyticsProvider {
    abstract readonly id: string;
    abstract readonly name: string;

    protected status: ProviderStatus = 'uninitialized';
    protected config: any = {};
    protected lastHealthCheck: HealthCheckResult | null = null;
    protected initializationError: Error | null = null;

    /**
     * Initialize the provider
     * Must be implemented by concrete providers
     */
    abstract initialize(config: any): Promise<void>;

    /**
     * Track a page view
     * Must be implemented by concrete providers
     */
    abstract trackPageView(event: PageViewEvent): void;

    /**
     * Track a custom event
     * Must be implemented by concrete providers
     */
    abstract trackEvent(event: AnalyticsEvent): void;

    /**
     * Set user properties
     * Must be implemented by concrete providers
     */
    abstract setUserProperties(properties: UserProperties): void;

    /**
     * Set consent preferences
     * Must be implemented by concrete providers
     */
    abstract setConsent(consent: ConsentSettings): void;

    // ============================================================================
    // Common Functionality
    // ============================================================================

    /**
     * Get current provider status
     */
    getStatus(): ProviderStatus {
        return this.status;
    }

    /**
     * Check if provider is ready to track events
     */
    isReady(): boolean {
        return this.status === 'ready';
    }

    /**
     * Check if provider is initialized (ready or error state)
     */
    isInitialized(): boolean {
        return this.status === 'ready' || this.status === 'error';
    }

    /**
     * Get initialization error if any
     */
    getInitializationError(): Error | null {
        return this.initializationError;
    }

    /**
     * Perform health check
     * Can be overridden by concrete providers for custom checks
     */
    async healthCheck(): Promise<HealthCheckResult> {
        const result: HealthCheckResult = {
            healthy: this.isReady(),
            message: this.isReady() ? 'Provider is ready' : `Provider status: ${this.status}`,
            lastCheck: new Date(),
        };

        if (this.initializationError) {
            result.healthy = false;
            result.message = `Initialization error: ${this.initializationError.message}`;
        }

        this.lastHealthCheck = result;
        return result;
    }

    /**
     * Get last health check result
     */
    getLastHealthCheck(): HealthCheckResult | null {
        return this.lastHealthCheck;
    }

    /**
     * Reset provider state
     * Can be overridden by concrete providers for custom cleanup
     */
    reset(): void {
        this.status = 'uninitialized';
        this.config = {};
        this.lastHealthCheck = null;
        this.initializationError = null;
    }

    // ============================================================================
    // Protected Helper Methods
    // ============================================================================

    /**
     * Set provider status
     */
    protected setStatus(status: ProviderStatus): void {
        this.status = status;
    }

    /**
     * Set initialization error
     */
    protected setInitializationError(error: Error): void {
        this.initializationError = error;
        this.status = 'error';
    }

    /**
     * Log debug message
     */
    protected log(message: string, ...args: any[]): void {
        if (this.config.debug) {
            console.debug(`[${this.name}] ${message}`, ...args);
        }
    }

    /**
     * Log error message
     */
    protected logError(message: string, error?: any): void {
        console.error(`[${this.name}] ${message}`, error);
    }

    /**
     * Check if running in browser environment
     */
    protected isBrowser(): boolean {
        return typeof window !== 'undefined';
    }

    /**
     * Load external script
     * Helper method for loading analytics scripts
     */
    protected loadScript(src: string, id?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.isBrowser()) {
                reject(new Error('Not in browser environment'));
                return;
            }

            // Check if script already exists
            if (id && document.getElementById(id)) {
                this.log(`Script already loaded: ${id}`);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            if (id) {
                script.id = id;
            }

            script.onload = () => {
                this.log(`Script loaded: ${src}`);
                resolve();
            };

            script.onerror = () => {
                const error = new Error(`Failed to load script: ${src}`);
                this.logError('Script loading failed', error);
                reject(error);
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Wait for global variable to be available
     * Helper method for waiting for analytics libraries to load
     */
    protected waitForGlobal(globalName: string, timeout: number = 5000): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.isBrowser()) {
                reject(new Error('Not in browser environment'));
                return;
            }

            const startTime = Date.now();

            const checkGlobal = () => {
                if ((window as any)[globalName]) {
                    resolve((window as any)[globalName]);
                    return;
                }

                if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout waiting for global: ${globalName}`));
                    return;
                }

                setTimeout(checkGlobal, 100);
            };

            checkGlobal();
        });
    }

    /**
     * Validate event before tracking
     */
    protected validateEvent(event: AnalyticsEvent): boolean {
        if (!event || typeof event !== 'object') {
            this.logError('Invalid event: not an object', event);
            return false;
        }

        if (!event.name || typeof event.name !== 'string') {
            this.logError('Invalid event: missing or invalid name', event);
            return false;
        }

        if (event.properties && typeof event.properties !== 'object') {
            this.logError('Invalid event: properties must be an object', event);
            return false;
        }

        return true;
    }

    /**
     * Validate page view event before tracking
     */
    protected validatePageView(event: PageViewEvent): boolean {
        if (!event || typeof event !== 'object') {
            this.logError('Invalid page view: not an object', event);
            return false;
        }

        if (!event.path || typeof event.path !== 'string') {
            this.logError('Invalid page view: missing or invalid path', event);
            return false;
        }

        if (!event.title || typeof event.title !== 'string') {
            this.logError('Invalid page view: missing or invalid title', event);
            return false;
        }

        return true;
    }

    /**
     * Validate user properties before setting
     */
    protected validateUserProperties(properties: UserProperties): boolean {
        if (!properties || typeof properties !== 'object') {
            this.logError('Invalid user properties: not an object', properties);
            return false;
        }

        return true;
    }

    /**
     * Validate consent settings before applying
     */
    protected validateConsent(consent: ConsentSettings): boolean {
        if (!consent || typeof consent !== 'object') {
            this.logError('Invalid consent: not an object', consent);
            return false;
        }

        if (
            typeof consent.analytics !== 'boolean' ||
            typeof consent.marketing !== 'boolean' ||
            typeof consent.functional !== 'boolean'
        ) {
            this.logError('Invalid consent: all fields must be boolean', consent);
            return false;
        }

        return true;
    }
}
