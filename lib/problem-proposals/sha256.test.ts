import { describe, expect, it } from 'vitest';

import { IncrementalSha256, sha256Blob, sha256Text } from '@/lib/problem-proposals';

describe('incremental problem proposal SHA-256', () => {
    it('matches the standard SHA-256 vectors', () => {
        expect(sha256Text('')).toBe(
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        );
        expect(sha256Text('abc')).toBe(
            'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        );
    });

    it('produces the same digest across arbitrary chunk boundaries', () => {
        const bytes = new TextEncoder().encode('a secure proposal upload'.repeat(1000));
        const hasher = new IncrementalSha256();
        for (let offset = 0; offset < bytes.length; offset += 37) {
            hasher.update(bytes.subarray(offset, offset + 37));
        }
        expect(hasher.hexDigest()).toBe(sha256Text(new TextDecoder().decode(bytes)));
    });

    it('hashes blobs incrementally and reports progress', async () => {
        const progress: number[] = [];
        const blob = new Blob(['abc'.repeat(100_000)]);
        await expect(
            sha256Blob(blob, {
                chunkSize: 64 * 1024,
                onProgress: (completed) => progress.push(completed),
            }),
        ).resolves.toBe('a77aedfe2e4a7232ea628a71745a966224c4521d93134b993cde5b65ea2f6e3c');
        expect(progress.length).toBeGreaterThan(1);
        expect(progress.at(-1)).toBe(blob.size);
    });
});
