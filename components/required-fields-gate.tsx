'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, RefreshCw, UserCircle } from 'lucide-react';
import { getRequiredFieldsStatus, updateRequiredFields } from '@/lib/api';
import { RequiredFieldsStatusResponse, RequiredFieldsUpdateRequest } from '@/lib/types';
import { toast } from 'sonner';
import { platformSans } from '@/lib/platform-fonts';
import { cn } from '@/lib/utils';

const platformPortalTokensClassName =
    '[--platform-paper:oklch(0.978_0.014_292)] [--platform-paper-strong:oklch(0.952_0.026_292)] [--platform-ink:oklch(0.22_0.055_282)] [--platform-ink-muted:oklch(0.46_0.044_282)] [--platform-violet:oklch(0.43_0.235_291)] [--platform-violet-strong:oklch(0.36_0.22_291)] [--platform-coral:oklch(0.72_0.18_32)] [--platform-on-accent:oklch(0.2_0.045_282)] [--platform-line:oklch(0.79_0.04_289)] [--platform-line-strong:oklch(0.62_0.06_287)] dark:[--platform-paper:oklch(0.18_0.038_286)] dark:[--platform-paper-strong:oklch(0.215_0.046_286)] dark:[--platform-ink:oklch(0.94_0.016_292)] dark:[--platform-ink-muted:oklch(0.73_0.034_290)] dark:[--platform-violet:oklch(0.72_0.19_292)] dark:[--platform-violet-strong:oklch(0.77_0.17_292)] dark:[--platform-coral:oklch(0.74_0.17_32)] dark:[--platform-line:oklch(0.34_0.055_287)] dark:[--platform-line-strong:oklch(0.5_0.07_287)]';

const fieldClassName =
    'h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)] shadow-none focus-visible:scale-100 focus-visible:border-[var(--platform-violet)] focus-visible:ring-2 focus-visible:ring-[var(--platform-violet)] focus-visible:ring-offset-2 read-only:cursor-default read-only:bg-[var(--platform-paper-strong)] read-only:text-[var(--platform-ink-muted)] disabled:bg-[var(--platform-paper-strong)] disabled:text-[var(--platform-ink-muted)]';

const selectContentClassName =
    'rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)] shadow-[4px_4px_0_color-mix(in_oklch,var(--platform-violet)_20%,transparent)]';

const secondaryButtonClassName =
    'min-h-11 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 text-[var(--platform-ink)] shadow-none transition-[transform,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:bg-[var(--platform-paper-strong)] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none';

const primaryButtonClassName =
    'min-h-11 rounded-none bg-[var(--platform-violet)] px-5 text-[oklch(0.98_0.01_292)] shadow-[4px_4px_0_var(--platform-coral)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[var(--platform-violet-strong)] active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:shadow-none motion-reduce:transform-none dark:text-[var(--platform-on-accent)]';

export interface RequiredFieldsGateProps {
    competitionId: number;
    competitionName: string;
    joined: boolean;
    requiredFields?: string[];
    showUpdateValuesButton?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    open?: boolean;
    readOnly?: boolean;
}

export function RequiredFieldsGate({
    competitionId,
    competitionName,
    joined,
    requiredFields = [],
    showUpdateValuesButton = true,
    onOpenChange,
    open,
    readOnly = false,
}: RequiredFieldsGateProps) {
    const t = useTranslations('requiredFields');
    const tCommon = useTranslations('common');
    const [status, setStatus] = useState<RequiredFieldsStatusResponse | null>(null);
    const [isLoading, setIsLoading] = useState(joined);
    const [loadError, setLoadError] = useState(false);
    const [submitError, setSubmitError] = useState(false);
    const [internalIsDialogOpen, setInternalIsDialogOpen] = useState(false);
    const isDialogOpen = open !== undefined ? open : internalIsDialogOpen;
    const setIsDialogOpen = (isOpen: boolean) => {
        if (isOpen) {
            setSubmitError(false);
        }
        if (onOpenChange) {
            onOpenChange(isOpen);
        }
        setInternalIsDialogOpen(isOpen);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<RequiredFieldsUpdateRequest>({});

    const fetchStatus = useCallback(async () => {
        if (!joined) {
            setStatus(null);
            setLoadError(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setLoadError(false);
        try {
            const data = await getRequiredFieldsStatus(competitionId);
            setStatus(data);
            setForm(data.completedFields);
        } catch (error) {
            console.error('Failed to fetch required fields status:', error);
            setLoadError(true);
        } finally {
            setIsLoading(false);
        }
    }, [competitionId, joined]);

    useEffect(() => {
        void fetchStatus();
    }, [fetchStatus]);

    const handleInputChange = (field: keyof RequiredFieldsUpdateRequest, value: string) => {
        setSubmitError(false);
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(false);
        try {
            await updateRequiredFields(competitionId, form);
            toast.success(t('success'));
            setIsDialogOpen(false);
            void fetchStatus();
        } catch (error) {
            console.error('Failed to update required fields:', error);
            setSubmitError(true);
            toast.error(t('error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const isMissingAny = status && !status.allCompleted;
    const fieldsToShow = isMissingAny ? status.missingFields : requiredFields;
    const fieldLabels: Record<string, string> = {
        firstName: t('fields.firstName'),
        lastName: t('fields.lastName'),
        grade: t('fields.grade'),
        phone: t('fields.phone'),
        coordinatorTeacher: t('fields.coordinatorTeacher'),
        schoolTeacher: t('fields.schoolTeacher'),
        competitionId: t('fields.competitionId'),
        institutionId: t('fields.institutionId'),
    };

    const includesInstitution =
        fieldsToShow.includes('institutionId') || fieldsToShow.includes('competitionId');

    return (
        <>
            {isLoading && requiredFields.length > 0 && (
                <section
                    className={cn(
                        platformSans.className,
                        platformPortalTokensClassName,
                        'mb-6 flex min-h-24 items-center gap-4 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-4 text-[var(--platform-ink)] sm:p-5',
                    )}
                    aria-busy="true"
                    aria-live="polite"
                >
                    <span className="grid h-11 w-11 shrink-0 place-items-center border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-[var(--platform-violet)]">
                        <Loader2
                            className="h-5 w-5 animate-spin motion-reduce:animate-none"
                            aria-hidden="true"
                        />
                    </span>
                    <p className="text-sm font-semibold">{t('loading')}</p>
                </section>
            )}

            {!isLoading && loadError && requiredFields.length > 0 && (
                <section
                    className={cn(
                        platformSans.className,
                        platformPortalTokensClassName,
                        'mb-6 flex flex-col gap-4 border border-[var(--platform-coral)] bg-[color-mix(in_oklch,var(--platform-coral)_9%,var(--platform-paper))] p-4 text-[var(--platform-ink)] sm:flex-row sm:items-center sm:p-5',
                    )}
                    role="alert"
                >
                    <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--platform-coral)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                        <AlertCircle className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-semibold">{t('loadErrorTitle')}</h2>
                        <p className="mt-1 text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {t('loadErrorDescription')}
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => void fetchStatus()}
                        className={cn(secondaryButtonClassName, 'w-full sm:w-auto')}
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        {tCommon('retry')}
                    </Button>
                </section>
            )}

            {!isLoading && !loadError && isMissingAny && (
                <section
                    role="status"
                    aria-live="polite"
                    className={cn(
                        platformSans.className,
                        platformPortalTokensClassName,
                        'mb-6 border border-[color-mix(in_oklch,var(--platform-coral)_55%,var(--platform-line))] bg-[color-mix(in_oklch,var(--platform-coral)_10%,var(--platform-paper))] text-[var(--platform-ink)]',
                    )}
                >
                    <div className="grid gap-4 p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-5">
                        <span className="grid h-11 w-11 place-items-center border border-[var(--platform-coral)] bg-[var(--platform-paper)] text-[var(--platform-coral)]">
                            <AlertCircle className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold tracking-[-0.02em]">
                                {t('title')}
                            </h2>
                            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                                {t('description')}
                            </p>

                            <ul className="mt-3 flex flex-wrap gap-2" aria-label={t('title')}>
                                {status.missingFields.map((field) => (
                                    <li
                                        key={field}
                                        className="border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--platform-ink)]"
                                    >
                                        {fieldLabels[field] || field}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                {status.missingFields.length > 0 &&
                                    !(
                                        status.missingFields.includes('institutionId') &&
                                        status.missingFields.length === 1
                                    ) && (
                                        <Button
                                            type="button"
                                            onClick={() => setIsDialogOpen(true)}
                                            className={primaryButtonClassName}
                                        >
                                            {t('completeNow')}
                                        </Button>
                                    )}
                                {status.missingFields.includes('institutionId') && (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className={cn(
                                            secondaryButtonClassName,
                                            'hover:border-[var(--platform-violet)]',
                                        )}
                                    >
                                        <Link href="/institutions">{t('selectInstitution')}</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {!isLoading &&
                !loadError &&
                !isMissingAny &&
                status?.allCompleted &&
                requiredFields.length > 0 &&
                showUpdateValuesButton && (
                    <div
                        className={cn(
                            platformSans.className,
                            platformPortalTokensClassName,
                            'mb-6 flex justify-end',
                        )}
                    >
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(true)}
                            className={secondaryButtonClassName}
                        >
                            <UserCircle className="h-4 w-4" aria-hidden="true" />
                            {t('updateValues')}
                        </Button>
                    </div>
                )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent
                    className={cn(
                        platformSans.className,
                        platformPortalTokensClassName,
                        'max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-none border-2 border-[oklch(0.62_0.06_287)] bg-[var(--platform-paper)] p-0 text-[var(--platform-ink)] shadow-[8px_8px_0_oklch(0.43_0.235_291/0.24)] dark:border-[oklch(0.5_0.07_287)] sm:rounded-none',
                    )}
                >
                    <form onSubmit={handleSubmit} className="min-w-0">
                        <DialogHeader className="platform-toolbar space-y-0 border-b border-[var(--platform-line-strong)] px-5 py-5 text-start sm:px-6 sm:py-6">
                            <div className="flex items-start gap-3 pe-8">
                                <span className="grid h-11 w-11 shrink-0 place-items-center border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-violet)]">
                                    <UserCircle className="h-5 w-5" aria-hidden="true" />
                                </span>
                                <div className="min-w-0">
                                    <DialogTitle className="text-xl font-semibold tracking-[-0.03em] text-[var(--platform-ink)]">
                                        {t('dialog.title')}
                                    </DialogTitle>
                                    <DialogDescription className="mt-1 max-w-xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                                        {t('dialog.description', { competitionName })}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-6">
                            {fieldsToShow.includes('firstName') && (
                                <div className="grid content-start gap-2">
                                    <Label
                                        htmlFor="firstName"
                                        className="font-semibold text-[var(--platform-ink)]"
                                    >
                                        {t('fields.firstName')}
                                    </Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        autoComplete="given-name"
                                        className={fieldClassName}
                                        value={form.firstName || ''}
                                        onChange={(e) =>
                                            handleInputChange('firstName', e.target.value)
                                        }
                                        required
                                        readOnly={readOnly}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}
                            {fieldsToShow.includes('lastName') && (
                                <div className="grid content-start gap-2">
                                    <Label
                                        htmlFor="lastName"
                                        className="font-semibold text-[var(--platform-ink)]"
                                    >
                                        {t('fields.lastName')}
                                    </Label>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        autoComplete="family-name"
                                        className={fieldClassName}
                                        value={form.lastName || ''}
                                        onChange={(e) =>
                                            handleInputChange('lastName', e.target.value)
                                        }
                                        required
                                        readOnly={readOnly}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}
                            {fieldsToShow.includes('grade') && (
                                <div className="grid content-start gap-2">
                                    <Label
                                        htmlFor="grade"
                                        className="font-semibold text-[var(--platform-ink)]"
                                    >
                                        {t('fields.grade')}
                                    </Label>
                                    {status?.validGrades && status?.validGrades.length > 0 ? (
                                        <Select
                                            value={form.grade || ''}
                                            onValueChange={(value) =>
                                                handleInputChange('grade', value)
                                            }
                                            required
                                            disabled={readOnly || isSubmitting}
                                        >
                                            <SelectTrigger id="grade" className={fieldClassName}>
                                                <SelectValue placeholder={t('fields.grade')} />
                                            </SelectTrigger>
                                            <SelectContent
                                                className={cn(
                                                    platformSans.className,
                                                    platformPortalTokensClassName,
                                                    selectContentClassName,
                                                )}
                                            >
                                                {status.validGrades.map((grade) => (
                                                    <SelectItem
                                                        key={grade}
                                                        value={grade}
                                                        className="min-h-11 rounded-none ps-8 pe-3 focus:bg-[var(--platform-paper-strong)] focus:text-[var(--platform-ink)] [&>span]:start-2 [&>span]:left-auto"
                                                    >
                                                        {grade}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id="grade"
                                            name="grade"
                                            className={fieldClassName}
                                            value={form.grade || ''}
                                            onChange={(e) =>
                                                handleInputChange('grade', e.target.value)
                                            }
                                            required
                                            readOnly={readOnly}
                                            disabled={isSubmitting}
                                        />
                                    )}
                                </div>
                            )}
                            {fieldsToShow.includes('phone') && (
                                <div className="grid content-start gap-2">
                                    <Label
                                        htmlFor="phone"
                                        className="font-semibold text-[var(--platform-ink)]"
                                    >
                                        {t('fields.phone')}
                                    </Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        inputMode="tel"
                                        className={fieldClassName}
                                        value={form.phone || ''}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        required
                                        readOnly={readOnly}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}
                            {fieldsToShow.includes('coordinatorTeacher') && (
                                <div className="grid content-start gap-2">
                                    <Label
                                        htmlFor="coordinatorTeacher"
                                        className="font-semibold text-[var(--platform-ink)]"
                                    >
                                        {t('fields.coordinatorTeacher')}
                                    </Label>
                                    <Input
                                        id="coordinatorTeacher"
                                        name="coordinatorTeacher"
                                        className={fieldClassName}
                                        value={form.coordinatorTeacher || ''}
                                        onChange={(e) =>
                                            handleInputChange('coordinatorTeacher', e.target.value)
                                        }
                                        required
                                        readOnly={readOnly}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}
                            {fieldsToShow.includes('schoolTeacher') && (
                                <div className="grid content-start gap-2">
                                    <Label
                                        htmlFor="schoolTeacher"
                                        className="font-semibold text-[var(--platform-ink)]"
                                    >
                                        {t('fields.schoolTeacher')}
                                    </Label>
                                    <Input
                                        id="schoolTeacher"
                                        name="schoolTeacher"
                                        className={fieldClassName}
                                        value={form.schoolTeacher || ''}
                                        onChange={(e) =>
                                            handleInputChange('schoolTeacher', e.target.value)
                                        }
                                        required
                                        readOnly={readOnly}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            )}
                            {includesInstitution && (
                                <div className="grid content-start gap-2 sm:col-span-2">
                                    <p className="font-semibold text-[var(--platform-ink)]">
                                        {t('fields.institutionId')}
                                    </p>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className={cn(
                                            secondaryButtonClassName,
                                            'w-full justify-start',
                                            (readOnly || isSubmitting) &&
                                                'pointer-events-none opacity-50',
                                        )}
                                    >
                                        <Link
                                            href="/institutions"
                                            aria-disabled={readOnly || isSubmitting}
                                            tabIndex={readOnly || isSubmitting ? -1 : undefined}
                                        >
                                            {t('selectInstitution')}
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>

                        {submitError && (
                            <div
                                role="alert"
                                className="mx-5 mb-5 flex items-start gap-3 border border-[var(--platform-coral)] bg-[color-mix(in_oklch,var(--platform-coral)_9%,var(--platform-paper))] p-3 text-sm leading-6 text-[var(--platform-ink)] sm:mx-6 sm:mb-6"
                            >
                                <AlertCircle
                                    className="mt-0.5 h-5 w-5 shrink-0 text-[var(--platform-coral)]"
                                    aria-hidden="true"
                                />
                                <span>{t('error')}</span>
                            </div>
                        )}

                        <DialogFooter className="platform-toolbar gap-3 border-t border-[var(--platform-line-strong)] px-5 py-4 sm:space-x-0 sm:px-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                className={cn(secondaryButtonClassName, 'w-full sm:w-auto')}
                            >
                                {tCommon('cancel')}
                            </Button>
                            {!readOnly && (
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    aria-busy={isSubmitting}
                                    className={cn(primaryButtonClassName, 'w-full sm:w-auto')}
                                >
                                    {isSubmitting && (
                                        <Loader2
                                            className="h-4 w-4 animate-spin motion-reduce:animate-none"
                                            aria-hidden="true"
                                        />
                                    )}
                                    {tCommon('save')}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
