'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Award, Trophy, Users, Sparkles, Filter, Search, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    PlatformEmptyState,
    PlatformPageHeader,
    PlatformPageShell,
} from '@/components/platform-page-shell';
import { AchievementCard } from '@/components/achievements/achievement-card';
import { AchievementLeaderboard } from '@/components/achievements/achievement-leaderboard';
import { UserComparisonView } from '@/components/achievements/user-comparison-view';
import {
    fetchAchievements,
    fetchUserAchievements,
    fetchUserProgress,
    fetchAchievementLeaderboard,
} from '@/lib/api';
import type {
    Achievement,
    UserAchievement,
    AchievementProgress,
    AchievementCategory,
    AchievementRarity,
    AchievementLeaderboardEntry,
} from '@/lib/types';
import { useFormatter, useTranslations } from 'next-intl';

type SortOption = 'rarity' | 'name' | 'unlockPercentage';
type ViewTab = 'browse' | 'leaderboard' | 'compare';

const categoryOrder: AchievementCategory[] = [
    'PROBLEM_SOLVING',
    'COMPETITION',
    'ENGAGEMENT',
    'SOCIAL',
    'SPECIAL',
];

const rarityOrder: AchievementRarity[] = ['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];

export default function AchievementsPage() {
    const { data: session } = useSession();
    const userId = session?.id;
    const t = useTranslations('achievements');
    const format = useFormatter();

    // State
    const [achievements, setAchievements] = React.useState<Achievement[]>([]);
    const [userAchievements, setUserAchievements] = React.useState<UserAchievement[]>([]);
    const [progress, setProgress] = React.useState<AchievementProgress[]>([]);
    const [leaderboard, setLeaderboard] = React.useState<AchievementLeaderboardEntry[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Filters
    const [activeTab, setActiveTab] = React.useState<ViewTab>('browse');
    const [categoryFilter, setCategoryFilter] = React.useState<AchievementCategory | 'all'>('all');
    const [rarityFilter, setRarityFilter] = React.useState<AchievementRarity | 'all'>('all');
    const [sortBy, setSortBy] = React.useState<SortOption>('rarity');
    const [searchQuery, setSearchQuery] = React.useState('');

    // Comparison state
    const [compareUserId, setCompareUserId] = React.useState<string | null>(null);

    // Fetch data
    React.useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                setError(null);

                const [achievementsData, leaderboardData] = await Promise.all([
                    fetchAchievements(),
                    fetchAchievementLeaderboard(0, 20, 'achievements'),
                ]);

                setAchievements(achievementsData);
                setLeaderboard(leaderboardData.content);

                // Load user-specific data if logged in
                if (userId) {
                    const [userAchievementsData, progressData] = await Promise.all([
                        fetchUserAchievements(userId),
                        fetchUserProgress(userId),
                    ]);
                    setUserAchievements(userAchievementsData);
                    setProgress(progressData);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : t('errorLoading'));
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [userId]);

    // Create maps for quick lookup
    const earnedMap = React.useMemo(() => {
        const map = new Map<number, UserAchievement>();
        userAchievements.forEach((ua) => map.set(ua.achievement.id, ua));
        return map;
    }, [userAchievements]);

    const progressMap = React.useMemo(() => {
        const map = new Map<number, AchievementProgress>();
        progress.forEach((p) => map.set(p.achievementId, p));
        return map;
    }, [progress]);

    // Filter and sort achievements
    const filteredAchievements = React.useMemo(() => {
        let filtered = achievements;

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter((a) => a.category === categoryFilter);
        }

        // Rarity filter
        if (rarityFilter !== 'all') {
            filtered = filtered.filter((a) => a.rarity === rarityFilter);
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (a) =>
                    a.name.toLowerCase().includes(query) ||
                    a.description.toLowerCase().includes(query),
            );
        }

        // Sort
        const sorted = [...filtered];
        switch (sortBy) {
            case 'rarity':
                sorted.sort((a, b) => {
                    const aIndex = rarityOrder.indexOf(a.rarity);
                    const bIndex = rarityOrder.indexOf(b.rarity);
                    return aIndex - bIndex;
                });
                break;
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'unlockPercentage':
                sorted.sort((a, b) => a.unlockedPercentage - b.unlockedPercentage);
                break;
        }

        return sorted;
    }, [achievements, categoryFilter, rarityFilter, searchQuery, sortBy]);

    // Statistics
    const stats = React.useMemo(() => {
        const totalEarned = userAchievements.length;
        const totalAvailable = achievements.length;
        const completionPercentage =
            totalAvailable > 0 ? Math.round((totalEarned / totalAvailable) * 100) : 0;
        const totalXp = userAchievements.reduce((sum, ua) => sum + ua.achievement.xpReward, 0);

        return { totalEarned, totalAvailable, completionPercentage, totalXp };
    }, [achievements, userAchievements]);

    // Available categories and rarities
    const availableCategories = React.useMemo(() => {
        const categories = new Set<AchievementCategory>();
        achievements.forEach((a) => categories.add(a.category));
        return categoryOrder.filter((c) => categories.has(c));
    }, [achievements]);

    const availableRarities = React.useMemo(() => {
        const rarities = new Set<AchievementRarity>();
        achievements.forEach((a) => rarities.add(a.rarity));
        return rarityOrder.filter((r) => rarities.has(r));
    }, [achievements]);

    if (loading) {
        return (
            <AchievementsPageSkeleton
                eyebrow={t('showcase')}
                title={t('pageTitle')}
                description={t('pageDescription')}
            />
        );
    }

    if (error) {
        return (
            <PlatformPageShell>
                <PlatformPageHeader
                    eyebrow={t('showcase')}
                    icon={Award}
                    title={t('pageTitle')}
                    description={t('pageDescription')}
                />
                <PlatformEmptyState
                    className="mt-8"
                    icon={AlertTriangle}
                    title={t('errorLoading')}
                    description={error}
                />
            </PlatformPageShell>
        );
    }

    return (
        <PlatformPageShell>
            <PlatformPageHeader
                eyebrow={t('showcase')}
                icon={Award}
                title={t('pageTitle')}
                description={t('pageDescription')}
            />

            {userId && (
                <dl className="mt-8 grid grid-cols-2 border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] md:grid-cols-4">
                    <StatsMetric
                        icon={<Trophy className="h-5 w-5" />}
                        label={t('earned')}
                        value={`${format.number(stats.totalEarned)}/${format.number(stats.totalAvailable)}`}
                    />
                    <StatsMetric
                        icon={<Award className="h-5 w-5" />}
                        label={t('completion')}
                        value={format.number(stats.completionPercentage / 100, {
                            style: 'percent',
                            maximumFractionDigits: 0,
                        })}
                    />
                    <StatsMetric
                        icon={<Sparkles className="h-5 w-5" />}
                        label={t('totalXp')}
                        value={format.number(stats.totalXp)}
                    />
                    <StatsMetric
                        icon={<Users className="h-5 w-5" />}
                        label={t('rank')}
                        value={(() => {
                            const rank = leaderboard.find((e) => e.userId === userId)?.rank;
                            return rank ? format.number(rank) : '-';
                        })()}
                    />
                </dl>
            )}

            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as ViewTab)}
                className="mt-8"
            >
                <TabsList className="grid h-auto w-full grid-cols-3 rounded-none border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-0 sm:w-fit">
                    {(['browse', 'leaderboard', 'compare'] as const).map((tab, index) => (
                        <TabsTrigger
                            key={tab}
                            value={tab}
                            className={`min-h-12 rounded-none px-4 text-[var(--platform-ink-muted-strong)] shadow-none data-[state=active]:bg-[var(--platform-violet)] data-[state=active]:text-white data-[state=active]:shadow-[inset_0_-4px_0_var(--platform-citron)] dark:data-[state=active]:text-[var(--platform-on-accent)] sm:px-7 ${index < 2 ? 'border-e border-[var(--platform-line)]' : ''}`}
                        >
                            {t(tab)}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="browse" className="mt-7 space-y-6 focus-visible:outline-none">
                    <div className="platform-toolbar px-4 py-5 sm:px-5">
                        <div className="flex flex-col gap-3 md:flex-row">
                            <div className="relative flex-1">
                                <Search
                                    className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--platform-ink-muted)]"
                                    aria-hidden="true"
                                />
                                <Input
                                    type="search"
                                    placeholder={t('searchAchievements')}
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    className="h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] ps-10 text-[var(--platform-ink)] placeholder:text-[var(--platform-ink-muted)]"
                                    aria-label={t('searchAchievements')}
                                    autoComplete="off"
                                    spellCheck="false"
                                />
                            </div>

                            <Select
                                value={categoryFilter}
                                onValueChange={(value) =>
                                    setCategoryFilter(value as AchievementCategory | 'all')
                                }
                            >
                                <SelectTrigger
                                    className="h-12 w-full rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)] md:w-[180px]"
                                    aria-label={t('allCategories')}
                                >
                                    <SelectValue placeholder={t('allCategories')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('allCategories')}</SelectItem>
                                    {availableCategories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {t(`categories.${category}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={rarityFilter}
                                onValueChange={(value) =>
                                    setRarityFilter(value as AchievementRarity | 'all')
                                }
                            >
                                <SelectTrigger
                                    className="h-12 w-full rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)] md:w-[150px]"
                                    aria-label={t('allRarities')}
                                >
                                    <SelectValue placeholder={t('allRarities')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('allRarities')}</SelectItem>
                                    {availableRarities.map((rarity) => (
                                        <SelectItem key={rarity} value={rarity}>
                                            {t(`rarities.${rarity}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={sortBy}
                                onValueChange={(value) => setSortBy(value as SortOption)}
                            >
                                <SelectTrigger
                                    className="h-12 w-full rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)] md:w-[180px]"
                                    aria-label={t('sortBy')}
                                >
                                    <Filter className="me-2 h-4 w-4" />
                                    <SelectValue placeholder={t('sortBy')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rarity">{t('byRarity')}</SelectItem>
                                    <SelectItem value="name">{t('byName')}</SelectItem>
                                    <SelectItem value="unlockPercentage">
                                        {t('byUnlockPercentage')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-[var(--platform-line)] pb-4">
                        <p
                            className="text-sm font-medium text-[var(--platform-ink-muted)]"
                            aria-live="polite"
                        >
                            {t('showing')} {format.number(filteredAchievements.length)} {t('of')}{' '}
                            {format.number(achievements.length)}
                        </p>
                    </div>

                    {filteredAchievements.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredAchievements.map((achievement) => (
                                <AchievementCardWithUnlockPercentage
                                    key={achievement.id}
                                    achievement={achievement}
                                    userAchievement={earnedMap.get(achievement.id)}
                                    progress={progressMap.get(achievement.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <PlatformEmptyState icon={Award} title={t('noMatchingAchievements')} />
                    )}
                </TabsContent>

                <TabsContent value="leaderboard" className="mt-7 focus-visible:outline-none">
                    <AchievementLeaderboard
                        currentUserId={userId}
                        onUserSelect={(id) => {
                            setCompareUserId(id);
                            setActiveTab('compare');
                        }}
                    />
                </TabsContent>

                <TabsContent value="compare" className="mt-7 focus-visible:outline-none">
                    <UserComparisonView
                        currentUserId={userId}
                        compareUserId={compareUserId}
                        onCompareUserChange={setCompareUserId}
                        allAchievements={achievements}
                    />
                </TabsContent>
            </Tabs>
        </PlatformPageShell>
    );
}

function StatsMetric({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex min-h-24 items-center gap-3 border-b border-e border-[var(--platform-line)] p-4 even:border-e-0 md:border-b-0 md:even:border-e md:last:border-e-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)]">
                {icon}
            </span>
            <div className="min-w-0">
                <dt className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-[var(--platform-ink-muted)]">
                    {label}
                </dt>
                <dd className="mt-1 text-xl font-bold tabular-nums text-[var(--platform-ink)]">
                    {value}
                </dd>
            </div>
        </div>
    );
}

// Achievement Card with Unlock Percentage
function AchievementCardWithUnlockPercentage({
    achievement,
    userAchievement,
    progress,
}: {
    achievement: Achievement;
    userAchievement?: UserAchievement;
    progress?: AchievementProgress;
}) {
    const t = useTranslations('achievements');
    const format = useFormatter();
    const unlockedPercentage = format.number(achievement.unlockedPercentage, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });
    const unlockedPercentageWithSymbol = format.number(achievement.unlockedPercentage / 100, {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
    });

    return (
        <div className="relative">
            <AchievementCard
                achievement={achievement}
                userAchievement={userAchievement}
                progress={progress}
                size="md"
                showProgress
            />
            {/* Global unlock percentage badge */}
            <Badge
                variant="secondary"
                className="absolute bottom-3 end-3 rounded-md border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-xs text-[var(--platform-ink)]"
                title={t('unlockedBy', { percentage: unlockedPercentage })}
            >
                <Users className="me-1 h-3 w-3" />
                {unlockedPercentageWithSymbol}
            </Badge>
        </div>
    );
}

// Loading Skeleton
function AchievementsPageSkeleton({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <PlatformPageShell>
            <PlatformPageHeader
                eyebrow={eyebrow}
                icon={Award}
                title={title}
                description={description}
            />
            <div className="mt-8 grid grid-cols-2 border-y border-[var(--platform-line)] md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="border-e border-[var(--platform-line)] p-4 last:border-e-0"
                    >
                        <Skeleton className="h-16 rounded-none" />
                    </div>
                ))}
            </div>
            <Skeleton className="mt-8 h-12 w-full max-w-md rounded-none" />
            <Skeleton className="mt-7 h-24 rounded-none" />
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...Array(9)].map((_, i) => (
                    <Skeleton key={i} className="h-44 rounded-none" />
                ))}
            </div>
        </PlatformPageShell>
    );
}
