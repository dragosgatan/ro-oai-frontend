import type { Achievement, AchievementProgress, UserAchievement } from '@/lib/types';

export const ARTICLE_ACHIEVEMENT_TRACKS = [
    {
        id: 'articles',
        codes: ['FIRST_ARTICLE', 'ARTICLE_AUTHOR_5', 'ARTICLE_AUTHOR_10', 'ARTICLE_AUTHOR_25'],
    },
    {
        id: 'editorials',
        codes: ['FIRST_EDITORIAL', 'EDITORIAL_AUTHOR_10'],
    },
] as const;

export type ArticleAchievementTrackId = (typeof ARTICLE_ACHIEVEMENT_TRACKS)[number]['id'];
export type ArticleAchievementCode = (typeof ARTICLE_ACHIEVEMENT_TRACKS)[number]['codes'][number];

export type ArticleAchievementMilestone = {
    achievement: Achievement;
    userAchievement?: UserAchievement;
    progress?: AchievementProgress;
    isEarned: boolean;
    currentValue: number;
    targetValue: number;
    percentComplete: number;
};

export type ArticleAchievementTrack = {
    id: ArticleAchievementTrackId;
    milestones: ArticleAchievementMilestone[];
    earnedCount: number;
    displayMilestone: ArticleAchievementMilestone | null;
    isComplete: boolean;
};

type ArticleAchievementJourneyInput = {
    achievements: Achievement[];
    userAchievements: UserAchievement[];
    progress: AchievementProgress[];
    showUpcoming: boolean;
};

function clampPercent(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.min(100, Math.max(0, value));
}

function milestoneFor(
    achievement: Achievement,
    earnedByCode: Map<string, UserAchievement>,
    progressByCode: Map<string, AchievementProgress>,
): ArticleAchievementMilestone {
    const userAchievement = earnedByCode.get(achievement.code);
    const achievementProgress = progressByCode.get(achievement.code);
    const isEarned = Boolean(userAchievement);
    const targetValue = Math.max(1, achievementProgress?.targetValue ?? achievement.targetValue);
    const currentValue = isEarned
        ? targetValue
        : Math.max(0, achievementProgress?.currentValue ?? 0);
    const percentComplete = isEarned
        ? 100
        : clampPercent(achievementProgress?.percentComplete ?? (currentValue / targetValue) * 100);

    return {
        achievement,
        userAchievement,
        progress: achievementProgress,
        isEarned,
        currentValue,
        targetValue,
        percentComplete,
    };
}

/**
 * Builds the two quiet, profile-facing writing paths from achievement responses.
 * Codes, rather than database IDs, are used as the stable identity boundary.
 */
export function buildArticleAchievementJourney({
    achievements,
    userAchievements,
    progress,
    showUpcoming,
}: ArticleAchievementJourneyInput): ArticleAchievementTrack[] {
    const definitionsByCode = new Map<string, Achievement>();
    achievements.forEach((achievement) => definitionsByCode.set(achievement.code, achievement));
    userAchievements.forEach(({ achievement }) =>
        definitionsByCode.set(achievement.code, achievement),
    );
    progress.forEach(({ achievement }) => definitionsByCode.set(achievement.code, achievement));

    const earnedByCode = new Map(
        userAchievements.map((item) => [item.achievement.code, item] as const),
    );
    const progressByCode = new Map(progress.map((item) => [item.achievement.code, item] as const));

    return ARTICLE_ACHIEVEMENT_TRACKS.flatMap((track): ArticleAchievementTrack[] => {
        const milestones = track.codes.flatMap((code) => {
            const achievement = definitionsByCode.get(code);
            return achievement ? [milestoneFor(achievement, earnedByCode, progressByCode)] : [];
        });

        if (milestones.length === 0) return [];

        const earned = milestones.filter((milestone) => milestone.isEarned);
        const displayMilestone = showUpcoming
            ? (milestones.find((milestone) => !milestone.isEarned) ?? milestones.at(-1) ?? null)
            : (earned.at(-1) ?? null);

        return [
            {
                id: track.id,
                milestones,
                earnedCount: earned.length,
                displayMilestone,
                isComplete: earned.length === milestones.length,
            },
        ];
    });
}

export function isArticleAchievementCode(code: string): code is ArticleAchievementCode {
    return ARTICLE_ACHIEVEMENT_TRACKS.some((track) =>
        (track.codes as readonly string[]).includes(code),
    );
}
