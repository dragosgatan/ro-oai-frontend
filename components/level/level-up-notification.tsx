'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ArrowUp, Crown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, type FocusEvent, type KeyboardEvent } from 'react';

import { useReducedMotion } from '@/components/achievements/use-reduced-motion';
import { usePausableDismiss } from '@/hooks/use-pausable-dismiss';
import { getTierForLevel } from '@/lib/level/tier-config';
import type { LevelTier, LevelUpNotification as LevelUpNotificationType } from '@/lib/level/types';
import { cn } from '@/lib/utils';

export interface LevelUpNotificationProps {
    /** The level-up notification data. */
    notification: LevelUpNotificationType;
    /** Called after a manual or automatic dismissal. */
    onDismiss: () => void;
    /** Auto-dismiss duration in milliseconds. */
    autoDismissDuration?: number;
}

type TierTone = {
    accent: string;
    nextLevel: string;
};

const tierTones: Record<LevelTier, TierTone> = {
    NOVICE: {
        accent: 'bg-[var(--platform-coral)]',
        nextLevel: 'bg-[var(--platform-paper-strong)] text-[var(--platform-ink)]',
    },
    APPRENTICE: {
        accent: 'bg-[var(--platform-line-strong)]',
        nextLevel: 'bg-[var(--platform-paper-strong)] text-[var(--platform-ink)]',
    },
    EXPERT: {
        accent: 'bg-[var(--platform-citron)]',
        nextLevel: 'bg-[var(--platform-citron)] text-[var(--platform-on-accent)]',
    },
    MASTER: {
        accent: 'bg-[var(--platform-violet)]',
        nextLevel: 'bg-[var(--platform-violet)] text-[var(--platform-on-accent)]',
    },
    LEGEND: {
        accent: 'bg-[var(--platform-coral)]',
        nextLevel: 'bg-[var(--platform-coral)] text-[var(--platform-on-accent)]',
    },
};

/**
 * Announces level progression without interrupting the current task.
 * The compact comparison remains legible at mobile widths and all animation is
 * state-driven, short, and removed when reduced motion is requested.
 */
export function LevelUpNotification({
    notification,
    onDismiss,
    autoDismissDuration = 6000,
}: LevelUpNotificationProps) {
    const t = useTranslations('level');
    const prefersReducedMotion = useReducedMotion();
    const { previousLevel, newLevel, tierChanged, newTier } = notification;
    const previousTier = getTierForLevel(previousLevel);
    const currentTier = newTier ?? getTierForLevel(newLevel);
    const currentTierName = t(`tiers.${currentTier}`);
    const previousTierName = t(`tiers.${previousTier}`);
    const levelDifference = newLevel - previousLevel;
    const tone = tierTones[currentTier];
    const instanceId = useId();
    const titleId = `level-up-title-${instanceId}`;
    const descriptionId = `level-up-description-${instanceId}`;

    const { dismiss, isExiting, pause, resume } = usePausableDismiss({
        duration: autoDismissDuration,
        exitDuration: prefersReducedMotion ? 0 : 180,
        onDismiss,
    });

    const handleBlur = (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            resume('focus');
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            dismiss();
        }
    };

    return (
        <motion.article
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
            animate={
                isExiting ? { opacity: 0, y: 12, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }
            }
            transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                'platform-overlay-surface relative w-full overflow-hidden rounded-sm border border-[var(--platform-line-strong)]',
                'bg-[var(--platform-paper)] text-[var(--platform-ink)] shadow-[4px_4px_0_var(--platform-citron)]',
                'focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--platform-coral)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--platform-paper)]',
            )}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            onMouseEnter={() => pause('hover')}
            onMouseLeave={() => resume('hover')}
            onFocusCapture={() => pause('focus')}
            onBlurCapture={handleBlur}
            onKeyDown={handleKeyDown}
        >
            <div className={cn('h-1 w-full', tone.accent)} aria-hidden="true" />

            <header className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-start gap-3 border-b border-[var(--platform-line)] p-4">
                <span className="grid h-11 w-11 place-items-center bg-[var(--platform-violet)] text-[var(--platform-on-accent)]">
                    <ArrowUp className="h-5 w-5" aria-hidden="true" />
                </span>

                <div className="min-w-0">
                    <h2 id={titleId} className="text-base font-black tracking-[-0.025em]">
                        {t('notification.title')}
                    </h2>
                    <p
                        id={descriptionId}
                        className="mt-1 text-sm leading-5 text-[var(--platform-ink-muted)]"
                    >
                        {t('notification.levelAdvanced', {
                            from: previousLevel,
                            to: newLevel,
                        })}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={dismiss}
                    className="grid h-11 w-11 place-items-center border border-transparent text-[var(--platform-ink-muted)] transition-colors duration-150 hover:border-[var(--platform-line-strong)] hover:bg-[var(--platform-paper-strong)] hover:text-[var(--platform-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--platform-violet)]"
                    aria-label={t('notification.dismiss')}
                >
                    <X className="h-5 w-5" aria-hidden="true" />
                </button>
            </header>

            <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] items-stretch">
                <LevelCell label={t('from')} level={previousLevel} tierName={previousTierName} />

                <div className="grid min-h-28 place-items-center border-x border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-2 text-center">
                    <div>
                        <span
                            className="block font-mono text-sm font-black text-[var(--platform-violet)]"
                            dir="ltr"
                        >
                            +{levelDifference}
                        </span>
                        <ArrowRight
                            className="mx-auto mt-2 h-5 w-5 text-[var(--platform-ink-muted)] rtl:rotate-180"
                            aria-hidden="true"
                        />
                    </div>
                </div>

                <LevelCell
                    label={t('to')}
                    level={newLevel}
                    tierName={currentTierName}
                    className={tone.nextLevel}
                />
            </div>

            {tierChanged && newTier ? (
                <div className="flex min-h-11 items-center gap-2 border-t border-[var(--platform-line-strong)] bg-[var(--platform-citron)] px-4 py-2 text-sm font-bold text-[var(--platform-on-accent)]">
                    <Crown className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t('newTierUnlocked', { tier: currentTierName })}</span>
                </div>
            ) : null}
        </motion.article>
    );
}

function LevelCell({
    label,
    level,
    tierName,
    className,
}: {
    label: string;
    level: number;
    tierName: string;
    className?: string;
}) {
    return (
        <div className={cn('grid min-h-28 content-center px-3 py-4 text-center', className)}>
            <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] opacity-70">
                {label}
            </span>
            <strong className="mt-1 font-mono text-3xl font-black leading-none" dir="ltr">
                {level}
            </strong>
            <span className="mt-2 truncate text-xs font-semibold">{tierName}</span>
        </div>
    );
}

export default LevelUpNotification;
