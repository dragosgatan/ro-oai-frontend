'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Submission, SubmissionNotification } from '@/lib/types';
import { SubmissionNotificationContainer } from './submission-notification-container';
import { analytics, AnalyticsEvents } from '@/lib/analytics';
import { useSession } from 'next-auth/react';
import { IMessage } from '@stomp/stompjs';
import { SubmissionDetailsModal } from '@/components/submission-details-modal';
import { setSubmissionsCallback } from '@/lib/realtime/stomp-client';

interface SubmissionNotificationContextValue {
    notifications: SubmissionNotification[];
    addNotification: (notification: SubmissionNotification) => void;
    dismissNotification: (id: number) => void;
    clearAllNotifications: () => void;
    openSubmissionDetails: (submissionId: number) => void;
}

const SubmissionNotificationContext = createContext<SubmissionNotificationContextValue | null>(
    null,
);

/**
 * Hook to access submission notification context.
 * Must be used within SubmissionNotificationProvider.
 */
export function useSubmissionNotifications(): SubmissionNotificationContextValue {
    const context = useContext(SubmissionNotificationContext);

    if (!context) {
        throw new Error(
            'useSubmissionNotifications must be used within SubmissionNotificationProvider',
        );
    }

    return context;
}

interface SubmissionNotificationProviderProps {
    children: React.ReactNode;
}

/**
 * Global provider for submission status notifications.
 *
 * Features:
 * - Manages notification state across the application
 * - Displays custom toast notifications when submissions complete
 * - Maintains notification history during the user session
 * - Limits notification history to 20 items to prevent memory issues
 * - Supports opening submission details modal
 * - Persists notifications across page navigation
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5
 *
 * Usage:
 * Wrap your application root with this provider to enable submission notifications.
 */
export function SubmissionNotificationProvider({ children }: SubmissionNotificationProviderProps) {
    const { data: session, status: sessionStatus } = useSession();
    const isAuthenticated = sessionStatus === 'authenticated' && !!session;
    const accessToken = session?.accessToken as string | undefined;
    const userId = String((session as any)?.id ?? session?.user?.email ?? '');

    // State for notification history
    const [notifications, setNotifications] = useState<SubmissionNotification[]>([]);

    // State for submission details modal
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionNotification | null>(
        null,
    );
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        setNotifications([]);
        setSelectedSubmission(null);
        setIsModalOpen(false);
    }, [isAuthenticated, userId]);

    /**
     * Add a new notification to the state.
     * The custom toast will be displayed by SubmissionNotificationContainer.
     *
     * Performance Optimization (Requirement 9):
     * - Limits notification history to 20 items to prevent memory issues
     * - Older notifications are automatically removed when limit is reached
     *
     * Requirement 6.3: Persist notification history during the user session
     */
    const addNotification = useCallback((notification: SubmissionNotification) => {
        setNotifications((prev) => {
            // Check for duplicate notifications (same submission ID)
            const isDuplicate = prev.some((n) => n.id === notification.id);
            if (isDuplicate) {
                return prev; // Don't add duplicate
            }

            // Add new notification at the beginning
            const updated = [notification, ...prev];

            // Limit to 20 notifications to prevent memory issues (Requirement 9)
            // This ensures bounded memory usage even with many submissions
            return updated.slice(0, 20);
        });
    }, []);

    /**
     * Dismiss a notification by marking it as dismissed.
     *
     * Requirement 4.3: User can dismiss notifications
     */
    const dismissNotification = useCallback((id: number) => {
        setNotifications((prev) =>
            prev.map((notification) =>
                notification.id === id ? { ...notification, dismissed: true } : notification,
            ),
        );
    }, []);

    /**
     * Clear all notifications from state.
     */
    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    /**
     * Open submission details modal.
     *
     * Requirement 3.1, 3.2: Provide clickable link to view submission details
     */
    const openSubmissionDetails = useCallback(
        (submissionId: number) => {
            setSelectedSubmission(notifications.find((s) => s.id === submissionId) ?? null);
            setIsModalOpen(true);
        },
        [notifications],
    );

    /**
     * Close submission details modal.
     */
    const closeSubmissionDetails = useCallback(() => {
        setIsModalOpen(false);
        // Keep selectedSubmissionId for a moment to allow smooth closing animation
        setTimeout(() => {
            setSelectedSubmission(null);
        }, 300);
    }, []);

    /**
     * Handle status changes detected by the polling hook.
     *
     * Requirements 1.2, 2.1, 2.2: Display notifications when submissions complete
     *
     * When a submission status changes:
     * 1. Add notification to state
     * 2. Trigger refresh for components listening to refreshTrigger
     * 3. Refresh the current route for server components
     */
    const handleStatusChange = useCallback(
        (notification: SubmissionNotification) => {
            addNotification(notification);

            // Track solution success event if submission was evaluated successfully
            if (notification.status === 'EVALUATED') {
                try {
                    analytics.trackEvent({
                        name: AnalyticsEvents.SOLUTION_SUCCESS,
                        properties: {
                            submissionId: notification.id,
                            problemId: notification.problemId,
                            problemTitle: notification.problemTitle,
                            timestamp: new Date().toISOString(),
                        },
                    });
                } catch (error) {
                    console.error('[Analytics] Failed to track solution success:', error);
                }
            }
        },
        [addNotification],
    );

    useEffect(() => {
        if (!isAuthenticated || !userId || !accessToken) {
            return;
        }
        return setSubmissionsCallback((message: IMessage) => {
            try {
                const body = JSON.parse(message.body);
                const submission: Submission = body.payload;
                if (submission && body.type === 'SUBMISSION_EVALUATED') {
                    const notification: SubmissionNotification = {
                        ...submission,
                        timestamp: new Date(),
                        dismissed: false,
                    };
                    handleStatusChange(notification);
                }
            } catch (err) {
                console.error('[WS] Failed to process message', err);
            }
        }, accessToken);
    }, [isAuthenticated, userId, accessToken, handleStatusChange]);

    // Context value
    const contextValue: SubmissionNotificationContextValue = {
        notifications,
        addNotification,
        dismissNotification,
        clearAllNotifications,
        openSubmissionDetails,
    };

    return (
        <SubmissionNotificationContext.Provider value={contextValue}>
            {children}

            {/* Render custom notification toasts */}
            {/* Requirements 4.1, 4.5: Position in non-blocking location, stack vertically */}
            <SubmissionNotificationContainer
                notifications={notifications}
                onDismiss={dismissNotification}
                onViewDetails={openSubmissionDetails}
                maxVisible={3}
            />

            {/* Render submission details modal */}
            {/* Requirement 3.2, 3.3, 3.4: Display submission details modal */}
            {selectedSubmission !== null && (
                <SubmissionDetailsModal
                    submission={selectedSubmission}
                    open={isModalOpen}
                    onOpenChange={closeSubmissionDetails}
                />
            )}
        </SubmissionNotificationContext.Provider>
    );
}
