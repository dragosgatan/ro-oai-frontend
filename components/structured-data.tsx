/**
 * StructuredData Component
 *
 * Renders JSON-LD structured data for SEO
 * Supports single or multiple structured data objects on a page
 */

import { serializeStructuredData, validateStructuredData } from '@/lib/seo/structured-data';

interface StructuredDataProps {
    /**
     * Single structured data object or array of objects
     */
    data: object | object[];
}

/**
 * StructuredData component
 *
 * Renders JSON-LD script tags with proper escaping for SEO
 *
 * @example
 * // Single schema
 * <StructuredData data={organizationSchema} />
 *
 * @example
 * // Multiple schemas
 * <StructuredData data={[organizationSchema, websiteSchema]} />
 */
export function StructuredData({ data }: StructuredDataProps) {
    // Normalize to array for consistent handling
    const schemas = Array.isArray(data) ? data : [data];

    // Filter out invalid schemas. Serialization performs the final deep
    // sanitization and HTML-safe escaping for the script context.
    const validSchemas = schemas.filter((schema) => {
        if (!validateStructuredData(schema)) {
            console.warn('[StructuredData] Invalid schema detected and skipped:', schema);
            return false;
        }
        return true;
    });

    // Don't render if no valid schemas
    if (validSchemas.length === 0) {
        return null;
    }

    return (
        <>
            {validSchemas.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: serializeStructuredData(schema),
                    }}
                />
            ))}
        </>
    );
}

/**
 * Helper component for rendering multiple structured data objects
 * Provides a more semantic API for multiple schemas
 */
export function StructuredDataCollection({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
