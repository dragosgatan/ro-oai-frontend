import { describe, expect, it } from 'vitest';

import { normalizeAuthoredHtmlAnchorTargets } from '@/lib/normalize-authored-html';

describe('normalizeAuthoredHtmlAnchorTargets', () => {
    it('keeps the id target but removes empty self-links from the tab order', () => {
        const result = normalizeAuthoredHtmlAnchorTargets(
            '<h2><a href="#section-one" id="section-one"></a>Section one</h2>',
        );

        document.body.innerHTML = result;
        const target = document.getElementById('section-one');

        expect(target).not.toBeNull();
        expect(target?.tagName).toBe('A');
        expect(target?.hasAttribute('href')).toBe(false);
        expect(target?.getAttribute('aria-hidden')).toBe('true');
        expect(target?.tabIndex).toBe(-1);
    });

    it('supports encoded fragments and alternate attribute quoting', () => {
        const result = normalizeAuthoredHtmlAnchorTargets(
            "<a class='anchor' id='section one' tabindex='0' href='#section%20one'>&nbsp;</a>",
        );

        document.body.innerHTML = result;
        const target = document.getElementById('section one');

        expect(target).not.toBeNull();
        expect(target?.className).toBe('anchor');
        expect(target?.hasAttribute('href')).toBe(false);
        expect(target?.getAttribute('tabindex')).toBe('-1');
    });

    it('does not alter real links or empty links that target a different id', () => {
        const html =
            '<a href="#section" id="section">Section</a>' + '<a href="#other" id="section"></a>';

        expect(normalizeAuthoredHtmlAnchorTargets(html)).toBe(html);
    });
});
