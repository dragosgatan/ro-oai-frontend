import { useEffect, useState } from 'react';

import { subscribeToMediaQuery } from '@/lib/media-query';

export const mobileBreakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
};

export function useIsMobile(breakpoint: number = 768) {
    const [isMobile, setIsMobile] = useState<boolean>(() =>
        typeof window !== 'undefined'
            ? window.matchMedia(`(max-width: ${breakpoint}px)`).matches
            : false,
    );

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);

        const onChange = (e: MediaQueryListEvent) => {
            setIsMobile(e.matches);
        };

        setIsMobile(mql.matches);

        return subscribeToMediaQuery(mql, onChange);
    }, [breakpoint]);

    return isMobile;
}
