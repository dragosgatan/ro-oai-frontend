import { describe, expect, it } from 'vitest';

import { prepareArticleHtml } from '@/components/articles/article-content';

describe('article content preparation', () => {
    it('keeps a single page h1 and gives duplicate headings stable unique anchors', () => {
        const result = prepareArticleHtml(
            '<h1>Overview</h1><h2 id="example">Example</h2><h2>Example</h2>',
        );

        expect(result.html).toContain('<h2 id="overview">Overview</h2>');
        expect(result.html).toContain('<h3 id="example">Example</h3>');
        expect(result.html).toContain('<h3 id="example-2">Example</h3>');
        expect(result.headings.map((heading) => heading.id)).toEqual([
            'overview',
            'example',
            'example-2',
        ]);
    });

    it('routes contributor images through the same-origin optimizer', () => {
        const result = prepareArticleHtml(
            '<p>Chart</p><img src="https://tracking.example/chart.png?reader=42&amp;size=2" srcset="https://tracking.example/chart@2x.png 2x" alt="Scores">',
        );

        expect(result.html).toContain(
            'src="/_next/image?url=https%3A%2F%2Ftracking.example%2Fchart.png%3Freader%3D42%26size%3D2&amp;w=1600&amp;q=80"',
        );
        expect(result.html).toContain('loading="lazy"');
        expect(result.html).toContain('decoding="async"');
        expect(result.html).toContain('referrerpolicy="no-referrer"');
        expect(result.html).not.toContain('src="https://tracking.example');
        expect(result.html).not.toContain('srcset=');
    });

    it('normalizes a centralized absolute image URL to one local optimizer hop', () => {
        const backendOptimized =
            'https://platform.olimpiada-ai.ro/_next/image?url=https%3A%2F%2Fimages.example%2Fchart.png&amp;w=1600&amp;q=80';

        const result = prepareArticleHtml(`<img src="${backendOptimized}" alt="Scores">`);

        expect(result.html).toContain(
            'src="/_next/image?url=https%3A%2F%2Fimages.example%2Fchart.png&amp;w=1600&amp;q=80"',
        );
        expect(result.html.match(/_next\/image/g)).toHaveLength(1);
        expect(result.html).not.toContain('platform.olimpiada-ai.ro');
    });

    it('preserves safe authored image dimensions for public/editor preview fidelity', () => {
        const result = prepareArticleHtml(
            '<img src="/article-media/8e1327fe-5678-4abc-9abc-123456789012" width="420" height="236" alt="Projection diagram">',
        );

        expect(result.html).toContain('width="420"');
        expect(result.html).toContain('height="236"');
        expect(result.html).toContain('/article-media/8e1327fe-5678-4abc-9abc-123456789012');
    });
});
