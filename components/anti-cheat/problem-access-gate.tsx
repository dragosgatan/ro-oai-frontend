'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { fetchApi } from '@/lib/api';
import { useOnboardingProgress, isOnboardingComplete } from '@/hooks/use-onboarding-progress';
import { useOnboardingStatus, shouldShowOnboardingGate } from '@/hooks/use-onboarding-status';
import { useAntiCheatConnectionSafe } from '@/components/anti-cheat-connection-provider';
import { OnboardingGate } from './onboarding-gate';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the ProblemAccessGate component
 */
export interface ProblemAccessGateProps {
    /** Competition ID for the anti-cheat session */
    competitionId: number;
    /** Competition name for display */
    competitionName: string;
    /** Whether anti-cheat is enabled for this competition (optional - will be fetched if not provided) */
    antiCheatEnabled?: boolean;
    /** Children to render when access is granted (problem content) */
    children: React.ReactNode;
    /** Optional class name for the container */
    className?: string;
    /** Callback when onboarding is completed */
    onOnboardingComplete?: () => void;
}

/**
 * Connection loss warning banner component
 */
interface ConnectionLossWarningProps {
    onRefresh: () => void;
    isRefreshing: boolean;
    secondsSinceHeartbeat: number | null;
}

function ConnectionLossWarning({
    onRefresh,
    isRefreshing,
    secondsSinceHeartbeat,
}: ConnectionLossWarningProps) {
    const t = useTranslations('antiCheat.problemAccessGate');

    return (
        <Alert
            variant="destructive"
            className="mb-6 rounded-none border-red-700/35 bg-red-500/10 px-4 py-4"
        >
            <WifiOff className="h-4 w-4" />
            <AlertTitle>{t('connectionLost.title')}</AlertTitle>
            <AlertDescription>
                <p className="mb-2">{t('connectionLost.description')}</p>
                {secondsSinceHeartbeat !== null && (
                    <p className="text-sm opacity-80 mb-2">
                        {t('connectionLost.lastSeen', { seconds: secondsSinceHeartbeat })}
                    </p>
                )}
                <Button
                    onClick={onRefresh}
                    variant="outline"
                    size="sm"
                    disabled={isRefreshing}
                    className="mt-1 min-h-11 rounded-none bg-background"
                >
                    {isRefreshing ? (
                        <Loader2 className="me-1 h-3 w-3 animate-spin" />
                    ) : (
                        <RefreshCw className="me-1 h-3 w-3" />
                    )}
                    {t('connectionLost.reconnect')}
                </Button>
            </AlertDescription>
        </Alert>
    );
}

/**
 * ProblemAccessGate component - Gates access to competition problems based on onboarding completion
 *
 * Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 6.4, 6.5
 * - Check onboarding completion status using useOnboardingStatus hook
 * - Check if user is a pre-joined participant
 * - Show OnboardingGate in 'setup-only' mode if participant but not onboarded
 * - Check companion app connection status
 * - Show children (problem content) if onboarding complete
 * - Show reconnection warning if connection lost (but allow continued access)
 */
export function ProblemAccessGate({
    competitionId,
    competitionName,
    antiCheatEnabled: antiCheatEnabledProp,
    children,
    className,
    onOnboardingComplete,
}: ProblemAccessGateProps) {
    const t = useTranslations('antiCheat.problemAccessGate');
    const { status: authStatus } = useSession();
    const { progress } = useOnboardingProgress(competitionId);
    const connection = useAntiCheatConnectionSafe();

    // Use the onboarding status hook to check participant status and onboarding completion
    // Requirements: 3.1, 3.2 - Check both participant existence AND onboarding status
    const {
        status: onboardingStatus,
        isLoading: isOnboardingStatusLoading,
        refetch: refetchOnboardingStatus,
    } = useOnboardingStatus(competitionId, {
        enabled: authStatus === 'authenticated',
    });

    // State for onboarding gate visibility
    const [showOnboardingGate, setShowOnboardingGate] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [antiCheatEnabled, setAntiCheatEnabled] = useState<boolean | null>(
        antiCheatEnabledProp ?? null,
    );

    // Check if onboarding is complete from local storage
    const localOnboardingComplete = isOnboardingComplete(progress);

    // Fetch competition anti-cheat status if not provided
    const fetchCompetitionAntiCheatStatus = useCallback(async () => {
        if (antiCheatEnabledProp !== undefined) {
            setAntiCheatEnabled(antiCheatEnabledProp);
            return antiCheatEnabledProp;
        }

        try {
            const response = await fetchApi(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/competitions/${competitionId}/basic`,
            );

            if (response.ok) {
                const data = await response.json();
                const enabled = data.antiCheatEnabled ?? false;
                setAntiCheatEnabled(enabled);
                return enabled;
            } else {
                // If endpoint fails, assume anti-cheat is not enabled
                setAntiCheatEnabled(false);
                return false;
            }
        } catch {
            // Fall back to assuming anti-cheat is not enabled
            setAntiCheatEnabled(false);
            return false;
        }
    }, [competitionId, antiCheatEnabledProp]);

    // Initial load
    useEffect(() => {
        const checkStatus = async () => {
            setIsLoading(true);

            // First check if anti-cheat is enabled
            await fetchCompetitionAntiCheatStatus();

            setIsLoading(false);
        };

        if (authStatus === 'authenticated') {
            checkStatus();
        } else {
            setIsLoading(false);
        }
    }, [authStatus, fetchCompetitionAntiCheatStatus]);

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refetchOnboardingStatus();
        connection?.refresh?.();
        setIsRefreshing(false);
    }, [refetchOnboardingStatus, connection]);

    // Handle onboarding complete
    // Requirements: 3.3 - When participant completes onboarding, immediately allow access
    const handleOnboardingComplete = useCallback(() => {
        setShowOnboardingGate(false);
        // Refetch the onboarding status to get the updated state from backend
        refetchOnboardingStatus();
        onOnboardingComplete?.();
    }, [onOnboardingComplete, refetchOnboardingStatus]);

    // Handle onboarding cancel
    const handleOnboardingCancel = useCallback(() => {
        setShowOnboardingGate(false);
    }, []);

    // If anti-cheat is not enabled, just render children
    if (antiCheatEnabled === false) {
        return <>{children}</>;
    }

    // If not authenticated, just render children (auth is handled elsewhere)
    if (authStatus !== 'authenticated') {
        return <>{children}</>;
    }

    // Loading state - wait for both anti-cheat status and onboarding status
    if (isLoading || antiCheatEnabled === null || isOnboardingStatusLoading) {
        return (
            <div
                className={cn(
                    'flex min-h-[400px] flex-col items-center justify-center border-y border-[oklch(0.79_0.04_289)] bg-[oklch(0.952_0.026_292)] p-8 dark:border-[oklch(0.34_0.055_287)] dark:bg-[oklch(0.215_0.046_286)]',
                    className,
                )}
            >
                <span className="mb-4 grid h-12 w-12 place-items-center bg-[oklch(0.89_0.185_116)] text-[oklch(0.2_0.045_282)] shadow-[4px_4px_0_oklch(0.43_0.235_291)]">
                    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-muted-foreground" role="status">
                    {t('checking')}
                </p>
            </div>
        );
    }

    // Determine if onboarding is complete
    // Requirements: 3.2 - Check both participant existence AND onboarding status
    // Use the shouldShowOnboardingGate helper which checks:
    // - isParticipant (pre-joined)
    // - antiCheatEnabled
    // - onboardingComplete
    const shouldShowGate = shouldShowOnboardingGate(onboardingStatus);

    // Fall back to local storage if onboarding status is not available
    const onboardingComplete = onboardingStatus?.onboardingComplete ?? localOnboardingComplete;

    // If onboarding gate should be shown (pre-joined participant with incomplete onboarding)
    // Requirements: 3.1 - Show OnboardingGate instead of problem content
    if (shouldShowGate || (!onboardingComplete && antiCheatEnabled)) {
        // Show blocking overlay with option to start onboarding
        return (
            <div className={cn('relative min-h-[32rem]', className)}>
                <div className="pointer-events-none select-none opacity-20" aria-hidden="true">
                    {children}
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-background/95 p-4">
                    <section
                        className="mx-auto max-w-md border border-[oklch(0.62_0.06_287)] bg-background p-6 text-center shadow-[7px_7px_0_oklch(0.43_0.235_291/0.22)] sm:p-8 dark:border-[oklch(0.5_0.07_287)]"
                        aria-labelledby="anti-cheat-gate-title"
                    >
                        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center bg-[oklch(0.89_0.185_116)] text-[oklch(0.2_0.045_282)] shadow-[4px_4px_0_oklch(0.43_0.235_291)]">
                            <ShieldAlert className="h-7 w-7" aria-hidden="true" />
                        </div>
                        <h2
                            id="anti-cheat-gate-title"
                            className="mb-2 text-2xl font-bold tracking-tight"
                        >
                            {t('onboardingRequired.title')}
                        </h2>
                        <p className="mb-6 text-sm leading-6 text-muted-foreground">
                            {t('onboardingRequired.description', { competitionName })}
                        </p>
                        <Button
                            onClick={() => setShowOnboardingGate(true)}
                            size="lg"
                            className="min-h-11 rounded-none bg-[oklch(0.43_0.235_291)] px-5 text-white hover:bg-[oklch(0.36_0.22_291)]"
                        >
                            {t('onboardingRequired.startButton')}
                        </Button>
                    </section>
                </div>

                {/* Requirements: 3.1 - Show OnboardingGate if participant but not onboarded */}
                <OnboardingGate
                    competitionId={competitionId}
                    competitionName={competitionName}
                    onComplete={handleOnboardingComplete}
                    onCancel={handleOnboardingCancel}
                    open={showOnboardingGate}
                    onOpenChange={setShowOnboardingGate}
                    sebRequired={true}
                />
            </div>
        );
    }

    // Onboarding is complete - check connection status
    const isConnected = connection?.isConnected ?? true;
    const isInterrupted = connection?.isInterrupted ?? false;
    const secondsSinceHeartbeat = connection?.secondsSinceHeartbeat ?? null;

    // If connection is lost or interrupted, show warning but allow access (Requirement 6.5)
    // Requirements: 3.3 - Allow access if onboarding complete
    if (!isConnected || isInterrupted) {
        return (
            <div className={className}>
                <ConnectionLossWarning
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                    secondsSinceHeartbeat={secondsSinceHeartbeat}
                />
                {children}
            </div>
        );
    }

    // All checks passed - render children normally
    // Requirements: 3.3 - Allow access if onboarding complete
    return <>{children}</>;
}

export default ProblemAccessGate;
