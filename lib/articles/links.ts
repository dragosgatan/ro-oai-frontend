export type ArticleIndexFilters = {
    authorId?: string;
    problemId?: number;
};

export function buildArticleIndexHref(page: number, filters: ArticleIndexFilters = {}): string {
    const query = new URLSearchParams();
    query.set('page', String(Math.max(1, page)));
    if (filters.authorId) query.set('authorId', filters.authorId);
    if (filters.problemId) query.set('problemId', String(filters.problemId));
    return `/articles?${query.toString()}`;
}
