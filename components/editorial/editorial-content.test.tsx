/**
 * Property-based tests for EditorialContent component
 *
 * Tests Properties 9 and 10 from the design document.
 */

import { describe, it, expect } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import { extractHeadings, generateSlug, TocHeading } from './editorial-content';

// Arbitrary for generating valid heading text (non-empty, no HTML)
const headingTextArbitrary = fc
    .stringMatching(/^[a-zA-Z0-9\s]{1,50}$/)
    .filter((s) => s.trim().length > 0);

// Arbitrary for generating heading levels (1-6)
const headingLevelArbitrary = fc.integer({ min: 1, max: 6 });

// Arbitrary for generating valid HTML heading
const htmlHeadingArbitrary = fc
    .tuple(
        headingLevelArbitrary,
        headingTextArbitrary,
        fc.option(fc.stringMatching(/^[a-z0-9-]{1,20}$/)),
    )
    .map(([level, text, id]) => {
        const idAttr = id ? ` id="${id}"` : '';
        return { html: `<h${level}${idAttr}>${text}</h${level}>`, level, text: text.trim(), id };
    });

describe('EditorialContent', () => {
    describe('Property 9: Markdown rendering produces valid HTML', () => {
        /**
         * **Feature: competition-editorial, Property 9: Markdown rendering produces valid HTML**
         * **Validates: Requirements 4.1**
         *
         * Note: The actual markdown-to-HTML conversion happens on the backend.
         * This test validates that the frontend correctly handles the HTML output.
         * We test that the extractHeadings function correctly parses HTML headings.
         */

        fcTest.prop([fc.array(htmlHeadingArbitrary, { minLength: 0, maxLength: 10 })])(
            'extractHeadings should parse all headings from valid HTML',
            (headingData) => {
                const htmlContent = headingData.map((h) => h.html).join('\n<p>Some content</p>\n');
                const extracted = extractHeadings(htmlContent);

                // Should extract the same number of headings
                expect(extracted.length).toBe(headingData.length);

                // Each extracted heading should have correct level and text
                headingData.forEach((expected, index) => {
                    expect(extracted[index].level).toBe(expected.level);
                    expect(extracted[index].text).toBe(expected.text);
                });
            },
        );

        it('should handle empty content', () => {
            expect(extractHeadings('')).toEqual([]);
        });

        it('should handle content with no headings', () => {
            const html = '<p>Just a paragraph</p><div>And a div</div>';
            expect(extractHeadings(html)).toEqual([]);
        });

        it('should handle null/undefined content gracefully', () => {
            expect(extractHeadings(null as any)).toEqual([]);
            expect(extractHeadings(undefined as any)).toEqual([]);
        });
    });

    describe('Property 10: Table of contents generation from headings', () => {
        /**
         * **Feature: competition-editorial, Property 10: Table of contents generation from headings**
         * **Validates: Requirements 4.4**
         *
         * For any editorial content containing markdown headings, the generated
         * table of contents should contain an entry for each heading in document order.
         */

        fcTest.prop([fc.array(htmlHeadingArbitrary, { minLength: 1, maxLength: 10 })])(
            'table of contents should contain entry for each heading in document order',
            (headingData) => {
                const htmlContent = headingData
                    .map((h) => h.html)
                    .join('\n<p>Content between headings</p>\n');
                const toc = extractHeadings(htmlContent);

                // Should have same number of entries as headings
                expect(toc.length).toBe(headingData.length);

                // Entries should be in document order (same order as input)
                headingData.forEach((expected, index) => {
                    expect(toc[index].text).toBe(expected.text);
                    expect(toc[index].level).toBe(expected.level);
                });
            },
        );

        fcTest.prop([fc.array(htmlHeadingArbitrary, { minLength: 1, maxLength: 10 })])(
            'each TOC entry should have a valid id',
            (headingData) => {
                const htmlContent = headingData.map((h) => h.html).join('\n');
                const toc = extractHeadings(htmlContent);

                toc.forEach((entry) => {
                    expect(entry.id).toBeTruthy();
                    expect(typeof entry.id).toBe('string');
                    expect(entry.id.length).toBeGreaterThan(0);
                });
            },
        );

        fcTest.prop([fc.array(htmlHeadingArbitrary, { minLength: 1, maxLength: 10 })])(
            'TOC entries should preserve heading hierarchy (levels)',
            (headingData) => {
                const htmlContent = headingData.map((h) => h.html).join('\n');
                const toc = extractHeadings(htmlContent);

                toc.forEach((entry, index) => {
                    expect(entry.level).toBe(headingData[index].level);
                    expect(entry.level).toBeGreaterThanOrEqual(1);
                    expect(entry.level).toBeLessThanOrEqual(6);
                });
            },
        );
    });

    describe('generateSlug', () => {
        fcTest.prop([headingTextArbitrary])('should generate lowercase slugs', (text) => {
            const slug = generateSlug(text);
            expect(slug).toBe(slug.toLowerCase());
        });

        fcTest.prop([headingTextArbitrary])('should not contain spaces', (text) => {
            const slug = generateSlug(text);
            expect(slug).not.toContain(' ');
        });

        it('should convert spaces to hyphens', () => {
            expect(generateSlug('Hello World')).toBe('hello-world');
        });

        it('should remove special characters', () => {
            expect(generateSlug('Hello! World?')).toBe('hello-world');
        });
    });
});
