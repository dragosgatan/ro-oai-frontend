/**
 * Unit Tests for Problem Display Components - Translation Integration
 *
 * These tests verify that components correctly use the translation utility.
 * Since the translation utility itself is thoroughly tested with property-based tests,
 * these tests focus on verifying the integration points.
 */

import { describe, it, expect } from 'vitest';
import { getProblemContent } from '@/lib/problem-translations';
import type { Problem } from '@/lib/types';

describe('Problem Display Components - Translation Integration', () => {
    const mockProblemWithTranslations: Problem = {
        id: 1,
        title: 'Suma numerelor',
        shortDescription: 'Calculați suma a două numere',
        longDescription: 'Descriere detaliată în română',
        difficulty: 'Easy',
        author: 'Test Author',
        lastAttemptedScore: 85.5,
        partialTopScore: 90,
        datasetUrl: 'http://example.com/dataset',
        isInOngoingCompetition: false,
        selectedSubmissionIds: [],
        subtasks: null,
        titleEn: 'Sum of numbers',
        shortDescriptionEn: 'Calculate the sum of two numbers',
        longDescriptionEn: 'Detailed description in English',
    };

    const mockProblemWithoutTranslations: Problem = {
        ...mockProblemWithTranslations,
        titleEn: null,
        shortDescriptionEn: null,
        longDescriptionEn: null,
    };

    describe('English locale with translations', () => {
        it('should resolve to English content when translations exist', () => {
            const content = getProblemContent(mockProblemWithTranslations, 'en');

            expect(content.title).toBe('Sum of numbers');
            expect(content.shortDescription).toBe('Calculate the sum of two numbers');
            expect(content.longDescription).toBe('Detailed description in English');
        });
    });

    describe('English locale without translations', () => {
        it('should fallback to Romanian content when translations do not exist', () => {
            const content = getProblemContent(mockProblemWithoutTranslations, 'en');

            expect(content.title).toBe('Suma numerelor');
            expect(content.shortDescription).toBe('Calculați suma a două numere');
            expect(content.longDescription).toBe('Descriere detaliată în română');
        });
    });

    describe('Romanian locale', () => {
        it('should always return Romanian content regardless of translations', () => {
            const contentWithTranslations = getProblemContent(mockProblemWithTranslations, 'ro');
            const contentWithoutTranslations = getProblemContent(
                mockProblemWithoutTranslations,
                'ro',
            );

            // Both should return Romanian content
            expect(contentWithTranslations.title).toBe('Suma numerelor');
            expect(contentWithTranslations.shortDescription).toBe('Calculați suma a două numere');
            expect(contentWithTranslations.longDescription).toBe('Descriere detaliată în română');

            expect(contentWithoutTranslations.title).toBe('Suma numerelor');
            expect(contentWithoutTranslations.shortDescription).toBe(
                'Calculați suma a două numere',
            );
            expect(contentWithoutTranslations.longDescription).toBe(
                'Descriere detaliată în română',
            );
        });
    });

    describe('Component integration pattern', () => {
        it('should demonstrate correct usage pattern for components', () => {
            // This test documents the expected usage pattern in components:
            // 1. Get locale from useLocale hook
            // 2. Call getProblemContent with problem and locale
            // 3. Use the returned content for display

            const locale = 'en'; // From useLocale() hook
            const problem = mockProblemWithTranslations;

            // This is what components should do:
            const problemContent = getProblemContent(problem, locale);

            // Then use problemContent.title, problemContent.shortDescription, etc.
            expect(problemContent).toHaveProperty('title');
            expect(problemContent).toHaveProperty('shortDescription');
            expect(problemContent).toHaveProperty('longDescription');

            // All fields should be strings (never null/undefined)
            expect(typeof problemContent.title).toBe('string');
            expect(typeof problemContent.shortDescription).toBe('string');
            expect(typeof problemContent.longDescription).toBe('string');
        });
    });
});
