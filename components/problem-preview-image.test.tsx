import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ProblemPreviewImage, resolveProblemPreviewUrl } from '@/components/problem-preview-image';
import type { ProblemPreviewImage as ProblemPreviewImageDescriptor } from '@/lib/types';

const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const generatedPreview: ProblemPreviewImageDescriptor = {
    url: '/problems/290/preview-image',
    source: 'GENERATED',
    automatic: true,
    contentType: 'image/svg+xml',
    width: 1200,
    height: 630,
};

describe('ProblemPreviewImage', () => {
    beforeEach(() => {
        process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.platform.test';
    });

    afterEach(() => {
        process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
    });

    it('resolves only relative API paths or absolute HTTP(S) URLs', () => {
        expect(
            resolveProblemPreviewUrl('/problems/290/preview-image', 'https://api.platform.test'),
        ).toBe('https://api.platform.test/problems/290/preview-image');
        expect(
            resolveProblemPreviewUrl(
                'https://storage.platform.test/problems/290.webp?signature=abc',
                'https://api.platform.test',
            ),
        ).toBe('https://storage.platform.test/problems/290.webp?signature=abc');
        expect(
            resolveProblemPreviewUrl('javascript:alert(1)', 'https://api.platform.test'),
        ).toBeNull();
        expect(
            resolveProblemPreviewUrl('data:image/svg+xml;base64,abc', 'https://api.platform.test'),
        ).toBeNull();
        expect(
            resolveProblemPreviewUrl('//untrusted.test/image.svg', 'https://api.platform.test'),
        ).toBeNull();
        expect(
            resolveProblemPreviewUrl('images/problem.svg', 'https://api.platform.test'),
        ).toBeNull();
    });

    it('renders the automatic statistic as an isolated, decorative, lazy image', () => {
        render(
            <ProblemPreviewImage
                problemId={290}
                title="GridForget"
                difficulty="Hard"
                previewImage={generatedPreview}
            />,
        );

        const image = screen.getByTestId('problem-preview-image');
        expect(image).toHaveAttribute(
            'src',
            'https://api.platform.test/problems/290/preview-image',
        );
        expect(image).toHaveAttribute('alt', '');
        expect(image).toHaveAttribute('aria-hidden', 'true');
        expect(image).toHaveAttribute('loading', 'lazy');
        expect(image).toHaveClass('object-cover');
    });

    it('keeps manually generated artwork decorative', () => {
        render(
            <ProblemPreviewImage
                problemId={290}
                title="GridForget"
                difficulty="Hard"
                previewImage={{ ...generatedPreview, automatic: false }}
            />,
        );

        const image = screen.getByTestId('problem-preview-image');
        expect(image).toHaveAttribute('alt', '');
        expect(image).toHaveAttribute('aria-hidden', 'true');
    });

    it('marks a priority preview for eager high-priority loading', () => {
        render(
            <ProblemPreviewImage
                problemId={290}
                title="GridForget"
                difficulty="Hard"
                previewImage={generatedPreview}
                priority
            />,
        );

        const image = screen.getByTestId('problem-preview-image');
        expect(image).toHaveAttribute('loading', 'eager');
        expect(image).toHaveAttribute('fetchpriority', 'high');
    });

    it('uses a stable abstract fallback without inventing statistical data', () => {
        const { container, rerender } = render(
            <ProblemPreviewImage problemId={290} title="GridForget" difficulty="Hard" />,
        );
        const firstFingerprint = container
            .querySelector('[data-preview-fingerprint]')
            ?.getAttribute('data-preview-fingerprint');

        expect(screen.getByTestId('problem-preview-fallback')).toBeInTheDocument();
        expect(firstFingerprint).toBeTruthy();
        expect(container.querySelector('[data-preview-signal]')).not.toBeInTheDocument();

        rerender(<ProblemPreviewImage problemId={290} title="GridForget" difficulty="Hard" />);
        expect(
            container
                .querySelector('[data-preview-fingerprint]')
                ?.getAttribute('data-preview-fingerprint'),
        ).toBe(firstFingerprint);

        rerender(<ProblemPreviewImage problemId={291} title="GridForget" difficulty="Hard" />);
        expect(
            container
                .querySelector('[data-preview-fingerprint]')
                ?.getAttribute('data-preview-fingerprint'),
        ).not.toBe(firstFingerprint);

        rerender(
            <ProblemPreviewImage
                problemId={290}
                title="GridForget"
                difficulty="Hard"
                previewImage={{ ...generatedPreview, url: 'javascript:alert(1)' }}
            />,
        );
        expect(screen.getByTestId('problem-preview-fallback')).toBeInTheDocument();
    });

    it('replaces a failed remote image with the same stable fallback', () => {
        render(
            <ProblemPreviewImage
                problemId={290}
                title="GridForget"
                difficulty="Hard"
                previewImage={generatedPreview}
            />,
        );

        fireEvent.error(screen.getByTestId('problem-preview-image'));

        expect(screen.queryByTestId('problem-preview-image')).not.toBeInTheDocument();
        expect(screen.getByTestId('problem-preview-fallback')).toBeInTheDocument();
    });
});
