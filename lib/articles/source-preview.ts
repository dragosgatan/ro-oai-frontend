import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

export const MAX_ARTICLE_SOURCE_PREVIEW_BYTES = 512 * 1024;

const TEXT_SOURCE_EXTENSIONS = new Set([
    'c',
    'cc',
    'cpp',
    'cs',
    'css',
    'csv',
    'go',
    'h',
    'hpp',
    'html',
    'ipynb',
    'java',
    'js',
    'json',
    'jsx',
    'kt',
    'lua',
    'm',
    'md',
    'php',
    'pl',
    'py',
    'r',
    'rb',
    'rs',
    'scala',
    'sh',
    'sql',
    'swift',
    'tex',
    'toml',
    'ts',
    'tsx',
    'txt',
    'xml',
    'yaml',
    'yml',
]);

export type ArticleNotebookCell = {
    type: 'code' | 'markdown';
    source: string;
};

export type ArticleSourcePreview =
    | { kind: 'text'; source: string }
    | { kind: 'notebook'; cells: ArticleNotebookCell[]; copySource: string };

export type ArticleSourcePreviewFailure = 'binary' | 'tooLarge' | 'unavailable';

export class ArticleSourcePreviewError extends Error {
    constructor(public readonly reason: ArticleSourcePreviewFailure) {
        super(reason);
        this.name = 'ArticleSourcePreviewError';
    }
}

function extension(fileName: string): string {
    return fileName.toLocaleLowerCase('en-US').split('.').pop() ?? '';
}

export function canPreviewArticleSource(fileName: string): boolean {
    return TEXT_SOURCE_EXTENSIONS.has(extension(fileName));
}

async function readBoundedBytes(response: Response): Promise<Uint8Array> {
    const advertisedLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(advertisedLength) && advertisedLength > MAX_ARTICLE_SOURCE_PREVIEW_BYTES) {
        throw new ArticleSourcePreviewError('tooLarge');
    }

    if (!response.body) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.byteLength > MAX_ARTICLE_SOURCE_PREVIEW_BYTES) {
            throw new ArticleSourcePreviewError('tooLarge');
        }
        return bytes;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let byteLength = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;
            byteLength += value.byteLength;
            if (byteLength > MAX_ARTICLE_SOURCE_PREVIEW_BYTES) {
                await reader.cancel();
                throw new ArticleSourcePreviewError('tooLarge');
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return bytes;
}

function decodeUtf8(bytes: Uint8Array): string {
    try {
        const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        const controls = Array.from(source).filter((character) => {
            const code = character.charCodeAt(0);
            return code < 9 || (code > 10 && code < 13) || (code > 13 && code < 32);
        }).length;
        if (source.includes('\u0000') || (source.length > 0 && controls / source.length > 0.03)) {
            throw new ArticleSourcePreviewError('binary');
        }
        return source;
    } catch (caught) {
        if (caught instanceof ArticleSourcePreviewError) throw caught;
        throw new ArticleSourcePreviewError('binary');
    }
}

function notebookPreview(source: string): ArticleSourcePreview | null {
    try {
        const notebook = JSON.parse(source) as { cells?: unknown };
        if (!Array.isArray(notebook.cells)) return null;

        const cells = notebook.cells.slice(0, 250).flatMap((candidate): ArticleNotebookCell[] => {
            if (!candidate || typeof candidate !== 'object') return [];
            const raw = candidate as Record<string, unknown>;
            if (raw.cell_type !== 'code' && raw.cell_type !== 'markdown') return [];
            const cellSource = Array.isArray(raw.source)
                ? raw.source.filter((line): line is string => typeof line === 'string').join('')
                : typeof raw.source === 'string'
                  ? raw.source
                  : '';
            return [{ type: raw.cell_type, source: cellSource }];
        });
        if (cells.length === 0) return null;

        return {
            kind: 'notebook',
            cells,
            copySource: cells.map((cell) => cell.source).join('\n\n'),
        };
    } catch {
        return null;
    }
}

export async function loadArticleSourcePreview(
    sourceUrl: string,
    fileName: string,
): Promise<ArticleSourcePreview> {
    if (!canPreviewArticleSource(fileName)) {
        throw new ArticleSourcePreviewError('binary');
    }

    let response: Response;
    try {
        response = await fetchWithTimeout(sourceUrl, {
            cache: 'no-store',
            credentials: 'omit',
            headers: {
                accept: 'text/plain, application/json, application/octet-stream;q=0.5',
            },
            referrerPolicy: 'no-referrer',
        });
    } catch {
        throw new ArticleSourcePreviewError('unavailable');
    }
    if (!response.ok) throw new ArticleSourcePreviewError('unavailable');

    const source = decodeUtf8(await readBoundedBytes(response));
    if (extension(fileName) === 'ipynb') {
        return notebookPreview(source) ?? { kind: 'text', source };
    }
    return { kind: 'text', source };
}
