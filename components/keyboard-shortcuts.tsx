'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppearance } from '@/components/providers/appearance-provider';

/**
 * Keyboard Shortcuts Handler
 * Implements keyboard shortcuts for common actions
 * Meets WCAG 2.1 AA requirement 2.1.1 (Keyboard)
 *
 * Shortcuts:
 * - Alt + H: Go to homepage
 * - Alt + L: Go to leaderboard
 * - Alt + R: Go to roadmap
 * - Alt + T: Toggle theme
 * - Alt + /: Focus search (if available)
 * - Escape: Close modals/menus
 */
export function KeyboardShortcuts() {
    const router = useRouter();
    const { setColorMode, resolvedColorMode } = useAppearance();

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only trigger shortcuts with Alt key (Option on Mac)
            // This prevents conflicts with browser shortcuts
            if (!event.altKey) return;

            // Prevent default browser behavior for our shortcuts
            const shortcuts: Record<string, () => void> = {
                h: () => {
                    event.preventDefault();
                    router.push('/');
                },
                l: () => {
                    event.preventDefault();
                    router.push('/leaderboard');
                },
                r: () => {
                    event.preventDefault();
                    router.push('/roadmap');
                },
                t: () => {
                    event.preventDefault();
                    // Toggle between light and dark (skip system)
                    void setColorMode(resolvedColorMode === 'dark' ? 'light' : 'dark');
                },
                '/': () => {
                    event.preventDefault();
                    // Focus search input if it exists
                    const searchInput =
                        document.querySelector<HTMLInputElement>('input[type="search"]');
                    if (searchInput) {
                        searchInput.focus();
                    }
                },
            };

            const handler = shortcuts[event.key.toLowerCase()];
            if (handler) {
                handler();
            }
        };

        // Add event listener
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [resolvedColorMode, router, setColorMode]);

    // This component doesn't render anything
    return null;
}
