'use client';

/**
 * Trackable Link Component
 *
 * A wrapper around Next.js Link that automatically tracks navigation clicks
 * via GTM when users navigate between pages.
 *
 * @example
 * ```tsx
 * <TrackableLink href="/problems" trackingLabel="problems-nav">
 *   Problems
 * </TrackableLink>
 * ```
 */

import * as React from 'react';
import Link, { LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';

export interface TrackableLinkProps extends LinkProps {
    children: React.ReactNode;
    /** Optional tracking label for the link */
    trackingLabel?: string;
    /** Optional tracking context */
    trackingContext?: string;
    /** Additional class names */
    className?: string;
    /** Whether to disable tracking */
    disableTracking?: boolean;
    /** Any other props to pass to the Link */
    [key: string]: any;
}

export function TrackableLink({
    children,
    href,
    trackingLabel,
    trackingContext,
    className,
    disableTracking = false,
    onClick,
    ...props
}: TrackableLinkProps) {
    const pathname = usePathname();
    const { trackNavigation } = useGTMTracker();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!disableTracking) {
            const destination = typeof href === 'string' ? href : href.pathname || '';
            const label = trackingLabel || destination;

            trackNavigation(pathname || '/', destination, label, trackingContext);
        }

        // Call original onClick if provided
        onClick?.(e);
    };

    return (
        <Link href={href} className={className} onClick={handleClick} {...props}>
            {children}
        </Link>
    );
}
