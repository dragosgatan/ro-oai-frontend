'use client';

import { useMemo } from 'react';
import { ListIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { renderLatex } from '@/lib/render-latex';
import { createLatexClickHandler } from '@/components/latex-content';

/**
 * Represents a heading extracted from HTML content for table of contents.
 */
export type TocHeading = {
    id: string;
    text: string;
    level: number;
};

type PreparedEditorialContent = {
    html: string;
    headings: TocHeading[];
};

function decodeHeadingText(value: string): string {
    const namedEntities: Record<string, string> = {
        amp: '&',
        apos: "'",
        gt: '>',
        lt: '<',
        nbsp: ' ',
        quot: '"',
    };

    return value
        .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
        .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
            String.fromCodePoint(Number.parseInt(code, 16)),
        )
        .replace(/&([a-z]+);/gi, (entity, name: string) => namedEntities[name] ?? entity)
        .replace(/<[^>]+>/g, '')
        .trim();
}

function processEditorialHeadings(
    htmlContent: string,
    demoteForPageHierarchy: boolean,
): PreparedEditorialContent {
    if (!htmlContent || typeof htmlContent !== 'string') {
        return { html: '', headings: [] };
    }

    const headings: TocHeading[] = [];
    const usedIds = new Set<string>();
    let headingIndex = 0;
    const headingRegex = /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi;

    const html = htmlContent.replace(
        headingRegex,
        (_, rawLevel: string, attributes: string, innerHtml: string) => {
            const sourceLevel = Number.parseInt(rawLevel, 10);
            const renderedLevel = demoteForPageHierarchy
                ? Math.min(sourceLevel + 1, 6)
                : sourceLevel;
            const text = decodeHeadingText(innerHtml);
            const existingIdMatch = attributes.match(
                /\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i,
            );
            const requestedId =
                existingIdMatch?.[1] ?? existingIdMatch?.[2] ?? existingIdMatch?.[3] ?? text;
            const baseId = generateSlug(requestedId) || `section-${headingIndex + 1}`;
            let id = baseId;
            let duplicateIndex = 2;

            while (usedIds.has(id)) {
                id = `${baseId}-${duplicateIndex}`;
                duplicateIndex += 1;
            }
            usedIds.add(id);

            if (text) {
                headings.push({ id, text, level: renderedLevel });
            }
            headingIndex += 1;

            const cleanAttributes = attributes.replace(
                /\s+id\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i,
                '',
            );

            return `<h${renderedLevel}${cleanAttributes} id="${id}">${innerHtml}</h${renderedLevel}>`;
        },
    );

    return { html, headings };
}

/**
 * Extracts headings from HTML content to generate a table of contents.
 * Parses h1-h6 tags and extracts their text content and IDs.
 *
 * @param htmlContent - The HTML content to parse
 * @returns Array of TocHeading objects in document order
 */
export function extractHeadings(htmlContent: string): TocHeading[] {
    return processEditorialHeadings(htmlContent, false).headings;
}

export function prepareEditorialContent(htmlContent: string): PreparedEditorialContent {
    return processEditorialHeadings(htmlContent, true);
}

/**
 * Generates a slug from text for use as an ID.
 */
export function generateSlug(text: string): string {
    return text
        .normalize('NFKD')
        .replace(/\p{Mark}/gu, '')
        .toLowerCase()
        .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^[-_]+|[-_]+$/g, '');
}

type TableOfContentsProps = {
    headings: TocHeading[];
};

/**
 * TableOfContents renders a navigable list of headings.
 */
function TableOfContents({ headings }: TableOfContentsProps) {
    const t = useTranslations('editorial');
    const minimumLevel = Math.min(...headings.map((heading) => heading.level));

    if (headings.length === 0) {
        return null;
    }

    return (
        <nav
            aria-labelledby="editorial-toc-heading"
            className="border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] lg:sticky lg:top-24"
        >
            <div className="flex min-h-12 items-center gap-2 border-b border-[var(--platform-line)] px-3 py-2">
                <ListIcon className="h-4 w-4 text-[var(--platform-violet)]" aria-hidden="true" />
                <h3
                    id="editorial-toc-heading"
                    className="text-sm font-bold text-[var(--platform-ink)]"
                >
                    {t('tableOfContents')}
                </h3>
            </div>
            <ol className="max-h-72 overflow-y-auto p-2 text-sm lg:max-h-[60vh]">
                {headings.map((heading, index) => (
                    <li
                        key={`${heading.id}-${index}`}
                        style={{
                            paddingInlineStart: `${(heading.level - minimumLevel) * 0.75}rem`,
                        }}
                    >
                        <a
                            href={`#${heading.id}`}
                            className="flex min-h-11 items-center border border-transparent px-2 py-2 leading-5 text-[var(--platform-ink-muted)] transition-colors duration-200 hover:border-[var(--platform-line)] hover:bg-[var(--platform-paper)] hover:text-[var(--platform-violet-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:hover:text-[var(--platform-violet)]"
                            data-testid="toc-link"
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ol>
        </nav>
    );
}

type EditorialContentProps = {
    content: string;
    showTableOfContents?: boolean;
};

/**
 * EditorialContent renders markdown content (as HTML) with syntax highlighting
 * and optionally generates a table of contents from headings.
 *
 * Requirements: 4.1, 4.4
 */
export function EditorialContent({ content, showTableOfContents = true }: EditorialContentProps) {
    const preparedContent = useMemo(() => prepareEditorialContent(content), [content]);
    const headings = preparedContent.headings;
    const t = useTranslations('common');
    const renderedContent = useMemo(
        () => renderLatex(preparedContent.html, t('clickToCopyFormula')),
        [preparedContent.html, t],
    );
    const onLatexClick = useMemo(() => createLatexClickHandler(t('latexCopied')), [t]);
    const hasHeadings = headings.length > 0;

    return (
        <div
            className={
                hasHeadings && showTableOfContents
                    ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]'
                    : ''
            }
        >
            {hasHeadings && showTableOfContents && (
                <aside className="min-w-0 lg:col-start-2 lg:row-start-1">
                    <TableOfContents headings={headings} />
                </aside>
            )}

            <article
                className="themed-html prose prose-sm min-w-0 max-w-none dark:prose-invert sm:prose-base lg:col-start-1 lg:row-start-1"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
                data-testid="editorial-content"
                onClick={onLatexClick}
            />
        </div>
    );
}
