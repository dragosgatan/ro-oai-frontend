/**
 * Metadata Generation System
 *
 * Core metadata generator with Open Graph and Twitter Card support
 */

import { MetadataConfig, PageMetadata, OpenGraphMetadata, TwitterMetadata } from './types';
import {
    SITE_CONFIG,
    DEFAULT_METADATA,
    OG_DEFAULTS,
    TWITTER_DEFAULTS,
    BASE_URL,
    ensureTitleLength,
    ensureDescriptionLength,
    getFullUrl,
    getOgLocale,
    SUPPORTED_LOCALES,
} from './config';
import { generateAlternateLanguages } from './canonical';
import type { Locale } from '@/lib/types';

// ============================================================================
// Core Metadata Generator
// ============================================================================

/**
 * Generate complete page metadata from configuration
 * Includes Open Graph and Twitter Card metadata with fallbacks
 */
export function generateMetadata(config: MetadataConfig): PageMetadata {
    try {
        // Ensure title and description are within SEO limits
        const title = ensureTitleLength(config.title);
        const description = ensureDescriptionLength(config.description);

        // Generate canonical URL
        const canonicalUrl = config.canonicalUrl || getFullUrl('/', config.locale);

        // Generate Open Graph metadata
        const openGraph = generateOpenGraphMetadata(config, title, description, canonicalUrl);

        // Generate Twitter Card metadata
        const twitter = generateTwitterMetadata(config, title, description);

        // Generate alternates (canonical and language versions)
        const alternates = generateAlternates(config, canonicalUrl);

        // Generate robots directives
        const robots = generateRobotsDirectives(config);

        return {
            title,
            description,
            keywords: config.keywords?.join(', '),
            openGraph,
            twitter,
            alternates,
            robots,
        };
    } catch (error) {
        console.error('[SEO] Metadata generation failed:', error);
        return generateFallbackMetadata(config.locale);
    }
}

// ============================================================================
// Open Graph Metadata Generation
// ============================================================================

/**
 * Generate Open Graph metadata for social sharing
 * Uses locale-specific og:locale format and includes alternate locales
 */
function generateOpenGraphMetadata(
    config: MetadataConfig,
    title: string,
    description: string,
    url: string,
): OpenGraphMetadata {
    const images = config.image
        ? [
              {
                  url: config.image.startsWith('http')
                      ? config.image
                      : `${BASE_URL}${config.image}`,
                  width: 1200,
                  height: 630,
                  alt: title,
              },
          ]
        : OG_DEFAULTS.images;

    const locale = config.locale as Locale;

    const openGraph: OpenGraphMetadata = {
        title,
        description,
        url,
        siteName: SITE_CONFIG.name,
        images,
        locale: getOgLocale(locale),
        type: config.type || 'website',
    };

    // Add alternate locales for all other supported languages
    openGraph.alternateLocales = SUPPORTED_LOCALES.filter((l) => l !== locale).map((l) =>
        getOgLocale(l),
    );

    // Add optional article metadata
    if (config.type === 'article') {
        if (config.publishedTime) {
            openGraph.publishedTime = config.publishedTime.toISOString();
        }
        if (config.modifiedTime) {
            openGraph.modifiedTime = config.modifiedTime.toISOString();
        }
        if (config.author) {
            openGraph.author = config.author;
        }
        if (config.section) {
            openGraph.section = config.section;
        }
        if (config.tags) {
            openGraph.tags = config.tags;
        }
    }

    return openGraph;
}

// ============================================================================
// Twitter Card Metadata Generation
// ============================================================================

/**
 * Generate Twitter Card metadata for Twitter sharing
 */
function generateTwitterMetadata(
    config: MetadataConfig,
    title: string,
    description: string,
): TwitterMetadata {
    const images = config.image
        ? [config.image.startsWith('http') ? config.image : `${BASE_URL}${config.image}`]
        : [SITE_CONFIG.ogImage];

    return {
        card: 'summary_large_image',
        title,
        description,
        images,
        creator: TWITTER_DEFAULTS.creator,
        site: TWITTER_DEFAULTS.site,
    };
}

// ============================================================================
// Alternates Generation (Canonical & Hreflang)
// ============================================================================

/**
 * Generate alternate links (canonical and language versions)
 */
function generateAlternates(
    config: MetadataConfig,
    canonicalUrl: string,
): PageMetadata['alternates'] {
    // Extract path from canonical URL
    const path = canonicalUrl.replace(BASE_URL, '');

    // Generate language alternates using canonical utility
    const languages = generateAlternateLanguages(path);

    return {
        canonical: canonicalUrl,
        languages,
    };
}

// ============================================================================
// Robots Directives Generation
// ============================================================================

/**
 * Generate robots meta directives
 */
function generateRobotsDirectives(config: MetadataConfig): PageMetadata['robots'] {
    const index = config.noindex !== true;
    const follow = config.nofollow !== true;

    return {
        index,
        follow,
        googleBot: {
            index,
            follow,
        },
    };
}

// ============================================================================
// Fallback Metadata
// ============================================================================

/**
 * Generate fallback metadata when generation fails
 */
function generateFallbackMetadata(locale: string): PageMetadata {
    const typedLocale = locale as Locale;
    return {
        title: DEFAULT_METADATA.title,
        description: DEFAULT_METADATA.description,
        keywords: DEFAULT_METADATA.keywords.join(', '),
        openGraph: {
            title: DEFAULT_METADATA.title,
            description: DEFAULT_METADATA.description,
            url: BASE_URL,
            siteName: SITE_CONFIG.name,
            images: OG_DEFAULTS.images,
            locale: getOgLocale(typedLocale),
            alternateLocales: SUPPORTED_LOCALES.filter((l) => l !== typedLocale).map((l) =>
                getOgLocale(l),
            ),
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: DEFAULT_METADATA.title,
            description: DEFAULT_METADATA.description,
            images: [SITE_CONFIG.ogImage],
            creator: TWITTER_DEFAULTS.creator,
            site: TWITTER_DEFAULTS.site,
        },
        alternates: {
            canonical: BASE_URL,
            languages: {},
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
            },
        },
    };
}

// ============================================================================
// Metadata Validation Helpers
// ============================================================================

/**
 * Validate and sanitize metadata configuration
 */
export function validateMetadataConfig(config: Partial<MetadataConfig>): MetadataConfig {
    return {
        title: config.title || DEFAULT_METADATA.title,
        description: config.description || DEFAULT_METADATA.description,
        keywords: config.keywords || DEFAULT_METADATA.keywords,
        image: config.image || DEFAULT_METADATA.image,
        type: config.type || 'website',
        locale: config.locale || 'en',
        alternateLocales: config.alternateLocales,
        canonicalUrl: config.canonicalUrl,
        noindex: config.noindex,
        nofollow: config.nofollow,
        publishedTime: config.publishedTime,
        modifiedTime: config.modifiedTime,
        author: config.author,
        section: config.section,
        tags: config.tags,
    };
}

/**
 * Merge metadata configurations with defaults
 */
export function mergeMetadataConfig(
    base: Partial<MetadataConfig>,
    override: Partial<MetadataConfig>,
): MetadataConfig {
    return validateMetadataConfig({
        ...base,
        ...override,
    });
}
