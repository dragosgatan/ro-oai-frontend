'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Award, Filter } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { AchievementCard } from './achievement-card';
import type {
    Achievement,
    UserAchievement,
    AchievementProgress,
    AchievementCategory,
    AchievementRarity,
} from '@/lib/types';

type SortOption = 'rarity' | 'date' | 'category' | 'name';

const categoryOrder: AchievementCategory[] = [
    'PROBLEM_SOLVING',
    'COMPETITION',
    'ENGAGEMENT',
    'SOCIAL',
    'SPECIAL',
];

const rarityOrder: AchievementRarity[] = ['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];

export interface AchievementsSectionProps {
    /** User's earned achievements */
    userAchievements: UserAchievement[];
    /** User's progress on all achievements */
    achievementProgress: AchievementProgress[];
    /** All available achievements */
    allAchievements: Achievement[];
    /** Additional CSS classes */
    className?: string;
}

/**
 * AchievementsSection displays all achievements grouped by category
 * with sorting options and progress indicators.
 *
 * Requirements: 1.1, 1.3, 5.4
 */
export function AchievementsSection({
    userAchievements,
    achievementProgress,
    allAchievements,
    className,
}: AchievementsSectionProps) {
    const t = useTranslations('achievements');
    const format = useFormatter();
    const [sortBy, setSortBy] = React.useState<SortOption>('category');
    const [activeCategory, setActiveCategory] = React.useState<AchievementCategory | 'all'>('all');

    // Category labels using translations
    const categoryLabels: Record<AchievementCategory, string> = {
        PROBLEM_SOLVING: t('problemSolving'),
        COMPETITION: t('competition'),
        ENGAGEMENT: t('engagement'),
        SOCIAL: t('social'),
        SPECIAL: t('special'),
    };

    // Create a map of earned achievements for quick lookup
    const earnedMap = React.useMemo(() => {
        const map = new Map<number, UserAchievement>();
        userAchievements.forEach((ua) => map.set(ua.achievement.id, ua));
        return map;
    }, [userAchievements]);

    // Create a map of progress for quick lookup
    const progressMap = React.useMemo(() => {
        const map = new Map<number, AchievementProgress>();
        achievementProgress.forEach((p) => map.set(p.achievementId, p));
        return map;
    }, [achievementProgress]);

    // Combine all achievements with user data
    const achievementsWithUserData = React.useMemo(() => {
        return allAchievements.map((achievement) => ({
            achievement,
            userAchievement: earnedMap.get(achievement.id),
            progress: progressMap.get(achievement.id),
            isEarned: earnedMap.has(achievement.id),
        }));
    }, [allAchievements, earnedMap, progressMap]);

    // Filter by category
    const filteredAchievements = React.useMemo(() => {
        if (activeCategory === 'all') {
            return achievementsWithUserData;
        }
        return achievementsWithUserData.filter((a) => a.achievement.category === activeCategory);
    }, [achievementsWithUserData, activeCategory]);

    // Sort achievements
    const sortedAchievements = React.useMemo(() => {
        const sorted = [...filteredAchievements];

        switch (sortBy) {
            case 'rarity':
                sorted.sort((a, b) => {
                    const aIndex = rarityOrder.indexOf(a.achievement.rarity);
                    const bIndex = rarityOrder.indexOf(b.achievement.rarity);
                    return aIndex - bIndex;
                });
                break;
            case 'date':
                sorted.sort((a, b) => {
                    // Earned achievements first, sorted by unlock date (newest first)
                    if (a.isEarned && b.isEarned) {
                        return (
                            new Date(b.userAchievement!.unlockedAt).getTime() -
                            new Date(a.userAchievement!.unlockedAt).getTime()
                        );
                    }
                    if (a.isEarned) return -1;
                    if (b.isEarned) return 1;
                    // Unearned sorted by progress (highest first)
                    const aProgress = a.progress?.percentComplete ?? 0;
                    const bProgress = b.progress?.percentComplete ?? 0;
                    return bProgress - aProgress;
                });
                break;
            case 'category':
                sorted.sort((a, b) => {
                    const aIndex = categoryOrder.indexOf(a.achievement.category);
                    const bIndex = categoryOrder.indexOf(b.achievement.category);
                    if (aIndex !== bIndex) return aIndex - bIndex;
                    // Within same category, sort by rarity
                    const aRarity = rarityOrder.indexOf(a.achievement.rarity);
                    const bRarity = rarityOrder.indexOf(b.achievement.rarity);
                    return aRarity - bRarity;
                });
                break;
            case 'name':
                sorted.sort((a, b) => a.achievement.name.localeCompare(b.achievement.name));
                break;
        }

        return sorted;
    }, [filteredAchievements, sortBy]);

    // Group by category for display
    const groupedByCategory = React.useMemo(() => {
        if (sortBy !== 'category' || activeCategory !== 'all') {
            return null;
        }

        const groups: Record<AchievementCategory, typeof sortedAchievements> = {
            PROBLEM_SOLVING: [],
            COMPETITION: [],
            ENGAGEMENT: [],
            SOCIAL: [],
            SPECIAL: [],
        };

        sortedAchievements.forEach((item) => {
            groups[item.achievement.category].push(item);
        });

        return groups;
    }, [sortedAchievements, sortBy, activeCategory]);

    // Get available categories
    const availableCategories = React.useMemo(() => {
        const categories = new Set<AchievementCategory>();
        allAchievements.forEach((a) => categories.add(a.category));
        return categoryOrder.filter((c) => categories.has(c));
    }, [allAchievements]);

    if (allAchievements.length === 0) {
        return null;
    }

    return (
        <section
            className={cn('platform-panel overflow-hidden bg-[var(--platform-paper)]', className)}
        >
            <div className="platform-toolbar flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-5">
                <div>
                    <div className="flex items-center gap-2">
                        <Award
                            className="h-5 w-5 text-[var(--platform-violet)]"
                            aria-hidden="true"
                        />
                        <h2 className="text-lg font-semibold tracking-[-0.025em] text-[var(--platform-ink)]">
                            {t('title')}
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-[var(--platform-ink-muted)]">
                        {format.number(userAchievements.length)} {t('of')}{' '}
                        {format.number(allAchievements.length)} {t('earned')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Filter
                        className="h-4 w-4 shrink-0 text-[var(--platform-ink-muted)]"
                        aria-hidden="true"
                    />
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                        <SelectTrigger
                            className="h-11 w-full min-w-44 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)] shadow-none sm:w-48"
                            aria-label={t('sortBy')}
                        >
                            <SelectValue placeholder={t('sortBy')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="category">{t('byCategory')}</SelectItem>
                            <SelectItem value="rarity">{t('byRarity')}</SelectItem>
                            <SelectItem value="date">{t('byDate')}</SelectItem>
                            <SelectItem value="name">{t('byName')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs
                value={activeCategory}
                onValueChange={(v) => setActiveCategory(v as AchievementCategory | 'all')}
                className="w-full"
            >
                <div className="overflow-x-auto border-b border-[var(--platform-line-strong)]">
                    <TabsList className="flex h-auto min-w-max justify-start gap-0 rounded-none bg-[var(--platform-paper-strong)] p-0">
                        <AchievementTab value="all">{t('all')}</AchievementTab>
                        {availableCategories.map((category) => (
                            <AchievementTab key={category} value={category}>
                                {categoryLabels[category]}
                            </AchievementTab>
                        ))}
                    </TabsList>
                </div>

                <div className="p-4 sm:p-5">
                    <TabsContent value="all" className="mt-0 focus-visible:outline-none">
                        {groupedByCategory ? (
                            <div className="space-y-9">
                                {categoryOrder.map((category) => {
                                    const items = groupedByCategory[category];
                                    if (items.length === 0) return null;

                                    return (
                                        <section key={category}>
                                            <h3 className="mb-4 flex items-baseline gap-2 border-b border-[var(--platform-line)] pb-3 text-base font-semibold text-[var(--platform-ink)]">
                                                {categoryLabels[category]}
                                                <span className="text-xs font-normal tabular-nums text-[var(--platform-ink-muted)]">
                                                    {format.number(
                                                        items.filter((item) => item.isEarned)
                                                            .length,
                                                    )}
                                                    /{format.number(items.length)}
                                                </span>
                                            </h3>
                                            <AchievementGrid items={items} />
                                        </section>
                                    );
                                })}
                            </div>
                        ) : (
                            <AchievementGrid items={sortedAchievements} />
                        )}
                    </TabsContent>

                    {availableCategories.map((category) => (
                        <TabsContent
                            key={category}
                            value={category}
                            className="mt-0 focus-visible:outline-none"
                        >
                            <AchievementGrid items={sortedAchievements} />
                        </TabsContent>
                    ))}

                    {sortedAchievements.length === 0 ? (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                            <span className="grid h-12 w-12 place-items-center bg-[var(--platform-paper-strong)] text-[var(--platform-ink-muted)]">
                                <Award className="h-5 w-5" aria-hidden="true" />
                            </span>
                            <p className="mt-3 text-sm text-[var(--platform-ink-muted)]">
                                {t('noAchievements')}
                            </p>
                        </div>
                    ) : null}
                </div>
            </Tabs>
        </section>
    );
}

function AchievementTab({ value, children }: { value: string; children: React.ReactNode }) {
    return (
        <TabsTrigger
            value={value}
            className="min-h-12 rounded-none border-e border-[var(--platform-line)] px-4 text-xs font-semibold text-[var(--platform-ink-muted)] shadow-none last:border-e-0 data-[state=active]:bg-[var(--platform-citron)] data-[state=active]:text-[var(--platform-on-accent)] data-[state=active]:shadow-none sm:px-5 sm:text-sm"
        >
            {children}
        </TabsTrigger>
    );
}

type AchievementGridItem = {
    achievement: Achievement;
    userAchievement?: UserAchievement;
    progress?: AchievementProgress;
};

function AchievementGrid({ items }: { items: AchievementGridItem[] }) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map(({ achievement, userAchievement, progress }) => (
                <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    userAchievement={userAchievement}
                    progress={progress}
                    size="md"
                    showProgress
                />
            ))}
        </div>
    );
}

export default AchievementsSection;
