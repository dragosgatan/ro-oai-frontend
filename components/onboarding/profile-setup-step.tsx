'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, UserIcon, ArrowRight, Edit2 } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { fadeRightVariants, prefersReducedMotion } from '@/lib/animations';
import type { OnboardingProfileUpdate } from '@/lib/onboarding-profile';
import { InlineProfileEditor } from './inline-profile-editor';

interface ProfileSetupStepProps {
    userProfile: UserProfile;
    isComplete: boolean;
    onNavigateToProfile: () => void;
    onSkip?: () => void;
    onProfileUpdate?: (updates: OnboardingProfileUpdate) => Promise<void>;
}

interface ProfileField {
    key: keyof UserProfile;
    label: string;
    isComplete: boolean;
}

export function ProfileSetupStep({
    userProfile,
    isComplete,
    onNavigateToProfile,
    onSkip,
    onProfileUpdate,
}: ProfileSetupStepProps) {
    const t = useTranslations('onboarding.profileSetup');
    const tCommon = useTranslations('common');
    const tSettings = useTranslations('settings');
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);

    // Define which fields are required for profile completion
    const profileFields: ProfileField[] = [
        {
            key: 'username',
            label: t('fields.username'),
            isComplete: !!userProfile.username,
        },
        {
            key: 'firstName',
            label: t('fields.firstName'),
            isComplete: !!userProfile.firstName,
        },
        {
            key: 'lastName',
            label: t('fields.lastName'),
            isComplete: !!userProfile.lastName,
        },
        {
            key: 'bio',
            label: t('fields.bio'),
            isComplete: !!userProfile.bio,
        },
        {
            key: 'location',
            label: t('fields.location'),
            isComplete: !!userProfile.location,
        },
        ...(!userProfile.institution
            ? [
                  {
                      key: 'country' as keyof UserProfile,
                      label: tSettings('country'),
                      isComplete: Boolean(userProfile.country),
                  },
              ]
            : []),
    ];

    const incompleteFields = profileFields.filter((field) => !field.isComplete);
    const completedCount = profileFields.length - incompleteFields.length;

    const handleNavigate = () => {
        onNavigateToProfile();
        router.push('/settings');
    };

    const handleSaveProfile = async (updates: OnboardingProfileUpdate) => {
        if (onProfileUpdate) {
            await onProfileUpdate(updates);
            setIsEditing(false);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const shouldReduceMotion = prefersReducedMotion();

    return (
        <motion.div
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            exit={shouldReduceMotion ? undefined : 'exit'}
            variants={fadeRightVariants}
        >
            <Card
                className="rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] shadow-none"
                role="article"
                aria-labelledby="profile-setup-title"
            >
                <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-4">
                        <div
                            className={cn(
                                'flex h-11 w-11 shrink-0 items-center justify-center',
                                isComplete
                                    ? 'bg-[var(--platform-citron)] text-[var(--platform-on-accent)]'
                                    : 'bg-[var(--platform-paper-strong)] text-[var(--platform-violet)]',
                            )}
                            role="img"
                            aria-label={isComplete ? t('iconCompleteLabel') : t('iconPendingLabel')}
                        >
                            <UserIcon className="h-5 w-5" aria-hidden="true" />
                        </div>

                        <div className="flex-1 space-y-3">
                            <div>
                                <h3
                                    id="profile-setup-title"
                                    className="text-lg font-semibold flex items-center gap-2"
                                >
                                    {t('title')}
                                    {isComplete && (
                                        <CheckCircle2
                                            className="h-5 w-5 text-green-600 dark:text-green-400"
                                            aria-label={t('completedBadgeLabel')}
                                        />
                                    )}
                                </h3>
                                <p className="mt-1 text-sm leading-6 text-[var(--platform-ink-muted)]">
                                    {isComplete ? t('descriptionComplete') : t('description')}
                                </p>
                            </div>

                            {isEditing && onProfileUpdate ? (
                                <div className="mt-4">
                                    <InlineProfileEditor
                                        userProfile={userProfile}
                                        onSave={handleSaveProfile}
                                        onCancel={handleCancelEdit}
                                    />
                                </div>
                            ) : (
                                <>
                                    {!isComplete && (
                                        <div className="space-y-2">
                                            <p
                                                className="text-sm font-medium text-[var(--platform-ink-muted)]"
                                                role="status"
                                                aria-live="polite"
                                            >
                                                {t('incompleteFields', {
                                                    completed: completedCount,
                                                    total: profileFields.length,
                                                })}
                                            </p>
                                            <ul
                                                className="space-y-1.5"
                                                role="list"
                                                aria-label={t('fieldChecklistLabel')}
                                            >
                                                {profileFields.map((field) => (
                                                    <li
                                                        key={field.key}
                                                        className="flex items-center gap-2 text-sm"
                                                        role="listitem"
                                                    >
                                                        {field.isComplete ? (
                                                            <CheckCircle2
                                                                className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0"
                                                                aria-label={t('fieldCompleteIcon')}
                                                            />
                                                        ) : (
                                                            <Circle
                                                                className="h-4 w-4 text-muted-foreground shrink-0"
                                                                aria-label={t(
                                                                    'fieldIncompleteIcon',
                                                                )}
                                                            />
                                                        )}
                                                        <span
                                                            className={cn(
                                                                field.isComplete
                                                                    ? 'text-[var(--platform-ink-muted)] line-through'
                                                                    : 'text-[var(--platform-ink)]',
                                                            )}
                                                        >
                                                            {field.label}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex flex-col sm:flex-row gap-2">
                                        {onProfileUpdate && (
                                            <Button
                                                onClick={handleEditClick}
                                                variant="default"
                                                className="min-h-11 w-full rounded-none bg-[var(--platform-violet)] text-white shadow-none hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)] sm:w-auto"
                                            >
                                                <Edit2
                                                    className="mr-2 h-4 w-4"
                                                    aria-hidden="true"
                                                />
                                                {tCommon('edit')}
                                            </Button>
                                        )}
                                        {!isComplete && (
                                            <>
                                                {!onProfileUpdate && (
                                                    <Button
                                                        onClick={handleNavigate}
                                                        variant="default"
                                                        className="min-h-11 w-full rounded-none bg-[var(--platform-violet)] text-white shadow-none hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)] sm:w-auto"
                                                        aria-label={t('completeProfileAriaLabel')}
                                                    >
                                                        {t('completeProfile')}
                                                        <ArrowRight
                                                            className="ml-2 h-4 w-4"
                                                            aria-hidden="true"
                                                        />
                                                    </Button>
                                                )}
                                                {onSkip && (
                                                    <Button
                                                        onClick={onSkip}
                                                        variant="ghost"
                                                        className="min-h-11 w-full rounded-none border border-transparent text-[var(--platform-ink-muted)] shadow-none hover:border-[var(--platform-line-strong)] hover:bg-[var(--platform-paper-strong)] sm:w-auto"
                                                        aria-label={t('skipAriaLabel', {
                                                            default:
                                                                'Skip profile setup and continue to institution selection',
                                                        })}
                                                    >
                                                        {t('skip', { default: 'Skip for now' })}
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
