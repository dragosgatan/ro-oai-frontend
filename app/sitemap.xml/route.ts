/**
 * Sitemap Index Route
 *
 * Generates a sitemap index XML that references multiple sitemap files.
 * This is required when the sitemap exceeds Google's 50MB/50,000 URL limit.
 *
 * Structure:
 * - /sitemap.xml -> This sitemap index
 * - /sitemap/static.xml -> Static pages for all locales
 * - /sitemap/problems.xml -> Problems for all locales
 * - /sitemap/competitions.xml -> Competitions for all locales
 * - /sitemap/profiles.xml -> Profiles for all locales
 * - /sitemap/articles.xml -> Published articles for all locales
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Generate sitemap index XML
 */
function generateSitemapIndexXml(): string {
    const lastmod = new Date().toISOString().split('T')[0];

    const sitemaps = [
        { loc: `${BASE_URL}/sitemap/static.xml`, lastmod },
        { loc: `${BASE_URL}/sitemap/problems.xml`, lastmod },
        { loc: `${BASE_URL}/sitemap/competitions.xml`, lastmod },
        { loc: `${BASE_URL}/sitemap/profiles.xml`, lastmod },
        { loc: `${BASE_URL}/sitemap/articles.xml`, lastmod },
    ];

    const sitemapEntries = sitemaps
        .map(
            (sitemap) => `  <sitemap>
    <loc>${sitemap.loc}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`,
        )
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
}

export async function GET() {
    const xml = generateSitemapIndexXml();

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}
