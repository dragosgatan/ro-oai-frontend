'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock3,
    Loader2,
    LockKeyhole,
    Mail,
    RefreshCw,
    Search,
    Send,
    ShieldCheck,
    ShieldOff,
    Trash2,
    UserPlus,
    X,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link, useRouter } from '@/i18n/routing';
import {
    CompetitionHostingApiError,
    getHostedCompetitionInvitations,
    inviteHostedCompetitionParticipant,
    removeHostedCompetitionParticipant,
    resendHostedCompetitionInvitation,
    revokeHostedCompetitionInvitation,
    searchCompetitionInvitees,
    type CompetitionInviteeOption,
    type CompetitionHostingPage,
    type CompetitionParticipantInvitation,
    type HostedCompetition,
    type HostedCompetitionParticipant,
} from '@/lib/competition-hosting';
import { cn } from '@/lib/utils';

type Mode = 'PLATFORM_USER' | 'EMAIL';

function participantsHref(
    competitionId: number,
    participantPage: number,
    invitationPage: number,
): string {
    const query = new URLSearchParams();
    if (participantPage > 1) query.set('participantPage', String(participantPage));
    if (invitationPage > 1) query.set('invitationPage', String(invitationPage));
    const suffix = query.toString();
    return `/my-competitions/${competitionId}/participants${suffix ? `?${suffix}` : ''}`;
}

function ListPagination({
    competitionId,
    page,
    section,
    queryKey,
    otherPage,
}: {
    competitionId: number;
    page: CompetitionHostingPage<unknown>['page'];
    section: string;
    queryKey: 'participantPage' | 'invitationPage';
    otherPage: number;
}) {
    const t = useTranslations('competitionHosting');
    if (page.totalPages <= 1) return null;
    const currentPage = page.number + 1;
    const hrefFor = (targetPage: number) =>
        participantsHref(
            competitionId,
            queryKey === 'participantPage' ? targetPage : otherPage,
            queryKey === 'invitationPage' ? targetPage : otherPage,
        );

    return (
        <nav
            aria-label={t('pagination.label', { section })}
            className="flex flex-col items-center justify-between gap-4 border-t border-[var(--platform-line-strong)] pt-6 sm:flex-row"
        >
            <Link
                href={hrefFor(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : undefined}
                className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
            >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                {t('pagination.previous')}
            </Link>
            <p className="font-mono text-sm font-semibold tabular-nums text-[var(--platform-ink-muted)]">
                {t('pagination.page', { page: currentPage, pages: page.totalPages })}
            </p>
            <Link
                href={hrefFor(Math.min(page.totalPages, currentPage + 1))}
                aria-disabled={currentPage >= page.totalPages}
                tabIndex={currentPage >= page.totalPages ? -1 : undefined}
                className="inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] aria-disabled:pointer-events-none aria-disabled:opacity-45"
            >
                {t('pagination.next')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
        </nav>
    );
}

function initials(value: string): string {
    return value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toLocaleUpperCase())
        .join('');
}

function formatDeliveryTime(value: string | null, locale: string): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    try {
        return new Intl.DateTimeFormat(locale, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    } catch {
        return null;
    }
}

export function ParticipantsManager({
    competition,
    participantPage,
    invitationPage,
}: {
    competition: HostedCompetition;
    participantPage: CompetitionHostingPage<HostedCompetitionParticipant>;
    invitationPage: CompetitionHostingPage<CompetitionParticipantInvitation>;
}) {
    const t = useTranslations('competitionHosting');
    const locale = useLocale();
    const router = useRouter();
    const resultsId = useId();
    const emailHelpId = useId();
    const inviteErrorId = useId();
    const requestRef = useRef(0);
    const [participants, setParticipants] = useState(participantPage.content);
    const [invitations, setInvitations] = useState(invitationPage.content);
    const [mode, setMode] = useState<Mode>('PLATFORM_USER');
    const [query, setQuery] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [results, setResults] = useState<CompetitionInviteeOption[]>([]);
    const [selected, setSelected] = useState<CompetitionInviteeOption | null>(null);
    const [searching, setSearching] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [emailInvalid, setEmailInvalid] = useState(false);
    const canInviteParticipants =
        competition.permissions.approvedHosting && competition.permissions.canInviteParticipants;

    useEffect(() => setParticipants(participantPage.content), [participantPage.content]);
    useEffect(() => setInvitations(invitationPage.content), [invitationPage.content]);

    useEffect(() => {
        if (
            !canInviteParticipants ||
            mode !== 'PLATFORM_USER' ||
            selected ||
            query.trim().length < 2
        ) {
            setResults([]);
            setSearching(false);
            return;
        }
        const requestId = ++requestRef.current;
        const timer = window.setTimeout(async () => {
            setSearching(true);
            try {
                const next = await searchCompetitionInvitees(competition.id, query);
                if (requestId === requestRef.current) setResults(next);
            } catch {
                if (requestId === requestRef.current) setResults([]);
            } finally {
                if (requestId === requestRef.current) setSearching(false);
            }
        }, 320);
        return () => window.clearTimeout(timer);
    }, [canInviteParticipants, competition.id, mode, query, selected]);

    const showError = (caught: unknown, fallback: string) => {
        if (caught instanceof CompetitionHostingApiError && caught.status === 409) {
            setError(t('participants.errors.conflict'));
        } else {
            setError(caught instanceof Error ? caught.message : fallback);
        }
    };

    const announceDelivery = (
        invitation: CompetitionParticipantInvitation,
        fallback: 'participants.toasts.invited' | 'participants.toasts.resent',
    ) => {
        if (!invitation.deliveryStatus) {
            toast.success(t(fallback));
            return;
        }
        if (invitation.deliveryStatus === 'FAILED') {
            toast.error(t('participants.toasts.emailFailed'));
            return;
        }
        toast.success(
            t(
                invitation.deliveryStatus === 'SENT'
                    ? 'participants.toasts.emailSent'
                    : 'participants.toasts.emailQueued',
            ),
        );
    };

    const reloadQueuedInvitation = async (
        queuedInvitation: CompetitionParticipantInvitation,
        page: number,
    ): Promise<CompetitionParticipantInvitation> => {
        if (queuedInvitation.deliveryStatus !== 'QUEUED') return queuedInvitation;
        try {
            const refreshed = await getHostedCompetitionInvitations(competition.id, {
                page,
                size: invitationPage.page.size,
            });
            const reconciled = refreshed.content.find(
                (invitation) => invitation.id === queuedInvitation.id,
            );
            if (!reconciled) return queuedInvitation;
            setInvitations((current) =>
                current.map((invitation) =>
                    invitation.id === reconciled.id ? reconciled : invitation,
                ),
            );
            return reconciled;
        } catch {
            // The invitation was created successfully. Keep its queued state and
            // let the next page refresh reconcile delivery without claiming failure.
            return queuedInvitation;
        }
    };

    const surfaceReconciledFailure = (invitation: CompetitionParticipantInvitation) => {
        if (invitation.deliveryStatus !== 'FAILED') return;
        setError(t('participants.errors.emailDeliveryFailed'));
        toast.error(t('participants.toasts.emailFailed'));
    };

    const invite = async () => {
        if (!canInviteParticipants) {
            setEmailInvalid(false);
            setError(t('participants.errors.invitesLocked'));
            return;
        }
        if (mode === 'PLATFORM_USER' && !selected) {
            setEmailInvalid(false);
            setError(t('participants.errors.chooseUser'));
            return;
        }
        const normalizedEmail = email.trim().toLocaleLowerCase('en-US');
        if (mode === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setEmailInvalid(true);
            setError(t('participants.errors.email'));
            return;
        }
        setEmailInvalid(false);
        setBusy('invite');
        setError(null);
        try {
            const invitation = await inviteHostedCompetitionParticipant(
                competition.id,
                mode === 'PLATFORM_USER'
                    ? { userId: selected!.userId, message: message.trim() || null }
                    : { email: normalizedEmail, message: message.trim() || null },
            );
            if (invitationPage.page.number === 0) {
                setInvitations((current) => [
                    invitation,
                    ...current.filter((item) => item.id !== invitation.id),
                ]);
            }
            setSelected(null);
            setQuery('');
            setEmail('');
            setMessage('');
            if (invitation.deliveryStatus === 'FAILED') {
                setError(t('participants.errors.emailDeliveryFailed'));
            }
            announceDelivery(invitation, 'participants.toasts.invited');
            if (invitation.deliveryStatus === 'QUEUED') {
                surfaceReconciledFailure(await reloadQueuedInvitation(invitation, 0));
            }
            if (invitationPage.page.number > 0) {
                router.replace(
                    participantsHref(competition.id, participantPage.page.number + 1, 1),
                );
            } else {
                router.refresh();
            }
        } catch (caught) {
            showError(caught, t('participants.errors.invite'));
        } finally {
            setBusy(null);
        }
    };

    const resend = async (invitation: CompetitionParticipantInvitation) => {
        if (!canInviteParticipants) return;
        setBusy(`resend:${invitation.id}`);
        setError(null);
        try {
            const updated = await resendHostedCompetitionInvitation(competition.id, invitation);
            setInvitations((current) =>
                current.map((item) => (item.id === updated.id ? updated : item)),
            );
            announceDelivery(updated, 'participants.toasts.resent');
            if (updated.deliveryStatus === 'QUEUED') {
                surfaceReconciledFailure(
                    await reloadQueuedInvitation(updated, invitationPage.page.number),
                );
            }
            router.refresh();
        } catch (caught) {
            showError(caught, t('participants.errors.resend'));
        } finally {
            setBusy(null);
        }
    };

    const revoke = async (invitation: CompetitionParticipantInvitation) => {
        setBusy(`revoke:${invitation.id}`);
        setError(null);
        try {
            await revokeHostedCompetitionInvitation(competition.id, invitation);
            setInvitations((current) =>
                current.map((item) =>
                    item.id === invitation.id
                        ? { ...item, status: 'REVOKED', canRevoke: false, canResend: false }
                        : item,
                ),
            );
            toast.success(t('participants.toasts.revoked'));
            router.refresh();
        } catch (caught) {
            showError(caught, t('participants.errors.revoke'));
        } finally {
            setBusy(null);
        }
    };

    const remove = async (participant: HostedCompetitionParticipant) => {
        setBusy(`remove:${participant.id}`);
        setError(null);
        try {
            await removeHostedCompetitionParticipant(competition.id, participant.id);
            setParticipants((current) =>
                current.map((item) =>
                    item.id === participant.id
                        ? {
                              ...item,
                              disabled: true,
                              canRemove: false,
                              sharePersonalDataWithOrganizer: false,
                              consentedAt: null,
                              decisionUpdatedAt: null,
                              consentNoticeVersion: null,
                              email: null,
                              firstName: null,
                              lastName: null,
                              grade: null,
                              institution: null,
                          }
                        : item,
                ),
            );
            toast.success(t('participants.toasts.removed'));
            router.refresh();
        } catch (caught) {
            showError(caught, t('participants.errors.remove'));
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="space-y-12">
            {canInviteParticipants ? (
                <section aria-labelledby="invite-participant-title">
                    <div className="border-b border-[var(--platform-line-strong)] pb-4">
                        <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                            01
                        </p>
                        <h2
                            id="invite-participant-title"
                            className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                        >
                            {t('participants.invite.title')}
                        </h2>
                        <p className="mt-2 max-w-[68ch] text-sm leading-6 text-[var(--platform-ink-muted)]">
                            {t('participants.invite.description')}
                        </p>
                    </div>

                    <form
                        className="mt-5 max-w-3xl border border-[var(--platform-line-strong)]"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void invite();
                        }}
                        aria-busy={busy === 'invite'}
                        noValidate
                    >
                        <fieldset disabled={busy === 'invite'}>
                            <legend className="sr-only">
                                {t('participants.invite.modeLabel')}
                            </legend>
                            <div className="grid grid-cols-2 border-b border-[var(--platform-line-strong)]">
                                {(['PLATFORM_USER', 'EMAIL'] as const).map((candidate) => (
                                    <label
                                        key={candidate}
                                        className={cn(
                                            'inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 border-e text-sm font-bold last:border-e-0 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-3px] has-[:focus-visible]:outline-[var(--platform-violet)]',
                                            mode === candidate
                                                ? 'bg-[var(--platform-citron)] text-[var(--platform-on-accent)]'
                                                : 'bg-[var(--platform-paper)] text-[var(--platform-ink-muted)]',
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="participant-invite-mode"
                                            value={candidate}
                                            checked={mode === candidate}
                                            onChange={() => {
                                                setMode(candidate);
                                                setEmailInvalid(false);
                                                setError(null);
                                            }}
                                            className="sr-only"
                                        />
                                        {candidate === 'PLATFORM_USER' ? (
                                            <UserPlus className="h-4 w-4" aria-hidden="true" />
                                        ) : (
                                            <Mail className="h-4 w-4" aria-hidden="true" />
                                        )}
                                        {t(`participants.invite.mode.${candidate}`)}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <div className="space-y-5 p-5">
                            {mode === 'PLATFORM_USER' ? (
                                <div className="relative">
                                    <label
                                        htmlFor="participant-search"
                                        className="text-sm font-bold"
                                    >
                                        {t('participants.invite.searchLabel')}
                                    </label>
                                    {selected ? (
                                        <div className="mt-2 flex min-h-12 items-center gap-3 border border-[var(--platform-violet)] bg-[var(--platform-paper-strong)] px-3">
                                            <span className="grid h-8 w-8 place-items-center bg-[var(--platform-violet)] text-xs font-bold text-white dark:text-[var(--platform-on-accent)]">
                                                {initials(selected.displayName)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-bold">
                                                    {selected.displayName}
                                                </span>
                                                <span className="block truncate text-xs text-[var(--platform-ink-muted)]">
                                                    @{selected.username}
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelected(null);
                                                    setError(null);
                                                }}
                                                aria-label={t('participants.invite.clearUser')}
                                                className="grid h-11 w-11 place-items-center"
                                            >
                                                <X className="h-4 w-4" aria-hidden="true" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative mt-2">
                                            <Search
                                                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--platform-ink-muted)]"
                                                aria-hidden="true"
                                            />
                                            <Input
                                                id="participant-search"
                                                value={query}
                                                onChange={(event) => {
                                                    setQuery(event.target.value);
                                                    setError(null);
                                                }}
                                                placeholder={t(
                                                    'participants.invite.searchPlaceholder',
                                                )}
                                                autoComplete="off"
                                                role="combobox"
                                                aria-expanded={results.length > 0}
                                                aria-controls={resultsId}
                                                className="min-h-12 rounded-none border-[var(--platform-line-strong)] ps-10 focus-visible:scale-100"
                                            />
                                            {searching ? (
                                                <Loader2
                                                    className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin"
                                                    aria-hidden="true"
                                                />
                                            ) : null}
                                            {query.trim().length >= 2 && !searching ? (
                                                <ul
                                                    id={resultsId}
                                                    role="listbox"
                                                    className="absolute z-20 mt-1 max-h-72 w-full overflow-auto border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] shadow-[5px_5px_0_var(--platform-line)]"
                                                >
                                                    {results.length > 0 ? (
                                                        results.map((user) => (
                                                            <li
                                                                key={user.userId}
                                                                role="option"
                                                                aria-selected="false"
                                                            >
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelected(user);
                                                                        setResults([]);
                                                                        setError(null);
                                                                    }}
                                                                    className="flex min-h-14 w-full items-center gap-3 border-b border-[var(--platform-line)] px-3 text-start last:border-b-0 hover:bg-[var(--platform-paper-strong)]"
                                                                >
                                                                    <span className="grid h-8 w-8 place-items-center bg-[var(--platform-violet)] text-xs font-bold text-white dark:text-[var(--platform-on-accent)]">
                                                                        {initials(user.displayName)}
                                                                    </span>
                                                                    <span>
                                                                        <span className="block text-sm font-bold">
                                                                            {user.displayName}
                                                                        </span>
                                                                        <span className="block text-xs text-[var(--platform-ink-muted)]">
                                                                            @{user.username}
                                                                        </span>
                                                                    </span>
                                                                </button>
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li className="p-4 text-sm text-[var(--platform-ink-muted)]">
                                                            {t('participants.invite.noUsers')}
                                                        </li>
                                                    )}
                                                </ul>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label
                                        htmlFor="participant-email"
                                        className="text-sm font-bold"
                                    >
                                        {t('participants.invite.emailLabel')}
                                    </label>
                                    <Input
                                        id="participant-email"
                                        type="email"
                                        value={email}
                                        onChange={(event) => {
                                            setEmail(event.target.value);
                                            setEmailInvalid(false);
                                            setError(null);
                                        }}
                                        placeholder={t('participants.invite.emailPlaceholder')}
                                        autoComplete="email"
                                        aria-invalid={emailInvalid}
                                        aria-describedby={
                                            emailInvalid
                                                ? `${emailHelpId} ${inviteErrorId}`
                                                : emailHelpId
                                        }
                                        className="mt-2 min-h-12 rounded-none border-[var(--platform-line-strong)] focus-visible:scale-100"
                                    />
                                    <p
                                        id={emailHelpId}
                                        className="mt-2 text-xs leading-5 text-[var(--platform-ink-muted)]"
                                    >
                                        {t('participants.invite.emailHelp')}
                                    </p>
                                </div>
                            )}
                            <div>
                                <label htmlFor="participant-message" className="text-sm font-bold">
                                    {t('participants.invite.messageLabel')}
                                </label>
                                <Textarea
                                    id="participant-message"
                                    value={message}
                                    maxLength={2000}
                                    onChange={(event) => {
                                        setMessage(event.target.value);
                                        setError(null);
                                    }}
                                    placeholder={t('participants.invite.messagePlaceholder')}
                                    className="mt-2 min-h-24 rounded-none border-[var(--platform-line-strong)]"
                                />
                            </div>
                            {error ? (
                                <p
                                    id={inviteErrorId}
                                    role="alert"
                                    className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300"
                                >
                                    <AlertCircle
                                        className="mt-0.5 h-4 w-4 shrink-0"
                                        aria-hidden="true"
                                    />
                                    {error}
                                </p>
                            ) : null}
                            <button
                                type="submit"
                                disabled={busy === 'invite'}
                                className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-5 text-sm font-bold text-white disabled:opacity-50 dark:text-[var(--platform-on-accent)]"
                            >
                                {busy === 'invite' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Send className="h-4 w-4" aria-hidden="true" />
                                )}
                                {t('participants.invite.send')}
                            </button>
                        </div>
                    </form>
                </section>
            ) : (
                <section aria-labelledby="invite-participant-title">
                    <div className="border-b border-[var(--platform-line-strong)] pb-4">
                        <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">
                            01
                        </p>
                        <h2
                            id="invite-participant-title"
                            className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                        >
                            {t('participants.invite.title')}
                        </h2>
                    </div>
                    <p className="mt-5 flex max-w-3xl items-start gap-3 border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4 text-sm leading-6 text-[var(--platform-ink-muted)]">
                        <LockKeyhole
                            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--platform-violet)]"
                            aria-hidden="true"
                        />
                        {t('participants.invite.locked')}
                    </p>
                </section>
            )}

            <section aria-labelledby="pending-invitations-title">
                <div className="border-b border-[var(--platform-line-strong)] pb-4">
                    <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">02</p>
                    <h2
                        id="pending-invitations-title"
                        className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                    >
                        {t('participants.pending.title')}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--platform-ink-muted)]">
                        {t('participants.pending.description')}
                    </p>
                </div>
                <div>
                    {invitations.length === 0 ? (
                        <p className="border-b border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-5 text-sm text-[var(--platform-ink-muted)]">
                            {t('participants.pending.empty')}
                        </p>
                    ) : (
                        <ul className="border-b border-[var(--platform-line-strong)]">
                            {invitations.map((invitation) => {
                                const deliveryKey = invitation.deliveryStatus;
                                const deliveryTime = formatDeliveryTime(
                                    invitation.deliveryAttemptedAt ?? invitation.lastSentAt,
                                    locale,
                                );
                                const deliveryFailed = invitation.deliveryStatus === 'FAILED';
                                return (
                                    <li
                                        key={invitation.id}
                                        className="grid min-h-24 gap-4 border-b border-[var(--platform-line)] px-2 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="grid h-10 w-10 shrink-0 place-items-center border border-[var(--platform-line-strong)] text-[var(--platform-violet)]">
                                                {invitation.recipientType === 'EMAIL' ? (
                                                    <Mail className="h-4 w-4" aria-hidden="true" />
                                                ) : (
                                                    <UserPlus
                                                        className="h-4 w-4"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-[var(--platform-ink)]">
                                                    {invitation.displayName ||
                                                        invitation.maskedEmail ||
                                                        invitation.username}
                                                </p>
                                                <p className="mt-1 truncate text-xs text-[var(--platform-ink-muted)]">
                                                    {invitation.username
                                                        ? `@${invitation.username}`
                                                        : invitation.maskedEmail}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-flex min-h-8 items-center border border-[var(--platform-line)] px-2.5 text-xs font-bold text-[var(--platform-ink-muted)]">
                                                {t(
                                                    `participants.pending.status.${invitation.status}`,
                                                )}
                                            </span>
                                            {deliveryKey ? (
                                                <span
                                                    className={cn(
                                                        'inline-flex min-h-8 items-center gap-1.5 border border-[var(--platform-line)] px-2.5 text-xs font-bold',
                                                        deliveryKey === 'FAILED'
                                                            ? 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-300'
                                                            : deliveryKey === 'SENT'
                                                              ? 'text-emerald-700 dark:text-emerald-300'
                                                              : 'text-[var(--platform-ink-muted)]',
                                                    )}
                                                >
                                                    <span className="sr-only">
                                                        {t('participants.pending.deliveryLabel')}
                                                        :{' '}
                                                    </span>
                                                    {deliveryKey === 'FAILED' ? (
                                                        <AlertCircle
                                                            className="h-3.5 w-3.5"
                                                            aria-hidden="true"
                                                        />
                                                    ) : deliveryKey === 'SENT' ? (
                                                        <CheckCircle2
                                                            className="h-3.5 w-3.5"
                                                            aria-hidden="true"
                                                        />
                                                    ) : (
                                                        <Clock3
                                                            className="h-3.5 w-3.5"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    <span>
                                                        {t(
                                                            `participants.pending.delivery.${deliveryKey}`,
                                                        )}
                                                        {deliveryTime ? (
                                                            <time
                                                                dateTime={
                                                                    invitation.deliveryAttemptedAt ??
                                                                    invitation.lastSentAt ??
                                                                    undefined
                                                                }
                                                                className="ms-1 font-normal"
                                                            >
                                                                {t(
                                                                    'participants.pending.deliveryAttemptedAt',
                                                                    { date: deliveryTime },
                                                                )}
                                                            </time>
                                                        ) : null}
                                                    </span>
                                                </span>
                                            ) : null}
                                            {canInviteParticipants && invitation.canResend ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void resend(invitation)}
                                                    disabled={busy === `resend:${invitation.id}`}
                                                    className={cn(
                                                        'inline-flex min-h-11 items-center gap-2 border border-[var(--platform-line-strong)] px-3 text-xs font-bold',
                                                        deliveryFailed &&
                                                            'border-red-500 text-red-700 dark:border-red-700 dark:text-red-300',
                                                    )}
                                                >
                                                    {busy === `resend:${invitation.id}` ? (
                                                        <Loader2
                                                            className="h-4 w-4 animate-spin"
                                                            aria-hidden="true"
                                                        />
                                                    ) : (
                                                        <RefreshCw
                                                            className="h-4 w-4"
                                                            aria-hidden="true"
                                                        />
                                                    )}
                                                    {t(
                                                        deliveryFailed
                                                            ? 'participants.pending.retryEmail'
                                                            : 'participants.pending.resend',
                                                    )}
                                                </button>
                                            ) : null}
                                            {invitation.canRevoke ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void revoke(invitation)}
                                                    disabled={busy === `revoke:${invitation.id}`}
                                                    className="inline-flex min-h-11 items-center gap-2 px-3 text-xs font-bold text-red-700 dark:text-red-300"
                                                >
                                                    {busy === `revoke:${invitation.id}` ? (
                                                        <Loader2
                                                            className="h-4 w-4 animate-spin"
                                                            aria-hidden="true"
                                                        />
                                                    ) : (
                                                        <X className="h-4 w-4" aria-hidden="true" />
                                                    )}
                                                    {t('participants.pending.revoke')}
                                                </button>
                                            ) : null}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <ListPagination
                        competitionId={competition.id}
                        page={invitationPage.page}
                        section={t('participants.pending.title')}
                        queryKey="invitationPage"
                        otherPage={participantPage.page.number + 1}
                    />
                </div>
            </section>

            <section aria-labelledby="participants-list-title">
                <div className="border-b border-[var(--platform-line-strong)] pb-4">
                    <p className="font-mono text-xs font-bold text-[var(--platform-violet)]">03</p>
                    <h2
                        id="participants-list-title"
                        className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--platform-ink)]"
                    >
                        {t('participants.list.title')}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--platform-ink-muted)]">
                        {t('participants.list.count', {
                            count: competition.participantCount,
                        })}
                    </p>
                </div>
                <div>
                    {participants.length === 0 ? (
                        <p className="border-b border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-5 text-sm text-[var(--platform-ink-muted)]">
                            {t('participants.list.empty')}
                        </p>
                    ) : (
                        <ul className="border-b border-[var(--platform-line-strong)]">
                            {participants.map((participant) => {
                                const personalFields = participant.sharePersonalDataWithOrganizer
                                    ? [
                                          {
                                              key: 'name',
                                              value: [participant.firstName, participant.lastName]
                                                  .filter(Boolean)
                                                  .join(' '),
                                          },
                                          { key: 'email', value: participant.email },
                                          { key: 'grade', value: participant.grade },
                                          {
                                              key: 'institution',
                                              value: participant.institution,
                                          },
                                      ].filter((field) => field.value)
                                    : [];
                                return (
                                    <li
                                        key={participant.id}
                                        className={cn(
                                            'grid min-h-24 gap-4 border-b border-[var(--platform-line)] px-2 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start',
                                            participant.disabled && 'opacity-55',
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="grid h-10 w-10 shrink-0 place-items-center bg-[var(--platform-violet)] text-xs font-bold text-white dark:text-[var(--platform-on-accent)]">
                                                    {initials(participant.displayName)}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-[var(--platform-ink)]">
                                                        {participant.displayName}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-[var(--platform-ink-muted)]">
                                                        {participant.username
                                                            ? `@${participant.username}`
                                                            : t('participants.list.external')}
                                                    </p>
                                                </div>
                                            </div>
                                            {personalFields.length > 0 ? (
                                                <dl className="mt-4 grid gap-x-6 gap-y-2 ps-[3.25rem] text-xs sm:grid-cols-2">
                                                    {personalFields.map((field) => (
                                                        <div
                                                            key={field.key}
                                                            className="min-w-0 sm:grid sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-2"
                                                        >
                                                            <dt className="font-bold text-[var(--platform-ink-muted)]">
                                                                {t(
                                                                    `participants.list.personalFields.${field.key}`,
                                                                )}
                                                            </dt>
                                                            <dd className="break-words text-[var(--platform-ink)]">
                                                                {field.value}
                                                            </dd>
                                                        </div>
                                                    ))}
                                                </dl>
                                            ) : null}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                            <span className="inline-flex min-h-8 w-fit items-center gap-2 text-xs font-bold text-[var(--platform-ink-muted)]">
                                                {participant.disabled ? (
                                                    <X className="h-4 w-4" aria-hidden="true" />
                                                ) : (
                                                    <CheckCircle2
                                                        className="h-4 w-4 text-[var(--platform-violet)]"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                {participant.disabled
                                                    ? t('participants.list.removed')
                                                    : t('participants.list.active')}
                                            </span>
                                            <span className="inline-flex min-h-8 w-fit items-center gap-2 border border-[var(--platform-line)] px-2.5 text-xs font-bold text-[var(--platform-ink-muted)]">
                                                {participant.sharePersonalDataWithOrganizer ? (
                                                    <ShieldCheck
                                                        className="h-4 w-4 text-[var(--platform-violet)]"
                                                        aria-hidden="true"
                                                    />
                                                ) : (
                                                    <ShieldOff
                                                        className="h-4 w-4"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                {participant.sharePersonalDataWithOrganizer
                                                    ? t('participants.list.profileShared')
                                                    : t('participants.list.profileNotShared')}
                                            </span>
                                            {competition.permissions.canManageParticipants &&
                                            participant.canRemove ? (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="grid h-11 w-11 place-items-center text-red-700 dark:text-red-300"
                                                            aria-label={t(
                                                                'participants.list.removeLabel',
                                                                {
                                                                    name: participant.displayName,
                                                                },
                                                            )}
                                                        >
                                                            <Trash2
                                                                className="h-4 w-4"
                                                                aria-hidden="true"
                                                            />
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-ink)]">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                {t('participants.remove.title', {
                                                                    name: participant.displayName,
                                                                })}
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {participant.hasSubmissions
                                                                    ? t(
                                                                          'participants.remove.withSubmissions',
                                                                      )
                                                                    : t(
                                                                          'participants.remove.description',
                                                                      )}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="rounded-none">
                                                                {t('participants.remove.cancel')}
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() =>
                                                                    void remove(participant)
                                                                }
                                                                className="rounded-none bg-red-700 text-white hover:bg-red-800"
                                                            >
                                                                {busy ===
                                                                `remove:${participant.id}` ? (
                                                                    <Loader2
                                                                        className="me-2 h-4 w-4 animate-spin"
                                                                        aria-hidden="true"
                                                                    />
                                                                ) : null}
                                                                {t('participants.remove.confirm')}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : null}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <ListPagination
                        competitionId={competition.id}
                        page={participantPage.page}
                        section={t('participants.list.title')}
                        queryKey="participantPage"
                        otherPage={invitationPage.page.number + 1}
                    />
                </div>
            </section>
        </div>
    );
}
