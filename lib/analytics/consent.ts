/**
 * Consent Management System
 *
 * Manages user privacy preferences and consent for analytics tracking.
 * Implements GDPR-compliant consent management with localStorage and cookie persistence.
 *
 * @example
 * ```typescript
 * import { consentManager } from '@/lib/analytics/consent';
 *
 * // Check if consent is required
 * if (consentManager.isConsentRequired()) {
 *   // Show consent banner
 * }
 *
 * // Get current consent
 * const consent = consentManager.getConsent();
 *
 * // Set consent preferences
 * consentManager.setConsent({
 *   analytics: true,
 *   marketing: false,
 *   functional: true,
 * });
 *
 * // Listen to consent changes
 * const unsubscribe = consentManager.onConsentChange((preferences) => {
 *   console.debug('Consent updated:', preferences);
 * });
 * ```
 */

import { ConsentPreferences, ConsentSettings } from './types';

// ============================================================================
// Constants
// ============================================================================

const CONSENT_STORAGE_KEY = 'mlcompete_consent';
const CONSENT_COOKIE_NAME = 'mlcompete_consent';
const CONSENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Default consent preferences (all disabled until user opts in)
 */
const DEFAULT_CONSENT: ConsentSettings = {
    analytics: false,
    marketing: false,
    functional: false,
};

// ============================================================================
// Types
// ============================================================================

type ConsentChangeCallback = (preferences: ConsentPreferences) => void;

// ============================================================================
// ConsentManager Class
// ============================================================================

/**
 * Manages user consent preferences for analytics and tracking
 */
export class ConsentManager {
    private listeners: Set<ConsentChangeCallback> = new Set();
    private cachedConsent: ConsentPreferences | null = null;

    /**
     * Get current consent preferences from storage
     * @returns Consent preferences or null if not set
     */
    getConsent(): ConsentPreferences | null {
        // Return cached value if available
        if (this.cachedConsent) {
            return this.cachedConsent;
        }

        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            return null;
        }

        try {
            // Try to get from localStorage first
            const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as ConsentPreferences;
                // Convert timestamp string back to Date object
                parsed.timestamp = new Date(parsed.timestamp);
                this.cachedConsent = parsed;
                return parsed;
            }

            // Fallback to cookie if localStorage is not available
            const cookieConsent = this.getConsentFromCookie();
            if (cookieConsent) {
                this.cachedConsent = cookieConsent;
                return cookieConsent;
            }

            return null;
        } catch (error) {
            console.error('[Consent] Failed to retrieve consent:', error);
            return null;
        }
    }

    /**
     * Set consent preferences and persist to storage
     * @param preferences Partial consent preferences to update
     */
    setConsent(preferences: Partial<ConsentSettings>): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            console.warn('[Consent] Cannot set consent in non-browser environment');
            return;
        }

        try {
            // Get existing consent or use defaults
            const existingConsent = this.getConsent();
            const currentSettings: ConsentSettings = existingConsent
                ? {
                      analytics: existingConsent.analytics,
                      marketing: existingConsent.marketing,
                      functional: existingConsent.functional,
                  }
                : DEFAULT_CONSENT;

            // Merge with new preferences
            const newConsent: ConsentPreferences = {
                ...currentSettings,
                ...preferences,
                timestamp: new Date(),
            };

            // Save to localStorage
            localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newConsent));

            // Save to cookie as backup
            this.setConsentCookie(newConsent);

            // Update cache
            this.cachedConsent = newConsent;

            // Notify listeners
            this.notifyListeners(newConsent);

            console.debug('[Consent] Preferences updated:', newConsent);
        } catch (error) {
            console.error('[Consent] Failed to set consent:', error);
        }
    }

    /**
     * Check if consent is required based on regulations
     * This is a simplified implementation - in production, you might want to
     * check user location via IP geolocation or other means
     * @returns True if consent banner should be shown
     */
    isConsentRequired(): boolean {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            return false;
        }

        // If consent has already been given, it's not required
        const existingConsent = this.getConsent();
        if (existingConsent) {
            return false;
        }

        // In a real implementation, you might check:
        // - User's location (EU requires GDPR compliance)
        // - Browser's Do Not Track setting
        // - Other privacy regulations (CCPA, etc.)

        // For now, we assume consent is always required for first-time users
        return true;
    }

    /**
     * Reset consent preferences (useful for testing)
     */
    resetConsent(): void {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            console.warn('[Consent] Cannot reset consent in non-browser environment');
            return;
        }

        try {
            // Remove from localStorage
            localStorage.removeItem(CONSENT_STORAGE_KEY);

            // Remove cookie
            this.deleteConsentCookie();

            // Clear cache
            this.cachedConsent = null;

            console.debug('[Consent] Preferences reset');
        } catch (error) {
            console.error('[Consent] Failed to reset consent:', error);
        }
    }

    /**
     * Register a callback to be notified when consent changes
     * @param callback Function to call when consent changes
     * @returns Unsubscribe function
     */
    onConsentChange(callback: ConsentChangeCallback): () => void {
        this.listeners.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Get consent settings (without timestamp) for analytics providers
     * @returns Consent settings or null if not set
     */
    getConsentSettings(): ConsentSettings | null {
        const consent = this.getConsent();
        if (!consent) {
            return null;
        }

        return {
            analytics: consent.analytics,
            marketing: consent.marketing,
            functional: consent.functional,
        };
    }

    /**
     * Check if a specific consent category is granted
     * @param category Consent category to check
     * @returns True if consent is granted for the category
     */
    hasConsent(category: keyof ConsentSettings): boolean {
        const consent = this.getConsent();
        if (!consent) {
            return false;
        }
        return consent[category] === true;
    }

    // ============================================================================
    // Private Methods
    // ============================================================================

    /**
     * Notify all registered listeners of consent changes
     */
    private notifyListeners(preferences: ConsentPreferences): void {
        this.listeners.forEach((callback) => {
            try {
                callback(preferences);
            } catch (error) {
                console.error('[Consent] Listener error:', error);
            }
        });
    }

    /**
     * Get consent from cookie
     */
    private getConsentFromCookie(): ConsentPreferences | null {
        try {
            const cookies = document.cookie.split(';');
            const consentCookie = cookies.find((cookie) =>
                cookie.trim().startsWith(`${CONSENT_COOKIE_NAME}=`),
            );

            if (!consentCookie) {
                return null;
            }

            const value = consentCookie.split('=')[1];
            const decoded = decodeURIComponent(value);
            const parsed = JSON.parse(decoded) as ConsentPreferences;
            // Convert timestamp string back to Date object
            parsed.timestamp = new Date(parsed.timestamp);
            return parsed;
        } catch (error) {
            console.error('[Consent] Failed to parse consent cookie:', error);
            return null;
        }
    }

    /**
     * Set consent cookie
     */
    private setConsentCookie(preferences: ConsentPreferences): void {
        try {
            const value = encodeURIComponent(JSON.stringify(preferences));
            const maxAge = CONSENT_COOKIE_MAX_AGE;
            const secure = window.location.protocol === 'https:' ? '; Secure' : '';
            const sameSite = '; SameSite=Lax';

            document.cookie = `${CONSENT_COOKIE_NAME}=${value}; Max-Age=${maxAge}; Path=/${secure}${sameSite}`;
        } catch (error) {
            console.error('[Consent] Failed to set consent cookie:', error);
        }
    }

    /**
     * Delete consent cookie
     */
    private deleteConsentCookie(): void {
        try {
            document.cookie = `${CONSENT_COOKIE_NAME}=; Max-Age=0; Path=/`;
        } catch (error) {
            console.error('[Consent] Failed to delete consent cookie:', error);
        }
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton instance of ConsentManager
 */
export const consentManager = new ConsentManager();
