'use client';

import dynamic from 'next/dynamic';

import type { ArticleRichTextEditorProps } from '@/components/articles/article-rich-text-editor.client';

const ArticleRichTextEditorClient = dynamic(
    () =>
        import('@/components/articles/article-rich-text-editor.client').then(
            (module) => module.ArticleRichTextEditorClient,
        ),
    {
        ssr: false,
        loading: () => (
            <div
                className="min-h-[32rem] animate-pulse border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)]"
                aria-hidden="true"
            />
        ),
    },
);

export function ArticleRichTextEditor(props: ArticleRichTextEditorProps) {
    return <ArticleRichTextEditorClient {...props} />;
}

export type { ArticleRichTextEditorProps };
