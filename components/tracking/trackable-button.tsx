'use client';

/**
 * Trackable Button Component
 *
 * A wrapper around the Button component that automatically tracks button clicks
 * via GTM for significant user interactions.
 *
 * @example
 * ```tsx
 * <TrackableButton trackingId="submit-form" trackingContext="contact-form">
 *   Submit
 * </TrackableButton>
 * ```
 */

import * as React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';

export interface TrackableButtonProps extends ButtonProps {
    /** Required tracking ID for the button */
    trackingId: string;
    /** Optional tracking context */
    trackingContext?: string;
    /** Whether to disable tracking */
    disableTracking?: boolean;
}

export const TrackableButton = React.forwardRef<HTMLButtonElement, TrackableButtonProps>(
    (
        { children, trackingId, trackingContext, disableTracking = false, onClick, ...props },
        ref,
    ) => {
        const { trackButtonClick } = useGTMTracker();

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disableTracking) {
                trackButtonClick(trackingId, trackingContext);
            }

            // Call original onClick if provided
            onClick?.(e);
        };

        return (
            <Button ref={ref} onClick={handleClick} {...props}>
                {children}
            </Button>
        );
    },
);

TrackableButton.displayName = 'TrackableButton';
