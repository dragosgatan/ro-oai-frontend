'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Wifi,
    WifiOff,
    Download,
    Monitor,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Connection status types for the companion app
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

/**
 * Monitoring mode types from the backend
 */
export type MonitoringMode = 'PreJoin' | 'Active' | 'Inactive' | null;

/**
 * Props for the CompanionConnectionStatus component
 */
export interface CompanionConnectionStatusProps {
    /** Current connection status */
    status: ConnectionStatus;
    /** Current monitoring mode (only shown when connected) */
    monitoringMode?: MonitoringMode;
    /** Whether to show detailed instructions when disconnected */
    showInstructions?: boolean;
    /** Callback for refresh button click */
    onRefresh?: () => void;
    /** Whether refresh is in progress */
    isRefreshing?: boolean;
    /** Optional additional CSS classes */
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Pure function to determine the display text for connection status
 * Used for property-based testing
 *
 * Requirements: 2.3, 2.4
 *
 * @param status - The connection status
 * @param monitoringMode - The monitoring mode (when connected)
 * @returns Object with statusText and modeText
 */
export function getStatusDisplayText(
    status: ConnectionStatus,
    monitoringMode: MonitoringMode,
): { statusText: string; modeText: string | null } {
    if (status === 'checking') {
        return { statusText: 'checking', modeText: null };
    }

    if (status === 'connected') {
        // Requirements 2.3: Display "Connected" with the monitoring mode
        const modeText = monitoringMode ? monitoringMode : null;
        return { statusText: 'connected', modeText };
    }

    // Requirements 2.4: Display "Disconnected"
    return { statusText: 'disconnected', modeText: null };
}

/**
 * Pure function to determine if instructions should be shown
 * Used for property-based testing
 *
 * Requirements: 2.4
 *
 * @param status - The connection status
 * @param showInstructions - Whether instructions are enabled
 * @returns true if instructions should be displayed
 */
export function shouldShowInstructions(
    status: ConnectionStatus,
    showInstructions: boolean,
): boolean {
    // Requirements 2.4: Show instructions when disconnected
    return status === 'disconnected' && showInstructions;
}

/**
 * Pure function to validate status display correctness
 * Used for property-based testing
 *
 * Requirements: 2.3, 2.4
 *
 * @param status - The connection status
 * @param monitoringMode - The monitoring mode
 * @param displayedStatusText - The text being displayed for status
 * @param displayedModeText - The text being displayed for mode (or null)
 * @param instructionsShown - Whether instructions are shown
 * @param showInstructionsEnabled - Whether showInstructions prop is true
 * @returns true if the display is correct according to requirements
 */
export function isStatusDisplayCorrect(
    status: ConnectionStatus,
    monitoringMode: MonitoringMode,
    displayedStatusText: string,
    displayedModeText: string | null,
    instructionsShown: boolean,
    showInstructionsEnabled: boolean,
): boolean {
    if (status === 'connected') {
        // Requirements 2.3: Must show "Connected" with monitoring mode
        if (displayedStatusText !== 'connected') return false;
        // Mode should be shown if available
        if (monitoringMode && displayedModeText !== monitoringMode) return false;
        // Instructions should not be shown when connected
        if (instructionsShown) return false;
        return true;
    }

    if (status === 'disconnected') {
        // Requirements 2.4: Must show "Disconnected" with instructions
        if (displayedStatusText !== 'disconnected') return false;
        // Mode should not be shown when disconnected
        if (displayedModeText !== null) return false;
        // Instructions should be shown if enabled
        if (showInstructionsEnabled && !instructionsShown) return false;
        return true;
    }

    if (status === 'checking') {
        if (displayedStatusText !== 'checking') return false;
        if (displayedModeText !== null) return false;
        if (instructionsShown) return false;
        return true;
    }

    return false;
}

/**
 * CompanionConnectionStatus component displays the current connection status
 * of the anti-cheat companion app with monitoring mode and instructions.
 *
 * Requirements: 2.3, 2.4
 * - Display "Connected" with mode when connected=true
 * - Display "Disconnected" with instructions when connected=false
 */
export function CompanionConnectionStatus({
    status,
    monitoringMode,
    showInstructions = true,
    onRefresh,
    isRefreshing = false,
    className = '',
    size = 'md',
}: CompanionConnectionStatusProps) {
    const t = useTranslations('antiCheat.companionStatus');

    // Size configurations
    const sizeConfig = {
        sm: {
            icon: 'h-4 w-4',
            text: 'text-sm',
            container: 'p-2',
            gap: 'gap-2',
        },
        md: {
            icon: 'h-5 w-5',
            text: 'text-sm',
            container: 'p-3',
            gap: 'gap-3',
        },
        lg: {
            icon: 'h-6 w-6',
            text: 'text-base',
            container: 'p-4',
            gap: 'gap-4',
        },
    };

    const sizes = sizeConfig[size];

    // Get display text for testing/validation
    const { statusText, modeText } = getStatusDisplayText(status, monitoringMode ?? null);
    const showInstructionsSection = shouldShowInstructions(status, showInstructions);

    // Render checking state
    if (status === 'checking') {
        return (
            <div
                className={cn(
                    'flex items-center rounded-lg border bg-muted/50',
                    sizes.container,
                    sizes.gap,
                    className,
                )}
                role="status"
                aria-live="polite"
                aria-label={t('checking')}
                data-status={statusText}
            >
                <Loader2 className={cn(sizes.icon, 'animate-spin text-muted-foreground')} />
                <span className={cn(sizes.text, 'text-muted-foreground')}>{t('checking')}</span>
            </div>
        );
    }

    // Render connected state
    // Requirements 2.3: Display "Connected" with the monitoring mode
    if (status === 'connected') {
        return (
            <div
                className={cn(
                    'rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
                    sizes.container,
                    className,
                )}
                role="status"
                aria-live="polite"
                aria-label={
                    modeText
                        ? t('connectedWithMode', { mode: t(`modes.${modeText}`) })
                        : t('connected')
                }
                data-status={statusText}
                data-mode={modeText}
            >
                <div className={cn('flex items-center', sizes.gap)}>
                    <div className="flex items-center gap-2">
                        <CheckCircle2
                            className={cn(sizes.icon, 'text-green-600 dark:text-green-400')}
                        />
                        <Wifi
                            className={cn(sizeConfig.sm.icon, 'text-green-600 dark:text-green-400')}
                        />
                    </div>
                    <div className="flex flex-col">
                        <span
                            className={cn(
                                sizes.text,
                                'font-medium text-green-700 dark:text-green-300',
                            )}
                        >
                            {t('connected')}
                        </span>
                        {modeText && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                                {t('modeLabel')}: {t(`modes.${modeText}`)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Render disconnected state
    // Requirements 2.4: Display "Disconnected" with instructions to connect
    return (
        <div
            className={cn(
                'rounded-lg border bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
                sizes.container,
                className,
            )}
            role="status"
            aria-live="polite"
            aria-label={t('disconnected')}
            data-status={statusText}
            data-instructions-shown={showInstructionsSection}
        >
            <div className={cn('flex items-center', sizes.gap)}>
                <div className="flex items-center gap-2">
                    <XCircle className={cn(sizes.icon, 'text-red-600 dark:text-red-400')} />
                    <WifiOff className={cn(sizeConfig.sm.icon, 'text-red-600 dark:text-red-400')} />
                </div>
                <span className={cn(sizes.text, 'font-medium text-red-700 dark:text-red-300')}>
                    {t('disconnected')}
                </span>
            </div>

            {/* Instructions section - Requirements 2.4 */}
            {showInstructionsSection && (
                <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-2">
                        {t('instructions.title')}
                    </p>
                    <ol className="space-y-1.5 text-sm text-red-600 dark:text-red-400 list-decimal list-inside">
                        <li className="flex items-start gap-2">
                            <span className="shrink-0">1.</span>
                            <span className="flex items-center gap-1">
                                <Download className="h-3.5 w-3.5 shrink-0" />
                                {t('instructions.step1')}
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="shrink-0">2.</span>
                            <span className="flex items-center gap-1">
                                <Monitor className="h-3.5 w-3.5 shrink-0" />
                                {t('instructions.step2')}
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="shrink-0">3.</span>
                            <span>{t('instructions.step3')}</span>
                        </li>
                    </ol>

                    <div className="flex gap-2 mt-3">
                        {onRefresh && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                disabled={isRefreshing}
                                className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50"
                            >
                                <RefreshCw
                                    className={cn(
                                        'h-3.5 w-3.5 mr-1.5',
                                        isRefreshing && 'animate-spin',
                                    )}
                                />
                                {isRefreshing
                                    ? t('instructions.checking')
                                    : t('instructions.refresh')}
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50"
                        >
                            {/* Use MSI installer to avoid antivirus false positives */}
                            <a href="/downloads/MLCompete-Companion_x64.msi" download>
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                {t('instructions.download')}
                            </a>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CompanionConnectionStatus;
