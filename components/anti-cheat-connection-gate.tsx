'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAntiCheatConnectionSafe } from './anti-cheat-connection-provider';
import { ShieldAlert, ShieldCheck, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { OnboardingGate } from '@/components/anti-cheat/onboarding-gate';

interface AntiCheatConnectionGateProps {
    /** Children to render when connected or anti-cheat not required */
    children: React.ReactNode;
    /** Optional class name for the container */
    className?: string;
    /** Whether to show a warning banner when interrupted (instead of blocking) */
    showWarningOnInterrupted?: boolean;
    /** Competition ID for onboarding flow */
    competitionId?: number;
    /** Competition name for onboarding flow */
    competitionName?: string;
    /** Callback when onboarding is completed */
    onOnboardingComplete?: () => void;
}

/**
 * Gate component that blocks access to competition content unless
 * the anti-cheat companion app is connected.
 *
 * - Shows loading state while checking connection
 * - Shows blocking overlay when not connected with link to onboarding
 * - Shows warning banner when connection is interrupted
 * - Renders children normally when connected or anti-cheat not required
 * - Auto-opens onboarding dialog on first access when not connected
 */
export function AntiCheatConnectionGate({
    children,
    className,
    showWarningOnInterrupted = true,
    competitionId,
    competitionName,
    onOnboardingComplete,
}: AntiCheatConnectionGateProps) {
    const t = useTranslations('antiCheat.connectionGate');
    const connection = useAntiCheatConnectionSafe();

    // State for onboarding dialog
    const [showOnboardingGate, setShowOnboardingGate] = useState(false);
    // Track if we've auto-shown the dialog on first access
    const [hasAutoShown, setHasAutoShown] = useState(false);

    // If not in provider context, just render children
    if (!connection) {
        return <>{children}</>;
    }

    const {
        isConnected,
        isInterrupted,
        isRequired,
        isLoading,
        error,
        refresh,
        secondsSinceHeartbeat,
    } = connection;

    // Auto-show onboarding dialog on first access when not connected
    // This effect runs when connection status changes
    useEffect(() => {
        if (
            isRequired &&
            !isLoading &&
            !isConnected &&
            !isInterrupted &&
            !hasAutoShown &&
            competitionId &&
            competitionName
        ) {
            // Auto-open the onboarding dialog on first access
            setShowOnboardingGate(true);
            setHasAutoShown(true);
        }
    }, [
        isRequired,
        isLoading,
        isConnected,
        isInterrupted,
        hasAutoShown,
        competitionId,
        competitionName,
    ]);

    // Handle onboarding complete
    const handleOnboardingComplete = useCallback(() => {
        setShowOnboardingGate(false);
        refresh();
        onOnboardingComplete?.();
    }, [refresh, onOnboardingComplete]);

    // Handle onboarding cancel
    const handleOnboardingCancel = useCallback(() => {
        setShowOnboardingGate(false);
    }, []);

    // If anti-cheat is not required, just render children
    if (!isRequired) {
        return <>{children}</>;
    }

    // Loading state
    if (isLoading) {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center min-h-[400px] p-8',
                    className,
                )}
            >
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('checking')}</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div
                className={cn(
                    'flex flex-col items-center justify-center min-h-[400px] p-8',
                    className,
                )}
            >
                <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={refresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('retry')}
                </Button>
            </div>
        );
    }

    // Not connected - show blocking overlay with link to onboarding
    if (!isConnected && !isInterrupted) {
        return (
            <div className={cn('relative', className)}>
                {/* Blurred background content */}
                <div className="blur-sm pointer-events-none select-none opacity-50">{children}</div>

                {/* Blocking overlay - simplified to link to onboarding */}
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                    <div className="max-w-md mx-auto p-8 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                            <WifiOff className="h-8 w-8 text-destructive" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{t('notConnected.title')}</h2>
                        <p className="text-muted-foreground mb-6">
                            {t('notConnected.description')}
                        </p>

                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                <Button onClick={refresh} variant="outline">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    {t('notConnected.checkAgain')}
                                </Button>
                                {competitionId && competitionName && (
                                    <Button onClick={() => setShowOnboardingGate(true)}>
                                        {t('notConnected.startSetup')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Onboarding Gate Dialog */}
                {competitionId && competitionName && (
                    <OnboardingGate
                        open={showOnboardingGate}
                        onOpenChange={setShowOnboardingGate}
                        competitionId={competitionId}
                        competitionName={competitionName}
                        sebRequired
                        onComplete={handleOnboardingComplete}
                        onCancel={handleOnboardingCancel}
                    />
                )}
            </div>
        );
    }

    // Interrupted - show warning banner but allow access
    if (isInterrupted && showWarningOnInterrupted) {
        return (
            <div className={className}>
                <Alert variant="destructive" className="mb-6">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>{t('interrupted.title')}</AlertTitle>
                    <AlertDescription>
                        <p className="mb-2">{t('interrupted.description')}</p>
                        {secondsSinceHeartbeat !== null && (
                            <p className="text-sm opacity-80">
                                {t('interrupted.lastSeen', { seconds: secondsSinceHeartbeat })}
                            </p>
                        )}
                        <Button onClick={refresh} variant="outline" size="sm" className="mt-2">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            {t('interrupted.checkNow')}
                        </Button>
                    </AlertDescription>
                </Alert>
                {children}
            </div>
        );
    }

    // Connected - show success indicator and render children
    return (
        <div className={className}>
            {/* Optional: Show connected status */}
            <div className="mb-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <ShieldCheck className="h-4 w-4" />
                <span>{t('connected')}</span>
            </div>
            {children}
        </div>
    );
}

export default AntiCheatConnectionGate;
