/**
 * Subscribe to a media query across both the current EventTarget API and the
 * legacy Safari API. Keeping the fallback here prevents a failed effect from
 * interrupting hydration on older WebKit releases.
 */
export function subscribeToMediaQuery(
    mediaQuery: MediaQueryList,
    listener: (event: MediaQueryListEvent) => void,
): () => void {
    if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', listener);
        return () => mediaQuery.removeEventListener('change', listener);
    }

    mediaQuery.addListener(listener);
    return () => mediaQuery.removeListener(listener);
}
