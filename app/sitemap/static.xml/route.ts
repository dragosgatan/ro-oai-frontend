/**
 * Static Pages Sitemap
 * Contains all static pages (homepage, leaderboard, etc.) for all locales
 */

import { generateStaticPagesSitemap, generateSitemapXml } from '@/lib/seo/sitemap';

export async function GET() {
    try {
        const entries = generateStaticPagesSitemap();
        const xml = generateSitemapXml(entries);

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        });
    } catch (error) {
        console.error('[Sitemap] Error generating static sitemap:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
}
