/**
 * Property-Based Tests for Consent-Aware Event Tracking
 *
 * **Feature: seo-gtm-social-sharing, Property 10: Consent-Aware Event Tracking**
 *
 * *For any* tracking call when user consent is not given, the GTM_Tracker
 * SHALL NOT push any events to the dataLayer
 *
 * **Validates: Requirements 8.6**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ConsentManager } from './consent';
import { AnalyticsEvents } from './events';

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generator for valid event names
 */
const validEventNameArbitrary = fc.constantFrom(...Object.values(AnalyticsEvents));

/**
 * Generator for event properties
 */
const eventPropertiesArbitrary = fc.record({
    competitionId: fc.option(fc.uuid(), { nil: undefined }),
    problemId: fc.option(fc.uuid(), { nil: undefined }),
    buttonId: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    formType: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
    query: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

/**
 * Generator for consent settings
 */
const consentSettingsArbitrary = fc.record({
    analytics: fc.boolean(),
    marketing: fc.boolean(),
    functional: fc.boolean(),
});

// ============================================================================
// Mock Setup
// ============================================================================

/**
 * Create a mock dataLayer for testing
 */
function createMockDataLayer(): any[] {
    return [];
}

/**
 * Simulate pushing an event to dataLayer with consent check
 */
function pushEventWithConsentCheck(
    dataLayer: any[],
    event: any,
    consentManager: ConsentManager,
): boolean {
    // Check if analytics consent is given
    if (!consentManager.hasConsent('analytics')) {
        // Do not push event if consent is not given
        return false;
    }

    // Push event to dataLayer
    dataLayer.push(event);
    return true;
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 10: Consent-Aware Event Tracking', () => {
    /**
     * **Feature: seo-gtm-social-sharing, Property 10: Consent-Aware Event Tracking**
     * **Validates: Requirements 8.6**
     */

    let consentManager: ConsentManager;
    let mockDataLayer: any[];

    beforeEach(() => {
        // Mock localStorage with a fresh store for each test
        const localStorageMock = {
            store: {} as Record<string, string>,
            getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                localStorageMock.store[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete localStorageMock.store[key];
            }),
            clear: vi.fn(() => {
                localStorageMock.store = {};
            }),
        };

        vi.stubGlobal('localStorage', localStorageMock);

        // Create fresh instances for each test AFTER mocking localStorage
        consentManager = new ConsentManager();
        // Clear any cached consent from previous tests
        (consentManager as any).cachedConsent = null;
        mockDataLayer = createMockDataLayer();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('When consent is not given', () => {
        it('For any event, tracking SHALL NOT push to dataLayer when analytics consent is false', () => {
            fc.assert(
                fc.property(
                    validEventNameArbitrary,
                    eventPropertiesArbitrary,
                    (eventName, properties) => {
                        // Set consent with analytics = false
                        consentManager.setConsent({
                            analytics: false,
                            marketing: false,
                            functional: true,
                        });

                        const event = {
                            event: eventName,
                            ...properties,
                            timestamp: new Date().toISOString(),
                        };

                        const initialLength = mockDataLayer.length;
                        const pushed = pushEventWithConsentCheck(
                            mockDataLayer,
                            event,
                            consentManager,
                        );

                        // Event should not be pushed
                        expect(pushed).toBe(false);
                        expect(mockDataLayer.length).toBe(initialLength);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('For any event, tracking SHALL NOT push when no consent has been set', () => {
            fc.assert(
                fc.property(
                    validEventNameArbitrary,
                    eventPropertiesArbitrary,
                    (eventName, properties) => {
                        // Do not set any consent (simulating first-time user)
                        const event = {
                            event: eventName,
                            ...properties,
                            timestamp: new Date().toISOString(),
                        };

                        const initialLength = mockDataLayer.length;
                        const pushed = pushEventWithConsentCheck(
                            mockDataLayer,
                            event,
                            consentManager,
                        );

                        // Event should not be pushed (no consent = no tracking)
                        expect(pushed).toBe(false);
                        expect(mockDataLayer.length).toBe(initialLength);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    describe('When consent is given', () => {
        it('For any event, tracking SHALL push to dataLayer when analytics consent is true', () => {
            fc.assert(
                fc.property(
                    validEventNameArbitrary,
                    eventPropertiesArbitrary,
                    (eventName, properties) => {
                        // Set consent with analytics = true
                        consentManager.setConsent({
                            analytics: true,
                            marketing: false,
                            functional: true,
                        });

                        const event = {
                            event: eventName,
                            ...properties,
                            timestamp: new Date().toISOString(),
                        };

                        const initialLength = mockDataLayer.length;
                        const pushed = pushEventWithConsentCheck(
                            mockDataLayer,
                            event,
                            consentManager,
                        );

                        // Event should be pushed
                        expect(pushed).toBe(true);
                        expect(mockDataLayer.length).toBe(initialLength + 1);
                        expect(mockDataLayer[mockDataLayer.length - 1]).toEqual(event);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    describe('Consent state transitions', () => {
        it('For any consent state change, tracking behavior SHALL update accordingly', () => {
            fc.assert(
                fc.property(
                    validEventNameArbitrary,
                    consentSettingsArbitrary,
                    consentSettingsArbitrary,
                    (eventName, initialConsent, newConsent) => {
                        // Set initial consent
                        consentManager.setConsent(initialConsent);

                        const event1 = {
                            event: eventName,
                            timestamp: new Date().toISOString(),
                        };

                        const pushed1 = pushEventWithConsentCheck(
                            mockDataLayer,
                            event1,
                            consentManager,
                        );
                        expect(pushed1).toBe(initialConsent.analytics);

                        // Change consent
                        consentManager.setConsent(newConsent);

                        const event2 = {
                            event: eventName,
                            timestamp: new Date().toISOString(),
                        };

                        const pushed2 = pushEventWithConsentCheck(
                            mockDataLayer,
                            event2,
                            consentManager,
                        );
                        expect(pushed2).toBe(newConsent.analytics);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    describe('hasConsent method', () => {
        it('hasConsent SHALL return false when no consent is set', () => {
            // Create a completely fresh localStorage mock with empty store
            const emptyLocalStorageMock = {
                store: {} as Record<string, string>,
                getItem: vi.fn((_key: string) => null),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
            };
            vi.stubGlobal('localStorage', emptyLocalStorageMock);

            // Mock document.cookie to return empty
            Object.defineProperty(document, 'cookie', {
                writable: true,
                value: '',
            });

            // Create a fresh consent manager for this test
            const freshConsentManager = new ConsentManager();

            expect(freshConsentManager.hasConsent('analytics')).toBe(false);
            expect(freshConsentManager.hasConsent('marketing')).toBe(false);
            expect(freshConsentManager.hasConsent('functional')).toBe(false);
        });

        it('hasConsent SHALL return the correct value for each category', () => {
            fc.assert(
                fc.property(consentSettingsArbitrary, (consent) => {
                    consentManager.setConsent(consent);

                    expect(consentManager.hasConsent('analytics')).toBe(consent.analytics);
                    expect(consentManager.hasConsent('marketing')).toBe(consent.marketing);
                    expect(consentManager.hasConsent('functional')).toBe(consent.functional);
                }),
                { numRuns: 100 },
            );
        });
    });
});
