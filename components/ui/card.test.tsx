/**
 * Property-Based Tests for Highlighted Card Attributes
 *
 * Feature: highlighted-competitions, Property 4: Highlighted Card Attributes
 * Validates: Requirements 3.1, 4.1
 *
 * Property: For any competition where highlighted is true, the rendered card component should:
 * 1. Have the highlighted CSS class applied
 * 2. Include an aria-label indicating highlighted status
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { Card } from './card';

/**
 * Arbitrary generator for card props
 */
const arbitraryCardProps = () =>
    fc.record({
        highlighted: fc.boolean(),
        hover: fc.boolean(),
        gradientBorder: fc.boolean(),
        animated: fc.constant(false), // Keep animated false to avoid framer-motion complexity
        className: fc.option(fc.string({ minLength: 0, maxLength: 20 }), { nil: undefined }),
        innerClassName: fc.option(fc.string({ minLength: 0, maxLength: 20 }), { nil: undefined }),
    });

describe('Card Component - Property-Based Tests', () => {
    /**
     * Feature: highlighted-competitions, Property 4: Highlighted Card Attributes
     * Validates: Requirements 3.1, 4.1
     *
     * Property: For any competition where highlighted is true, the rendered card
     * component should have the highlighted CSS class applied.
     */
    describe('Property 4: Highlighted Card Attributes', () => {
        it('should apply highlighted-card-wrapper class when highlighted prop is true', () => {
            fc.assert(
                fc.property(arbitraryCardProps(), (props) => {
                    const { container } = render(
                        <Card {...props}>
                            <div>Test content</div>
                        </Card>,
                    );

                    // When highlighted, the component renders a <style> element first,
                    // so we need to use querySelector to find the actual card element
                    const highlightedCard = container.querySelector('.highlighted-card-wrapper');

                    if (props.highlighted) {
                        // When highlighted is true, the card should have the highlighted-card-wrapper class
                        expect(highlightedCard).not.toBeNull();
                    } else {
                        // When highlighted is false, the card should NOT have the highlighted-card-wrapper class
                        expect(highlightedCard).toBeNull();
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should apply highlighted-card-inner-content class to inner wrapper when highlighted', () => {
            fc.assert(
                fc.property(arbitraryCardProps(), (props) => {
                    const { container } = render(
                        <Card {...props}>
                            <div data-testid="content">Test content</div>
                        </Card>,
                    );

                    const innerWrapper = container.querySelector('.highlighted-card-inner-content');

                    if (props.highlighted) {
                        // When highlighted is true, there should be an inner wrapper with the class
                        expect(innerWrapper).not.toBeNull();
                    }
                }),
                { numRuns: 100 },
            );
        });

        it('should not apply gradientBorder styles when highlighted is true', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        highlighted: fc.constant(true),
                        gradientBorder: fc.boolean(),
                        hover: fc.boolean(),
                    }),
                    (props) => {
                        const { container } = render(
                            <Card {...props}>
                                <div>Test content</div>
                            </Card>,
                        );

                        const cardElement = container.querySelector(
                            '.highlighted-card-wrapper',
                        ) as HTMLElement;

                        // When highlighted is true, the card should use highlighted styling
                        // and not the gradientBorder styling (they are mutually exclusive)
                        expect(cardElement).not.toBeNull();

                        // The gradientBorder class pattern should not be applied when highlighted
                        // (gradientBorder uses 'from-primary/20 via-accent/20 to-primary/20')
                        const hasGradientBorderClass =
                            cardElement.className.includes('from-primary/20');
                        expect(hasGradientBorderClass).toBe(false);
                    },
                ),
                { numRuns: 100 },
            );
        });

        it('should preserve other card functionality when highlighted', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        highlighted: fc.constant(true),
                        hover: fc.boolean(),
                    }),
                    (props) => {
                        const { container } = render(
                            <Card {...props}>
                                <div>Test content</div>
                            </Card>,
                        );

                        const cardElement = container.querySelector(
                            '.highlighted-card-wrapper',
                        ) as HTMLElement;

                        // Highlighted cards use highlighted-card-wrapper class
                        expect(cardElement).not.toBeNull();

                        // Hover classes should be applied when hover prop is true
                        if (props.hover) {
                            expect(cardElement.classList.contains('cursor-pointer')).toBe(true);
                        }
                    },
                ),
                { numRuns: 100 },
            );
        });
    });

    /**
     * Unit tests for specific scenarios
     */
    describe('Unit Tests - Highlighted Card', () => {
        it('should render with highlighted-card-wrapper class when highlighted=true', () => {
            const { container } = render(
                <Card highlighted={true}>
                    <div>Content</div>
                </Card>,
            );

            // The first child might be a style element, so we need to find the actual card div
            const cardElement = container.querySelector('.highlighted-card-wrapper');
            expect(cardElement).not.toBeNull();
        });

        it('should not render with highlighted-card-wrapper class when highlighted=false', () => {
            const { container } = render(
                <Card highlighted={false}>
                    <div>Content</div>
                </Card>,
            );

            const cardElement = container.querySelector('.highlighted-card-wrapper');
            expect(cardElement).toBeNull();
        });

        it('should render with highlighted-card-wrapper class when highlighted=true and gradientBorder=true', () => {
            const { container } = render(
                <Card highlighted={true} gradientBorder={true}>
                    <div>Content</div>
                </Card>,
            );

            // highlighted takes precedence
            const cardElement = container.querySelector('.highlighted-card-wrapper');
            expect(cardElement).not.toBeNull();
        });

        it('should render with gradientBorder styles when highlighted=false and gradientBorder=true', () => {
            const { container } = render(
                <Card highlighted={false} gradientBorder={true}>
                    <div>Content</div>
                </Card>,
            );

            const highlightedCard = container.querySelector('.highlighted-card-wrapper');
            expect(highlightedCard).toBeNull();

            // gradientBorder applies its own styling - check for the gradient class
            const cardElement = container.firstChild as HTMLElement;
            expect(cardElement.className.includes('from-primary/20')).toBe(true);
        });
    });
});
