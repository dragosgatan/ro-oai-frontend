import { describe, expect, it } from 'vitest';

import {
    MAX_PROBLEM_UPLOAD_BYTES,
    formatProblemUploadSize,
    validateProblemUploadFiles,
} from './problem-upload';

const file = (name: string, size: number, type = '') => ({ name, size, type });

describe('problem upload validation', () => {
    it('accepts custom evaluator formats within the backend request limit', () => {
        expect(validateProblemUploadFiles(file('predictions.custom', 1024), null)).toBeNull();
    });

    it('rejects empty files', () => {
        expect(validateProblemUploadFiles(file('predictions.csv', 0, 'text/csv'), null)).toEqual({
            code: 'empty',
            fileName: 'predictions.csv',
        });
    });

    it('rejects unsafe executable packages by extension and MIME type', () => {
        expect(validateProblemUploadFiles(file('payload.exe', 100), null)?.code).toBe(
            'unsafe-type',
        );
        expect(
            validateProblemUploadFiles(
                file('payload', 100, 'application/vnd.microsoft.portable-executable'),
                null,
            )?.code,
        ).toBe('unsafe-type');
    });

    it('enforces the backend limit across both multipart files', () => {
        expect(
            validateProblemUploadFiles(
                file('predictions.csv', MAX_PROBLEM_UPLOAD_BYTES - 10),
                file('solution.py', 11),
            )?.code,
        ).toBe('too-large');
    });

    it('formats selected file sizes for the current locale', () => {
        expect(formatProblemUploadSize(1536 * 1024, 'en')).toBe('1.5 MB');
        expect(formatProblemUploadSize(1536, 'en')).toBe('2 KB');
        expect(formatProblemUploadSize(512, 'ro')).toBe('512 B');
    });
});
