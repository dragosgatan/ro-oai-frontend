const EMPTY_ANCHOR_PATTERN = /<a\b([^>]*)>(?:\s|&nbsp;|&#160;|&#x0*a0;)*<\/a>/gi;

function getAttribute(attributes: string, name: string): string | null {
    const match = attributes.match(
        new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, 'i'),
    );

    return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function removeAttribute(attributes: string, name: string): string {
    return attributes.replace(
        new RegExp(`\\s+${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s"'=<>]+)`, 'gi'),
        '',
    );
}

function referencesOwnId(href: string, id: string): boolean {
    if (!href.startsWith('#')) return false;

    const fragment = href.slice(1);
    if (fragment === id) return true;

    try {
        return decodeURIComponent(fragment) === id;
    } catch {
        return false;
    }
}

/**
 * Backend-authored Markdown currently emits empty, self-linking anchors before headings.
 * They are useful hash targets, but their href makes every empty anchor an unnamed stop in
 * the keyboard tab order. Keep the anchor and its id so deep links remain stable, while
 * removing only the interactive attributes from genuine self-target markers.
 */
export function normalizeAuthoredHtmlAnchorTargets(html: string): string {
    if (!html.includes('<a')) return html;

    return html.replace(EMPTY_ANCHOR_PATTERN, (anchor, attributes: string) => {
        const id = getAttribute(attributes, 'id');
        const href = getAttribute(attributes, 'href');
        const accessibleName =
            getAttribute(attributes, 'aria-label') ?? getAttribute(attributes, 'title');

        if (!id || !href || accessibleName || !referencesOwnId(href, id)) return anchor;

        const normalizedAttributes = removeAttribute(
            removeAttribute(attributes, 'href'),
            'tabindex',
        );
        const hiddenAttribute = getAttribute(normalizedAttributes, 'aria-hidden')
            ? ''
            : ' aria-hidden="true"';

        return `<a${normalizedAttributes} tabindex="-1"${hiddenAttribute}></a>`;
    });
}
