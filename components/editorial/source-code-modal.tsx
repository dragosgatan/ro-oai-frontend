'use client';

import { useEffect, useState } from 'react';
import { CodeIcon, DownloadIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { platformSans } from '@/lib/platform-fonts';
import type { SourceFileResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

type SourceCodeModalProps = {
    files: SourceFileResponse[];
    isOpen: boolean;
    onClose: () => void;
    authorName?: string;
};

const portalPlatformThemeClassName =
    '[--platform-paper:oklch(0.978_0.014_292)] [--platform-paper-strong:oklch(0.952_0.026_292)] [--platform-ink:oklch(0.22_0.055_282)] [--platform-ink-muted:oklch(0.46_0.044_282)] [--platform-violet:oklch(0.43_0.235_291)] [--platform-violet-strong:oklch(0.36_0.22_291)] [--platform-citron:oklch(0.89_0.185_116)] [--platform-coral:oklch(0.72_0.18_32)] [--platform-on-accent:oklch(0.2_0.045_282)] [--platform-line:oklch(0.79_0.04_289)] [--platform-line-strong:oklch(0.62_0.06_287)] dark:[--platform-paper:oklch(0.18_0.038_286)] dark:[--platform-paper-strong:oklch(0.215_0.046_286)] dark:[--platform-ink:oklch(0.94_0.016_292)] dark:[--platform-ink-muted:oklch(0.73_0.034_290)] dark:[--platform-violet:oklch(0.72_0.19_292)] dark:[--platform-violet-strong:oklch(0.77_0.17_292)] dark:[--platform-citron:oklch(0.86_0.17_116)] dark:[--platform-coral:oklch(0.74_0.17_32)] dark:[--platform-line:oklch(0.34_0.055_287)] dark:[--platform-line-strong:oklch(0.5_0.07_287)]';

/** Displays downloadable source files without implying that file contents are loaded. */
export function SourceCodeModal({ files, isOpen, onClose, authorName }: SourceCodeModalProps) {
    const t = useTranslations('editorial');
    const tCommon = useTranslations('common');
    const [activeFile, setActiveFile] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        setActiveFile((current) => {
            const currentStillExists = files.some((file) => file.id.toString() === current);
            return currentStillExists ? current : (files[0]?.id.toString() ?? '');
        });
    }, [files, isOpen]);

    if (files.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                className={cn(
                    platformSans.className,
                    portalPlatformThemeClassName,
                    'flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-none border-2 border-[var(--platform-line-strong)] bg-[var(--platform-paper)] p-0 text-[var(--platform-ink)] shadow-[8px_8px_0_color-mix(in_oklch,var(--platform-violet)_24%,transparent)] sm:rounded-none',
                )}
            >
                <DialogHeader className="platform-toolbar relative border-b border-[var(--platform-line-strong)] px-4 py-5 pe-16 text-start sm:px-6 sm:pe-20">
                    <div className="flex items-start gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center bg-[var(--platform-citron)] text-[var(--platform-on-accent)] shadow-[3px_3px_0_var(--platform-violet)]">
                            <CodeIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <DialogTitle className="text-xl font-bold tracking-[-0.03em]">
                                {authorName
                                    ? t('sourceCodeBy', { author: authorName })
                                    : t('sourceCode')}
                            </DialogTitle>
                            <DialogDescription className="mt-1 max-w-2xl text-sm leading-6 text-[var(--platform-ink-muted)]">
                                {t('downloadToViewContent')}
                            </DialogDescription>
                        </div>
                    </div>
                    <DialogClose asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            aria-label={tCommon('close')}
                            className="absolute end-3 top-3 h-11 w-11 rounded-none p-0 text-[var(--platform-ink-muted)] shadow-none hover:bg-[var(--platform-paper)] hover:text-[var(--platform-ink)] focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] sm:end-4 sm:top-4"
                        >
                            <XIcon className="h-5 w-5" aria-hidden="true" />
                        </Button>
                    </DialogClose>
                </DialogHeader>

                {files.length === 1 ? (
                    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                        <SingleFileView file={files[0]} />
                    </div>
                ) : (
                    <Tabs
                        value={activeFile}
                        onValueChange={setActiveFile}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <TabsList className="h-auto w-full shrink-0 justify-start overflow-x-auto rounded-none border-b border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] p-2">
                            {files.map((file) => (
                                <TabsTrigger
                                    key={file.id}
                                    value={file.id.toString()}
                                    className="min-h-11 shrink-0 rounded-none border border-transparent px-3 text-[var(--platform-ink-muted)] shadow-none data-[state=active]:border-[var(--platform-line-strong)] data-[state=active]:bg-[var(--platform-paper)] data-[state=active]:text-[var(--platform-ink)] data-[state=active]:shadow-none"
                                >
                                    <CodeIcon className="h-4 w-4" aria-hidden="true" />
                                    <span className="max-w-48 truncate">
                                        {file.fileLabel || file.fileName}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                            {files.map((file) => (
                                <TabsContent
                                    key={file.id}
                                    value={file.id.toString()}
                                    className="m-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)]"
                                >
                                    <SingleFileView file={file} />
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SingleFileView({ file }: { file: SourceFileResponse }) {
    const t = useTranslations('editorial');

    return (
        <section
            className="border border-[var(--platform-line-strong)] bg-[var(--platform-paper)]"
            aria-labelledby={`source-file-${file.id}`}
        >
            <header className="flex flex-col gap-3 border-b border-[var(--platform-line)] bg-[var(--platform-paper-strong)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                    <CodeIcon
                        className="h-5 w-5 shrink-0 text-[var(--platform-violet)]"
                        aria-hidden="true"
                    />
                    <h3
                        id={`source-file-${file.id}`}
                        className="min-w-0 truncate text-sm font-bold text-[var(--platform-ink)]"
                    >
                        {file.fileLabel || file.fileName}
                    </h3>
                    <Badge
                        variant="outline"
                        className="shrink-0 rounded-none border-[var(--platform-line-strong)] bg-[var(--platform-paper)] text-xs text-[var(--platform-ink-muted)]"
                    >
                        {file.language}
                    </Badge>
                </div>
                <a
                    href={file.downloadUrl}
                    download={file.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[var(--platform-violet)] px-4 text-sm font-semibold text-[oklch(0.98_0.01_292)] shadow-[3px_3px_0_var(--platform-coral)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[var(--platform-violet-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--platform-coral)] active:translate-y-0 active:scale-[0.98] dark:text-[var(--platform-on-accent)] motion-reduce:transform-none sm:w-auto"
                >
                    <DownloadIcon className="h-4 w-4" aria-hidden="true" />
                    {t('download')}
                </a>
            </header>
            <div className="flex min-h-48 flex-col items-center justify-center px-5 py-8 text-center">
                <span className="mb-4 grid h-12 w-12 place-items-center border border-[var(--platform-line-strong)] bg-[var(--platform-paper-strong)] text-[var(--platform-violet)]">
                    <DownloadIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="max-w-md text-sm leading-6 text-[var(--platform-ink-muted)]">
                    {t('downloadToViewContent')}
                </p>
            </div>
        </section>
    );
}
