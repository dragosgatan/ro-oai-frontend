'use client';

/**
 * Trackable Form Component
 *
 * A wrapper around HTML form that automatically tracks form submissions
 * via GTM for analytics purposes.
 *
 * @example
 * ```tsx
 * <TrackableForm formType="contact" onSubmit={handleSubmit}>
 *   <input name="email" />
 *   <button type="submit">Submit</button>
 * </TrackableForm>
 * ```
 */

import * as React from 'react';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';

export interface TrackableFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
    /** Required form type identifier */
    formType: string;
    /** Callback when form is submitted with tracking */
    onTrackSubmit?: (success: boolean) => void;
    /** Whether to disable tracking */
    disableTracking?: boolean;
}

export const TrackableForm = React.forwardRef<HTMLFormElement, TrackableFormProps>(
    ({ children, formType, onTrackSubmit, disableTracking = false, onSubmit, ...props }, ref) => {
        const { trackFormSubmit } = useGTMTracker();

        const handleSubmit: React.SubmitEventHandler<HTMLFormElement> = async (e) => {
            let success = true;

            try {
                // Call original onSubmit if provided
                if (onSubmit) {
                    await onSubmit(e);
                }
            } catch (error) {
                success = false;
                throw error;
            } finally {
                if (!disableTracking) {
                    trackFormSubmit(formType, success);
                    onTrackSubmit?.(success);
                }
            }
        };

        return (
            <form ref={ref} onSubmit={handleSubmit} {...props}>
                {children}
            </form>
        );
    },
);

TrackableForm.displayName = 'TrackableForm';

/**
 * Hook for tracking form submissions manually
 * Useful when you can't wrap the form with TrackableForm
 */
export function useFormTracking(formType: string) {
    const { trackFormSubmit } = useGTMTracker();

    const trackSubmission = React.useCallback(
        (success: boolean) => {
            trackFormSubmit(formType, success);
        },
        [formType, trackFormSubmit],
    );

    return { trackSubmission };
}
