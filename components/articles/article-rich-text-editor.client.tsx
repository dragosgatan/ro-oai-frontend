'use client';

import {
    type FormEvent,
    type KeyboardEvent as ReactKeyboardEvent,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { $createParagraphNode, $isParagraphNode } from 'lexical';
import { CornerDownLeft } from 'lucide-react';
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    ChangeCodeMirrorLanguage,
    CodeMirrorEditor,
    CodeToggle,
    type CodeBlockEditorProps,
    ConditionalContents,
    CreateLink,
    DiffSourceToggleWrapper,
    InsertCodeBlock,
    InsertImage,
    InsertTable,
    InsertThematicBreak,
    ListsToggle,
    MDXEditor,
    type MDXEditorMethods,
    Separator,
    StrikeThroughSupSubToggles,
    UndoRedo,
    codeBlockPlugin,
    codeMirrorPlugin,
    closeImageDialog$,
    diffSourcePlugin,
    editorRootElementRef$,
    headingsPlugin,
    imagePlugin,
    imageDialogState$,
    imageUploadHandler$,
    linkDialogPlugin,
    linkPlugin,
    listsPlugin,
    markdownShortcutPlugin,
    quotePlugin,
    readOnly$,
    saveImage$,
    tablePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
    useCellValues,
    useCodeBlockEditorContext,
    usePublisher,
    useTranslation,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

export type ArticleRichTextEditorProps = {
    markdown: string;
    onChange: (markdown: string) => void;
    imageUploadHandler: (file: File) => Promise<string>;
    /** Hide image insertion for Markdown surfaces whose media lifecycle is managed separately. */
    allowImages?: boolean;
    disabled?: boolean;
    labelId: string;
    placeholder: string;
    locale?: string;
    onError?: (message: string) => void;
};

/** Initial serializer normalization must never mark a restored or saved draft as changed. */
export function shouldApplyMdxEditorChange(initialMarkdownNormalize: boolean): boolean {
    return !initialMarkdownNormalize;
}

const ROMANIAN_TRANSLATIONS: Record<string, string> = {
    'toolbar.undo': 'Anulează',
    'toolbar.redo': 'Refă',
    'toolbar.bold': 'Aldin',
    'toolbar.italic': 'Cursiv',
    'toolbar.underline': 'Subliniat',
    'toolbar.strikethrough': 'Tăiat',
    'toolbar.richText': 'Editor vizual',
    'toolbar.source': 'Markdown',
    'toolbar.image': 'Adaugă imagine',
    'toolbar.link': 'Adaugă link',
    'toolbar.table': 'Adaugă tabel',
    'toolbar.codeBlock': 'Adaugă bloc de cod',
    'toolbar.thematicBreak': 'Adaugă separator',
    'codeblock.continueAfter': 'Continuă după bloc',
    'codeblock.continueAfterHint':
        'Creează un paragraf după blocul de cod. Poți folosi și Ctrl sau Command + Enter.',
    'uploadImage.dialogTitle': 'Adaugă o imagine',
    'uploadImage.uploadInstructions': 'Încarcă o imagine de pe dispozitiv',
    'uploadImage.description': 'Alege un fișier PNG sau JPEG de maximum 1 MB.',
    'uploadImage.alt': 'Text alternativ',
    'uploadImage.title': 'Titlu opțional',
    'uploadImage.fileRequired': 'Alege o imagine înainte de a continua.',
    'uploadImage.uploading': 'Se încarcă...',
    'dialogControls.save': 'Adaugă imaginea',
    'dialogControls.cancel': 'Anulează',
};

/**
 * MDXEditor's nested CodeMirror consumes normal Tab/Enter input. Keep its editing
 * behavior, but provide an explicit and keyboard-accessible route back to prose.
 */
export function ArticleCodeMirrorEditor(props: CodeBlockEditorProps) {
    const t = useTranslation();
    const [readOnly] = useCellValues(readOnly$);
    const { lexicalNode, parentEditor } = useCodeBlockEditorContext();

    const continueAfterBlock = useCallback(() => {
        if (readOnly) return;

        const activeElement = document.activeElement;
        if (activeElement instanceof HTMLElement && activeElement.closest('.article-code-block')) {
            activeElement.blur();
        }

        parentEditor.update(() => {
            const codeBlock = lexicalNode.getLatest();
            const nextSibling = codeBlock.getNextSibling();

            if ($isParagraphNode(nextSibling)) {
                nextSibling.selectStart();
                return;
            }

            const paragraph = $createParagraphNode();
            codeBlock.insertAfter(paragraph);
            paragraph.selectStart();
        });

        window.setTimeout(() => parentEditor.focus(), 0);
    }, [lexicalNode, parentEditor, readOnly]);

    const handleKeyDownCapture = useCallback(
        (event: ReactKeyboardEvent<HTMLDivElement>) => {
            const target = event.target;
            const isInsideCodeEditor =
                target instanceof Element && Boolean(target.closest('.cm-content'));
            if (
                !isInsideCodeEditor ||
                event.key !== 'Enter' ||
                (!event.ctrlKey && !event.metaKey) ||
                readOnly
            )
                return;

            event.preventDefault();
            event.stopPropagation();
            continueAfterBlock();
        },
        [continueAfterBlock, readOnly],
    );

    return (
        <div className="article-code-block" onKeyDownCapture={handleKeyDownCapture}>
            <CodeMirrorEditor {...props} />
            {!readOnly ? (
                <div className="article-code-block__footer">
                    <button
                        type="button"
                        className="article-code-block__continue"
                        title={t(
                            'codeblock.continueAfterHint',
                            'Create a paragraph after the code block. You can also press Ctrl or Command + Enter.',
                        )}
                        aria-keyshortcuts="Control+Enter Meta+Enter"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={continueAfterBlock}
                    >
                        <CornerDownLeft className="h-4 w-4" aria-hidden="true" />
                        <span>{t('codeblock.continueAfter', 'Continue after code block')}</span>
                        <kbd aria-hidden="true">Ctrl/⌘ + Enter</kbd>
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export function UploadOnlyImageDialog() {
    const [dialogState, imageUploadHandler, editorRootElementRef] = useCellValues(
        imageDialogState$,
        imageUploadHandler$,
        editorRootElementRef$,
    );
    const saveImage = usePublisher(saveImage$);
    const closeImageDialog = usePublisher(closeImageDialog$);
    const t = useTranslation();
    const inputId = useId();
    const altId = useId();
    const titleId = useId();
    const [file, setFile] = useState<File | null>(null);
    const [altText, setAltText] = useState('');
    const [title, setTitle] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setFile(null);
        setAltText(dialogState.type === 'editing' ? (dialogState.initialValues.altText ?? '') : '');
        setTitle(dialogState.type === 'editing' ? (dialogState.initialValues.title ?? '') : '');
        setBusy(false);
        setError(null);
    }, [dialogState]);

    if (dialogState.type === 'inactive') return null;

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (busy) return;
        if (!file && dialogState.type === 'new') {
            setError(t('uploadImage.fileRequired', 'Choose an image before continuing.'));
            return;
        }

        setBusy(true);
        setError(null);
        try {
            const src = file
                ? await imageUploadHandler?.(file)
                : dialogState.type === 'editing'
                  ? dialogState.initialValues.src
                  : undefined;
            if (!src) {
                setError(t('uploadImage.fileRequired', 'Choose an image before continuing.'));
                return;
            }
            saveImage({ src, altText: altText.trim(), title: title.trim() || undefined });
        } catch (caught) {
            setError(
                caught instanceof Error
                    ? caught.message
                    : t('uploadImage.uploadError', 'The image could not be uploaded.'),
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <Dialog.Root
            open
            onOpenChange={(open) => {
                if (!open && !busy) closeImageDialog();
            }}
        >
            <Dialog.Portal container={editorRootElementRef?.current ?? undefined}>
                <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/65" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-[91] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[34rem] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-2 border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-5 text-[var(--platform-ink)] shadow-[8px_8px_0_var(--platform-line)] sm:p-6">
                    <Dialog.Title className="text-xl font-bold leading-tight">
                        {t('uploadImage.dialogTitle', 'Upload an image')}
                    </Dialog.Title>
                    <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--platform-ink-muted)]">
                        {t('uploadImage.description', 'Choose a PNG or JPEG file up to 1 MB.')}
                    </Dialog.Description>

                    <form className="mt-5 space-y-5" onSubmit={(event) => void submit(event)}>
                        <div>
                            <label htmlFor={inputId} className="text-sm font-bold">
                                {t(
                                    'uploadImage.uploadInstructions',
                                    'Upload a PNG or JPEG from your device',
                                )}
                            </label>
                            <input
                                id={inputId}
                                type="file"
                                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                                required={dialogState.type === 'new'}
                                disabled={busy}
                                onChange={(event) => {
                                    setFile(event.target.files?.item(0) ?? null);
                                    setError(null);
                                }}
                                className="mt-2 block min-h-11 w-full border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-2 text-sm file:me-3 file:min-h-9 file:border-0 file:bg-[var(--platform-violet)] file:px-3 file:font-bold file:text-white"
                            />
                        </div>
                        <div>
                            <label htmlFor={altId} className="text-sm font-bold">
                                {t('uploadImage.alt', 'Alternative text')}
                            </label>
                            <input
                                id={altId}
                                type="text"
                                value={altText}
                                disabled={busy}
                                onChange={(event) => setAltText(event.target.value)}
                                className="mt-2 min-h-11 w-full border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] px-3 text-[var(--platform-ink)]"
                            />
                        </div>
                        <div>
                            <label htmlFor={titleId} className="text-sm font-bold">
                                {t('uploadImage.title', 'Optional title')}
                            </label>
                            <input
                                id={titleId}
                                type="text"
                                value={title}
                                disabled={busy}
                                onChange={(event) => setTitle(event.target.value)}
                                className="mt-2 min-h-11 w-full border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] px-3 text-[var(--platform-ink)]"
                            />
                        </div>
                        {error ? (
                            <p
                                className="border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
                                role="alert"
                            >
                                {error}
                            </p>
                        ) : null}
                        <div className="flex flex-col-reverse gap-3 border-t border-[var(--platform-line)] pt-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => closeImageDialog()}
                                className="min-h-11 border border-[var(--platform-line-strong)] px-5 text-sm font-bold disabled:opacity-45"
                            >
                                {t('dialogControls.cancel', 'Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={busy}
                                className="min-h-11 bg-[var(--platform-violet)] px-5 text-sm font-bold text-white disabled:opacity-45 dark:text-[var(--platform-on-accent)]"
                            >
                                {busy
                                    ? t('uploadImage.uploading', 'Uploading...')
                                    : t('dialogControls.save', 'Add image')}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function RichTextToolbar({ allowImages = true }: { allowImages?: boolean }) {
    return (
        <DiffSourceToggleWrapper options={['rich-text', 'source']}>
            <ConditionalContents
                options={[
                    {
                        when: (editor) => editor?.editorType === 'codeblock',
                        contents: () => <ChangeCodeMirrorLanguage />,
                    },
                    {
                        fallback: () => (
                            <>
                                <UndoRedo />
                                <Separator />
                                <BlockTypeSelect />
                                <BoldItalicUnderlineToggles />
                                <StrikeThroughSupSubToggles options={['Strikethrough']} />
                                <CodeToggle />
                                <Separator />
                                <ListsToggle />
                                <CreateLink />
                                {allowImages ? <InsertImage /> : null}
                                <InsertTable />
                                <InsertCodeBlock />
                                <InsertThematicBreak />
                            </>
                        ),
                    },
                ]}
            />
        </DiffSourceToggleWrapper>
    );
}

export function ArticleRichTextEditorClient({
    markdown,
    onChange,
    imageUploadHandler,
    allowImages = true,
    disabled = false,
    labelId,
    placeholder,
    locale,
    onError,
}: ArticleRichTextEditorProps) {
    const editorRef = useRef<MDXEditorMethods>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const markdownRef = useRef(markdown);
    const uploadHandlerRef = useRef(imageUploadHandler);
    const [sourceFallback, setSourceFallback] = useState(false);

    useEffect(() => {
        uploadHandlerRef.current = imageUploadHandler;
    }, [imageUploadHandler]);

    const stableUploadHandler = useCallback((file: File) => uploadHandlerRef.current(file), []);
    const translation = useCallback(
        (key: string, defaultValue: string) =>
            locale?.toLowerCase().startsWith('ro')
                ? (ROMANIAN_TRANSLATIONS[key] ?? defaultValue)
                : defaultValue,
        [locale],
    );

    const plugins = useMemo(
        () => [
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            tablePlugin(),
            imagePlugin({
                imageUploadHandler: stableUploadHandler,
                ImageDialog: UploadOnlyImageDialog,
                disableImageResize: false,
                allowSetImageDimensions: false,
            }),
            codeBlockPlugin({
                defaultCodeBlockLanguage: 'python',
                codeBlockEditorDescriptors: [
                    {
                        priority: 100,
                        match: () => true,
                        Editor: ArticleCodeMirrorEditor,
                    },
                ],
            }),
            codeMirrorPlugin({
                codeBlockLanguages: {
                    '': 'Text',
                    text: 'Text',
                    python: 'Python',
                    javascript: 'JavaScript',
                    typescript: 'TypeScript',
                    json: 'JSON',
                    bash: 'Bash',
                    shell: 'Shell',
                    sql: 'SQL',
                    java: 'Java',
                    cpp: 'C++',
                    c: 'C',
                },
                autoLoadLanguageSupport: true,
            }),
            diffSourcePlugin({
                viewMode: sourceFallback ? 'source' : 'rich-text',
                readOnlyDiff: disabled,
            }),
            markdownShortcutPlugin(),
            toolbarPlugin({
                toolbarContents: () => <RichTextToolbar allowImages={allowImages} />,
            }),
        ],
        [allowImages, disabled, sourceFallback, stableUploadHandler],
    );

    useEffect(() => {
        if (markdown === markdownRef.current) return;
        markdownRef.current = markdown;
        if (editorRef.current?.getMarkdown() !== markdown) editorRef.current?.setMarkdown(markdown);
    }, [markdown]);

    useEffect(() => {
        const editable = rootRef.current?.querySelector<HTMLElement>('[contenteditable="true"]');
        if (!editable) return;
        editable.setAttribute('aria-labelledby', labelId);
        editable.setAttribute('aria-multiline', 'true');
    }, [labelId]);

    return (
        <div ref={rootRef} className="article-rich-editor" data-disabled={disabled || undefined}>
            <MDXEditor
                key={sourceFallback ? 'source-fallback' : 'rich-editor'}
                ref={editorRef}
                markdown={markdown}
                trim={false}
                readOnly={disabled}
                spellCheck
                placeholder={placeholder}
                translation={translation}
                plugins={plugins}
                className="article-rich-editor__root"
                contentEditableClassName="article-rich-editor__content"
                onChange={(nextMarkdown, initialMarkdownNormalize) => {
                    markdownRef.current = nextMarkdown;
                    if (shouldApplyMdxEditorChange(initialMarkdownNormalize))
                        onChange(nextMarkdown);
                }}
                onError={({ error }) => {
                    setSourceFallback(true);
                    onError?.(error);
                }}
            />
        </div>
    );
}
