/**
 * Translation Resolution Property-Based Tests
 *
 * Property tests for task 10.3: Translation Resolution
 *
 * **Feature: multi-language-expansion, Property 3: Translation Fallback Chain**
 * **Feature: multi-language-expansion, Property 12: Translation Resolution with Fallback**
 *
 * This test verifies:
 * - Translation fallback chain works correctly for all 30 locales
 * - Fallback order: target locale → English → Romanian
 * - Never returns undefined or null when Romanian content exists
 *
 * **Validates: Requirements 1.4, 12.1, 12.2, 12.3, 12.4**
 */

import { describe, expect, it } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { SUPPORTED_LOCALES, type Locale } from '../types';
import {
    getProblemContent,
    TranslatableProblem,
    hasCompleteTranslation,
    hasAnyTranslation,
    getTranslationStatus,
} from '../problem-translations';
import {
    getCompetitionContent,
    TranslatableCompetition,
    hasCompleteCompetitionTranslation,
    hasAnyCompetitionTranslation,
    getCompetitionTranslationStatus,
} from '../competition-translations';

// Arbitrary for generating supported locale codes
const localeArbitrary = fc.constantFrom(...SUPPORTED_LOCALES);

// Arbitrary for generating non-empty strings
const nonEmptyStringArbitrary = fc.string({ minLength: 1, maxLength: 100 });

// Arbitrary for generating optional strings (can be null, undefined, or non-empty)
const optionalStringArbitrary = fc.oneof(
    fc.constant(null),
    fc.constant(undefined),
    fc.constant(''),
    nonEmptyStringArbitrary,
);

// Helper to capitalize locale code for field name generation
// Handles special case of 'zh-CN' -> 'ZhCn'
function capitalizeLocale(locale: string): string {
    if (locale === 'zh-CN') {
        return 'ZhCn';
    }
    return locale.charAt(0).toUpperCase() + locale.slice(1);
}

// Generate a TranslatableProblem with specific locale translations
function createProblemWithTranslations(
    roTitle: string,
    roShortDesc: string,
    roLongDesc: string,
    translations: Partial<
        Record<
            Locale,
            {
                title?: string | null;
                shortDescription?: string | null;
                longDescription?: string | null;
            }
        >
    >,
): TranslatableProblem {
    const problem: TranslatableProblem = {
        title: roTitle,
        shortDescription: roShortDesc,
        longDescription: roLongDesc,
    };

    for (const [locale, fields] of Object.entries(translations)) {
        if (locale === 'ro') continue;
        const cap = capitalizeLocale(locale);
        if (fields.title !== undefined) {
            (problem as Record<string, unknown>)[`title${cap}`] = fields.title;
        }
        if (fields.shortDescription !== undefined) {
            (problem as Record<string, unknown>)[`shortDescription${cap}`] =
                fields.shortDescription;
        }
        if (fields.longDescription !== undefined) {
            (problem as Record<string, unknown>)[`longDescription${cap}`] = fields.longDescription;
        }
    }

    return problem;
}

// Generate a TranslatableCompetition with specific locale translations
function createCompetitionWithTranslations(
    roName: string,
    roShortDesc: string,
    roDesc: string,
    roRules: string,
    translations: Partial<
        Record<
            Locale,
            {
                name?: string | null;
                shortDescription?: string | null;
                description?: string | null;
                rules?: string | null;
            }
        >
    >,
): TranslatableCompetition {
    const competition: TranslatableCompetition = {
        name: roName,
        shortDescription: roShortDesc,
        description: roDesc,
        rules: roRules,
    };

    for (const [locale, fields] of Object.entries(translations)) {
        if (locale === 'ro') continue;
        const cap = capitalizeLocale(locale);
        if (fields.name !== undefined) {
            (competition as Record<string, unknown>)[`name${cap}`] = fields.name;
        }
        if (fields.shortDescription !== undefined) {
            (competition as Record<string, unknown>)[`shortDescription${cap}`] =
                fields.shortDescription;
        }
        if (fields.description !== undefined) {
            (competition as Record<string, unknown>)[`description${cap}`] = fields.description;
        }
        if (fields.rules !== undefined) {
            (competition as Record<string, unknown>)[`rules${cap}`] = fields.rules;
        }
    }

    return competition;
}

describe('Translation Resolution Property-Based Tests', () => {
    describe('Property 3: Translation Fallback Chain', () => {
        test.prop(
            [
                localeArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
            ],
            { numRuns: 100 },
        )(
            'for any locale, when target translation is missing, should fall back to English then Romanian',
            (locale, roTitle, roShortDesc, roLongDesc) => {
                // Create problem with only Romanian content
                const problem = createProblemWithTranslations(roTitle, roShortDesc, roLongDesc, {});

                const content = getProblemContent(problem, locale);

                // Should always return Romanian content when no translations exist
                expect(content.title).toBe(roTitle);
                expect(content.shortDescription).toBe(roShortDesc);
                expect(content.longDescription).toBe(roLongDesc);
            },
        );

        test.prop(
            [
                localeArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
            ],
            { numRuns: 100 },
        )(
            'for any locale, when target is missing but English exists, should return English',
            (locale, roTitle, roShortDesc, roLongDesc, enTitle, enShortDesc, enLongDesc) => {
                // Skip if locale is 'en' or 'ro' (special cases)
                if (locale === 'en' || locale === 'ro') return;

                // Create problem with Romanian and English content only
                const problem = createProblemWithTranslations(roTitle, roShortDesc, roLongDesc, {
                    en: {
                        title: enTitle,
                        shortDescription: enShortDesc,
                        longDescription: enLongDesc,
                    },
                });

                const content = getProblemContent(problem, locale);

                // Should return English content as fallback
                expect(content.title).toBe(enTitle);
                expect(content.shortDescription).toBe(enShortDesc);
                expect(content.longDescription).toBe(enLongDesc);
            },
        );

        test.prop([nonEmptyStringArbitrary, nonEmptyStringArbitrary, nonEmptyStringArbitrary], {
            numRuns: 100,
        })(
            'for Romanian locale, should always return Romanian content directly',
            (roTitle, roShortDesc, roLongDesc) => {
                // Create problem with Romanian and English content
                const problem = createProblemWithTranslations(roTitle, roShortDesc, roLongDesc, {
                    en: {
                        title: 'English Title',
                        shortDescription: 'English Short',
                        longDescription: 'English Long',
                    },
                });

                const content = getProblemContent(problem, 'ro');

                // Should always return Romanian content
                expect(content.title).toBe(roTitle);
                expect(content.shortDescription).toBe(roShortDesc);
                expect(content.longDescription).toBe(roLongDesc);
            },
        );

        test.prop(
            [
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
            ],
            { numRuns: 100 },
        )(
            'for English locale, should return English content when available',
            (roTitle, roShortDesc, roLongDesc, enTitle, enShortDesc, enLongDesc) => {
                const problem = createProblemWithTranslations(roTitle, roShortDesc, roLongDesc, {
                    en: {
                        title: enTitle,
                        shortDescription: enShortDesc,
                        longDescription: enLongDesc,
                    },
                });

                const content = getProblemContent(problem, 'en');

                // Should return English content
                expect(content.title).toBe(enTitle);
                expect(content.shortDescription).toBe(enShortDesc);
                expect(content.longDescription).toBe(enLongDesc);
            },
        );
    });

    describe('Property 12: Translation Resolution with Fallback', () => {
        test.prop(
            [
                localeArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
            ],
            { numRuns: 100 },
        )(
            'for any problem with Romanian content, resolution should never return empty strings',
            (locale, roTitle, roShortDesc, roLongDesc) => {
                const problem = createProblemWithTranslations(roTitle, roShortDesc, roLongDesc, {});

                const content = getProblemContent(problem, locale);

                // Should never return empty strings when Romanian content exists
                expect(content.title.length).toBeGreaterThan(0);
                expect(content.shortDescription.length).toBeGreaterThan(0);
                expect(content.longDescription.length).toBeGreaterThan(0);
            },
        );

        test.prop(
            [
                localeArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
            ],
            { numRuns: 100 },
        )(
            'for any locale with target translation, should return target translation',
            (locale, roTitle, roShortDesc, roLongDesc, targetTitle) => {
                // Skip Romanian locale (no separate translation fields)
                if (locale === 'ro') return;

                const problem = createProblemWithTranslations(roTitle, roShortDesc, roLongDesc, {
                    [locale]: { title: targetTitle },
                });

                const content = getProblemContent(problem, locale);

                // Should return target locale title
                expect(content.title).toBe(targetTitle);
            },
        );

        // Competition translation tests
        test.prop(
            [
                localeArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
            ],
            { numRuns: 100 },
        )(
            'for any competition with Romanian content, resolution should never return empty strings',
            (locale, roName, roShortDesc, roDesc, roRules) => {
                const competition = createCompetitionWithTranslations(
                    roName,
                    roShortDesc,
                    roDesc,
                    roRules,
                    {},
                );

                const content = getCompetitionContent(competition, locale);

                // Should never return empty strings when Romanian content exists
                expect(content.name.length).toBeGreaterThan(0);
                expect(content.shortDescription.length).toBeGreaterThan(0);
                expect(content.description.length).toBeGreaterThan(0);
                expect(content.rules.length).toBeGreaterThan(0);
            },
        );

        test.prop(
            [
                localeArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
            ],
            { numRuns: 100 },
        )(
            'for any competition locale, when target is missing but English exists, should return English',
            (
                locale,
                roName,
                roShortDesc,
                roDesc,
                roRules,
                enName,
                enShortDesc,
                enDesc,
                enRules,
            ) => {
                // Skip if locale is 'en' or 'ro' (special cases)
                if (locale === 'en' || locale === 'ro') return;

                const competition = createCompetitionWithTranslations(
                    roName,
                    roShortDesc,
                    roDesc,
                    roRules,
                    {
                        en: {
                            name: enName,
                            shortDescription: enShortDesc,
                            description: enDesc,
                            rules: enRules,
                        },
                    },
                );

                const content = getCompetitionContent(competition, locale);

                // Should return English content as fallback
                expect(content.name).toBe(enName);
                expect(content.shortDescription).toBe(enShortDesc);
                expect(content.description).toBe(enDesc);
                expect(content.rules).toBe(enRules);
            },
        );
    });

    describe('Translation Status Functions', () => {
        test.prop([localeArbitrary], { numRuns: 100 })(
            'getTranslationStatus should return "none" for problem with no translations for any locale',
            (locale) => {
                // Skip Romanian (always has content)
                if (locale === 'ro') return;

                const problem = createProblemWithTranslations('Title', 'Short', 'Long', {});

                const status = getTranslationStatus(problem, locale);
                expect(status).toBe('none');
            },
        );

        test.prop([localeArbitrary, nonEmptyStringArbitrary], { numRuns: 100 })(
            'getTranslationStatus should return "partial" when only some fields are translated',
            (locale, title) => {
                // Skip Romanian (always has content)
                if (locale === 'ro') return;

                const problem = createProblemWithTranslations('Title', 'Short', 'Long', {
                    [locale]: { title },
                });

                const status = getTranslationStatus(problem, locale);
                expect(status).toBe('partial');
            },
        );

        test.prop(
            [
                localeArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
            ],
            { numRuns: 100 },
        )(
            'getTranslationStatus should return "complete" when all fields are translated',
            (locale, title, shortDesc, longDesc) => {
                // Skip Romanian (always has content)
                if (locale === 'ro') return;

                const problem = createProblemWithTranslations('Title', 'Short', 'Long', {
                    [locale]: { title, shortDescription: shortDesc, longDescription: longDesc },
                });

                const status = getTranslationStatus(problem, locale);
                expect(status).toBe('complete');
            },
        );

        test.prop([localeArbitrary], { numRuns: 100 })(
            'getCompetitionTranslationStatus should return "none" for competition with no translations',
            (locale) => {
                // Skip Romanian (always has content)
                if (locale === 'ro') return;

                const competition = createCompetitionWithTranslations(
                    'Name',
                    'Short',
                    'Desc',
                    'Rules',
                    {},
                );

                const status = getCompetitionTranslationStatus(competition, locale);
                expect(status).toBe('none');
            },
        );

        test.prop([localeArbitrary, nonEmptyStringArbitrary], { numRuns: 100 })(
            'getCompetitionTranslationStatus should return "partial" when only some fields are translated',
            (locale, name) => {
                // Skip Romanian (always has content)
                if (locale === 'ro') return;

                const competition = createCompetitionWithTranslations(
                    'Name',
                    'Short',
                    'Desc',
                    'Rules',
                    {
                        [locale]: { name },
                    },
                );

                const status = getCompetitionTranslationStatus(competition, locale);
                expect(status).toBe('partial');
            },
        );

        test.prop(
            [
                localeArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
                nonEmptyStringArbitrary,
            ],
            { numRuns: 100 },
        )(
            'getCompetitionTranslationStatus should return "complete" when all fields are translated',
            (locale, name, shortDesc, desc, rules) => {
                // Skip Romanian (always has content)
                if (locale === 'ro') return;

                const competition = createCompetitionWithTranslations(
                    'Name',
                    'Short',
                    'Desc',
                    'Rules',
                    {
                        [locale]: { name, shortDescription: shortDesc, description: desc, rules },
                    },
                );

                const status = getCompetitionTranslationStatus(competition, locale);
                expect(status).toBe('complete');
            },
        );
    });

    describe('All 30 Locales Coverage', () => {
        it('should support all 30 locales for problem translation resolution', () => {
            const problem = createProblemWithTranslations(
                'Romanian Title',
                'Romanian Short',
                'Romanian Long',
                {},
            );

            expect(SUPPORTED_LOCALES.length).toBe(30);
            SUPPORTED_LOCALES.forEach((locale) => {
                const content = getProblemContent(problem, locale);
                expect(content.title).toBe('Romanian Title');
                expect(content.shortDescription).toBe('Romanian Short');
                expect(content.longDescription).toBe('Romanian Long');
            });
        });

        it('should support all 30 locales for competition translation resolution', () => {
            const competition = createCompetitionWithTranslations(
                'Romanian Name',
                'Romanian Short',
                'Romanian Desc',
                'Romanian Rules',
                {},
            );

            expect(SUPPORTED_LOCALES.length).toBe(30);
            SUPPORTED_LOCALES.forEach((locale) => {
                const content = getCompetitionContent(competition, locale);
                expect(content.name).toBe('Romanian Name');
                expect(content.shortDescription).toBe('Romanian Short');
                expect(content.description).toBe('Romanian Desc');
                expect(content.rules).toBe('Romanian Rules');
            });
        });

        it('should correctly resolve translations for each of the 23 new locales', () => {
            const newLocales: Locale[] = [
                'ru',
                'kk',
                'ka',
                'fr',
                'nl',
                'et',
                'fi',
                'sv',
                'lv',
                'lt',
                'hr',
                'sk',
                'sl',
                'cs',
                'da',
                'it',
                'es',
                'pt',
                'pl',
                'no',
                'zh-CN',
                'ar',
                'he',
            ];

            newLocales.forEach((locale) => {
                const problem = createProblemWithTranslations(
                    'Romanian',
                    'Romanian Short',
                    'Romanian Long',
                    {
                        [locale]: { title: `${locale.toUpperCase()} Title` },
                    },
                );

                const content = getProblemContent(problem, locale);
                expect(content.title).toBe(`${locale.toUpperCase()} Title`);
            });
        });

        it('should correctly handle zh-CN locale with hyphenated code', () => {
            const problem = createProblemWithTranslations(
                'Romanian Title',
                'Romanian Short',
                'Romanian Long',
                {
                    'zh-CN': {
                        title: '中文标题',
                        shortDescription: '简短描述',
                        longDescription: '详细描述',
                    },
                },
            );

            const content = getProblemContent(problem, 'zh-CN');
            expect(content.title).toBe('中文标题');
            expect(content.shortDescription).toBe('简短描述');
            expect(content.longDescription).toBe('详细描述');
        });

        it('should correctly handle RTL locales (ar, he)', () => {
            // Arabic
            const problemAr = createProblemWithTranslations(
                'Romanian Title',
                'Romanian Short',
                'Romanian Long',
                {
                    ar: {
                        title: 'عنوان عربي',
                        shortDescription: 'وصف قصير',
                        longDescription: 'وصف طويل',
                    },
                },
            );

            const contentAr = getProblemContent(problemAr, 'ar');
            expect(contentAr.title).toBe('عنوان عربي');
            expect(contentAr.shortDescription).toBe('وصف قصير');
            expect(contentAr.longDescription).toBe('وصف طويل');

            // Hebrew
            const problemHe = createProblemWithTranslations(
                'Romanian Title',
                'Romanian Short',
                'Romanian Long',
                {
                    he: {
                        title: 'כותרת עברית',
                        shortDescription: 'תיאור קצר',
                        longDescription: 'תיאור ארוך',
                    },
                },
            );

            const contentHe = getProblemContent(problemHe, 'he');
            expect(contentHe.title).toBe('כותרת עברית');
            expect(contentHe.shortDescription).toBe('תיאור קצר');
            expect(contentHe.longDescription).toBe('תיאור ארוך');
        });

        it('should correctly handle competition translations for zh-CN, ar, he', () => {
            // Chinese
            const competitionZh = createCompetitionWithTranslations(
                'Romanian Name',
                'Romanian Short',
                'Romanian Desc',
                'Romanian Rules',
                {
                    'zh-CN': {
                        name: '中文名称',
                        shortDescription: '简短描述',
                        description: '详细描述',
                        rules: '规则',
                    },
                },
            );

            const contentZh = getCompetitionContent(competitionZh, 'zh-CN');
            expect(contentZh.name).toBe('中文名称');
            expect(contentZh.shortDescription).toBe('简短描述');
            expect(contentZh.description).toBe('详细描述');
            expect(contentZh.rules).toBe('规则');

            // Arabic
            const competitionAr = createCompetitionWithTranslations(
                'Romanian Name',
                'Romanian Short',
                'Romanian Desc',
                'Romanian Rules',
                {
                    ar: {
                        name: 'اسم عربي',
                        shortDescription: 'وصف قصير',
                        description: 'وصف',
                        rules: 'قواعد',
                    },
                },
            );

            const contentAr = getCompetitionContent(competitionAr, 'ar');
            expect(contentAr.name).toBe('اسم عربي');
            expect(contentAr.shortDescription).toBe('وصف قصير');
            expect(contentAr.description).toBe('وصف');
            expect(contentAr.rules).toBe('قواعد');

            // Hebrew
            const competitionHe = createCompetitionWithTranslations(
                'Romanian Name',
                'Romanian Short',
                'Romanian Desc',
                'Romanian Rules',
                {
                    he: {
                        name: 'שם עברי',
                        shortDescription: 'תיאור קצר',
                        description: 'תיאור',
                        rules: 'כללים',
                    },
                },
            );

            const contentHe = getCompetitionContent(competitionHe, 'he');
            expect(contentHe.name).toBe('שם עברי');
            expect(contentHe.shortDescription).toBe('תיאור קצר');
            expect(contentHe.description).toBe('תיאור');
            expect(contentHe.rules).toBe('כללים');
        });
    });
});
