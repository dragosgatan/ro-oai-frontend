import type { Locale } from '@/lib/types';

export const MESSAGE_FALLBACK_LOCALE: Locale = 'en';

/** Deeply fills missing message keys without replacing translated values. */
export function mergeMessageFallback(
    targetMessages: Record<string, any>,
    fallbackMessages: Record<string, any>,
    locale?: string,
    path = '',
): Record<string, any> {
    const merged: Record<string, any> = { ...targetMessages };

    for (const [key, fallbackValue] of Object.entries(fallbackMessages)) {
        const currentPath = path ? `${path}.${key}` : key;
        const targetValue = targetMessages[key];

        if (!(key in targetMessages)) {
            if (process.env.NODE_ENV === 'development' && locale) {
                console.warn(`[i18n] Missing translation: "${currentPath}" for locale: ${locale}`);
            }
            merged[key] = fallbackValue;
        } else if (
            typeof fallbackValue === 'object' &&
            fallbackValue !== null &&
            !Array.isArray(fallbackValue)
        ) {
            merged[key] = mergeMessageFallback(
                typeof targetValue === 'object' && targetValue !== null ? targetValue : {},
                fallbackValue,
                locale,
                currentPath,
            );
        }
    }

    return merged;
}
