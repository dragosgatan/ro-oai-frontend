import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/types';

/**
 * Define the routing configuration for next-intl
 * This is used by both the middleware and navigation utilities
 */
export const routing = defineRouting({
    // List of all supported locales
    locales: SUPPORTED_LOCALES,

    // Default locale when none is detected
    defaultLocale: DEFAULT_LOCALE,

    // Always add locale prefix for all languages
    localePrefix: 'always',

    // Disable Accept-Language header detection so we always
    // default to Romanian unless the user explicitly picks a language
    localeDetection: false,
});

/**
 * Navigation utilities that work with the locale routing
 * Use these instead of next/link and next/navigation
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
