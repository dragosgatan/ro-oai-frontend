/**
 * Property-Based Tests for Breadcrumb Schema Validity
 *
 * **Property 2: Breadcrumb Schema Validity**
 * **Validates: Requirements 2.1, 2.2, 2.3**
 *
 * For any list of breadcrumb items, the generated BreadcrumbList schema SHALL contain
 * all items in order with correct position, name, and item (URL) properties for each element.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateBreadcrumbSchema, validateStructuredData } from './structured-data';
import type { BreadcrumbItem } from './types';

/**
 * Arbitrary generator for valid URL strings
 */
const arbitraryUrl = (): fc.Arbitrary<string> => {
    return fc.webUrl({ validSchemes: ['https'] });
};

/**
 * Arbitrary generator for breadcrumb item names (non-empty strings)
 */
const arbitraryBreadcrumbName = (): fc.Arbitrary<string> => {
    return fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);
};

/**
 * Arbitrary generator for a single BreadcrumbItem
 */
const arbitraryBreadcrumbItem = (): fc.Arbitrary<BreadcrumbItem> => {
    return fc.record({
        name: arbitraryBreadcrumbName(),
        url: arbitraryUrl(),
    });
};

/**
 * Arbitrary generator for a list of BreadcrumbItems (at least 1 item for valid breadcrumb)
 */
const arbitraryBreadcrumbItems = (): fc.Arbitrary<BreadcrumbItem[]> => {
    return fc.array(arbitraryBreadcrumbItem(), { minLength: 1, maxLength: 10 });
};

describe('Breadcrumb Schema Property Tests', () => {
    describe('Property 2: Breadcrumb Schema Validity', () => {
        /**
         * **Feature: schema-org-structured-data, Property 2: Breadcrumb Schema Validity**
         * **Validates: Requirements 2.1, 2.2, 2.3**
         */
        it('should generate valid BreadcrumbList schema with required @context and @type', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryBreadcrumbItems(), async (items) => {
                    const schema = generateBreadcrumbSchema(items);

                    // Requirement 2.1: BreadcrumbList schema SHALL be generated
                    expect(schema['@context']).toBe('https://schema.org');
                    expect(schema['@type']).toBe('BreadcrumbList');
                }),
                { numRuns: 100 },
            );
        }, 30000);

        it('should contain all items from input in the itemListElement array', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryBreadcrumbItems(), async (items) => {
                    const schema = generateBreadcrumbSchema(items);

                    // Requirement 2.2: SHALL include all elements from hierarchy
                    expect(schema.itemListElement).toBeDefined();
                    expect(Array.isArray(schema.itemListElement)).toBe(true);
                    expect(schema.itemListElement.length).toBe(items.length);
                }),
                { numRuns: 100 },
            );
        });

        it('should have correct position, name, and item (URL) for each element', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryBreadcrumbItems(), async (items) => {
                    const schema = generateBreadcrumbSchema(items);

                    // Requirement 2.3: Each element SHALL contain position, name, and item (URL)
                    schema.itemListElement.forEach((element, index) => {
                        // Check @type is ListItem
                        expect(element['@type']).toBe('ListItem');

                        // Check position is 1-indexed and matches order
                        expect(element.position).toBe(index + 1);

                        // Check name matches input
                        expect(element.name).toBe(items[index].name);

                        // Check item (URL) matches input
                        expect(element.item).toBe(items[index].url);
                    });
                }),
                { numRuns: 100 },
            );
        });

        it('should maintain correct order of items (positions are sequential)', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryBreadcrumbItems(), async (items) => {
                    const schema = generateBreadcrumbSchema(items);

                    // Verify positions are sequential starting from 1
                    const positions = schema.itemListElement.map((el) => el.position);
                    const expectedPositions = items.map((_, index) => index + 1);

                    expect(positions).toEqual(expectedPositions);
                }),
                { numRuns: 100 },
            );
        });

        it('should pass validation check', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryBreadcrumbItems(), async (items) => {
                    const schema = generateBreadcrumbSchema(items);

                    // Schema should pass validation
                    expect(validateStructuredData(schema)).toBe(true);
                }),
                { numRuns: 100 },
            );
        });

        it('should handle single item breadcrumb (homepage child)', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryBreadcrumbItem(), async (item) => {
                    const schema = generateBreadcrumbSchema([item]);

                    expect(schema.itemListElement.length).toBe(1);
                    expect(schema.itemListElement[0].position).toBe(1);
                    expect(schema.itemListElement[0].name).toBe(item.name);
                    expect(schema.itemListElement[0].item).toBe(item.url);
                }),
                { numRuns: 100 },
            );
        });

        it('should handle typical 3-level hierarchy (Home > Section > Page)', async () => {
            // Test with realistic breadcrumb structure
            const typicalBreadcrumbs: BreadcrumbItem[] = [
                { name: 'Home', url: 'https://example.com' },
                { name: 'Problems', url: 'https://example.com/problems' },
                { name: 'Problem Title', url: 'https://example.com/problems/123' },
            ];

            const schema = generateBreadcrumbSchema(typicalBreadcrumbs);

            expect(schema.itemListElement.length).toBe(3);
            expect(schema.itemListElement[0].position).toBe(1);
            expect(schema.itemListElement[0].name).toBe('Home');
            expect(schema.itemListElement[1].position).toBe(2);
            expect(schema.itemListElement[1].name).toBe('Problems');
            expect(schema.itemListElement[2].position).toBe(3);
            expect(schema.itemListElement[2].name).toBe('Problem Title');
        });

        it('should produce valid JSON that can be serialized and parsed', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryBreadcrumbItems(), async (items) => {
                    const schema = generateBreadcrumbSchema(items);

                    // Should be serializable to JSON
                    const jsonString = JSON.stringify(schema);
                    expect(typeof jsonString).toBe('string');

                    // Should be parseable back
                    const parsed = JSON.parse(jsonString);
                    expect(parsed['@context']).toBe('https://schema.org');
                    expect(parsed['@type']).toBe('BreadcrumbList');
                    expect(parsed.itemListElement.length).toBe(items.length);
                }),
                { numRuns: 100 },
            );
        });
    });
});
