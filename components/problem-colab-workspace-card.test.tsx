import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    authStatus: 'unauthenticated' as 'authenticated' | 'loading' | 'unauthenticated',
    buildColabDriveUrl: vi.fn(),
    clipboardWrite: vi.fn(),
    fetchApi: vi.fn(),
    fetchTemplate: vi.fn(),
    injectTicket: vi.fn(),
    requestGoogleToken: vi.fn(),
    signIn: vi.fn(),
    uploadNotebook: vi.fn(),
}));

const messages: Record<string, string> = {
    alternativeLabel: 'or',
    oneClickBadge: 'One-click setup',
    title: 'Work and submit from Google Colab',
    description: 'Open the prepared notebook and submit from it.',
    evaluationNote: 'Colab submissions use the same evaluator and limits.',
    privateCopyTitle: 'A fresh private copy',
    privateCopyDescription: 'Your work stays in Drive.',
    readyToRunTitle: 'No setup code to paste',
    readyToRunDescription: 'Run the first cell.',
    openInColab: 'Open in Google Colab',
    authorizingGoogle: 'Connecting your Google account…',
    loadingNotebook: 'Loading the trusted notebook…',
    connectingProblem: 'Connecting this problem…',
    creatingNotebook: 'Creating your private notebook…',
    openingColab: 'Opening Google Colab…',
    googleAccountHint: 'Google may ask you to choose an account.',
    configurationUnavailable: 'One-click launch is temporarily unavailable.',
    privacyNote: 'MLCompete cannot browse unrelated files.',
    manualTitle: 'Doesn’t open? Use a temporary code',
    manualDescription: 'Open the public notebook and use a code.',
    workspaceCode: 'Workspace code',
    codeCopied: 'Copied',
    copyUnavailable: 'Copy it manually',
    copyCode: 'Copy workspace code',
    generateCode: 'Generate and copy a workspace code',
    generatingCode: 'Generating code…',
    regenerateCode: 'Generate a new code',
    openPublicNotebook: 'Open the public notebook in Colab',
    manualCodeHint: 'Paste the code only when asked.',
    manualSignInHint: 'Sign in first to generate a code.',
    checkingSession: 'Checking your session…',
    signIn: 'Sign in to open Colab',
    errorTitle: 'Colab workspace unavailable',
    'errors.unauthorized': 'Your session expired.',
    'errors.unavailable': 'Colab is unavailable for this protected session.',
    'errors.generic': 'We could not prepare the workspace.',
    'errors.invalidResponse': 'The response was incomplete.',
    'errors.configuration': 'One-click launch is not configured.',
    'errors.googlePopupClosed': 'Google sign-in was closed.',
    'errors.googleAuthorization': 'Google could not grant access.',
    'errors.templateUnavailable': 'The notebook could not be loaded.',
    'errors.templateInvalid': 'The notebook failed its safety check.',
    'errors.driveUpload': 'Drive could not create the notebook.',
};

vi.mock('next-auth/react', () => ({
    signIn: mocks.signIn,
    useSession: () => ({ status: mocks.authStatus }),
}));

vi.mock('next-intl', () => ({
    useLocale: () => 'en',
    useTranslations: () => (key: string, values?: Record<string, string>) => {
        if (key === 'expiresAt') return `Expires at ${values?.time ?? ''}`;
        return messages[key] ?? key;
    },
}));

vi.mock('next/script', () => ({ default: () => null }));

vi.mock('@/lib/api', () => ({ fetchApi: mocks.fetchApi }));

vi.mock('@/lib/google-colab-launch', async (importOriginal) => {
    const original = await importOriginal<typeof import('@/lib/google-colab-launch')>();
    return {
        ...original,
        buildColabDriveUrl: mocks.buildColabDriveUrl,
        fetchAndVerifyNotebookTemplate: mocks.fetchTemplate,
        injectLaunchTicket: mocks.injectTicket,
        isGoogleIdentityReady: () => true,
        requestGoogleDriveAccessToken: mocks.requestGoogleToken,
        uploadPrivateNotebookToDrive: mocks.uploadNotebook,
    };
});

import { ProblemColabWorkspaceCard } from '@/components/problem-colab-workspace-card';
import { ColabLaunchError, PUBLIC_COLAB_NOTEBOOK_URL } from '@/lib/google-colab-launch';

const originalEnvironment = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    clientId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID,
    templateSha: process.env.NEXT_PUBLIC_COLAB_TEMPLATE_SHA256,
    templateUrl: process.env.NEXT_PUBLIC_COLAB_TEMPLATE_URL,
};

describe('ProblemColabWorkspaceCard', () => {
    beforeEach(() => {
        mocks.authStatus = 'unauthenticated';
        mocks.buildColabDriveUrl.mockReset().mockReturnValue('https://colab.test/drive/file-id');
        mocks.clipboardWrite.mockReset().mockResolvedValue(undefined);
        mocks.fetchApi.mockReset();
        mocks.fetchTemplate.mockReset().mockResolvedValue({ cells: [] });
        mocks.injectTicket.mockReset().mockReturnValue({ personalized: true });
        mocks.requestGoogleToken.mockReset().mockResolvedValue('google-access-token');
        mocks.signIn.mockReset();
        mocks.uploadNotebook.mockReset().mockResolvedValue('safe_Drive-file-id_123');

        process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.platform.test';
        process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID = 'web-client.apps.googleusercontent.com';
        delete process.env.NEXT_PUBLIC_COLAB_TEMPLATE_SHA256;
        delete process.env.NEXT_PUBLIC_COLAB_TEMPLATE_URL;
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: mocks.clipboardWrite },
        });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        for (const [key, value] of Object.entries(originalEnvironment)) {
            const environmentKey =
                key === 'apiBaseUrl'
                    ? 'NEXT_PUBLIC_API_BASE_URL'
                    : key === 'clientId'
                      ? 'NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID'
                      : key === 'templateSha'
                        ? 'NEXT_PUBLIC_COLAB_TEMPLATE_SHA256'
                        : 'NEXT_PUBLIC_COLAB_TEMPLATE_URL';
            if (value === undefined) delete process.env[environmentKey];
            else process.env[environmentKey] = value;
        }
    });

    it('presents Colab as a concise alternative using the same evaluator', () => {
        render(<ProblemColabWorkspaceCard problemId={42} problemTitle="Image classifier" />);

        expect(screen.getByRole('heading', { level: 2, name: messages.title })).toBeInTheDocument();
        expect(screen.getByText(messages.description)).toBeInTheDocument();
        expect(screen.getByText(messages.evaluationNote)).toBeInTheDocument();
        expect(screen.queryByText(messages.oneClickBadge)).not.toBeInTheDocument();
        expect(screen.queryByText(messages.privateCopyTitle)).not.toBeInTheDocument();
        expect(screen.queryByText(messages.readyToRunTitle)).not.toBeInTheDocument();
    });

    it('asks anonymous users to sign in and keeps the public-notebook fallback', async () => {
        const user = userEvent.setup();
        render(<ProblemColabWorkspaceCard problemId={42} problemTitle="Image classifier" />);

        await user.click(screen.getByRole('button', { name: messages.signIn }));
        await user.click(screen.getByText(messages.manualTitle));

        expect(mocks.signIn).toHaveBeenCalledWith('keycloak');
        expect(screen.getByText(messages.manualSignInHint)).toBeInTheDocument();
        const publicNotebook = screen.getByRole('link', { name: messages.openPublicNotebook });
        expect(publicNotebook).toHaveAttribute('href', PUBLIC_COLAB_NOTEBOOK_URL);
        expect(publicNotebook).toHaveAttribute('target', '_blank');
        expect(publicNotebook).toHaveAttribute('rel', expect.stringContaining('noopener'));
    });

    it('creates a private personalized notebook and navigates to Colab without copy/paste', async () => {
        mocks.authStatus = 'authenticated';
        mocks.fetchApi.mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({
                ticket: 'A'.repeat(43),
                expiresAt: '2099-07-21T10:30:00.000Z',
            }),
        });
        const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => undefined);
        const user = userEvent.setup();
        render(<ProblemColabWorkspaceCard problemId={42} problemTitle="Image / classifier" />);

        await waitFor(() =>
            expect(screen.getByRole('button', { name: messages.openInColab })).toBeEnabled(),
        );
        await user.click(screen.getByRole('button', { name: messages.openInColab }));

        await waitFor(() =>
            expect(mocks.fetchApi).toHaveBeenCalledWith(
                'https://api.platform.test/problems/42/colab/launch-tickets',
                { method: 'POST' },
            ),
        );
        expect(mocks.requestGoogleToken).toHaveBeenCalledWith(
            'web-client.apps.googleusercontent.com',
        );
        expect(mocks.injectTicket).toHaveBeenCalledWith(
            { cells: [] },
            'A'.repeat(43),
            'https://api.platform.test',
        );
        expect(mocks.uploadNotebook).toHaveBeenCalledWith(
            'google-access-token',
            { personalized: true },
            'MLCompete - Image classifier.ipynb',
        );
        expect(mocks.buildColabDriveUrl).toHaveBeenCalledWith('safe_Drive-file-id_123');
        expect(assign).toHaveBeenCalledWith('https://colab.test/drive/file-id');
        expect(mocks.clipboardWrite).not.toHaveBeenCalled();
        expect(screen.queryByText('A'.repeat(43))).not.toBeInTheDocument();
    });

    it('shows a safe, actionable message when the Google popup is closed', async () => {
        mocks.authStatus = 'authenticated';
        mocks.requestGoogleToken.mockRejectedValue(new ColabLaunchError('googlePopupClosed'));
        const user = userEvent.setup();
        render(<ProblemColabWorkspaceCard problemId={42} problemTitle="Classifier" />);

        await waitFor(() =>
            expect(screen.getByRole('button', { name: messages.openInColab })).toBeEnabled(),
        );
        await user.click(screen.getByRole('button', { name: messages.openInColab }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            messages['errors.googlePopupClosed'],
        );
        expect(mocks.fetchApi).not.toHaveBeenCalled();
    });

    it('generates and copies a human code only inside the manual fallback', async () => {
        mocks.authStatus = 'authenticated';
        mocks.fetchApi.mockResolvedValue({
            ok: true,
            status: 201,
            json: async () => ({
                code: 'ABCD-EFGH-JKLM-NPQR',
                expiresAt: '2099-07-21T10:30:00.000Z',
            }),
        });
        const user = userEvent.setup();
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: mocks.clipboardWrite },
        });
        render(<ProblemColabWorkspaceCard problemId={7} problemTitle="Classifier" />);

        await user.click(screen.getByText(messages.manualTitle));
        await user.click(screen.getByRole('button', { name: messages.generateCode }));

        await waitFor(() =>
            expect(mocks.fetchApi).toHaveBeenCalledWith(
                'https://api.platform.test/problems/7/colab/sessions',
                { method: 'POST' },
            ),
        );
        expect(await screen.findByText('ABCD-EFGH-JKLM-NPQR')).toBeInTheDocument();
        await waitFor(() =>
            expect(mocks.clipboardWrite).toHaveBeenCalledWith('ABCD-EFGH-JKLM-NPQR'),
        );
        expect(screen.getByText(messages.codeCopied)).toHaveAttribute('role', 'status');
        expect(screen.getByRole('button', { name: messages.regenerateCode })).toBeInTheDocument();
    });

    it('disables one-click launch when the Google client is not configured', async () => {
        mocks.authStatus = 'authenticated';
        delete process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID;
        render(<ProblemColabWorkspaceCard problemId={42} problemTitle="Classifier" />);

        expect(screen.getByRole('button', { name: messages.openInColab })).toBeDisabled();
        expect(screen.getByText(messages.configurationUnavailable)).toBeInTheDocument();
        expect(screen.getByText(messages.manualTitle)).toBeInTheDocument();
    });

    it('does not expose backend error details when the launch ticket is rejected', async () => {
        mocks.authStatus = 'authenticated';
        mocks.fetchApi.mockResolvedValue({
            ok: false,
            status: 403,
            json: async () => ({ message: 'sensitive backend detail' }),
        });
        const user = userEvent.setup();
        render(<ProblemColabWorkspaceCard problemId={99} problemTitle="Classifier" />);

        await waitFor(() =>
            expect(screen.getByRole('button', { name: messages.openInColab })).toBeEnabled(),
        );
        await user.click(screen.getByRole('button', { name: messages.openInColab }));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent(messages['errors.unavailable']);
        expect(alert).not.toHaveTextContent('sensitive backend detail');
        expect(mocks.uploadNotebook).not.toHaveBeenCalled();
    });
});
