'use client';

import { motion } from 'framer-motion';
import { Sparkles, Trophy, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { CSSProperties, FocusEvent, KeyboardEvent } from 'react';

import { usePausableDismiss } from '@/hooks/use-pausable-dismiss';
import { isRTLLocale } from '@/lib/i18n-config';
import type { AchievementRarity, Locale, UserAchievement } from '@/lib/types';
import { cn } from '@/lib/utils';

import { useReducedMotion } from './use-reduced-motion';

export interface AchievementNotificationToastProps {
    /** Unique identifier for the notification. */
    id: string;
    /** The user achievement data. */
    userAchievement: UserAchievement;
    /** Called after a manual or automatic dismissal. */
    onDismiss: (id: string) => void;
    /** Auto-dismiss duration in milliseconds. */
    autoDismissDuration?: number;
    /** Z-index for stacking. */
    zIndex?: number;
}

type RarityTone = {
    accent: string;
    badge: string;
    icon: string;
};

const rarityTones: Record<AchievementRarity, RarityTone> = {
    COMMON: {
        accent: 'bg-[var(--platform-line-strong)]',
        badge: 'border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)]',
        icon: 'bg-[var(--platform-paper-strong)] text-[var(--platform-violet)]',
    },
    UNCOMMON: {
        accent: 'bg-emerald-600 dark:bg-emerald-400',
        badge: 'border-emerald-700/50 bg-emerald-100/70 dark:border-emerald-300/50 dark:bg-emerald-950/45',
        icon: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200',
    },
    RARE: {
        accent: 'bg-[var(--platform-violet)]',
        badge: 'border-[var(--platform-violet)] bg-[color-mix(in_oklch,var(--platform-violet)_10%,var(--platform-paper))]',
        icon: 'bg-[var(--platform-violet)] text-[var(--platform-on-accent)]',
    },
    EPIC: {
        accent: 'bg-[var(--platform-coral)]',
        badge: 'border-[var(--platform-coral)] bg-[color-mix(in_oklch,var(--platform-coral)_13%,var(--platform-paper))]',
        icon: 'bg-[var(--platform-coral)] text-[var(--platform-on-accent)]',
    },
    LEGENDARY: {
        accent: 'bg-[var(--platform-citron)]',
        badge: 'border-[var(--platform-violet)] bg-[var(--platform-citron)] text-[var(--platform-on-accent)]',
        icon: 'bg-[var(--platform-citron)] text-[var(--platform-on-accent)]',
    },
};

const fallbackRarityNames: Record<AchievementRarity, string> = {
    COMMON: 'Common',
    UNCOMMON: 'Uncommon',
    RARE: 'Rare',
    EPIC: 'Epic',
    LEGENDARY: 'Legendary',
};

/**
 * Compact, non-blocking achievement announcement.
 *
 * The notification keeps one clear celebration cue, preserves rarity through
 * color and text, and pauses its timer while the user is reading or interacting.
 */
export function AchievementNotificationToast({
    id,
    userAchievement,
    onDismiss,
    autoDismissDuration = 5000,
    zIndex = 50,
}: AchievementNotificationToastProps) {
    const t = useTranslations('achievements');
    const locale = useLocale() as Locale;
    const prefersReducedMotion = useReducedMotion();
    const { achievement } = userAchievement;
    const tone = rarityTones[achievement.rarity];

    const achievementName = t.has(`names.${achievement.code}`)
        ? t(`names.${achievement.code}`)
        : achievement.name;
    const achievementDescription = t.has(`descriptions.${achievement.code}`)
        ? t(`descriptions.${achievement.code}`)
        : achievement.description;
    const rarityText = t.has(`rarities.${achievement.rarity}`)
        ? t(`rarities.${achievement.rarity}`)
        : fallbackRarityNames[achievement.rarity];

    const { dismiss, isExiting, pause, resume } = usePausableDismiss({
        duration: autoDismissDuration,
        exitDuration: prefersReducedMotion ? 0 : 180,
        onDismiss: () => onDismiss(id),
    });

    const titleId = `achievement-title-${id}`;
    const descriptionId = `achievement-description-${id}`;
    const isRtl = isRTLLocale(locale);

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
            initial={prefersReducedMotion ? false : { opacity: 0, x: isRtl ? -24 : 24, y: 8 }}
            animate={
                isExiting
                    ? { opacity: 0, x: isRtl ? -16 : 16, scale: 0.98 }
                    : { opacity: 1, x: 0, y: 0, scale: 1 }
            }
            transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
                'platform-overlay-surface relative w-full overflow-hidden rounded-sm border border-[var(--platform-line-strong)]',
                'bg-[var(--platform-paper)] text-[var(--platform-ink)] shadow-[4px_4px_0_var(--platform-violet)]',
                'focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--platform-coral)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--platform-paper)]',
            )}
            style={{ zIndex } as CSSProperties}
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

            <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_2.75rem] gap-x-3 p-4">
                <div
                    className={cn(
                        'row-span-2 grid h-12 w-12 place-items-center border border-[var(--platform-line-strong)] text-xl',
                        tone.icon,
                    )}
                    aria-hidden="true"
                >
                    {achievement.iconUrl ? (
                        // Achievement icons are configured by the platform API and can be remote.
                        <img
                            src={achievement.iconUrl}
                            alt=""
                            className="h-full w-full object-contain p-1.5"
                        />
                    ) : (
                        <Trophy className="h-5 w-5" />
                    )}
                </div>

                <div className="min-w-0 self-center">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--platform-ink-muted-strong)]">
                            {t('notification.title')}
                        </p>
                        <span
                            className={cn(
                                'inline-flex min-h-6 items-center border px-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.08em]',
                                tone.badge,
                            )}
                        >
                            {rarityText}
                        </span>
                    </div>
                    <h2
                        id={titleId}
                        className="mt-1 truncate text-base font-black tracking-[-0.025em]"
                        dir="auto"
                    >
                        {achievementName}
                    </h2>
                </div>

                <button
                    type="button"
                    onClick={dismiss}
                    className="row-span-2 grid h-11 w-11 place-items-center self-start border border-transparent text-[var(--platform-ink-muted)] transition-colors duration-150 hover:border-[var(--platform-line-strong)] hover:bg-[var(--platform-paper-strong)] hover:text-[var(--platform-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--platform-violet)]"
                    aria-label={t('notification.dismiss')}
                >
                    <X className="h-5 w-5" aria-hidden="true" />
                </button>

                <div className="col-start-2 mt-2 min-w-0">
                    <p
                        id={descriptionId}
                        className="line-clamp-2 text-sm leading-5 text-[var(--platform-ink-muted)]"
                        dir="auto"
                    >
                        {achievementDescription}
                    </p>
                    {achievement.xpReward > 0 ? (
                        <p className="mt-2 inline-flex min-h-7 items-center gap-1.5 bg-[var(--platform-citron)] px-2 font-mono text-xs font-black text-[var(--platform-on-accent)]">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            <span dir="ltr">+{achievement.xpReward} XP</span>
                        </p>
                    ) : null}
                </div>
            </div>
        </motion.article>
    );
}

/** Returns whether a rarity qualifies for an emphasized celebration treatment. */
export function shouldShowEnhancedCelebration(rarity: AchievementRarity): boolean {
    return rarity === 'RARE' || rarity === 'EPIC' || rarity === 'LEGENDARY';
}
