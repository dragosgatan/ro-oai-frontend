import '@testing-library/jest-dom/vitest';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { GENDER_BIAS_EDITORIAL_MARKDOWN } from '@/components/articles/__fixtures__/gender-bias-editorial-markdown';
import {
    ArticleRichTextEditorClient,
    shouldApplyMdxEditorChange,
} from '@/components/articles/article-rich-text-editor.client';

describe('article rich-text editor Markdown compatibility', () => {
    it('keeps the supplied editorial byte-for-byte when MDXEditor initially normalizes it', () => {
        let controlledMarkdown = GENDER_BIAS_EDITORIAL_MARKDOWN;
        const serializerCandidate = GENDER_BIAS_EDITORIAL_MARKDOWN.replace('```text', '``` text');

        if (shouldApplyMdxEditorChange(true)) controlledMarkdown = serializerCandidate;

        expect(controlledMarkdown).toBe(GENDER_BIAS_EDITORIAL_MARKDOWN);
        expect(controlledMarkdown).toContain('# Editorial: "Gender biases shall not pass"');
        expect(controlledMarkdown).toContain('```python');
        expect(controlledMarkdown).toContain(String.raw`$$ \hat{d} = \frac{d}{||d||_2} $$`);
        expect(controlledMarkdown).toContain(String.raw`\mathbb{R}^{N \times 512}`);
    });

    it('initializes the visual editor with headings, fenced code and LaTeX intact', async () => {
        const onChange = vi.fn();
        const onError = vi.fn();
        const { container } = render(
            <ArticleRichTextEditorClient
                markdown={GENDER_BIAS_EDITORIAL_MARKDOWN}
                onChange={onChange}
                imageUploadHandler={vi.fn()}
                labelId="editorial-body"
                placeholder="Write"
                locale="ro"
                onError={onError}
            />,
        );

        await waitFor(() =>
            expect(container.querySelector('[contenteditable="true"]')).toHaveAttribute(
                'aria-labelledby',
                'editorial-body',
            ),
        );
        expect(onError).not.toHaveBeenCalled();
        // Initial serializer normalization is deliberately ignored by the controlled form.
        expect(onChange).not.toHaveBeenCalled();
    });

    it('opens the source fallback without mutating legacy HTML when rich parsing fails', async () => {
        const legacySource = `<script>alert('test')</script>\n\n# Safe heading\n\n<Broken value={`;
        const onChange = vi.fn();
        const onError = vi.fn();
        const { container } = render(
            <ArticleRichTextEditorClient
                markdown={legacySource}
                onChange={onChange}
                imageUploadHandler={vi.fn()}
                labelId="legacy-body"
                placeholder="Write"
                locale="en"
                onError={onError}
            />,
        );

        await waitFor(() => expect(onError).toHaveBeenCalled());
        await waitFor(() => expect(container.querySelector('.cm-editor')).toBeInTheDocument());
        expect(onChange).not.toHaveBeenCalled();
        expect(legacySource).toContain(`<script>alert('test')</script>`);
    });

    it('offers managed file upload only and sends the selected file through the upload handler', async () => {
        const user = userEvent.setup();
        const imageUploadHandler = vi
            .fn()
            .mockResolvedValue('/article-media/8e1327fe-5678-4abc-9abc-123456789012');
        const { container } = render(
            <ArticleRichTextEditorClient
                markdown=""
                onChange={vi.fn()}
                imageUploadHandler={imageUploadHandler}
                labelId="image-body"
                placeholder="Write"
                locale="en"
            />,
        );

        await user.click(await screen.findByRole('button', { name: 'Insert image' }));
        const fileInput = screen.getByLabelText('Upload a PNG or JPEG from your device');
        expect(fileInput).toHaveAttribute('type', 'file');
        expect(fileInput).toHaveAttribute('accept', 'image/png,image/jpeg,.png,.jpg,.jpeg');
        expect(container.querySelector('input[name="src"]')).not.toBeInTheDocument();
        expect(screen.queryByText(/URL|web address|paste an image src/i)).not.toBeInTheDocument();

        const image = new File(['png'], 'projection.png', { type: 'image/png' });
        await user.upload(fileInput, image);
        await user.click(screen.getByRole('button', { name: 'Add image' }));

        await waitFor(() => expect(imageUploadHandler).toHaveBeenCalledWith(image));
    });
});

describe('article rich-text editor code-block escape regressions', () => {
    it('does not give inline CodeMirror blocks the full source-editor minimum height', () => {
        const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
        const fullHeightCodeMirrorSelectors = Array.from(
            css.matchAll(/([^{}]+)\{([^{}]*min-height:\s*(?:30|38)rem;?[^{}]*)\}/gu),
        )
            .flatMap((match) => match[1].split(','))
            .map((selector) => selector.trim())
            .filter((selector) => selector.includes('.cm-editor'));

        expect(fullHeightCodeMirrorSelectors.length).toBeGreaterThan(0);
        expect(
            fullHeightCodeMirrorSelectors.some(
                (selector) =>
                    selector.includes('.mdxeditor-source-editor') &&
                    selector.endsWith('.cm-editor'),
            ),
        ).toBe(true);
        expect(
            fullHeightCodeMirrorSelectors.every(
                (selector) =>
                    (selector.includes('.mdxeditor-source-editor') ||
                        selector.includes('.mdxeditor-diff-editor')) &&
                    selector.endsWith('.cm-editor'),
            ),
        ).toBe(true);
    });

    it('offers a visible localized way to continue writing after a code block', async () => {
        const { container } = render(
            <ArticleRichTextEditorClient
                markdown={'# Ana are mere\n\n```python\nprint("Suma:", x + y)\n```'}
                onChange={vi.fn()}
                imageUploadHandler={vi.fn()}
                labelId="code-block-body"
                placeholder="Scrie articolul"
                locale="ro"
            />,
        );

        const continueButton = await screen.findByRole('button', {
            name: 'Continuă după bloc',
        });

        expect(continueButton).toBeVisible();
        expect(continueButton).toHaveClass('article-code-block__continue');
        expect(continueButton).toHaveAttribute('aria-keyshortcuts', 'Control+Enter Meta+Enter');
        expect(continueButton).toHaveAttribute(
            'title',
            expect.stringContaining('Ctrl sau Command + Enter'),
        );

        const codeMirrorContent = container.querySelector<HTMLElement>(
            '.article-code-block .cm-content',
        );
        const articleContent = container.querySelector<HTMLElement>(
            '[contenteditable="true"][aria-labelledby="code-block-body"]',
        );
        expect(codeMirrorContent).toBeInTheDocument();
        expect(articleContent).toBeInTheDocument();
        codeMirrorContent?.focus();
        expect(
            fireEvent.keyDown(codeMirrorContent as HTMLElement, {
                key: 'Enter',
                code: 'Enter',
                ctrlKey: true,
            }),
        ).toBe(false);
        await waitFor(() => expect(articleContent).toHaveFocus());
        await waitFor(() => expect(articleContent?.lastElementChild?.tagName).toBe('P'));
    });
});
