import { describe, expect, it } from 'vitest';

import { renderLatex } from '@/lib/render-latex';

describe('renderLatex accessibility', () => {
    it('renders localized, keyboard-focusable copy controls when a label is provided', () => {
        document.body.innerHTML = renderLatex('<p>Formula: $$x &lt; y$$</p>', 'Copiază "formula"');

        const formula = document.querySelector<HTMLElement>('[data-latex]');

        expect(formula).not.toBeNull();
        expect(formula?.getAttribute('role')).toBe('button');
        expect(formula?.tabIndex).toBe(0);
        expect(formula?.getAttribute('aria-label')).toBe('Copiază "formula": x < y');
        expect(formula?.getAttribute('title')).toBe('Copiază "formula"');
        expect(formula?.dataset.latex).toBe('x < y');
    });

    it('retains math semantics when no interaction label is supplied', () => {
        document.body.innerHTML = renderLatex('<p>\\(x + y\\)</p>');

        const formula = document.querySelector<HTMLElement>('[data-latex]');

        expect(formula?.getAttribute('role')).toBe('math');
        expect(formula?.hasAttribute('tabindex')).toBe(false);
    });
});
