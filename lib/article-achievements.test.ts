import { describe, expect, it } from 'vitest';

import {
    ARTICLE_ACHIEVEMENT_TRACKS,
    buildArticleAchievementJourney,
    isArticleAchievementCode,
} from '@/lib/article-achievements';
import type { Achievement, AchievementProgress, UserAchievement } from '@/lib/types';
import enMessages from '@/locales/en.json';
import roMessages from '@/locales/ro.json';

const codeOrder = ARTICLE_ACHIEVEMENT_TRACKS.flatMap((track) => [...track.codes]);

function achievement(code: string, targetValue: number, id = codeOrder.indexOf(code) + 1) {
    return {
        id,
        code,
        name: code,
        description: `${code} description`,
        iconUrl: `/achievements/${code.toLowerCase()}.svg`,
        category: 'ENGAGEMENT',
        rarity: 'COMMON',
        xpReward: 50,
        targetValue,
        isSecret: false,
        unlockedPercentage: 1,
    } satisfies Achievement;
}

const definitions = [
    achievement('FIRST_ARTICLE', 1),
    achievement('ARTICLE_AUTHOR_5', 5),
    achievement('ARTICLE_AUTHOR_10', 10),
    achievement('ARTICLE_AUTHOR_25', 25),
    achievement('FIRST_EDITORIAL', 1),
    achievement('EDITORIAL_AUTHOR_10', 10),
];

function earned(definition: Achievement): UserAchievement {
    return {
        id: definition.id + 100,
        achievement: definition,
        unlockedAt: new Date('2026-07-15T10:00:00Z'),
        isShowcased: false,
    };
}

function progress(definition: Achievement, currentValue: number): AchievementProgress {
    return {
        achievementId: definition.id,
        achievement: definition,
        currentValue,
        targetValue: definition.targetValue,
        percentComplete: (currentValue / definition.targetValue) * 100,
        lastUpdated: new Date('2026-07-15T10:00:00Z'),
    };
}

describe('article achievement journey', () => {
    it('uses stable codes and preserves the intended milestone order', () => {
        const tracks = buildArticleAchievementJourney({
            achievements: [...definitions].reverse(),
            userAchievements: [],
            progress: [],
            showUpcoming: true,
        });

        expect(tracks.map((track) => track.id)).toEqual(['articles', 'editorials']);
        expect(tracks[0]?.milestones.map((item) => item.achievement.code)).toEqual([
            'FIRST_ARTICLE',
            'ARTICLE_AUTHOR_5',
            'ARTICLE_AUTHOR_10',
            'ARTICLE_AUTHOR_25',
        ]);
        expect(tracks[1]?.milestones.map((item) => item.achievement.code)).toEqual([
            'FIRST_EDITORIAL',
            'EDITORIAL_AUTHOR_10',
        ]);
    });

    it('shows the next unearned milestone to the profile owner', () => {
        const firstArticle = definitions[0];
        const fiveArticles = definitions[1];
        const tracks = buildArticleAchievementJourney({
            achievements: definitions,
            userAchievements: [earned(firstArticle)],
            progress: [progress(fiveArticles, 3)],
            showUpcoming: true,
        });

        expect(tracks[0]?.displayMilestone).toMatchObject({
            isEarned: false,
            currentValue: 3,
            targetValue: 5,
            percentComplete: 60,
        });
        expect(tracks[0]?.displayMilestone?.achievement.code).toBe('ARTICLE_AUTHOR_5');
    });

    it('shows visitors only the highest earned milestone rather than private-looking goals', () => {
        const tracks = buildArticleAchievementJourney({
            achievements: definitions,
            userAchievements: [earned(definitions[0]), earned(definitions[1])],
            progress: [progress(definitions[2], 7)],
            showUpcoming: false,
        });

        expect(tracks[0]?.displayMilestone?.achievement.code).toBe('ARTICLE_AUTHOR_5');
        expect(tracks[0]?.displayMilestone?.isEarned).toBe(true);
        expect(tracks[1]?.displayMilestone).toBeNull();
    });

    it('merges definitions embedded in earned and progress responses during a rolling deploy', () => {
        const tracks = buildArticleAchievementJourney({
            achievements: [],
            userAchievements: [earned(definitions[0])],
            progress: [progress(definitions[1], 2)],
            showUpcoming: true,
        });

        expect(tracks).toHaveLength(1);
        expect(tracks[0]?.milestones).toHaveLength(2);
        expect(tracks[0]?.displayMilestone?.achievement.code).toBe('ARTICLE_AUTHOR_5');
    });

    it('recognizes only the agreed article achievement codes', () => {
        for (const code of codeOrder) expect(isArticleAchievementCode(code)).toBe(true);
        expect(isArticleAchievementCode('FIRST_SOLVE')).toBe(false);
        expect(isArticleAchievementCode('ARTICLE_AUTHOR_UNKNOWN')).toBe(false);
    });

    it.each([
        ['en', enMessages],
        ['ro', roMessages],
    ])('keeps localized names and descriptions complete in %s', (_locale, messages) => {
        const names = messages.achievements.names as Record<string, string>;
        const descriptions = messages.achievements.descriptions as Record<string, string>;

        for (const code of codeOrder) {
            expect(names[code]).toEqual(expect.any(String));
            expect(names[code]?.trim()).not.toBe('');
            expect(descriptions[code]).toEqual(expect.any(String));
            expect(descriptions[code]?.trim()).not.toBe('');
        }
    });
});
