import type { Problem, ProblemAuthor } from '@/lib/types';

type ProblemAttribution = Pick<Problem, 'author' | 'authors'>;

function clean(value: string | null | undefined): string {
    return value?.trim().replace(/\s+/g, ' ') ?? '';
}

/** Prefer the explicit first-name/last-name snapshot required by attribution. */
export function getProblemAuthorDisplayName(author: ProblemAuthor): string {
    const fullName = [clean(author.firstName), clean(author.lastName)].filter(Boolean).join(' ');
    return fullName || clean(author.displayName);
}

export function getProblemAuthors(problem: ProblemAttribution): ProblemAuthor[] {
    const structured = Array.isArray(problem.authors)
        ? problem.authors
              .map((author, index) => ({
                  ...author,
                  displayName: getProblemAuthorDisplayName(author),
                  displayOrder: author.displayOrder ?? index,
              }))
              .filter((author) => Boolean(author.displayName))
              .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))
        : [];

    if (structured.length > 0) return structured;

    const legacyName = clean(problem.author);
    if (!legacyName) return [];

    return [
        {
            userId: null,
            firstName: null,
            lastName: null,
            displayName: legacyName,
            displayOrder: 0,
        },
    ];
}

export function getProblemAuthorNames(problem: ProblemAttribution): string[] {
    return getProblemAuthors(problem).map((author) => author.displayName);
}

export function formatProblemAuthorNames(problem: ProblemAttribution, locale: string): string {
    return formatProblemAuthorList(getProblemAuthors(problem), locale);
}

export function formatProblemAuthorList(authors: ProblemAuthor[], locale: string): string {
    const names = authors.map(getProblemAuthorDisplayName).filter(Boolean);
    if (names.length <= 1) return names[0] ?? '';

    try {
        return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(names);
    } catch {
        return names.join(', ');
    }
}
