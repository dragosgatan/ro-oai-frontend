'use client';

import { useState } from 'react';
import { UsersIcon, BookOpenIcon } from 'lucide-react';
import type { EditorialResponse, EditorialAuthorResponse } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { EditorialAuthorCard } from './editorial-author-card';
import { EditorialContent } from './editorial-content';
import { FeaturedSolutionsSection } from './featured-solutions-section';
import { SourceCodeModal } from './source-code-modal';

type EditorialTabProps = {
    editorial: EditorialResponse;
};

/**
 * EditorialTab combines the authors section, main content, and featured solutions
 * into a cohesive editorial view. The authors section always precedes the content.
 *
 * Requirements: 4.3
 */
export function EditorialTab({ editorial }: EditorialTabProps) {
    const t = useTranslations('editorial');
    const [sourceModalOpen, setSourceModalOpen] = useState(false);
    const [selectedAuthor, setSelectedAuthor] = useState<EditorialAuthorResponse | null>(null);

    const hasAuthors = editorial.authors && editorial.authors.length > 0;

    const handleViewAuthorSource = (author: EditorialAuthorResponse) => {
        // Find the featured solution for this author to get their source files
        const solution = editorial.featuredSolutions?.find((s) => s.userId === author.userId);
        if (solution && solution.sourceFiles.length > 0) {
            setSelectedAuthor(author);
            setSourceModalOpen(true);
        }
    };

    const getAuthorSourceFiles = () => {
        if (!selectedAuthor) return [];
        const solution = editorial.featuredSolutions?.find(
            (s) => s.userId === selectedAuthor.userId,
        );
        return solution?.sourceFiles || [];
    };

    return (
        <div className="space-y-8 text-[var(--platform-ink)]" data-testid="editorial-tab">
            {hasAuthors && (
                <section
                    className="platform-panel overflow-hidden"
                    aria-labelledby="editorial-authors-heading"
                    data-testid="authors-section"
                >
                    <header className="platform-toolbar flex items-center gap-3 px-4 py-4 sm:px-6">
                        <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                            <UsersIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <h2
                            id="editorial-authors-heading"
                            className="text-lg font-bold tracking-[-0.03em]"
                        >
                            {t('authors')}
                        </h2>
                    </header>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3">
                        {editorial.authors.map((author) => {
                            const sourceFiles =
                                editorial.featuredSolutions?.find(
                                    (solution) => solution.userId === author.userId,
                                )?.sourceFiles ?? [];

                            return (
                                <EditorialAuthorCard
                                    key={author.id}
                                    author={author}
                                    onViewSource={
                                        author.hasSourceCode && sourceFiles.length > 0
                                            ? () => handleViewAuthorSource(author)
                                            : undefined
                                    }
                                />
                            );
                        })}
                    </div>
                </section>
            )}

            <section
                className="platform-panel overflow-hidden"
                aria-labelledby="editorial-content-heading"
                data-testid="content-section"
            >
                <header className="platform-toolbar flex items-center gap-3 px-4 py-4 sm:px-6">
                    <span className="grid h-11 w-11 shrink-0 place-items-center border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-[var(--platform-violet)]">
                        <BookOpenIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2
                        id="editorial-content-heading"
                        className="text-lg font-bold tracking-[-0.03em]"
                    >
                        {t('editorialContent')}
                    </h2>
                </header>
                <div className="px-4 py-5 sm:px-6 sm:py-7">
                    <EditorialContent content={editorial.content} />
                </div>
            </section>

            <FeaturedSolutionsSection solutions={editorial.featuredSolutions} />

            <SourceCodeModal
                files={getAuthorSourceFiles()}
                isOpen={sourceModalOpen}
                onClose={() => {
                    setSourceModalOpen(false);
                    setSelectedAuthor(null);
                }}
                authorName={selectedAuthor?.username}
            />
        </div>
    );
}
