/**
 * Property-Based Tests for ImageObject Schema Validity
 *
 * **Property 8: ImageObject Schema Validity**
 * **Validates: Requirements 6.2, 6.3**
 *
 * For any image with license information, the generated ImageObject schema SHALL
 * contain contentUrl, and optionally license, acquireLicensePage, creditText,
 * and creator properties.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    generateImageObjectSchema,
    ImageObjectOptions,
    sanitizeStructuredData,
    validateStructuredData,
} from './structured-data';
import { ORGANIZATION_CONFIG, BASE_URL } from './config';

/**
 * Arbitrary generator for ImageObjectOptions
 */
const arbitraryImageObjectOptions = (): fc.Arbitrary<ImageObjectOptions | undefined> => {
    return fc.option(
        fc.record({
            license: fc.option(fc.webUrl(), { nil: undefined }),
            acquireLicensePage: fc.option(fc.webUrl(), { nil: undefined }),
            creditText: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            creator: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
            copyrightNotice: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
                nil: undefined,
            }),
            width: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
            height: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
        }),
        { nil: undefined },
    );
};

/**
 * Arbitrary generator for valid image URLs
 */
const arbitraryImageUrl = (): fc.Arbitrary<string> => {
    return fc.webUrl().map((url) => {
        // Ensure URL ends with an image extension for realism
        const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const ext = extensions[Math.floor(Math.random() * extensions.length)];
        return url.endsWith(ext) ? url : `${url}/image${ext}`;
    });
};

describe('ImageObject Schema Property Tests', () => {
    describe('Property 8: ImageObject Schema Validity', () => {
        /**
         * **Feature: schema-org-structured-data, Property 8: ImageObject Schema Validity**
         * **Validates: Requirements 6.2, 6.3**
         */
        it('should generate valid ImageObject schema with required @context and @type', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryImageUrl(),
                    arbitraryImageObjectOptions(),
                    async (imageUrl, options) => {
                        const schema = generateImageObjectSchema(imageUrl, options);

                        // Requirement 6.1: ImageObject schema SHALL be generated
                        expect(schema['@context']).toBe('https://schema.org');
                        expect(schema['@type']).toBe('ImageObject');
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain contentUrl property matching input imageUrl', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryImageUrl(),
                    arbitraryImageObjectOptions(),
                    async (imageUrl, options) => {
                        const schema = generateImageObjectSchema(imageUrl, options);

                        // Requirement 6.2: SHALL contain contentUrl
                        expect(schema.contentUrl).toBeDefined();
                        expect(schema.contentUrl).toBe(imageUrl);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain license property (custom or default)', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryImageUrl(),
                    arbitraryImageObjectOptions(),
                    async (imageUrl, options) => {
                        const schema = generateImageObjectSchema(imageUrl, options);

                        // Requirement 6.2: SHALL contain license
                        expect(schema.license).toBeDefined();
                        expect(typeof schema.license).toBe('string');

                        // If custom license provided, use it; otherwise default
                        if (options?.license) {
                            expect(schema.license).toBe(options.license);
                        } else {
                            expect(schema.license).toBe(
                                'https://creativecommons.org/licenses/by-nc/4.0/',
                            );
                        }
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain acquireLicensePage property (custom or default)', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryImageUrl(),
                    arbitraryImageObjectOptions(),
                    async (imageUrl, options) => {
                        const schema = generateImageObjectSchema(imageUrl, options);

                        // Requirement 6.2: SHALL contain acquireLicensePage
                        expect(schema.acquireLicensePage).toBeDefined();
                        expect(typeof schema.acquireLicensePage).toBe('string');

                        // If custom acquireLicensePage provided, use it; otherwise default
                        if (options?.acquireLicensePage) {
                            expect(schema.acquireLicensePage).toBe(options.acquireLicensePage);
                        } else {
                            expect(schema.acquireLicensePage).toBe(`${BASE_URL}/terms`);
                        }
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain creditText property (custom or default)', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryImageUrl(),
                    arbitraryImageObjectOptions(),
                    async (imageUrl, options) => {
                        const schema = generateImageObjectSchema(imageUrl, options);

                        // Requirement 6.2: SHALL contain creditText
                        expect(schema.creditText).toBeDefined();
                        expect(typeof schema.creditText).toBe('string');

                        // If custom creditText provided, use it; otherwise default
                        if (options?.creditText) {
                            expect(schema.creditText).toBe(options.creditText);
                        } else {
                            expect(schema.creditText).toBe(ORGANIZATION_CONFIG.name);
                        }
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain creator property with Organization type', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryImageUrl(),
                    arbitraryImageObjectOptions(),
                    async (imageUrl, options) => {
                        const schema = generateImageObjectSchema(imageUrl, options);

                        // Requirement 6.3: SHALL specify creator if available
                        expect(schema.creator).toBeDefined();
                        expect(schema.creator!['@type']).toBe('Organization');
                        expect(schema.creator!.name).toBeDefined();

                        // If custom creator provided, use it; otherwise default
                        if (options?.creator) {
                            expect(schema.creator!.name).toBe(options.creator);
                        } else {
                            expect(schema.creator!.name).toBe(ORGANIZATION_CONFIG.name);
                        }
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should contain copyrightNotice property (custom or default)', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryImageUrl(),
                    arbitraryImageObjectOptions(),
                    async (imageUrl, options) => {
                        const schema = generateImageObjectSchema(imageUrl, options);

                        // Requirement 6.4: SHALL include copyrightNotice
                        expect(schema.copyrightNotice).toBeDefined();
                        expect(typeof schema.copyrightNotice).toBe('string');

                        // If custom copyrightNotice provided, use it; otherwise default
                        if (options?.copyrightNotice) {
                            expect(schema.copyrightNotice).toBe(options.copyrightNotice);
                        } else {
                            expect(schema.copyrightNotice).toContain('©');
                            expect(schema.copyrightNotice).toContain(ORGANIZATION_CONFIG.name);
                        }
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should include dimensions when provided', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryImageUrl(),
                    fc.record({
                        width: fc.integer({ min: 1, max: 10000 }),
                        height: fc.integer({ min: 1, max: 10000 }),
                    }),
                    async (imageUrl, dimensions) => {
                        const schema = generateImageObjectSchema(imageUrl, dimensions);

                        expect(schema.width).toBe(dimensions.width);
                        expect(schema.height).toBe(dimensions.height);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should pass validation check', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryImageUrl(),
                    arbitraryImageObjectOptions(),
                    async (imageUrl, options) => {
                        const schema = generateImageObjectSchema(imageUrl, options);

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
                    arbitraryImageUrl(),
                    arbitraryImageObjectOptions(),
                    async (imageUrl, options) => {
                        const schema = generateImageObjectSchema(imageUrl, options);
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
