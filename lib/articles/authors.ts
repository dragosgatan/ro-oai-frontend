import type { ArticleAuthor } from '@/lib/articles/types';

const DEFAULT_AUTHOR_NAME = 'Contributor';

export function getArticleAuthorName(
    author: ArticleAuthor,
    fallback = DEFAULT_AUTHOR_NAME,
): string {
    const displayName = author.displayName?.trim();
    if (displayName) return displayName;

    const username = author.username?.trim();
    if (username) return username;

    return fallback;
}
