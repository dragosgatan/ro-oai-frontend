/**
 * Property-Based Tests for PII Sanitization
 *
 * **Feature: seo-gtm-social-sharing, Property 9: PII Sanitization**
 *
 * *For any* object passed to the event sanitizer, the output SHALL NOT contain
 * any of the following fields: email, password, phone, address, ssn, creditCard
 *
 * **Validates: Requirements 8.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sanitizeEventProperties, containsPII } from './events';

// ============================================================================
// Arbitrary Generators
// ============================================================================

/**
 * Generator for objects with various PII fields
 */
const objectWithPIIArbitrary = fc.record({
    // PII fields
    email: fc.option(fc.emailAddress(), { nil: undefined }),
    password: fc.option(fc.string({ minLength: 8, maxLength: 32 }), { nil: undefined }),
    phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
    phoneNumber: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
    address: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
    ssn: fc.option(fc.string({ minLength: 9, maxLength: 11 }), { nil: undefined }),
    creditCard: fc.option(fc.string({ minLength: 16, maxLength: 19 }), { nil: undefined }),
    credit_card: fc.option(fc.string({ minLength: 16, maxLength: 19 }), { nil: undefined }),
    // Non-PII fields that should be preserved
    eventName: fc.string({ minLength: 1, maxLength: 50 }),
    timestamp: fc
        .integer({
            min: new Date('2020-01-01').getTime(),
            max: new Date('2030-12-31').getTime(),
        })
        .map((t) => new Date(t).toISOString()),
    pagePath: fc.string({ minLength: 1, maxLength: 100 }),
    isAuthenticated: fc.boolean(),
    competitionId: fc.option(fc.uuid(), { nil: undefined }),
    problemId: fc.option(fc.uuid(), { nil: undefined }),
    score: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
});

/**
 * Generator for nested objects with PII
 */
const nestedObjectWithPIIArbitrary = fc.record({
    event: fc.string({ minLength: 1, maxLength: 50 }),
    user: fc.record({
        email: fc.option(fc.emailAddress(), { nil: undefined }),
        password: fc.option(fc.string(), { nil: undefined }),
        displayName: fc.string({ minLength: 1, maxLength: 50 }),
    }),
    metadata: fc.record({
        phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
        address: fc.option(fc.string(), { nil: undefined }),
        timestamp: fc
            .integer({
                min: new Date('2020-01-01').getTime(),
                max: new Date('2030-12-31').getTime(),
            })
            .map((t) => new Date(t).toISOString()),
    }),
    data: fc.record({
        ssn: fc.option(fc.string({ minLength: 9, maxLength: 11 }), { nil: undefined }),
        creditCard: fc.option(fc.string({ minLength: 16, maxLength: 19 }), { nil: undefined }),
        value: fc.integer({ min: 0, max: 1000 }),
    }),
});

/**
 * Generator for arrays containing objects with PII
 */
const arrayWithPIIArbitrary = fc.record({
    event: fc.string({ minLength: 1, maxLength: 50 }),
    items: fc.array(
        fc.record({
            email: fc.option(fc.emailAddress(), { nil: undefined }),
            password: fc.option(fc.string(), { nil: undefined }),
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        { minLength: 0, maxLength: 5 },
    ),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * List of PII field names that should be removed
 */
const PII_FIELDS = [
    'email',
    'password',
    'phone',
    'phoneNumber',
    'phone_number',
    'address',
    'ssn',
    'creditCard',
    'credit_card',
];

/**
 * Recursively check if an object contains any PII fields
 */
function hasPIIFields(obj: any): boolean {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
        return false;
    }

    if (Array.isArray(obj)) {
        return obj.some((item) => hasPIIFields(item));
    }

    for (const key of Object.keys(obj)) {
        if (PII_FIELDS.includes(key.toLowerCase())) {
            if (obj[key] !== undefined) {
                return true;
            }
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (hasPIIFields(obj[key])) {
                return true;
            }
        }
    }

    return false;
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 9: PII Sanitization', () => {
    /**
     * **Feature: seo-gtm-social-sharing, Property 9: PII Sanitization**
     * **Validates: Requirements 8.4**
     */

    describe('Flat object sanitization', () => {
        it('For any object with PII fields, sanitization SHALL remove all PII', () => {
            fc.assert(
                fc.property(objectWithPIIArbitrary, (obj) => {
                    const sanitized = sanitizeEventProperties(obj);

                    // PII fields should be removed
                    expect(sanitized.email).toBeUndefined();
                    expect(sanitized.password).toBeUndefined();
                    expect(sanitized.phone).toBeUndefined();
                    expect(sanitized.phoneNumber).toBeUndefined();
                    expect(sanitized.address).toBeUndefined();
                    expect(sanitized.ssn).toBeUndefined();
                    expect(sanitized.creditCard).toBeUndefined();
                    expect(sanitized.credit_card).toBeUndefined();

                    // Non-PII fields should be preserved
                    expect(sanitized.eventName).toBe(obj.eventName);
                    expect(sanitized.timestamp).toBe(obj.timestamp);
                    expect(sanitized.pagePath).toBe(obj.pagePath);
                    expect(sanitized.isAuthenticated).toBe(obj.isAuthenticated);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Nested object sanitization', () => {
        it('For any nested object with PII, sanitization SHALL recursively remove all PII', () => {
            fc.assert(
                fc.property(nestedObjectWithPIIArbitrary, (obj) => {
                    const sanitized = sanitizeEventProperties(obj);

                    // Nested PII fields should be removed
                    expect(sanitized.user?.email).toBeUndefined();
                    expect(sanitized.user?.password).toBeUndefined();
                    expect(sanitized.metadata?.phone).toBeUndefined();
                    expect(sanitized.metadata?.address).toBeUndefined();
                    expect(sanitized.data?.ssn).toBeUndefined();
                    expect(sanitized.data?.creditCard).toBeUndefined();

                    // Non-PII nested fields should be preserved
                    expect(sanitized.event).toBe(obj.event);
                    expect(sanitized.user?.displayName).toBe(obj.user.displayName);
                    expect(sanitized.metadata?.timestamp).toBe(obj.metadata.timestamp);
                    expect(sanitized.data?.value).toBe(obj.data.value);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Array sanitization', () => {
        it('For any array containing objects with PII, sanitization SHALL remove PII from all items', () => {
            fc.assert(
                fc.property(arrayWithPIIArbitrary, (obj) => {
                    const sanitized = sanitizeEventProperties(obj);

                    // Check each item in the array
                    if (sanitized.items && Array.isArray(sanitized.items)) {
                        sanitized.items.forEach((item: any, index: number) => {
                            // PII should be removed
                            expect(item.email).toBeUndefined();
                            expect(item.password).toBeUndefined();

                            // Non-PII should be preserved
                            expect(item.id).toBe(obj.items[index].id);
                        });
                    }

                    // Event name should be preserved
                    expect(sanitized.event).toBe(obj.event);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('Sanitized output contains no PII', () => {
        it('For any input, the sanitized output SHALL NOT contain any PII fields', () => {
            fc.assert(
                fc.property(objectWithPIIArbitrary, (obj) => {
                    const sanitized = sanitizeEventProperties(obj);

                    // The sanitized object should not have any PII fields
                    expect(hasPIIFields(sanitized)).toBe(false);
                }),
                { numRuns: 100 },
            );
        });

        it('For any nested input, the sanitized output SHALL NOT contain any PII fields', () => {
            fc.assert(
                fc.property(nestedObjectWithPIIArbitrary, (obj) => {
                    const sanitized = sanitizeEventProperties(obj);

                    // The sanitized object should not have any PII fields
                    expect(hasPIIFields(sanitized)).toBe(false);
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('containsPII helper function', () => {
        it('For any object with PII, containsPII SHALL return true', () => {
            const objWithPII = {
                event: 'test',
                email: 'test@example.com',
            };
            expect(containsPII(objWithPII)).toBe(true);
        });

        it('For any object without PII, containsPII SHALL return false', () => {
            const objWithoutPII = {
                event: 'test',
                timestamp: new Date().toISOString(),
                pagePath: '/test',
            };
            expect(containsPII(objWithoutPII)).toBe(false);
        });
    });
});
