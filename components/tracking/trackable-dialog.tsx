'use client';

/**
 * Trackable Dialog Component
 *
 * A wrapper around the Dialog component that automatically tracks modal
 * open/close interactions via GTM.
 *
 * @example
 * ```tsx
 * <TrackableDialog modalType="confirmation" open={isOpen} onOpenChange={setIsOpen}>
 *   <DialogContent>...</DialogContent>
 * </TrackableDialog>
 * ```
 */

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog } from '@/components/ui/dialog';
import { useGTMTracker } from '@/hooks/use-gtm-tracker';

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>;

// Re-export all dialog components for convenience
export {
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

export interface TrackableDialogProps extends DialogProps {
    /** Required modal type identifier */
    modalType: string;
    /** Whether to disable tracking */
    disableTracking?: boolean;
}

export function TrackableDialog({
    children,
    modalType,
    disableTracking = false,
    open,
    onOpenChange,
    ...props
}: TrackableDialogProps) {
    const { trackModalInteraction } = useGTMTracker();
    const previousOpenRef = React.useRef(open);

    // Track open/close changes
    React.useEffect(() => {
        if (!disableTracking && previousOpenRef.current !== open) {
            trackModalInteraction(modalType, open ? 'open' : 'close');
        }
        previousOpenRef.current = open;
    }, [open, modalType, disableTracking, trackModalInteraction]);

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange?.(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} {...props}>
            {children}
        </Dialog>
    );
}

/**
 * Hook for tracking modal interactions manually
 * Useful when you can't wrap the dialog with TrackableDialog
 */
export function useModalTracking(modalType: string) {
    const { trackModalInteraction } = useGTMTracker();

    const trackOpen = React.useCallback(() => {
        trackModalInteraction(modalType, 'open');
    }, [modalType, trackModalInteraction]);

    const trackClose = React.useCallback(() => {
        trackModalInteraction(modalType, 'close');
    }, [modalType, trackModalInteraction]);

    return { trackOpen, trackClose };
}
