'use client';

import { GlobeIcon, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/hooks/use-locale';
import { LOCALES, type LocaleConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRef, useEffect, useState, memo, useMemo } from 'react';
import { analytics, AnalyticsEvents } from '@/lib/analytics';
import { useTranslations } from 'next-intl';
import {
    headerControlClassName,
    headerMenuItemClassName,
    headerMenuSurfaceClassName,
} from '@/components/header-styles';

/**
 * Sorts locale configurations alphabetically by native name using locale-aware comparison.
 * This ensures proper sorting for languages with special characters (e.g., Čeština, Español).
 *
 * @param locales - Array of LocaleConfig objects to sort
 * @returns Sorted array of LocaleConfig objects
 */
export function sortLocalesByNativeName(locales: LocaleConfig[]): LocaleConfig[] {
    return [...locales].sort((a, b) =>
        a.nativeName.localeCompare(b.nativeName, undefined, { sensitivity: 'base' }),
    );
}

/**
 * Language selector component with dropdown menu
 * Allows users to switch between all 30 supported languages:
 * - Arabic (🇸🇦), Bulgarian (🇧🇬), Chinese Simplified (🇨🇳), Croatian (🇭🇷), Czech (🇨🇿)
 * - Danish (🇩🇰), Dutch (🇳🇱), English (🇬🇧), Estonian (🇪🇪), Finnish (🇫🇮)
 * - French (🇫🇷), Georgian (🇬🇪), German (🇩🇪), Hebrew (🇮🇱), Hungarian (🇭🇺)
 * - Italian (🇮🇹), Kazakh (🇰🇿), Latvian (🇱🇻), Lithuanian (🇱🇹), Norwegian (🇳🇴)
 * - Polish (🇵🇱), Portuguese (🇵🇹), Romanian (🇷🇴), Russian (🇷🇺), Serbian (🇷🇸)
 * - Slovak (🇸🇰), Slovenian (🇸🇮), Spanish (🇪🇸), Swedish (🇸🇪), Ukrainian (🇺🇦)
 *
 * Features:
 * - Visual indicator for currently active language
 * - Flag emojis and native language names
 * - Languages sorted alphabetically by native name
 * - Keyboard accessible (Tab, Enter, Arrow keys)
 * - Screen reader friendly with proper ARIA labels and live announcements
 * - Minimum 44x44px touch targets for mobile accessibility
 * - Focus visible states and hover feedback
 * - Immediate switching feedback
 * - Matches existing header design system
 *
 * Accessibility:
 * - WCAG 2.1 AA compliant
 * - Keyboard navigation: Tab (focus), Enter/Space (open), Arrow keys (navigate)
 * - Screen reader announcements for language changes
 * - Proper ARIA roles and labels
 *
 * Requirements: 3.1, 3.2, 3.3
 */
type LanguageSelectorProps = {
    className?: string;
    onLocaleChange?: () => void;
};

export const LanguageSelector = memo(function LanguageSelector({
    className,
    onLocaleChange,
}: LanguageSelectorProps) {
    const { locale, setLocale, isInitialized } = useLocale();
    const t = useTranslations();
    const announcementRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    // Sort locales alphabetically by native name for consistent display
    // Memoized to avoid re-sorting on every render
    const sortedLocales = useMemo(() => sortLocalesByNativeName(Object.values(LOCALES)), []);

    // Announce language changes to screen readers
    useEffect(() => {
        if (isInitialized && announcementRef.current) {
            const currentLocale = LOCALES[locale];
            announcementRef.current.textContent = `${t('header.changeLanguage')}: ${currentLocale.nativeName}`;
        }
    }, [locale, isInitialized, t]);

    // Don't render until locale is initialized to avoid hydration mismatch
    if (!isInitialized) {
        return (
            <button
                type="button"
                className={cn(headerControlClassName, className)}
                disabled
                aria-label={t('header.changeLanguage')}
            >
                <GlobeIcon className="h-4 w-4" aria-hidden="true" />
            </button>
        );
    }

    const currentLocale = LOCALES[locale];

    const handleLanguageChange = (newLocale: string) => {
        if (newLocale === locale) return;

        // Track language change event
        try {
            analytics.trackEvent({
                name: AnalyticsEvents.LANGUAGE_CHANGE,
                properties: {
                    fromLanguage: locale,
                    toLanguage: newLocale,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            console.error('[Analytics] Failed to track language change:', error);
        }

        onLocaleChange?.();
        void setLocale(newLocale as typeof locale);
    };

    return (
        <>
            {/* Screen reader announcement region for language changes */}
            <div
                ref={announcementRef}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            />

            <DropdownMenu modal={false} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className={cn(headerControlClassName, className, 'relative')}
                        aria-label={`${t('header.changeLanguage')}: ${currentLocale.nativeName}`}
                        aria-haspopup="menu"
                        aria-expanded={isOpen}
                    >
                        <GlobeIcon className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">
                            {t('header.changeLanguage')}: {currentLocale.nativeName}
                        </span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    sideOffset={10}
                    aria-label={t('header.changeLanguage')}
                    className={cn(
                        'max-h-[min(26rem,calc(100vh-6rem))] w-64 overflow-y-auto p-2 font-sans',
                        headerMenuSurfaceClassName,
                    )}
                >
                    {sortedLocales.map((localeConfig) => {
                        const isActive = locale === localeConfig.code;

                        return (
                            <DropdownMenuItem
                                key={localeConfig.code}
                                onSelect={() => handleLanguageChange(localeConfig.code)}
                                className={cn(
                                    headerMenuItemClassName,
                                    'flex items-center gap-3',
                                    isActive &&
                                        'border-[oklch(0.43_0.235_291)] bg-[oklch(0.89_0.185_116)] text-[oklch(0.2_0.045_282)] focus:bg-[oklch(0.89_0.185_116)] focus:text-[oklch(0.2_0.045_282)] dark:border-[oklch(0.77_0.17_292)] dark:bg-[oklch(0.86_0.17_116)] dark:text-[oklch(0.2_0.045_282)] dark:focus:bg-[oklch(0.86_0.17_116)] dark:focus:text-[oklch(0.2_0.045_282)]',
                                )}
                                aria-current={isActive ? 'true' : undefined}
                                aria-label={`${localeConfig.nativeName}${isActive ? `, ${t('common.selected')}` : ''}`}
                            >
                                <span className="text-lg leading-none" aria-hidden="true">
                                    {localeConfig.flag}
                                </span>
                                <span className="min-w-0 flex-1 font-medium" dir="auto">
                                    {localeConfig.nativeName}
                                </span>
                                {isActive ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
});
