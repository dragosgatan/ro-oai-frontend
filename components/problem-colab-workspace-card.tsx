'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import {
    CheckIcon,
    ChevronDownIcon,
    Clock3Icon,
    CloudIcon,
    CopyIcon,
    ExternalLinkIcon,
    KeyRoundIcon,
    LaptopIcon,
    Loader2Icon,
    ShieldCheckIcon,
} from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import Script from 'next/script';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchApi } from '@/lib/api';
import {
    buildColabDriveUrl,
    buildNotebookFilename,
    ColabLaunchError,
    fetchAndVerifyNotebookTemplate,
    injectLaunchTicket,
    isGoogleIdentityReady,
    PUBLIC_COLAB_NOTEBOOK_URL,
    requestGoogleDriveAccessToken,
    resolveColabTemplateConfig,
    uploadPrivateNotebookToDrive,
} from '@/lib/google-colab-launch';

const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

type ColabWorkspaceSession = {
    code: string;
    expiresAt: string;
};

type ColabLaunchTicket = {
    ticket: string;
    expiresAt: string;
};

type CopyState = 'copied' | 'manual' | null;
type LaunchStage = 'idle' | 'authorizing' | 'template' | 'ticket' | 'drive' | 'opening';

function isColabWorkspaceSession(value: unknown): value is ColabWorkspaceSession {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Partial<ColabWorkspaceSession>;
    return (
        typeof candidate.code === 'string' &&
        candidate.code.trim().length > 0 &&
        typeof candidate.expiresAt === 'string' &&
        !Number.isNaN(Date.parse(candidate.expiresAt))
    );
}

function isColabLaunchTicket(value: unknown): value is ColabLaunchTicket {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Partial<ColabLaunchTicket>;
    return (
        typeof candidate.ticket === 'string' &&
        /^[A-Za-z0-9_-]{43}$/.test(candidate.ticket) &&
        typeof candidate.expiresAt === 'string' &&
        !Number.isNaN(Date.parse(candidate.expiresAt))
    );
}

export function ProblemColabWorkspaceCard({
    problemId,
    problemTitle,
}: {
    problemId: number;
    problemTitle: string;
}) {
    const { status } = useSession();
    const locale = useLocale();
    const t = useTranslations('problems.colab');
    const googleAccountHintId = useId();
    const [googleReady, setGoogleReady] = useState(false);
    const [googleScriptFailed, setGoogleScriptFailed] = useState(false);
    const [launchStage, setLaunchStage] = useState<LaunchStage>('idle');
    const [workspace, setWorkspace] = useState<ColabWorkspaceSession | null>(null);
    const [preparingManualCode, setPreparingManualCode] = useState(false);
    const [copyState, setCopyState] = useState<CopyState>(null);
    const [error, setError] = useState<string | null>(null);

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID?.trim() ?? '';
    const templateConfig = useMemo(
        () =>
            resolveColabTemplateConfig(
                process.env.NEXT_PUBLIC_COLAB_TEMPLATE_URL,
                process.env.NEXT_PUBLIC_COLAB_TEMPLATE_SHA256,
            ),
        [],
    );
    const oneClickConfigured = Boolean(googleClientId && templateConfig);
    const isLaunching = launchStage !== 'idle';

    useEffect(() => {
        if (isGoogleIdentityReady()) setGoogleReady(true);
    }, []);

    useEffect(() => {
        if (status === 'authenticated') return;

        setWorkspace(null);
        setCopyState(null);
        setError(null);
        setLaunchStage('idle');
    }, [status]);

    useEffect(() => {
        if (!workspace) return;

        const remainingMilliseconds = Date.parse(workspace.expiresAt) - Date.now();
        if (remainingMilliseconds <= 0) {
            setWorkspace(null);
            setCopyState(null);
            return;
        }

        const timeout = window.setTimeout(
            () => {
                setWorkspace(null);
                setCopyState(null);
            },
            Math.min(remainingMilliseconds, 2_147_483_647),
        );

        return () => window.clearTimeout(timeout);
    }, [workspace]);

    const copyCode = async (code: string) => {
        try {
            if (!navigator.clipboard?.writeText) {
                setCopyState('manual');
                return;
            }

            await navigator.clipboard.writeText(code);
            setCopyState('copied');
        } catch {
            setCopyState('manual');
        }
    };

    const apiErrorMessage = (response: Response) => {
        if (response.status === 401) return t('errors.unauthorized');
        if (response.status === 400 || response.status === 403 || response.status === 409) {
            return t('errors.unavailable');
        }
        return t('errors.generic');
    };

    const launchErrorMessage = (launchError: unknown) => {
        if (!(launchError instanceof ColabLaunchError)) return t('errors.generic');

        switch (launchError.code) {
            case 'googlePopupClosed':
                return t('errors.googlePopupClosed');
            case 'googleAuthorization':
                return t('errors.googleAuthorization');
            case 'templateUnavailable':
                return t('errors.templateUnavailable');
            case 'templateInvalid':
                return t('errors.templateInvalid');
            case 'driveUpload':
                return t('errors.driveUpload');
        }
    };

    const launchInColab = async () => {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
        if (
            !apiBaseUrl ||
            !googleClientId ||
            !templateConfig ||
            !googleReady ||
            googleScriptFailed
        ) {
            setError(t('errors.configuration'));
            return;
        }

        let googleAccessToken = '';
        let navigating = false;
        setError(null);
        setWorkspace(null);
        setCopyState(null);
        setLaunchStage('authorizing');

        try {
            googleAccessToken = await requestGoogleDriveAccessToken(googleClientId);

            setLaunchStage('template');
            const template = await fetchAndVerifyNotebookTemplate(templateConfig);

            setLaunchStage('ticket');
            const ticketResponse = await fetchApi(
                `${apiBaseUrl}/problems/${encodeURIComponent(problemId)}/colab/launch-tickets`,
                { method: 'POST' },
            );
            if (!ticketResponse.ok) {
                setError(apiErrorMessage(ticketResponse));
                return;
            }
            const ticketPayload: unknown = await ticketResponse.json();
            if (!isColabLaunchTicket(ticketPayload)) {
                setError(t('errors.invalidResponse'));
                return;
            }

            const personalizedNotebook = injectLaunchTicket(
                template,
                ticketPayload.ticket,
                apiBaseUrl,
            );
            setLaunchStage('drive');
            const fileId = await uploadPrivateNotebookToDrive(
                googleAccessToken,
                personalizedNotebook,
                buildNotebookFilename(problemTitle, problemId),
            );

            googleAccessToken = '';
            setLaunchStage('opening');
            navigating = true;
            window.location.assign(buildColabDriveUrl(fileId));
        } catch (launchError) {
            setError(launchErrorMessage(launchError));
        } finally {
            googleAccessToken = '';
            if (!navigating) setLaunchStage('idle');
        }
    };

    const prepareManualCode = async () => {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');
        if (!apiBaseUrl) {
            setError(t('errors.generic'));
            return;
        }

        setPreparingManualCode(true);
        setError(null);
        setCopyState(null);
        setWorkspace(null);

        try {
            const response = await fetchApi(
                `${apiBaseUrl}/problems/${encodeURIComponent(problemId)}/colab/sessions`,
                { method: 'POST' },
            );
            if (!response.ok) {
                setError(apiErrorMessage(response));
                return;
            }

            const data: unknown = await response.json();
            if (!isColabWorkspaceSession(data)) {
                setError(t('errors.invalidResponse'));
                return;
            }

            setWorkspace(data);
            await copyCode(data.code);
        } catch {
            setError(t('errors.generic'));
        } finally {
            setPreparingManualCode(false);
        }
    };

    const expiresAt = workspace
        ? new Intl.DateTimeFormat(locale, {
              hour: '2-digit',
              minute: '2-digit',
          }).format(new Date(workspace.expiresAt))
        : null;

    const launchLabel = (() => {
        switch (launchStage) {
            case 'authorizing':
                return t('authorizingGoogle');
            case 'template':
                return t('loadingNotebook');
            case 'ticket':
                return t('connectingProblem');
            case 'drive':
                return t('creatingNotebook');
            case 'opening':
                return t('openingColab');
            default:
                return t('openInColab');
        }
    })();

    return (
        <>
            {oneClickConfigured && (
                <Script
                    id="google-identity-services"
                    src={GOOGLE_IDENTITY_SCRIPT_URL}
                    strategy="afterInteractive"
                    onLoad={() => setGoogleReady(true)}
                    onReady={() => setGoogleReady(true)}
                    onError={() => {
                        setGoogleReady(false);
                        setGoogleScriptFailed(true);
                    }}
                />
            )}

            <Card className="overflow-hidden rounded-none border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] shadow-[4px_4px_0_var(--platform-line)]">
                <CardHeader className="px-5 pb-3 pt-5">
                    <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-[var(--platform-violet)]">
                            <LaptopIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle
                                className="text-base font-bold"
                                role="heading"
                                aria-level={2}
                            >
                                {t('title')}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs leading-5 text-[var(--platform-ink-muted-strong)]">
                                {t('description')}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3 px-5 pb-5 pt-0">
                    <div className="flex items-start gap-2 border-t border-[var(--platform-line)] pt-3 text-xs leading-5 text-[var(--platform-ink-muted-strong)]">
                        <CheckIcon
                            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--platform-violet)]"
                            aria-hidden="true"
                        />
                        <p>{t('evaluationNote')}</p>
                    </div>

                    {error && (
                        <div
                            className="border border-red-700/30 bg-red-500/10 px-3 py-3 text-xs leading-5 text-red-800 dark:text-red-200"
                            role="alert"
                        >
                            <p className="font-bold">{t('errorTitle')}</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {status === 'authenticated' ? (
                        <div className="space-y-2">
                            <Button
                                type="button"
                                className="h-auto min-h-11 w-full whitespace-normal rounded-none bg-[var(--platform-violet)] py-3 text-center text-sm font-bold leading-5 text-white hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]"
                                onClick={launchInColab}
                                disabled={
                                    isLaunching ||
                                    !oneClickConfigured ||
                                    !googleReady ||
                                    googleScriptFailed
                                }
                                aria-describedby={googleAccountHintId}
                            >
                                {isLaunching ||
                                (oneClickConfigured && !googleReady && !googleScriptFailed) ? (
                                    <Loader2Icon
                                        className="h-4 w-4 animate-spin"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <CloudIcon className="h-4 w-4" aria-hidden="true" />
                                )}
                                <span aria-live="polite">
                                    {oneClickConfigured ? launchLabel : t('openInColab')}
                                </span>
                                {!isLaunching && oneClickConfigured && googleReady && (
                                    <ExternalLinkIcon
                                        className="ms-auto h-4 w-4"
                                        aria-hidden="true"
                                    />
                                )}
                            </Button>
                            <p
                                id={googleAccountHintId}
                                className="text-center text-[0.6875rem] leading-4 text-[var(--platform-ink-muted)]"
                            >
                                {oneClickConfigured && !googleScriptFailed
                                    ? t('googleAccountHint')
                                    : t('configurationUnavailable')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {status === 'loading' && (
                                <p className="text-xs leading-5 text-[var(--platform-ink-muted)]">
                                    {t('checkingSession')}
                                </p>
                            )}
                            <Button
                                type="button"
                                className="h-auto min-h-11 w-full whitespace-normal rounded-none bg-[var(--platform-violet)] py-3 text-center text-sm font-bold leading-5 text-white hover:bg-[var(--platform-violet-strong)] dark:text-[var(--platform-on-accent)]"
                                onClick={() => signIn('keycloak')}
                                disabled={status === 'loading'}
                            >
                                {t('signIn')}
                            </Button>
                        </div>
                    )}

                    <div className="flex items-start gap-2 text-[0.6875rem] leading-4 text-[var(--platform-ink-muted)]">
                        <ShieldCheckIcon
                            className="mt-px h-3.5 w-3.5 shrink-0 text-[var(--platform-violet)]"
                            aria-hidden="true"
                        />
                        <p>{t('privacyNote')}</p>
                    </div>

                    <details className="group border-t border-[var(--platform-line)] pt-2">
                        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-xs font-bold text-[var(--platform-ink)] outline-none hover:text-[var(--platform-violet)] focus-visible:ring-2 focus-visible:ring-[var(--platform-violet)] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                            <KeyRoundIcon className="h-4 w-4" aria-hidden="true" />
                            <span>{t('manualTitle')}</span>
                            <ChevronDownIcon
                                className="ms-auto h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                                aria-hidden="true"
                            />
                        </summary>

                        <div className="space-y-3 pb-1 pt-2">
                            <p className="text-xs leading-5 text-[var(--platform-ink-muted)]">
                                {t('manualDescription')}
                            </p>

                            {workspace && (
                                <div
                                    className="space-y-2 border border-[var(--platform-violet)] bg-[var(--platform-paper-strong)] p-3"
                                    aria-live="polite"
                                >
                                    <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--platform-ink-muted)]">
                                        {t('workspaceCode')}
                                    </p>
                                    <div className="flex min-w-0 items-stretch" dir="ltr">
                                        <code className="flex min-h-11 min-w-0 flex-1 items-center overflow-x-auto border border-e-0 border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 font-mono text-sm font-bold tracking-[0.08em] text-[var(--platform-ink)]">
                                            {workspace.code}
                                        </code>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-auto min-h-11 w-11 shrink-0 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-0 text-[var(--platform-ink)] hover:bg-[var(--platform-citron)] hover:text-[var(--platform-on-accent)]"
                                            onClick={() => copyCode(workspace.code)}
                                            aria-label={t('copyCode')}
                                        >
                                            {copyState === 'copied' ? (
                                                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                            ) : (
                                                <CopyIcon className="h-4 w-4" aria-hidden="true" />
                                            )}
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-[var(--platform-ink-muted)]">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Clock3Icon
                                                className="h-3.5 w-3.5"
                                                aria-hidden="true"
                                            />
                                            {t('expiresAt', { time: expiresAt ?? '' })}
                                        </span>
                                        {copyState && (
                                            <span
                                                className={
                                                    copyState === 'copied'
                                                        ? 'font-semibold text-emerald-700 dark:text-emerald-300'
                                                        : 'font-semibold text-amber-800 dark:text-amber-200'
                                                }
                                                role="status"
                                            >
                                                {copyState === 'copied'
                                                    ? t('codeCopied')
                                                    : t('copyUnavailable')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {status === 'authenticated' ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-auto min-h-11 w-full whitespace-normal rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] py-3 text-center text-xs font-bold leading-5 text-[var(--platform-ink)] hover:bg-[var(--platform-paper-strong)]"
                                    onClick={prepareManualCode}
                                    disabled={preparingManualCode || isLaunching}
                                >
                                    {preparingManualCode ? (
                                        <Loader2Icon
                                            className="h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <KeyRoundIcon className="h-4 w-4" aria-hidden="true" />
                                    )}
                                    {preparingManualCode
                                        ? t('generatingCode')
                                        : workspace
                                          ? t('regenerateCode')
                                          : t('generateCode')}
                                </Button>
                            ) : (
                                <p className="text-xs leading-5 text-[var(--platform-ink-muted)]">
                                    {t('manualSignInHint')}
                                </p>
                            )}

                            <Button
                                asChild
                                variant="outline"
                                className="h-auto min-h-11 w-full whitespace-normal rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] py-3 text-center text-xs font-bold leading-5 text-[var(--platform-violet)] hover:bg-[var(--platform-citron)] hover:text-[var(--platform-on-accent)]"
                            >
                                <a
                                    href={PUBLIC_COLAB_NOTEBOOK_URL}
                                    target="_blank"
                                    rel="noopener noreferrer external"
                                >
                                    {t('openPublicNotebook')}
                                    <ExternalLinkIcon className="h-4 w-4" aria-hidden="true" />
                                </a>
                            </Button>
                            <p className="text-[0.6875rem] leading-4 text-[var(--platform-ink-muted)]">
                                {t('manualCodeHint')}
                            </p>
                        </div>
                    </details>
                </CardContent>
            </Card>
        </>
    );
}
