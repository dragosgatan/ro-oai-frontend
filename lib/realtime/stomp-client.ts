'use client';

import { Client, IMessage } from '@stomp/stompjs';

type SubscriptionCallback = (message: IMessage) => void;

let client: Client | null = null;
let currentToken: string | null = null;

function buildWsUrl(): string {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL as string;
    const apiUrl = new URL(apiBase);
    const isSecure = apiUrl.protocol === 'https:';
    return `${isSecure ? 'wss' : 'ws'}://${apiUrl.host}/ws`;
}

let submissionsCallback: null | SubscriptionCallback = null;
let notificationsCallback: null | SubscriptionCallback = null;
let disqualificationCallback: null | SubscriptionCallback = null;
let antiCheatCallback: null | SubscriptionCallback = null;

function releaseClientIfIdle() {
    if (
        submissionsCallback !== null ||
        notificationsCallback !== null ||
        disqualificationCallback !== null ||
        antiCheatCallback !== null ||
        client === null
    ) {
        return;
    }

    const idleClient = client;
    client = null;
    currentToken = null;
    void idleClient.deactivate().catch((error) => {
        console.error('[WS] Failed to close idle connection', error);
    });
}

function getStompClient(token: string): Client {
    // Recreate client if token changed or missing
    if (!client || currentToken !== token) {
        // Deactivate previous client
        if (client) {
            void client.deactivate().catch((error) => {
                console.error('[WS] Failed to replace connection', error);
            });
        }

        const brokerURL = buildWsUrl();
        currentToken = token || null;

        client = new Client({
            brokerURL,
            reconnectDelay: 3000,
            connectHeaders: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
            onConnect: () => {
                const submissionsDestination = '/user/notifications/submissions';
                client?.subscribe(submissionsDestination, (message: IMessage) => {
                    try {
                        if (submissionsCallback !== null) {
                            submissionsCallback(message);
                        }
                    } catch (err) {
                        console.error('[WS] Failed to process message', err);
                    }
                });

                const notificationsDestination = '/user/notifications/notifications';
                client?.subscribe(notificationsDestination, (message: IMessage) => {
                    try {
                        const body = JSON.parse(message.body);
                        // Route disqualification messages to the disqualification callback
                        if (
                            body.type === 'DISQUALIFICATION' ||
                            body.type === 'DISQUALIFICATION_REVERSED'
                        ) {
                            if (disqualificationCallback !== null) {
                                disqualificationCallback(message);
                            }
                        } else if (notificationsCallback !== null) {
                            notificationsCallback(message);
                        }
                    } catch (err) {
                        console.error('[WS] Failed to process message', err);
                    }
                });

                // Subscribe to anti-cheat status updates
                const antiCheatDestination = '/user/notifications/anticheat';
                client?.subscribe(antiCheatDestination, (message: IMessage) => {
                    try {
                        if (antiCheatCallback !== null) {
                            antiCheatCallback(message);
                        }
                    } catch (err) {
                        console.error('[WS] Failed to process anti-cheat message', err);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('[WS] STOMP error', frame.headers['message'], frame.body);
            },
            onWebSocketClose: () => {},
            onWebSocketError: (ev) => {
                console.error('[WS] WebSocket error', ev);
            },
        });

        client.activate();
    }

    return client;
}

export function setSubmissionsCallback(callback: SubscriptionCallback, token: string) {
    getStompClient(token);
    submissionsCallback = callback;

    return () => {
        if (submissionsCallback === callback) {
            submissionsCallback = null;
            releaseClientIfIdle();
        }
    };
}

export function setNotificationsCallback(callback: SubscriptionCallback, token: string) {
    getStompClient(token);
    notificationsCallback = callback;

    return () => {
        if (notificationsCallback === callback) {
            notificationsCallback = null;
            releaseClientIfIdle();
        }
    };
}

export function setDisqualificationCallback(callback: SubscriptionCallback, token: string) {
    getStompClient(token);
    disqualificationCallback = callback;

    return () => {
        if (disqualificationCallback === callback) {
            disqualificationCallback = null;
            releaseClientIfIdle();
        }
    };
}

export function setAntiCheatCallback(callback: SubscriptionCallback, token: string) {
    getStompClient(token);
    antiCheatCallback = callback;

    return () => {
        if (antiCheatCallback === callback) {
            antiCheatCallback = null;
            releaseClientIfIdle();
        }
    };
}

export function clearAntiCheatCallback() {
    antiCheatCallback = null;
    releaseClientIfIdle();
}
