import { useEffect, useRef } from 'react';

/**
 * Hook to manage table scroll indicators
 * Adds classes to show/hide scroll indicators based on scroll position
 */
export function useTableScroll() {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const handleScroll = () => {
            const { scrollLeft, scrollWidth, clientWidth } = element;
            const isAtStart = scrollLeft > 10;
            const isAtEnd = scrollLeft < scrollWidth - clientWidth - 10;

            // Add/remove classes based on scroll position
            if (isAtStart) {
                element.classList.add('scrolled-start');
            } else {
                element.classList.remove('scrolled-start');
            }

            if (isAtEnd) {
                element.classList.remove('scrolled-end');
            } else {
                element.classList.add('scrolled-end');
            }
        };

        // Initial check
        handleScroll();

        // Add scroll listener
        element.addEventListener('scroll', handleScroll);

        // Add resize listener to recalculate on window resize
        window.addEventListener('resize', handleScroll);

        return () => {
            element.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    return scrollRef;
}
