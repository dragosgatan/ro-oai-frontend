/** Published article sitemap for every supported locale. */

import { generateArticlesSitemap, generateSitemapXml } from '@/lib/seo/sitemap';

export async function GET() {
    try {
        const entries = await generateArticlesSitemap();
        const xml = generateSitemapXml(entries);

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('[Sitemap] Error generating articles sitemap:', error);
        return new Response('Error generating sitemap', {
            status: 503,
            headers: { 'Cache-Control': 'no-store' },
        });
    }
}
