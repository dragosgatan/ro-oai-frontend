'use client';

import * as React from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { AlertCircle, Check, ChevronDown, ChevronUp, GripVertical, Trophy, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Achievement, UserAchievement } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getRarityStyles } from './achievement-card';

const MAX_SHOWCASE_ITEMS = 5;

const SAVE_SHORTCUT = 's';

function useAchievementTranslation(achievement: Achievement) {
    const t = useTranslations('achievements');
    const name = t.has(`names.${achievement.code}`)
        ? t(`names.${achievement.code}`)
        : achievement.name;
    const description = t.has(`descriptions.${achievement.code}`)
        ? t(`descriptions.${achievement.code}`)
        : achievement.description;
    const rarityText = t.has(`rarities.${achievement.rarity}`)
        ? t(`rarities.${achievement.rarity}`)
        : getRarityStyles(achievement.rarity).badgeText;
    return { name, description, rarityText };
}

export interface ShowcaseEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    earnedAchievements: UserAchievement[];
    currentShowcase: number[];
    onSave: (achievementIds: number[]) => Promise<void>;
    isSaving?: boolean;
}

export function ShowcaseEditor({
    open,
    onOpenChange,
    earnedAchievements,
    currentShowcase,
    onSave,
    isSaving = false,
}: ShowcaseEditorProps) {
    const t = useTranslations('achievements');
    const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const saving = isSaving || isSubmitting;

    React.useEffect(() => {
        if (!open) return;
        setSelectedIds(currentShowcase);
        setError(null);
    }, [open, currentShowcase]);

    const availableAchievements = React.useMemo(
        () => earnedAchievements.filter((item) => !selectedIds.includes(item.achievement.id)),
        [earnedAchievements, selectedIds],
    );

    const hasChanges = React.useMemo(() => {
        if (selectedIds.length !== currentShowcase.length) return true;
        return selectedIds.some((id, index) => id !== currentShowcase[index]);
    }, [selectedIds, currentShowcase]);

    const handleAdd = (achievementId: number) => {
        if (selectedIds.length >= MAX_SHOWCASE_ITEMS) {
            setError(t('maximumReached'));
            return;
        }
        setSelectedIds((previous) => [...previous, achievementId]);
        setError(null);
    };

    const handleRemove = (achievementId: number) => {
        setSelectedIds((previous) => previous.filter((id) => id !== achievementId));
        setError(null);
    };

    const handleMove = (index: number, direction: -1 | 1) => {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= selectedIds.length) return;

        setSelectedIds((previous) => {
            const next = [...previous];
            [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
            return next;
        });
    };

    const handleSave = async () => {
        if (saving || !hasChanges) return;

        try {
            setIsSubmitting(true);
            setError(null);
            await onSave(selectedIds);
            onOpenChange(false);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : t('errorLoading'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDialogKeyDown = (event: React.KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === SAVE_SHORTCUT) {
            event.preventDefault();
            void handleSave();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="platform-overlay-surface flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-none border-2 border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-0 text-[var(--platform-ink)] shadow-[10px_10px_0_color-mix(in_oklch,var(--platform-violet)_28%,transparent)] [&>button]:end-4 [&>button]:top-4 [&>button]:rounded-none [&>button]:focus-visible:ring-[var(--platform-coral)]"
                onKeyDown={handleDialogKeyDown}
                aria-describedby="showcase-editor-description"
            >
                <DialogHeader className="border-b border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-5 py-5 pe-14 text-start sm:px-6">
                    <DialogTitle className="text-xl font-semibold tracking-[-0.03em]">
                        {t('editShowcaseTitle')}
                    </DialogTitle>
                    <DialogDescription
                        id="showcase-editor-description"
                        className="max-w-2xl leading-6 text-[var(--platform-ink-muted)]"
                    >
                        {t('editShowcaseDesc')}
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
                    <section className="space-y-3" aria-labelledby="selected-showcase-title">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 id="selected-showcase-title" className="text-sm font-semibold">
                                {t('selected')} ({selectedIds.length}/{MAX_SHOWCASE_ITEMS})
                            </h3>
                            {selectedIds.length >= MAX_SHOWCASE_ITEMS ? (
                                <span className="text-xs text-[var(--platform-ink-muted)]">
                                    {t('maximumReached')}
                                </span>
                            ) : null}
                        </div>

                        {selectedIds.length === 0 ? (
                            <div
                                className="border border-dashed border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-5 text-center text-sm text-[var(--platform-ink-muted)]"
                                role="status"
                                aria-live="polite"
                            >
                                {t('noAchievementsSelected')}
                            </div>
                        ) : (
                            <Reorder.Group
                                as="ol"
                                axis="y"
                                values={selectedIds}
                                onReorder={setSelectedIds}
                                className="space-y-2"
                                aria-label={t('selected')}
                            >
                                {selectedIds.map((id, index) => {
                                    const userAchievement = earnedAchievements.find(
                                        (item) => item.achievement.id === id,
                                    );
                                    if (!userAchievement) return null;

                                    return (
                                        <SelectedAchievementItem
                                            key={id}
                                            userAchievement={userAchievement}
                                            index={index}
                                            totalItems={selectedIds.length}
                                            onRemove={() => handleRemove(id)}
                                            onMoveUp={() => handleMove(index, -1)}
                                            onMoveDown={() => handleMove(index, 1)}
                                        />
                                    );
                                })}
                            </Reorder.Group>
                        )}
                    </section>

                    <section className="space-y-3" aria-labelledby="available-achievements-title">
                        <h3 id="available-achievements-title" className="text-sm font-semibold">
                            {t('availableAchievements')} ({availableAchievements.length})
                        </h3>
                        <ScrollArea className="h-60 border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)]">
                            {availableAchievements.length === 0 ? (
                                <div
                                    className="grid min-h-56 place-items-center p-5 text-center text-sm text-[var(--platform-ink-muted)]"
                                    role="status"
                                    aria-live="polite"
                                >
                                    {earnedAchievements.length === 0
                                        ? t('noEarnedAchievements')
                                        : t('allInShowcase')}
                                </div>
                            ) : (
                                <ul
                                    className="divide-y divide-[var(--platform-line)] p-2"
                                    aria-labelledby="available-achievements-title"
                                >
                                    {availableAchievements.map((userAchievement) => (
                                        <AvailableAchievementItem
                                            key={userAchievement.achievement.id}
                                            userAchievement={userAchievement}
                                            onAdd={() => handleAdd(userAchievement.achievement.id)}
                                            disabled={selectedIds.length >= MAX_SHOWCASE_ITEMS}
                                        />
                                    ))}
                                </ul>
                            )}
                        </ScrollArea>
                    </section>

                    {error ? (
                        <div
                            className="flex items-start gap-2 border border-[var(--platform-coral)] bg-[color-mix(in_oklch,var(--platform-coral)_12%,var(--platform-paper))] p-3 text-sm text-[var(--platform-ink)]"
                            role="alert"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>{error}</span>
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="flex-col-reverse gap-2 border-t border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-5 py-4 sm:flex-row sm:px-6 sm:space-x-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                        className="min-h-11 rounded-none border-[var(--platform-line-strong)] bg-transparent text-[var(--platform-ink)] shadow-none hover:bg-[var(--platform-paper)]"
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={() => void handleSave()}
                        disabled={saving || !hasChanges}
                        className="min-h-11 rounded-none bg-[var(--platform-citron)] px-5 font-semibold text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)] hover:-translate-y-0.5 hover:bg-[color-mix(in_oklch,var(--platform-citron)_82%,var(--platform-paper))] disabled:shadow-none"
                    >
                        {saving ? t('saving') : t('saveShowcase')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

type SelectedAchievementItemProps = {
    userAchievement: UserAchievement;
    index: number;
    totalItems: number;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
};

function SelectedAchievementItem({
    userAchievement,
    index,
    totalItems,
    onRemove,
    onMoveUp,
    onMoveDown,
}: SelectedAchievementItemProps) {
    const t = useTranslations('achievements');
    const tCommon = useTranslations('common');
    const { achievement } = userAchievement;
    const rarityStyle = getRarityStyles(achievement.rarity);
    const { name, rarityText } = useAchievementTranslation(achievement);
    const dragControls = useDragControls();
    const canMoveUp = index > 0;
    const canMoveDown = index < totalItems - 1;

    return (
        <Reorder.Item
            as="li"
            value={achievement.id}
            dragListener={false}
            dragControls={dragControls}
            className="flex items-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-2"
            aria-label={`${t('selected')}: ${name}, ${rarityText}, ${index + 1}/${totalItems}`}
        >
            <span
                className="grid h-11 w-11 shrink-0 touch-none cursor-grab place-items-center text-[var(--platform-ink-muted)] hover:bg-[var(--platform-paper-strong)] active:cursor-grabbing"
                onPointerDown={(event) => dragControls.start(event)}
                aria-hidden="true"
            >
                <GripVertical className="h-4 w-4" aria-hidden="true" />
            </span>

            <AchievementIcon userAchievement={userAchievement} />

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" dir="auto">
                    {name}
                </p>
                <span
                    className={cn(
                        'mt-1 inline-flex px-1.5 py-0.5 text-[10px] font-medium',
                        rarityStyle.badge,
                    )}
                >
                    {rarityText}
                </span>
            </div>

            <div className="flex shrink-0 items-center">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-none hover:bg-[var(--platform-paper-strong)]"
                    onClick={onMoveUp}
                    disabled={!canMoveUp}
                    aria-label={`${tCommon('previous')}: ${name}`}
                >
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-none hover:bg-[var(--platform-paper-strong)]"
                    onClick={onMoveDown}
                    disabled={!canMoveDown}
                    aria-label={`${tCommon('next')}: ${name}`}
                >
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-none text-[var(--platform-coral)] hover:bg-[color-mix(in_oklch,var(--platform-coral)_12%,var(--platform-paper))]"
                    onClick={onRemove}
                    aria-label={`${tCommon('delete')}: ${name}`}
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </Button>
            </div>
        </Reorder.Item>
    );
}

function AvailableAchievementItem({
    userAchievement,
    onAdd,
    disabled,
}: {
    userAchievement: UserAchievement;
    onAdd: () => void;
    disabled: boolean;
}) {
    const t = useTranslations('achievements');
    const { achievement } = userAchievement;
    const rarityStyle = getRarityStyles(achievement.rarity);
    const { name, description, rarityText } = useAchievementTranslation(achievement);

    return (
        <li>
            <button
                type="button"
                className="group flex min-h-16 w-full items-center gap-3 px-2 py-2 text-start transition-colors hover:bg-[var(--platform-paper)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[var(--platform-coral)] disabled:cursor-not-allowed disabled:opacity-45"
                onClick={onAdd}
                disabled={disabled}
                aria-label={`${t('availableAchievements')}: ${name}, ${rarityText}. ${description}`}
            >
                <AchievementIcon userAchievement={userAchievement} />
                <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold" dir="auto">
                            {name}
                        </span>
                        <span
                            className={cn(
                                'shrink-0 px-1.5 py-0.5 text-[10px] font-medium',
                                rarityStyle.badge,
                            )}
                        >
                            {rarityText}
                        </span>
                    </div>
                    <p
                        className="mt-0.5 truncate text-xs text-[var(--platform-ink-muted)]"
                        dir="auto"
                    >
                        {description}
                    </p>
                </div>
                {!disabled ? (
                    <Check
                        className="h-4 w-4 shrink-0 text-[var(--platform-violet)] opacity-45 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                    />
                ) : null}
            </button>
        </li>
    );
}

function AchievementIcon({ userAchievement }: { userAchievement: UserAchievement }) {
    const { achievement } = userAchievement;

    return (
        <div className="grid h-11 w-11 shrink-0 place-items-center border border-[var(--platform-line)] bg-[var(--platform-paper-strong)]">
            {achievement.iconUrl ? (
                <img
                    src={achievement.iconUrl}
                    alt=""
                    className="h-8 w-8 object-contain"
                    aria-hidden="true"
                />
            ) : (
                <Trophy className="h-5 w-5 text-[var(--platform-violet)]" aria-hidden="true" />
            )}
        </div>
    );
}

export default ShowcaseEditor;
