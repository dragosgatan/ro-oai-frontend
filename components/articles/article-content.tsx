'use client';

import { useMemo } from 'react';
import { ListTree } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { createCodeCopyHandler } from '@/components/code-block-copy';
import { createLatexClickHandler, createLatexKeyDownHandler } from '@/components/latex-content';
import { normalizeAuthoredHtmlAnchorTargets } from '@/lib/normalize-authored-html';
import { renderCodeBlocks } from '@/lib/render-code-blocks';
import { renderLatex } from '@/lib/render-latex';

type Heading = { id: string; level: number; text: string };

const EXTERNAL_IMAGE_PATTERN = /<img\b([^>]*?)\bsrc=(["'])(https:\/\/[^"']+)\2([^>]*)>/gi;

function proxyExternalArticleImages(source: string): string {
    return source.replace(
        EXTERNAL_IMAGE_PATTERN,
        (_match, before: string, quote: string, encodedSource: string, after: string) => {
            const externalSource = encodedSource.replaceAll('&amp;', '&');
            let imageTarget = externalSource;
            try {
                const parsedSource = new URL(externalSource);
                const nestedTarget =
                    parsedSource.pathname === '/_next/image'
                        ? parsedSource.searchParams.get('url')
                        : null;
                if (nestedTarget && new URL(nestedTarget).protocol === 'https:') {
                    // Normalize an absolute backend optimizer URL back to one
                    // local optimizer hop. The outer host is never trusted.
                    imageTarget = nestedTarget;
                }
            } catch {
                // Sanitized backend HTML contains absolute HTTPS image URLs.
            }
            const proxiedSource = `/_next/image?url=${encodeURIComponent(imageTarget)}&amp;w=1600&amp;q=80`;
            const attributes = `${before}src=${quote}${proxiedSource}${quote}${after}`.replace(
                /\s(?:srcset|loading|decoding|referrerpolicy)=(?:"[^"]*"|'[^']*')/gi,
                '',
            );

            // Readers contact only our same-origin, cached image optimizer. The
            // contributor-controlled host never receives their IP or referrer.
            return `<img${attributes} loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
        },
    );
}

function plainText(value: string): string {
    return value
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

function slugify(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/\p{Mark}/gu, '')
        .toLowerCase()
        .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export function prepareArticleHtml(source: string): { html: string; headings: Heading[] } {
    const headings: Heading[] = [];
    const usedIds = new Set<string>();
    let index = 0;

    const normalized = proxyExternalArticleImages(source).replace(
        /<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi,
        (_, rawLevel: string, attributes: string, innerHtml: string) => {
            const level = Math.min(Number(rawLevel) + 1, 6);
            const text = plainText(innerHtml);
            const idMatch = attributes.match(/\sid=(?:"([^"]+)"|'([^']+)')/i);
            const requestedId = idMatch?.[1] ?? idMatch?.[2] ?? text;
            const baseId = slugify(requestedId) || `section-${index + 1}`;
            let id = baseId;
            let duplicate = 2;
            while (usedIds.has(id)) id = `${baseId}-${duplicate++}`;
            usedIds.add(id);
            if (text) headings.push({ id, level, text });
            index += 1;

            const cleanAttributes = attributes.replace(/\s+id=(?:"[^"]+"|'[^']+')/i, '');
            return `<h${level}${cleanAttributes} id="${id}">${innerHtml}</h${level}>`;
        },
    );

    return { html: normalized, headings };
}

export function ArticleContent({ html, language }: { html: string; language?: string }) {
    const t = useTranslations('articles');
    const tCommon = useTranslations('common');
    const prepared = useMemo(() => prepareArticleHtml(html), [html]);
    const renderedHtml = useMemo(() => {
        const withCode = renderCodeBlocks(prepared.html, {
            copy: tCommon('copyCode'),
            copied: tCommon('codeCopied'),
        });
        return normalizeAuthoredHtmlAnchorTargets(
            renderLatex(withCode, tCommon('clickToCopyFormula')),
        );
    }, [prepared.html, tCommon]);
    const onCodeCopy = useMemo(() => createCodeCopyHandler(tCommon('codeCopied')), [tCommon]);
    const onLatexClick = useMemo(() => createLatexClickHandler(tCommon('latexCopied')), [tCommon]);
    const onLatexKeyDown = useMemo(
        () => createLatexKeyDownHandler(tCommon('latexCopied')),
        [tCommon],
    );

    return (
        <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_17rem]">
            <article
                lang={language}
                className="themed-html min-w-0 max-w-[76ch] text-[var(--platform-ink)] xl:col-start-1 xl:row-start-1 [&_h2]:scroll-mt-28 [&_h3]:scroll-mt-28"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                onClick={(event) => {
                    onCodeCopy(event);
                    onLatexClick(event);
                }}
                onKeyDown={onLatexKeyDown}
            />

            {prepared.headings.length > 1 ? (
                <aside className="min-w-0 xl:col-start-2 xl:row-start-1">
                    <nav
                        aria-labelledby="article-toc-heading"
                        className="border-y border-[var(--platform-line-strong)] py-4 xl:sticky xl:top-24 xl:border"
                    >
                        <h2
                            id="article-toc-heading"
                            className="flex items-center gap-2 px-3 text-sm font-bold text-[var(--platform-ink)]"
                        >
                            <ListTree
                                className="h-4 w-4 text-[var(--platform-violet)]"
                                aria-hidden="true"
                            />
                            {t('tableOfContents')}
                        </h2>
                        <ol className="mt-3 max-h-[55dvh] overflow-y-auto px-2">
                            {prepared.headings.map((heading) => (
                                <li
                                    key={heading.id}
                                    style={{
                                        paddingInlineStart: `${Math.max(0, heading.level - 2) * 10}px`,
                                    }}
                                >
                                    <a
                                        href={`#${heading.id}`}
                                        className="flex min-h-11 items-center px-2 py-2 text-sm leading-5 text-[var(--platform-ink-muted)] transition-colors hover:bg-[var(--platform-paper-strong)] hover:text-[var(--platform-violet-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:hover:text-[var(--platform-violet)]"
                                    >
                                        {heading.text}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                </aside>
            ) : null}
        </div>
    );
}
