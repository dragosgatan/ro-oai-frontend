'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Locale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@/lib/types';
import { saveLocale as saveLocaleToStorage, updateHtmlLang } from '@/lib/i18n-config';

/**
 * Extract locale from URL pathname
 * Returns the locale if found in the path, otherwise null
 */
function getLocaleFromPath(pathname: string): Locale | null {
    // Check if path starts with a locale prefix (e.g., /it/problems, /ro/leaderboard)
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
        const potentialLocale = segments[0];
        if (SUPPORTED_LOCALES.includes(potentialLocale as Locale)) {
            return potentialLocale as Locale;
        }
    }
    return null;
}

/**
 * Remove locale prefix from pathname
 */
function removeLocaleFromPath(pathname: string): string {
    const localeFromPath = getLocaleFromPath(pathname);
    if (localeFromPath) {
        // Remove the locale prefix
        const segments = pathname.split('/').filter(Boolean);
        segments.shift(); // Remove locale
        return '/' + segments.join('/') || '/';
    }
    return pathname;
}

/**
 * Custom hook for client-side locale management
 * Handles locale detection from URL, persistence, and switching
 *
 * Priority for locale detection:
 * 1. URL path (e.g., /it/problems -> Italian)
 * 2. Fallback to default locale for non-prefixed paths
 */
export function useLocale() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize and sync locale from URL path
    useEffect(() => {
        // Get locale from URL path - this is the source of truth
        const localeFromPath = getLocaleFromPath(pathname);
        const currentLocale = localeFromPath || DEFAULT_LOCALE;

        setLocaleState(currentLocale);
        updateHtmlLang(currentLocale);

        // Sync to storage for consistency
        saveLocaleToStorage(currentLocale);

        setIsInitialized(true);
    }, [pathname]);

    /**
     * Switch to a new locale
     * - Navigates to the locale-prefixed URL
     * - Updates state and persists to storage
     * - Updates HTML lang attribute
     * - Preserves the current query string and hash
     */
    const setLocale = useCallback(
        (newLocale: Locale) => {
            if (!SUPPORTED_LOCALES.includes(newLocale)) return;

            // Get the current path without locale prefix
            const pathWithoutLocale = removeLocaleFromPath(pathname);

            // Build the new URL with the locale prefix
            // All locales get a prefix (including default)
            const query = searchParams.toString();
            const hash = typeof window === 'undefined' ? '' : window.location.hash;
            const newPath = `/${newLocale}${pathWithoutLocale}${query ? `?${query}` : ''}${hash}`;

            // Update state immediately for responsive UI
            setLocaleState(newLocale);
            saveLocaleToStorage(newLocale);
            updateHtmlLang(newLocale);

            // Set cookie for server-side locale detection
            // Dispatch custom event for cross-component synchronization
            if (typeof window !== 'undefined') {
                window.dispatchEvent(
                    new CustomEvent('localechange', {
                        detail: { locale: newLocale },
                    }),
                );
            }

            // Navigate to the new locale URL
            router.push(newPath);
        },
        [pathname, router, searchParams],
    );

    // Listen for locale changes from other components/tabs
    useEffect(() => {
        const handleLocaleChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ locale: Locale }>;
            if (customEvent.detail?.locale) {
                setLocaleState(customEvent.detail.locale);
                updateHtmlLang(customEvent.detail.locale);
            }
        };

        window.addEventListener('localechange', handleLocaleChange);

        return () => {
            window.removeEventListener('localechange', handleLocaleChange);
        };
    }, []);

    return {
        locale,
        setLocale,
        isInitialized,
    };
}
