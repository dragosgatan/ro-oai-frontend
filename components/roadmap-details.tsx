'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { BookOpen, ChevronDown } from 'lucide-react';
import { renderLatex } from '@/lib/render-latex';
import { renderCodeBlocks } from '@/lib/render-code-blocks';
import { createLatexClickHandler, createLatexKeyDownHandler } from '@/components/latex-content';
import { createCodeCopyHandler } from '@/components/code-block-copy';
import { cn } from '@/lib/utils';
import { normalizeAuthoredHtmlAnchorTargets } from '@/lib/normalize-authored-html';

export type RoadmapTreeEntry = {
    id: number;
    title: string;
    slug?: string | null;
    children: RoadmapTreeEntry[];
};

export type RoadmapPagePublicResponse = {
    title: string;
    slug: string;
    html: string;
};

/** Pixels reserved at the top of the viewport when scrolling to a heading. */
const SCROLL_OFFSET_PX = 96;

const roadmapSurfaceVariables = {
    '--roadmap-paper': 'var(--platform-paper, hsl(var(--background)))',
    '--roadmap-paper-strong': 'var(--platform-paper-strong, hsl(var(--muted)))',
    '--roadmap-ink': 'var(--platform-ink, hsl(var(--foreground)))',
    '--roadmap-ink-muted': 'var(--platform-ink-muted, hsl(var(--muted-foreground)))',
    '--roadmap-violet': 'var(--platform-violet, hsl(var(--primary)))',
    '--roadmap-citron': 'var(--platform-citron, hsl(var(--warning)))',
    '--roadmap-coral': 'var(--platform-coral, hsl(var(--destructive)))',
    '--roadmap-on-accent': 'var(--platform-on-accent, hsl(var(--foreground)))',
    '--roadmap-line': 'var(--platform-line, hsl(var(--border)))',
    '--roadmap-line-strong': 'var(--platform-line-strong, hsl(var(--input)))',
} as React.CSSProperties;

function countTreeNodes(nodes: RoadmapTreeEntry[]): number {
    return nodes.reduce((count, node) => count + 1 + countTreeNodes(node.children ?? []), 0);
}

function NavTree({
    nodes,
    activeSlug,
    locale,
    onNavigate,
    depth = 0,
}: {
    nodes: RoadmapTreeEntry[];
    activeSlug: string;
    locale: string;
    onNavigate?: () => void;
    depth?: number;
}) {
    return (
        <ul
            className={
                depth === 0
                    ? 'space-y-1'
                    : 'ms-3 mt-1 space-y-1 border-s border-[var(--roadmap-line)] ps-3'
            }
        >
            {nodes.map((node) => {
                const slug = node.slug?.trim();
                const isActive = slug === activeSlug;
                const itemClassName = cn(
                    'flex min-h-11 items-center gap-3 border px-3 py-2 text-sm font-semibold leading-snug transition-[background-color,border-color,color,transform] duration-200 ease-out active:translate-y-px',
                    isActive
                        ? 'border-[var(--roadmap-violet)] bg-[var(--roadmap-citron)] text-[var(--roadmap-on-accent)]'
                        : slug
                          ? 'border-transparent text-[var(--roadmap-ink-muted)] hover:border-[var(--roadmap-line-strong)] hover:bg-[var(--roadmap-paper-strong)] hover:text-[var(--roadmap-ink)]'
                          : 'cursor-default border-transparent text-[var(--roadmap-ink-muted)]',
                );
                const itemContent = (
                    <>
                        <span
                            className={cn(
                                'h-2 w-2 shrink-0',
                                isActive
                                    ? 'bg-[var(--roadmap-violet)]'
                                    : 'bg-[var(--roadmap-line-strong)]',
                            )}
                            aria-hidden="true"
                        />
                        {node.title}
                    </>
                );

                return (
                    <li key={node.id}>
                        {slug ? (
                            <a
                                href={`/${locale}/roadmap/${encodeURIComponent(slug)}`}
                                className={itemClassName}
                                aria-current={isActive ? 'page' : undefined}
                                onClick={onNavigate}
                            >
                                {itemContent}
                            </a>
                        ) : (
                            <span className={itemClassName}>{itemContent}</span>
                        )}
                        {node.children?.length ? (
                            <NavTree
                                nodes={node.children}
                                activeSlug={activeSlug}
                                locale={locale}
                                onNavigate={onNavigate}
                                depth={depth + 1}
                            />
                        ) : null}
                    </li>
                );
            })}
        </ul>
    );
}

/** Decodes a hash like "#4-segmentarea-imaginilor" into its raw form. */
function decodeHash(hash: string): string {
    if (!hash) return '';
    try {
        return decodeURIComponent(hash.replace(/^#/, ''));
    } catch {
        return hash.replace(/^#/, '');
    }
}

/**
 * Scrolls a target element into view with a fixed top offset and a brief
 * highlight pulse — gives users a clear "you are here" cue.
 */
function scrollToTarget(el: HTMLElement, smooth: boolean) {
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX;
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });

    // Remove any previous highlight, then trigger animation.
    el.classList.remove('roadmap-anchor-pulse');
    // Force reflow so the animation restarts even if the same heading is re-targeted.
    void el.offsetWidth;
    el.classList.add('roadmap-anchor-pulse');
    window.setTimeout(() => el.classList.remove('roadmap-anchor-pulse'), 2000);
}

export default function RoadmapDetails({
    page,
    tree,
    showTitle = true,
}: {
    page: RoadmapPagePublicResponse;
    tree: RoadmapTreeEntry[];
    showTitle?: boolean;
}) {
    const tCommon = useTranslations('common');
    const tNavigation = useTranslations('navigation');
    const locale = useLocale();
    const articleRef = useRef<HTMLElement>(null);
    const mobileNavigationRef = useRef<HTMLDetailsElement>(null);
    const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
    const hasNavigation = countTreeNodes(tree) > 1;
    const closeMobileNavigation = () => {
        mobileNavigationRef.current?.removeAttribute('open');
    };

    // Same pipeline as problem descriptions: render code blocks first so that
    // LaTeX processing skips the <pre><code> content produced here.
    const renderedHtml = useMemo(() => {
        // The shell owns the single page h1; API-authored h1 elements are article sections.
        const normalizedHeadings = page.html.replace(/<(\/?)h1(\b[^>]*)>/gi, '<$1h2$2>');
        const withCode = renderCodeBlocks(normalizedHeadings, {
            copy: tCommon('copyCode'),
            copied: tCommon('codeCopied'),
        });
        return normalizeAuthoredHtmlAnchorTargets(
            renderLatex(withCode, tCommon('clickToCopyFormula')),
        );
    }, [page.html, tCommon]);

    const onCodeCopy = useMemo(() => createCodeCopyHandler(tCommon('codeCopied')), [tCommon]);
    const onLatexClick = useMemo(() => createLatexClickHandler(tCommon('latexCopied')), [tCommon]);
    const onLatexKeyDown = useMemo(
        () => createLatexKeyDownHandler(tCommon('latexCopied')),
        [tCommon],
    );

    /**
     * Click handler for the article: combines code-block copy, LaTeX click,
     * and intercepts in-page anchor links to give them smooth-scroll +
     * pulse-highlight behaviour and update the URL hash.
     */
    const onContentClick = useMemo(
        () => (e: React.MouseEvent) => {
            const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
            if (link && articleRef.current) {
                const rawHash = link.getAttribute('href')!.slice(1);
                if (rawHash) {
                    const decodedId = decodeHash('#' + rawHash);
                    const target =
                        articleRef.current.querySelector<HTMLElement>(
                            `[id="${CSS.escape(decodedId)}"]`,
                        ) ?? document.getElementById(decodedId);
                    if (target) {
                        e.preventDefault();
                        scrollToTarget(target, true);
                        // Update URL without full navigation.
                        window.history.replaceState(null, '', '#' + rawHash);
                        setActiveHeadingId(decodedId);
                        return;
                    }
                }
            }
            onCodeCopy(e);
            onLatexClick(e);
        },
        [onCodeCopy, onLatexClick],
    );

    /**
     * On mount and whenever the rendered HTML changes, scroll to the hash
     * present in the URL. This handles the case where the page is opened
     * directly with `#section` — the markdown is injected via
     * dangerouslySetInnerHTML after the initial paint, so the browser's
     * native scroll-to-hash has already failed by the time the heading
     * exists in the DOM.
     */
    useEffect(() => {
        if (!articleRef.current) return;
        const hash = window.location.hash;
        if (!hash) return;

        const decodedId = decodeHash(hash);
        if (!decodedId) return;

        // Two attempts: first immediately (works when content was cached),
        // then after a frame to catch images/fonts that affect layout height.
        const tryScroll = (smooth: boolean) => {
            const target =
                articleRef.current?.querySelector<HTMLElement>(`[id="${CSS.escape(decodedId)}"]`) ??
                document.getElementById(decodedId);
            if (target) {
                scrollToTarget(target, smooth);
                setActiveHeadingId(decodedId);
                return true;
            }
            return false;
        };

        if (!tryScroll(false)) {
            const raf = window.requestAnimationFrame(() => {
                if (!tryScroll(false)) {
                    // Final attempt after a tick — gives images/fonts time to load.
                    window.setTimeout(() => tryScroll(false), 200);
                }
            });
            return () => window.cancelAnimationFrame(raf);
        }
    }, [renderedHtml]);

    /**
     * Track which heading is currently active in the viewport so we can
     * highlight the matching cuprins entry. Uses IntersectionObserver with
     * a top-rootMargin equal to the scroll offset so the heading becomes
     * "active" the moment it crosses the offset line.
     */
    useEffect(() => {
        if (!articleRef.current || typeof IntersectionObserver === 'undefined') return;
        const headings = Array.from(
            articleRef.current.querySelectorAll<HTMLHeadingElement>(
                'h1[id], h2[id], h3[id], h4[id]',
            ),
        );
        if (headings.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                // Pick the topmost heading that is currently intersecting.
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) {
                    setActiveHeadingId(visible[0].target.id);
                }
            },
            {
                rootMargin: `-${SCROLL_OFFSET_PX}px 0px -70% 0px`,
                threshold: [0, 1],
            },
        );

        headings.forEach((h) => observer.observe(h));
        return () => observer.disconnect();
    }, [renderedHtml]);

    return (
        <div className="mt-10" style={roadmapSurfaceVariables}>
            {hasNavigation && (
                <details
                    key={page.slug}
                    ref={mobileNavigationRef}
                    className="platform-panel group mb-7 border border-[var(--roadmap-line-strong)] bg-[var(--roadmap-paper)] shadow-[6px_6px_0_var(--roadmap-line)] lg:hidden"
                >
                    <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-bold text-[var(--roadmap-ink)] [&::-webkit-details-marker]:hidden">
                        <BookOpen
                            className="h-5 w-5 text-[var(--roadmap-violet)]"
                            aria-hidden="true"
                        />
                        {tNavigation('roadmap')}
                        <ChevronDown
                            className="ms-auto h-4 w-4 group-open:rotate-180"
                            aria-hidden="true"
                        />
                    </summary>
                    <nav
                        aria-label={tNavigation('roadmap')}
                        className="max-h-[60dvh] overflow-y-auto border-t border-[var(--roadmap-line)] p-3"
                    >
                        <NavTree
                            nodes={tree}
                            activeSlug={page.slug}
                            locale={locale}
                            onNavigate={closeMobileNavigation}
                        />
                    </nav>
                </details>
            )}

            <div
                className={cn(
                    'items-start',
                    hasNavigation && 'lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12',
                )}
            >
                {hasNavigation && (
                    <aside className="platform-panel sticky top-24 hidden max-h-[calc(100dvh-7rem)] self-start overflow-hidden border border-[var(--roadmap-line-strong)] bg-[var(--roadmap-paper)] shadow-[6px_6px_0_var(--roadmap-line)] lg:block">
                        <div className="flex min-h-14 items-center gap-3 border-b border-[var(--roadmap-line-strong)] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--roadmap-ink-muted)]">
                            <BookOpen
                                className="h-4 w-4 text-[var(--roadmap-violet)]"
                                aria-hidden="true"
                            />
                            {tNavigation('roadmap')}
                        </div>
                        <nav
                            aria-label={tNavigation('roadmap')}
                            className="max-h-[calc(100dvh-10.5rem)] overflow-y-auto p-3"
                        >
                            <NavTree nodes={tree} activeSlug={page.slug} locale={locale} />
                        </nav>
                    </aside>
                )}

                <div className="min-w-0">
                    {showTitle && (
                        <div className="mb-8 border-b border-[var(--roadmap-line-strong)] pb-6">
                            <h1 className="text-balance text-3xl font-bold tracking-[-0.04em] text-[var(--roadmap-ink)] sm:text-4xl">
                                {page.title}
                            </h1>
                        </div>
                    )}
                    <article
                        ref={articleRef}
                        className="themed-html mx-auto max-w-[78ch] border-t border-[var(--roadmap-line)] pt-8 [&_a]:decoration-[var(--roadmap-coral)] [&_a]:decoration-2 [&_blockquote]:border [&_blockquote]:border-[var(--roadmap-coral)] [&_blockquote]:bg-[var(--roadmap-paper-strong)] [&_blockquote]:p-4 [&_h2]:border-b [&_h2]:border-[var(--roadmap-line)] [&_h2]:pb-3 [&_table]:border [&_table]:border-[var(--roadmap-line-strong)]"
                        data-active-heading={activeHeadingId ?? undefined}
                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                        onClick={onContentClick}
                        onKeyDown={onLatexKeyDown}
                    />
                </div>
            </div>
        </div>
    );
}
