'use client';

import { toast } from 'sonner';

function getLatexElement(target: EventTarget | null): HTMLElement | null {
    return target instanceof Element ? target.closest<HTMLElement>('[data-latex]') : null;
}

function copyLatex(element: HTMLElement, toastMessage: string) {
    if (!element.dataset.latex) return;

    void navigator.clipboard.writeText(element.dataset.latex);
    toast.success(toastMessage, { duration: 1500 });
}

/**
 * Creates a click handler that copies LaTeX source from data-latex attributes.
 * @param toastMessage - Translated success message to show after copying
 */
export function createLatexClickHandler(toastMessage: string) {
    return (e: React.MouseEvent) => {
        const element = getLatexElement(e.target);
        if (element) copyLatex(element, toastMessage);
    };
}

/** Enables the delegated LaTeX copy affordance for keyboard users. */
export function createLatexKeyDownHandler(toastMessage: string) {
    return (e: React.KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;

        const element = getLatexElement(e.target);
        if (!element || element.getAttribute('role') !== 'button') return;

        e.preventDefault();
        copyLatex(element, toastMessage);
    };
}
