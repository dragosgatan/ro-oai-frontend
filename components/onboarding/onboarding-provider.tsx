'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

import { useCompetitionData } from '@/components/competition-data-provider';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api';
import type { Country, Institution, UserProfile } from '@/lib/types';

type ProfileSettingsPayload = {
    userId?: string;
    username?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    joinDate?: string;
    avatar?: string;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    github?: string | null;
    institution?: Institution;
    institutionJoinedAt?: string;
    country?: Country;
    onboardingDismissed?: boolean;
    language?: string;
};

type LeaderboardProfilePayload = {
    username?: string;
    attainedAt?: string;
    avatar?: string;
    totalScore?: number;
    solvedCount?: number;
    averageScore?: number;
    rank?: number;
    country?: Country;
};

type ProfilePayload = {
    profile?: { leaderboard?: LeaderboardProfilePayload };
    settings?: ProfileSettingsPayload;
};

class OnboardingProfileError extends Error {
    constructor(readonly status?: number) {
        super(status ? `Profile request failed (${status})` : 'Profile request failed');
    }
}

function validDate(value?: string): Date {
    const parsed = value ? new Date(value) : new Date(0);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

export function normalizeOnboardingProfile(
    payload: ProfilePayload,
    fallbackUserId: string,
): UserProfile {
    const leaderboard = payload.profile?.leaderboard ?? {};
    const settings = payload.settings ?? {};

    return {
        userId: settings.userId ?? fallbackUserId,
        username: settings.username ?? leaderboard.username ?? '',
        firstName: settings.firstName ?? null,
        lastName: settings.lastName ?? null,
        email: settings.email ?? null,
        joinedAt: validDate(settings.joinDate ?? leaderboard.attainedAt),
        avatar: settings.avatar ?? leaderboard.avatar ?? '',
        bio: settings.bio ?? null,
        location: settings.location ?? null,
        website: settings.website ?? null,
        github: settings.github ?? null,
        totalScore: leaderboard.totalScore ?? 0,
        problemsSolved: leaderboard.solvedCount ?? 0,
        averageScore: leaderboard.averageScore ?? 0,
        rank: leaderboard.rank ?? 0,
        leaderboardPlaced: Boolean(leaderboard.rank),
        institution: settings.institution,
        institutionJoinedAt: settings.institutionJoinedAt
            ? validDate(settings.institutionJoinedAt)
            : undefined,
        country: settings.country ?? leaderboard.country,
        onboardingDismissed: settings.onboardingDismissed ?? false,
    };
}

export function OnboardingProvider() {
    const { data: session, status } = useSession();
    const locale = useLocale();
    const tCommon = useTranslations('common');
    const tSettings = useTranslations('settings');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [requestVersion, setRequestVersion] = useState(0);
    const [showWizard, setShowWizard] = useState(false);
    const { authenticated, isProfileConfirmed } = useCompetitionData();
    const isUsernameMissing = authenticated && !isProfileConfirmed;
    const sessionId = session?.id;

    const requestProfile = useCallback(
        async (userId: string): Promise<UserProfile> => {
            const response = await fetchApi(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/profile/${userId}`,
            );

            if (!response.ok) {
                throw new OnboardingProfileError(response.status);
            }

            const payload = (await response.json()) as ProfilePayload;
            const profile = normalizeOnboardingProfile(payload, userId);

            if (payload.settings?.language !== locale) {
                try {
                    await fetchApi(`${process.env.NEXT_PUBLIC_API_BASE_URL}/profile/settings`, {
                        method: 'PUT',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ language: locale }),
                    });
                } catch {
                    // Language synchronization is best-effort and must not block onboarding.
                }
            }

            return profile;
        },
        [locale],
    );

    useEffect(() => {
        let cancelled = false;
        let retryTimer: number | undefined;

        if (status === 'loading') {
            setIsLoading(true);
            return;
        }

        if (status !== 'authenticated' || !sessionId || isUsernameMissing) {
            setUserProfile(null);
            setShowWizard(false);
            setError(null);
            setIsLoading(false);
            return;
        }

        const load = async (attempt: number) => {
            setIsLoading(true);
            setError(null);

            try {
                const profile = await requestProfile(sessionId);
                if (cancelled) return;

                setUserProfile(profile);
                setShowWizard(!profile.onboardingDismissed);
                setIsLoading(false);
            } catch (loadError) {
                if (cancelled) return;

                if (attempt < 2) {
                    retryTimer = window.setTimeout(
                        () => void load(attempt + 1),
                        1000 * 2 ** attempt,
                    );
                    return;
                }

                const statusCode =
                    loadError instanceof OnboardingProfileError ? loadError.status : undefined;
                setError(
                    statusCode
                        ? `${tSettings('errorLoadingSettings')} (${statusCode})`
                        : tSettings('errorLoadingSettings'),
                );
                setShowWizard(false);
                setIsLoading(false);
            }
        };

        void load(0);

        return () => {
            cancelled = true;
            if (retryTimer !== undefined) window.clearTimeout(retryTimer);
        };
    }, [isUsernameMissing, requestProfile, requestVersion, sessionId, status, tSettings]);

    const handleDismiss = () => {
        setShowWizard(false);
        setUserProfile((profile) =>
            profile ? { ...profile, onboardingDismissed: true } : profile,
        );
    };

    const handleRetry = () => {
        setError(null);
        setRequestVersion((version) => version + 1);
    };

    const handleProfileRefresh = async () => {
        if (status !== 'authenticated' || !sessionId) return;

        const profile = await requestProfile(sessionId);
        setUserProfile(profile);
        setShowWizard(!profile.onboardingDismissed);
    };

    if (error && status === 'authenticated') {
        return (
            <aside
                className="platform-overlay-surface fixed inset-x-4 top-20 z-[60] mx-auto max-w-2xl border border-[var(--platform-coral)] bg-[var(--platform-paper)] p-4 shadow-[6px_6px_0_color-mix(in_oklch,var(--platform-coral)_38%,transparent)] sm:p-5"
                role="alert"
                aria-live="assertive"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <AlertCircle
                            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--platform-coral)]"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="font-bold text-[var(--platform-ink)]">{error}</p>
                            <p className="mt-1 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                {tCommon('error')}
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={handleRetry}
                        className="min-h-11 shrink-0 rounded-none bg-[var(--platform-violet)] px-5 text-white shadow-none hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]"
                    >
                        <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
                        {tCommon('retry')}
                    </Button>
                </div>
            </aside>
        );
    }

    if (isLoading || !userProfile || !sessionId || !showWizard) {
        return null;
    }

    return (
        <OnboardingWizard
            userId={sessionId}
            userProfile={userProfile}
            onDismiss={handleDismiss}
            onProfileRefresh={handleProfileRefresh}
        />
    );
}
