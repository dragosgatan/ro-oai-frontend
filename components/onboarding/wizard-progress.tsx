'use client';

import type { ComponentType } from 'react';
import { Building2, Check, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { WizardStep } from '@/components/onboarding/onboarding-wizard';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
    currentStep: WizardStep;
    isProfileComplete: boolean;
    hasInstitution: boolean;
}

interface Step {
    id: Exclude<WizardStep, 'complete'>;
    label: string;
    icon: ComponentType<{ className?: string }>;
    isComplete: boolean;
}

export function WizardProgress({
    currentStep,
    isProfileComplete,
    hasInstitution,
}: WizardProgressProps) {
    const t = useTranslations('onboarding');
    const steps: Step[] = [
        {
            id: 'profile',
            label: t('steps.profile'),
            icon: User,
            isComplete: isProfileComplete,
        },
        {
            id: 'institution',
            label: t('steps.institution'),
            icon: Building2,
            isComplete: hasInstitution,
        },
    ];
    const currentStepIndex =
        currentStep === 'complete'
            ? steps.length - 1
            : Math.max(
                  0,
                  steps.findIndex((step) => step.id === currentStep),
              );
    const completedSteps = steps.filter((step) => step.isComplete).length;

    return (
        <nav aria-label={t('progressLabel')}>
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                {t('progressAnnouncement', {
                    current: currentStep === 'complete' ? steps.length : currentStepIndex + 1,
                    total: steps.length,
                    completed: completedSteps,
                })}
            </div>
            <ol className="grid border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] sm:grid-cols-2">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = step.id === currentStep;

                    return (
                        <li
                            key={step.id}
                            className={cn(
                                'flex min-h-16 items-center gap-3 border-s-4 p-3 sm:p-4',
                                index > 0 && 'border-t sm:border-s-4 sm:border-t-0',
                                step.isComplete
                                    ? 'border-s-[var(--platform-citron)]'
                                    : isActive
                                      ? 'border-s-[var(--platform-coral)]'
                                      : 'border-s-transparent',
                            )}
                            aria-current={isActive ? 'step' : undefined}
                        >
                            <span
                                className={cn(
                                    'grid h-10 w-10 shrink-0 place-items-center border',
                                    step.isComplete
                                        ? 'border-[var(--platform-citron)] bg-[var(--platform-citron)] text-[var(--platform-on-accent)]'
                                        : isActive
                                          ? 'border-[var(--platform-violet)] bg-[var(--platform-violet)] text-white dark:text-[var(--platform-on-accent)]'
                                          : 'border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink-muted)]',
                                )}
                                role="img"
                                aria-label={
                                    step.isComplete
                                        ? t('stepCompleteLabel', { step: step.label })
                                        : isActive
                                          ? t('stepActiveLabel', { step: step.label })
                                          : t('stepPendingLabel', { step: step.label })
                                }
                            >
                                {step.isComplete ? (
                                    <Check className="h-5 w-5" aria-hidden="true" />
                                ) : (
                                    <Icon className="h-5 w-5" aria-hidden="true" />
                                )}
                            </span>
                            <span className="min-w-0">
                                <span className="block font-mono text-[0.6875rem] font-bold tracking-[0.12em] text-[var(--platform-violet)]">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <span className="mt-1 block text-sm font-bold text-[var(--platform-ink)]">
                                    {step.label}
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
