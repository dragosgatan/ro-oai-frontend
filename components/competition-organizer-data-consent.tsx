'use client';

import { useId, useState } from 'react';
import { AlertCircle, Check, Loader2, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    updateCompetitionOrganizerDataConsent,
    type CompetitionOrganizerDataConsent,
} from '@/lib/competition-hosting';
import { cn } from '@/lib/utils';

function SharedFields() {
    const t = useTranslations('organizerDataConsent');
    return (
        <ul className="mt-4 grid gap-x-8 gap-y-2 text-sm text-[var(--platform-ink)] sm:grid-cols-2">
            {(['email', 'name', 'grade', 'institution'] as const).map((field) => (
                <li key={field} className="flex items-start gap-2">
                    <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--platform-violet)]"
                        aria-hidden="true"
                    />
                    <span>{t(`fields.${field}`)}</span>
                </li>
            ))}
        </ul>
    );
}

function ConsentExplanation({ organizerName }: { organizerName: string }) {
    const t = useTranslations('organizerDataConsent');
    return (
        <>
            <p className="mt-2 max-w-[70ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                {t('thirdPartyExplanation', { organizer: organizerName })}
            </p>
            <SharedFields />
            <p className="mt-4 max-w-[70ch] text-xs leading-5 text-[var(--platform-ink-muted)]">
                {t('publicIdentityNotice')}
            </p>
            <p className="mt-4 max-w-[70ch] text-xs leading-5 text-[var(--platform-ink-muted)]">
                {t('optionalAndReversible')}
            </p>
        </>
    );
}

export function OrganizerDataConsentChoice({
    organizerName,
    checked,
    onCheckedChange,
    disabled = false,
    showControl = true,
    className,
}: {
    organizerName: string;
    checked: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    showControl?: boolean;
    className?: string;
}) {
    const t = useTranslations('organizerDataConsent');
    const generatedId = useId();
    const checkboxId = `${generatedId}-share-profile`;
    const descriptionId = `${generatedId}-description`;

    return (
        <section
            aria-labelledby={`${generatedId}-title`}
            className={cn('border-y border-[var(--platform-line-strong)] py-5 sm:py-6', className)}
        >
            <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center bg-[var(--platform-paper-strong)] text-[var(--platform-violet)]">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h2
                        id={`${generatedId}-title`}
                        className="text-base font-bold text-[var(--platform-ink)]"
                    >
                        {t('title', { organizer: organizerName })}
                    </h2>
                    <div id={descriptionId}>
                        <ConsentExplanation organizerName={organizerName} />
                    </div>
                </div>
            </div>

            {showControl ? (
                <div className="mt-5 flex min-h-12 items-start gap-3 bg-[var(--platform-paper-strong)] p-3 sm:ms-[3.25rem] sm:p-4">
                    <span className="grid h-6 w-6 shrink-0 place-items-center">
                        <Checkbox
                            id={checkboxId}
                            checked={checked}
                            onCheckedChange={(value) => onCheckedChange?.(value === true)}
                            disabled={disabled}
                            aria-describedby={descriptionId}
                            className="h-5 w-5 rounded-none border-[var(--platform-line-strong)] data-[state=checked]:bg-[var(--platform-violet)] data-[state=checked]:text-white"
                        />
                    </span>
                    <Label
                        htmlFor={checkboxId}
                        className="cursor-pointer text-sm font-semibold leading-6 text-[var(--platform-ink)]"
                    >
                        {t('explicitConsent', { organizer: organizerName })}
                    </Label>
                </div>
            ) : null}
        </section>
    );
}

export function OrganizerDataConsentSettings({
    competitionId,
    initialConsent,
}: {
    competitionId: number;
    initialConsent: CompetitionOrganizerDataConsent;
}) {
    const t = useTranslations('organizerDataConsent');
    const controlId = useId();
    const [consent, setConsent] = useState(initialConsent);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const organizerName = consent.organizerDisplayName;

    if (!consent.thirdPartyHosted || !consent.joined || !organizerName) return null;

    const update = async (next: boolean) => {
        if (saving || next === consent.sharePersonalDataWithOrganizer) return;
        const previous = consent;
        setConsent({
            ...consent,
            sharePersonalDataWithOrganizer: next,
            decisionUpdatedAt: new Date().toISOString(),
            consentedAt: next ? consent.consentedAt : null,
        });
        setSaving(true);
        setError(null);
        try {
            setConsent(await updateCompetitionOrganizerDataConsent(competitionId, next));
        } catch {
            setConsent(previous);
            setError(t('settings.error'));
        } finally {
            setSaving(false);
        }
    };

    const enabled = consent.sharePersonalDataWithOrganizer === true;
    const descriptionId = `${controlId}-description`;

    return (
        <section
            aria-labelledby={`${controlId}-title`}
            className="border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 py-5 sm:px-6"
        >
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <ShieldCheck
                            className="h-5 w-5 shrink-0 text-[var(--platform-violet)]"
                            aria-hidden="true"
                        />
                        <h2
                            id={`${controlId}-title`}
                            className="text-base font-bold text-[var(--platform-ink)]"
                        >
                            {t('settings.title')}
                        </h2>
                    </div>
                    <div id={descriptionId}>
                        <ConsentExplanation organizerName={organizerName} />
                    </div>
                    {error ? (
                        <p
                            role="alert"
                            className="mt-4 flex items-start gap-2 text-sm font-medium text-red-700 dark:text-red-300"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            {error}
                        </p>
                    ) : null}
                </div>

                <div className="flex min-w-40 items-center justify-between gap-3 border border-[var(--platform-line-strong)] px-3 py-2 sm:mt-0">
                    <div>
                        <Label
                            htmlFor={controlId}
                            className="cursor-pointer text-sm font-bold text-[var(--platform-ink)]"
                        >
                            {t('settings.controlLabel')}
                        </Label>
                        <span
                            aria-live="polite"
                            className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--platform-ink-muted)]"
                        >
                            {saving ? (
                                <Loader2
                                    className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
                                    aria-hidden="true"
                                />
                            ) : null}
                            {saving
                                ? t('settings.saving')
                                : enabled
                                  ? t('settings.shared')
                                  : t('settings.notShared')}
                        </span>
                    </div>
                    <span className="grid h-11 w-14 shrink-0 place-items-center">
                        <Switch
                            id={controlId}
                            checked={enabled}
                            disabled={saving}
                            onCheckedChange={(value) => void update(value)}
                            aria-describedby={descriptionId}
                            className="relative h-7 w-12 rounded-none border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] after:absolute after:-inset-x-1 after:-inset-y-2 after:content-[''] data-[state=checked]:bg-[var(--platform-violet)] data-[state=unchecked]:bg-[var(--platform-paper-strong)] [&>span]:rounded-none [&>span]:bg-[var(--platform-paper)] data-[state=checked]:[&>span]:bg-[var(--platform-citron)] rtl:data-[state=checked]:[&>span]:-translate-x-5"
                        />
                    </span>
                </div>
            </div>
        </section>
    );
}
