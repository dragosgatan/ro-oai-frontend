'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { WizardBanner } from './wizard-banner';
import { WizardProgress } from './wizard-progress';
import { ProfileSetupStep } from './profile-setup-step';
import { InstitutionSelectionStep } from './institution-selection-step';
import { UserProfile, MembershipRequest } from '@/lib/types';
import { getMyMembershipRequests, updateOnboardingDismissed, updateUserProfile } from '@/lib/api';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';
import {
    isOnboardingProfileComplete,
    type OnboardingProfileUpdate,
} from '@/lib/onboarding-profile';
import { Button } from '@/components/ui/button';

export type WizardStep = 'profile' | 'institution' | 'complete';

// Step configuration for tracking
const WIZARD_STEPS = {
    profile: { number: 1, name: 'Profile Setup' },
    institution: { number: 2, name: 'Institution Selection' },
    complete: { number: 3, name: 'Complete' },
} as const;

const TOTAL_STEPS = 2; // Profile and Institution (complete is not a real step)

interface OnboardingWizardProps {
    userId: string;
    userProfile: UserProfile;
    onDismiss: () => void;
    onProfileRefresh?: () => Promise<void>;
}

interface OnboardingWizardState {
    isVisible: boolean;
    currentStep: WizardStep;
    isProfileComplete: boolean;
    hasInstitution: boolean;
    pendingRequest: MembershipRequest | null;
    isLoadingRequests: boolean;
    membershipError: string | null;
    isDismissing: boolean;
    dismissError: string | null;
}

export function OnboardingWizard({
    userId,
    userProfile,
    onDismiss,
    onProfileRefresh,
}: OnboardingWizardProps) {
    // GTM tracking hook
    const { trackOnboarding } = useGTMTracker();
    const t = useTranslations('onboarding');
    const tCommon = useTranslations('common');
    const tInstitutions = useTranslations('institutions');
    const tSettings = useTranslations('settings');

    // Track if we've already fired the start event
    const hasTrackedStartRef = useRef(false);
    // Track which steps have been tracked as complete to avoid duplicate events
    const trackedStepsRef = useRef<Set<string>>(new Set());

    // Initialize state with current profile data
    const initialProfileComplete = isOnboardingProfileComplete(userProfile);
    const initialHasInstitution = !!userProfile.institution;
    const initialStep: WizardStep =
        initialProfileComplete && initialHasInstitution
            ? 'complete'
            : initialProfileComplete
              ? 'institution'
              : 'profile';

    const [state, setState] = useState<OnboardingWizardState>({
        isVisible: true,
        currentStep: initialStep,
        isProfileComplete: initialProfileComplete,
        hasInstitution: initialHasInstitution,
        pendingRequest: null,
        isLoadingRequests: false,
        membershipError: null,
        isDismissing: false,
        dismissError: null,
    });

    const hasFetchedRequestsRef = useRef(false);

    // Track onboarding_start when wizard first becomes visible
    useEffect(() => {
        if (state.isVisible && !hasTrackedStartRef.current) {
            hasTrackedStartRef.current = true;
            trackOnboarding('start', {
                totalSteps: TOTAL_STEPS,
                initialStep: state.currentStep,
                stepNumber: WIZARD_STEPS[state.currentStep].number,
                stepName: WIZARD_STEPS[state.currentStep].name,
            });
        }
    }, [state.isVisible, state.currentStep, trackOnboarding]);

    // Track step completions
    useEffect(() => {
        // Track profile step completion
        if (state.isProfileComplete && !trackedStepsRef.current.has('profile')) {
            trackedStepsRef.current.add('profile');
            trackOnboarding('step_complete', {
                stepNumber: WIZARD_STEPS.profile.number,
                stepName: WIZARD_STEPS.profile.name,
                totalSteps: TOTAL_STEPS,
            });
        }

        // Track institution step completion
        if (state.hasInstitution && !trackedStepsRef.current.has('institution')) {
            trackedStepsRef.current.add('institution');
            trackOnboarding('step_complete', {
                stepNumber: WIZARD_STEPS.institution.number,
                stepName: WIZARD_STEPS.institution.name,
                totalSteps: TOTAL_STEPS,
            });
        }

        // Track onboarding complete when both steps are done
        if (state.currentStep === 'complete' && !trackedStepsRef.current.has('complete')) {
            trackedStepsRef.current.add('complete');
            trackOnboarding('complete', {
                totalSteps: TOTAL_STEPS,
            });
        }
    }, [state.isProfileComplete, state.hasInstitution, state.currentStep, trackOnboarding]);

    // Check profile completion status whenever userProfile changes
    useEffect(() => {
        const isComplete = isOnboardingProfileComplete(userProfile);
        const hasInst = !!userProfile.institution;

        // If onboarding was previously dismissed and both steps are complete, auto-dismiss
        if (userProfile.onboardingDismissed && isComplete && hasInst) {
            setState((prev) => ({ ...prev, isVisible: false }));
            onDismiss();
            return;
        }

        setState((prev) => {
            // Determine the appropriate step based on completion status
            let nextStep: WizardStep = prev.currentStep;

            // If both are complete, go to complete step
            if (isComplete && hasInst) {
                nextStep = 'complete';
            }
            // If profile is complete but no institution, advance to institution step
            else if (isComplete && !hasInst) {
                // Only auto-advance if we're on profile step AND institution status changed from having to not having
                // Don't auto-advance if user is already on institution step (e.g., searching for institutions)
                if (prev.currentStep === 'profile') {
                    nextStep = 'institution';
                } else if (prev.currentStep === 'institution') {
                    // Stay on institution step - don't reset
                    nextStep = 'institution';
                }
            }
            // If profile becomes incomplete, only go back to profile step if we're not already there
            else if (!isComplete && prev.currentStep === 'complete') {
                // Only reset to profile if we were on complete step
                nextStep = 'profile';
            }

            // Reset membership requests fetch flag when institution status changes
            if (prev.hasInstitution !== hasInst) {
                hasFetchedRequestsRef.current = false;
            }

            return {
                ...prev,
                isProfileComplete: isComplete,
                hasInstitution: hasInst,
                currentStep: nextStep,
            };
        });
    }, [userProfile, onDismiss]);

    // Function to load membership requests
    const loadMembershipRequests = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            isLoadingRequests: true,
            membershipError: null,
        }));

        for (let attempt = 0; attempt <= 2; attempt += 1) {
            try {
                const requests = await getMyMembershipRequests();
                const pending = requests.find((req) => req.status === 'PENDING') || null;
                setState((prev) => ({
                    ...prev,
                    pendingRequest: pending,
                    isLoadingRequests: false,
                    membershipError: null,
                }));
                return;
            } catch {
                if (attempt < 2) {
                    await new Promise((resolve) => window.setTimeout(resolve, 1000 * 2 ** attempt));
                    continue;
                }

                setState((prev) => ({
                    ...prev,
                    pendingRequest: null,
                    isLoadingRequests: false,
                    membershipError: tInstitutions('loadError'),
                }));
            }
        }
    }, [tInstitutions]);

    // Fetch pending membership requests when on institution step
    useEffect(() => {
        if (
            state.currentStep === 'institution' &&
            !state.hasInstitution &&
            !hasFetchedRequestsRef.current
        ) {
            hasFetchedRequestsRef.current = true;
            void loadMembershipRequests();
        }
    }, [loadMembershipRequests, state.currentStep, state.hasInstitution]);

    const retryMembershipRequests = () => {
        hasFetchedRequestsRef.current = true;
        void loadMembershipRequests();
    };

    const handleSkipProfile = () => {
        // Allow user to skip profile setup and go to institution selection
        setState((prev) => ({
            ...prev,
            currentStep: 'institution',
        }));
    };

    const handleProfileUpdate = async (updates: OnboardingProfileUpdate) => {
        await updateUserProfile(updates);
        toast.success(tCommon('success'));

        // Refresh profile data if callback provided
        if (onProfileRefresh) {
            await onProfileRefresh();
        }
    };

    const handleDismiss = async () => {
        if (state.isDismissing) return;

        // Track onboarding_abandon if dismissed before completion
        if (state.currentStep !== 'complete' && !state.dismissError) {
            const lastCompletedStep = state.hasInstitution
                ? WIZARD_STEPS.institution.number
                : state.isProfileComplete
                  ? WIZARD_STEPS.profile.number
                  : 0;

            trackOnboarding('abandon', {
                lastCompletedStep,
                currentStep: state.currentStep,
                stepNumber: WIZARD_STEPS[state.currentStep].number,
                stepName: WIZARD_STEPS[state.currentStep].name,
                totalSteps: TOTAL_STEPS,
            });
        }

        setState((prev) => ({ ...prev, isDismissing: true, dismissError: null }));

        // Attempt to update dismissal status with retry logic
        let retryCount = 0;
        const maxRetries = 2;

        const attemptDismiss = async (): Promise<boolean> => {
            try {
                await updateOnboardingDismissed(userId, true);
                return true;
            } catch {
                if (retryCount < maxRetries) {
                    retryCount++;
                    // Exponential backoff: wait 1s, then 2s
                    await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
                    return attemptDismiss();
                }

                return false;
            }
        };

        const success = await attemptDismiss();

        if (success) {
            setState((prev) => ({ ...prev, isVisible: false, isDismissing: false }));
            onDismiss();
        } else {
            setState((prev) => ({
                ...prev,
                isVisible: true,
                isDismissing: false,
                dismissError: tSettings('errorSavingSettings'),
            }));
        }
    };

    if (!state.isVisible) return null;

    return (
        <WizardBanner onClose={handleDismiss} busy={state.isDismissing}>
            <div className="flex flex-col gap-6">
                {state.dismissError ? (
                    <div
                        className="flex flex-col gap-4 border-s-4 border-[var(--platform-coral)] bg-[var(--platform-paper-strong)] p-4 sm:flex-row sm:items-center sm:justify-between"
                        role="alert"
                    >
                        <span className="flex items-start gap-3 text-sm font-medium leading-6 text-[var(--platform-ink)]">
                            <AlertCircle
                                className="mt-0.5 h-5 w-5 shrink-0 text-[var(--platform-coral)]"
                                aria-hidden="true"
                            />
                            {state.dismissError}
                        </span>
                        <Button
                            type="button"
                            onClick={handleDismiss}
                            className="min-h-11 shrink-0 rounded-none bg-[var(--platform-violet)] px-5 text-white shadow-none hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]"
                        >
                            {tCommon('retry')}
                        </Button>
                    </div>
                ) : null}

                <WizardProgress
                    currentStep={state.currentStep}
                    isProfileComplete={state.isProfileComplete}
                    hasInstitution={state.hasInstitution}
                />

                <div className="space-y-4">
                    <ProfileSetupStep
                        userProfile={userProfile}
                        isComplete={state.isProfileComplete}
                        onNavigateToProfile={() => {}}
                        onSkip={state.currentStep === 'profile' ? handleSkipProfile : undefined}
                        onProfileUpdate={handleProfileUpdate}
                    />

                    {(state.currentStep === 'institution' ||
                        state.currentStep === 'complete' ||
                        state.hasInstitution) && (
                        <InstitutionSelectionStep
                            currentInstitution={userProfile.institution || null}
                            pendingRequest={state.pendingRequest}
                            isLoading={state.isLoadingRequests}
                            error={state.membershipError}
                            onRetry={retryMembershipRequests}
                            onNavigateToInstitutions={() => {}}
                            onInstitutionSelected={(approved) => {
                                if (approved && onProfileRefresh) {
                                    void onProfileRefresh();
                                }
                                hasFetchedRequestsRef.current = true;
                                void loadMembershipRequests();
                            }}
                        />
                    )}

                    {state.currentStep === 'complete' && (
                        <div
                            className="flex flex-col gap-4 border border-[var(--platform-line-strong)] bg-[var(--platform-citron)] p-5 text-[var(--platform-on-accent)] sm:flex-row sm:items-center sm:justify-between"
                            role="status"
                            aria-live="polite"
                        >
                            <div>
                                <p className="font-bold">{t('welcome')}</p>
                                <p className="mt-1 text-sm leading-6 opacity-80">{t('subtitle')}</p>
                            </div>
                            <Button
                                type="button"
                                onClick={handleDismiss}
                                disabled={state.isDismissing}
                                className="min-h-11 shrink-0 rounded-none bg-[var(--platform-violet-strong)] px-5 text-white shadow-none hover:bg-[var(--platform-violet)] dark:text-[var(--platform-on-accent)]"
                            >
                                {state.isDismissing ? tCommon('saving') : tCommon('continue')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </WizardBanner>
    );
}
