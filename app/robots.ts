/**
 * Robots.txt Route
 *
 * Next.js route handler for generating robots.txt
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import { MetadataRoute } from 'next';
import { generateRobotsConfig } from '@/lib/seo/robots';

/**
 * Generate robots.txt configuration
 *
 * This function is called by Next.js to generate the robots.txt file.
 * It uses the configuration from lib/seo/robots.ts to determine:
 * - Which user agents can crawl the site
 * - Which paths are allowed/disallowed
 * - Crawl delay settings
 * - Sitemap location
 *
 * The configuration automatically adjusts based on environment:
 * - Production: Allow crawling with specific restrictions
 * - Staging/Dev: Block all crawlers
 */
export default function robots(): MetadataRoute.Robots {
    const config = generateRobotsConfig();

    return {
        rules: config.rules.map((rule) => ({
            userAgent: rule.userAgent,
            allow: rule.allow,
            disallow: rule.disallow,
            crawlDelay: rule.crawlDelay,
        })),
        sitemap: config.sitemap,
        host: config.host,
    };
}
