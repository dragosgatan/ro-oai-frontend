'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const PREVIEW_SIZE = 320;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const POSITION_STEP = 8;

type Offset = { x: number; y: number };

export type AvatarCropperProps = {
    initialImageUrl?: string | null;
    exportSize?: number;
    confirming?: boolean;
    labels?: {
        selectImage?: string;
        empty?: string;
        zoom?: string;
        cancel?: string;
        confirm?: string;
        confirming?: string;
        preview?: string;
        position?: string;
        moveUp?: string;
        moveDown?: string;
        moveLeft?: string;
        moveRight?: string;
        resetPosition?: string;
        invalidType?: string;
        tooLarge?: string;
        loadError?: string;
    };
    onCancel: () => void;
    onConfirm: (dataUrl: string) => void;
};

export function AvatarCropper({
    initialImageUrl,
    exportSize = 512,
    confirming = false,
    labels,
    onCancel,
    onConfirm,
}: AvatarCropperProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(initialImageUrl ?? null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef<Offset | null>(null);
    const offsetStart = useRef<Offset | null>(null);

    const clampOffset = useCallback(
        (nextOffset: Offset, nextScale = scale): Offset => {
            const image = imgRef.current;
            if (!image) return { x: 0, y: 0 };

            const baseScale = Math.max(PREVIEW_SIZE / image.width, PREVIEW_SIZE / image.height);
            const drawWidth = image.width * baseScale * nextScale;
            const drawHeight = image.height * baseScale * nextScale;
            const maxX = Math.max(0, (drawWidth - PREVIEW_SIZE) / 2);
            const maxY = Math.max(0, (drawHeight - PREVIEW_SIZE) / 2);

            return {
                x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
                y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
            };
        },
        [scale],
    );

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const image = imgRef.current;
        if (!canvas || !image || !imageLoaded) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const size = canvas.width;
        const baseScale = Math.max(size / image.width, size / image.height);
        const renderedScale = scale * baseScale;
        const drawWidth = image.width * renderedScale;
        const drawHeight = image.height * renderedScale;
        const centerX = size / 2 + offset.x;
        const centerY = size / 2 + offset.y;

        context.clearRect(0, 0, size, size);
        context.drawImage(
            image,
            centerX - drawWidth / 2,
            centerY - drawHeight / 2,
            drawWidth,
            drawHeight,
        );
    }, [imageLoaded, offset, scale]);

    useEffect(() => {
        if (!imgSrc) {
            imgRef.current = null;
            setImageLoaded(false);
            return;
        }

        let cancelled = false;
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            if (cancelled) return;
            imgRef.current = image;
            setScale(1);
            setOffset({ x: 0, y: 0 });
            setImageError(null);
            setImageLoaded(true);
        };
        image.onerror = () => {
            if (cancelled) return;
            imgRef.current = null;
            setImageLoaded(false);
            setImageError(labels?.loadError ?? 'The image could not be loaded.');
        };
        image.src = imgSrc;

        return () => {
            cancelled = true;
        };
    }, [imgSrc, labels?.loadError]);

    useEffect(() => {
        draw();
    }, [draw]);

    const updateScale = (nextScale: number) => {
        const clampedScale = Math.min(4, Math.max(1, nextScale));
        setScale(clampedScale);
        setOffset((currentOffset) => clampOffset(currentOffset, clampedScale));
    };

    const moveImage = (x: number, y: number) => {
        setOffset((currentOffset) =>
            clampOffset({ x: currentOffset.x + x, y: currentOffset.y + y }),
        );
    };

    const handleWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
        if (!imageLoaded) return;
        event.preventDefault();
        updateScale(scale * (event.deltaY < 0 ? 1.05 : 0.95));
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!imageLoaded) return;
        setDragging(true);
        dragStart.current = { x: event.clientX, y: event.clientY };
        offsetStart.current = { ...offset };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging || !dragStart.current || !offsetStart.current) return;
        const canvas = canvasRef.current;
        const ratio = canvas ? canvas.width / canvas.getBoundingClientRect().width : 1;
        const deltaX = (event.clientX - dragStart.current.x) * ratio;
        const deltaY = (event.clientY - dragStart.current.y) * ratio;
        setOffset(
            clampOffset({
                x: offsetStart.current.x + deltaX,
                y: offsetStart.current.y + deltaY,
            }),
        );
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        setDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const handlePreviewKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const movement: Record<string, Offset> = {
            ArrowUp: { x: 0, y: -POSITION_STEP },
            ArrowDown: { x: 0, y: POSITION_STEP },
            ArrowLeft: { x: -POSITION_STEP, y: 0 },
            ArrowRight: { x: POSITION_STEP, y: 0 },
        };
        const nextMovement = movement[event.key];
        if (!nextMovement || !imageLoaded) return;
        event.preventDefault();
        moveImage(nextMovement.x, nextMovement.y);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
            setImageError(labels?.invalidType ?? 'Choose a PNG, JPG, or WebP image.');
            event.target.value = '';
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setImageError(labels?.tooLarge ?? 'The image must be 10 MB or smaller.');
            event.target.value = '';
            return;
        }

        setImageError(null);
        setImageLoaded(false);
        const reader = new FileReader();
        reader.onerror = () => setImageError(labels?.loadError ?? 'The image could not be loaded.');
        reader.onload = () => setImgSrc(String(reader.result));
        reader.readAsDataURL(file);
    };

    const exportCropped = () => {
        const previewCanvas = canvasRef.current;
        const sourceImage = imgRef.current;
        if (!previewCanvas || !sourceImage || !imageLoaded) return;

        const output = document.createElement('canvas');
        output.width = exportSize;
        output.height = exportSize;
        const context = output.getContext('2d');
        if (!context) return;

        const baseScale = Math.max(exportSize / sourceImage.width, exportSize / sourceImage.height);
        const renderedScale = scale * baseScale;
        const drawWidth = sourceImage.width * renderedScale;
        const drawHeight = sourceImage.height * renderedScale;
        const offsetRatio = exportSize / previewCanvas.width;
        const centerX = exportSize / 2 + offset.x * offsetRatio;
        const centerY = exportSize / 2 + offset.y * offsetRatio;

        context.drawImage(
            sourceImage,
            centerX - drawWidth / 2,
            centerY - drawHeight / 2,
            drawWidth,
            drawHeight,
        );
        onConfirm(output.toDataURL('image/png'));
    };

    return (
        <div className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="avatarFile">{labels?.selectImage ?? 'Select image'}</Label>
                <Input
                    id="avatarFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={confirming}
                    className="h-11 rounded-none"
                    aria-describedby={imageError ? 'avatar-file-error' : undefined}
                    onChange={handleFileChange}
                />
                {imageError ? (
                    <p
                        id="avatar-file-error"
                        className="border border-[oklch(0.65_0.18_35)] bg-[oklch(0.95_0.035_35)] px-3 py-2 text-sm leading-6 text-[oklch(0.34_0.12_35)] dark:bg-[oklch(0.25_0.06_35)] dark:text-[oklch(0.9_0.04_35)]"
                        role="alert"
                    >
                        {imageError}
                    </p>
                ) : null}
            </div>

            <div
                className={cn(
                    'relative mx-auto aspect-square w-full max-w-80 touch-none select-none border-2 border-[oklch(0.62_0.06_287)] bg-[oklch(0.92_0.018_289)] outline-none focus-visible:ring-4 focus-visible:ring-[oklch(0.72_0.19_292/0.28)] dark:border-[oklch(0.5_0.07_287)] dark:bg-[oklch(0.22_0.035_286)]',
                    imageLoaded && (dragging ? 'cursor-grabbing' : 'cursor-grab'),
                )}
                role="group"
                aria-label={labels?.position ?? 'Position image'}
                tabIndex={imageLoaded ? 0 : -1}
                onWheel={handleWheel}
                onKeyDown={handlePreviewKeyDown}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <canvas
                    ref={canvasRef}
                    width={PREVIEW_SIZE}
                    height={PREVIEW_SIZE}
                    aria-label={labels?.preview ?? 'Avatar preview'}
                    className="block h-full w-full"
                />
                {!imgSrc ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center text-sm leading-6 text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                        {labels?.empty ?? 'Upload an image to crop your avatar'}
                    </div>
                ) : null}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="avatarZoom">{labels?.zoom ?? 'Zoom'}</Label>
                    <output className="text-xs tabular-nums text-[oklch(0.46_0.044_282)] dark:text-[oklch(0.73_0.034_290)]">
                        {Math.round(scale * 100)}%
                    </output>
                </div>
                <Slider
                    id="avatarZoom"
                    min={1}
                    max={4}
                    step={0.01}
                    value={[scale]}
                    disabled={confirming || !imageLoaded}
                    aria-label={labels?.zoom ?? 'Zoom'}
                    className="min-h-11 [&>span]:rounded-none"
                    onValueChange={(value) => updateScale(value[0])}
                />
            </div>

            <fieldset disabled={confirming || !imageLoaded} className="space-y-2">
                <legend className="text-sm font-medium">
                    {labels?.position ?? 'Position image'}
                </legend>
                <div className="flex flex-wrap items-center gap-3">
                    <div
                        className="grid grid-cols-3"
                        aria-label={labels?.position ?? 'Position image'}
                    >
                        <span aria-hidden="true" />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-none"
                            onClick={() => moveImage(0, -POSITION_STEP)}
                            aria-label={labels?.moveUp ?? 'Move image up'}
                        >
                            <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <span aria-hidden="true" />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-none"
                            onClick={() => moveImage(-POSITION_STEP, 0)}
                            aria-label={labels?.moveLeft ?? 'Move image left'}
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-none"
                            onClick={() => setOffset({ x: 0, y: 0 })}
                            aria-label={labels?.resetPosition ?? 'Reset position'}
                        >
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-none"
                            onClick={() => moveImage(POSITION_STEP, 0)}
                            aria-label={labels?.moveRight ?? 'Move image right'}
                        >
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <span aria-hidden="true" />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 rounded-none"
                            onClick={() => moveImage(0, POSITION_STEP)}
                            aria-label={labels?.moveDown ?? 'Move image down'}
                        >
                            <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="min-h-11 rounded-none"
                        onClick={() => {
                            setScale(1);
                            setOffset({ x: 0, y: 0 });
                        }}
                    >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        {labels?.resetPosition ?? 'Reset position'}
                    </Button>
                </div>
            </fieldset>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 rounded-none"
                    disabled={confirming}
                    onClick={onCancel}
                >
                    {labels?.cancel ?? 'Cancel'}
                </Button>
                <Button
                    type="button"
                    className="min-h-11 rounded-none"
                    loading={confirming}
                    onClick={exportCropped}
                    disabled={!imageLoaded || confirming}
                >
                    {confirming
                        ? (labels?.confirming ?? labels?.confirm ?? 'Confirm')
                        : (labels?.confirm ?? 'Confirm')}
                </Button>
            </div>
        </div>
    );
}

export default AvatarCropper;
