import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    ArticleSourcePreviewError,
    canPreviewArticleSource,
    loadArticleSourcePreview,
    MAX_ARTICLE_SOURCE_PREVIEW_BYTES,
} from '@/lib/articles/source-preview';

describe('article source preview', () => {
    afterEach(() => vi.restoreAllMocks());

    it('extracts code and markdown cells while omitting notebook outputs', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    cells: [
                        { cell_type: 'markdown', source: ['# Method'] },
                        {
                            cell_type: 'code',
                            source: ['model.fit(X, y)'],
                            outputs: [{ text: ['private output'] }],
                        },
                    ],
                }),
            ),
        );

        const preview = await loadArticleSourcePreview(
            'https://api.example.test/source',
            'solution.ipynb',
        );

        expect(preview).toMatchObject({
            kind: 'notebook',
            cells: [
                { type: 'markdown', source: '# Method' },
                { type: 'code', source: 'model.fit(X, y)' },
            ],
        });
        expect(JSON.stringify(preview)).not.toContain('private output');
    });

    it('rejects binary and oversized previews before presenting them as source', async () => {
        expect(canPreviewArticleSource('weights.npy')).toBe(false);
        await expect(
            loadArticleSourcePreview('https://api.example.test/source', 'weights.npy'),
        ).rejects.toMatchObject({ reason: 'binary' });

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(new Uint8Array([0x66, 0x6f, 0x0c, 0x6f])),
        );
        await expect(
            loadArticleSourcePreview('https://api.example.test/source', 'binary.py'),
        ).rejects.toEqual(new ArticleSourcePreviewError('binary'));

        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response('', {
                headers: {
                    'content-length': String(MAX_ARTICLE_SOURCE_PREVIEW_BYTES + 1),
                },
            }),
        );
        await expect(
            loadArticleSourcePreview('https://api.example.test/source', 'large.py'),
        ).rejects.toEqual(new ArticleSourcePreviewError('tooLarge'));
    });
});
