'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const MAX_REFRESH_DELAY = 24 * 60 * 60 * 1000;
const REFRESHED_BOUNDARY_KEY = 'home-refreshed-boundary';

let lastRefreshedBoundary: string | null = null;

function wasBoundaryRefreshed(boundary: string) {
    if (lastRefreshedBoundary === boundary) return true;

    try {
        return window.sessionStorage.getItem(REFRESHED_BOUNDARY_KEY) === boundary;
    } catch {
        return false;
    }
}

function markBoundaryRefreshed(boundary: string) {
    lastRefreshedBoundary = boundary;

    try {
        window.sessionStorage.setItem(REFRESHED_BOUNDARY_KEY, boundary);
    } catch {
        // The in-memory guard still protects this tab when storage is unavailable.
    }
}

export function HomeBoundaryRefresh({
    nextBoundary,
    serverNow,
}: {
    nextBoundary: string | null;
    serverNow: string;
}) {
    const router = useRouter();

    useEffect(() => {
        if (!nextBoundary) return;

        const boundaryMs = new Date(nextBoundary).getTime();
        const serverNowMs = new Date(serverNow).getTime();
        if (!Number.isFinite(boundaryMs) || !Number.isFinite(serverNowMs)) return;

        // Schedule against the server clock. A device clock that is ahead of the
        // server must not repeatedly refresh the same server-rendered boundary.
        const clockOffset = serverNowMs - Date.now();

        let timeout: number | undefined;

        const scheduleRefresh = () => {
            const remaining = boundaryMs - (Date.now() + clockOffset) + 1_000;

            if (remaining <= 1_000) {
                if (wasBoundaryRefreshed(nextBoundary)) return;

                markBoundaryRefreshed(nextBoundary);
                router.refresh();
                return;
            }

            timeout = window.setTimeout(scheduleRefresh, Math.min(remaining, MAX_REFRESH_DELAY));
        };

        scheduleRefresh();

        return () => {
            if (timeout !== undefined) window.clearTimeout(timeout);
        };
    }, [nextBoundary, router, serverNow]);

    return null;
}
