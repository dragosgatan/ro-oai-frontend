/**
 * Analytics Provider Component
 *
 * Client-side React component that initializes and manages analytics tracking.
 * Handles consent-aware initialization, page view tracking, and authentication integration.
 *
 * @example
 * ```tsx
 * import { AnalyticsProvider } from '@/components/analytics-provider';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <AnalyticsProvider>
 *       {children}
 *     </AnalyticsProvider>
 *   );
 * }
 * ```
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    analytics,
    getAnalyticsConfig,
    consentManager,
    GoogleAnalyticsProvider,
    GoogleTagManagerProvider,
    AnalyticsEvents,
    initWebVitalsTracking,
} from '@/lib/analytics';
import {
    containsArticleInvitationSecret,
    shouldSuppressInvitationAnalytics,
} from '@/lib/monitoring/sensitive-data';

// ============================================================================
// Types
// ============================================================================

interface AnalyticsProviderProps {
    children: React.ReactNode;
}

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class AnalyticsErrorBoundary extends React.Component<
    { children: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('[Analytics] Error boundary caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Analytics failures should not break the app
            // Just render children without analytics
            console.warn('[Analytics] Analytics provider failed, continuing without analytics');
            return this.props.children;
        }

        return this.props.children;
    }
}

// ============================================================================
// Analytics Provider Component
// ============================================================================

/**
 * Analytics provider component
 * Initializes analytics tracking and manages page view tracking
 */
function AnalyticsProviderInner({ children }: AnalyticsProviderProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session, status: sessionStatus } = useSession();
    const [initialized, setInitialized] = useState(false);
    const [consentGiven, setConsentGiven] = useState(false);
    const initializationAttempted = useRef(false);
    const lastTrackedPath = useRef<string | null>(null);
    const suppressAnalytics = shouldSuppressInvitationAnalytics(
        pathname,
        typeof window === 'undefined' ? undefined : window.location.href,
    );

    // ============================================================================
    // Initialization
    // ============================================================================

    useEffect(() => {
        if (suppressAnalytics) {
            return;
        }

        // Prevent double initialization
        if (initializationAttempted.current) {
            return;
        }

        initializationAttempted.current = true;

        const initializeAnalytics = async () => {
            try {
                const config = getAnalyticsConfig();

                // Check if analytics is enabled
                if (!config.enabled) {
                    console.log('[Analytics] Analytics disabled in configuration');
                    return;
                }

                // Initialize tracker
                await analytics.initialize(config);

                // Check consent
                const consent = consentManager.getConsent();
                const hasConsent = consent?.analytics === true;

                // If consent is required but not given, wait for consent
                if (config.consent.required && !hasConsent) {
                    console.log('[Analytics] Waiting for user consent');
                    setConsentGiven(false);
                    setInitialized(true);
                    return;
                }

                // Apply consent if available
                if (consent) {
                    analytics.setConsent({
                        analytics: consent.analytics,
                        marketing: consent.marketing,
                        functional: consent.functional,
                    });
                } else if (config.consent.defaultPreferences) {
                    // Use default preferences if no consent is set
                    analytics.setConsent({
                        analytics: config.consent.defaultPreferences.analytics || false,
                        marketing: config.consent.defaultPreferences.marketing || false,
                        functional: config.consent.defaultPreferences.functional || true,
                    });
                }

                // Initialize providers
                await initializeProviders(config);

                setConsentGiven(hasConsent);
                setInitialized(true);

                // Initialize web vitals tracking if consent is given
                if (hasConsent) {
                    initWebVitalsTracking();
                    console.log('[Analytics] Web Vitals tracking initialized');
                }

                console.log('[Analytics] Analytics initialized successfully');
            } catch (error) {
                console.error('[Analytics] Failed to initialize analytics:', error);
                setInitialized(true); // Mark as initialized even on error to prevent blocking
            }
        };

        initializeAnalytics();
    }, [suppressAnalytics]);

    // ============================================================================
    // Provider Initialization
    // ============================================================================

    const initializeProviders = async (config: ReturnType<typeof getAnalyticsConfig>) => {
        const providers: Promise<void>[] = [];

        // Initialize Google Analytics 4
        if (config.providers.googleAnalytics?.enabled) {
            try {
                const gaProvider = new GoogleAnalyticsProvider();
                providers.push(analytics.addProvider(gaProvider));
                console.log('[Analytics] Google Analytics 4 provider added');
            } catch (error) {
                console.error('[Analytics] Failed to add Google Analytics provider:', error);
            }
        }

        // Initialize Google Tag Manager
        if (config.providers.googleTagManager?.enabled) {
            try {
                const gtmProvider = new GoogleTagManagerProvider();
                providers.push(analytics.addProvider(gtmProvider));
                console.log('[Analytics] Google Tag Manager provider added');
            } catch (error) {
                console.error('[Analytics] Failed to add Google Tag Manager provider:', error);
            }
        }

        // Wait for all providers to initialize
        await Promise.allSettled(providers);
    };

    // ============================================================================
    // Consent Management
    // ============================================================================

    useEffect(() => {
        if (suppressAnalytics) return;

        // Listen for consent changes
        const unsubscribe = consentManager.onConsentChange((preferences) => {
            console.log('[Analytics] Consent changed:', preferences);

            // Update analytics consent
            analytics.setConsent({
                analytics: preferences.analytics,
                marketing: preferences.marketing,
                functional: preferences.functional,
            });

            // Update consent state
            setConsentGiven(preferences.analytics);

            // If consent was just granted and we haven't initialized providers yet
            if (preferences.analytics && !consentGiven && initialized) {
                const config = getAnalyticsConfig();
                initializeProviders(config).catch((error) => {
                    console.error(
                        '[Analytics] Failed to initialize providers after consent:',
                        error,
                    );
                });

                // Initialize web vitals tracking
                initWebVitalsTracking();
                console.log('[Analytics] Web Vitals tracking initialized after consent');
            }
        });

        return unsubscribe;
    }, [initialized, consentGiven, suppressAnalytics]);

    // ============================================================================
    // Authentication Integration
    // ============================================================================

    useEffect(() => {
        if (suppressAnalytics) return;

        // Track authenticated user properties
        if (sessionStatus === 'authenticated' && session?.user) {
            try {
                // Get user ID from session (if available)
                const userId = session.id || session.user.email || 'anonymous';

                // Check if this is a new user (first time seeing this user ID)
                const storageKey = 'mlcompete_seen_users';
                const seenUsers =
                    typeof localStorage !== 'undefined'
                        ? JSON.parse(localStorage.getItem(storageKey) || '[]')
                        : [];
                const isNewUser = !seenUsers.includes(userId);

                // Set user properties
                analytics.setUserProperties({
                    userId,
                    isNewUser: isNewUser.toString(),
                    // Don't send email directly for privacy
                    // Use hashed or anonymized identifier
                });

                // Build base event properties for GTM
                const baseEventProps = {
                    timestamp: new Date().toISOString(),
                    pagePath: typeof window !== 'undefined' ? window.location.pathname : '/',
                    isAuthenticated: true,
                    method: 'keycloak',
                    provider: 'keycloak',
                };

                // Track sign-up event for new users
                if (isNewUser) {
                    // Track via analytics tracker
                    analytics.trackEvent({
                        name: AnalyticsEvents.SIGN_UP,
                        properties: {
                            method: 'keycloak',
                            timestamp: new Date().toISOString(),
                        },
                    });

                    // Push to GTM dataLayer
                    if (typeof window !== 'undefined' && window.dataLayer) {
                        window.dataLayer.push({
                            event: AnalyticsEvents.SIGN_UP,
                            category: 'authentication',
                            ...baseEventProps,
                        });
                    }

                    // Mark user as seen
                    if (typeof localStorage !== 'undefined') {
                        seenUsers.push(userId);
                        localStorage.setItem(storageKey, JSON.stringify(seenUsers));
                    }

                    console.log('[Analytics] Sign-up tracked for new user');
                } else {
                    // Track login event for returning users
                    analytics.trackEvent({
                        name: AnalyticsEvents.LOGIN,
                        properties: {
                            method: 'keycloak',
                            timestamp: new Date().toISOString(),
                        },
                    });

                    // Push to GTM dataLayer
                    if (typeof window !== 'undefined' && window.dataLayer) {
                        window.dataLayer.push({
                            event: AnalyticsEvents.LOGIN,
                            category: 'authentication',
                            ...baseEventProps,
                        });
                    }

                    console.log('[Analytics] Login tracked for returning user');
                }

                console.log('[Analytics] User properties set');
            } catch (error) {
                console.error(
                    '[Analytics] Failed to set user properties or track auth event:',
                    error,
                );
            }
        } else if (sessionStatus === 'unauthenticated') {
            // Clear user properties on logout
            try {
                analytics.clearUserProperties();
                console.log('[Analytics] User properties cleared');
            } catch (error) {
                console.error('[Analytics] Failed to clear user properties:', error);
            }
        }
    }, [session, sessionStatus, suppressAnalytics]);

    // ============================================================================
    // Page View Tracking
    // ============================================================================

    useEffect(() => {
        // Don't track if not initialized or no consent
        if (suppressAnalytics || !initialized || !consentGiven) {
            return;
        }

        // Build full path with search params
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

        // Invitation links are bearer credentials. A middleware exchange normally
        // removes them before render; this remains as defense in depth for any
        // fallback/error path and encoded login callback.
        if (containsArticleInvitationSecret(url)) {
            return;
        }

        // Don't track the same path twice in a row
        if (lastTrackedPath.current === url) {
            return;
        }

        lastTrackedPath.current = url;

        // Track page view
        try {
            // Get page title from document
            const title = typeof document !== 'undefined' ? document.title : 'Unknown';

            // Get referrer
            const rawReferrer = typeof document !== 'undefined' ? document.referrer : undefined;
            const referrer = containsArticleInvitationSecret(rawReferrer) ? undefined : rawReferrer;

            // Get locale from pathname or session
            const locale = pathname.startsWith('/ro') ? 'ro' : 'en';

            analytics.trackPageView({
                path: url,
                title,
                referrer,
                locale,
            });

            console.log('[Analytics] Page view tracked:', url);
        } catch (error) {
            console.error('[Analytics] Failed to track page view:', error);
        }
    }, [pathname, searchParams, initialized, consentGiven, suppressAnalytics]);

    // ============================================================================
    // Render
    // ============================================================================

    return <>{children}</>;
}

/**
 * Analytics provider with error boundary
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
    return (
        <AnalyticsErrorBoundary>
            <AnalyticsProviderInner>{children}</AnalyticsProviderInner>
        </AnalyticsErrorBoundary>
    );
}
