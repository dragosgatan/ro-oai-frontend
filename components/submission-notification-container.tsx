'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SubmissionNotificationToast } from './submission-notification-toast';
import type { SubmissionNotification } from '@/lib/types';

export interface SubmissionNotificationContainerProps {
    /** Array of notifications to display */
    notifications: SubmissionNotification[];
    /** Callback when a notification is dismissed */
    onDismiss: (id: number) => void;
    /** Callback when "View Details" is clicked */
    onViewDetails: (submissionId: number) => void;
    /** Maximum number of visible notifications (default: 3) */
    maxVisible?: number;
}

/**
 * Container component that manages the display and stacking of submission notifications.
 *
 * Features:
 * - Positions notifications in top-right corner
 * - Stacks notifications vertically
 * - Limits visible notifications to max 3 (configurable)
 * - Fetches submission details for each notification
 * - Manages z-index for proper stacking
 * - Uses React Portal for proper positioning outside normal DOM flow
 *
 * Requirements: 4.1, 4.5
 */
export function SubmissionNotificationContainer({
    notifications,
    onDismiss,
    onViewDetails,
    maxVisible = 3,
}: SubmissionNotificationContainerProps) {
    const [mounted, setMounted] = useState(false);

    // Only render on client side (for portal)
    useEffect(() => {
        setMounted(true);
    }, []);

    // Don't render on server side
    if (!mounted) {
        return null;
    }

    // Filter to only show non-dismissed notifications
    const visibleNotifications = notifications.filter((n) => !n.dismissed).slice(0, maxVisible);

    // Don't render container if no notifications
    if (visibleNotifications.length === 0) {
        return null;
    }

    const content = (
        <div className="pointer-events-none fixed inset-x-3 top-3 z-[70] flex max-h-[calc(100dvh-1.5rem)] flex-col gap-3 sm:start-auto sm:end-4 sm:top-4 sm:w-[min(28rem,calc(100vw-2rem))]">
            {visibleNotifications.map((notification, index) => (
                <div key={notification.id} className="pointer-events-auto">
                    <SubmissionNotificationToast
                        id={notification.id}
                        submissionId={notification.id}
                        problemId={notification.problemId}
                        problemTitle={notification.problemTitle}
                        status={notification.status as 'EVALUATED' | 'ERROR'}
                        submission={notification}
                        onDismiss={onDismiss}
                        onViewDetails={onViewDetails}
                        zIndex={70 - index}
                    />
                </div>
            ))}
        </div>
    );

    // Use portal to render outside normal DOM flow
    return createPortal(content, document.body);
}
