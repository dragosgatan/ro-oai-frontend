/**
 * Property-Based Tests for Event Schema Validity
 *
 * **Property 5: Event Schema Validity**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 *
 * For any valid competition, the generated Event schema SHALL contain
 * name, startDate, endDate, location, description, organizer, eventStatus,
 * and eventAttendanceMode properties.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    generateCompetitionSchema,
    getEventStatus,
    validateStructuredData,
    sanitizeStructuredData,
} from './structured-data';
import { ORGANIZATION_CONFIG } from './config';
import type { CompetitionUserResponse } from '@/lib/types';

/**
 * Arbitrary generator for Locale values
 */
const arbitraryLocale = (): fc.Arbitrary<string> => {
    return fc.constantFrom('en', 'ro');
};

/**
 * Arbitrary generator for ISO 8601 date strings
 */
const arbitraryISODate = (): fc.Arbitrary<string> => {
    // Generate timestamps between 2020 and 2030
    const minTimestamp = new Date('2020-01-01T00:00:00Z').getTime();
    const maxTimestamp = new Date('2030-12-31T23:59:59Z').getTime();

    return fc
        .integer({ min: minTimestamp, max: maxTimestamp })
        .map((timestamp) => new Date(timestamp).toISOString());
};

/**
 * Arbitrary generator for CompetitionUserResponse
 */
const arbitraryCompetition = (): fc.Arbitrary<CompetitionUserResponse> => {
    return fc
        .record({
            id: fc.integer({ min: 1, max: 100000 }),
            name: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
            startTime: arbitraryISODate(),
            endTime: arbitraryISODate(),
            joined: fc.boolean(),
            problems: fc.constant([] as CompetitionUserResponse['problems']),
            rules: fc.string({ maxLength: 1000 }),
            description: fc
                .string({ minLength: 1, maxLength: 500 })
                .filter((s) => s.trim().length > 0),
            hasEditorial: fc.option(fc.boolean(), { nil: undefined }),
            showAwardRank: fc.boolean(),
        })
        .filter((comp) => {
            // Ensure endTime is after startTime
            return new Date(comp.endTime) >= new Date(comp.startTime);
        });
};

describe('Event Schema Property Tests', () => {
    describe('Property 5: Event Schema Validity', () => {
        /**
         * **Feature: schema-org-structured-data, Property 5: Event Schema Validity**
         * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
         */
        it('should generate valid Event schema with required @context and @type', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const schema = generateCompetitionSchema(competition, locale);

                        // Requirement 4.1: Event schema SHALL be generated
                        expect(schema['@context']).toBe('https://schema.org');
                        expect(schema['@type']).toBe('Event');
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain name, startDate, and endDate properties', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const schema = generateCompetitionSchema(competition, locale);

                        // Requirement 4.2: SHALL contain name, startDate, endDate
                        expect(schema.name).toBe(competition.name);
                        expect(schema.startDate).toBe(competition.startTime);
                        expect(schema.endDate).toBe(competition.endTime);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain description property', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const schema = generateCompetitionSchema(competition, locale);

                        // Requirement 4.2: SHALL contain description
                        expect(schema.description).toBe(competition.description);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain location as VirtualLocation', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const schema = generateCompetitionSchema(competition, locale);

                        // Requirement 4.2: SHALL contain location (online)
                        expect(schema.location).toBeDefined();
                        expect(schema.location['@type']).toBe('VirtualLocation');
                        expect(schema.location.url).toBeDefined();
                        expect(schema.location.url).toContain(`/competitions/${competition.id}`);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain organizer as Organization', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const schema = generateCompetitionSchema(competition, locale);

                        // Requirement 4.2: SHALL contain organizer
                        expect(schema.organizer).toBeDefined();
                        expect(schema.organizer['@type']).toBe('Organization');
                        expect(schema.organizer.name).toBe(ORGANIZATION_CONFIG.name);
                        expect(schema.organizer.url).toBe(ORGANIZATION_CONFIG.url);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain eventStatus with valid schema.org URL', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const schema = generateCompetitionSchema(competition, locale);

                        // Requirement 4.3: SHALL include eventStatus
                        expect(schema.eventStatus).toBeDefined();
                        expect(schema.eventStatus).toMatch(/^https:\/\/schema\.org\/Event/);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain eventAttendanceMode as OnlineEventAttendanceMode', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const schema = generateCompetitionSchema(competition, locale);

                        // Requirement 4.4: SHALL include eventAttendanceMode
                        expect(schema.eventAttendanceMode).toBe(
                            'https://schema.org/OnlineEventAttendanceMode',
                        );
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain image property', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const schema = generateCompetitionSchema(competition, locale);

                        // Requirement 4.5: SHALL include image
                        expect(schema.image).toBeDefined();
                        expect(typeof schema.image).toBe('string');
                        expect(schema.image).toMatch(/^https?:\/\//);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain offers with price, availability, and validFrom', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const schema = generateCompetitionSchema(competition, locale);

                        // Offers should be present with required properties
                        expect(schema.offers).toBeDefined();
                        expect(schema.offers!['@type']).toBe('Offer');
                        expect(schema.offers!.price).toBe('0');
                        expect(schema.offers!.priceCurrency).toBe('RON');
                        expect(schema.offers!.availability).toBe('https://schema.org/InStock');
                        expect(schema.offers!.url).toBeDefined();
                        expect(schema.offers!.validFrom).toBe(competition.startTime);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should pass validation check', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const schema = generateCompetitionSchema(competition, locale);

                        // Schema should pass validation
                        expect(validateStructuredData(schema)).toBe(true);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should be safe after sanitization (no XSS vectors)', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryCompetition(),
                    arbitraryLocale(),
                    async (competition, locale) => {
                        const schema = generateCompetitionSchema(competition, locale);
                        const sanitized = sanitizeStructuredData(schema);

                        // Sanitized schema should still be valid
                        expect(validateStructuredData(sanitized)).toBe(true);

                        // Check that no dangerous content exists
                        const jsonString = JSON.stringify(sanitized);
                        expect(jsonString).not.toMatch(/<script/i);
                        expect(jsonString).not.toMatch(/javascript:/i);
                        expect(jsonString).not.toMatch(/on\w+\s*=/i);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should generate correct locale-specific URLs', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryCompetition(), async (competition) => {
                    const schemaEn = generateCompetitionSchema(competition, 'en');
                    const schemaRo = generateCompetitionSchema(competition, 'ro');

                    // English locale should not have locale prefix
                    expect(schemaEn.location.url).not.toContain('/ro/');

                    // Romanian locale should have /ro/ prefix
                    expect(schemaRo.location.url).toContain('/ro/');
                }),
                { numRuns: 100 },
            );
        });
    });

    describe('getEventStatus helper function', () => {
        it('should return EventScheduled for future events', () => {
            const futureStart = new Date(Date.now() + 86400000).toISOString(); // +1 day
            const futureEnd = new Date(Date.now() + 172800000).toISOString(); // +2 days

            expect(getEventStatus(futureStart, futureEnd)).toBe(
                'https://schema.org/EventScheduled',
            );
        });

        it('should return EventScheduled for ongoing events', () => {
            const pastStart = new Date(Date.now() - 86400000).toISOString(); // -1 day
            const futureEnd = new Date(Date.now() + 86400000).toISOString(); // +1 day

            expect(getEventStatus(pastStart, futureEnd)).toBe('https://schema.org/EventScheduled');
        });

        it('should return EventScheduled for past events', () => {
            const pastStart = new Date(Date.now() - 172800000).toISOString(); // -2 days
            const pastEnd = new Date(Date.now() - 86400000).toISOString(); // -1 day

            expect(getEventStatus(pastStart, pastEnd)).toBe('https://schema.org/EventScheduled');
        });
    });
});
