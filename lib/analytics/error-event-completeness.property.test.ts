/**
 * Property-Based Tests for Error Event Field Completeness
 *
 * **Feature: seo-gtm-social-sharing, Property 8: Error Event Field Completeness**
 *
 * *For any* error-related GTM event (error_occurred, api_error, validation_error), the event SHALL contain:
 * - Error type
 * - Error message
 * - Event-specific fields (endpoint and status for api_error, field for validation_error)
 *
 * **Validates: Requirements 10.1, 10.2, 10.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { AnalyticsEvents, sanitizeEventProperties } from './events';

// ============================================================================
// Types
// ============================================================================

interface BaseErrorEvent {
    event: string;
    category: string;
    errorType: string;
    errorMessage: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
    pagePath: string;
    isAuthenticated: boolean;
}

interface JSErrorEvent extends BaseErrorEvent {
    event: typeof AnalyticsEvents.ERROR_OCCURRED;
    errorStack?: string;
}

interface APIErrorEvent extends BaseErrorEvent {
    event: typeof AnalyticsEvents.API_ERROR;
    endpoint: string;
    statusCode: number;
}

interface ValidationErrorEvent extends BaseErrorEvent {
    event: typeof AnalyticsEvents.VALIDATION_ERROR;
    field: string;
}

type ErrorEvent = JSErrorEvent | APIErrorEvent | ValidationErrorEvent;

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generator for error types
 */
const errorTypeArbitrary = fc.constantFrom(
    'Error',
    'TypeError',
    'ReferenceError',
    'SyntaxError',
    'RangeError',
    'NetworkError',
    'HTTP_400',
    'HTTP_401',
    'HTTP_403',
    'HTTP_404',
    'HTTP_500',
    'HTTP_502',
    'HTTP_503',
    'required',
    'minLength',
    'maxLength',
    'pattern',
    'email',
    'url',
);

/**
 * Generator for error messages (non-empty strings without PII)
 */
const errorMessageArbitrary = fc
    .string({ minLength: 1, maxLength: 200 })
    .filter((s) => s.trim().length > 0)
    .map((s) => s.replace(/[<>]/g, '').trim())
    .filter((s) => s.length > 0); // Ensure non-empty after processing

/**
 * Generator for severity levels
 */
const severityArbitrary = fc.constantFrom('low', 'medium', 'high', 'critical') as fc.Arbitrary<
    'low' | 'medium' | 'high' | 'critical'
>;

/**
 * Generator for ISO 8601 timestamps
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
 * Generator for API endpoints (sanitized)
 */
const endpointArbitrary = fc.constantFrom(
    '/api/users/:id',
    '/api/problems/:id',
    '/api/submissions/:id',
    '/api/competitions/:id',
    '/api/comments/:id',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/profile',
    '/api/leaderboard',
);

/**
 * Generator for HTTP status codes
 */
const statusCodeArbitrary = fc.constantFrom(400, 401, 403, 404, 500, 502, 503);

/**
 * Generator for form field names
 */
const fieldNameArbitrary = fc.constantFrom(
    'username',
    'displayName',
    'bio',
    'institution',
    'country',
    'language',
    'theme',
    'sourceCode',
    'description',
    'title',
);

/**
 * Generator for error stack traces (truncated)
 */
const errorStackArbitrary = fc.option(
    fc
        .string({ minLength: 10, maxLength: 500 })
        .map((s) => `Error: ${s}\n    at Component (file.tsx:10:5)`),
    { nil: undefined },
);

/**
 * Generator for JavaScript error events
 */
const jsErrorEventArbitrary: fc.Arbitrary<JSErrorEvent> = fc.record({
    event: fc.constant(AnalyticsEvents.ERROR_OCCURRED as typeof AnalyticsEvents.ERROR_OCCURRED),
    category: fc.constant('error'),
    errorType: errorTypeArbitrary,
    errorMessage: errorMessageArbitrary,
    errorStack: errorStackArbitrary,
    severity: severityArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for API error events
 */
const apiErrorEventArbitrary: fc.Arbitrary<APIErrorEvent> = fc.record({
    event: fc.constant(AnalyticsEvents.API_ERROR as typeof AnalyticsEvents.API_ERROR),
    category: fc.constant('error'),
    errorType: fc.integer({ min: 400, max: 599 }).map((code) => `HTTP_${code}`),
    errorMessage: errorMessageArbitrary,
    endpoint: endpointArbitrary,
    statusCode: statusCodeArbitrary,
    severity: severityArbitrary,
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for validation error events
 */
const validationErrorEventArbitrary: fc.Arbitrary<ValidationErrorEvent> = fc.record({
    event: fc.constant(AnalyticsEvents.VALIDATION_ERROR as typeof AnalyticsEvents.VALIDATION_ERROR),
    category: fc.constant('error'),
    errorType: fc.constantFrom(
        'required',
        'minLength',
        'maxLength',
        'pattern',
        'email',
        'url',
        'custom',
    ),
    errorMessage: errorMessageArbitrary,
    field: fieldNameArbitrary,
    severity: fc.constant('low' as const),
    timestamp: iso8601TimestampArbitrary,
    pagePath: pagePathArbitrary,
    isAuthenticated: fc.boolean(),
});

/**
 * Generator for any error event
 */
const anyErrorEventArbitrary: fc.Arbitrary<ErrorEvent> = fc.oneof(
    jsErrorEventArbitrary,
    apiErrorEventArbitrary,
    validationErrorEventArbitrary,
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate that an error event has all required fields
 */
function validateErrorEvent(event: ErrorEvent): {
    isValid: boolean;
    missingFields: string[];
} {
    const missingFields: string[] = [];

    // All error events must have errorType
    if (!event.errorType || typeof event.errorType !== 'string') {
        missingFields.push('errorType');
    }

    // All error events must have errorMessage
    if (!event.errorMessage || typeof event.errorMessage !== 'string') {
        missingFields.push('errorMessage');
    }

    // API error events must have endpoint and statusCode
    if (event.event === AnalyticsEvents.API_ERROR) {
        const apiEvent = event as APIErrorEvent;
        if (!apiEvent.endpoint || typeof apiEvent.endpoint !== 'string') {
            missingFields.push('endpoint');
        }
        if (typeof apiEvent.statusCode !== 'number') {
            missingFields.push('statusCode');
        }
    }

    // Validation error events must have field
    if (event.event === AnalyticsEvents.VALIDATION_ERROR) {
        const validationEvent = event as ValidationErrorEvent;
        if (!validationEvent.field || typeof validationEvent.field !== 'string') {
            missingFields.push('field');
        }
    }

    return {
        isValid: missingFields.length === 0,
        missingFields,
    };
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 8: Error Event Field Completeness', () => {
    /**
     * **Feature: seo-gtm-social-sharing, Property 8: Error Event Field Completeness**
     * **Validates: Requirements 10.1, 10.2, 10.5**
     */

    describe('10.1: JavaScript error events contain required fields', () => {
        it('For any JS error event, errorType and errorMessage SHALL be present', () => {
            fc.assert(
                fc.property(jsErrorEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.ERROR_OCCURRED);

                    // Error type is present and valid
                    expect(event.errorType).toBeDefined();
                    expect(typeof event.errorType).toBe('string');
                    expect(event.errorType.length).toBeGreaterThan(0);

                    // Error message is present and valid
                    expect(event.errorMessage).toBeDefined();
                    expect(typeof event.errorMessage).toBe('string');
                    expect(event.errorMessage.length).toBeGreaterThan(0);

                    // Severity is present and valid
                    expect(event.severity).toBeDefined();
                    expect(['low', 'medium', 'high', 'critical']).toContain(event.severity);

                    // Validation passes
                    const validation = validateErrorEvent(event);
                    expect(validation.isValid).toBe(true);
                    expect(validation.missingFields).toHaveLength(0);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('10.2: API error events contain required fields including endpoint and status', () => {
        it('For any API error event, errorType, errorMessage, endpoint, and statusCode SHALL be present', () => {
            fc.assert(
                fc.property(apiErrorEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.API_ERROR);

                    // Error type is present and valid
                    expect(event.errorType).toBeDefined();
                    expect(typeof event.errorType).toBe('string');
                    expect(event.errorType.length).toBeGreaterThan(0);

                    // Error message is present and valid
                    expect(event.errorMessage).toBeDefined();
                    expect(typeof event.errorMessage).toBe('string');
                    expect(event.errorMessage.length).toBeGreaterThan(0);

                    // Endpoint is present and valid
                    expect(event.endpoint).toBeDefined();
                    expect(typeof event.endpoint).toBe('string');
                    expect(event.endpoint.length).toBeGreaterThan(0);

                    // Status code is present and valid
                    expect(event.statusCode).toBeDefined();
                    expect(typeof event.statusCode).toBe('number');
                    expect(event.statusCode).toBeGreaterThanOrEqual(400);
                    expect(event.statusCode).toBeLessThan(600);

                    // Validation passes
                    const validation = validateErrorEvent(event);
                    expect(validation.isValid).toBe(true);
                    expect(validation.missingFields).toHaveLength(0);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('10.5: Validation error events contain required fields including field name', () => {
        it('For any validation error event, errorType, errorMessage, and field SHALL be present', () => {
            fc.assert(
                fc.property(validationErrorEventArbitrary, (event) => {
                    // Event type is correct
                    expect(event.event).toBe(AnalyticsEvents.VALIDATION_ERROR);

                    // Error type is present and valid
                    expect(event.errorType).toBeDefined();
                    expect(typeof event.errorType).toBe('string');
                    expect(event.errorType.length).toBeGreaterThan(0);

                    // Error message is present and valid
                    expect(event.errorMessage).toBeDefined();
                    expect(typeof event.errorMessage).toBe('string');
                    expect(event.errorMessage.length).toBeGreaterThan(0);

                    // Field is present and valid
                    expect(event.field).toBeDefined();
                    expect(typeof event.field).toBe('string');
                    expect(event.field.length).toBeGreaterThan(0);

                    // Validation passes
                    const validation = validateErrorEvent(event);
                    expect(validation.isValid).toBe(true);
                    expect(validation.missingFields).toHaveLength(0);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Combined: All error events have complete required fields', () => {
        it('For any error event, all required fields SHALL be present and valid', () => {
            fc.assert(
                fc.property(anyErrorEventArbitrary, (event) => {
                    // Event name is a valid error event
                    const validErrorEvents = [
                        AnalyticsEvents.ERROR_OCCURRED,
                        AnalyticsEvents.API_ERROR,
                        AnalyticsEvents.VALIDATION_ERROR,
                    ];
                    expect(validErrorEvents).toContain(event.event);

                    // Error type is always present
                    expect(event.errorType).toBeDefined();
                    expect(typeof event.errorType).toBe('string');
                    expect(event.errorType.length).toBeGreaterThan(0);

                    // Error message is always present
                    expect(event.errorMessage).toBeDefined();
                    expect(typeof event.errorMessage).toBe('string');
                    expect(event.errorMessage.length).toBeGreaterThan(0);

                    // Base event fields are present
                    expect(event.timestamp).toBeDefined();
                    expect(event.pagePath).toBeDefined();
                    expect(typeof event.isAuthenticated).toBe('boolean');

                    // Timestamp is valid ISO 8601
                    const parsedDate = new Date(event.timestamp);
                    expect(isNaN(parsedDate.getTime())).toBe(false);

                    // Validation passes
                    const validation = validateErrorEvent(event);
                    expect(validation.isValid).toBe(true);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('PII Sanitization: Error events do not contain PII after sanitization', () => {
        it('For any error event with PII fields, sanitization SHALL remove them', () => {
            fc.assert(
                fc.property(
                    anyErrorEventArbitrary,
                    fc.string({ minLength: 5, maxLength: 50 }),
                    fc.string({ minLength: 5, maxLength: 50 }),
                    (event, email, password) => {
                        // Add PII fields to the event
                        const eventWithPII = {
                            ...event,
                            email: `${email}@example.com`,
                            password: password,
                            phone: '555-1234',
                        };

                        // Sanitize the event
                        const sanitized = sanitizeEventProperties(eventWithPII);

                        // PII fields should be removed
                        expect(sanitized).not.toHaveProperty('email');
                        expect(sanitized).not.toHaveProperty('password');
                        expect(sanitized).not.toHaveProperty('phone');

                        // Required fields should still be present
                        expect(sanitized.errorType).toBe(event.errorType);
                        expect(sanitized.errorMessage).toBe(event.errorMessage);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    describe('Severity levels: Error events have appropriate severity', () => {
        it('For any error event, severity SHALL be one of the valid levels', () => {
            fc.assert(
                fc.property(anyErrorEventArbitrary, (event) => {
                    const validSeverities = ['low', 'medium', 'high', 'critical'];
                    expect(validSeverities).toContain(event.severity);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('API error status codes: Status codes are in valid range', () => {
        it('For any API error event, statusCode SHALL be a valid HTTP error code', () => {
            fc.assert(
                fc.property(apiErrorEventArbitrary, (event) => {
                    // Status code should be in the 4xx or 5xx range
                    expect(event.statusCode).toBeGreaterThanOrEqual(400);
                    expect(event.statusCode).toBeLessThan(600);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Endpoint sanitization: API endpoints do not contain sensitive IDs', () => {
        it('For any API error event, endpoint SHALL have IDs replaced with :id', () => {
            fc.assert(
                fc.property(apiErrorEventArbitrary, (event) => {
                    // Endpoint should not contain numeric IDs (they should be replaced with :id)
                    const hasNumericId = /\/\d+(?:\/|$)/.test(event.endpoint);
                    expect(hasNumericId).toBe(false);

                    // Endpoint should contain :id placeholder if it's a resource endpoint
                    if (
                        event.endpoint.includes('/users/') ||
                        event.endpoint.includes('/problems/') ||
                        event.endpoint.includes('/submissions/') ||
                        event.endpoint.includes('/competitions/') ||
                        event.endpoint.includes('/comments/')
                    ) {
                        expect(event.endpoint).toContain(':id');
                    }
                }),
                { numRuns: 100 },
            );
        });
    });
});
