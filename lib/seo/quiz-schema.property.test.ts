/**
 * Property-Based Tests for Quiz Schema Validity
 *
 * **Property 6: Quiz Schema Validity**
 * **Validates: Requirements 5.1, 5.2**
 *
 * For any valid problem, the generated Quiz schema SHALL contain name,
 * and optionally about, educationalLevel, and hasPart with Question elements.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    generateQuizSchema,
    validateStructuredData,
    sanitizeStructuredData,
} from './structured-data';
import type { Problem } from '@/lib/types';

/**
 * Arbitrary generator for Locale values
 */
const arbitraryLocale = (): fc.Arbitrary<string> => {
    return fc.constantFrom('en', 'ro');
};

/**
 * Arbitrary generator for Problem difficulty
 */
const arbitraryDifficulty = (): fc.Arbitrary<'Easy' | 'Medium' | 'Hard'> => {
    return fc.constantFrom('Easy', 'Medium', 'Hard');
};

/**
 * Arbitrary generator for Problem subtasks
 */
const arbitrarySubtasks = (): fc.Arbitrary<
    { metricName: string; subtaskName: string }[] | null
> => {
    return fc.option(
        fc.array(
            fc.record({
                metricName: fc
                    .string({ minLength: 1, maxLength: 50 })
                    .filter((s) => s.trim().length > 0),
                subtaskName: fc
                    .string({ minLength: 1, maxLength: 100 })
                    .filter((s) => s.trim().length > 0),
            }),
            { minLength: 1, maxLength: 5 },
        ),
        { nil: null },
    );
};

/**
 * Arbitrary generator for Problem
 */
const arbitraryProblem = (): fc.Arbitrary<Problem> => {
    return fc.record({
        id: fc.integer({ min: 1, max: 100000 }),
        title: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
        shortDescription: fc
            .string({ minLength: 1, maxLength: 500 })
            .filter((s) => s.trim().length > 0),
        longDescription: fc.option(fc.string({ maxLength: 2000 }), { nil: undefined }),
        difficulty: arbitraryDifficulty(),
        author: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        lastAttemptedScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
        topScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
        partialTopScore: fc.integer({ min: 0, max: 100 }),
        datasetUrl: fc.option(fc.webUrl(), { nil: undefined }),
        inputFormat: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        outputFormat: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        subtasks: arbitrarySubtasks(),
        selectionLimit: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
        competitionId: fc.option(fc.integer({ min: 1, max: 100000 }), { nil: undefined }),
        competitionName: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
        isInOngoingCompetition: fc.boolean(),
        competitionEndTime: fc.option(
            fc
                .integer({ min: Date.now() - 86400000 * 365, max: Date.now() + 86400000 * 365 })
                .map((ts) => new Date(ts).toISOString()),
            { nil: undefined },
        ),
        maxSubmissionsPerCompetition: fc.option(fc.integer({ min: 1, max: 100 }), {
            nil: undefined,
        }),
        selectedSubmissionIds: fc.array(fc.integer({ min: 1, max: 100000 }), { maxLength: 10 }),
        metricPreference: fc.constantFrom(
            'SMALLER_IS_BETTER',
            'BIGGER_IS_BETTER',
            'FASTER_SUBMISSION_IS_BETTER',
        ),
        titleEn: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
        shortDescriptionEn: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        longDescriptionEn: fc.option(fc.string({ maxLength: 2000 }), { nil: undefined }),
    });
};

describe('Quiz Schema Property Tests', () => {
    describe('Property 6: Quiz Schema Validity', () => {
        /**
         * **Feature: schema-org-structured-data, Property 6: Quiz Schema Validity**
         * **Validates: Requirements 5.1, 5.2**
         */
        it('should generate valid Quiz schema with required @context and @type', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryProblem(), arbitraryLocale(), async (problem, locale) => {
                    const schema = generateQuizSchema(problem, locale);

                    // Requirement 5.1: Quiz schema SHALL be generated
                    expect(schema['@context']).toBe('https://schema.org');
                    expect(schema['@type']).toBe('Quiz');
                }),
                { numRuns: 100 },
            );
        });

        it('should contain name property matching problem title', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryProblem(), arbitraryLocale(), async (problem, locale) => {
                    const schema = generateQuizSchema(problem, locale);

                    // Requirement 5.2: SHALL contain name
                    expect(schema.name).toBe(problem.title);
                }),
                { numRuns: 100 },
            );
        });

        it('should contain about property with Thing type', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryProblem(), arbitraryLocale(), async (problem, locale) => {
                    const schema = generateQuizSchema(problem, locale);

                    // Requirement 5.2: SHALL contain about (subject)
                    expect(schema.about).toBeDefined();
                    expect(schema.about!['@type']).toBe('Thing');
                    expect(schema.about!.name).toBe('Machine Learning');
                }),
                { numRuns: 100 },
            );
        });

        it('should contain educationalLevel based on difficulty', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryProblem(), arbitraryLocale(), async (problem, locale) => {
                    const schema = generateQuizSchema(problem, locale);

                    // Requirement 5.2: SHALL contain educationalLevel
                    expect(schema.educationalLevel).toBeDefined();

                    // Verify mapping is correct
                    const expectedMapping: Record<string, string> = {
                        Easy: 'beginner',
                        Medium: 'intermediate',
                        Hard: 'advanced',
                    };
                    expect(schema.educationalLevel).toBe(expectedMapping[problem.difficulty]);
                }),
                { numRuns: 100 },
            );
        });

        it('should contain each author as a separate Person', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryProblem(), arbitraryLocale(), async (problem, locale) => {
                    const schema = generateQuizSchema(problem, locale);

                    // Requirement 5.2: SHALL contain author
                    expect(schema.author).toBeDefined();
                    expect(schema.author).toEqual([
                        {
                            '@type': 'Person',
                            name: problem.author.trim().replace(/\s+/g, ' '),
                        },
                    ]);
                }),
                { numRuns: 100 },
            );
        });

        it('should pass validation check', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryProblem(), arbitraryLocale(), async (problem, locale) => {
                    const schema = generateQuizSchema(problem, locale);

                    // Schema should pass validation
                    expect(validateStructuredData(schema)).toBe(true);
                }),
                { numRuns: 100 },
            );
        });

        it('should be safe after sanitization (no XSS vectors)', async () => {
            await fc.assert(
                fc.asyncProperty(arbitraryProblem(), arbitraryLocale(), async (problem, locale) => {
                    const schema = generateQuizSchema(problem, locale);
                    const sanitized = sanitizeStructuredData(schema);

                    // Sanitized schema should still be valid
                    expect(validateStructuredData(sanitized)).toBe(true);

                    // Check that no dangerous content exists
                    const jsonString = JSON.stringify(sanitized);
                    expect(jsonString).not.toMatch(/<script/i);
                    expect(jsonString).not.toMatch(/javascript:/i);
                    expect(jsonString).not.toMatch(/on\w+\s*=/i);
                }),
                { numRuns: 100 },
            );
        });
    });
});

/**
 * Property-Based Tests for Quiz Keywords Conditional Inclusion
 *
 * **Property 7: Quiz Keywords Conditional Inclusion**
 * **Validates: Requirements 5.4**
 *
 * For any problem with subtasks (categories), the generated Quiz schema SHALL include keywords;
 * for problems without subtasks, keywords SHALL be omitted.
 */

/**
 * Arbitrary generator for Problem with subtasks (categories)
 */
const arbitraryProblemWithSubtasks = (): fc.Arbitrary<Problem> => {
    return fc.record({
        id: fc.integer({ min: 1, max: 100000 }),
        title: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
        shortDescription: fc
            .string({ minLength: 1, maxLength: 500 })
            .filter((s) => s.trim().length > 0),
        longDescription: fc.option(fc.string({ maxLength: 2000 }), { nil: undefined }),
        difficulty: arbitraryDifficulty(),
        author: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        lastAttemptedScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
        topScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
        partialTopScore: fc.integer({ min: 0, max: 100 }),
        datasetUrl: fc.option(fc.webUrl(), { nil: undefined }),
        inputFormat: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        outputFormat: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        // Force subtasks to be present
        subtasks: fc.array(
            fc.record({
                metricName: fc
                    .string({ minLength: 1, maxLength: 50 })
                    .filter((s) => s.trim().length > 0),
                subtaskName: fc
                    .string({ minLength: 1, maxLength: 100 })
                    .filter((s) => s.trim().length > 0),
            }),
            { minLength: 1, maxLength: 5 },
        ),
        selectionLimit: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
        competitionId: fc.option(fc.integer({ min: 1, max: 100000 }), { nil: undefined }),
        competitionName: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
        isInOngoingCompetition: fc.boolean(),
        competitionEndTime: fc.option(
            fc
                .integer({ min: Date.now() - 86400000 * 365, max: Date.now() + 86400000 * 365 })
                .map((ts) => new Date(ts).toISOString()),
            { nil: undefined },
        ),
        maxSubmissionsPerCompetition: fc.option(fc.integer({ min: 1, max: 100 }), {
            nil: undefined,
        }),
        selectedSubmissionIds: fc.array(fc.integer({ min: 1, max: 100000 }), { maxLength: 10 }),
        metricPreference: fc.constantFrom(
            'SMALLER_IS_BETTER',
            'BIGGER_IS_BETTER',
            'FASTER_SUBMISSION_IS_BETTER',
        ),
        titleEn: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
        shortDescriptionEn: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        longDescriptionEn: fc.option(fc.string({ maxLength: 2000 }), { nil: undefined }),
    });
};

/**
 * Arbitrary generator for Problem without subtasks
 */
const arbitraryProblemWithoutSubtasks = (): fc.Arbitrary<Problem> => {
    return fc.record({
        id: fc.integer({ min: 1, max: 100000 }),
        title: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
        shortDescription: fc
            .string({ minLength: 1, maxLength: 500 })
            .filter((s) => s.trim().length > 0),
        longDescription: fc.option(fc.string({ maxLength: 2000 }), { nil: undefined }),
        difficulty: arbitraryDifficulty(),
        author: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        lastAttemptedScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: null }),
        topScore: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
        partialTopScore: fc.integer({ min: 0, max: 100 }),
        datasetUrl: fc.option(fc.webUrl(), { nil: undefined }),
        inputFormat: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        outputFormat: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        // Force subtasks to be null
        subtasks: fc.constant(null),
        selectionLimit: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
        competitionId: fc.option(fc.integer({ min: 1, max: 100000 }), { nil: undefined }),
        competitionName: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
        isInOngoingCompetition: fc.boolean(),
        competitionEndTime: fc.option(
            fc
                .integer({ min: Date.now() - 86400000 * 365, max: Date.now() + 86400000 * 365 })
                .map((ts) => new Date(ts).toISOString()),
            { nil: undefined },
        ),
        maxSubmissionsPerCompetition: fc.option(fc.integer({ min: 1, max: 100 }), {
            nil: undefined,
        }),
        selectedSubmissionIds: fc.array(fc.integer({ min: 1, max: 100000 }), { maxLength: 10 }),
        metricPreference: fc.constantFrom(
            'SMALLER_IS_BETTER',
            'BIGGER_IS_BETTER',
            'FASTER_SUBMISSION_IS_BETTER',
        ),
        titleEn: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
        shortDescriptionEn: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
        longDescriptionEn: fc.option(fc.string({ maxLength: 2000 }), { nil: undefined }),
    });
};

describe('Property 7: Quiz Keywords Conditional Inclusion', () => {
    /**
     * **Feature: schema-org-structured-data, Property 7: Quiz Keywords Conditional Inclusion**
     * **Validates: Requirements 5.4**
     */
    it('should include keywords when problem has subtasks (categories)', async () => {
        await fc.assert(
            fc.asyncProperty(
                arbitraryProblemWithSubtasks(),
                arbitraryLocale(),
                async (problem, locale) => {
                    const schema = generateQuizSchema(problem, locale);

                    // Requirement 5.4: SHALL include keywords when subtasks exist
                    expect(schema.keywords).toBeDefined();
                    expect(Array.isArray(schema.keywords)).toBe(true);
                    expect(schema.keywords!.length).toBe(problem.subtasks!.length);

                    // Keywords should match subtask names
                    problem.subtasks!.forEach((subtask, index) => {
                        expect(schema.keywords![index]).toBe(subtask.subtaskName);
                    });
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should omit keywords when problem has no subtasks', async () => {
        await fc.assert(
            fc.asyncProperty(
                arbitraryProblemWithoutSubtasks(),
                arbitraryLocale(),
                async (problem, locale) => {
                    const schema = generateQuizSchema(problem, locale);

                    // Requirement 5.4: keywords SHALL be omitted when no subtasks
                    expect(schema.keywords).toBeUndefined();
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should include educationalAlignment when problem has subtasks', async () => {
        await fc.assert(
            fc.asyncProperty(
                arbitraryProblemWithSubtasks(),
                arbitraryLocale(),
                async (problem, locale) => {
                    const schema = generateQuizSchema(problem, locale);

                    // educationalAlignment should be present when subtasks exist
                    expect(schema.educationalAlignment).toBeDefined();
                    expect(Array.isArray(schema.educationalAlignment)).toBe(true);
                    expect(schema.educationalAlignment!.length).toBe(problem.subtasks!.length);

                    // Each alignment should have correct structure
                    schema.educationalAlignment!.forEach((alignment, index) => {
                        expect(alignment['@type']).toBe('AlignmentObject');
                        expect(alignment.alignmentType).toBe('educationalSubject');
                        expect(alignment.targetName).toBe(problem.subtasks![index].subtaskName);
                    });
                },
            ),
            { numRuns: 100 },
        );
    });

    it('should omit educationalAlignment when problem has no subtasks', async () => {
        await fc.assert(
            fc.asyncProperty(
                arbitraryProblemWithoutSubtasks(),
                arbitraryLocale(),
                async (problem, locale) => {
                    const schema = generateQuizSchema(problem, locale);

                    // educationalAlignment should be omitted when no subtasks
                    expect(schema.educationalAlignment).toBeUndefined();
                },
            ),
            { numRuns: 100 },
        );
    });
});
