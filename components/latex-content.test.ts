import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLatexKeyDownHandler } from '@/components/latex-content';

const { successToast } = vi.hoisted(() => ({ successToast: vi.fn() }));

vi.mock('sonner', () => ({
    toast: { success: successToast },
}));

describe('LaTeX keyboard interaction', () => {
    const writeText = vi.fn();

    beforeEach(() => {
        document.body.innerHTML =
            '<div id="content"><span role="button" tabindex="0" data-latex="x+y">formula</span></div>';
        writeText.mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '';
    });

    it.each(['Enter', ' '])('copies with the %j key and prevents browser defaults', (key) => {
        const formula = document.querySelector<HTMLElement>('[data-latex]')!;
        const event = {
            key,
            target: formula,
            preventDefault: vi.fn(),
        } as unknown as ReactKeyboardEvent;

        createLatexKeyDownHandler('Copiat')(event);

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(writeText).toHaveBeenCalledWith('x+y');
        expect(successToast).toHaveBeenCalledWith('Copiat', { duration: 1500 });
    });

    it('ignores keys that do not activate a button', () => {
        const formula = document.querySelector<HTMLElement>('[data-latex]')!;
        const event = {
            key: 'ArrowRight',
            target: formula,
            preventDefault: vi.fn(),
        } as unknown as ReactKeyboardEvent;

        createLatexKeyDownHandler('Copiat')(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(writeText).not.toHaveBeenCalled();
    });
});
