'use client';

import { useMemo, useState } from 'react';

import type { ProblemPreviewImage as ProblemPreviewImageDescriptor } from '@/lib/types';
import { cn } from '@/lib/utils';

const PREVIEW_ASPECT_RATIO = '1200 / 630';

type ProblemPreviewImageProps = {
    problemId: number;
    title: string;
    difficulty: string;
    previewImage?: ProblemPreviewImageDescriptor | null;
    priority?: boolean;
    className?: string;
    imageClassName?: string;
};

/**
 * Resolve only the two preview URL shapes emitted by the backend:
 * relative API paths for generated artwork, or absolute HTTP(S) upload URLs.
 */
export function resolveProblemPreviewUrl(
    value: string | null | undefined,
    apiBaseUrl: string | undefined = process.env.NEXT_PUBLIC_API_BASE_URL,
): string | null {
    const candidate = value?.trim();
    if (!candidate) return null;

    try {
        if (candidate.startsWith('/') && !candidate.startsWith('//')) {
            if (!apiBaseUrl) return null;

            const apiBase = new URL(apiBaseUrl);
            if (apiBase.protocol !== 'http:' && apiBase.protocol !== 'https:') return null;

            const resolved = new URL(candidate, apiBase);
            return resolved.origin === apiBase.origin ? resolved.toString() : null;
        }

        const absolute = new URL(candidate);
        return absolute.protocol === 'http:' || absolute.protocol === 'https:'
            ? absolute.toString()
            : null;
    } catch {
        return null;
    }
}

function hashPreviewSeed(value: string): number {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function seededUnit(seed: number, step: number): number {
    let value = (seed + Math.imul(step + 1, 0x6d2b79f5)) >>> 0;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function ProblemPreviewFallback({
    problemId,
    title,
    difficulty,
}: Pick<ProblemPreviewImageProps, 'problemId' | 'title' | 'difficulty'>) {
    const seed = useMemo(
        () => hashPreviewSeed(`${problemId}:${title}:${difficulty.toLowerCase()}`),
        [difficulty, problemId, title],
    );
    const cells = useMemo(
        () =>
            Array.from({ length: 24 }, (_, index) => {
                const column = index % 6;
                const row = Math.floor(index / 6);
                const tone = seededUnit(seed, index);
                return {
                    x: 54 + column * 82,
                    y: 35 + row * 66,
                    fill:
                        tone > 0.9
                            ? 'oklch(0.72 0.18 32)'
                            : tone > 0.7
                              ? 'oklch(0.89 0.185 116)'
                              : 'oklch(0.65 0.2 291)',
                    opacity: tone > 0.7 ? 1 : 0.28 + seededUnit(seed, index + 31) * 0.42,
                };
            }),
        [seed],
    );

    return (
        <svg
            viewBox="0 0 600 315"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            fill="none"
            aria-hidden="true"
            data-testid="problem-preview-fallback"
        >
            <rect width="600" height="315" fill="oklch(0.43 0.235 291)" />
            <path d="M0 0H170L105 315H0Z" fill="oklch(0.57 0.22 291)" opacity="0.55" />
            <path d="M510 0H600V315H430Z" fill="oklch(0.65 0.2 291)" opacity="0.35" />
            <g data-preview-fingerprint={seed.toString(16)}>
                {cells.map((cell) => (
                    <rect
                        key={`${cell.x}-${cell.y}`}
                        x={cell.x}
                        y={cell.y}
                        width="48"
                        height="48"
                        rx="8"
                        fill={cell.fill}
                        opacity={cell.opacity}
                        stroke="oklch(0.98 0.01 292)"
                        strokeOpacity="0.12"
                        strokeWidth="1"
                    />
                ))}
            </g>
            <rect
                x="42"
                y="23"
                width="516"
                height="268"
                rx="14"
                stroke="oklch(0.98 0.01 292)"
                strokeOpacity="0.18"
                strokeWidth="2"
            />
            <circle cx={520 + (seed % 3) * 10} cy="271" r="6" fill="oklch(0.89 0.185 116)" />
            <circle cx={538 + (seed % 2) * 8} cy="271" r="6" fill="oklch(0.72 0.18 32)" />
        </svg>
    );
}

/**
 * Safe public problem artwork. SVG is always loaded as an isolated image
 * document; backend markup is never inserted into the application DOM.
 */
export function ProblemPreviewImage({
    problemId,
    title,
    difficulty,
    previewImage,
    priority = false,
    className,
    imageClassName,
}: ProblemPreviewImageProps) {
    const resolvedUrl = resolveProblemPreviewUrl(previewImage?.url);
    const [failedUrl, setFailedUrl] = useState<string | null>(null);
    const imageAvailable = Boolean(resolvedUrl && failedUrl !== resolvedUrl);
    const width =
        previewImage?.width && Number.isFinite(previewImage.width) && previewImage.width > 0
            ? previewImage.width
            : 1200;
    const height =
        previewImage?.height && Number.isFinite(previewImage.height) && previewImage.height > 0
            ? previewImage.height
            : 630;
    const source =
        imageAvailable && previewImage?.source === 'UPLOADED'
            ? 'uploaded'
            : imageAvailable && previewImage?.source === 'GENERATED'
              ? 'generated'
              : imageAvailable
                ? 'remote'
                : 'fallback';
    return (
        <div
            className={cn(
                'relative isolate w-full overflow-hidden bg-[oklch(0.43_0.235_291)]',
                className,
            )}
            style={{ aspectRatio: PREVIEW_ASPECT_RATIO }}
            data-preview-source={source}
        >
            {imageAvailable && resolvedUrl ? (
                // An external image document keeps even platform-generated SVG isolated.
                <img
                    src={resolvedUrl}
                    alt=""
                    aria-hidden="true"
                    width={width}
                    height={height}
                    loading={priority ? 'eager' : 'lazy'}
                    fetchPriority={priority ? 'high' : 'auto'}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className={cn('absolute inset-0 h-full w-full object-cover', imageClassName)}
                    onError={() => setFailedUrl(resolvedUrl)}
                    data-testid="problem-preview-image"
                />
            ) : (
                <ProblemPreviewFallback
                    problemId={problemId}
                    title={title}
                    difficulty={difficulty}
                />
            )}
        </div>
    );
}
