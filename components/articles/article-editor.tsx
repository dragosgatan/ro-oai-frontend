'use client';

import {
    type KeyboardEvent as ReactKeyboardEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    Check,
    Clock3,
    Eye,
    FilePenLine,
    Loader2,
    RotateCcw,
    Save,
    Send,
    Trash2,
    Undo2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { ArticleContent } from '@/components/articles/article-content';
import { ArticleRichTextEditor } from '@/components/articles/article-rich-text-editor';
import { ArticleSubmissionSelector } from '@/components/articles/article-submission-selector';
import { ProblemSearchCombobox } from '@/components/articles/problem-search-combobox';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Link, useRouter } from '@/i18n/routing';
import {
    ArticleApiError,
    cancelArticleRequest,
    createArticleDraft,
    deleteArticleImage,
    previewArticleMarkdown,
    requestArticleDeletion,
    resubmitArticleRequest,
    saveArticleDraft,
    submitArticleForReview,
    uploadArticleImage,
    MAX_ARTICLE_IMAGE_BYTES,
    MAX_ARTICLE_IMAGES,
    type ArticleDraftInput,
    type ArticleKind,
    type ArticleLanguage,
    type ArticleProblemOption,
    type ArticleProblemReference,
    type ArticleSharedSubmission,
    type ArticleImage,
    type OwnedArticle,
} from '@/lib/articles';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/types';

type EditorFields = {
    slug: string;
    language: ArticleLanguage;
    title: string;
    excerpt: string;
    kind: ArticleKind;
    problemId: string;
    sharedSubmissionId: string;
    sourceSharingConsent: boolean;
    markdown: string;
};

type SelectedProblem =
    | (ArticleProblemReference & { isCurrentUserAuthor?: boolean })
    | ArticleProblemOption
    | null;

type RecoveryDraft = {
    baseVersion: number | null;
    fields: EditorFields;
    selectedProblem: SelectedProblem;
    selectedSubmission: ArticleSharedSubmission | null;
};

type ConfirmAction = 'submit' | 'resubmit' | 'delete' | 'cancel' | null;
type BusyState = 'save' | 'preview' | 'action' | null;
type EditorTab = 'write' | 'preview';

type PreviewSnapshot = {
    markdown: string;
    refresh: number;
    html: string;
    failed?: boolean;
};

const WRITE_TAB_ID = 'article-editor-write-tab';
const WRITE_PANEL_ID = 'article-editor-write-panel';
const PREVIEW_TAB_ID = 'article-editor-preview-tab';
const PREVIEW_PANEL_ID = 'article-editor-preview-panel';
const ARTICLE_DIALOG_SURFACE_CLASS_NAME =
    'platform-overlay-surface max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[36rem] overflow-y-auto overscroll-contain rounded-none border-2 border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-5 text-[var(--platform-ink)] shadow-[8px_8px_0_var(--platform-line)] sm:p-6';
const ARTICLE_DIALOG_CANCEL_CLASS_NAME =
    'min-h-11 w-full rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-5 text-[var(--platform-ink)] shadow-none hover:bg-[var(--platform-paper-strong)] hover:text-[var(--platform-ink)] focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--platform-paper)] sm:w-auto';
const ARTICLE_DIALOG_ACTION_CLASS_NAME =
    'min-h-11 w-full rounded-none bg-[var(--platform-violet)] px-5 text-white shadow-none hover:bg-[var(--platform-violet-strong)] focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--platform-paper)] dark:text-[var(--platform-on-accent)] sm:w-auto';

function fieldsFromArticle(
    article: OwnedArticle | null,
    initialProblem: ArticleProblemOption | null,
): EditorFields {
    const problem = article?.problem ?? initialProblem;
    return {
        slug: article?.slug ?? '',
        language: article?.language ?? DEFAULT_LOCALE,
        title: article?.title ?? '',
        excerpt: article?.excerpt ?? '',
        kind: article?.kind ?? (initialProblem ? 'PROBLEM_EDITORIAL' : 'GENERAL'),
        problemId: problem?.id ? String(problem.id) : '',
        sharedSubmissionId: article?.sharedSubmission?.id
            ? String(article.sharedSubmission.id)
            : '',
        sourceSharingConsent: article?.sourceSharingConsent === true,
        markdown: article?.markdown ?? '',
    };
}

function serializeFields(fields: EditorFields): string {
    return JSON.stringify(fields);
}

function countDraftLimitImages(images: ArticleImage[]): number {
    return images.filter((image) => image.countsTowardsDraftLimit !== false).length;
}

function selectedProblemFromReference(
    problem: ArticleProblemReference | null | undefined,
    currentUserId?: string | null,
): SelectedProblem {
    if (!problem) return null;
    return {
        ...problem,
        isCurrentUserAuthor: Boolean(
            currentUserId && problem.authors.some((author) => author.userId === currentUserId),
        ),
    };
}

function isEditorFields(value: unknown): value is EditorFields {
    if (!value || typeof value !== 'object') return false;
    const fields = value as Partial<EditorFields>;
    return (
        typeof fields.slug === 'string' &&
        SUPPORTED_LOCALES.includes(fields.language as ArticleLanguage) &&
        typeof fields.title === 'string' &&
        typeof fields.excerpt === 'string' &&
        (fields.kind === 'GENERAL' || fields.kind === 'PROBLEM_EDITORIAL') &&
        typeof fields.problemId === 'string' &&
        typeof fields.sharedSubmissionId === 'string' &&
        typeof fields.sourceSharingConsent === 'boolean' &&
        typeof fields.markdown === 'string'
    );
}

export function ArticleEditor({
    initialArticle,
    initialProblem = null,
    recoveryScope = 'authenticated',
    currentUserId = null,
}: {
    initialArticle: OwnedArticle | null;
    initialProblem?: ArticleProblemOption | null;
    recoveryScope?: string;
    currentUserId?: string | null;
}) {
    const t = useTranslations('writing');
    const tLanguages = useTranslations('languages');
    const uiLocale = useLocale();
    const router = useRouter();
    const [article, setArticle] = useState(initialArticle);
    const [images, setImages] = useState<ArticleImage[]>(initialArticle?.images ?? []);
    const [imageCount, setImageCount] = useState(() =>
        countDraftLimitImages(initialArticle?.images ?? []),
    );
    const [uploadingImages, setUploadingImages] = useState(0);
    const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
    const [fields, setFields] = useState<EditorFields>(() =>
        fieldsFromArticle(initialArticle, initialProblem),
    );
    const [selectedProblem, setSelectedProblem] = useState<SelectedProblem>(
        selectedProblemFromReference(initialArticle?.problem ?? initialProblem, currentUserId),
    );
    const [selectedSubmission, setSelectedSubmission] = useState<ArticleSharedSubmission | null>(
        initialArticle?.sharedSubmission ?? null,
    );
    const [busy, setBusy] = useState<BusyState>(null);
    const [previewSnapshot, setPreviewSnapshot] = useState<PreviewSnapshot | null>(null);
    const [previewRefresh, setPreviewRefresh] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasConflict, setHasConflict] = useState(false);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const [rationale, setRationale] = useState('');
    const [recoveryReady, setRecoveryReady] = useState(false);
    const savedSnapshotRef = useRef(serializeFields(fields));
    const articleRef = useRef(initialArticle);
    const imageCountRef = useRef(countDraftLimitImages(initialArticle?.images ?? []));
    const reservedImageSlotsRef = useRef(0);
    const createForUploadRef = useRef<Promise<OwnedArticle | null> | null>(null);
    const allowNavigationRef = useRef(false);
    const previewRequestRef = useRef(0);
    const previewErrorHandlerRef = useRef<(caught: unknown, fallbackKey: string) => void>(() => {});
    const writeTabRef = useRef<HTMLButtonElement>(null);
    const previewTabRef = useRef<HTMLButtonElement>(null);
    const recoveryKeyRef = useRef(
        `article-writing-recovery:${recoveryScope}:${initialArticle?.id ?? 'new'}`,
    );
    const dirty = savedSnapshotRef.current !== serializeFields(fields);
    const pendingRequest = article?.latestChangeRequest;
    const isLocked = pendingRequest?.status === 'PENDING';
    const isReadOnly = Boolean(article && !article.permissions.canEdit);
    const wordCount = useMemo(
        () => fields.markdown.trim().split(/\s+/).filter(Boolean).length,
        [fields.markdown],
    );
    const previewIsCurrent =
        previewSnapshot?.markdown === fields.markdown && previewSnapshot.refresh === previewRefresh;
    const isUploadingImages = uploadingImages > 0;
    const actionsBusy = Boolean(busy) || isUploadingImages || Boolean(deletingImageId);

    useEffect(() => {
        articleRef.current = article;
    }, [article]);

    const clearRecoveryDraft = useCallback(() => {
        try {
            sessionStorage.removeItem(recoveryKeyRef.current);
        } catch {
            // Storage can be unavailable in hardened/private browser contexts.
        }
    }, []);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(recoveryKeyRef.current);
            if (!raw) return;
            const recovered = JSON.parse(raw) as Partial<RecoveryDraft>;
            const expectedVersion = initialArticle?.version ?? null;
            if (recovered.baseVersion !== expectedVersion || !isEditorFields(recovered.fields)) {
                sessionStorage.removeItem(recoveryKeyRef.current);
                return;
            }
            if (serializeFields(recovered.fields) !== savedSnapshotRef.current) {
                setFields(recovered.fields);
                const problem = recovered.selectedProblem;
                setSelectedProblem(
                    problem && typeof problem.id === 'number' && typeof problem.title === 'string'
                        ? {
                              ...problem,
                              authors: Array.isArray(problem.authors) ? problem.authors : [],
                              isCurrentUserAuthor:
                                  problem.isCurrentUserAuthor === true ||
                                  Boolean(
                                      currentUserId &&
                                          problem.authors?.some(
                                              (author) => author.userId === currentUserId,
                                          ),
                                  ),
                          }
                        : selectedProblemFromReference(
                              initialArticle?.problem ?? initialProblem,
                              currentUserId,
                          ),
                );
                setSelectedSubmission(
                    recovered.selectedSubmission &&
                        typeof recovered.selectedSubmission.id === 'number' &&
                        recovered.selectedSubmission.id > 0
                        ? recovered.selectedSubmission
                        : (initialArticle?.sharedSubmission ?? null),
                );
            }
        } catch {
            try {
                sessionStorage.removeItem(recoveryKeyRef.current);
            } catch {
                // Storage can be unavailable in hardened/private browser contexts.
            }
        } finally {
            setRecoveryReady(true);
        }
    }, [currentUserId, initialArticle, initialProblem]);

    useEffect(() => {
        if (!recoveryReady) return;
        if (!dirty) {
            clearRecoveryDraft();
            return;
        }

        const persistRecovery = () => {
            try {
                const payload: RecoveryDraft = {
                    baseVersion: article?.version ?? null,
                    fields,
                    selectedProblem,
                    selectedSubmission,
                };
                sessionStorage.setItem(recoveryKeyRef.current, JSON.stringify(payload));
            } catch {
                // Server validation remains the primary persistence path.
            }
        };
        const timer = window.setTimeout(persistRecovery, 400);
        window.addEventListener('popstate', persistRecovery);
        window.addEventListener('pagehide', persistRecovery);
        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('popstate', persistRecovery);
            window.removeEventListener('pagehide', persistRecovery);
        };
    }, [
        article?.version,
        clearRecoveryDraft,
        dirty,
        fields,
        recoveryReady,
        selectedProblem,
        selectedSubmission,
    ]);

    const setField = <K extends keyof EditorFields>(key: K, value: EditorFields[K]) => {
        setFields((current) => ({ ...current, [key]: value }));
        setError(null);
        setHasConflict(false);
    };

    const validateDraft = useCallback((): string | null => {
        if (!fields.title.trim()) return t('validation.title');
        if (
            fields.kind === 'PROBLEM_EDITORIAL' &&
            (!/^\d+$/.test(fields.problemId) || Number(fields.problemId) <= 0)
        ) {
            return t('validation.problem');
        }
        return null;
    }, [fields, t]);

    const validateSubmission = useCallback((): string | null => {
        const draftMessage = validateDraft();
        if (draftMessage) return draftMessage;
        if (!fields.excerpt.trim()) return t('validation.excerpt');
        if (!fields.markdown.trim()) return t('validation.markdown');
        if (fields.sharedSubmissionId && !fields.sourceSharingConsent) {
            return t('validation.sourceConsent');
        }
        return null;
    }, [
        fields.excerpt,
        fields.markdown,
        fields.sharedSubmissionId,
        fields.sourceSharingConsent,
        t,
        validateDraft,
    ]);

    const handleApiError = useCallback(
        (caught: unknown, fallbackKey: string, classifyConflict = true) => {
            const conflictCodes = new Set([
                'ARTICLE_VERSION_CONFLICT',
                'ARTICLE_OPTIMISTIC_LOCK_CONFLICT',
                'OPTIMISTIC_LOCK_CONFLICT',
            ]);
            const knownNonConflict = new Set([
                'ARTICLE_PENDING_LIMIT_REACHED',
                'ARTICLE_IMAGE_LIMIT_EXCEEDED',
                'ARTICLE_IMAGE_TOO_LARGE',
                'ARTICLE_IMAGE_UNSUPPORTED_TYPE',
            ]);
            if (
                caught instanceof ArticleApiError &&
                fallbackKey === 'errors.action' &&
                (caught.status === 429 || caught.code === 'ARTICLE_PENDING_LIMIT_REACHED')
            ) {
                setError(t('errors.pendingLimit'));
                return;
            }
            if (
                caught instanceof ArticleApiError &&
                caught.status === 409 &&
                classifyConflict &&
                (conflictCodes.has(caught.code ?? '') || !knownNonConflict.has(caught.code ?? ''))
            ) {
                setHasConflict(true);
                setError(t('errors.conflict'));
                return;
            }
            if (caught instanceof ArticleApiError && caught.status === 403) {
                setError(t('errors.forbidden'));
                return;
            }
            setError(caught instanceof Error ? caught.message : t(fallbackKey));
        },
        [t],
    );

    useEffect(() => {
        previewErrorHandlerRef.current = handleApiError;
    }, [handleApiError]);

    const persistDraft = useCallback(
        async (quiet = false): Promise<OwnedArticle | null> => {
            const validationMessage = validateDraft();
            if (validationMessage) {
                setError(validationMessage);
                return null;
            }

            const input: ArticleDraftInput = {
                slug: fields.slug.trim() || undefined,
                language: fields.language,
                title: fields.title.trim(),
                excerpt: fields.excerpt.trim(),
                kind: fields.kind,
                problemId: fields.kind === 'PROBLEM_EDITORIAL' ? Number(fields.problemId) : null,
                sharedSubmissionId:
                    fields.kind === 'PROBLEM_EDITORIAL' && fields.sharedSubmissionId
                        ? Number(fields.sharedSubmissionId)
                        : null,
                sourceSharingConsent:
                    fields.kind === 'PROBLEM_EDITORIAL' &&
                    Boolean(fields.sharedSubmissionId) &&
                    fields.sourceSharingConsent,
                markdown: fields.markdown,
                version: article?.version,
            };

            setBusy('save');
            setError(null);
            try {
                const saved = article
                    ? await saveArticleDraft(article.id, input)
                    : await createArticleDraft(input);
                const nextFields = fieldsFromArticle(saved, null);
                setArticle(saved);
                articleRef.current = saved;
                setImages(saved.images);
                const nextImageCount = countDraftLimitImages(saved.images);
                setImageCount(nextImageCount);
                imageCountRef.current = nextImageCount;
                setFields(nextFields);
                setSelectedProblem(selectedProblemFromReference(saved.problem, currentUserId));
                setSelectedSubmission(saved.sharedSubmission);
                savedSnapshotRef.current = serializeFields(nextFields);
                clearRecoveryDraft();
                setHasConflict(false);
                if (!article) router.replace(`/writing/${saved.id}`);
                if (!quiet) toast.success(t('toasts.saved'));
                return saved;
            } catch (caught) {
                handleApiError(caught, 'errors.save');
                return null;
            } finally {
                setBusy(null);
            }
        },
        [
            article,
            clearRecoveryDraft,
            currentUserId,
            fields,
            handleApiError,
            router,
            t,
            validateDraft,
        ],
    );

    const handleImageUpload = useCallback(
        async (file: File): Promise<string> => {
            const supportedTypes = new Set([
                '',
                'application/octet-stream',
                'image/jpeg',
                'image/jpg',
                'image/png',
            ]);
            if (!supportedTypes.has(file.type)) {
                const message = t('images.typeError');
                setError(message);
                throw new Error(message);
            }
            if (file.size > MAX_ARTICLE_IMAGE_BYTES) {
                const message = t('images.sizeError');
                setError(message);
                throw new Error(message);
            }
            if (imageCountRef.current + reservedImageSlotsRef.current >= MAX_ARTICLE_IMAGES) {
                const message = t('images.limitError', { count: MAX_ARTICLE_IMAGES });
                setError(message);
                throw new Error(message);
            }

            reservedImageSlotsRef.current += 1;
            setUploadingImages((current) => current + 1);
            setError(null);
            try {
                let target = articleRef.current;
                if (!target) {
                    if (!fields.title.trim()) {
                        throw new Error(t('images.saveFirst'));
                    }
                    if (!createForUploadRef.current) {
                        createForUploadRef.current = persistDraft(true).finally(() => {
                            createForUploadRef.current = null;
                        });
                    }
                    target = await createForUploadRef.current;
                }
                if (!target) throw new Error(t('images.saveFirst'));

                const uploaded = await uploadArticleImage(target.id, file);
                if (uploaded.countsTowardsDraftLimit !== false) imageCountRef.current += 1;
                setImageCount(imageCountRef.current);
                setImages((current) => [
                    ...current.filter((image) => image.id !== uploaded.id),
                    uploaded,
                ]);
                return uploaded.markdownUrl;
            } catch (caught) {
                handleApiError(caught, 'images.uploadError', false);
                throw caught instanceof Error ? caught : new Error(t('images.uploadError'));
            } finally {
                reservedImageSlotsRef.current = Math.max(0, reservedImageSlotsRef.current - 1);
                setUploadingImages((current) => Math.max(0, current - 1));
            }
        },
        [fields.title, handleApiError, persistDraft, t],
    );

    const handleImageDelete = useCallback(
        async (image: ArticleImage) => {
            let current = articleRef.current;
            if (!current || deletingImageId) return;
            if (fields.markdown.includes(image.markdownUrl)) {
                setError(t('images.removeFromContentFirst'));
                return;
            }
            setDeletingImageId(image.id);
            setError(null);
            try {
                if (dirty) {
                    current = await persistDraft(true);
                    if (!current) return;
                }
                await deleteArticleImage(current.id, image.id);
                setImages((existing) => existing.filter((candidate) => candidate.id !== image.id));
                if (image.countsTowardsDraftLimit !== false) {
                    imageCountRef.current = Math.max(0, imageCountRef.current - 1);
                }
                setImageCount(imageCountRef.current);
            } catch (caught) {
                handleApiError(caught, 'images.deleteError', false);
            } finally {
                setDeletingImageId(null);
            }
        },
        [deletingImageId, dirty, fields.markdown, handleApiError, persistDraft, t],
    );

    useEffect(() => {
        if (!showPreview || previewIsCurrent) return;

        const markdown = fields.markdown;
        const refresh = previewRefresh;
        const requestId = ++previewRequestRef.current;

        if (!markdown.trim()) {
            setPreviewSnapshot({ markdown, refresh, html: '' });
            setBusy((current) => (current === 'preview' ? null : current));
            return;
        }

        let active = true;
        setBusy('preview');
        setError(null);
        void previewArticleMarkdown(markdown, article?.id)
            .then((preview) => {
                if (!active || previewRequestRef.current !== requestId) return;
                setPreviewSnapshot({ markdown, refresh, html: preview.sanitizedHtml });
            })
            .catch((caught: unknown) => {
                if (!active || previewRequestRef.current !== requestId) return;
                setPreviewSnapshot({ markdown, refresh, html: '', failed: true });
                previewErrorHandlerRef.current(caught, 'errors.preview');
            })
            .finally(() => {
                if (!active || previewRequestRef.current !== requestId) return;
                setBusy((current) => (current === 'preview' ? null : current));
            });

        return () => {
            active = false;
            if (previewRequestRef.current === requestId) {
                previewRequestRef.current += 1;
                setBusy((current) => (current === 'preview' ? null : current));
            }
        };
    }, [article?.id, fields.markdown, previewIsCurrent, previewRefresh, showPreview]);

    const selectEditorTab = useCallback((tab: EditorTab) => {
        setShowPreview(tab === 'preview');
    }, []);

    const handleTabKeyDown = useCallback(
        (event: ReactKeyboardEvent<HTMLButtonElement>) => {
            const tabs = [writeTabRef, previewTabRef];
            const currentIndex = event.currentTarget === previewTabRef.current ? 1 : 0;
            const direction = document.documentElement.dir === 'rtl' ? -1 : 1;
            let nextIndex: number | null = null;

            if (event.key === 'ArrowRight') nextIndex = (currentIndex + direction + 2) % 2;
            if (event.key === 'ArrowLeft') nextIndex = (currentIndex - direction + 2) % 2;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = 1;
            if (nextIndex === null) return;

            event.preventDefault();
            const nextTab: EditorTab = nextIndex === 0 ? 'write' : 'preview';
            selectEditorTab(nextTab);
            tabs[nextIndex].current?.focus();
        },
        [selectEditorTab],
    );

    const runConfirmedAction = async () => {
        const action = confirmAction;
        if (!action) return;
        setConfirmAction(null);

        let current = article;
        if (action === 'submit' || action === 'resubmit') {
            const validationMessage = validateSubmission();
            if (validationMessage) {
                setError(validationMessage);
                return;
            }
            if (!current || dirty) {
                current = await persistDraft(true);
                if (!current) return;
            }
        }
        if (!current) return;

        setBusy('action');
        setError(null);
        try {
            const updated =
                action === 'submit'
                    ? await submitArticleForReview(current, rationale.trim() || undefined)
                    : action === 'resubmit'
                      ? await resubmitArticleRequest(current)
                      : action === 'delete'
                        ? await requestArticleDeletion(current, rationale.trim() || undefined)
                        : await cancelArticleRequest(current);
            setArticle(updated);
            const nextFields = fieldsFromArticle(updated, null);
            setFields(nextFields);
            setSelectedProblem(selectedProblemFromReference(updated.problem, currentUserId));
            setSelectedSubmission(updated.sharedSubmission);
            savedSnapshotRef.current = serializeFields(nextFields);
            clearRecoveryDraft();
            setRationale('');
            toast.success(
                action === 'cancel'
                    ? t('toasts.cancelled')
                    : action === 'delete'
                      ? t('toasts.deletionRequested')
                      : t('toasts.submitted'),
            );
            router.refresh();
        } catch (caught) {
            handleApiError(caught, 'errors.action');
        } finally {
            setBusy(null);
        }
    };

    useEffect(() => {
        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!dirty || allowNavigationRef.current) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [dirty]);

    useEffect(() => {
        if (!dirty) return;

        const onDocumentClick = (event: MouseEvent) => {
            if (allowNavigationRef.current) return;
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            const target = event.target;
            const anchor = target instanceof Element ? target.closest('a[href]') : null;
            if (
                !(anchor instanceof HTMLAnchorElement) ||
                anchor.target === '_blank' ||
                anchor.hasAttribute('download')
            ) {
                return;
            }

            const destination = new URL(anchor.href, window.location.href);
            if (destination.origin !== window.location.origin) return;
            if (destination.href === window.location.href) return;

            event.preventDefault();
            event.stopPropagation();
            setPendingNavigation(destination.href);
        };

        document.addEventListener('click', onDocumentClick, true);
        return () => document.removeEventListener('click', onDocumentClick, true);
    }, [dirty]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                if (!actionsBusy && !isReadOnly) void persistDraft();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [actionsBusy, isReadOnly, persistDraft]);

    const dialogKey = confirmAction ?? 'submit';

    return (
        <div className="platform-page-shell">
            <div className="platform-page-inner space-y-8">
                <header className="border-b border-[var(--platform-line-strong)] pb-7">
                    <Link
                        href="/writing"
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--platform-violet-strong)] underline decoration-[var(--platform-coral)] decoration-2 underline-offset-4 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] dark:text-[var(--platform-violet)]"
                    >
                        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                        {t('editor.back')}
                    </Link>
                    <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--platform-violet)]">
                                <FilePenLine className="h-4 w-4" aria-hidden="true" />
                                {article ? t('editor.editEyebrow') : t('editor.newEyebrow')}
                            </p>
                            <h1 className="mt-3 text-balance text-3xl font-bold tracking-[-0.045em] text-[var(--platform-ink)] sm:text-4xl">
                                {fields.title || t('editor.untitledTitle')}
                            </h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--platform-ink-muted)]">
                            <span className="inline-flex min-h-8 items-center gap-2 border border-[var(--platform-line-strong)] px-2.5">
                                {dirty ? (
                                    <Clock3 className="h-3.5 w-3.5 text-[var(--platform-coral)]" />
                                ) : (
                                    <Check className="h-3.5 w-3.5 text-[var(--platform-violet)]" />
                                )}
                                {dirty ? t('editor.unsaved') : t('editor.saved')}
                            </span>
                            {article ? (
                                <span className="inline-flex min-h-8 items-center border border-[var(--platform-line-strong)] px-2.5">
                                    {pendingRequest &&
                                    pendingRequest.status !== 'APPROVED' &&
                                    pendingRequest.status !== 'CANCELLED'
                                        ? t(`reviewStatus.${pendingRequest.status}`)
                                        : t(`publicationStatus.${article.publicationStatus}`)}
                                </span>
                            ) : null}
                        </div>
                    </div>
                </header>

                {error ? (
                    <div
                        className="flex flex-col gap-4 border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200 sm:flex-row sm:items-center sm:justify-between"
                        role="alert"
                    >
                        <p className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            {error}
                        </p>
                        {hasConflict ? (
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-red-300 px-3 font-bold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-red-400 dark:border-red-700"
                            >
                                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                                {t('errors.reload')}
                            </button>
                        ) : null}
                    </div>
                ) : null}

                {isLocked ? (
                    <div className="border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4 text-sm leading-6 text-[var(--platform-ink-muted)]">
                        <strong className="text-[var(--platform-ink)]">
                            {t('editor.reviewLockedTitle')}
                        </strong>{' '}
                        {t('editor.reviewLockedDescription')}
                    </div>
                ) : null}

                {pendingRequest?.status === 'CHANGES_REQUESTED' ? (
                    <div className="border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4 text-sm leading-6 text-[var(--platform-ink-muted)]">
                        <strong className="text-[var(--platform-ink)]">
                            {t('editor.changesRequestedTitle')}
                        </strong>{' '}
                        {pendingRequest.reviewerMessage || t('editor.changesRequestedDescription')}
                    </div>
                ) : null}

                {pendingRequest?.status === 'REJECTED' ? (
                    <div className="border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
                        <strong>{t('editor.rejectedTitle')}</strong>{' '}
                        {pendingRequest.reviewerMessage || t('editor.rejectedDescription')}
                    </div>
                ) : null}

                {article?.publicationStatus === 'ARCHIVED' ? (
                    <div className="border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-4 text-sm leading-6 text-[var(--platform-ink-muted)]">
                        <strong className="text-[var(--platform-ink)]">
                            {t('editor.archivedTitle')}
                        </strong>{' '}
                        {t('editor.archivedDescription')}
                    </div>
                ) : null}

                <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-2 border-y border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-4 py-3 shadow-[0_4px_0_color-mix(in_oklch,var(--platform-line)_55%,transparent)] sm:mx-0 sm:px-3">
                    <button
                        type="button"
                        onClick={() => void persistDraft()}
                        disabled={actionsBusy || isReadOnly}
                        className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--platform-violet)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45 dark:text-[var(--platform-on-accent)]"
                    >
                        {busy === 'save' ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Save className="h-4 w-4" aria-hidden="true" />
                        )}
                        {t('editor.save')}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setPreviewRefresh((current) => current + 1);
                            selectEditorTab('preview');
                        }}
                        disabled={actionsBusy}
                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] disabled:opacity-45"
                    >
                        {busy === 'preview' ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                        {t('editor.preview')}
                    </button>
                    <span className="hidden h-7 w-px bg-[var(--platform-line-strong)] sm:block" />
                    {article?.permissions.canSubmit ? (
                        <button
                            type="button"
                            onClick={() => setConfirmAction('submit')}
                            disabled={actionsBusy}
                            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-violet)] px-4 text-sm font-bold text-[var(--platform-violet-strong)] disabled:opacity-45 dark:text-[var(--platform-violet)]"
                        >
                            <Send className="h-4 w-4" aria-hidden="true" />
                            {t('editor.submit')}
                        </button>
                    ) : null}
                    {article?.permissions.canResubmit ? (
                        <button
                            type="button"
                            onClick={() => setConfirmAction('resubmit')}
                            disabled={actionsBusy}
                            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-violet)] px-4 text-sm font-bold text-[var(--platform-violet-strong)] disabled:opacity-45 dark:text-[var(--platform-violet)]"
                        >
                            <Send className="h-4 w-4" aria-hidden="true" />
                            {t('editor.resubmit')}
                        </button>
                    ) : null}
                    {article?.permissions.canCancelRequest ? (
                        <button
                            type="button"
                            onClick={() => setConfirmAction('cancel')}
                            disabled={actionsBusy}
                            className="inline-flex min-h-11 items-center justify-center gap-2 border border-[var(--platform-line-strong)] px-4 text-sm font-bold text-[var(--platform-ink)] disabled:opacity-45"
                        >
                            <Undo2 className="h-4 w-4" aria-hidden="true" />
                            {t('editor.cancelRequest')}
                        </button>
                    ) : null}
                    {article?.permissions.canRequestDelete ? (
                        <button
                            type="button"
                            onClick={() => setConfirmAction('delete')}
                            disabled={actionsBusy}
                            className="ms-auto inline-flex min-h-11 items-center justify-center gap-2 border border-red-300 px-4 text-sm font-bold text-red-700 disabled:opacity-45 dark:border-red-800 dark:text-red-300"
                        >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            {t('editor.requestDelete')}
                        </button>
                    ) : null}
                </div>

                <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_19rem]">
                    <div className="order-2 min-w-0 xl:order-1">
                        {fields.kind === 'PROBLEM_EDITORIAL' &&
                        /^\d+$/.test(fields.problemId) &&
                        Number(fields.problemId) > 0 ? (
                            <ArticleSubmissionSelector
                                key={fields.problemId}
                                problemId={Number(fields.problemId)}
                                selectedSubmission={selectedSubmission}
                                selectedSubmissionId={
                                    fields.sharedSubmissionId
                                        ? Number(fields.sharedSubmissionId)
                                        : null
                                }
                                consent={fields.sourceSharingConsent}
                                disabled={actionsBusy || isReadOnly}
                                onSelect={(submission) => {
                                    setSelectedSubmission(submission);
                                    setFields((current) => ({
                                        ...current,
                                        sharedSubmissionId: submission ? String(submission.id) : '',
                                        sourceSharingConsent: false,
                                    }));
                                    setError(null);
                                    setHasConflict(false);
                                }}
                                onConsentChange={(consent) =>
                                    setField('sourceSharingConsent', consent)
                                }
                            />
                        ) : null}
                        <div
                            className="mb-5 flex border-b border-[var(--platform-line-strong)]"
                            role="tablist"
                            aria-orientation="horizontal"
                        >
                            <button
                                ref={writeTabRef}
                                id={WRITE_TAB_ID}
                                type="button"
                                role="tab"
                                aria-selected={!showPreview}
                                aria-controls={WRITE_PANEL_ID}
                                tabIndex={showPreview ? -1 : 0}
                                onClick={() => selectEditorTab('write')}
                                onKeyDown={handleTabKeyDown}
                                className="inline-flex min-h-11 items-center gap-2 border-b-[3px] border-transparent px-4 text-sm font-bold text-[var(--platform-ink-muted)] aria-selected:border-[var(--platform-violet)] aria-selected:text-[var(--platform-ink)]"
                            >
                                <FilePenLine className="h-4 w-4" aria-hidden="true" />
                                {t('editor.writeTab')}
                            </button>
                            <button
                                ref={previewTabRef}
                                id={PREVIEW_TAB_ID}
                                type="button"
                                role="tab"
                                aria-selected={showPreview}
                                aria-controls={PREVIEW_PANEL_ID}
                                tabIndex={showPreview ? 0 : -1}
                                onClick={() => selectEditorTab('preview')}
                                onKeyDown={handleTabKeyDown}
                                className="inline-flex min-h-11 items-center gap-2 border-b-[3px] border-transparent px-4 text-sm font-bold text-[var(--platform-ink-muted)] aria-selected:border-[var(--platform-violet)] aria-selected:text-[var(--platform-ink)]"
                            >
                                <BookOpen className="h-4 w-4" aria-hidden="true" />
                                {t('editor.previewTab')}
                            </button>
                        </div>

                        <div
                            id={PREVIEW_PANEL_ID}
                            role="tabpanel"
                            aria-labelledby={PREVIEW_TAB_ID}
                            tabIndex={0}
                            hidden={!showPreview}
                            className="min-h-[35rem] border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] sm:p-8"
                        >
                            {previewIsCurrent && previewSnapshot.failed ? (
                                <p className="text-sm text-[var(--platform-ink-muted)]">
                                    {t('editor.previewUnavailable')}
                                </p>
                            ) : previewIsCurrent && previewSnapshot.html ? (
                                <ArticleContent html={previewSnapshot.html} />
                            ) : (
                                <p
                                    className="flex items-center gap-2 text-sm text-[var(--platform-ink-muted)]"
                                    role="status"
                                >
                                    {!previewIsCurrent && busy === 'preview' ? (
                                        <Loader2
                                            className="h-4 w-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                    ) : null}
                                    {previewIsCurrent
                                        ? t('editor.previewEmpty')
                                        : t('editor.previewLoading')}
                                </p>
                            )}
                        </div>
                        <div
                            id={WRITE_PANEL_ID}
                            role="tabpanel"
                            aria-labelledby={WRITE_TAB_ID}
                            tabIndex={0}
                            hidden={showPreview}
                            className="focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                        >
                            <div className="mb-2 flex items-end justify-between gap-4">
                                <div
                                    id="article-markdown-label"
                                    className="text-sm font-bold text-[var(--platform-ink)]"
                                >
                                    {t('fields.markdown.label')}
                                </div>
                                <span className="font-mono text-xs tabular-nums text-[var(--platform-ink-muted)]">
                                    {t('editor.wordCount', { count: wordCount })}
                                </span>
                            </div>
                            <p className="mb-3 text-xs leading-5 text-[var(--platform-ink-muted)]">
                                {t('fields.markdown.help')}
                            </p>
                            <ArticleRichTextEditor
                                markdown={fields.markdown}
                                onChange={(markdown) => setField('markdown', markdown)}
                                imageUploadHandler={handleImageUpload}
                                disabled={isReadOnly || busy === 'save' || busy === 'action'}
                                labelId="article-markdown-label"
                                placeholder={t('fields.markdown.placeholder')}
                                locale={uiLocale}
                                onError={() => setError(t('errors.editorParse'))}
                            />
                            <div
                                className="mt-3 border border-[var(--platform-line)] bg-[var(--platform-paper-strong)] p-3"
                                aria-live="polite"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs leading-5 text-[var(--platform-ink-muted)]">
                                    <span>
                                        {t('images.help', {
                                            size: 1,
                                            count: MAX_ARTICLE_IMAGES,
                                        })}
                                    </span>
                                    <span className="font-mono font-bold tabular-nums text-[var(--platform-ink)]">
                                        {isUploadingImages
                                            ? t('images.uploading', { count: uploadingImages })
                                            : t('images.quota', {
                                                  used: imageCount,
                                                  total: MAX_ARTICLE_IMAGES,
                                              })}
                                    </span>
                                </div>
                                {images.length > 0 ? (
                                    <ul
                                        className="mt-3 flex flex-wrap gap-2"
                                        aria-label={t('images.listLabel')}
                                    >
                                        {images.map((image, index) => (
                                            <li
                                                key={image.id}
                                                className="inline-flex min-h-14 items-center gap-2 border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-1.5 ps-2 text-xs text-[var(--platform-ink)]"
                                            >
                                                {/* Draft media needs the browser's session cookie; the Next
                                                    image optimizer does not forward it to this private route. */}
                                                <img
                                                    src={image.markdownUrl}
                                                    alt=""
                                                    className="h-11 w-14 border border-[var(--platform-line)] object-cover"
                                                    loading="lazy"
                                                    referrerPolicy="no-referrer"
                                                />
                                                <span className="min-w-0 font-mono leading-4">
                                                    <span className="block font-bold">
                                                        {t('images.item', { number: index + 1 })}
                                                    </span>
                                                    {image.referencedInPublished &&
                                                    !image.referencedInCurrent ? (
                                                        <span
                                                            className="mt-0.5 block w-fit bg-[var(--platform-citron)] px-1.5 py-0.5 font-sans text-[0.65rem] font-bold leading-4 text-[var(--platform-on-accent)]"
                                                            title={t('images.publishedOnlyHelp')}
                                                        >
                                                            {t('images.publishedOnly')}
                                                        </span>
                                                    ) : null}
                                                    <span className="block text-[var(--platform-ink-muted)]">
                                                        {image.width && image.height
                                                            ? `${image.width}×${image.height} · `
                                                            : ''}
                                                        {Math.max(
                                                            1,
                                                            Math.round(image.sizeBytes / 1024),
                                                        )}{' '}
                                                        KB
                                                    </span>
                                                </span>
                                                {!image.referencedInCurrent &&
                                                !image.referencedInPublished &&
                                                !fields.markdown.includes(image.markdownUrl) &&
                                                !isReadOnly ? (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void handleImageDelete(image)
                                                        }
                                                        disabled={
                                                            Boolean(deletingImageId) ||
                                                            isUploadingImages
                                                        }
                                                        className="inline-flex min-h-11 min-w-11 items-center justify-center text-red-700 disabled:opacity-45 dark:text-red-300"
                                                        aria-label={t('images.delete', {
                                                            number: index + 1,
                                                        })}
                                                    >
                                                        {deletingImageId === image.id ? (
                                                            <Loader2
                                                                className="h-4 w-4 animate-spin"
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <Trash2
                                                                className="h-4 w-4"
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                    </button>
                                                ) : null}
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <aside className="order-1 space-y-7 border-y border-[var(--platform-line-strong)] py-6 xl:order-2 xl:sticky xl:top-40 xl:border xl:p-5">
                        <div>
                            <label
                                htmlFor="article-title"
                                className="text-sm font-bold text-[var(--platform-ink)]"
                            >
                                {t('fields.title.label')}
                            </label>
                            <Input
                                id="article-title"
                                value={fields.title}
                                onChange={(event) => setField('title', event.target.value)}
                                disabled={Boolean(busy) || isReadOnly}
                                maxLength={180}
                                className="mt-2 min-h-11 rounded-none border-[var(--platform-line-strong)] focus-visible:scale-100 focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                                placeholder={t('fields.title.placeholder')}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="article-excerpt"
                                className="text-sm font-bold text-[var(--platform-ink)]"
                            >
                                {t('fields.excerpt.label')}
                            </label>
                            <Textarea
                                id="article-excerpt"
                                value={fields.excerpt}
                                onChange={(event) => setField('excerpt', event.target.value)}
                                disabled={Boolean(busy) || isReadOnly}
                                maxLength={500}
                                className="mt-2 min-h-32 resize-y rounded-none border-[var(--platform-line-strong)] focus-visible:scale-100 focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                                placeholder={t('fields.excerpt.placeholder')}
                            />
                            <p className="mt-1 text-end font-mono text-xs tabular-nums text-[var(--platform-ink-muted)]">
                                {fields.excerpt.length}/500
                            </p>
                        </div>
                        <div>
                            <label
                                htmlFor="article-kind"
                                className="text-sm font-bold text-[var(--platform-ink)]"
                            >
                                {t('fields.kind.label')}
                            </label>
                            <select
                                id="article-kind"
                                value={fields.kind}
                                onChange={(event) => {
                                    const kind = event.target.value as ArticleKind;
                                    setFields((current) => ({
                                        ...current,
                                        kind,
                                        problemId:
                                            kind === 'PROBLEM_EDITORIAL' ? current.problemId : '',
                                        sharedSubmissionId:
                                            kind === 'PROBLEM_EDITORIAL'
                                                ? current.sharedSubmissionId
                                                : '',
                                        sourceSharingConsent:
                                            kind === 'PROBLEM_EDITORIAL'
                                                ? current.sourceSharingConsent
                                                : false,
                                    }));
                                    if (kind !== 'PROBLEM_EDITORIAL') {
                                        setSelectedProblem(null);
                                        setSelectedSubmission(null);
                                    }
                                    setError(null);
                                    setHasConflict(false);
                                }}
                                disabled={
                                    Boolean(busy) || isReadOnly || Boolean(article?.structureLocked)
                                }
                                className="mt-2 min-h-11 w-full border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 text-sm text-[var(--platform-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] disabled:opacity-45"
                            >
                                <option value="GENERAL">{t('kinds.GENERAL')}</option>
                                <option value="PROBLEM_EDITORIAL">
                                    {t('kinds.PROBLEM_EDITORIAL')}
                                </option>
                            </select>
                        </div>
                        <div>
                            <label
                                htmlFor="article-language"
                                className="text-sm font-bold text-[var(--platform-ink)]"
                            >
                                {t('fields.language.label')}
                            </label>
                            <select
                                id="article-language"
                                value={fields.language}
                                onChange={(event) =>
                                    setField('language', event.target.value as ArticleLanguage)
                                }
                                disabled={
                                    Boolean(busy) || isReadOnly || Boolean(article?.structureLocked)
                                }
                                className="mt-2 min-h-11 w-full border border-[var(--platform-line-strong)] bg-[var(--platform-paper)] px-3 text-sm text-[var(--platform-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] disabled:opacity-45"
                            >
                                {SUPPORTED_LOCALES.map((language) => (
                                    <option key={language} value={language}>
                                        {tLanguages(language)}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-2 text-xs leading-5 text-[var(--platform-ink-muted)]">
                                {t('fields.language.help')}
                            </p>
                        </div>
                        {fields.kind === 'PROBLEM_EDITORIAL' ? (
                            <div>
                                <label
                                    htmlFor="article-problem"
                                    className="text-sm font-bold text-[var(--platform-ink)]"
                                >
                                    {t('fields.problem.label')}
                                </label>
                                <ProblemSearchCombobox
                                    selected={selectedProblem}
                                    onSelect={(problem) => {
                                        setSelectedProblem(problem);
                                        setFields((current) => {
                                            const nextProblemId = problem ? String(problem.id) : '';
                                            const problemChanged =
                                                nextProblemId !== current.problemId;
                                            return {
                                                ...current,
                                                problemId: nextProblemId,
                                                sharedSubmissionId: problemChanged
                                                    ? ''
                                                    : current.sharedSubmissionId,
                                                sourceSharingConsent: problemChanged
                                                    ? false
                                                    : current.sourceSharingConsent,
                                            };
                                        });
                                        if (
                                            (problem ? String(problem.id) : '') !== fields.problemId
                                        ) {
                                            setSelectedSubmission(null);
                                        }
                                        setError(null);
                                        setHasConflict(false);
                                    }}
                                    disabled={
                                        Boolean(busy) ||
                                        isReadOnly ||
                                        Boolean(article?.structureLocked)
                                    }
                                />
                                <p className="mt-2 text-xs leading-5 text-[var(--platform-ink-muted)]">
                                    {t('fields.problem.help')}
                                </p>
                            </div>
                        ) : null}
                        <div>
                            <label
                                htmlFor="article-slug"
                                className="text-sm font-bold text-[var(--platform-ink)]"
                            >
                                {t('fields.slug.label')}
                            </label>
                            <Input
                                id="article-slug"
                                value={fields.slug}
                                onChange={(event) => setField('slug', event.target.value)}
                                disabled={
                                    Boolean(busy) || isReadOnly || Boolean(article?.structureLocked)
                                }
                                className="mt-2 min-h-11 rounded-none border-[var(--platform-line-strong)] font-mono focus-visible:scale-100 focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                                placeholder={t('fields.slug.placeholder')}
                            />
                            <p className="mt-2 text-xs leading-5 text-[var(--platform-ink-muted)]">
                                {t('fields.slug.help')}
                            </p>
                        </div>
                    </aside>
                </div>
            </div>

            <AlertDialog
                open={Boolean(confirmAction)}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfirmAction(null);
                        setRationale('');
                    }
                }}
            >
                <AlertDialogContent className={ARTICLE_DIALOG_SURFACE_CLASS_NAME}>
                    <AlertDialogHeader className="text-start">
                        <AlertDialogTitle className="text-xl leading-tight">
                            {t(`dialogs.${dialogKey}.title`)}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="leading-6 text-[var(--platform-ink-muted)]">
                            {t(`dialogs.${dialogKey}.description`)}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {(confirmAction === 'submit' || confirmAction === 'resubmit') &&
                    fields.sharedSubmissionId ? (
                        <p className="border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-3 text-sm leading-6 text-[var(--platform-ink)]">
                            {t('dialogs.sharedSolutionNotice', {
                                id: Number(fields.sharedSubmissionId),
                            })}
                        </p>
                    ) : null}
                    {confirmAction === 'submit' || confirmAction === 'delete' ? (
                        <div>
                            <label
                                htmlFor="article-rationale"
                                className="text-sm font-bold text-[var(--platform-ink)]"
                            >
                                {t('dialogs.rationaleLabel')}
                            </label>
                            <Textarea
                                id="article-rationale"
                                value={rationale}
                                onChange={(event) => setRationale(event.target.value)}
                                className="mt-2 min-h-32 resize-y rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-[var(--platform-ink)] placeholder:text-[var(--platform-ink-muted)] focus-visible:scale-100 focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--platform-paper)]"
                                placeholder={t('dialogs.rationalePlaceholder')}
                            />
                        </div>
                    ) : null}
                    <AlertDialogFooter className="mt-1 flex-col gap-3 border-t border-[var(--platform-line)] pt-4 sm:flex-row sm:space-x-0">
                        <AlertDialogCancel className={ARTICLE_DIALOG_CANCEL_CLASS_NAME}>
                            {t('dialogs.keepEditing')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                void runConfirmedAction();
                            }}
                            className={ARTICLE_DIALOG_ACTION_CLASS_NAME}
                        >
                            {t(`dialogs.${dialogKey}.confirm`)}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={Boolean(pendingNavigation)}
                onOpenChange={(open) => {
                    if (!open) setPendingNavigation(null);
                }}
            >
                <AlertDialogContent className={ARTICLE_DIALOG_SURFACE_CLASS_NAME}>
                    <AlertDialogHeader className="text-start">
                        <AlertDialogTitle className="text-xl leading-tight">
                            {t('dialogs.leave.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="leading-6 text-[var(--platform-ink-muted)]">
                            {t('dialogs.leave.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-1 flex-col gap-3 border-t border-[var(--platform-line)] pt-4 sm:flex-row sm:space-x-0">
                        <AlertDialogCancel className={ARTICLE_DIALOG_CANCEL_CLASS_NAME}>
                            {t('dialogs.leave.stay')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                const destination = pendingNavigation;
                                setPendingNavigation(null);
                                if (destination) {
                                    clearRecoveryDraft();
                                    allowNavigationRef.current = true;
                                    window.location.assign(destination);
                                }
                            }}
                            className="min-h-11 w-full rounded-none bg-red-700 px-5 text-white shadow-none hover:bg-red-800 focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--platform-paper)] sm:w-auto"
                        >
                            {t('dialogs.leave.confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
