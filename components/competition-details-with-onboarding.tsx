'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CompetitionUserResponse, GenericLeaderboardEntry } from '@/lib/types';
import { CompetitionDetails } from '@/components/competition-details';
import { OnboardingGate } from '@/components/anti-cheat/onboarding-gate';
import { RequiredFieldsGate } from '@/components/required-fields-gate';
import { useOnboardingStatus, shouldShowOnboardingGate } from '@/hooks/use-onboarding-status';
import { useOnboardingProgress } from '@/hooks/use-onboarding-progress';
import { fetchApi } from '@/lib/api';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { PlatformPageShell } from '@/components/platform-page-shell';
import { Skeleton } from '@/components/ui/skeleton';
import type { CompetitionOrganizerDataConsent } from '@/lib/competition-hosting';

/**
 * Props for CompetitionDetailsWithOnboarding component
 */
export interface CompetitionDetailsWithOnboardingProps {
    competition: CompetitionUserResponse;
    leaderboard: {
        partialLeaderboard: GenericLeaderboardEntry[];
        completeLeaderboard: GenericLeaderboardEntry[] | null;
    };
    leaderboardUnavailable?: boolean;
    organizerDataConsent?: CompetitionOrganizerDataConsent | null;
}

/**
 * CompetitionDetailsWithOnboarding - Wrapper component that handles pre-joined participant onboarding
 *
 * This component checks if the user is a pre-joined participant who hasn't completed
 * anti-cheat onboarding and routes them to the OnboardingGate if needed.
 *
 * Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.4
 * - Check if user is pre-joined participant
 * - Route to onboarding gate if onboarding incomplete
 * - Show problems if onboarding complete
 * - Display "Setup Required" status indicator for incomplete onboarding
 * - Auto-show onboarding dialog on first access
 */
export function CompetitionDetailsWithOnboarding({
    competition,
    leaderboard,
    leaderboardUnavailable = false,
    organizerDataConsent = null,
}: CompetitionDetailsWithOnboardingProps) {
    const t = useTranslations('antiCheat');
    const router = useRouter();
    const { status: sessionStatus } = useSession();
    const isAuthenticated = sessionStatus === 'authenticated';

    // Only fetch onboarding status if user is authenticated and competition has anti-cheat
    const shouldCheckOnboarding = isAuthenticated && competition.antiCheatEnabled === true;

    const {
        status: onboardingStatus,
        isLoading,
        error,
        refetch,
    } = useOnboardingStatus(competition.id, {
        enabled: shouldCheckOnboarding,
    });

    // Use onboarding progress hook for managing progress state
    const { resetProgress } = useOnboardingProgress(competition.id);

    // State for showing the onboarding gate dialog
    const [showOnboardingGate, setShowOnboardingGate] = useState(false);
    // State for showing the required fields gate dialog
    const [showRequiredFieldsDialog, setShowRequiredFieldsDialog] = useState(false);
    // Track if we've auto-shown the dialog on first access
    const [hasAutoShown, setHasAutoShown] = useState(false);

    // Determine if user is a pre-joined participant
    // Requirements: 1.3, 4.3 - Hide join button for pre-joined participants
    const isPreJoinedParticipant = onboardingStatus?.isParticipant ?? false;

    // Determine if we should show the onboarding gate
    // Requirements: 1.2, 4.2 - Show gate if participant but onboarding incomplete
    const needsOnboarding = shouldShowOnboardingGate(onboardingStatus);

    // Auto-show onboarding dialog on first access when user needs onboarding
    useEffect(() => {
        if (needsOnboarding && !hasAutoShown && !isLoading) {
            setShowOnboardingGate(true);
            setHasAutoShown(true);
        }
    }, [needsOnboarding, hasAutoShown, isLoading]);

    // Handle successful onboarding completion
    // Requirements: 2.2, 2.3, 2.4 - Update participant record and allow access
    const handleOnboardingComplete = useCallback(async () => {
        try {
            // Record onboarding completion to backend
            // The backend will:
            // 1. Mark the participant's onboarding as complete
            // 2. Send a MODE_TRANSITION WebSocket message to the companion app
            const response = await fetchApi(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/competitions/${competition.id}/complete-onboarding`,
                {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Onboarding completion failed with status ${response.status}`);
            }

            // Close the dialog
            setShowOnboardingGate(false);

            // Refresh the onboarding status to update UI
            await refetch();

            // Refresh the page to get updated competition data
            router.refresh();
        } catch (err) {
            console.error('Failed to complete onboarding:', err);
            // Keep the gate open. It catches this rejection and presents a retryable error.
            throw err;
        }
    }, [competition.id, router, refetch]);

    // Handle cancel from the onboarding gate
    const handleOnboardingCancel = useCallback(() => {
        setShowOnboardingGate(false);
        // Clear any partial onboarding progress
        resetProgress();
    }, [resetProgress]);

    // Show loading state while checking onboarding status
    if (shouldCheckOnboarding && isLoading) {
        return (
            <PlatformPageShell aria-busy="true">
                <span className="sr-only">{t('onboardingGate.loading')}</span>
                <div className="border-b border-[var(--platform-line-strong)] pb-10">
                    <Skeleton className="h-4 w-40 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                    <Skeleton className="mt-5 h-14 w-full max-w-3xl rounded-none bg-[var(--platform-paper-strong)] motion-reduce:animate-none sm:h-20" />
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Skeleton className="h-8 w-24 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                        <Skeleton className="h-8 w-32 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                    </div>
                </div>
                <div className="platform-toolbar mt-8 flex gap-3 overflow-hidden p-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton
                            key={index}
                            className="h-11 w-32 shrink-0 rounded-none bg-[var(--platform-paper)] motion-reduce:animate-none"
                        />
                    ))}
                </div>
                <div className="platform-panel mt-6 space-y-4 p-6 sm:p-8">
                    <Skeleton className="h-6 w-48 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                    <Skeleton className="h-4 w-full rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                    <Skeleton className="h-4 w-5/6 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                    <Skeleton className="h-4 w-3/4 rounded-none bg-[var(--platform-line)] motion-reduce:animate-none" />
                </div>
            </PlatformPageShell>
        );
    }

    // Show error state if onboarding status check failed
    if (shouldCheckOnboarding && error) {
        return (
            <PlatformPageShell>
                <div className="platform-empty-state border border-red-500/35">
                    <span className="platform-empty-icon bg-[var(--platform-coral)]">
                        <AlertCircle className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <p className="max-w-lg text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('onboardingGate.errorLoading')}
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        className="mt-5 min-h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] shadow-none"
                    >
                        {t('onboardingGate.retry')}
                    </Button>
                </div>
            </PlatformPageShell>
        );
    }

    // If user needs onboarding, show the setup required banner and gate
    // Requirements: 4.4 - Display "Setup Required" status indicator
    if (needsOnboarding) {
        return (
            <>
                {/* Required Fields Gate */}
                <RequiredFieldsGate
                    competitionId={competition.id}
                    competitionName={competition.name}
                    joined={competition.joined}
                    requiredFields={competition.requiredFields}
                    showUpdateValuesButton={false}
                    open={showRequiredFieldsDialog}
                    onOpenChange={setShowRequiredFieldsDialog}
                    readOnly={competition.validationRequired}
                />

                {/* Show competition details but with limited access */}
                <CompetitionDetails
                    competition={competition}
                    leaderboard={leaderboard}
                    leaderboardUnavailable={leaderboardUnavailable}
                    isPreJoinedParticipant={isPreJoinedParticipant}
                    onRequiredFieldsDialogOpenChange={setShowRequiredFieldsDialog}
                    organizerDataConsent={organizerDataConsent}
                    setupNotice={
                        <aside className="mb-8 border border-orange-600/35 bg-orange-400/10 p-4 sm:p-5">
                            <div className="flex items-start gap-4">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[var(--platform-coral)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                                    <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h2 className="font-semibold text-[var(--platform-ink)]">
                                        {t('setupRequired.title')}
                                    </h2>
                                    <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                                        {t('setupRequired.description')}
                                    </p>
                                    <Button
                                        onClick={() => setShowOnboardingGate(true)}
                                        className="mt-4 min-h-11 rounded-none bg-[var(--platform-violet)] text-[var(--platform-paper)] shadow-none hover:bg-[var(--platform-violet-strong)]"
                                    >
                                        {t('setupRequired.completeSetup')}
                                    </Button>
                                </div>
                            </div>
                        </aside>
                    }
                />

                {/* Onboarding Gate Dialog */}
                <OnboardingGate
                    open={showOnboardingGate}
                    onOpenChange={setShowOnboardingGate}
                    competitionId={competition.id}
                    competitionName={competition.name}
                    sebRequired={competition.sebRequired}
                    onComplete={handleOnboardingComplete}
                    onCancel={handleOnboardingCancel}
                />
            </>
        );
    }

    // Normal flow - show competition details
    return (
        <>
            {/* Required Fields Gate */}
            <RequiredFieldsGate
                competitionId={competition.id}
                competitionName={competition.name}
                joined={competition.joined}
                requiredFields={competition.requiredFields}
                showUpdateValuesButton={false}
                open={showRequiredFieldsDialog}
                onOpenChange={setShowRequiredFieldsDialog}
                readOnly={competition.validationRequired}
            />

            <CompetitionDetails
                competition={competition}
                leaderboard={leaderboard}
                leaderboardUnavailable={leaderboardUnavailable}
                isPreJoinedParticipant={isPreJoinedParticipant}
                onRequiredFieldsDialogOpenChange={setShowRequiredFieldsDialog}
                organizerDataConsent={organizerDataConsent}
            />
        </>
    );
}

export default CompetitionDetailsWithOnboarding;
