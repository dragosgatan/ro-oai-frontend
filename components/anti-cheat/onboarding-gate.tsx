'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    ShieldCheck,
    Download,
    Monitor,
    Apple,
    Smartphone,
    CheckCircle2,
    Loader2,
    ExternalLink,
    AlertTriangle,
    FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { useOnboardingProgress, OnboardingStepKey } from '@/hooks/use-onboarding-progress';
import { platformSans } from '@/lib/platform-fonts';

/**
 * Step identifiers for the SEB onboarding process
 */
export type OnboardingStepId = 'download' | 'install' | 'config' | 'consent';

/**
 * Individual step configuration
 */
export interface OnboardingStep {
    id: OnboardingStepId;
    title: string;
    description: string;
    isComplete: boolean;
    isActive: boolean;
    isDisabled: boolean;
}

/**
 * Props for the OnboardingGate component
 */
export interface OnboardingGateProps {
    /** Competition ID for the SEB session */
    competitionId: number;
    /** Competition name for display */
    competitionName: string;
    /** Whether Safe Exam Browser is required for this competition */
    sebRequired?: boolean;
    /** Callback when onboarding is complete and user joins */
    onComplete: () => void | Promise<void>;
    /** Callback when user cancels */
    onCancel: () => void;
    /** Whether the dialog is open */
    open?: boolean;
    /** Callback when dialog open state changes */
    onOpenChange?: (open: boolean) => void;
}

/**
 * Step indicator component showing all steps
 */
interface StepIndicatorProps {
    steps: OnboardingStep[];
    currentStepIndex: number;
}

export function StepIndicator({ steps, currentStepIndex }: StepIndicatorProps) {
    const t = useTranslations('antiCheat.onboardingGate');

    const getStepIcon = (step: OnboardingStep, index: number) => {
        const iconClass = 'h-4 w-4';
        if (step.isComplete) {
            return <CheckCircle2 className={iconClass} aria-hidden="true" />;
        }
        switch (step.id) {
            case 'download':
                return <Download className={iconClass} aria-hidden="true" />;
            case 'install':
                return <Monitor className={iconClass} aria-hidden="true" />;
            case 'config':
                return <Download className={iconClass} aria-hidden="true" />;
            case 'consent':
                return <FileCheck className={iconClass} aria-hidden="true" />;
            default:
                return <span className="text-sm font-medium">{index + 1}</span>;
        }
    };

    return (
        <nav className="w-full" role="navigation" aria-label={t('stepIndicator.ariaLabel')}>
            <ol className="grid gap-2 sm:grid-cols-4" aria-label={t('stepIndicator.ariaLabel')}>
                {steps.map((step, index) => (
                    <li
                        key={step.id}
                        className={cn(
                            'relative grid min-h-14 grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-2 border px-2.5 py-2 text-start transition-colors duration-200',
                            'border-[#c9becf] bg-[#f4eff8] text-[#6b6075] dark:border-[#4d4258] dark:bg-[#282032] dark:text-[#c5b9ce]',
                            step.isComplete &&
                                'border-[#739a21] bg-[#e8f8ae] text-[#26300f] dark:border-[#a8cc4a] dark:bg-[#344215] dark:text-[#e7f5bb]',
                            step.isActive &&
                                !step.isComplete &&
                                'border-[#5b21b6] bg-[#eee7f8] text-[#4c179f] shadow-[3px_3px_0_#f58a65] dark:border-[#a78bfa] dark:bg-[#34244b] dark:text-[#d8c8ff] dark:shadow-[3px_3px_0_#f58a65]',
                            step.isDisabled && 'opacity-55',
                            index < currentStepIndex && !step.isComplete && 'border-[#739a21]',
                        )}
                        aria-current={step.isActive ? 'step' : undefined}
                        aria-disabled={step.isDisabled || undefined}
                    >
                        <span
                            className={cn(
                                'flex h-9 w-9 items-center justify-center border border-current bg-[#fbf8ff] font-mono text-xs font-bold dark:bg-[#1c1725]',
                                step.isComplete &&
                                    'border-[#506d12] bg-[#d6f565] text-[#26300f] dark:border-[#d6f565] dark:bg-[#d6f565] dark:text-[#26300f]',
                                step.isActive &&
                                    !step.isComplete &&
                                    'border-[#5b21b6] bg-[#5b21b6] text-white dark:border-[#a78bfa] dark:bg-[#a78bfa] dark:text-[#1c1725]',
                            )}
                            role="img"
                            aria-label={
                                step.isComplete
                                    ? t('stepIndicator.stepComplete', { step: step.title })
                                    : step.isActive
                                      ? t('stepIndicator.stepActive', { step: step.title })
                                      : t('stepIndicator.stepPending', { step: step.title })
                            }
                        >
                            {getStepIcon(step, index)}
                        </span>
                        <span
                            className={cn(
                                'min-w-0 text-xs font-semibold leading-4',
                                step.isActive && 'text-[#4c179f] dark:text-[#d8c8ff]',
                                step.isComplete && 'text-[#35480e] dark:text-[#e7f5bb]',
                            )}
                        >
                            {step.title}
                        </span>
                    </li>
                ))}
            </ol>
        </nav>
    );
}

/**
 * Download link configuration for SEB platforms
 */
interface DownloadLink {
    platform: 'windows' | 'macos' | 'ios';
    icon: React.ReactNode;
    url: string;
}

/**
 * OnboardingGate component - Multi-step onboarding dialog for SEB-required competitions
 *
 * Steps: Download SEB, Install, Download Config, Consent & Join
 */
export function OnboardingGate({
    competitionId,
    competitionName,
    sebRequired = false,
    onComplete,
    onCancel,
    open = true,
    onOpenChange,
}: OnboardingGateProps) {
    const t = useTranslations('antiCheat.onboardingGate');
    const { progress, updateProgress } = useOnboardingProgress(competitionId);

    // Current step state
    const [currentStepId, setCurrentStepId] = useState<OnboardingStepId>('download');

    // Consent state
    const [consentChecked, setConsentChecked] = useState(false);

    // Joining state
    const [isJoining, setIsJoining] = useState(false);

    // Error state
    const [error, setError] = useState<string | null>(null);

    // SEB download links - official Safe Exam Browser releases
    const sebDownloadLinks: DownloadLink[] = [
        {
            platform: 'windows',
            icon: <Monitor className="h-5 w-5" aria-hidden="true" />,
            url: 'https://github.com/SafeExamBrowser/seb-win-refactoring/releases/download/v3.10.1/SEB_3.10.1.864_SetupBundle.exe',
        },
        {
            platform: 'macos',
            icon: <Apple className="h-5 w-5" aria-hidden="true" />,
            url: 'https://github.com/SafeExamBrowser/seb-mac/releases/download/3.6.1/SafeExamBrowser-3.6.1.dmg',
        },
        {
            platform: 'ios',
            icon: <Smartphone className="h-5 w-5" aria-hidden="true" />,
            url: 'https://apps.apple.com/app/safe-exam-browser/id1161003686',
        },
    ];

    // SEB config download URL
    const sebConfigUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/seb/config/${competitionId}`;

    // Map step IDs to progress keys
    const stepToProgressKey: Record<OnboardingStepId, OnboardingStepKey> = {
        download: 'downloadComplete',
        install: 'installComplete',
        config: 'connectComplete', // Reuse connectComplete for config step
        consent: 'consentComplete',
    };

    // Build steps array with current state
    const steps: OnboardingStep[] = [
        {
            id: 'download',
            title: t('steps.sebDownload.title'),
            description: t('steps.sebDownload.description'),
            isComplete: progress?.downloadComplete ?? false,
            isActive: currentStepId === 'download',
            isDisabled: false,
        },
        {
            id: 'install',
            title: t('steps.install.title'),
            description: t('steps.install.description'),
            isComplete: progress?.installComplete ?? false,
            isActive: currentStepId === 'install',
            isDisabled: !(progress?.downloadComplete ?? false),
        },
        {
            id: 'config',
            title: t('steps.sebConfig.title'),
            description: t('steps.sebConfig.description'),
            isComplete: progress?.connectComplete ?? false,
            isActive: currentStepId === 'config',
            isDisabled: !(progress?.installComplete ?? false),
        },
        {
            id: 'consent',
            title: t('steps.consent.title'),
            description: t('steps.consent.description'),
            isComplete: progress?.consentComplete ?? false,
            isActive: currentStepId === 'consent',
            isDisabled: !(progress?.connectComplete ?? false),
        },
    ];

    const currentStepIndex = steps.findIndex((s) => s.id === currentStepId);
    const currentStep = steps[currentStepIndex];

    // Initialize current step based on progress
    useEffect(() => {
        if (!progress) {
            setCurrentStepId('download');
            return;
        }

        // Find the first incomplete step
        if (!progress.downloadComplete) {
            setCurrentStepId('download');
        } else if (!progress.installComplete) {
            setCurrentStepId('install');
        } else if (!progress.connectComplete) {
            setCurrentStepId('config');
        } else if (!progress.consentComplete) {
            setCurrentStepId('consent');
        }
    }, [progress]);

    // Reset state when dialog opens
    useEffect(() => {
        if (open && !progress) {
            setCurrentStepId('download');
            setConsentChecked(false);
            setError(null);
            setIsJoining(false);
        }
    }, [open, progress]);

    // Handle step completion and navigation
    const completeCurrentStep = useCallback(() => {
        const progressKey = stepToProgressKey[currentStepId];
        updateProgress(progressKey, true);

        // The previous companion-app flow had a separate pre-join scan step.
        // Safe Exam Browser now performs that protection after its configuration
        // is opened, so completing the config step also completes the retained
        // storage field. This keeps persisted progress compatible with the
        // existing problem-access fallback, which still requires all fields.
        if (currentStepId === 'config') {
            updateProgress('scanComplete', true);
        }

        // Move to next step
        const nextStepIndex = currentStepIndex + 1;
        if (nextStepIndex < steps.length) {
            setCurrentStepId(steps[nextStepIndex].id);
        }
    }, [currentStepId, currentStepIndex, steps, updateProgress]);

    // Handle cancel
    const handleCancel = useCallback(() => {
        setError(null);
        onCancel();
    }, [onCancel]);

    // Handle dialog open change
    const handleOpenChange = useCallback(
        (newOpen: boolean) => {
            if (!newOpen) {
                setError(null);
            }
            onOpenChange?.(newOpen);
        },
        [onOpenChange],
    );

    // Handle join competition
    const handleJoin = useCallback(async () => {
        if (!consentChecked) {
            setError(t('errors.consentRequired'));
            return;
        }

        setIsJoining(true);
        setError(null);
        try {
            // Persist the participant and backend consent first. Local progress must never claim
            // completion when either request fails.
            await onComplete();
            updateProgress('consentComplete', true);
        } catch {
            setError(t('errors.joinFailed'));
        } finally {
            setIsJoining(false);
        }
    }, [consentChecked, onComplete, t, updateProgress]);

    // If SEB is not required, don't show the gate
    if (!sebRequired) {
        return null;
    }

    // Render step content based on current step
    const renderStepContent = () => {
        switch (currentStepId) {
            case 'download':
                return (
                    <div className="space-y-5">
                        <p className="text-sm leading-6 text-[#665c73] dark:text-[#c1b5cc]">
                            {t('steps.sebDownload.description')}
                        </p>
                        {/* No Linux warning for SEB */}
                        <div className="border border-[#d97706]/45 bg-[#f59e0b]/10 p-3.5 dark:border-[#fbbf24]/45 dark:bg-[#f59e0b]/10">
                            <p className="text-sm leading-6 text-[#92400e] dark:text-[#fde68a]">
                                {t('steps.sebDownload.noLinux')}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            {sebDownloadLinks.map((link) => (
                                <a
                                    key={link.platform}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        'group flex min-h-32 flex-col items-start gap-2 border border-[#b9adc4] bg-[#f4eff8] p-4 text-[#241c34] transition-[border-color,transform,background-color] duration-200 hover:-translate-y-0.5 hover:border-[#5b21b6] hover:bg-[#eee7f8] focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#f58a65] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fbf8ff] motion-reduce:transition-none',
                                        'dark:border-[#50445d] dark:bg-[#282032] dark:text-[#f4eff8] dark:hover:border-[#a78bfa] dark:hover:bg-[#342b3f] dark:focus-visible:ring-offset-[#1c1725]',
                                    )}
                                    aria-label={t('steps.sebDownload.downloadFor', {
                                        platform: t(`steps.sebDownload.platforms.${link.platform}`),
                                    })}
                                >
                                    <span className="flex h-10 w-10 items-center justify-center bg-[#d6f565] text-[#26300f] shadow-[3px_3px_0_#5b21b6]">
                                        {link.icon}
                                    </span>
                                    <span className="mt-1 font-semibold transition-colors group-hover:text-[#5b21b6] dark:group-hover:text-[#c4b5fd]">
                                        {t(`steps.sebDownload.platforms.${link.platform}`)}
                                    </span>
                                    <span className="text-xs leading-5 text-[#665c73] dark:text-[#c1b5cc]">
                                        {t(`steps.sebDownload.platformDesc.${link.platform}`)}
                                    </span>
                                </a>
                            ))}
                        </div>
                        <a
                            href="https://safeexambrowser.org/download_en.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#5b21b6] underline decoration-[#f58a65] decoration-2 underline-offset-4 hover:text-[#4c179f] dark:text-[#c4b5fd] dark:hover:text-[#ddd2ff]"
                        >
                            {t('steps.sebDownload.learnMore')}
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        </a>
                        <Button
                            onClick={completeCurrentStep}
                            className="min-h-11 w-full rounded-none bg-[#5b21b6] font-bold text-white shadow-[4px_4px_0_#f58a65] hover:bg-[#4c179f] dark:bg-[#a78bfa] dark:text-[#1c1725] dark:hover:bg-[#b9a6ff]"
                        >
                            {t('steps.sebDownload.confirmButton')}
                        </Button>
                    </div>
                );

            case 'install':
                return (
                    <div className="space-y-5">
                        <p className="text-sm leading-6 text-[#665c73] dark:text-[#c1b5cc]">
                            {t('steps.install.description')}
                        </p>
                        <ol className="border-t border-[#b9adc4] text-sm dark:border-[#50445d]">
                            {[1, 2, 3].map((stepNumber) => (
                                <li
                                    key={stepNumber}
                                    className="grid min-h-14 grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-3 border-b border-[#c9becf] py-3 text-[#4d4358] dark:border-[#44394f] dark:text-[#d2c7d9]"
                                >
                                    <span className="flex h-9 w-9 items-center justify-center bg-[#d6f565] font-mono text-xs font-bold text-[#26300f]">
                                        {stepNumber.toString().padStart(2, '0')}
                                    </span>
                                    <span className="leading-6">
                                        {t(`steps.install.step${stepNumber}`)}
                                    </span>
                                </li>
                            ))}
                        </ol>
                        <Button
                            onClick={completeCurrentStep}
                            className="min-h-11 w-full rounded-none bg-[#5b21b6] font-bold text-white shadow-[4px_4px_0_#f58a65] hover:bg-[#4c179f] dark:bg-[#a78bfa] dark:text-[#1c1725] dark:hover:bg-[#b9a6ff]"
                        >
                            {t('steps.install.confirmButton')}
                        </Button>
                    </div>
                );

            case 'config':
                return (
                    <div className="space-y-5">
                        <p className="text-sm leading-6 text-[#665c73] dark:text-[#c1b5cc]">
                            {t('steps.sebConfig.description')}
                        </p>
                        <div className="border border-[#8b6cb6] bg-[#eee7f8] p-4 dark:border-[#776092] dark:bg-[#34244b]">
                            <div className="mb-3 flex h-10 w-10 items-center justify-center bg-[#5b21b6] text-white shadow-[3px_3px_0_#f58a65] dark:bg-[#a78bfa] dark:text-[#1c1725]">
                                <Download className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <p className="mb-4 text-sm leading-6 text-[#4c3568] dark:text-[#ddcff0]">
                                {t('steps.sebConfig.instructions')}
                            </p>
                            <Button
                                variant="outline"
                                className="min-h-11 w-full rounded-none border-[#5b21b6] bg-[#fbf8ff] font-semibold text-[#5b21b6] shadow-none hover:bg-[#e5dafa] dark:border-[#a78bfa] dark:bg-[#282032] dark:text-[#d8c8ff] dark:hover:bg-[#413153]"
                                asChild
                            >
                                <a href={sebConfigUrl} download>
                                    <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                                    {t('steps.sebConfig.downloadButton')}
                                </a>
                            </Button>
                        </div>
                        <Button
                            onClick={completeCurrentStep}
                            className="min-h-11 w-full rounded-none bg-[#5b21b6] font-bold text-white shadow-[4px_4px_0_#f58a65] hover:bg-[#4c179f] dark:bg-[#a78bfa] dark:text-[#1c1725] dark:hover:bg-[#b9a6ff]"
                        >
                            {t('steps.sebConfig.confirmButton')}
                        </Button>
                    </div>
                );

            case 'consent':
                return (
                    <div className="space-y-5">
                        {/* SEB Warning */}
                        <div className="border border-[#d97706]/45 bg-[#f59e0b]/10 p-4 dark:border-[#fbbf24]/45 dark:bg-[#f59e0b]/10">
                            <h4 className="mb-3 flex items-center gap-2 font-semibold text-[#92400e] dark:text-[#fde68a]">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#f58a65] text-[#2b1b16]">
                                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                                </span>
                                {t('steps.consent.sebWarningTitle')}
                            </h4>
                            <ul className="space-y-2 text-sm leading-6 text-[#92400e] dark:text-[#fde68a]">
                                <li className="flex gap-2 before:mt-2.5 before:h-1.5 before:w-1.5 before:shrink-0 before:bg-current">
                                    {t('steps.consent.sebWarning1')}
                                </li>
                                <li className="flex gap-2 before:mt-2.5 before:h-1.5 before:w-1.5 before:shrink-0 before:bg-current">
                                    {t('steps.consent.sebWarning2')}
                                </li>
                                <li className="flex gap-2 before:mt-2.5 before:h-1.5 before:w-1.5 before:shrink-0 before:bg-current">
                                    {t('steps.consent.sebWarning3')}
                                </li>
                            </ul>
                        </div>

                        {/* Consent Checkbox */}
                        <div className="flex min-h-16 items-start gap-3 border border-[#b9adc4] bg-[#f4eff8] p-4 dark:border-[#50445d] dark:bg-[#282032]">
                            <Checkbox
                                id="consent-checkbox"
                                checked={consentChecked}
                                onCheckedChange={(checked) => setConsentChecked(checked === true)}
                                aria-describedby="consent-description"
                                className="mt-0.5 h-5 w-5 shrink-0 rounded-none border-2 border-[#5b21b6] data-[state=checked]:bg-[#5b21b6] data-[state=checked]:text-white dark:border-[#a78bfa] dark:data-[state=checked]:bg-[#a78bfa] dark:data-[state=checked]:text-[#1c1725]"
                            />
                            <div className="space-y-1">
                                <Label
                                    htmlFor="consent-checkbox"
                                    className="cursor-pointer text-sm font-semibold leading-6 text-[#241c34] dark:text-[#f4eff8]"
                                >
                                    {t('steps.consent.sebCheckboxLabel')}
                                </Label>
                                <p
                                    id="consent-description"
                                    className="text-xs text-[#665c73] dark:text-[#c1b5cc]"
                                >
                                    <Link
                                        href="/privacy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex min-h-7 items-center gap-1 font-semibold text-[#5b21b6] underline decoration-[#f58a65] decoration-2 underline-offset-4 dark:text-[#c4b5fd]"
                                    >
                                        {t('steps.consent.privacyLink')}
                                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                    </Link>
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleJoin}
                            disabled={!consentChecked || isJoining}
                            className="min-h-11 w-full rounded-none bg-[#d6f565] font-bold text-[#26300f] shadow-[4px_4px_0_#5b21b6] hover:bg-[#c8ed4e] disabled:shadow-none dark:bg-[#d6f565] dark:text-[#26300f] dark:hover:bg-[#e1fb86]"
                        >
                            {isJoining ? (
                                <>
                                    <Loader2
                                        className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none"
                                        aria-hidden="true"
                                    />
                                    {t('steps.consent.joining')}
                                </>
                            ) : (
                                t('steps.consent.joinButton')
                            )}
                        </Button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                className={cn(
                    platformSans.variable,
                    platformSans.className,
                    'max-h-[92dvh] w-[calc(100%_-_1.25rem)] max-w-3xl gap-0 overflow-hidden rounded-none border-2 border-[#5b21b6] bg-[#fbf8ff] p-0 text-[#241c34] shadow-[8px_8px_0_#5b21b6] duration-200 motion-reduce:duration-0 sm:rounded-none',
                    'dark:border-[#a78bfa] dark:bg-[#1c1725] dark:text-[#f4eff8] dark:shadow-[8px_8px_0_#a78bfa]',
                )}
            >
                <div className="bg-[#5b21b6] px-4 py-5 text-white sm:px-6 sm:py-6 dark:bg-[#312044]">
                    <DialogHeader className="space-y-3 text-start">
                        <div className="flex items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#f58a65] text-[#2b1b16] shadow-[4px_4px_0_#d6f565]">
                                <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                                <DialogTitle className="text-pretty text-xl font-bold leading-tight tracking-[-0.025em] text-white sm:text-2xl">
                                    {t('sebTitle')}
                                </DialogTitle>
                                <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-violet-100 sm:text-base dark:text-violet-100">
                                    {t('sebDescription', { competitionName })}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="min-h-0 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
                    {/* Step Indicator */}
                    <StepIndicator steps={steps} currentStepIndex={currentStepIndex} />

                    {/* Current Step Title */}
                    <div className="mb-5 mt-6 flex items-end justify-between gap-4 border-b border-[#b9adc4] pb-3 dark:border-[#50445d]">
                        <h3 className="text-pretty text-lg font-bold tracking-[-0.025em] text-[#241c34] dark:text-[#f4eff8] sm:text-xl">
                            {currentStep?.title}
                        </h3>
                        <span
                            className="shrink-0 font-mono text-xs font-bold tabular-nums text-[#5b21b6] dark:text-[#c4b5fd]"
                            aria-hidden="true"
                        >
                            {String(currentStepIndex + 1).padStart(2, '0')} /{' '}
                            {String(steps.length).padStart(2, '0')}
                        </span>
                    </div>

                    {/* Step Content */}
                    {renderStepContent()}

                    {/* Error Message */}
                    {error && (
                        <div
                            className="mt-5 border border-red-500/50 bg-red-500/10 p-3.5 text-sm font-medium leading-6 text-red-800 dark:border-red-400/50 dark:bg-red-400/10 dark:text-red-200"
                            role="alert"
                            aria-live="assertive"
                        >
                            {error}
                        </div>
                    )}
                </div>

                {/* Cancel Button */}
                <div className="flex justify-start border-t border-[#b9adc4] bg-[#f4eff8] px-4 py-3 sm:px-6 dark:border-[#50445d] dark:bg-[#282032]">
                    <Button
                        variant="ghost"
                        onClick={handleCancel}
                        className="min-h-11 rounded-none px-4 font-semibold text-[#4d4358] hover:bg-[#e7dfed] hover:text-[#241c34] dark:text-[#d2c7d9] dark:hover:bg-[#3a3045] dark:hover:text-white"
                    >
                        {t('cancelButton')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default OnboardingGate;
