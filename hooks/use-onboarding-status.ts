'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '@/lib/api';

/**
 * Backend API response for onboarding status
 * Matches OnboardingStatusResponse DTO from backend
 *
 * Requirements: 1.1, 1.4, 5.2
 */
export interface OnboardingStatusResponse {
    /** Whether the user is a participant in the competition */
    isParticipant: boolean;
    /** Whether the participant has completed anti-cheat onboarding */
    onboardingComplete: boolean;
    /** Whether the competition has anti-cheat enabled */
    antiCheatEnabled: boolean;
    /** The name of the competition */
    competitionName: string;
    /** The ID of the competition */
    competitionId: number;
}

/**
 * Return type for the useOnboardingStatus hook
 */
export interface UseOnboardingStatusResult {
    /** The onboarding status response from the API */
    status: OnboardingStatusResponse | null;
    /** Whether the status is currently being fetched */
    isLoading: boolean;
    /** Error message if the fetch failed */
    error: Error | null;
    /** Manually refresh the onboarding status */
    refetch: () => Promise<void>;
}

/**
 * Fetch onboarding status from the backend API
 *
 * Requirements: 1.1, 1.4, 5.1
 *
 * @param competitionId - The competition ID to check status for
 * @returns Promise<OnboardingStatusResponse> - The onboarding status
 */
export async function fetchOnboardingStatus(
    competitionId: number,
): Promise<OnboardingStatusResponse> {
    const response = await fetchApi(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/competitions/${competitionId}/onboarding-status`,
        {
            method: 'GET',
        },
    );

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Authentication required. Please log in again.');
        }
        if (response.status === 404) {
            throw new Error('Competition not found');
        }
        throw new Error(
            `Failed to fetch onboarding status: ${response.status} ${response.statusText}`,
        );
    }

    const data: OnboardingStatusResponse = await response.json();
    return data;
}

/**
 * Hook for fetching and managing onboarding status for a competition
 *
 * Features:
 * - Fetches onboarding status from backend API
 * - Handles authentication and error states
 * - Provides manual refresh capability
 * - Returns loading state for UI feedback
 *
 * Requirements: 1.1, 1.4
 *
 * @param competitionId - The competition ID to check status for
 * @param options - Configuration options
 * @param options.enabled - Whether to fetch status (default: true)
 * @returns Onboarding status and control functions
 */
export function useOnboardingStatus(
    competitionId: number,
    options: {
        enabled?: boolean;
    } = {},
): UseOnboardingStatusResult {
    const { enabled = true } = options;

    const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const performFetch = useCallback(async () => {
        if (!enabled) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchOnboardingStatus(competitionId);
            setStatus(data);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to fetch onboarding status'));
            setStatus(null);
        } finally {
            setIsLoading(false);
        }
    }, [competitionId, enabled]);

    // Fetch on mount and when competitionId changes
    useEffect(() => {
        performFetch();
    }, [performFetch]);

    // Manual refresh function
    const refetch = useCallback(async () => {
        await performFetch();
    }, [performFetch]);

    return {
        status,
        isLoading,
        error,
        refetch,
    };
}

/**
 * Pure function to determine if onboarding gate should be shown
 * Used for property-based testing
 *
 * Requirements: 1.2, 3.1, 4.2
 *
 * @param status - The onboarding status response
 * @returns true if the onboarding gate should be displayed
 */
export function shouldShowOnboardingGate(status: OnboardingStatusResponse | null): boolean {
    if (!status) {
        return false;
    }
    // Show gate if: participant + anti-cheat enabled + onboarding not complete
    return status.isParticipant && status.antiCheatEnabled && !status.onboardingComplete;
}

/**
 * Pure function to determine if join button should be hidden
 * Used for property-based testing
 *
 * Requirements: 1.3, 4.3
 *
 * @param status - The onboarding status response
 * @returns true if the join button should be hidden
 */
export function shouldHideJoinButton(status: OnboardingStatusResponse | null): boolean {
    if (!status) {
        return false;
    }
    // Hide join button if user is already a participant
    return status.isParticipant;
}

/**
 * Pure function to determine if problem access should be granted
 * Used for property-based testing
 *
 * Requirements: 2.4, 3.3, 4.5
 *
 * @param status - The onboarding status response
 * @returns true if problem access should be granted
 */
export function shouldGrantProblemAccess(status: OnboardingStatusResponse | null): boolean {
    if (!status) {
        return false;
    }
    // Grant access if:
    // - Not a participant (will be handled by join flow)
    // - OR participant with anti-cheat disabled
    // - OR participant with onboarding complete
    if (!status.isParticipant) {
        return false; // Not a participant, no access
    }
    if (!status.antiCheatEnabled) {
        return true; // Anti-cheat disabled, grant access
    }
    return status.onboardingComplete; // Anti-cheat enabled, check onboarding
}

/**
 * Pure function to validate onboarding status response structure
 * Used for property-based testing
 *
 * Requirements: 5.2
 *
 * @param response - The response to validate
 * @returns true if the response has all required fields with correct types
 */
export function isValidOnboardingStatusResponse(
    response: unknown,
): response is OnboardingStatusResponse {
    if (typeof response !== 'object' || response === null) {
        return false;
    }

    const obj = response as Record<string, unknown>;

    return (
        typeof obj.isParticipant === 'boolean' &&
        typeof obj.onboardingComplete === 'boolean' &&
        typeof obj.antiCheatEnabled === 'boolean' &&
        typeof obj.competitionName === 'string' &&
        (typeof obj.competitionId === 'number' || typeof obj.competitionId === 'bigint')
    );
}

/**
 * Pure function to determine the UI state based on onboarding status
 * Used for property-based testing
 *
 * @param status - The onboarding status response
 * @returns The UI state to display
 */
export type OnboardingUIState = 'loading' | 'error' | 'join' | 'onboarding-gate' | 'problems';

export function determineUIState(
    status: OnboardingStatusResponse | null,
    isLoading: boolean,
    error: Error | null,
): OnboardingUIState {
    if (isLoading) {
        return 'loading';
    }
    if (error) {
        return 'error';
    }
    if (!status) {
        return 'loading';
    }
    if (!status.isParticipant) {
        return 'join';
    }
    if (status.antiCheatEnabled && !status.onboardingComplete) {
        return 'onboarding-gate';
    }
    return 'problems';
}

export default useOnboardingStatus;
