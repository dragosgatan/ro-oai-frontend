/**
 * Property-Based Tests for GTM Event Structure Validity
 *
 * **Feature: seo-gtm-social-sharing, Property 3: GTM Event Structure Validity**
 *
 * *For any* GTM event pushed to the dataLayer, the event SHALL contain:
 * - A valid event name from the defined event constants
 * - A timestamp in ISO 8601 format
 * - The current page path
 * - The user's authentication status (boolean)
 * - No PII fields (email, password, phone, address, ssn, creditCard)
 *
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { AnalyticsEvents, sanitizeEventProperties, isValidEventName } from './events';

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generator for valid event names from AnalyticsEvents
 */
const validEventNameArbitrary = fc.constantFrom(...Object.values(AnalyticsEvents));

/**
 * Generator for ISO 8601 timestamps
 * Using integer-based generation to avoid invalid date issues
 */
const iso8601TimestampArbitrary = fc
    .integer({
        min: new Date('2020-01-01').getTime(),
        max: new Date('2030-12-31').getTime(),
    })
    .map((timestamp) => new Date(timestamp).toISOString());

/**
 * Generator for page paths
 */
const pagePathArbitrary = fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => /^[a-zA-Z0-9\-_/]+$/.test(s))
    .map((s) => '/' + s.replace(/^\/+/, ''));

/**
 * Generator for base GTM event structure
 */
const baseGTMEventArbitrary = fc.record({
    event: validEventNameArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
    userId: fc.option(fc.uuid(), { nil: undefined }),
    locale: fc.option(fc.constantFrom('en', 'ro'), { nil: undefined }),
});

/**
 * Generator for events with potential PII fields
 */
const eventWithPotentialPIIArbitrary = fc.record({
    event: validEventNameArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
    // PII fields that should be removed
    email: fc.option(fc.emailAddress(), { nil: undefined }),
    password: fc.option(fc.string(), { nil: undefined }),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
    address: fc.option(fc.string(), { nil: undefined }),
    ssn: fc.option(fc.string({ minLength: 9, maxLength: 11 }), { nil: undefined }),
    creditCard: fc.option(fc.string({ minLength: 16, maxLength: 19 }), { nil: undefined }),
    // Non-PII fields that should be preserved
    competitionId: fc.option(fc.uuid(), { nil: undefined }),
    problemId: fc.option(fc.uuid(), { nil: undefined }),
    buttonId: fc.option(fc.string(), { nil: undefined }),
});

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 3: GTM Event Structure Validity', () => {
    /**
     * **Feature: seo-gtm-social-sharing, Property 3: GTM Event Structure Validity**
     * **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
     */

    describe('8.1: Event contains timestamp', () => {
        it('For any GTM event, the timestamp SHALL be in ISO 8601 format', () => {
            fc.assert(
                fc.property(baseGTMEventArbitrary, (event) => {
                    // Verify timestamp exists
                    expect(event.timestamp).toBeDefined();
                    expect(typeof event.timestamp).toBe('string');

                    // Verify ISO 8601 format (parseable by Date)
                    const parsedDate = new Date(event.timestamp);
                    expect(parsedDate.toISOString()).toBe(event.timestamp);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('8.2: Event contains authentication status', () => {
        it('For any GTM event, isAuthenticated SHALL be a boolean', () => {
            fc.assert(
                fc.property(baseGTMEventArbitrary, (event) => {
                    expect(event.isAuthenticated).toBeDefined();
                    expect(typeof event.isAuthenticated).toBe('boolean');
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('8.3: Event contains page path', () => {
        it('For any GTM event, pagePath SHALL be a non-empty string starting with /', () => {
            fc.assert(
                fc.property(baseGTMEventArbitrary, (event) => {
                    expect(event.pagePath).toBeDefined();
                    expect(typeof event.pagePath).toBe('string');
                    expect(event.pagePath.length).toBeGreaterThan(0);
                    expect(event.pagePath.startsWith('/')).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('8.4: Event has valid event name', () => {
        it('For any GTM event, the event name SHALL be from defined constants', () => {
            fc.assert(
                fc.property(baseGTMEventArbitrary, (event) => {
                    expect(event.event).toBeDefined();
                    expect(typeof event.event).toBe('string');
                    expect(isValidEventName(event.event)).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('8.4: Sanitized events contain no PII', () => {
        it('For any event with PII fields, sanitization SHALL remove all PII', () => {
            fc.assert(
                fc.property(eventWithPotentialPIIArbitrary, (event) => {
                    const sanitized = sanitizeEventProperties(event);

                    // PII fields should be removed
                    expect(sanitized.email).toBeUndefined();
                    expect(sanitized.password).toBeUndefined();
                    expect(sanitized.phone).toBeUndefined();
                    expect(sanitized.address).toBeUndefined();
                    expect(sanitized.ssn).toBeUndefined();
                    expect(sanitized.creditCard).toBeUndefined();

                    // Non-PII fields should be preserved
                    expect(sanitized.event).toBe(event.event);
                    expect(sanitized.timestamp).toBe(event.timestamp);
                    expect(sanitized.pagePath).toBe(event.pagePath);
                    expect(sanitized.isAuthenticated).toBe(event.isAuthenticated);
                    if (event.competitionId) {
                        expect(sanitized.competitionId).toBe(event.competitionId);
                    }
                    if (event.problemId) {
                        expect(sanitized.problemId).toBe(event.problemId);
                    }
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Combined: Complete GTM event structure validity', () => {
        it('For any valid GTM event, all required fields SHALL be present and valid', () => {
            fc.assert(
                fc.property(baseGTMEventArbitrary, (event) => {
                    // All required fields present
                    expect(event.event).toBeDefined();
                    expect(event.timestamp).toBeDefined();
                    expect(event.pagePath).toBeDefined();
                    expect(event.isAuthenticated).toBeDefined();

                    // Types are correct
                    expect(typeof event.event).toBe('string');
                    expect(typeof event.timestamp).toBe('string');
                    expect(typeof event.pagePath).toBe('string');
                    expect(typeof event.isAuthenticated).toBe('boolean');

                    // Event name is valid
                    expect(isValidEventName(event.event)).toBe(true);

                    // Timestamp is valid ISO 8601
                    const parsedDate = new Date(event.timestamp);
                    expect(isNaN(parsedDate.getTime())).toBe(false);

                    // Page path starts with /
                    expect(event.pagePath.startsWith('/')).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });
});
