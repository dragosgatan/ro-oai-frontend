import { Fragment } from 'react';

import { Link } from '@/i18n/routing';
import { getProblemAuthors } from '@/lib/problem-authors';
import { getProfileUrl } from '@/lib/profile-utils';
import type { Problem } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ProblemAuthors({
    problem,
    label,
    className,
}: {
    problem: Pick<Problem, 'author' | 'authors'>;
    label: string;
    className?: string;
}) {
    const authors = getProblemAuthors(problem);
    if (authors.length === 0) return null;

    return (
        <span className={cn('inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-1', className)}>
            <span>{label}:</span>
            <strong className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-1" dir="auto">
                {authors.map((author, index) => (
                    <Fragment key={`${author.userId ?? author.displayName}-${index}`}>
                        {index > 0 ? <span>,</span> : null}
                        {author.userId ? (
                            <Link
                                href={getProfileUrl(author.userId, author.username)}
                                className="font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 hover:text-[var(--platform-violet)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)]"
                            >
                                {author.displayName}
                            </Link>
                        ) : (
                            <span>{author.displayName}</span>
                        )}
                    </Fragment>
                ))}
            </strong>
        </span>
    );
}
