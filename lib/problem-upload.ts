export const MAX_PROBLEM_UPLOAD_BYTES = 100 * 1024 * 1024;

// Keep the picker broad because evaluators can define problem-specific formats. The
// explicit list improves the common path, while octet-stream preserves custom formats.
export const SUBMISSION_FILE_ACCEPT = [
    '*/*',
    'text/*',
    'application/json',
    'application/zip',
    'application/x-zip-compressed',
    'application/gzip',
    'application/x-tar',
    'application/x-7z-compressed',
    'application/x-rar-compressed',
    'application/vnd.apache.parquet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream',
    '.csv',
    '.tsv',
    '.jsonl',
    '.npy',
    '.npz',
    '.parquet',
    '.feather',
    '.out',
    '.dat',
    '.bin',
].join(',');

export const SOURCE_FILE_ACCEPT = [
    '*/*',
    'text/*',
    'application/json',
    'application/zip',
    'application/x-zip-compressed',
    'application/gzip',
    'application/x-tar',
    'application/x-7z-compressed',
    'application/x-rar-compressed',
    'application/octet-stream',
    '.ipynb',
    '.py',
    '.r',
    '.jl',
    '.java',
    '.kt',
    '.kts',
    '.cpp',
    '.cc',
    '.cxx',
    '.c',
    '.h',
    '.hpp',
    '.cs',
    '.go',
    '.rs',
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.m',
    '.swift',
    '.scala',
    '.sh',
    '.sql',
    '.yaml',
    '.yml',
    '.toml',
].join(',');

const UNSAFE_EXECUTABLE_EXTENSIONS = new Set([
    'apk',
    'app',
    'com',
    'deb',
    'dmg',
    'dll',
    'exe',
    'msi',
    'pkg',
    'rpm',
    'scr',
]);

const UNSAFE_EXECUTABLE_MIME_TYPES = new Set([
    'application/vnd.android.package-archive',
    'application/vnd.microsoft.portable-executable',
    'application/x-apple-diskimage',
    'application/x-debian-package',
    'application/x-msdos-program',
    'application/x-msdownload',
    'application/x-rpm',
]);

export type ProblemUploadFile = Pick<File, 'name' | 'size' | 'type'>;

export type ProblemUploadValidationError = {
    code: 'empty' | 'too-large' | 'unsafe-type';
    fileName: string;
};

function isUnsafeExecutable(file: ProblemUploadFile): boolean {
    const extension = file.name.split('.').pop()?.toLocaleLowerCase('en') ?? '';
    const mimeType = file.type.toLocaleLowerCase('en');

    return (
        UNSAFE_EXECUTABLE_EXTENSIONS.has(extension) || UNSAFE_EXECUTABLE_MIME_TYPES.has(mimeType)
    );
}

export function validateProblemUploadFiles(
    submissionFile: ProblemUploadFile | null,
    sourceFile: ProblemUploadFile | null,
): ProblemUploadValidationError | null {
    for (const candidate of [submissionFile, sourceFile]) {
        if (!candidate) continue;
        if (candidate.size === 0) return { code: 'empty', fileName: candidate.name };
        if (isUnsafeExecutable(candidate)) {
            return { code: 'unsafe-type', fileName: candidate.name };
        }
    }

    const totalBytes = (submissionFile?.size ?? 0) + (sourceFile?.size ?? 0);
    if (totalBytes > MAX_PROBLEM_UPLOAD_BYTES) {
        const largerFile =
            (submissionFile?.size ?? 0) >= (sourceFile?.size ?? 0) ? submissionFile : sourceFile;
        return { code: 'too-large', fileName: largerFile?.name ?? '' };
    }

    return null;
}

export function formatProblemUploadSize(bytes: number, locale: string): string {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
        return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(bytes / 1024)} KB`;
    }

    const megabytes = bytes / (1024 * 1024);
    return `${new Intl.NumberFormat(locale, {
        maximumFractionDigits: megabytes < 10 ? 1 : 0,
    }).format(megabytes)} MB`;
}
