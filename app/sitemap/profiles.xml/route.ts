/**
 * Profiles Sitemap
 * Contains all public profile pages for all locales
 */

import { generateProfilesSitemap, generateSitemapXml } from '@/lib/seo/sitemap';

export async function GET() {
    try {
        const entries = await generateProfilesSitemap();
        const xml = generateSitemapXml(entries);

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        });
    } catch (error) {
        console.error('[Sitemap] Error generating profiles sitemap:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
}
