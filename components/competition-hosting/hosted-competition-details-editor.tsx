'use client';

import { useState } from 'react';
import { AlertCircle, Check, Loader2, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from '@/i18n/routing';
import {
    CompetitionHostingApiError,
    saveHostedCompetition,
    type HostedCompetition,
    type HostedCompetitionInput,
} from '@/lib/competition-hosting';

function fieldsFromCompetition(competition: HostedCompetition): HostedCompetitionInput {
    return {
        name: competition.name,
        shortDescription: competition.shortDescription,
        description: competition.description,
        rules: competition.rules,
        startTime: competition.startTime,
        endTime: competition.endTime,
        competitionType: competition.competitionType,
        access: competition.access,
        allowPublicQuestions: competition.allowPublicQuestions,
        commentsEnabled: competition.commentsEnabled,
        selectionLimit: competition.selectionLimit,
        version: competition.version,
    };
}

function dateInputValue(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function dateFromInput(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

export function HostedCompetitionDetailsEditor({
    initialCompetition,
}: {
    initialCompetition: HostedCompetition;
}) {
    const t = useTranslations('competitionHosting');
    const router = useRouter();
    const [competition, setCompetition] = useState(initialCompetition);
    const [fields, setFields] = useState(() => fieldsFromCompetition(initialCompetition));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const update = <K extends keyof HostedCompetitionInput>(
        key: K,
        value: HostedCompetitionInput[K],
    ) => {
        setFields((current) => ({ ...current, [key]: value }));
        setError(null);
    };

    const save = async () => {
        setBusy(true);
        setError(null);
        try {
            const updated = await saveHostedCompetition(competition.id, {
                ...fields,
                version: competition.version,
            });
            setCompetition(updated);
            setFields(fieldsFromCompetition(updated));
            toast.success(t('toasts.competitionSaved'));
            router.refresh();
        } catch (caught) {
            if (caught instanceof CompetitionHostingApiError && caught.status === 409) {
                setError(t('errors.conflict'));
            } else {
                setError(caught instanceof Error ? caught.message : t('errors.save'));
            }
        } finally {
            setBusy(false);
        }
    };

    const contentLocked = !competition.permissions.canEditContent;
    const scheduleLocked = !competition.permissions.canEditSchedule;
    const fullyLocked = contentLocked && scheduleLocked;

    return (
        <div className="space-y-8">
            <div className="border-b border-[var(--platform-line-strong)] pb-4">
                <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">01</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]">
                    {t('organizer.details.title')}
                </h2>
                <p className="mt-2 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                    {t('organizer.details.description')}
                </p>
            </div>

            {error ? (
                <p
                    role="alert"
                    className="flex items-start gap-2 border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
                >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {error}
                </p>
            ) : null}

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="managed-name" className="text-sm font-bold">
                            {t('fields.name')}
                        </label>
                        <Input
                            id="managed-name"
                            value={fields.name}
                            maxLength={255}
                            disabled={contentLocked}
                            onChange={(event) => update('name', event.target.value)}
                            className="mt-2 min-h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] focus-visible:scale-100"
                        />
                    </div>
                    <div>
                        <label htmlFor="managed-summary" className="text-sm font-bold">
                            {t('fields.shortDescription')}
                        </label>
                        <Textarea
                            id="managed-summary"
                            value={fields.shortDescription}
                            maxLength={2000}
                            disabled={contentLocked}
                            onChange={(event) => update('shortDescription', event.target.value)}
                            className="mt-2 min-h-28 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
                        />
                    </div>
                    <div>
                        <label htmlFor="managed-description" className="text-sm font-bold">
                            {t('fields.description')}
                        </label>
                        <Textarea
                            id="managed-description"
                            value={fields.description}
                            maxLength={100000}
                            disabled={contentLocked}
                            onChange={(event) => update('description', event.target.value)}
                            className="mt-2 min-h-48 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
                        />
                    </div>
                    <div>
                        <label htmlFor="managed-rules" className="text-sm font-bold">
                            {t('fields.rules')}
                        </label>
                        <Textarea
                            id="managed-rules"
                            value={fields.rules}
                            maxLength={100000}
                            disabled={contentLocked}
                            onChange={(event) => update('rules', event.target.value)}
                            className="mt-2 min-h-36 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
                        />
                    </div>
                    <div className="grid gap-5 border-t border-[var(--platform-line)] pt-6 sm:grid-cols-2">
                        <div>
                            <label htmlFor="managed-start" className="text-sm font-bold">
                                {t('fields.startTime')}
                            </label>
                            <Input
                                id="managed-start"
                                type="datetime-local"
                                value={dateInputValue(fields.startTime)}
                                disabled={scheduleLocked}
                                onChange={(event) =>
                                    update('startTime', dateFromInput(event.target.value))
                                }
                                className="mt-2 min-h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] focus-visible:scale-100"
                            />
                        </div>
                        <div>
                            <label htmlFor="managed-end" className="text-sm font-bold">
                                {t('fields.endTime')}
                            </label>
                            <Input
                                id="managed-end"
                                type="datetime-local"
                                value={dateInputValue(fields.endTime)}
                                disabled={scheduleLocked}
                                onChange={(event) =>
                                    update('endTime', dateFromInput(event.target.value))
                                }
                                className="mt-2 min-h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] focus-visible:scale-100"
                            />
                        </div>
                        <div>
                            <label htmlFor="managed-type" className="text-sm font-bold">
                                {t('fields.competitionType')}
                            </label>
                            <select
                                id="managed-type"
                                value={fields.competitionType}
                                disabled={contentLocked}
                                onChange={(event) =>
                                    update(
                                        'competitionType',
                                        event.target.value as 'CLASSIC' | 'CASUAL',
                                    )
                                }
                                className="mt-2 min-h-12 w-full border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 text-sm"
                            >
                                <option value="CLASSIC">{t('competitionType.CLASSIC')}</option>
                                <option value="CASUAL">{t('competitionType.CASUAL')}</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="managed-access" className="text-sm font-bold">
                                {t('fields.access')}
                            </label>
                            <select
                                id="managed-access"
                                value={fields.access}
                                disabled={contentLocked}
                                onChange={(event) =>
                                    update('access', event.target.value as 'PRIVATE' | 'PUBLIC')
                                }
                                className="mt-2 min-h-12 w-full border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 text-sm"
                            >
                                <option value="PRIVATE">{t('access.PRIVATE')}</option>
                                <option value="PUBLIC">{t('access.PUBLIC')}</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="managed-selection" className="text-sm font-bold">
                                {t('fields.selectionLimit')}
                            </label>
                            <Input
                                id="managed-selection"
                                type="number"
                                min={1}
                                max={100}
                                value={fields.selectionLimit}
                                disabled={contentLocked}
                                onChange={(event) =>
                                    update(
                                        'selectionLimit',
                                        Math.max(1, Number(event.target.value) || 1),
                                    )
                                }
                                className="mt-2 min-h-12 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] focus-visible:scale-100"
                            />
                        </div>
                    </div>
                    <div className="divide-y divide-[var(--platform-line)] border-y border-[var(--platform-line-strong)]">
                        <label className="flex min-h-16 cursor-pointer items-center gap-3 py-3">
                            <input
                                type="checkbox"
                                checked={fields.commentsEnabled}
                                disabled={contentLocked}
                                onChange={(event) =>
                                    update('commentsEnabled', event.target.checked)
                                }
                                className="h-5 w-5 accent-[var(--platform-violet)]"
                            />
                            <span className="text-sm font-bold">{t('fields.commentsEnabled')}</span>
                        </label>
                        <label className="flex min-h-16 cursor-pointer items-center gap-3 py-3">
                            <input
                                type="checkbox"
                                checked={fields.allowPublicQuestions}
                                disabled={contentLocked}
                                onChange={(event) =>
                                    update('allowPublicQuestions', event.target.checked)
                                }
                                className="h-5 w-5 accent-[var(--platform-violet)]"
                            />
                            <span className="text-sm font-bold">
                                {t('fields.allowPublicQuestions')}
                            </span>
                        </label>
                    </div>
                </div>
                <aside className="lg:sticky lg:top-28 lg:self-start">
                    <div className="border border-[var(--platform-line-strong)] p-5">
                        <p className="flex items-center gap-2 text-sm font-bold">
                            <Check
                                className="h-4 w-4 text-[var(--platform-violet)]"
                                aria-hidden="true"
                            />
                            {t('organizer.details.permissionTitle')}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {fullyLocked
                                ? t('organizer.details.locked')
                                : t('organizer.details.permissionDescription')}
                        </p>
                    </div>
                    {!fullyLocked ? (
                        <button
                            type="button"
                            onClick={() => void save()}
                            disabled={busy}
                            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[var(--platform-violet)] px-4 text-sm font-bold text-white disabled:opacity-50 dark:text-[var(--platform-on-accent)]"
                        >
                            {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Save className="h-4 w-4" aria-hidden="true" />
                            )}
                            {t('actions.saveChanges')}
                        </button>
                    ) : null}
                </aside>
            </div>
        </div>
    );
}
