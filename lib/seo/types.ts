/**
 * SEO Types and Interfaces
 *
 * Core TypeScript types for metadata, structured data, and sitemap generation
 */

// ============================================================================
// Site Configuration
// ============================================================================

export interface SiteConfig {
    name: string;
    description: string;
    url: string;
    ogImage: string;
    twitterHandle?: string;
    locale: string;
    supportedLocales: string[];
}

// ============================================================================
// Metadata Types
// ============================================================================

export interface MetadataConfig {
    title: string;
    description: string;
    keywords?: string[];
    image?: string;
    type?: 'website' | 'article' | 'profile';
    locale: string;
    alternateLocales?: string[];
    canonicalUrl?: string;
    noindex?: boolean;
    nofollow?: boolean;
    publishedTime?: Date;
    modifiedTime?: Date;
    author?: string;
    section?: string;
    tags?: string[];
}

export interface OpenGraphMetadata {
    title: string;
    description: string;
    url: string;
    siteName: string;
    images: Array<{
        url: string;
        width: number;
        height: number;
        alt: string;
    }>;
    locale: string;
    alternateLocales?: string[];
    type: string;
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
}

export interface TwitterMetadata {
    card: 'summary_large_image' | 'summary';
    title: string;
    description: string;
    images: string[];
    creator?: string;
    site?: string;
}

export interface PageMetadata {
    title: string;
    description: string;
    keywords?: string;
    openGraph: OpenGraphMetadata;
    twitter: TwitterMetadata;
    alternates?: {
        canonical: string;
        languages: Record<string, string>;
    };
    robots?: {
        index: boolean;
        follow: boolean;
        googleBot?: {
            index: boolean;
            follow: boolean;
        };
    };
}

export interface PageSEO {
    title: string;
    description: string;
    keywords?: string[];
    image?: string;
    type?: 'website' | 'article' | 'profile';
    publishedTime?: Date;
    modifiedTime?: Date;
    author?: string;
    section?: string;
    tags?: string[];
}

// ============================================================================
// Structured Data Types
// ============================================================================

export type StructuredDataType =
    | 'Organization'
    | 'WebSite'
    | 'Problem'
    | 'Person'
    | 'ItemList'
    | 'BreadcrumbList'
    | 'Article'
    | 'Event'
    | 'Quiz'
    | 'ImageObject';

export interface StructuredDataProps {
    type: StructuredDataType;
    data: Record<string, any>;
    locale: string;
}

// ============================================================================
// ImageObject Schema (for logo and image license)
// ============================================================================

export interface ImageObjectSchema {
    '@context': 'https://schema.org';
    '@type': 'ImageObject';
    contentUrl: string;
    url?: string;
    width?: number;
    height?: number;
    license?: string;
    acquireLicensePage?: string;
    creditText?: string;
    creator?: {
        '@type': 'Organization' | 'Person';
        name: string;
    };
    copyrightNotice?: string;
}

// ============================================================================
// Organization Schema (UPDATED with logo as ImageObject)
// ============================================================================

export interface OrganizationSchema {
    '@context': 'https://schema.org';
    '@type': 'Organization';
    name: string;
    alternateName?: string;
    url: string;
    logo: {
        '@type': 'ImageObject';
        url: string;
        width?: number;
        height?: number;
    };
    description?: string;
    email?: string;
    foundingDate?: string;
    sameAs?: string[];
    contactPoint?: {
        '@type': 'ContactPoint';
        contactType: string;
        email?: string;
        availableLanguage?: string[];
    };
    inLanguage?: string;
}

export interface WebSiteSchema {
    '@context': 'https://schema.org';
    '@type': 'WebSite';
    name: string;
    url: string;
    description?: string;
    potentialAction?: {
        '@type': 'SearchAction';
        target: string;
        'query-input': string;
    };
    inLanguage?: string;
}

export interface PersonSchema {
    '@context': 'https://schema.org';
    '@type': 'Person';
    name: string;
    alternateName?: string;
    url?: string;
    image?: string;
    description?: string;
    sameAs?: string[];
}

export interface BreadcrumbItem {
    name: string;
    url: string;
}

export interface BreadcrumbSchema {
    '@context': 'https://schema.org';
    '@type': 'BreadcrumbList';
    itemListElement: Array<{
        '@type': 'ListItem';
        position: number;
        name: string;
        item: string;
    }>;
}

// ============================================================================
// Event Schema (for Competitions - Google compliant)
// ============================================================================

export type EventStatusType =
    | 'https://schema.org/EventScheduled'
    | 'https://schema.org/EventCancelled'
    | 'https://schema.org/EventPostponed'
    | 'https://schema.org/EventRescheduled'
    | 'https://schema.org/EventMovedOnline';

export interface EventSchema {
    '@context': 'https://schema.org';
    '@type': 'Event';
    name: string;
    description?: string;
    startDate: string; // ISO 8601
    endDate: string; // ISO 8601
    eventStatus: EventStatusType;
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode';
    location: {
        '@type': 'VirtualLocation';
        url: string;
    };
    organizer: {
        '@type': 'Organization';
        name: string;
        url: string;
    };
    image?: string;
    offers?: {
        '@type': 'Offer';
        price: string;
        priceCurrency: string;
        availability: string;
        url: string;
        validFrom?: string;
    };
    performer?: {
        '@type': 'Organization';
        name: string;
        url: string;
    };
    inLanguage?: string;
}

// ============================================================================
// Article Schema (for Roadmap pages)
// ============================================================================

export interface ArticleSchema {
    '@context': 'https://schema.org';
    '@type': 'Article';
    headline: string;
    description?: string;
    image?: string | string[];
    datePublished: string;
    dateModified?: string;
    author: {
        '@type': 'Organization' | 'Person';
        name: string;
        url?: string;
    };
    publisher: {
        '@type': 'Organization';
        name: string;
        logo: {
            '@type': 'ImageObject';
            url: string;
        };
    };
    mainEntityOfPage?: {
        '@type': 'WebPage';
        '@id': string;
    };
}

// ============================================================================
// Quiz Schema (for Problems - Google Practice Problems compliant)
// ============================================================================

export interface QuestionSchema {
    '@type': 'Question';
    eduQuestionType?: 'Flashcard' | 'Multiple choice' | 'Open ended';
    name: string;
    text?: string;
    acceptedAnswer?: {
        '@type': 'Answer';
        text: string;
    };
}

export interface QuizSchema {
    '@context': 'https://schema.org';
    '@type': 'Quiz';
    name: string;
    inLanguage?: string;
    about?: {
        '@type': 'Thing';
        name: string;
    };
    educationalLevel?: string;
    educationalAlignment?: Array<{
        '@type': 'AlignmentObject';
        alignmentType: string;
        educationalFramework?: string;
        targetName: string;
    }>;
    hasPart?: QuestionSchema[];
    keywords?: string[];
    author?: Array<{
        '@type': 'Person';
        name: string;
        url?: string;
    }>;
}

// ============================================================================
// Sitemap Types
// ============================================================================

export interface SitemapEntry {
    url: string;
    lastModified?: Date;
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
    alternateRefs?: Array<{
        href: string;
        hreflang: string;
    }>;
}

export interface SitemapConfig {
    baseUrl: string;
    supportedLocales: string[];
    defaultLocale: string;
}

// ============================================================================
// Robots Types
// ============================================================================

export interface RobotsRule {
    userAgent: string;
    allow?: string[];
    disallow?: string[];
    crawlDelay?: number;
}

export interface RobotsConfig {
    rules: RobotsRule[];
    sitemap: string[];
    host?: string;
}

// ============================================================================
// Canonical URL Types
// ============================================================================

export interface CanonicalUrlConfig {
    baseUrl: string;
    path: string;
    locale?: string;
    includeLocale?: boolean;
}

// ============================================================================
// Hreflang Types
// ============================================================================

export interface HreflangTag {
    hreflang: string;
    href: string;
}

export interface HreflangConfig {
    baseUrl: string;
    path: string;
    supportedLocales: string[];
    defaultLocale: string;
}
