'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { fetchApi } from '@/lib/api';
import type { IMessage } from '@stomp/stompjs';
import { setAntiCheatCallback } from '@/lib/realtime/stomp-client';

/**
 * Anti-cheat session status from the backend
 */
export interface AntiCheatSessionStatus {
    status: 'ACTIVE' | 'MONITORING_INTERRUPTED' | 'REVOKED' | 'EXPIRED' | 'FINISHED' | null;
    sessionType: 'PRE_JOIN' | 'ACTIVE' | null;
    antiCheatRequired: boolean;
    lastHeartbeat: string | null;
    expiresAt: string | null;
}

/**
 * WebSocket payload for anti-cheat status changes
 */
interface AntiCheatStatusPayload {
    competitionId: number;
    status: 'ACTIVE' | 'MONITORING_INTERRUPTED' | 'REVOKED' | 'EXPIRED';
    sessionType: 'PRE_JOIN' | 'ACTIVE';
    lastHeartbeat: string | null;
    expiresAt: string | null;
}

/**
 * Context value for anti-cheat connection state
 */
export interface AntiCheatConnectionContextValue {
    /** Current session status */
    sessionStatus: AntiCheatSessionStatus | null;
    /** Whether the companion app is connected and actively monitoring */
    isConnected: boolean;
    /** Whether the connection is interrupted (may recover) */
    isInterrupted: boolean;
    /** Whether anti-cheat is required for the current competition */
    isRequired: boolean;
    /** Whether we're currently checking the connection status */
    isLoading: boolean;
    /** Whether the user has finished the competition */
    isFinished: boolean;
    /** Error message if status check failed */
    error: string | null;
    /** Manually refresh the connection status */
    refresh: () => Promise<void>;
    /** Time since last heartbeat in seconds (null if no heartbeat) */
    secondsSinceHeartbeat: number | null;
}

const AntiCheatConnectionContext = createContext<AntiCheatConnectionContextValue | null>(null);

/**
 * Hook to access anti-cheat connection state
 */
export function useAntiCheatConnection() {
    const context = useContext(AntiCheatConnectionContext);
    if (!context) {
        throw new Error('useAntiCheatConnection must be used within AntiCheatConnectionProvider');
    }
    return context;
}

/**
 * Hook to safely access anti-cheat connection state (returns null if not in provider)
 */
export function useAntiCheatConnectionSafe() {
    return useContext(AntiCheatConnectionContext);
}

interface AntiCheatConnectionProviderProps {
    /** Competition ID to monitor */
    competitionId: number;
    /** Children to render */
    children: React.ReactNode;
}

/**
 * Provider component that monitors anti-cheat session status via WebSocket.
 * Falls back to initial HTTP fetch for the current status, then listens for
 * real-time updates via WebSocket.
 */
export function AntiCheatConnectionProvider({
    competitionId,
    children,
}: AntiCheatConnectionProviderProps) {
    const { data: session, status: authStatus } = useSession();
    const [sessionStatus, setSessionStatus] = useState<AntiCheatSessionStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [secondsSinceHeartbeat, setSecondsSinceHeartbeat] = useState<number | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch initial status via HTTP
    const fetchStatus = useCallback(async () => {
        if (authStatus !== 'authenticated') {
            setSessionStatus(null);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetchApi(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/competitions/${competitionId}/anticheat-status`,
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch anti-cheat status: ${response.status}`);
            }

            const data: AntiCheatSessionStatus = await response.json();
            setSessionStatus(data);
            setError(null);

            // Calculate seconds since last heartbeat
            if (data.lastHeartbeat) {
                const lastHeartbeat = new Date(data.lastHeartbeat);
                const now = new Date();
                setSecondsSinceHeartbeat(
                    Math.floor((now.getTime() - lastHeartbeat.getTime()) / 1000),
                );
            } else {
                setSecondsSinceHeartbeat(null);
            }
        } catch (err) {
            console.error('Failed to fetch anti-cheat status:', err);
            setError(err instanceof Error ? err.message : 'Failed to check connection status');
        } finally {
            setIsLoading(false);
        }
    }, [competitionId, authStatus]);

    // Handle WebSocket messages for anti-cheat status updates
    const handleWebSocketMessage = useCallback(
        (message: IMessage) => {
            try {
                const body = JSON.parse(message.body);
                const payload: AntiCheatStatusPayload = body.payload;

                // Only process messages for this competition
                if (payload.competitionId !== competitionId) {
                    return;
                }

                if (
                    body.type === 'ANTICHEAT_HEARTBEAT_RESPONSE' ||
                    body.type === 'ANTICHEAT_STATUS_CHANGED'
                ) {
                    // Update session status from WebSocket payload
                    setSessionStatus((prev) => ({
                        status: payload.status,
                        antiCheatRequired: prev?.antiCheatRequired ?? true,
                        lastHeartbeat: payload.lastHeartbeat,
                        expiresAt: payload.expiresAt,
                        sessionType: payload.sessionType,
                    }));

                    // Update seconds since heartbeat
                    if (payload.lastHeartbeat) {
                        console.log('got hearthbeat update:', payload);
                        const lastHeartbeat = new Date(payload.lastHeartbeat);
                        const now = new Date();
                        setSecondsSinceHeartbeat(
                            Math.floor((now.getTime() - lastHeartbeat.getTime()) / 1000),
                        );
                    }

                    setError(null);
                }
            } catch (err) {
                console.error('Failed to process anti-cheat WebSocket message:', err);
            }
        },
        [competitionId],
    );

    // Initial fetch
    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Set up WebSocket subscription
    useEffect(() => {
        if (authStatus !== 'authenticated') return;

        const token = (session as any)?.accessToken as string | undefined;
        if (!token) return;

        // Register callback for anti-cheat messages and remove it when this scope changes.
        return setAntiCheatCallback(handleWebSocketMessage, token);
    }, [authStatus, session, handleWebSocketMessage]);

    // Set up heartbeat counter (updates every second)
    useEffect(() => {
        heartbeatIntervalRef.current = setInterval(() => {
            setSecondsSinceHeartbeat((prev) => (prev !== null ? prev + 1 : null));
        }, 1000);

        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
        };
    }, []);

    // Derived state
    const isConnected = sessionStatus?.status === 'ACTIVE';
    const isFinished = sessionStatus?.status === 'FINISHED';
    const isInterrupted = sessionStatus?.status === 'MONITORING_INTERRUPTED';
    const isRequired = sessionStatus?.antiCheatRequired ?? false;

    const value: AntiCheatConnectionContextValue = {
        sessionStatus,
        isConnected,
        isInterrupted,
        isFinished,
        isRequired,
        isLoading,
        error,
        refresh: fetchStatus,
        secondsSinceHeartbeat,
    };

    return (
        <AntiCheatConnectionContext.Provider value={value}>
            {children}
        </AntiCheatConnectionContext.Provider>
    );
}

export default AntiCheatConnectionProvider;
