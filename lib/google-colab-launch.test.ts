import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    buildColabDriveUrl,
    buildNotebookFilename,
    COLAB_API_BASE_URL_PLACEHOLDER,
    COLAB_BOOTSTRAP_TAG,
    COLAB_WORKSPACE_PLACEHOLDER,
    ColabLaunchError,
    DEFAULT_COLAB_TEMPLATE_SHA256,
    DEFAULT_COLAB_TEMPLATE_URL,
    fetchAndVerifyNotebookTemplate,
    GOOGLE_DRIVE_FILE_SCOPE,
    injectLaunchTicket,
    type NotebookDocument,
    requestGoogleDriveAccessToken,
    resolveColabTemplateConfig,
    uploadPrivateNotebookToDrive,
} from '@/lib/google-colab-launch';

function template(): NotebookDocument {
    return {
        cells: [
            {
                cell_type: 'code',
                metadata: { tags: [COLAB_BOOTSTRAP_TAG] },
                source: [
                    `_embedded_api_base_url = "${COLAB_API_BASE_URL_PLACEHOLDER}"\n`,
                    `_embedded_workspace_code = "${COLAB_WORKSPACE_PLACEHOLDER}"\n`,
                ],
                execution_count: null,
                outputs: [],
            },
        ],
        metadata: {},
        nbformat: 4,
        nbformat_minor: 5,
    };
}

async function sha256(value: string): Promise<string> {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
    );
}

afterEach(() => {
    delete (window as typeof window & { google?: unknown }).google;
    vi.restoreAllMocks();
});

describe('Google Colab launch helpers', () => {
    it('uses the integrity-pinned canonical asset unless both safe overrides are supplied', () => {
        expect(resolveColabTemplateConfig()).toEqual({
            rawUrl: DEFAULT_COLAB_TEMPLATE_URL,
            sha256: DEFAULT_COLAB_TEMPLATE_SHA256,
        });
        expect(
            resolveColabTemplateConfig(
                'https://raw.githubusercontent.com/example/assets/main/workspace.ipynb',
                'a'.repeat(64),
            ),
        ).toEqual({
            rawUrl: 'https://raw.githubusercontent.com/example/assets/main/workspace.ipynb',
            sha256: 'a'.repeat(64),
        });
        expect(
            resolveColabTemplateConfig('https://example.com/notebook.ipynb', 'a'.repeat(64)),
        ).toBe(null);
        expect(resolveColabTemplateConfig(DEFAULT_COLAB_TEMPLATE_URL, undefined)).toBe(null);
    });

    it('verifies the notebook bytes before parsing the tagged bootstrap cell', async () => {
        const raw = JSON.stringify(template());
        const fetchImplementation = vi.fn().mockImplementation(() =>
            Promise.resolve(
                new Response(raw, {
                    status: 200,
                    headers: { 'content-length': String(raw.length) },
                }),
            ),
        );

        const notebook = await fetchAndVerifyNotebookTemplate(
            { rawUrl: DEFAULT_COLAB_TEMPLATE_URL, sha256: await sha256(raw) },
            fetchImplementation,
        );

        expect(notebook).toEqual(template());
        expect(fetchImplementation).toHaveBeenCalledWith(
            DEFAULT_COLAB_TEMPLATE_URL,
            expect.objectContaining({ credentials: 'omit', referrerPolicy: 'no-referrer' }),
        );

        await expect(
            fetchAndVerifyNotebookTemplate(
                { rawUrl: DEFAULT_COLAB_TEMPLATE_URL, sha256: '0'.repeat(64) },
                fetchImplementation,
            ),
        ).rejects.toMatchObject({ code: 'templateInvalid' });
    });

    it('injects one exact machine ticket without mutating the public template', () => {
        const source = template();
        const ticket = 'A'.repeat(43);

        const personalized = injectLaunchTicket(source, ticket, 'https://api.staging.example/');

        expect(JSON.stringify(personalized)).toContain(ticket);
        expect(JSON.stringify(personalized)).toContain('https://api.staging.example');
        expect(JSON.stringify(personalized)).not.toContain(COLAB_WORKSPACE_PLACEHOLDER);
        expect(JSON.stringify(personalized)).not.toContain(COLAB_API_BASE_URL_PLACEHOLDER);
        expect(JSON.stringify(source)).toContain(COLAB_WORKSPACE_PLACEHOLDER);
        expect(() =>
            injectLaunchTicket(source, 'not-a-valid-ticket', 'https://api.example'),
        ).toThrow(ColabLaunchError);
        expect(() => injectLaunchTicket(source, ticket, 'http://api.example')).toThrow(
            ColabLaunchError,
        );
    });

    it('requests only drive.file and returns the access token through the callback', async () => {
        const requestAccessToken = vi.fn();
        const initTokenClient = vi.fn((config) => {
            requestAccessToken.mockImplementation(() =>
                config.callback({ access_token: 'short-lived-google-token' }),
            );
            return { requestAccessToken };
        });
        (window as typeof window & { google?: unknown }).google = {
            accounts: {
                oauth2: {
                    initTokenClient,
                    hasGrantedAllScopes: () => true,
                },
            },
        };

        await expect(requestGoogleDriveAccessToken('client-id')).resolves.toBe(
            'short-lived-google-token',
        );
        expect(initTokenClient).toHaveBeenCalledWith(
            expect.objectContaining({
                client_id: 'client-id',
                scope: GOOGLE_DRIVE_FILE_SCOPE,
                include_granted_scopes: false,
            }),
        );
        expect(requestAccessToken).toHaveBeenCalledWith({ prompt: '' });
    });

    it('uploads a new private ipynb without making a permissions request', async () => {
        const fetchImplementation = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ id: 'safe_Drive-file-id_123' }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );

        const fileId = await uploadPrivateNotebookToDrive(
            'ephemeral-google-token',
            template(),
            'MLCompete - Classifier.ipynb',
            fetchImplementation,
        );

        expect(fileId).toBe('safe_Drive-file-id_123');
        expect(fetchImplementation).toHaveBeenCalledOnce();
        const [url, request] = fetchImplementation.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('/upload/drive/v3/files?uploadType=multipart');
        expect(url).not.toContain('/permissions');
        expect(request.method).toBe('POST');
        expect(request.credentials).toBe('omit');
        expect(request.headers).toEqual(
            expect.objectContaining({ Authorization: 'Bearer ephemeral-google-token' }),
        );
        expect((request.body as Blob).type).toBe('');
        const body = await (request.body as Blob).text();
        expect(body).toContain('MLCompete - Classifier.ipynb');
        expect(body).toContain('application/x-ipynb+json');
        expect(buildColabDriveUrl(fileId)).toBe(
            'https://colab.research.google.com/drive/safe_Drive-file-id_123',
        );
    });

    it('builds a safe, readable Drive filename from the problem title', () => {
        expect(buildNotebookFilename(' Vision / Images\\2026\u0000 ', 42)).toBe(
            'MLCompete - Vision Images 2026.ipynb',
        );
        expect(buildNotebookFilename('', 42)).toBe('MLCompete - Problem 42.ipynb');
    });
});
