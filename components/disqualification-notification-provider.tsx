'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IMessage } from '@stomp/stompjs';
import { setDisqualificationCallback } from '@/lib/realtime/stomp-client';
import { DisqualificationModal } from '@/components/disqualification-modal';
import { useLocale } from 'next-intl';

/**
 * Disqualification payload from WebSocket notification
 */
export interface DisqualificationPayload {
    competitionId: number;
    competitionName: string;
    reason: string;
    timestamp: string;
}

interface DisqualificationContextValue {
    /** Current disqualification data, if any */
    disqualification: DisqualificationPayload | null;
    /** Whether the disqualification modal is showing */
    isModalOpen: boolean;
    /** Check if user is disqualified from a specific competition */
    isDisqualifiedFrom: (competitionId: number) => boolean;
    /** Clear disqualification state (after acknowledgment) */
    clearDisqualification: () => void;
    /** Add a competition to the disqualified set (for initial load from server) */
    addDisqualifiedCompetition: (competitionId: number) => void;
}

const DisqualificationContext = createContext<DisqualificationContextValue | null>(null);

/**
 * Hook to access disqualification notification context.
 * Must be used within DisqualificationNotificationProvider.
 */
export function useDisqualificationNotifications(): DisqualificationContextValue {
    const context = useContext(DisqualificationContext);

    if (!context) {
        throw new Error(
            'useDisqualificationNotifications must be used within DisqualificationNotificationProvider',
        );
    }

    return context;
}

interface DisqualificationNotificationProviderProps {
    children: React.ReactNode;
}

/**
 * Global provider for disqualification notifications.
 *
 * Features:
 * - Subscribes to WebSocket DISQUALIFICATION messages
 * - Shows DisqualificationModal when a disqualification is received
 * - Tracks disqualified competitions for access control
 * - Redirects to competition page after acknowledgment
 *
 * Requirements: 9.1, 9.4
 * - Display modal when disqualification received via WebSocket
 * - Redirect to competition page after acknowledgment
 */
export function DisqualificationNotificationProvider({
    children,
}: DisqualificationNotificationProviderProps) {
    const { data: session, status: sessionStatus } = useSession();
    const router = useRouter();
    const locale = useLocale();
    const isAuthenticated = sessionStatus === 'authenticated' && !!session;
    const accessToken = session?.accessToken as string | undefined;
    const userId = String((session as any)?.id ?? session?.user?.email ?? '');

    // State for current disqualification
    const [disqualification, setDisqualification] = useState<DisqualificationPayload | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Track all competitions user has been disqualified from
    const [disqualifiedCompetitions, setDisqualifiedCompetitions] = useState<Set<number>>(
        new Set(),
    );

    useEffect(() => {
        setDisqualification(null);
        setIsModalOpen(false);
        setDisqualifiedCompetitions(new Set());
    }, [isAuthenticated, userId]);

    /**
     * Handle incoming disqualification WebSocket message
     */
    const handleDisqualificationMessage = useCallback((message: IMessage) => {
        try {
            const body = JSON.parse(message.body);
            const payload: DisqualificationPayload = body.payload;

            if (body.type === 'DISQUALIFICATION' && payload) {
                console.log('[Disqualification] Received disqualification notification:', payload);

                // Add to disqualified competitions set
                setDisqualifiedCompetitions((prev) => new Set([...prev, payload.competitionId]));

                // Show the modal
                setDisqualification(payload);
                setIsModalOpen(true);
            } else if (body.type === 'DISQUALIFICATION_REVERSED' && payload) {
                console.log('[Disqualification] Disqualification reversed:', payload);

                // Remove from disqualified competitions set
                setDisqualifiedCompetitions((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(payload.competitionId);
                    return newSet;
                });
            }
        } catch (err) {
            console.error('[Disqualification] Failed to process message', err);
        }
    }, []);

    /**
     * Check if user is disqualified from a specific competition
     */
    const isDisqualifiedFrom = useCallback(
        (competitionId: number): boolean => {
            return disqualifiedCompetitions.has(competitionId);
        },
        [disqualifiedCompetitions],
    );

    /**
     * Add a competition to the disqualified set (for initial load from server)
     */
    const addDisqualifiedCompetition = useCallback((competitionId: number) => {
        setDisqualifiedCompetitions((prev) => {
            if (prev.has(competitionId)) return prev;
            return new Set([...prev, competitionId]);
        });
    }, []);

    /**
     * Clear disqualification state and redirect to competition page
     */
    const clearDisqualification = useCallback(() => {
        if (disqualification) {
            const competitionId = disqualification.competitionId;
            setIsModalOpen(false);
            setDisqualification(null);

            // Redirect to competition page after acknowledgment
            router.push(`/${locale}/competitions/${competitionId}`);
        }
    }, [disqualification, router, locale]);

    /**
     * Handle acknowledgment from modal
     */
    const handleAcknowledge = useCallback(() => {
        clearDisqualification();
    }, [clearDisqualification]);

    // Subscribe to WebSocket disqualification messages
    useEffect(() => {
        if (!isAuthenticated || !accessToken) {
            return;
        }

        return setDisqualificationCallback(handleDisqualificationMessage, accessToken);
    }, [isAuthenticated, accessToken, handleDisqualificationMessage]);

    // Context value
    const contextValue: DisqualificationContextValue = {
        disqualification,
        isModalOpen,
        isDisqualifiedFrom,
        clearDisqualification,
        addDisqualifiedCompetition,
    };

    return (
        <DisqualificationContext.Provider value={contextValue}>
            {children}

            {/* Render disqualification modal */}
            {disqualification && (
                <DisqualificationModal
                    open={isModalOpen}
                    competitionName={disqualification.competitionName}
                    reason={disqualification.reason}
                    timestamp={disqualification.timestamp}
                    onAcknowledge={handleAcknowledge}
                />
            )}
        </DisqualificationContext.Provider>
    );
}

export default DisqualificationNotificationProvider;
