import { describe, expect, it } from 'vitest';

import { buildArticleIndexHref } from '@/lib/articles/links';

describe('article index pagination links', () => {
    it('preserves author and problem scopes without loading an unbounded list', () => {
        expect(
            buildArticleIndexHref(3, {
                authorId: 'user with/slash',
                problemId: 289,
            }),
        ).toBe('/articles?page=3&authorId=user+with%2Fslash&problemId=289');
    });
});
