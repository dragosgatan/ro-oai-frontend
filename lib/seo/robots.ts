/**
 * Robots.txt Configuration
 *
 * Manages robots.txt generation with crawling rules for different user agents
 */

import { RobotsConfig } from './types';
import { BASE_URL } from './config';

// ============================================================================
// Private Routes Configuration
// ============================================================================

/**
 * Routes that should be disallowed from crawling
 */
const PRIVATE_ROUTES = [
    '/api/*', // API routes
    '/settings*', // User settings
    '/*/settings*', // Localized user settings
    '/profile/confirm*', // Profile confirmation
    '/*/profile/confirm*', // Localized profile confirmation
    '/login*', // Login pages
    '/*/login*', // Localized login pages
    '/logout*', // Logout pages
    '/*/logout*', // Localized logout pages
    '/my-questions*', // Private questions
    '/*/my-questions*', // Localized private questions
    '/my-requests*', // Private membership requests
    '/*/my-requests*', // Localized private membership requests
    '/writing*', // Private contributor workspace and invitations
    '/*/writing*', // Localized contributor workspace and invitations
    '/my-competitions*', // Private organizer workspace
    '/*/my-competitions*', // Localized organizer workspace
    '/competition-invitations*', // Competition invitation continuation
    '/*/competition-invitations*', // Localized competition invitation continuation
    '/demo-borders*', // Development-only visual playground
    '/*/demo-borders*', // Localized development-only visual playground
    '/*?*', // URLs with query parameters (avoid duplicate content)
] as const;

const PUBLIC_QUERY_ROUTES = ['/api/og', '/api/og?*$', '/articles?*$', '/*/articles?*$'] as const;

function matchesRobotsPattern(path: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '\\?');
    return new RegExp(`^${regexPattern}$`).test(path);
}

// ============================================================================
// User Agent Rules
// ============================================================================

/**
 * Generate rules for different user agents
 */
function generateUserAgentRules(): RobotsConfig['rules'] {
    return [
        {
            userAgent: '*',
            allow: ['/', ...PUBLIC_QUERY_ROUTES],
            disallow: [...PRIVATE_ROUTES],
        },
        {
            userAgent: 'Googlebot',
            allow: ['/', ...PUBLIC_QUERY_ROUTES],
            disallow: [...PRIVATE_ROUTES],
        },
        {
            userAgent: 'Bingbot',
            allow: ['/', ...PUBLIC_QUERY_ROUTES],
            disallow: [...PRIVATE_ROUTES],
        },
        // Block aggressive crawlers
        {
            userAgent: 'AhrefsBot',
            disallow: ['/'],
            crawlDelay: 10,
        },
        {
            userAgent: 'SemrushBot',
            disallow: ['/'],
            crawlDelay: 10,
        },
    ];
}

// ============================================================================
// Sitemap References
// ============================================================================

/**
 * Generate sitemap URLs
 */
function generateSitemapUrls(): string[] {
    return [`${BASE_URL}/sitemap.xml`];
}

// ============================================================================
// Main Configuration Generator
// ============================================================================

/**
 * Generate complete robots.txt configuration
 *
 * @returns RobotsConfig object with rules, sitemap references, and host
 *
 * @example
 * ```typescript
 * const config = generateRobotsConfig();
 * // {
 * //   rules: [{ userAgent: '*', allow: ['/'], disallow: ['/api/*'] }],
 * //   sitemap: ['https://platform.olimpiada-ai.ro/sitemap.xml'],
 * //   host: 'https://platform.olimpiada-ai.ro'
 * // }
 * ```
 */
export function generateRobotsConfig(): RobotsConfig {
    return {
        rules: generateUserAgentRules(),
        sitemap: generateSitemapUrls(),
        host: BASE_URL,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a path should be disallowed from crawling
 *
 * @param path - The path to check
 * @returns true if the path should be disallowed
 */
export function isPathDisallowed(path: string): boolean {
    if (PUBLIC_QUERY_ROUTES.some((pattern) => matchesRobotsPattern(path, pattern))) {
        return false;
    }

    // Check against private routes only
    return PRIVATE_ROUTES.some((pattern) => matchesRobotsPattern(path, pattern));
}

/**
 * Get the robots meta tag value for a given path
 *
 * @param path - The path to check
 * @returns Robots meta tag value (e.g., 'noindex, nofollow')
 */
export function getRobotsMetaTag(path: string): string | undefined {
    // Only add noindex for explicitly disallowed paths
    if (isPathDisallowed(path)) {
        return 'noindex, nofollow';
    }

    return undefined;
}

/**
 * Format robots.txt content as a string (for debugging/testing)
 *
 * @param config - The robots configuration
 * @returns Formatted robots.txt content
 */
export function formatRobotsTxt(config: RobotsConfig): string {
    const lines: string[] = [];

    // Add rules for each user agent
    for (const rule of config.rules) {
        lines.push(`User-agent: ${rule.userAgent}`);

        if (rule.allow) {
            for (const path of rule.allow) {
                lines.push(`Allow: ${path}`);
            }
        }

        if (rule.disallow) {
            for (const path of rule.disallow) {
                lines.push(`Disallow: ${path}`);
            }
        }

        if (rule.crawlDelay) {
            lines.push(`Crawl-delay: ${rule.crawlDelay}`);
        }

        lines.push(''); // Empty line between rules
    }

    // Add sitemap references
    if (config.sitemap && config.sitemap.length > 0) {
        for (const sitemapUrl of config.sitemap) {
            lines.push(`Sitemap: ${sitemapUrl}`);
        }
        lines.push('');
    }

    // Add host if specified
    if (config.host) {
        lines.push(`Host: ${config.host}`);
    }

    return lines.join('\n');
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate robots configuration
 *
 * @param config - The robots configuration to validate
 * @returns true if valid, throws error otherwise
 */
export function validateRobotsConfig(config: RobotsConfig): boolean {
    if (!config.rules || config.rules.length === 0) {
        throw new Error('Robots config must have at least one rule');
    }

    for (const rule of config.rules) {
        if (!rule.userAgent) {
            throw new Error('Each rule must have a userAgent');
        }

        if (rule.crawlDelay && (rule.crawlDelay < 0 || !Number.isInteger(rule.crawlDelay))) {
            throw new Error('crawlDelay must be a non-negative integer');
        }
    }

    if (config.sitemap) {
        for (const sitemapUrl of config.sitemap) {
            try {
                new URL(sitemapUrl);
            } catch {
                throw new Error(`Invalid sitemap URL: ${sitemapUrl}`);
            }
        }
    }

    return true;
}
