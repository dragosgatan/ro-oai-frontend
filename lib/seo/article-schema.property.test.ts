/**
 * Property-Based Tests for Article Schema Validity
 *
 * **Property 3: Article Schema Validity**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 *
 * For any valid roadmap article, the generated Article schema SHALL contain
 * headline, author, datePublished, and publisher properties, with publisher
 * being a valid Organization schema.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    generateArticleSchema,
    sanitizeStructuredData,
    validateStructuredData,
    ArticleInput,
} from './structured-data';
import { ORGANIZATION_CONFIG } from './config';

/**
 * Arbitrary generator for ArticleInput
 */
const arbitraryArticleInput = (): fc.Arbitrary<ArticleInput> => {
    return fc.record({
        title: fc.string({ minLength: 1, maxLength: 200 }),
        slug: fc.string({ minLength: 1, maxLength: 100 }).map(
            (s) =>
                s
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '') || 'default-slug',
        ),
        html: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), { nil: undefined }),
        description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), { nil: undefined }),
        datePublished: fc.option(
            fc
                .integer({ min: 1577836800000, max: 1924905600000 })
                .map((ts) => new Date(ts).toISOString()),
            { nil: undefined },
        ),
        dateModified: fc.option(
            fc
                .integer({ min: 1577836800000, max: 1924905600000 })
                .map((ts) => new Date(ts).toISOString()),
            { nil: undefined },
        ),
        image: fc.option(fc.webUrl(), { nil: undefined }),
    });
};

/**
 * Arbitrary generator for Locale values
 */
const arbitraryLocale = (): fc.Arbitrary<string> => {
    return fc.constantFrom('en', 'ro');
};

describe('Article Schema Property Tests', () => {
    describe('Property 3: Article Schema Validity', () => {
        /**
         * **Feature: schema-org-structured-data, Property 3: Article Schema Validity**
         * **Validates: Requirements 3.1, 3.2, 3.3**
         */
        it('should generate valid Article schema with required @context and @type', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryArticleInput(),
                    arbitraryLocale(),
                    async (article, locale) => {
                        const schema = generateArticleSchema(article, locale);

                        // Requirement 3.1: Article schema SHALL be generated
                        expect(schema['@context']).toBe('https://schema.org');
                        expect(schema['@type']).toBe('Article');
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain headline property matching article title', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryArticleInput(),
                    arbitraryLocale(),
                    async (article, locale) => {
                        const schema = generateArticleSchema(article, locale);

                        // Requirement 3.2: SHALL contain headline
                        expect(schema.headline).toBeDefined();
                        expect(schema.headline).toBe(article.title);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain author as Organization with name and url', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryArticleInput(),
                    arbitraryLocale(),
                    async (article, locale) => {
                        const schema = generateArticleSchema(article, locale);

                        // Requirement 3.2: SHALL contain author
                        expect(schema.author).toBeDefined();
                        expect(schema.author['@type']).toBe('Organization');
                        expect(schema.author.name).toBe(ORGANIZATION_CONFIG.name);
                        expect(schema.author.url).toBe(ORGANIZATION_CONFIG.url);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain datePublished as valid ISO 8601 date', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryArticleInput(),
                    arbitraryLocale(),
                    async (article, locale) => {
                        const schema = generateArticleSchema(article, locale);

                        // Requirement 3.2: SHALL contain datePublished
                        expect(schema.datePublished).toBeDefined();
                        expect(typeof schema.datePublished).toBe('string');

                        // Should be a valid ISO date
                        const date = new Date(schema.datePublished);
                        expect(date.toString()).not.toBe('Invalid Date');
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain publisher as Organization with name and logo', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryArticleInput(),
                    arbitraryLocale(),
                    async (article, locale) => {
                        const schema = generateArticleSchema(article, locale);

                        // Requirement 3.3: SHALL include publisher with reference to Organization schema
                        expect(schema.publisher).toBeDefined();
                        expect(schema.publisher['@type']).toBe('Organization');
                        expect(schema.publisher.name).toBe(ORGANIZATION_CONFIG.name);
                        expect(schema.publisher.logo).toBeDefined();
                        expect(schema.publisher.logo['@type']).toBe('ImageObject');
                        expect(schema.publisher.logo.url).toBe(ORGANIZATION_CONFIG.logo);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain mainEntityOfPage with correct URL', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryArticleInput(),
                    arbitraryLocale(),
                    async (article, locale) => {
                        const schema = generateArticleSchema(article, locale);

                        expect(schema.mainEntityOfPage).toBeDefined();
                        expect(schema.mainEntityOfPage!['@type']).toBe('WebPage');
                        expect(schema.mainEntityOfPage!['@id']).toContain('/roadmap/');
                        expect(schema.mainEntityOfPage!['@id']).toContain(article.slug);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should pass validation check', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryArticleInput(),
                    arbitraryLocale(),
                    async (article, locale) => {
                        const schema = generateArticleSchema(article, locale);

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
                    arbitraryArticleInput(),
                    arbitraryLocale(),
                    async (article, locale) => {
                        const schema = generateArticleSchema(article, locale);
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
    });
});

describe('Article Schema Image Property Tests', () => {
    describe('Property 4: Article Image Conditional Inclusion', () => {
        /**
         * **Feature: schema-org-structured-data, Property 4: Article Image Conditional Inclusion**
         * **Validates: Requirements 3.4**
         *
         * For any roadmap article with an image property, the generated Article schema
         * SHALL include the image property; for articles without images, the image
         * property SHALL be omitted.
         */

        /**
         * Arbitrary generator for ArticleInput WITH image
         */
        const arbitraryArticleWithImage = (): fc.Arbitrary<ArticleInput> => {
            return fc.record({
                title: fc.string({ minLength: 1, maxLength: 200 }),
                slug: fc.string({ minLength: 1, maxLength: 100 }).map(
                    (s) =>
                        s
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '-')
                            .replace(/-+/g, '-')
                            .replace(/^-|-$/g, '') || 'default-slug',
                ),
                html: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), { nil: undefined }),
                description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), {
                    nil: undefined,
                }),
                datePublished: fc.option(
                    fc
                        .integer({ min: 1577836800000, max: 1924905600000 })
                        .map((ts) => new Date(ts).toISOString()),
                    { nil: undefined },
                ),
                dateModified: fc.option(
                    fc
                        .integer({ min: 1577836800000, max: 1924905600000 })
                        .map((ts) => new Date(ts).toISOString()),
                    { nil: undefined },
                ),
                // Always include image
                image: fc.webUrl(),
            });
        };

        /**
         * Arbitrary generator for ArticleInput WITHOUT image
         */
        const arbitraryArticleWithoutImage = (): fc.Arbitrary<ArticleInput> => {
            return fc.record({
                title: fc.string({ minLength: 1, maxLength: 200 }),
                slug: fc.string({ minLength: 1, maxLength: 100 }).map(
                    (s) =>
                        s
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '-')
                            .replace(/-+/g, '-')
                            .replace(/^-|-$/g, '') || 'default-slug',
                ),
                html: fc.option(fc.string({ minLength: 0, maxLength: 1000 }), { nil: undefined }),
                description: fc.option(fc.string({ minLength: 0, maxLength: 200 }), {
                    nil: undefined,
                }),
                datePublished: fc.option(
                    fc
                        .integer({ min: 1577836800000, max: 1924905600000 })
                        .map((ts) => new Date(ts).toISOString()),
                    { nil: undefined },
                ),
                dateModified: fc.option(
                    fc
                        .integer({ min: 1577836800000, max: 1924905600000 })
                        .map((ts) => new Date(ts).toISOString()),
                    { nil: undefined },
                ),
                // Never include image
                image: fc.constant(undefined),
            });
        };

        it('should include image property when article has image', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryArticleWithImage(),
                    arbitraryLocale(),
                    async (article, locale) => {
                        const schema = generateArticleSchema(article, locale);

                        // Requirement 3.4: IF article has image, THEN schema SHALL include image
                        expect(schema.image).toBeDefined();
                        expect(schema.image).toBe(article.image);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should omit image property when article has no image', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryArticleWithoutImage(),
                    arbitraryLocale(),
                    async (article, locale) => {
                        const schema = generateArticleSchema(article, locale);

                        // Requirement 3.4: IF article has no image, THEN image SHALL be omitted
                        expect(schema.image).toBeUndefined();
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should still be valid schema regardless of image presence', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.oneof(arbitraryArticleWithImage(), arbitraryArticleWithoutImage()),
                    arbitraryLocale(),
                    async (article, locale) => {
                        const schema = generateArticleSchema(article, locale);

                        // Schema should always be valid
                        expect(validateStructuredData(schema)).toBe(true);
                    },
                ),
                { numRuns: 100 },
            );
        });
    });
});
