'use client';

import * as React from 'react';
import { Users, Search, Award, ArrowRight, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AchievementCard } from './achievement-card';
import { fetchUserAchievements, fetchAchievementLeaderboard } from '@/lib/api';
import type { Achievement, UserAchievement, AchievementLeaderboardEntry } from '@/lib/types';
import { useFormatter, useTranslations } from 'next-intl';
import { PlatformEmptyState } from '@/components/platform-page-shell';

const comparisonSurface =
    'rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] shadow-none';

export interface UserComparisonViewProps {
    /** Current user's ID */
    currentUserId?: string;
    /** User ID to compare with */
    compareUserId: string | null;
    /** Callback when compare user changes */
    onCompareUserChange: (userId: string | null) => void;
    /** All available achievements */
    allAchievements: Achievement[];
    /** Additional CSS classes */
    className?: string;
}

/**
 * UserComparisonView allows comparing achievements between two users.
 * Highlights achievements the current user has that the compared user doesn't.
 *
 * Requirements: 11.3
 */
export function UserComparisonView({
    currentUserId,
    compareUserId,
    onCompareUserChange,
    allAchievements,
    className,
}: UserComparisonViewProps) {
    const t = useTranslations('achievements');
    const format = useFormatter();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<AchievementLeaderboardEntry[]>([]);
    const [searching, setSearching] = React.useState(false);

    const [currentUserAchievements, setCurrentUserAchievements] = React.useState<UserAchievement[]>(
        [],
    );
    const [compareUserAchievements, setCompareUserAchievements] = React.useState<UserAchievement[]>(
        [],
    );
    const [compareUserInfo, setCompareUserInfo] =
        React.useState<AchievementLeaderboardEntry | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Load current user's achievements
    React.useEffect(() => {
        async function loadCurrentUser() {
            if (!currentUserId) return;
            try {
                const achievements = await fetchUserAchievements(currentUserId);
                setCurrentUserAchievements(achievements);
            } catch (err) {
                console.error('Failed to load current user achievements:', err);
            }
        }
        loadCurrentUser();
    }, [currentUserId]);

    // Load compare user's achievements
    React.useEffect(() => {
        async function loadCompareUser() {
            if (!compareUserId) {
                setCompareUserAchievements([]);
                setCompareUserInfo(null);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const [achievements, ranking] = await Promise.all([
                    fetchUserAchievements(compareUserId),
                    fetchAchievementLeaderboard(0, 100, 'achievements'),
                ]);
                setCompareUserAchievements(achievements);
                setCompareUserInfo(
                    ranking.content.find((entry) => entry.userId === compareUserId) ?? null,
                );
            } catch (err) {
                setError(err instanceof Error ? err.message : t('errorLoading'));
            } finally {
                setLoading(false);
            }
        }
        loadCompareUser();
    }, [compareUserId, t]);

    // Search for users
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            setSearching(true);
            // Use leaderboard to find users (this is a simplified approach)
            const data = await fetchAchievementLeaderboard(0, 100, 'achievements');
            const filtered = data.content.filter(
                (entry: AchievementLeaderboardEntry) =>
                    entry.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
                    entry.userId !== currentUserId,
            );
            setSearchResults(filtered.slice(0, 10));
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setSearching(false);
        }
    };

    // Calculate comparison data
    const comparisonData = React.useMemo(() => {
        const currentIds = new Set(currentUserAchievements.map((ua) => ua.achievement.id));
        const compareIds = new Set(compareUserAchievements.map((ua) => ua.achievement.id));

        // Achievements current user has that compare user doesn't
        const uniqueToCurrentUser = allAchievements.filter(
            (a) => currentIds.has(a.id) && !compareIds.has(a.id),
        );

        // Achievements compare user has that current user doesn't
        const uniqueToCompareUser = allAchievements.filter(
            (a) => compareIds.has(a.id) && !currentIds.has(a.id),
        );

        // Achievements both users have
        const shared = allAchievements.filter((a) => currentIds.has(a.id) && compareIds.has(a.id));

        return {
            uniqueToCurrentUser,
            uniqueToCompareUser,
            shared,
            currentTotal: currentUserAchievements.length,
            compareTotal: compareUserAchievements.length,
        };
    }, [currentUserAchievements, compareUserAchievements, allAchievements]);

    if (!currentUserId) {
        return (
            <PlatformEmptyState className={className} icon={Users} title={t('loginToCompare')} />
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* User Search */}
            <Card className={comparisonSurface}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-[var(--platform-ink)]">
                        <Users className="h-5 w-5 text-[var(--platform-violet)]" />
                        {t('compareAchievements')}
                    </CardTitle>
                    <CardDescription className="text-[var(--platform-ink-muted)]">
                        {t('compareDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                            <Search
                                className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--platform-ink-muted)]"
                                aria-hidden="true"
                            />
                            <Input
                                type="search"
                                placeholder={t('searchByUsername')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] ps-10 text-[var(--platform-ink)]"
                                aria-label={t('searchByUsername')}
                                autoComplete="off"
                                spellCheck="false"
                            />
                        </div>
                        <Button
                            className="min-h-12 rounded-none bg-[var(--platform-violet)] px-6 text-white hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]"
                            onClick={handleSearch}
                            disabled={searching || !searchQuery.trim()}
                        >
                            {searching ? t('searching') : t('search')}
                        </Button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="divide-y divide-[var(--platform-line)] border border-[var(--platform-line-strong)]">
                            {searchResults.map((user) => (
                                <button
                                    type="button"
                                    key={user.userId}
                                    className="flex min-h-16 w-full items-center gap-3 p-3 text-start transition-colors hover:bg-[var(--platform-paper-strong)]"
                                    onClick={() => {
                                        onCompareUserChange(user.userId);
                                        setCompareUserInfo(user);
                                        setSearchResults([]);
                                        setSearchQuery('');
                                    }}
                                >
                                    <UserAvatar
                                        avatar={user.avatarUrl}
                                        userId={user.userId}
                                        username={user.username}
                                        className="h-8 w-8"
                                        loading="lazy"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-[var(--platform-ink)]">
                                            {user.username}
                                        </p>
                                        <p className="text-xs text-[var(--platform-ink-muted)]">
                                            {format.number(user.totalAchievements)}{' '}
                                            {t('title').toLowerCase()} •{' '}
                                            {format.number(user.totalXp)} XP
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-[var(--platform-violet)] rtl:rotate-180" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Selected User */}
                    {compareUserId && compareUserInfo && (
                        <div className="flex items-center gap-3 border border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-3">
                            <UserAvatar
                                avatar={compareUserInfo.avatarUrl}
                                userId={compareUserInfo.userId}
                                username={compareUserInfo.username}
                                className="h-10 w-10"
                                loading="lazy"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-[var(--platform-ink)]">
                                    {t('comparingWith')} {compareUserInfo.username}
                                </p>
                                <p className="text-sm text-[var(--platform-ink-muted)]">
                                    {format.number(compareUserInfo.totalAchievements)}{' '}
                                    {t('title').toLowerCase()} •{' '}
                                    {format.number(compareUserInfo.totalXp)} XP
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="min-h-11 min-w-11 rounded-none"
                                onClick={() => onCompareUserChange(null)}
                                aria-label={t('cancel')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Comparison Results */}
            {compareUserId && (
                <>
                    {loading ? (
                        <ComparisonSkeleton />
                    ) : error ? (
                        <Card className={cn(comparisonSurface, 'border-destructive')}>
                            <CardContent className="pt-6">
                                <p className="text-destructive">{error}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-1 gap-0 border-y border-[var(--platform-line-strong)] sm:grid-cols-3">
                                <Card className="rounded-none border-0 border-b border-[var(--platform-line)] bg-emerald-50 shadow-none dark:bg-emerald-950/20 sm:border-b-0 sm:border-e">
                                    <CardContent className="pt-4 pb-4 text-center">
                                        <Check className="mx-auto mb-2 h-6 w-6 text-green-600 dark:text-green-400" />
                                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                            {format.number(
                                                comparisonData.uniqueToCurrentUser.length,
                                            )}
                                        </p>
                                        <p className="text-sm text-green-600 dark:text-green-400">
                                            {t('youHaveTheyDont')}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-none border-0 border-b border-[var(--platform-line)] bg-[var(--platform-paper)] shadow-none sm:border-b-0 sm:border-e">
                                    <CardContent className="pt-4 pb-4 text-center">
                                        <Users className="mx-auto mb-2 h-6 w-6 text-[var(--platform-ink-muted)]" />
                                        <p className="text-2xl font-bold">
                                            {format.number(comparisonData.shared.length)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {t('bothHave')}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-none border-0 bg-orange-50 shadow-none dark:bg-orange-950/20">
                                    <CardContent className="pt-4 pb-4 text-center">
                                        <X className="mx-auto mb-2 h-6 w-6 text-orange-600 dark:text-orange-400" />
                                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                            {format.number(
                                                comparisonData.uniqueToCompareUser.length,
                                            )}
                                        </p>
                                        <p className="text-sm text-orange-600 dark:text-orange-400">
                                            {t('theyHaveYouDont')}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Achievements You Have That They Don't */}
                            {comparisonData.uniqueToCurrentUser.length > 0 && (
                                <Card className={comparisonSurface}>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Badge variant="default" className="bg-green-600">
                                                <Check className="me-1 h-3 w-3" />
                                                {t('yourUniqueAchievements')}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>
                                            {t('achievementsYouHave', {
                                                username: compareUserInfo?.username || '',
                                            })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {comparisonData.uniqueToCurrentUser.map(
                                                (achievement) => {
                                                    const userAchievement =
                                                        currentUserAchievements.find(
                                                            (ua) =>
                                                                ua.achievement.id ===
                                                                achievement.id,
                                                        );
                                                    return (
                                                        <div
                                                            key={achievement.id}
                                                            className="relative"
                                                        >
                                                            <AchievementCard
                                                                achievement={achievement}
                                                                userAchievement={userAchievement}
                                                                size="sm"
                                                            />
                                                            <div className="absolute start-2 top-2">
                                                                <Badge className="bg-green-600 text-white">
                                                                    <Check className="h-3 w-3" />
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Achievements They Have That You Don't */}
                            {comparisonData.uniqueToCompareUser.length > 0 && (
                                <Card className={comparisonSurface}>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                className="border-orange-400 text-orange-600"
                                            >
                                                <Award className="me-1 h-3 w-3" />
                                                {t('achievementsToEarn')}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>
                                            {t('achievementsTheyHave', {
                                                username: compareUserInfo?.username || '',
                                            })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {comparisonData.uniqueToCompareUser.map(
                                                (achievement) => (
                                                    <AchievementCard
                                                        key={achievement.id}
                                                        achievement={achievement}
                                                        size="sm"
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Shared Achievements */}
                            {comparisonData.shared.length > 0 && (
                                <Card className={comparisonSurface}>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Badge variant="secondary">
                                                <Users className="me-1 h-3 w-3" />
                                                {t('sharedAchievements')}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>
                                            {t('achievementsBothHave')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {comparisonData.shared.map((achievement) => {
                                                const userAchievement =
                                                    currentUserAchievements.find(
                                                        (ua) =>
                                                            ua.achievement.id === achievement.id,
                                                    );
                                                return (
                                                    <AchievementCard
                                                        key={achievement.id}
                                                        achievement={achievement}
                                                        userAchievement={userAchievement}
                                                        size="sm"
                                                    />
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </>
            )}

            {/* No comparison selected */}
            {!compareUserId && <PlatformEmptyState icon={Users} title={t('searchToCompare')} />}
        </div>
    );
}

// Loading Skeleton
function ComparisonSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-none" />
                ))}
            </div>
            <Skeleton className="h-64 rounded-none" />
        </div>
    );
}

export default UserComparisonView;
