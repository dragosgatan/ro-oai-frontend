import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ArticleApiError, type OwnedArticle } from '@/lib/articles';

const mocks = vi.hoisted(() => ({
    createArticleDraft: vi.fn(),
    saveArticleDraft: vi.fn(),
    submitArticleForReview: vi.fn(),
    requestArticleDeletion: vi.fn(),
    cancelArticleRequest: vi.fn(),
    resubmitArticleRequest: vi.fn(),
    previewArticleMarkdown: vi.fn(),
    uploadArticleImage: vi.fn(),
    getArticleSubmissionOptions: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
}));

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => 'ro',
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

vi.mock('@/i18n/routing', () => ({
    Link: ({ href, children, ...props }: React.ComponentProps<'a'>) => (
        <a href={String(href)} {...props}>
            {children}
        </a>
    ),
    useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

vi.mock('@/components/articles/problem-search-combobox', () => ({
    ProblemSearchCombobox: ({
        disabled,
        selected,
    }: {
        disabled?: boolean;
        selected?: { isCurrentUserAuthor?: boolean } | null;
    }) => (
        <button
            type="button"
            disabled={disabled}
            data-current-user-author={selected?.isCurrentUserAuthor ? 'true' : 'false'}
        >
            problem-picker
        </button>
    ),
}));

vi.mock('@/components/articles/article-rich-text-editor', () => ({
    ArticleRichTextEditor: ({
        markdown,
        onChange,
        disabled,
        labelId,
        imageUploadHandler,
    }: {
        markdown: string;
        onChange: (value: string) => void;
        disabled?: boolean;
        labelId: string;
        imageUploadHandler: (file: File) => Promise<string>;
    }) => (
        <>
            <textarea
                aria-labelledby={labelId}
                value={markdown}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
            />
            <button
                type="button"
                aria-label="test-image-upload"
                onClick={() => {
                    void imageUploadHandler(
                        new File(['safe-image'], 'diagram.png', { type: 'image/png' }),
                    ).catch(() => undefined);
                }}
            />
        </>
    ),
}));

vi.mock('@/lib/articles', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/lib/articles')>()),
    createArticleDraft: mocks.createArticleDraft,
    saveArticleDraft: mocks.saveArticleDraft,
    submitArticleForReview: mocks.submitArticleForReview,
    requestArticleDeletion: mocks.requestArticleDeletion,
    cancelArticleRequest: mocks.cancelArticleRequest,
    resubmitArticleRequest: mocks.resubmitArticleRequest,
    previewArticleMarkdown: mocks.previewArticleMarkdown,
    uploadArticleImage: mocks.uploadArticleImage,
    getArticleSubmissionOptions: mocks.getArticleSubmissionOptions,
}));

import { ArticleEditor } from '@/components/articles/article-editor';

function article(overrides: Partial<OwnedArticle> = {}): OwnedArticle {
    return {
        id: 42,
        slug: 'clear-title',
        language: 'ro',
        kind: 'GENERAL',
        publicationStatus: 'PUBLISHED',
        problem: null,
        title: 'A clear title',
        excerpt: 'A useful introduction',
        markdown: '# Complete article',
        images: [],
        sharedSubmission: null,
        sourceSharingConsent: false,
        authors: [],
        publishedAt: '2026-07-10T08:00:00Z',
        updatedAt: '2026-07-11T08:00:00Z',
        version: 3,
        structureLocked: true,
        hasUnpublishedChanges: true,
        latestChangeRequest: null,
        permissions: {
            canEdit: true,
            canSubmit: true,
            canRequestDelete: true,
            canCancelRequest: false,
            canResubmit: false,
        },
        ...overrides,
    };
}

const sharedSubmission = {
    id: 81,
    submittedAt: '2026-07-17T10:30:00Z',
    status: 'EVALUATED' as const,
    score: 91.2,
    metric: '0.912',
    sourceFileName: 'solution.ipynb',
    sourceDownloadUrl: null,
    recommended: true,
};

function editorialArticle(overrides: Partial<OwnedArticle> = {}): OwnedArticle {
    return article({
        kind: 'PROBLEM_EDITORIAL',
        problem: {
            id: 289,
            title: 'Grid Search',
            authors: [
                {
                    userId: 'participant-1',
                    firstName: 'Pixel',
                    lastName: 'Testerson',
                    displayName: 'Pixel Testerson',
                },
            ],
        },
        ...overrides,
    });
}

describe('ArticleEditor contributor safeguards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.previewArticleMarkdown.mockResolvedValue({
            sanitizedHtml: '<p>Current preview</p>',
        });
        mocks.getArticleSubmissionOptions.mockResolvedValue([]);
        window.sessionStorage.clear();
        window.history.replaceState({}, '', '/ro/writing/42');
        document.documentElement.dir = 'ltr';
    });

    it('keeps a published title editable while locking kind and slug', () => {
        render(<ArticleEditor initialArticle={article()} />);

        expect(screen.getByLabelText('fields.title.label')).not.toBeDisabled();
        expect(screen.getByLabelText('fields.excerpt.label')).not.toBeDisabled();
        expect(screen.getByLabelText('fields.kind.label')).toBeDisabled();
        expect(screen.getByLabelText('fields.language.label')).toBeDisabled();
        expect(screen.getByLabelText('fields.slug.label')).toBeDisabled();
    });

    it('marks an existing editorial problem authored by the current account', () => {
        render(
            <ArticleEditor
                initialArticle={article({
                    kind: 'PROBLEM_EDITORIAL',
                    problem: {
                        id: 289,
                        title: 'Grid Search',
                        authors: [
                            {
                                userId: 'participant-1',
                                firstName: 'Pixel',
                                lastName: 'Testerson',
                                displayName: 'Pixel Testerson',
                            },
                        ],
                    },
                })}
                currentUserId="participant-1"
            />,
        );

        expect(screen.getByRole('button', { name: 'problem-picker' })).toHaveAttribute(
            'data-current-user-author',
            'true',
        );
    });

    it('starts a direct editorial action with the requested problem selected', () => {
        render(
            <ArticleEditor
                initialArticle={null}
                initialProblem={{
                    id: 289,
                    title: 'Grid Search',
                    authors: [
                        {
                            userId: 'participant-1',
                            firstName: 'Pixel',
                            lastName: 'Testerson',
                            displayName: 'Pixel Testerson',
                        },
                    ],
                    isCurrentUserAuthor: true,
                }}
                currentUserId="participant-1"
            />,
        );

        expect(screen.getByLabelText('fields.kind.label')).toHaveValue('PROBLEM_EDITORIAL');
        expect(screen.getByRole('button', { name: 'problem-picker' })).toHaveAttribute(
            'data-current-user-author',
            'true',
        );
    });

    it('preserves the problem-author marker after submitting for review', async () => {
        const editorial = article({
            kind: 'PROBLEM_EDITORIAL',
            problem: {
                id: 289,
                title: 'Grid Search',
                authors: [
                    {
                        userId: 'participant-1',
                        firstName: 'Pixel',
                        lastName: 'Testerson',
                        displayName: 'Pixel Testerson',
                    },
                ],
            },
        });
        mocks.submitArticleForReview.mockResolvedValue(editorial);

        render(<ArticleEditor initialArticle={editorial} currentUserId="participant-1" />);
        fireEvent.click(screen.getByRole('button', { name: 'editor.submit' }));
        fireEvent.click(await screen.findByRole('button', { name: 'dialogs.submit.confirm' }));

        await waitFor(() => expect(mocks.submitArticleForReview).toHaveBeenCalledOnce());
        expect(screen.getByRole('button', { name: 'problem-picker' })).toHaveAttribute(
            'data-current-user-author',
            'true',
        );
    });

    it('selects an evaluated submission without granting source-sharing consent', async () => {
        mocks.getArticleSubmissionOptions.mockResolvedValue([sharedSubmission]);
        const current = editorialArticle();
        mocks.saveArticleDraft.mockResolvedValue(
            editorialArticle({
                publicationStatus: 'DRAFT',
                structureLocked: false,
                sharedSubmission,
                sourceSharingConsent: false,
            }),
        );

        render(<ArticleEditor initialArticle={current} />);

        const option = await screen.findByRole('radio', { name: /submission/ });
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        fireEvent.click(option);

        expect(screen.getByRole('checkbox')).not.toBeChecked();
        fireEvent.click(screen.getByRole('button', { name: 'editor.save' }));

        await waitFor(() => expect(mocks.saveArticleDraft).toHaveBeenCalledOnce());
        expect(mocks.saveArticleDraft).toHaveBeenCalledWith(
            42,
            expect.objectContaining({
                sharedSubmissionId: 81,
                sourceSharingConsent: false,
            }),
        );
    });

    it('blocks review until the author explicitly consents to every shared detail', async () => {
        mocks.getArticleSubmissionOptions.mockResolvedValue([sharedSubmission]);
        render(
            <ArticleEditor
                initialArticle={editorialArticle({
                    sharedSubmission,
                    sourceSharingConsent: false,
                })}
            />,
        );

        await screen.findByRole('checkbox');
        fireEvent.click(screen.getByRole('button', { name: 'editor.submit' }));
        fireEvent.click(await screen.findByRole('button', { name: 'dialogs.submit.confirm' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('validation.sourceConsent');
        expect(mocks.saveArticleDraft).not.toHaveBeenCalled();
        expect(mocks.submitArticleForReview).not.toHaveBeenCalled();
    });

    it('saves consent with the selected submission before requesting review', async () => {
        mocks.getArticleSubmissionOptions.mockResolvedValue([sharedSubmission]);
        const saved = editorialArticle({
            sharedSubmission,
            sourceSharingConsent: true,
        });
        mocks.saveArticleDraft.mockResolvedValue(saved);
        mocks.submitArticleForReview.mockResolvedValue(saved);
        render(<ArticleEditor initialArticle={editorialArticle()} />);

        fireEvent.click(await screen.findByRole('radio', { name: /submission/ }));
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: 'editor.submit' }));
        expect(await screen.findByText('dialogs.sharedSolutionNotice')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'dialogs.submit.confirm' }));

        await waitFor(() => expect(mocks.submitArticleForReview).toHaveBeenCalledOnce());
        expect(mocks.saveArticleDraft).toHaveBeenCalledWith(
            42,
            expect.objectContaining({
                sharedSubmissionId: 81,
                sourceSharingConsent: true,
            }),
        );
    });

    it('clears the selected submission and consent when the editorial becomes general', async () => {
        mocks.getArticleSubmissionOptions.mockResolvedValue([sharedSubmission]);
        mocks.saveArticleDraft.mockResolvedValue(
            article({ sharedSubmission: null, sourceSharingConsent: false }),
        );
        render(
            <ArticleEditor
                initialArticle={editorialArticle({
                    publicationStatus: 'DRAFT',
                    structureLocked: false,
                    sharedSubmission,
                    sourceSharingConsent: true,
                })}
            />,
        );

        await screen.findByRole('checkbox');
        fireEvent.change(screen.getByLabelText('fields.kind.label'), {
            target: { value: 'GENERAL' },
        });
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'editor.save' }));

        await waitFor(() => expect(mocks.saveArticleDraft).toHaveBeenCalledOnce());
        expect(mocks.saveArticleDraft).toHaveBeenCalledWith(
            42,
            expect.objectContaining({
                problemId: null,
                sharedSubmissionId: null,
                sourceSharingConsent: false,
            }),
        );
    });

    it('saves a partial draft with a title before excerpt and body are ready', async () => {
        const saved = article({
            publicationStatus: 'DRAFT',
            structureLocked: false,
            excerpt: '',
            markdown: '',
        });
        mocks.createArticleDraft.mockResolvedValue(saved);
        render(<ArticleEditor initialArticle={null} />);

        fireEvent.change(screen.getByLabelText('fields.title.label'), {
            target: { value: 'Early outline' },
        });
        fireEvent.change(screen.getByLabelText('fields.language.label'), {
            target: { value: 'en' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'editor.save' }));

        await waitFor(() => expect(mocks.createArticleDraft).toHaveBeenCalledOnce());
        expect(mocks.createArticleDraft).toHaveBeenCalledWith(
            expect.objectContaining({
                language: 'en',
                title: 'Early outline',
                excerpt: '',
                markdown: '',
            }),
        );
    });

    it('auto-saves a titled new draft before uploading its first image', async () => {
        const saved = article({ publicationStatus: 'DRAFT', structureLocked: false });
        mocks.createArticleDraft.mockResolvedValue(saved);
        mocks.uploadArticleImage.mockResolvedValue({
            id: '8e1327fe-5678-4abc-9abc-123456789012',
            markdownUrl: '/article-media/8e1327fe-5678-4abc-9abc-123456789012',
            previewUrl: '/article-media/8e1327fe-5678-4abc-9abc-123456789012',
            contentType: 'image/png',
            sizeBytes: 10,
            width: 32,
            height: 32,
            altText: null,
            referencedInCurrent: false,
            referencedInPublished: false,
            countsTowardsDraftLimit: true,
        });
        render(<ArticleEditor initialArticle={null} />);
        fireEvent.change(screen.getByLabelText('fields.title.label'), {
            target: { value: 'Illustrated article' },
        });

        fireEvent.click(screen.getByRole('button', { name: 'test-image-upload' }));

        await waitFor(() => expect(mocks.createArticleDraft).toHaveBeenCalledOnce());
        await waitFor(() =>
            expect(mocks.uploadArticleImage).toHaveBeenCalledWith(
                42,
                expect.objectContaining({ name: 'diagram.png', type: 'image/png' }),
            ),
        );
        expect(await screen.findByText('images.item')).toBeInTheDocument();
    });

    it('does not count a published-only retained image when uploading its replacement', async () => {
        const workingImages = Array.from({ length: 4 }, (_, index) => ({
            id: `working-image-${index}`,
            markdownUrl: `/article-media/working-image-${index}`,
            previewUrl: `/article-media/working-image-${index}`,
            contentType: 'image/png',
            sizeBytes: 10,
            width: 32,
            height: 32,
            altText: null,
            referencedInCurrent: true,
            referencedInPublished: false,
            countsTowardsDraftLimit: true,
        }));
        const publishedOnlyImage = {
            id: 'published-image',
            markdownUrl: '/article-media/published-image',
            previewUrl: '/article-media/published-image',
            contentType: 'image/jpeg',
            sizeBytes: 20,
            width: 640,
            height: 360,
            altText: null,
            referencedInCurrent: false,
            referencedInPublished: true,
            countsTowardsDraftLimit: false,
        };
        mocks.uploadArticleImage.mockResolvedValue({
            id: 'replacement-image',
            markdownUrl: '/article-media/replacement-image',
            previewUrl: '/article-media/replacement-image',
            contentType: 'image/png',
            sizeBytes: 12,
            width: 48,
            height: 48,
            altText: null,
            referencedInCurrent: false,
            referencedInPublished: false,
            countsTowardsDraftLimit: true,
        });
        render(
            <ArticleEditor
                initialArticle={article({ images: [...workingImages, publishedOnlyImage] })}
            />,
        );

        expect(screen.getByText('images.publishedOnly')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'images.delete' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'test-image-upload' }));

        await waitFor(() => expect(mocks.uploadArticleImage).toHaveBeenCalledOnce());
    });

    it('removes the navigation guard after a successful save', async () => {
        const saved = article({ title: 'Saved title' });
        mocks.saveArticleDraft.mockResolvedValue(saved);
        render(<ArticleEditor initialArticle={article()} />);
        fireEvent.change(screen.getByLabelText('fields.title.label'), {
            target: { value: 'Saved title' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'editor.save' }));

        await waitFor(() => expect(mocks.saveArticleDraft).toHaveBeenCalledOnce());
        await waitFor(() => expect(screen.getByText('editor.saved')).toBeInTheDocument());
        fireEvent.click(screen.getByRole('link', { name: 'editor.back' }));

        expect(screen.queryByText('dialogs.leave.title')).not.toBeInTheDocument();
    });

    it('does not save or submit unsaved edits until publication fields are complete', async () => {
        render(<ArticleEditor initialArticle={article({ excerpt: '', markdown: '' })} />);
        fireEvent.change(screen.getByLabelText('fields.title.label'), {
            target: { value: 'Revised title' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'editor.submit' }));
        fireEvent.click(await screen.findByRole('button', { name: 'dialogs.submit.confirm' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('validation.excerpt');
        expect(mocks.saveArticleDraft).not.toHaveBeenCalled();
        expect(mocks.submitArticleForReview).not.toHaveBeenCalled();
    });

    it('shows localized guidance when three articles are already awaiting review', async () => {
        mocks.submitArticleForReview.mockRejectedValue(
            new ArticleApiError(429, 'Backend message', 'ARTICLE_PENDING_LIMIT_REACHED'),
        );
        render(<ArticleEditor initialArticle={article()} />);

        fireEvent.click(screen.getByRole('button', { name: 'editor.submit' }));
        fireEvent.click(await screen.findByRole('button', { name: 'dialogs.submit.confirm' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('errors.pendingLimit');
    });

    it('renders the submission confirmation as an opaque, viewport-contained surface', async () => {
        render(<ArticleEditor initialArticle={article()} />);

        fireEvent.click(screen.getByRole('button', { name: 'editor.submit' }));

        const dialog = await screen.findByRole('alertdialog');
        expect(dialog).toHaveClass(
            'platform-overlay-surface',
            'w-[calc(100%-2rem)]',
            'max-w-[36rem]',
            'max-h-[calc(100dvh-2rem)]',
            'bg-[var(--platform-paper)]',
        );
        expect(screen.getByLabelText('dialogs.rationaleLabel')).toHaveClass(
            'bg-[var(--platform-paper-strong)]',
        );
        expect(screen.getByRole('button', { name: 'dialogs.submit.confirm' })).toHaveClass(
            'bg-[var(--platform-violet)]',
            'w-full',
        );
        const keepEditing = screen.getByRole('button', { name: 'dialogs.keepEditing' });
        expect(keepEditing).toHaveClass('w-full');

        fireEvent.click(keepEditing);
        await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
        expect(document.body).not.toHaveAttribute('data-scroll-locked');
        expect(document.body.style.overflow).not.toBe('hidden');
    });

    it('intercepts internal link navigation while long-form edits are dirty', async () => {
        render(<ArticleEditor initialArticle={article()} />);
        fireEvent.change(screen.getByLabelText('fields.title.label'), {
            target: { value: 'Unsaved title' },
        });

        fireEvent.click(screen.getByRole('link', { name: 'editor.back' }));

        expect(await screen.findByText('dialogs.leave.title')).toBeInTheDocument();
        expect(window.location.pathname).toBe('/ro/writing/42');
    });

    it('recovers a dirty draft after browser Back navigation', async () => {
        const { unmount } = render(
            <ArticleEditor initialArticle={article()} recoveryScope="participant-1" />,
        );
        fireEvent.change(screen.getByLabelText('fields.title.label'), {
            target: { value: 'Recovered after Back' },
        });

        fireEvent.popState(window);
        unmount();
        render(<ArticleEditor initialArticle={article()} recoveryScope="participant-1" />);

        await waitFor(() =>
            expect(screen.getByLabelText('fields.title.label')).toHaveValue('Recovered after Back'),
        );
    });

    it('renders a new preview whenever the Markdown has changed', async () => {
        mocks.previewArticleMarkdown.mockImplementation(async (markdown: string) => ({
            sanitizedHtml: `<p>Preview for ${markdown}</p>`,
        }));
        render(<ArticleEditor initialArticle={article()} />);

        fireEvent.click(screen.getByRole('tab', { name: 'editor.previewTab' }));
        expect(await screen.findByText('Preview for # Complete article')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('tab', { name: 'editor.writeTab' }));
        fireEvent.change(screen.getByLabelText('fields.markdown.label'), {
            target: { value: '# Revised article' },
        });
        fireEvent.click(screen.getByRole('tab', { name: 'editor.previewTab' }));

        expect(screen.queryByText('Preview for # Complete article')).not.toBeInTheDocument();
        expect(await screen.findByText('Preview for # Revised article')).toBeInTheDocument();
        expect(mocks.previewArticleMarkdown).toHaveBeenNthCalledWith(1, '# Complete article', 42);
        expect(mocks.previewArticleMarkdown).toHaveBeenNthCalledWith(2, '# Revised article', 42);
    });

    it('refreshes the current Markdown when the preview action is requested again', async () => {
        render(<ArticleEditor initialArticle={article()} />);

        fireEvent.click(screen.getByRole('tab', { name: 'editor.previewTab' }));
        await waitFor(() => expect(mocks.previewArticleMarkdown).toHaveBeenCalledOnce());
        fireEvent.click(screen.getByRole('button', { name: 'editor.preview' }));

        await waitFor(() => expect(mocks.previewArticleMarkdown).toHaveBeenCalledTimes(2));
        expect(mocks.previewArticleMarkdown).toHaveBeenLastCalledWith('# Complete article', 42);
    });

    it('implements linked tab panels and roving keyboard navigation', async () => {
        const { container } = render(<ArticleEditor initialArticle={article()} />);
        const writeTab = screen.getByRole('tab', { name: 'editor.writeTab' });
        const previewTab = screen.getByRole('tab', { name: 'editor.previewTab' });

        expect(writeTab).toHaveAttribute('id', 'article-editor-write-tab');
        expect(writeTab).toHaveAttribute('aria-controls', 'article-editor-write-panel');
        expect(writeTab).toHaveAttribute('tabindex', '0');
        expect(previewTab).toHaveAttribute('aria-controls', 'article-editor-preview-panel');
        expect(previewTab).toHaveAttribute('tabindex', '-1');
        expect(screen.getByRole('tabpanel')).toHaveAttribute(
            'aria-labelledby',
            'article-editor-write-tab',
        );
        expect(container.querySelector('main')).not.toBeInTheDocument();

        fireEvent.keyDown(writeTab, { key: 'ArrowRight' });
        expect(previewTab).toHaveFocus();
        expect(previewTab).toHaveAttribute('aria-selected', 'true');
        expect(previewTab).toHaveAttribute('tabindex', '0');
        expect(await screen.findByRole('tabpanel')).toHaveAttribute(
            'aria-labelledby',
            'article-editor-preview-tab',
        );

        fireEvent.keyDown(previewTab, { key: 'Home' });
        expect(writeTab).toHaveFocus();
        expect(writeTab).toHaveAttribute('aria-selected', 'true');

        fireEvent.keyDown(writeTab, { key: 'End' });
        expect(previewTab).toHaveFocus();
        fireEvent.keyDown(previewTab, { key: 'ArrowLeft' });
        expect(writeTab).toHaveFocus();
    });

    it('shows rejected reviewer feedback without locking further edits', () => {
        render(
            <ArticleEditor
                initialArticle={article({
                    latestChangeRequest: {
                        id: 9,
                        version: 2,
                        operation: 'UPDATE',
                        status: 'REJECTED',
                        submittedAt: '2026-07-12T08:00:00Z',
                        reviewerMessage: 'Add evidence for the conclusion.',
                    },
                })}
            />,
        );

        expect(screen.getByText('Add evidence for the conclusion.')).toBeInTheDocument();
        expect(screen.getByLabelText('fields.title.label')).not.toBeDisabled();
    });

    it.each(['APPROVED', 'CANCELLED'] as const)(
        'returns to publication status after a %s review',
        (status) => {
            render(
                <ArticleEditor
                    initialArticle={article({
                        latestChangeRequest: {
                            id: 9,
                            version: 2,
                            operation: 'UPDATE',
                            status,
                            submittedAt: '2026-07-12T08:00:00Z',
                        },
                    })}
                />,
            );

            expect(screen.getByText('publicationStatus.PUBLISHED')).toBeInTheDocument();
            expect(screen.queryByText(`reviewStatus.${status}`)).not.toBeInTheDocument();
        },
    );
});
