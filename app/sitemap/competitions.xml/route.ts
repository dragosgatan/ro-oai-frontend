/**
 * Competitions Sitemap
 * Contains all competition pages for all locales
 */

import { generateCompetitionsSitemap, generateSitemapXml } from '@/lib/seo/sitemap';

export async function GET() {
    try {
        const entries = await generateCompetitionsSitemap();
        const xml = generateSitemapXml(entries);

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        });
    } catch (error) {
        console.error('[Sitemap] Error generating competitions sitemap:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
}
