export const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const COLAB_BOOTSTRAP_TAG = 'mlcompete-bootstrap';
export const COLAB_WORKSPACE_PLACEHOLDER = '__MLCOMPETE_WORKSPACE_CODE__';
export const COLAB_API_BASE_URL_PLACEHOLDER = '__MLCOMPETE_API_BASE_URL__';

export const DEFAULT_COLAB_TEMPLATE_URL =
    'https://raw.githubusercontent.com/olimpiada-ai-ro/ro-oai-assets/f3aee0e105d8cadfe798da32e2150bd6a6cd20f8/notebooks/mlcompete/problem-workspace.ipynb';
export const DEFAULT_COLAB_TEMPLATE_SHA256 =
    'a114caa0d238a5209e4faec22004d33de76d49ef8df3e6d6f332de4201ea957a';
export const PUBLIC_COLAB_NOTEBOOK_URL =
    'https://colab.research.google.com/github/olimpiada-ai-ro/ro-oai-assets/blob/f3aee0e105d8cadfe798da32e2150bd6a6cd20f8/notebooks/mlcompete/problem-workspace.ipynb';

const MAX_TEMPLATE_BYTES = 2 * 1024 * 1024;
const DRIVE_UPLOAD_URL =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id';
const LAUNCH_TICKET_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const DRIVE_FILE_ID_PATTERN = /^[A-Za-z0-9_-]{10,200}$/;

export type ColabLaunchErrorCode =
    | 'googlePopupClosed'
    | 'googleAuthorization'
    | 'templateUnavailable'
    | 'templateInvalid'
    | 'driveUpload';

export class ColabLaunchError extends Error {
    constructor(readonly code: ColabLaunchErrorCode) {
        super(code);
        this.name = 'ColabLaunchError';
    }
}

export type ColabTemplateConfig = {
    rawUrl: string;
    sha256: string;
};

type GoogleTokenResponse = {
    access_token?: string;
    error?: string;
};

type GoogleTokenClient = {
    requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
};

type GoogleOAuth2Api = {
    initTokenClient: (config: {
        client_id: string;
        scope: string;
        include_granted_scopes: boolean;
        callback: (response: GoogleTokenResponse) => void;
        error_callback: (error: { type?: string }) => void;
    }) => GoogleTokenClient;
    hasGrantedAllScopes: (response: GoogleTokenResponse, ...scopes: string[]) => boolean;
};

type NotebookCell = {
    cell_type: string;
    metadata?: {
        tags?: unknown;
        [key: string]: unknown;
    };
    source: string | string[];
    [key: string]: unknown;
};

export type NotebookDocument = {
    cells: NotebookCell[];
    metadata: Record<string, unknown>;
    nbformat: number;
    nbformat_minor: number;
    [key: string]: unknown;
};

function googleOAuth2(): GoogleOAuth2Api | null {
    if (typeof window === 'undefined') return null;

    const google = (
        window as typeof window & {
            google?: { accounts?: { oauth2?: GoogleOAuth2Api } };
        }
    ).google;
    return google?.accounts?.oauth2 ?? null;
}

export function isGoogleIdentityReady(): boolean {
    return googleOAuth2() !== null;
}

export function resolveColabTemplateConfig(
    rawUrlOverride?: string,
    sha256Override?: string,
): ColabTemplateConfig | null {
    const rawUrl = rawUrlOverride?.trim();
    const sha256 = sha256Override?.trim().toLowerCase();

    if (!rawUrl && !sha256) {
        return {
            rawUrl: DEFAULT_COLAB_TEMPLATE_URL,
            sha256: DEFAULT_COLAB_TEMPLATE_SHA256,
        };
    }
    if (!rawUrl || !sha256 || !/^[a-f0-9]{64}$/.test(sha256)) return null;

    try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== 'https:' || parsed.hostname !== 'raw.githubusercontent.com') {
            return null;
        }
        return { rawUrl: parsed.toString(), sha256 };
    } catch {
        return null;
    }
}

export function requestGoogleDriveAccessToken(clientId: string): Promise<string> {
    const oauth2 = googleOAuth2();
    if (!oauth2 || !clientId.trim()) {
        return Promise.reject(new ColabLaunchError('googleAuthorization'));
    }

    return new Promise((resolve, reject) => {
        let settled = false;
        const settle = (callback: () => void) => {
            if (settled) return;
            settled = true;
            callback();
        };

        try {
            const client = oauth2.initTokenClient({
                client_id: clientId.trim(),
                scope: GOOGLE_DRIVE_FILE_SCOPE,
                include_granted_scopes: false,
                callback: (response) => {
                    if (
                        response.error ||
                        !response.access_token ||
                        !oauth2.hasGrantedAllScopes(response, GOOGLE_DRIVE_FILE_SCOPE)
                    ) {
                        settle(() => reject(new ColabLaunchError('googleAuthorization')));
                        return;
                    }
                    settle(() => resolve(response.access_token as string));
                },
                error_callback: (error) => {
                    const code =
                        error.type === 'popup_closed' ? 'googlePopupClosed' : 'googleAuthorization';
                    settle(() => reject(new ColabLaunchError(code)));
                },
            });
            client.requestAccessToken({ prompt: '' });
        } catch {
            settle(() => reject(new ColabLaunchError('googleAuthorization')));
        }
    });
}

function sourceText(cell: NotebookCell): string {
    if (typeof cell.source === 'string') return cell.source;
    if (Array.isArray(cell.source) && cell.source.every((line) => typeof line === 'string')) {
        return cell.source.join('');
    }
    throw new ColabLaunchError('templateInvalid');
}

function assertNotebook(value: unknown): asserts value is NotebookDocument {
    if (!value || typeof value !== 'object') throw new ColabLaunchError('templateInvalid');

    const notebook = value as Partial<NotebookDocument>;
    if (
        notebook.nbformat !== 4 ||
        typeof notebook.nbformat_minor !== 'number' ||
        !notebook.metadata ||
        typeof notebook.metadata !== 'object' ||
        !Array.isArray(notebook.cells) ||
        notebook.cells.length === 0
    ) {
        throw new ColabLaunchError('templateInvalid');
    }

    const taggedCells = notebook.cells.filter((cell) => {
        if (!cell || typeof cell !== 'object') return false;
        const tags = cell.metadata?.tags;
        return Array.isArray(tags) && tags.includes(COLAB_BOOTSTRAP_TAG);
    });
    if (taggedCells.length !== 1 || taggedCells[0].cell_type !== 'code') {
        throw new ColabLaunchError('templateInvalid');
    }

    for (const placeholder of [COLAB_WORKSPACE_PLACEHOLDER, COLAB_API_BASE_URL_PLACEHOLDER]) {
        const occurrences = notebook.cells.reduce((count, cell) => {
            if (!cell || typeof cell !== 'object') {
                throw new ColabLaunchError('templateInvalid');
            }
            return count + sourceText(cell).split(placeholder).length - 1;
        }, 0);
        if (occurrences !== 1 || !sourceText(taggedCells[0]).includes(placeholder)) {
            throw new ColabLaunchError('templateInvalid');
        }
    }
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
    if (!globalThis.crypto?.subtle) throw new ColabLaunchError('templateInvalid');
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
        '',
    );
}

export async function fetchAndVerifyNotebookTemplate(
    config: ColabTemplateConfig,
    fetchImplementation: typeof fetch = fetch,
): Promise<NotebookDocument> {
    let response: Response;
    try {
        response = await fetchImplementation(config.rawUrl, {
            method: 'GET',
            credentials: 'omit',
            cache: 'no-cache',
            referrerPolicy: 'no-referrer',
            headers: { Accept: 'application/x-ipynb+json, application/json' },
        });
    } catch {
        throw new ColabLaunchError('templateUnavailable');
    }

    if (!response.ok) throw new ColabLaunchError('templateUnavailable');
    const advertisedSize = Number(response.headers.get('content-length'));
    if (Number.isFinite(advertisedSize) && advertisedSize > MAX_TEMPLATE_BYTES) {
        throw new ColabLaunchError('templateInvalid');
    }

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_TEMPLATE_BYTES) {
        throw new ColabLaunchError('templateInvalid');
    }
    if ((await sha256Hex(bytes)) !== config.sha256) {
        throw new ColabLaunchError('templateInvalid');
    }

    let notebook: unknown;
    try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        notebook = JSON.parse(text);
    } catch {
        throw new ColabLaunchError('templateInvalid');
    }
    assertNotebook(notebook);
    return notebook;
}

export function injectLaunchTicket(
    template: NotebookDocument,
    launchTicket: string,
    apiBaseUrl: string,
): NotebookDocument {
    if (!LAUNCH_TICKET_PATTERN.test(launchTicket)) {
        throw new ColabLaunchError('templateInvalid');
    }
    const normalizedApiBaseUrl = normalizeApiBaseUrl(apiBaseUrl);
    if (!normalizedApiBaseUrl) throw new ColabLaunchError('templateInvalid');

    const notebook: unknown = JSON.parse(JSON.stringify(template));
    assertNotebook(notebook);
    const bootstrapCell = notebook.cells.find((cell) => {
        const tags = cell.metadata?.tags;
        return Array.isArray(tags) && tags.includes(COLAB_BOOTSTRAP_TAG);
    });
    if (!bootstrapCell) throw new ColabLaunchError('templateInvalid');

    const replacements = new Map([
        [COLAB_WORKSPACE_PLACEHOLDER, launchTicket],
        [COLAB_API_BASE_URL_PLACEHOLDER, normalizedApiBaseUrl],
    ]);
    const replacePlaceholders = (line: string) => {
        let result = line;
        for (const [placeholder, replacement] of replacements) {
            result = result.replace(placeholder, replacement);
        }
        return result;
    };
    bootstrapCell.source =
        typeof bootstrapCell.source === 'string'
            ? replacePlaceholders(bootstrapCell.source)
            : bootstrapCell.source.map(replacePlaceholders);

    const serializedNotebook = JSON.stringify(notebook);
    if (
        serializedNotebook.includes(COLAB_WORKSPACE_PLACEHOLDER) ||
        serializedNotebook.includes(COLAB_API_BASE_URL_PLACEHOLDER)
    ) {
        throw new ColabLaunchError('templateInvalid');
    }
    return notebook;
}

function normalizeApiBaseUrl(value: string): string | null {
    try {
        const url = new URL(value.trim());
        const localHostname = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
        if (url.protocol !== 'https:' && !(url.protocol === 'http:' && localHostname)) return null;
        if (url.username || url.password || url.search || url.hash) return null;

        const normalized = url.toString().replace(/\/+$/, '');
        return /["\\\r\n]/.test(normalized) ? null : normalized;
    } catch {
        return null;
    }
}

export function buildNotebookFilename(problemTitle: string, problemId: number): string {
    const withoutControlCharacters = Array.from(problemTitle.normalize('NFKC'), (character) => {
        const codePoint = character.codePointAt(0) ?? 0;
        return codePoint <= 31 || codePoint === 127 ? ' ' : character;
    }).join('');
    const cleaned = withoutControlCharacters
        .replace(/[/\\]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const title = Array.from(cleaned || `Problem ${problemId}`)
        .slice(0, 100)
        .join('');
    return `MLCompete - ${title}.ipynb`;
}

function multipartBoundary(): string {
    const random = new Uint8Array(16);
    globalThis.crypto.getRandomValues(random);
    return `mlcompete_${Array.from(random, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export async function uploadPrivateNotebookToDrive(
    accessToken: string,
    notebook: NotebookDocument,
    filename: string,
    fetchImplementation: typeof fetch = fetch,
): Promise<string> {
    if (!accessToken || !filename.endsWith('.ipynb')) {
        throw new ColabLaunchError('driveUpload');
    }

    const boundary = multipartBoundary();
    const notebookJson = `${JSON.stringify(notebook, null, 2)}\n`;
    const metadata = JSON.stringify({
        name: filename,
        mimeType: 'application/x-ipynb+json',
    });
    const body = new Blob([
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
        metadata,
        `\r\n--${boundary}\r\nContent-Type: application/x-ipynb+json\r\n\r\n`,
        notebookJson,
        `\r\n--${boundary}--`,
    ]);

    let response: Response;
    try {
        response = await fetchImplementation(DRIVE_UPLOAD_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body,
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
        });
    } catch {
        throw new ColabLaunchError('driveUpload');
    }
    if (!response.ok) throw new ColabLaunchError('driveUpload');

    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        throw new ColabLaunchError('driveUpload');
    }
    const fileId =
        payload && typeof payload === 'object' && 'id' in payload
            ? (payload as { id?: unknown }).id
            : null;
    if (typeof fileId !== 'string' || !DRIVE_FILE_ID_PATTERN.test(fileId)) {
        throw new ColabLaunchError('driveUpload');
    }
    return fileId;
}

export function buildColabDriveUrl(fileId: string): string {
    if (!DRIVE_FILE_ID_PATTERN.test(fileId)) throw new ColabLaunchError('driveUpload');
    return `https://colab.research.google.com/drive/${encodeURIComponent(fileId)}`;
}
