'use client';

import { toast } from 'sonner';

/**
 * Creates a delegated click handler that copies code from the nearest
 * `.code-block__copy` button. The source is stored in `data-code-source`.
 * The button briefly swaps its label to the "copied" state for instant feedback.
 *
 * @param toastMessage - Translated success message
 */
export function createCodeCopyHandler(toastMessage: string) {
    return (e: React.MouseEvent) => {
        const button = (e.target as HTMLElement).closest<HTMLButtonElement>('.code-block__copy');
        if (!button) return;

        const source = button.dataset.codeSource;
        if (!source) return;

        // Decode the HTML-escaped source back to raw text for clipboard.
        const textarea = document.createElement('textarea');
        textarea.innerHTML = source;
        const text = textarea.value;

        navigator.clipboard
            .writeText(text)
            .then(() => {
                toast.success(toastMessage, { duration: 1500 });

                const labelEl = button.querySelector<HTMLSpanElement>('.code-block__copy-label');
                const originalLabel = button.dataset.copyLabel ?? 'Copy';
                const copiedLabel = button.dataset.copiedLabel ?? 'Copied';

                button.classList.add('code-block__copy--copied');
                if (labelEl) labelEl.textContent = copiedLabel;

                window.setTimeout(() => {
                    button.classList.remove('code-block__copy--copied');
                    if (labelEl) labelEl.textContent = originalLabel;
                }, 1500);
            })
            .catch(() => {
                // Clipboard API rejected (permissions, insecure context). Silently ignore.
            });
    };
}
